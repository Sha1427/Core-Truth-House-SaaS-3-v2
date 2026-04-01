from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException

from backend.database import get_db
from backend.models.workflow import (
    MakeCallbackPayload,
    ReviewActionRequest,
    RunWorkflowRequest,
    WorkflowConfigCreateUpdate,
)
from backend.services.content_pack_service import content_pack_service
from backend.services.entitlements_service import entitlements_service
from backend.services.workflow_service import workflow_service
from repositories.content_pack_repository import content_pack_repository
from repositories.workflow_repository import workflow_repository

router = APIRouter(prefix="/api", tags=["agentic-workflows"])


# ============================================================
# TEMP AUTH
# ============================================================

async def get_current_user() -> dict[str, Any]:
    return {
        "id": "user_dev_001",
        "email": "dev@example.com",
    }


# ============================================================
# HELPERS
# ============================================================

def resolve_workspace_key(workspace: dict[str, Any]) -> str:
    workspace_key = workspace.get("workspace_id") or workspace.get("id")
    if not workspace_key:
        raise HTTPException(status_code=400, detail="Workspace missing workspace_id.")
    return str(workspace_key)


def require_make_secret(header_secret: str | None) -> None:
    expected = (
        os.getenv("MAKE_AGENTIC_CALLBACK_SECRET", "").strip()
        or os.getenv("CTH_MAKE_SECRET", "").strip()
        or os.getenv("MAKE_SHARED_SECRET", "").strip()
    )

    if not expected:
        raise HTTPException(
            status_code=500,
            detail="Make callback secret is not configured on the server.",
        )

    if (header_secret or "").strip() != expected:
        raise HTTPException(status_code=401, detail="Invalid Make callback secret.")


def get_database():
    try:
        return get_db()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database is not initialized: {exc}") from exc


