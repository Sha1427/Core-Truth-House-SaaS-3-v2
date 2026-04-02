from __future__ import annotations

from fastapi import HTTPException


class EntitlementsService:
    @staticmethod
    def require_agentic_workflows(workspace: dict) -> None:
        if workspace.get("subscription_status") not in {"active", "trialing"}:
            raise HTTPException(status_code=403, detail="Active subscription required.")

        entitlements = workspace.get("entitlements", {}) or {}
        if not entitlements.get("agentic_workflows", False):
            raise HTTPException(
                status_code=403,
                detail="Agentic Workflows is available on the highest plan only.",
            )

    @staticmethod
    def get_run_limit(workspace: dict) -> int:
        limits = workspace.get("limits", {}) or {}
        return int(limits.get("agentic_workflow_monthly_runs", 0))


entitlements_service = EntitlementsService()

