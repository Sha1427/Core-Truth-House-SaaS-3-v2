"""One-time backfill route."""
from fastapi import APIRouter, Request, Depends
from backend.app.core.auth import require_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])

COLLECTIONS = [
    "brand_audits", "os_workflows", "onboarding_progress",
    "brand_memory", "brand_foundation", "campaigns",
    "content_items", "content_assets", "offers", "systems",
    "strategic_os_steps", "os_workflow_steps", "os_brand_memory",
]

@router.post("/backfill-workspace")
async def backfill_workspace(request: Request, user=Depends(require_current_user)):
    db = request.app.state.db
    workspace_id = (await request.json()).get("workspace_id")
    user_id = (await request.json()).get("user_id")
    results = {}
    for col in COLLECTIONS:
        try:
            r1 = await db[col].update_many(
                {"$or": [{"workspace_id": None}, {"workspace_id": {"$exists": False}}]},
                {"$set": {"workspace_id": workspace_id}}
            )
            r2 = await db[col].update_many(
                {"user_id": "default"},
                {"$set": {"user_id": user_id, "workspace_id": workspace_id}}
            )
            results[col] = {"null_fix": r1.modified_count, "default_fix": r2.modified_count}
        except Exception as e:
            results[col] = {"error": str(e)}
    return {"results": results}
