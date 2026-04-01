"""Campaign Builder API routes."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import logging

from backend.database import get_db
from backend.services.ai import _call_llm

logger = logging.getLogger("cth.campaigns")
router = APIRouter(prefix="/api/campaigns")

class CampaignCreate(BaseModel):
    user_id: str
    workspace_id: Optional[str] = None
    name: str
    goal: str = "offer_launch"
    offer_id: Optional[str] = None
    offer_name: Optional[str] = None
    offer_description: Optional[str] = None
    transformation: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    platforms: List[str] = []
    target_metric: Optional[str] = None
    target_value: Optional[str] = None
    audience_description: Optional[str] = None
    audience_problem: Optional[str] = None
    audience_desire: Optional[str] = None
    awareness_stage: str = "problem_aware"
    emotional_hook: Optional[str] = None
    problem_statement: Optional[str] = None
    promise: Optional[str] = None
    authority: Optional[str] = None
    content_plan: List[Dict[str, Any]] = []
    engagement_tactics: List[str] = []
    lead_magnet_idea: Optional[str] = None
    conversion_funnel: List[Dict[str, Any]] = []
    cta_primary: Optional[str] = None
    urgency_trigger: Optional[str] = None
    notes: Optional[str] = None
    status: str = "draft"
    actual_value: Optional[str] = None
    additional_metrics: List[Dict[str, Any]] = []
    weekly_results: List[Dict[str, Any]] = []

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    offer_id: Optional[str] = None
    offer_name: Optional[str] = None
    offer_description: Optional[str] = None
    transformation: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    platforms: Optional[List[str]] = None
    target_metric: Optional[str] = None
    target_value: Optional[str] = None
    audience_description: Optional[str] = None
    audience_problem: Optional[str] = None
    audience_desire: Optional[str] = None
    awareness_stage: Optional[str] = None
    emotional_hook: Optional[str] = None
    problem_statement: Optional[str] = None
    promise: Optional[str] = None
    authority: Optional[str] = None
    content_plan: Optional[List[Dict[str, Any]]] = None
    engagement_tactics: Optional[List[str]] = None
    lead_magnet_idea: Optional[str] = None
    conversion_funnel: Optional[List[Dict[str, Any]]] = None
    cta_primary: Optional[str] = None
    urgency_trigger: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    brief: Optional[str] = None
    generated_hooks: Optional[List[str]] = None
    actual_value: Optional[str] = None
    additional_metrics: Optional[List[Dict[str, Any]]] = None
    weekly_results: Optional[List[Dict[str, Any]]] = None

class ResultsUpdate(BaseModel):
    actual_value: Optional[str] = None
    additional_metrics: Optional[List[Dict[str, Any]]] = None
    weekly_results: Optional[List[Dict[str, Any]]] = None

class CalendarItem(BaseModel):
    campaign_id: str
    campaign_name: str
    content_item_id: str
    format: str
    platform: str
    topic: Optional[str] = None
    phase: str
    status: str = "draft"
    scheduled_date: str
    generated_id: Optional[str] = None

class CalendarPushRequest(BaseModel):
    items: List[CalendarItem]

GOAL_LABELS = {
    "offer_launch": "Offer Launch",
    "lead_generation": "Lead Generation",
    "audience_growth": "Audience Growth",
    "engagement": "Engagement",
    "sales_conversion": "Sales Conversion",
    "authority_building": "Authority Building",
    "re_engagement": "Re-Engagement",
    "brand_awareness": "Brand Awareness",
}

@router.get("")
async def list_campaigns(user_id: str, workspace_id: Optional[str] = None):
    db = get_db()
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id
    campaigns = await db.campaigns.find(query, {"_id": 0}).sort("updated_at", -1).to_list(50)
    return {"campaigns": campaigns}

@router.post("")
async def create_campaign(data: CampaignCreate):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    campaign = {
        "id": str(uuid.uuid4()),
        "user_id": data.user_id,
        "workspace_id": data.workspace_id,
        **{k: v for k, v in data.dict().items() if k not in ("user_id", "workspace_id")},
        "brief": None,
        "generated_hooks": [],
        "created_at": now,
        "updated_at": now,
    }
    await db.campaigns.insert_one(campaign)
    campaign.pop("_id", None)

    # Auto-mark onboarding milestone
    from backend.routes.onboarding_router import mark_milestone_internal
    await mark_milestone_internal(data.user_id, "first_campaign_created", data.workspace_id)

    return campaign

@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str):
    db = get_db()
    c = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return c

@router.put("/{campaign_id}")
async def update_campaign(campaign_id: str, data: CampaignUpdate):
    db = get_db()
    update = {k: v for k, v in data.dict().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.campaigns.update_one({"id": campaign_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    # FIX: return full updated document so frontend doesn't need a second GET call
    updated = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    return updated

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    db = get_db()
    result = await db.campaigns.delete_one({"id": campaign_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"success": True}

@router.post("/{campaign_id}/status")
async def update_status(campaign_id: str, status: str):
    db = get_db()
    if status not in ("draft", "active", "paused", "complete"):
        raise HTTPException(status_code=400, detail="Invalid status")
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "status": status}

@router.post("/{campaign_id}/update-results")
async def update_results(campaign_id: str, data: ResultsUpdate):
    db = get_db()
    update = {}
    if data.actual_value is not None:
        update["actual_value"] = data.actual_value
    if data.additional_metrics is not None:
        update["additional_metrics"] = data.additional_metrics
    if data.weekly_results is not None:
        update["weekly_results"] = data.weekly_results
    if not update:
        return {"success": True}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.campaigns.update_one({"id": campaign_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"success": True}

@router.post("/calendar-items")
async def push_calendar_items(data: CalendarPushRequest):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    items_created = []
    for item in data.items:
        cal_item = {
            "id": f"cal-{item.campaign_id}-{item.content_item_id}",
            "campaign_id": item.campaign_id,
            "campaign_name": item.campaign_name,
            "content_item_id": item.content_item_id,
            "format": item.format,
            "platform": item.platform,
            "topic": item.topic,
            "phase": item.phase,
            "status": item.status,
            "scheduled_date": item.scheduled_date,
            "generated_id": item.generated_id,
            "type": "campaign_content",
            "created_at": now,
        }
        await db.calendar_items.update_one(
            {"id": cal_item["id"]},
            {"$set": cal_item},
            upsert=True
        )
        items_created.append(cal_item["id"])
    return {"success": True, "items_created": len(items_created)}

@router.post("/{campaign_id}/generate-brief")
async def generate_brief(campaign_id: str):
    db = get_db()
    c = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Get brand memory for context
    bm = await db.brand_foundation.find_one({"user_id": c["user_id"]}, {"_id": 0}) or {}

    prompt = f"""You are my marketing strategist and campaign architect. You are also deeply familiar with my brand.

