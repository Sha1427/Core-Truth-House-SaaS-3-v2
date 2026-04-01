"""
workspace_stats_router.py
Core Truth House OS — Workspace Stats Endpoint

Purpose
-------
Returns workspace-scoped usage stats for the Tenant Command Center.

Why this rebuild
----------------
- Uses workspace_id instead of user_id as the primary key
- Aligns with tenant/workspace architecture
- Optionally exposes subscription/entitlement summary for dashboard display
- Keeps stats read-only and separate from subscription write logic

Routes
------
GET /api/workspace/{workspace_id}/stats
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/api/workspace", tags=["workspace-stats"])


async def get_workspace_or_404(db, workspace_id: str) -> dict:
    workspace = await db.workspaces.find_one({"workspace_id": workspace_id}, {"_id": 0})
    if not workspace:
        workspace = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found.")

    return workspace


@router.get("/{workspace_id}/stats")
async def get_workspace_stats(workspace_id: str, request: Request):
    """
    Returns workspace usage stats for the Tenant Command Center.

    Notes
    -----
    - This endpoint reads workspace stats and subscription summary.
    - It does not create or update entitlements.
    - Entitlements should already exist on the workspace record.
    """
    db = request.app.state.db

    workspace = await get_workspace_or_404(db, workspace_id)
    query = {"workspace_id": workspace_id}

    content_generated = await db.content_items.count_documents(query)
    campaigns = await db.campaigns.count_documents(query)

    media_assets_count = await db.media_assets.count_documents(
        {**query, "status": "confirmed"}
    )

    brand_assets_count = 0
    if "brand_assets" in await db.list_collection_names():
        brand_assets_count = await db.brand_assets.count_documents(query)

    assets = media_assets_count + brand_assets_count

    prompts = 0
    if "prompt_history" in await db.list_collection_names():
        prompts = await db.prompt_history.count_documents(query)
    elif "prompt_library" in await db.list_collection_names():
        prompts = await db.prompt_library.count_documents(query)

    ai_credits_used = 0
    if "credit_usage" in await db.list_collection_names():
        credit_doc = await db.credit_usage.find_one(query, {"_id": 0})
        ai_credits_used = int((credit_doc or {}).get("total_used", 0))
    elif "ai_usage" in await db.list_collection_names():
        # If you later store aggregate ai usage differently, update this logic.
        ai_usage_docs = await db.ai_usage.count_documents(query)
        ai_credits_used = int(ai_usage_docs)

    return {
        "workspace_id": workspace_id,
        "workspace_name": workspace.get("name", ""),
        "plan": workspace.get("plan", "audit"),
        "subscription_status": workspace.get("subscription_status", "inactive"),
        "entitlements": workspace.get("entitlements", {}) or {},
        "limits": workspace.get("limits", {}) or {},
        "usage": {
            "content_generated": content_generated,
            "campaigns": campaigns,
            "assets": assets,
            "prompts": prompts,
            "ai_credits_used": ai_credits_used,
        },
    }