async def get_workspace_for_user(
    workspace_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    del user

    database = get_database()

    workspace = await database.workspaces.find_one(
        {
            "$or": [
                {"workspace_id": workspace_id},
                {"id": workspace_id},
            ]
        }
    )

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    return workspace


async def get_agentic_workspace(
    workspace: dict[str, Any] = Depends(get_workspace_for_user),
) -> dict[str, Any]:
    try:
        entitlements_service.require_agentic_workflows(workspace)
    except Exception as exc:
        raise HTTPException(
            status_code=403,
            detail=f"Agentic workflows not enabled for this workspace: {exc}",
        ) from exc

    return workspace


# ============================================================
# TEMP DEBUG ROUTES
# ============================================================

@router.get("/debug/workspaces")
async def debug_workspaces():
    database = get_database()

    rows = await database.workspaces.find(
        {},
        {
            "_id": 0,
            "id": 1,
            "workspace_id": 1,
            "name": 1,
            "title": 1,
        },
    ).limit(10).to_list(length=10)

    return {
        "ok": True,
        "count": len(rows),
        "workspaces": rows,
    }


@router.get("/debug/workspaces/{workspace_id}")
async def debug_workspace(workspace_id: str):
    database = get_database()

    workspace = await database.workspaces.find_one(
        {
            "$or": [
                {"workspace_id": workspace_id},
                {"id": workspace_id},
            ]
        },
        {"_id": 0},
    )

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    return {
        "ok": True,
        "workspace": workspace,
    }


# ============================================================
# WORKFLOW CONFIG
# ============================================================

@router.get("/workspaces/{workspace_id}/agentic-workflows/config")
async def get_workflow_config(
    workspace: dict[str, Any] = Depends(get_agentic_workspace),
):
    workspace_key = resolve_workspace_key(workspace)
    config = await workflow_repository.get_config(workspace_key, "daily_content_engine")

    return {
        "ok": True,
        "config": config,
    }


@router.put("/workspaces/{workspace_id}/agentic-workflows/config")
async def upsert_workflow_config(
    payload: WorkflowConfigCreateUpdate,
    workspace: dict[str, Any] = Depends(get_agentic_workspace),
):
    workspace_key = resolve_workspace_key(workspace)
    config = await workflow_repository.upsert_config(
        workspace_key,
        payload.model_dump(),
    )

    return {
        "ok": True,
        "config": config,
    }


# ============================================================
# WORKFLOW RUNS
# ============================================================

@router.post("/workspaces/{workspace_id}/agentic-workflows/run")
async def run_workflow(
    payload: RunWorkflowRequest,
    workspace: dict[str, Any] = Depends(get_agentic_workspace),
    user: dict[str, Any] = Depends(get_current_user),
):
    workspace_key = resolve_workspace_key(workspace)

    try:
        config = await workflow_repository.get_config(
            workspace_key,
            payload.workflow_type,
        )

        if not config:
            raise HTTPException(status_code=404, detail="Workflow config not found.")

        if not config.get("is_enabled", False):
            raise HTTPException(status_code=400, detail="Workflow is disabled.")

        run = await workflow_service.trigger_run(
            workspace=workspace,
            config=config,
            trigger_mode=payload.trigger_mode,
            requested_by_user_id=user["id"],
        )

        return {
            "ok": True,
            "run": run,
        }

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Run trigger failed: {exc}") from exc


@router.get("/workspaces/{workspace_id}/agentic-workflows/runs")
async def list_workflow_runs(
    workspace: dict[str, Any] = Depends(get_agentic_workspace),
):
    workspace_key = resolve_workspace_key(workspace)
    runs = await workflow_repository.list_runs(workspace_key)

    return {
        "ok": True,
        "runs": runs,
    }


@router.get("/workspaces/{workspace_id}/agentic-workflows/runs/{run_id}")
async def get_workflow_run(
    run_id: str,
    workspace: dict[str, Any] = Depends(get_agentic_workspace),
):
    workspace_key = resolve_workspace_key(workspace)
    run = await workflow_repository.get_run(run_id)

    if not run or run.get("workspace_id") != workspace_key:
        raise HTTPException(status_code=404, detail="Run not found.")

    return {
        "ok": True,
        "run": run,
    }


# ============================================================
# CONTENT PACKS
# ============================================================

@router.get("/workspaces/{workspace_id}/content-packs")
async def list_content_packs(
    workspace: dict[str, Any] = Depends(get_agentic_workspace),
):
    workspace_key = resolve_workspace_key(workspace)
    packs = await content_pack_repository.list_content_packs(workspace_key)

    return {
        "ok": True,
        "packs": packs,
    }


@router.get("/workspaces/{workspace_id}/content-packs/{pack_id}")
async def get_content_pack(
    pack_id: str,
    workspace: dict[str, Any] = Depends(get_agentic_workspace),
):
    workspace_key = resolve_workspace_key(workspace)
    pack = await content_pack_repository.get_content_pack(pack_id)

    if not pack or pack.get("workspace_id") != workspace_key:
        raise HTTPException(status_code=404, detail="Content pack not found.")

    return {
        "ok": True,
        "pack": pack,
    }


@router.post("/workspaces/{workspace_id}/content-packs/{pack_id}/approve")
async def approve_content_pack_assets(
    pack_id: str,
    payload: ReviewActionRequest,
    workspace: dict[str, Any] = Depends(get_agentic_workspace),
):
    workspace_key = resolve_workspace_key(workspace)
    pack = await content_pack_repository.get_content_pack(pack_id)

    if not pack or pack.get("workspace_id") != workspace_key:
        raise HTTPException(status_code=404, detail="Content pack not found.")

    updated = await content_pack_service.approve_assets(
        pack,
        payload.asset_keys,
        payload.note,
    )

    return {
        "ok": True,
        "pack": updated,
    }


@router.post("/workspaces/{workspace_id}/content-packs/{pack_id}/reject")
async def reject_content_pack_assets(
    pack_id: str,
    payload: ReviewActionRequest,
    workspace: dict[str, Any] = Depends(get_agentic_workspace),
):
    workspace_key = resolve_workspace_key(workspace)
    pack = await content_pack_repository.get_content_pack(pack_id)

    if not pack or pack.get("workspace_id") != workspace_key:
        raise HTTPException(status_code=404, detail="Content pack not found.")

    updated = await content_pack_service.reject_assets(
        pack,
        payload.asset_keys,
        payload.note,
    )

    return {
        "ok": True,
        "pack": updated,
    }


@router.post("/workspaces/{workspace_id}/content-packs/{pack_id}/request-revision")
async def request_revision_for_pack_assets(
    pack_id: str,
    payload: ReviewActionRequest,
    workspace: dict[str, Any] = Depends(get_agentic_workspace),
):
    workspace_key = resolve_workspace_key(workspace)
    pack = await content_pack_repository.get_content_pack(pack_id)

    if not pack or pack.get("workspace_id") != workspace_key:
        raise HTTPException(status_code=404, detail="Content pack not found.")

    updated = await content_pack_service.request_revision(
        pack,
        payload.asset_keys,
        payload.note,
    )

    return {
        "ok": True,
        "pack": updated,
    }


# ============================================================
# MAKE CALLBACK
# ============================================================

@router.post("/internal/make/agentic-workflows/callback")
async def make_callback(
    payload: MakeCallbackPayload,
    x_cth_make_secret: str | None = Header(default=None),
):
    require_make_secret(x_cth_make_secret)

    try:
        result = await content_pack_service.handle_make_callback(payload.model_dump())
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Callback processing failed: {exc}",
        ) from exc