Brand Name: {bm.get('brand_name', bm.get('mission', '')[:50])}
Brand Mission: {bm.get('mission', '')}
Brand Voice: {bm.get('voice', '')}
Positioning: {bm.get('positioning', '')}

Create a full marketing campaign brief for the following:

Product or Offer: {c.get('offer_name', '')} — {c.get('offer_description', '')}
Target Audience: {c.get('audience_description', '')}
Problem my audience faces: {c.get('audience_problem', '')}
Transformation my offer delivers: {c.get('transformation', '')}
Audience desire: {c.get('audience_desire', '')}
Awareness stage: {c.get('awareness_stage', '')}
Campaign Goal: {GOAL_LABELS.get(c.get('goal', ''), '')}
Campaign Length: {c.get('start_date', '')} to {c.get('end_date', '')}
Platforms: {', '.join(c.get('platforms', []))}
Emotional Hook: {c.get('emotional_hook', '')}
Core Promise: {c.get('promise', '')}
Authority Statement: {c.get('authority', '')}
Primary CTA: {c.get('cta_primary', '')}
Urgency Trigger: {c.get('urgency_trigger', '')}

Generate:
- Campaign name (if not already named)
- Refined core message (one sentence that runs through every piece of content)
- Campaign storyline (the narrative arc from awareness to conversion)
- Strategic recommendation for each platform listed
- Lead magnet idea that fits this offer and audience
- 3 key objections to address in this campaign and how to handle them
- Week-by-week content rhythm recommendation

Write in the brand's voice. Be specific and strategic, not generic."""

    brief = await _call_llm(prompt)
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"brief": brief, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"brief": brief}

@router.post("/{campaign_id}/generate-hooks")
async def generate_hooks(campaign_id: str):
    db = get_db()
    c = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    prompt = f"""Create 10 powerful marketing hooks for this campaign.

Campaign topic: {c.get('name', '')} — {c.get('offer_name', '')}
Audience: {c.get('audience_description', '')}
Pain point: {c.get('audience_problem', '')}
Transformation: {c.get('transformation', '')}
Awareness stage: {c.get('awareness_stage', '')}

Use a mix of:
- Curiosity triggers ("Nobody talks about this...")
- Authority openers ("After [X years] of [doing Y]...")
- Emotional mirrors (reflect the audience's exact inner thoughts)
- Bold claims ("This is why your [X] is not working")
- Urgency without manipulation ("If you are still doing [X], you are losing [Y]")
- Contrarian takes ("The [popular advice] about [topic] is wrong")

Write hooks for multiple formats: captions, reel first lines, email subject lines, ad headlines.
Return ONLY the hooks, one per line, numbered 1-10. No other text."""

    output = await _call_llm(prompt)
    hooks = [line.strip().lstrip("0123456789.)-— ") for line in output.strip().split("\n") if line.strip() and len(line.strip()) > 5][:10]

    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"generated_hooks": hooks, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"hooks": hooks}
