"""
Onboarding Progress Tracking Router
Core Truth House OS

ROUTES:
  GET  /api/onboarding/progress   — load all milestone flags
  POST /api/onboarding/milestone  — mark a milestone complete
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional

from backend.database import get_db

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])

VALID_MILESTONES = {
    "audit_complete",
    "brand_memory_complete",
    "foundation_complete",
    "strategic_os_started",
    "first_campaign_created",
}

class MilestoneRequest(BaseModel):
    milestone: str
    user_id: Optional[str] = "default"
    workspace_id: Optional[str] = None

@router.get("/progress")
async def get_progress(user_id: str = "default", workspace_id: Optional[str] = None):
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id

    doc = await db.onboarding_progress.find_one(query, {"_id": 0}) or {}

    # Pull real-time data for computed fields
    bm_query = {"user_id": user_id}
    if workspace_id:
        bm_query["workspace_id"] = workspace_id

    brand_memory = await db.brand_memory.find_one(bm_query, {"_id": 0}) or {}
    brand_found = await db.brand_foundation.find_one(bm_query, {"_id": 0}) or {}

    # Count completed Strategic OS steps from workflows
    os_steps_complete = 0
    workflow = await db.os_workflows.find_one(
        {**bm_query, "status": {"$in": ["active", "completed"]}},
        {"_id": 0, "steps": 1}
    )
    if workflow and workflow.get("steps"):
        os_steps_complete = sum(1 for s in workflow["steps"] if s.get("status") == "completed")

    audit_count = await db.brand_audits.count_documents(bm_query)
    campaign_count = await db.campaigns.count_documents(bm_query)

    # Check foundation completion
    foundation_fields = ["mission", "vision", "values", "tagline", "positioning", "story"]
    foundation_complete = all(
        bool(brand_found.get(f)) and len(str(brand_found.get(f, ""))) > 5
        for f in foundation_fields
    )

    # Brand memory completion percentage
    bm_fields = ["brand_name", "industry", "target_audience", "brand_voice", "brand_values"]
    filled = sum(1 for f in bm_fields if brand_memory.get(f))
    bm_pct = round((filled / max(len(bm_fields), 1)) * 100)

    return {
        "audit_complete": doc.get("audit_complete", audit_count > 0),
        "brand_memory_complete": doc.get("brand_memory_complete", bm_pct >= 80),
        "brand_memory_pct": bm_pct,
        "foundation_complete": doc.get("foundation_complete", foundation_complete),
        "strategic_os_started": doc.get("strategic_os_started", os_steps_complete >= 2),
        "strategic_os_steps_complete": os_steps_complete,
        "first_campaign_created": doc.get("first_campaign_created", campaign_count > 0),
        "total_campaigns": campaign_count,
    }

@router.post("/milestone")
async def mark_milestone(body: MilestoneRequest):
    if body.milestone not in VALID_MILESTONES:
        raise HTTPException(status_code=400, detail=f"Unknown milestone: {body.milestone}")

    now = datetime.now(timezone.utc).isoformat()
    query = {"user_id": body.user_id}
    if body.workspace_id:
        query["workspace_id"] = body.workspace_id

    await db.onboarding_progress.update_one(
        query,
        {"$set": {
            "user_id": body.user_id,
            body.milestone: True,
            f"{body.milestone}_at": now,
            "updated_at": now,
        }},
        upsert=True,
    )

    return {"milestone": body.milestone, "marked_at": now}

async def mark_milestone_internal(user_id: str, milestone: str, workspace_id: str = None):
    """Called internally by other routers to auto-mark milestones."""
    if milestone not in VALID_MILESTONES:
        return
    now = datetime.now(timezone.utc).isoformat()
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id
    await db.onboarding_progress.update_one(
        query,
        {"$set": {
            "user_id": user_id,
            milestone: True,
            f"{milestone}_at": now,
            "updated_at": now,
        }},
        upsert=True,
    )
    db = get_db()
