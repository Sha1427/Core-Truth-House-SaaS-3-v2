"""
Migration: Assign workspace_id to orphan records
Core Truth House OS

Run:
    python migrations/migrate_workspace_ids.py

Optional dry run:
    DRY_RUN=true python migrations/migrate_workspace_ids.py
"""

from __future__ import annotations

import asyncio
import os
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent.parent / ".env")

COLLECTIONS_TO_MIGRATE = [
    "brand_memory",
    "brand_foundation",
    "strategic_os_steps",
    "brand_audits",
    "campaigns",
    "documents",
    "media_assets",
    "content_assets",
    "onboarding_progress",
    "os_workflow_steps",
    "os_workflows",
]

DRY_RUN = os.getenv("DRY_RUN", "false").lower() == "true"


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_iso() -> str:
    return now_utc().isoformat()


ORPHAN_QUERY = {
    "$or": [
        {"workspace_id": None},
        {"workspace_id": ""},
        {"workspace_id": {"$exists": False}},
    ]
}


async def build_user_workspace_map(db) -> dict[str, str]:
    """
    Build a user_id -> workspace_id map.

    Priority:
    1. workspaces.owner_id
    2. workspace_members.user_id
    """
    user_to_workspace: dict[str, str] = {}

    print("  Building owner-based mappings...")
    async for ws in db.workspaces.find(
        {},
        {"_id": 0, "id": 1, "workspace_id": 1, "owner_id": 1, "name": 1},
    ):
        workspace_id = ws.get("workspace_id") or ws.get("id")
        owner_id = ws.get("owner_id")

        if owner_id and workspace_id:
            user_to_workspace[owner_id] = workspace_id
            print(f"    owner {owner_id} -> {workspace_id} ({ws.get('name', 'Unnamed Workspace')})")

    print("  Building membership-based mappings...")
    async for member in db.workspace_members.find(
        {},
        {"_id": 0, "workspace_id": 1, "user_id": 1, "status": 1},
    ):
        workspace_id = member.get("workspace_id")
        user_id = member.get("user_id")
        status = member.get("status")

        if workspace_id and user_id and status == "active" and user_id not in user_to_workspace:
            user_to_workspace[user_id] = workspace_id
            print(f"    member {user_id} -> {workspace_id}")

    return user_to_workspace


async def get_safe_default_workspace(db) -> str | None:
    """
    Return a safe fallback workspace for 'default' only if explicitly found.
    """
    default_ws = await db.workspaces.find_one(
        {
            "$or": [
                {"owner_id": "default"},
                {"name": {"$regex": "^default$", "$options": "i"}},
            ]
        },
        {"_id": 0, "id": 1, "workspace_id": 1},
    )

    if default_ws:
        return default_ws.get("workspace_id") or default_ws.get("id")

    return None


async def migrate_collection(
    db,
    coll_name: str,
    user_to_workspace: dict[str, str],
    default_workspace_id: str | None = None,
) -> dict[str, Any]:
    coll = db[coll_name]

    total_found = 0
    migrated = 0
    skipped = 0
    skipped_reasons = defaultdict(int)

    async for doc in coll.find(ORPHAN_QUERY):
        total_found += 1
        user_id = doc.get("user_id")
        workspace_id = None

        if user_id:
            workspace_id = user_to_workspace.get(user_id)

        if not workspace_id and user_id == "default":
            workspace_id = default_workspace_id

        if not workspace_id:
            skipped += 1
            reason = "no_workspace_mapping"
            if not user_id:
                reason = "missing_user_id"
            skipped_reasons[reason] += 1
            print(
                f"    SKIP {coll_name}: _id={doc.get('_id')} "
                f"user_id={user_id!r} reason={reason}"
            )
            continue

        update_payload = {
            "workspace_id": workspace_id,
            "migration_workspace_id_backfill_at": now_utc(),
        }

        if DRY_RUN:
            print(
                f"    DRY RUN {coll_name}: _id={doc.get('_id')} "
                f"user_id={user_id!r} -> workspace_id={workspace_id}"
            )
            migrated += 1
            continue

        result = await coll.update_one(
            {"_id": doc["_id"]},
            {"$set": update_payload},
        )

        if result.modified_count == 1:
            migrated += 1

    return {
        "collection": coll_name,
        "found": total_found,
        "migrated": migrated,
        "skipped": skipped,
        "skipped_reasons": dict(skipped_reasons),
    }


async def verify_remaining_orphans(db) -> tuple[dict[str, int], int]:
    remaining: dict[str, int] = {}
    total = 0

    for coll_name in COLLECTIONS_TO_MIGRATE:
        count = await db[coll_name].count_documents(ORPHAN_QUERY)
        if count > 0:
            remaining[coll_name] = count
            total += count

    return remaining, total


async def run_migration():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")

    if not mongo_url:
        raise RuntimeError("MONGO_URL is not set")
    if not db_name:
        raise RuntimeError("DB_NAME is not set")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    try:
        existing_collections = set(await db.list_collection_names())

        print("=" * 70)
        print("WORKSPACE ID MIGRATION")
        print(f"Started: {now_iso()}")
        print(f"Mode: {'DRY RUN' if DRY_RUN else 'LIVE'}")
        print("=" * 70)

        print("\n[1/3] Building user -> workspace mapping...")
        user_to_workspace = await build_user_workspace_map(db)
        default_workspace_id = await get_safe_default_workspace(db)

        if default_workspace_id:
            print(f"  default -> {default_workspace_id} (safe fallback)")
        else:
            print("  No explicit default workspace found")

        print(f"\nFound {len(user_to_workspace)} user->workspace mappings")

        print("\n[2/3] Migrating collections...")
        total_migrated = 0
        total_skipped = 0

        for coll_name in COLLECTIONS_TO_MIGRATE:
            if coll_name not in existing_collections:
                print(f"  SKIP COLLECTION {coll_name}: collection does not exist")
                continue

            stats = await migrate_collection(
                db,
                coll_name,
                user_to_workspace,
                default_workspace_id=default_workspace_id,
            )

            if stats["found"] > 0:
                print(
                    f"  {stats['collection']}: found={stats['found']} "
                    f"migrated={stats['migrated']} skipped={stats['skipped']}"
                )
                if stats["skipped_reasons"]:
                    print(f"    skipped reasons: {stats['skipped_reasons']}")

            total_migrated += stats["migrated"]
            total_skipped += stats["skipped"]

        print("\n[3/3] Verifying migration...")
        remaining_by_collection, remaining_total = await verify_remaining_orphans(db)

        if remaining_by_collection:
            for coll_name, count in remaining_by_collection.items():
                print(f"  WARNING: {coll_name} still has {count} orphan records")
        else:
            print("  No orphan records remain")

        print("\n" + "=" * 70)
        print("MIGRATION COMPLETE")
        print(f"Total migrated: {total_migrated}")
        print(f"Total skipped: {total_skipped}")
        print(f"Remaining orphans: {remaining_total}")
        print(f"Finished: {now_iso()}")
        print("=" * 70)

    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(run_migration())
