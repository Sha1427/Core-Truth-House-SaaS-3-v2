from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from backend.models.workflow import (
    MakeCallbackPayload,
    TriggerWorkflowResponse,
    WorkflowConfigCreateUpdate,
    WorkflowConfigRecord,
    WorkflowRunRecord,
)
from backend.services.make_client import make_client
from repositories.workflow_repository import workflow_repository


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class WorkflowService:
    async def ensure_indexes(self) -> None:
        await workflow_repository.ensure_indexes()

    async def upsert_config(
        self,
        workspace_id: str,
        payload: WorkflowConfigCreateUpdate,
        workflow_type: str | None = None,
    ) -> WorkflowConfigRecord:
        data = payload.model_dump(exclude_unset=True)

        if workflow_type:
            data["workflow_type"] = workflow_type

        record = await workflow_repository.upsert_config(workspace_id, data)
        return WorkflowConfigRecord(**record)

    async def get_config(
        self,
        workspace_id: str,
        workflow_type: str,
    ) -> WorkflowConfigRecord | None:
        record = await workflow_repository.get_config(workspace_id, workflow_type)
        return WorkflowConfigRecord(**record) if record else None

    async def delete_config(
        self,
        workspace_id: str,
        workflow_type: str,
    ) -> int:
        return await workflow_repository.delete_config(workspace_id, workflow_type)

    async def trigger_run(
        self,
        workspace: dict[str, Any],
        config: dict[str, Any],
        trigger_mode: str,
        requested_by_user_id: str | None = None,
    ) -> dict[str, Any]:
        workspace_id = workspace.get("workspace_id") or workspace.get("id")
        workflow_type = config["workflow_type"]

        existing = await workflow_repository.find_active_run(workspace_id, workflow_type)
        if existing:
            return existing

        run = await workflow_repository.create_run(
            {
                "workspace_id": workspace_id,
                "workflow_config_id": config["id"],
                "workflow_type": workflow_type,
                "status": "queued",
                "trigger_mode": trigger_mode,
                "requested_by_user_id": requested_by_user_id,
                "input_snapshot": {
                    "workspace_id": workspace_id,
                    "workflow_type": workflow_type,
                    "config_id": config["id"],
                },
                "started_at": utcnow(),
                "completed_at": None,
            }
        )

        callback_base = (
            workspace.get("app_url")
            or workspace.get("base_url")
            or ""
        ).rstrip("/")

        callback_url = (
            f"{callback_base}/api/internal/make/agentic-workflows/callback"
            if callback_base
            else None
        )

        make_payload = {
            "workspace_id": workspace_id,
            "workflow_run_id": run["id"],
            "workflow_type": workflow_type,
            "trigger_mode": trigger_mode,
            "requested_by_user_id": requested_by_user_id,
            "config": config,
        }

        if callback_url:
            make_payload["callback_url"] = callback_url

        try:
            await make_client.trigger_agentic_workflow(make_payload)
            updated = await workflow_repository.update_run(
                run["id"],
                {
                    "status": "running",
                    "started_at": utcnow(),
                },
            )
            return updated or run
        except Exception as exc:
            updated = await workflow_repository.update_run(
                run["id"],
                {
                    "status": "failed",
                    "completed_at": utcnow(),
                    "error_message": str(exc),
                },
            )
            if updated:
                return updated
            raise

    async def trigger_workflow(
        self,
        workspace_id: str,
        workflow_type: str,
        trigger_mode: str,
        input_payload: dict[str, Any],
        requested_by_user_id: str | None = None,
    ) -> TriggerWorkflowResponse:
        config = await workflow_repository.get_config(workspace_id, workflow_type)
        if not config:
            raise ValueError(f"No workflow config found for workflow_type='{workflow_type}'")

        existing = await workflow_repository.find_active_run(workspace_id, workflow_type)
        if existing:
            return TriggerWorkflowResponse(
                run_id=existing["id"],
                status=existing["status"],
                message="An active run already exists for this workflow.",
            )

        run = await workflow_repository.create_run(
            {
                "workspace_id": workspace_id,
                "workflow_config_id": config["id"],
                "workflow_type": workflow_type,
                "status": "queued",
                "trigger_mode": trigger_mode,
                "requested_by_user_id": requested_by_user_id,
                "input_snapshot": input_payload,
                "started_at": None,
                "completed_at": None,
            }
        )

        return TriggerWorkflowResponse(
            run_id=run["id"],
            status=run["status"],
            message="Workflow queued successfully.",
        )

    async def handle_make_callback(self, payload: MakeCallbackPayload) -> WorkflowRunRecord:
        updated = await workflow_repository.update_run(
            payload.workflow_run_id,
            {
                "status": payload.status,
                "result_summary": payload.result,
                "error_message": payload.error_message,
                "completed_at": utcnow(),
            },
        )
        if not updated:
            raise ValueError(f"Workflow run not found: {payload.workflow_run_id}")
        return WorkflowRunRecord(**updated)

    async def list_runs(
        self,
        workspace_id: str,
        workflow_type: str | None = None,
        limit: int = 25,
    ) -> list[WorkflowRunRecord]:
        if workflow_type:
            rows = await workflow_repository.list_runs_by_workflow_type(
                workspace_id, workflow_type, limit
            )
        else:
            rows = await workflow_repository.list_runs(workspace_id, limit)

        return [WorkflowRunRecord(**row) for row in rows]


workflow_service = WorkflowService()
