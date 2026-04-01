"""
workspace_db.py
Core Truth House OS — MongoDB Workspace Schema + Index Initialization

Purpose
-------
This module centralizes:
1. Workspace-scoped collection index creation
2. Workspace bootstrap / clean-slate creation
3. Plan-derived credit, entitlement, and usage defaults
4. Safe helper utilities for tenant-aware inserts and owner backfills

Usage
-----
At app startup:
    from workspace_db import init_workspace_db
    await init_workspace_db(db)

When creating a new tenant workspace:
    from workspace_db import create_workspace_clean_slate
    await create_workspace_clean_slate(
        db=db,
        workspace_id="ws_123",
        name="My Brand",
        owner_user_id="user_123",
        owner_email="owner@example.com",
        plan="structure",
    )
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from pymongo import ASCENDING, DESCENDING


# ============================================================================
# COLLECTION CONFIG
# ============================================================================

WORKSPACE_SCOPED_COLLECTIONS: dict[str, list[tuple[str, int]]] = {
    # Core brand data
    "brand_memory": [("workspace_id", ASCENDING), ("updated_at", DESCENDING)],
    "brand_foundation": [("workspace_id", ASCENDING), ("updated_at", DESCENDING)],
    "strategic_os_steps": [("workspace_id", ASCENDING), ("step_number", ASCENDING)],
    "brand_audits": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
    "onboarding_progress": [("workspace_id", ASCENDING), ("updated_at", DESCENDING)],

    # Campaign + content
    "campaigns": [("workspace_id", ASCENDING), ("status", ASCENDING), ("created_at", DESCENDING)],
    "content_items": [("workspace_id", ASCENDING), ("campaign_id", ASCENDING), ("created_at", DESCENDING)],
    "content_assets": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
    "media_assets": [("workspace_id", ASCENDING), ("context", ASCENDING), ("created_at", DESCENDING)],
    "prompt_library": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
    "generation_history": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],

    # Blog / publishing
    "blog_articles": [("workspace_id", ASCENDING), ("status", ASCENDING), ("created_at", DESCENDING)],
    "blog_categories": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
    "blog_posts": [("workspace_id", ASCENDING), ("status", ASCENDING), ("created_at", DESCENDING)],

    # Distribution
    "calendar_items": [("workspace_id", ASCENDING), ("scheduled_date", ASCENDING)],
    "social_accounts": [("workspace_id", ASCENDING), ("platform", ASCENDING)],

    # Business tools
    "contacts": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
    "crm_contacts": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
    "pipeline_deals": [("workspace_id", ASCENDING), ("stage", ASCENDING)],
    "offers": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
    "systems": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
    "launches": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
    "documents": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],

    # Identity
    "identity": [("workspace_id", ASCENDING), ("updated_at", DESCENDING)],
    "identity_colors": [("workspace_id", ASCENDING), ("updated_at", DESCENDING)],
    "identity_typography": [("workspace_id", ASCENDING), ("updated_at", DESCENDING)],
    "identity_assets": [("workspace_id", ASCENDING), ("asset_type", ASCENDING), ("created_at", DESCENDING)],

    # AI + billing + usage
    "credit_transactions": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
    "ai_usage": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],

    # Agentic workflows
    "workflow_configs": [("workspace_id", ASCENDING), ("workflow_type", ASCENDING)],
    "workflow_runs": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
    "content_packs": [("workspace_id", ASCENDING), ("created_at", DESCENDING)],
}

USER_SCOPED_COLLECTIONS = {
    "brand_memory",
    "brand_foundation",
    "brand_audits",
    "campaigns",
    "content_items",
    "content_assets",
    "media_assets",
    "offers",
    "systems",
    "launches",
    "documents",
    "contacts",
    "crm_contacts",
    "generation_history",
    "credit_transactions",
    "ai_usage",
    "blog_articles",
    "blog_categories",
    "onboarding_progress",
}

TTL_COLLECTIONS: dict[str, int] = {
    "generation_history": 60 * 60 * 24 * 90,
    "ai_usage": 60 * 60 * 24 * 90,
}


# ============================================================================
# HELPERS
# ============================================================================

def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def enforce_workspace(doc: Dict[str, Any], workspace_id: str) -> Dict[str, Any]:
    if not workspace_id:
        raise ValueError("workspace_id is required")
    doc["workspace_id"] = workspace_id
    return doc


def _normalize_plan(plan: str) -> str:
    return (plan or "").strip().lower()


def _plan_credit_config(plan: str) -> dict[str, Any]:
    normalized = _normalize_plan(plan)
    return {
        "free": {"limit": 0, "unlimited": False},
        "audit": {"limit": 0, "unlimited": False},
        "foundation": {"limit": 75, "unlimited": False},
        "structure": {"limit": 150, "unlimited": False},
        "house": {"limit": 400, "unlimited": False},
        "estate": {"limit": None, "unlimited": True},
        "legacy": {"limit": None, "unlimited": True},
        # Optional newer premium naming
        "starter": {"limit": 75, "unlimited": False},
        "pro": {"limit": 150, "unlimited": False},
        "signature": {"limit": 400, "unlimited": False},
    }.get(normalized, {"limit": 0, "unlimited": False})


def _legacy_plan_credit_cap(plan: str) -> int:
    config = _plan_credit_config(plan)
    return -1 if config["unlimited"] else int(config["limit"] or 0)


def _plan_entitlements(plan: str) -> dict[str, bool]:
    normalized = _normalize_plan(plan)

    highest_tier_plans = {"estate", "legacy", "signature"}

    return {
        "agentic_workflows": normalized in highest_tier_plans,
    }


def _plan_limits(plan: str) -> dict[str, Any]:
    normalized = _normalize_plan(plan)

    if normalized in {"estate", "legacy", "signature"}:
        return {
            "agentic_workflow_monthly_runs": 30,
            "agentic_workflow_outputs_per_run": 5,
            "agentic_workflow_schedule_enabled": True,
        }

    return {
        "agentic_workflow_monthly_runs": 0,
        "agentic_workflow_outputs_per_run": 0,
        "agentic_workflow_schedule_enabled": False,
    }


def build_workspace_plan_state(plan: str) -> dict[str, Any]:
    credit_cfg = _plan_credit_config(plan)

    return {
        "plan": _normalize_plan(plan),
        "credits": 0,
        "credits_cap": _legacy_plan_credit_cap(plan),
        "credit_limit": credit_cfg["limit"],
        "credit_unlimited": credit_cfg["unlimited"],
        "entitlements": _plan_entitlements(plan),
        "limits": _plan_limits(plan),
    }


# ============================================================================
# INDEX INITIALIZATION
# ============================================================================

async def _safe_create_index(collection, keys, **kwargs) -> None:
    try:
        await collection.create_index(keys, **kwargs)
    except Exception:
        pass


async def init_workspace_db(db) -> None:
    """
    Create indexes needed for tenant isolation, performance, retention,
    and premium workflow features. Safe to run multiple times.
    """
    print("[DB] Initializing workspace indexes...")

    for collection_name, primary_index in WORKSPACE_SCOPED_COLLECTIONS.items():
        coll = db[collection_name]

        await _safe_create_index(
            coll,
            primary_index,
            name=f"{collection_name}_workspace_scope_idx",
            background=True,
        )

        await _safe_create_index(
            coll,
            [("workspace_id", ASCENDING)],
            name=f"{collection_name}_workspace_id_idx",
            background=True,
        )

        if collection_name in USER_SCOPED_COLLECTIONS:
            await _safe_create_index(
                coll,
                [("workspace_id", ASCENDING), ("user_id", ASCENDING)],
                name=f"{collection_name}_workspace_user_idx",
                background=True,
            )

        if collection_name in TTL_COLLECTIONS:
            await _safe_create_index(
                coll,
                [("created_at", ASCENDING)],
                name=f"{collection_name}_ttl_idx",
                expireAfterSeconds=TTL_COLLECTIONS[collection_name],
                background=True,
            )

        print(f"  [OK] {collection_name}")

    # Users
    await _safe_create_index(
        db.users,
        [("email", ASCENDING)],
        unique=True,
        name="users_email_unique_idx",
        background=True,
    )

    await _safe_create_index(
        db.users,
        [("id", ASCENDING)],
        unique=True,
        name="users_id_unique_idx",
        background=True,
    )

    # Workspaces
    await _safe_create_index(
        db.workspaces,
        [("workspace_id", ASCENDING)],
        unique=True,
        name="workspaces_workspace_id_unique_idx",
        background=True,
    )

    await _safe_create_index(
        db.workspaces,
        [("owner_id", ASCENDING)],
        name="workspaces_owner_id_idx",
        background=True,
    )

    await _safe_create_index(
        db.workspaces,
        [("plan", ASCENDING), ("status", ASCENDING)],
        name="workspaces_plan_status_idx",
        background=True,
    )

    await _safe_create_index(
        db.workspaces,
        [("subscription_status", ASCENDING)],
        name="workspaces_subscription_status_idx",
        background=True,
    )

    # Membership
    await _safe_create_index(
        db.workspace_members,
        [("workspace_id", ASCENDING), ("user_id", ASCENDING)],
        unique=True,
        name="workspace_members_membership_unique_idx",
        background=True,
    )

    await _safe_create_index(
        db.workspace_members,
        [("workspace_id", ASCENDING), ("role", ASCENDING)],
        name="workspace_members_role_idx",
        background=True,
    )

    # Team members
    await _safe_create_index(
        db.team_members,
        [("id", ASCENDING)],
        unique=True,
        name="team_members_id_unique_idx",
        background=True,
    )

    await _safe_create_index(
        db.team_members,
        [("workspace_id", ASCENDING), ("email", ASCENDING)],
        unique=True,
        partialFilterExpression={"email": {"$type": "string", "$ne": ""}},
        name="team_members_workspace_email_unique_idx",
        background=True,
    )

    await _safe_create_index(
        db.team_members,
        [("invite_token", ASCENDING)],
        sparse=True,
        name="team_members_invite_token_idx",
        background=True,
    )

    # Credits
    await _safe_create_index(
        db.credit_transactions,
        [("workspace_id", ASCENDING), ("type", ASCENDING)],
        name="credit_transactions_workspace_type_idx",
        background=True,
    )

    # Workflow-specific indexes
    await _safe_create_index(
        db.workflow_configs,
        [("workspace_id", ASCENDING), ("workflow_type", ASCENDING)],
        unique=True,
        name="workflow_configs_workspace_type_unique_idx",
        background=True,
    )

    await _safe_create_index(
        db.workflow_runs,
        [("workspace_id", ASCENDING), ("workflow_type", ASCENDING), ("status", ASCENDING)],
        name="workflow_runs_workspace_type_status_idx",
        background=True,
    )

    await _safe_create_index(
        db.workflow_runs,
        [("id", ASCENDING)],
        unique=True,
        name="workflow_runs_id_unique_idx",
        background=True,
    )

    await _safe_create_index(
        db.content_packs,
        [("id", ASCENDING)],
        unique=True,
        name="content_packs_id_unique_idx",
        background=True,
    )

    await _safe_create_index(
        db.content_packs,
        [("workflow_run_id", ASCENDING)],
        unique=True,
        name="content_packs_workflow_run_unique_idx",
        background=True,
    )

    print("[DB] Workspace indexes ready.")


# ============================================================================
# WORKSPACE LIFECYCLE
# ============================================================================

async def create_workspace_clean_slate(
    db,
    workspace_id: str,
    name: str,
    owner_user_id: str,
    owner_email: str,
    plan: str = "audit",
) -> str:
    """
    Create a new workspace with a clean operational slate.
    This is the correct place to seed plan-derived entitlements and limits.
    """
    if not workspace_id:
        raise ValueError("workspace_id is required")
    if not owner_user_id:
        raise ValueError("owner_user_id is required")
    if not owner_email:
        raise ValueError("owner_email is required")

    now = utcnow()
    plan_state = build_workspace_plan_state(plan)

    # 1. Workspace
    await db.workspaces.update_one(
        {"workspace_id": workspace_id},
        {
            "$set": {
                "workspace_id": workspace_id,
                "id": workspace_id,
                "name": name,
                "owner_id": owner_user_id,
                "owner_email": owner_email,
                **plan_state,
                "status": "active",
                "subscription_status": "active",
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    # 2. Workspace membership
    await db.workspace_members.update_one(
        {"workspace_id": workspace_id, "user_id": owner_user_id},
        {
            "$set": {
                "workspace_id": workspace_id,
                "user_id": owner_user_id,
                "email": owner_email,
                "role": "owner",
                "status": "active",
                "updated_at": now,
            },
            "$setOnInsert": {
                "joined_at": now,
                "created_at": now,
            },
        },
        upsert=True,
    )

    # 3. Team member owner seed
    await db.team_members.update_one(
        {"workspace_id": workspace_id, "email": owner_email},
        {
            "$set": {
                "workspace_id": workspace_id,
                "user_id": owner_user_id,
                "email": owner_email,
                "name": name or "Workspace Owner",
                "role": "owner",
                "status": "active",
                "invite_token": None,
                "updated_at": now,
            },
            "$setOnInsert": {
                "id": f"owner_{workspace_id}",
                "invited_by": "",
                "created_at": now,
            },
        },
        upsert=True,
    )

    # 4. Brand Memory stub
    await db.brand_memory.update_one(
        {"workspace_id": workspace_id},
        {
            "$set": {
                "workspace_id": workspace_id,
                "user_id": owner_user_id,
                "brand_name": name,
                "tagline": "",
                "mission": "",
                "vision": "",
                "values": [],
                "voice": "",
                "positioning": "",
                "target_audience": "",
                "core_offer": "",
                "transformation": "",
                "colors": [],
                "competitors": [],
                "completion_pct": 0,
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    # 5. Brand Foundation stub
    await db.brand_foundation.update_one(
        {"workspace_id": workspace_id},
        {
            "$set": {
                "workspace_id": workspace_id,
                "user_id": owner_user_id,
                "mission": "",
                "vision": "",
                "values": [],
                "tagline": "",
                "positioning": "",
                "story": "",
                "tone_of_voice": "",
                "target_audience": "",
                "is_complete": False,
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    # 6. Onboarding progress stub
    await db.onboarding_progress.update_one(
        {"workspace_id": workspace_id},
        {
            "$set": {
                "workspace_id": workspace_id,
                "user_id": owner_user_id,
                "current_step": 1,
                "milestones": [],
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    # 7. Usage seed
    await db.ai_usage.update_one(
        {"workspace_id": workspace_id, "user_id": owner_user_id},
        {
            "$set": {
                "workspace_id": workspace_id,
                "user_id": owner_user_id,
                "tokens_used": 0,
                "generations": 0,
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    # 8. Initial credit transaction
    await db.credit_transactions.update_one(
        {"workspace_id": workspace_id, "type": "init"},
        {
            "$set": {
                "workspace_id": workspace_id,
                "user_id": owner_user_id,
                "type": "init",
                "amount": 0,
                "balance": 0,
                "plan": _normalize_plan(plan),
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now,
            },
        },
        upsert=True,
    )

    return workspace_id


async def sync_workspace_plan_state(
    db,
    workspace_id: str,
    plan: str,
    subscription_status: str = "active",
) -> None:
    """
    Use this after a Stripe subscription change to refresh plan, entitlements,
    and workflow limits without rebuilding the workspace.
    """
    if not workspace_id:
        raise ValueError("workspace_id is required")

    now = utcnow()
    plan_state = build_workspace_plan_state(plan)

    await db.workspaces.update_one(
        {"workspace_id": workspace_id},
        {
            "$set": {
                **plan_state,
                "subscription_status": subscription_status,
                "updated_at": now,
            }
        },
    )


# ============================================================================
# OPTIONAL HELPERS
# ============================================================================

async def backfill_workspace_id(
    db,
    collection_name: str,
    workspace_id: str,
    match_filter: Optional[dict[str, Any]] = None,
) -> int:
    """
    Backfill workspace_id into older records that are missing, null, or blank.
    """
    if not workspace_id:
        raise ValueError("workspace_id is required")

    match_filter = dict(match_filter or {})

    orphan_filter = [
        {"workspace_id": {"$exists": False}},
        {"workspace_id": None},
        {"workspace_id": ""},
    ]

    if "$or" in match_filter:
        match_filter["$and"] = [
            {"$or": match_filter.pop("$or")},
            {"$or": orphan_filter},
        ]
    else:
        match_filter["$or"] = orphan_filter

    result = await db[collection_name].update_many(
        match_filter,
        {"$set": {"workspace_id": workspace_id, "updated_at": utcnow()}},
    )
    return int(result.modified_count)


async def ensure_owner_member(
    db,
    workspace_id: str,
    owner_id: str,
    owner_email: str = "",
    owner_name: str = "Workspace Owner",
) -> None:
    """
    Ensure a workspace has an owner row in both workspace_members and team_members.
    Safe to call repeatedly.
    """
    now = utcnow()

    await db.workspace_members.update_one(
        {"workspace_id": workspace_id, "user_id": owner_id},
        {
            "$set": {
                "workspace_id": workspace_id,
                "user_id": owner_id,
                "email": owner_email,
                "role": "owner",
                "status": "active",
                "updated_at": now,
            },
            "$setOnInsert": {
                "joined_at": now,
                "created_at": now,
            },
        },
        upsert=True,
    )

    if owner_email:
        await db.team_members.update_one(
            {"workspace_id": workspace_id, "email": owner_email},
            {
                "$set": {
                    "workspace_id": workspace_id,
                    "user_id": owner_id,
                    "email": owner_email,
                    "name": owner_name,
                    "role": "owner",
                    "status": "active",
                    "invite_token": None,
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "id": f"owner_{workspace_id}",
                    "invited_by": "",
                    "created_at": now,
                },
            },
            upsert=True,
        )
