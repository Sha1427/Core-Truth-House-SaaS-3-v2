from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from repositories.content_pack_repository import content_pack_repository
from repositories.workflow_repository import workflow_repository


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ContentPackService:
    async def handle_make_callback(self, payload: dict[str, Any]) -> dict[str, Any]:
        run = await workflow_repository.get_run(payload["workflow_run_id"])
        if not run:
            raise ValueError("Run not found.")

        if payload["status"] == "completed":
            result = payload.get("result") or {}

            pack = await content_pack_repository.create_content_pack(
                {
                    "workspace_id": payload["workspace_id"],
                    "workflow_run_id": payload["workflow_run_id"],
                    "status": "pending_review",
                    "assets": result,
                    "source_links": result.get("source_links", []),
                }
            )

            await workflow_repository.update_run(
                run["id"],
                {
                    "status": "completed",
                    "completed_at": utcnow(),
                    "result_summary": {
                        "asset_keys": list(result.keys()),
                    },
                },
            )
            return {"ok": True, "content_pack_id": pack["id"]}

        await workflow_repository.update_run(
            run["id"],
            {
                "status": "failed",
                "completed_at": utcnow(),
                "error_message": payload.get("error_message") or "Unknown workflow failure",
            },
        )
        return {"ok": True}

    async def approve_assets(
        self,
        pack: dict[str, Any],
        asset_keys: list[str],
        note: str | None,
    ) -> dict[str, Any] | None:
        approved = sorted(set(pack.get("approved_assets", []) + asset_keys))
        review_notes = pack.get("review_notes", [])

        if note:
            review_notes.append(
                {
                    "type": "approve",
                    "note": note,
                    "asset_keys": asset_keys,
                    "created_at": utcnow(),
                }
            )

        status = "approved"
        all_assets = set((pack.get("assets") or {}).keys())
        if approved and all_assets and set(approved) != all_assets:
            status = "partially_approved"

        return await content_pack_repository.update_content_pack(
            pack["id"],
            {
                "approved_assets": approved,
                "review_notes": review_notes,
                "status": status,
            },
        )

    async def reject_assets(
        self,
        pack: dict[str, Any],
        asset_keys: list[str],
        note: str | None,
    ) -> dict[str, Any] | None:
        rejected = sorted(set(pack.get("rejected_assets", []) + asset_keys))
        review_notes = pack.get("review_notes", [])

        if note:
            review_notes.append(
                {
                    "type": "reject",
                    "note": note,
                    "asset_keys": asset_keys,
                    "created_at": utcnow(),
                }
            )

        return await content_pack_repository.update_content_pack(
            pack["id"],
            {
                "rejected_assets": rejected,
                "review_notes": review_notes,
                "status": "rejected",
            },
        )

    async def request_revision(
        self,
        pack: dict[str, Any],
        asset_keys: list[str],
        note: str | None,
    ) -> dict[str, Any] | None:
        review_notes = pack.get("review_notes", [])
        review_notes.append(
            {
                "type": "revision_requested",
                "note": note or "",
                "asset_keys": asset_keys,
                "created_at": utcnow(),
            }
        )

        return await content_pack_repository.update_content_pack(
            pack["id"],
            {
                "review_notes": review_notes,
                "status": "revision_requested",
            },
        )


content_pack_service = ContentPackService()
