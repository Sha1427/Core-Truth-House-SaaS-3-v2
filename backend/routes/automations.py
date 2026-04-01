"""Automation Rules (Conditional Chains) API routes."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import logging

from backend.database import get_db

logger = logging.getLogger("cth.automations")
router = APIRouter(prefix="/api/automations")

class AutomationCreate(BaseModel):
    user_id: str
    workspace_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    trigger: Dict[str, Any]
    conditions: List[Dict[str, Any]] = []
    actions: List[Dict[str, Any]] = []
    is_active: bool = False

class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger: Optional[Dict[str, Any]] = None
    conditions: Optional[List[Dict[str, Any]]] = None
    actions: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None

TRIGGER_TYPES = [
    {"id": "content_published", "label": "Content Published", "description": "When a piece of content is published", "icon": "send", "fields": [{"id": "platform", "label": "Platform", "type": "select", "options": ["Any", "Instagram", "LinkedIn", "X (Twitter)", "TikTok", "YouTube", "Facebook", "Email", "Blog"]}]},
    {"id": "engagement_threshold", "label": "Engagement Threshold", "description": "When engagement reaches a threshold", "icon": "trending-up", "fields": [{"id": "metric", "label": "Metric", "type": "select", "options": ["Impressions", "Likes", "Comments", "Shares", "Clicks"]}, {"id": "operator", "label": "Operator", "type": "select", "options": ["Greater than", "Less than", "Equal to"]}, {"id": "value", "label": "Value", "type": "number"}]},
    {"id": "campaign_milestone", "label": "Campaign Milestone", "description": "When a campaign reaches a milestone", "icon": "flag", "fields": [{"id": "milestone", "label": "Milestone", "type": "select", "options": ["25% complete", "50% complete", "75% complete", "100% complete", "Goal reached", "Budget spent"]}]},
    {"id": "schedule", "label": "Scheduled Time", "description": "At a specific date/time or recurring", "icon": "clock", "fields": [{"id": "schedule_type", "label": "Type", "type": "select", "options": ["Once", "Daily", "Weekly", "Monthly"]}, {"id": "time", "label": "Time", "type": "time"}, {"id": "day", "label": "Day", "type": "select", "options": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]}]},
    {"id": "lead_captured", "label": "New Lead Captured", "description": "When a new lead is added to CRM", "icon": "user-plus", "fields": [{"id": "source", "label": "Source", "type": "select", "options": ["Any", "Form", "Email", "Social", "Referral"]}]},
    {"id": "magnet_step_complete", "label": "MAGNET Step Complete", "description": "When a campaign MAGNET step is filled", "icon": "check-circle", "fields": [{"id": "step", "label": "Step", "type": "select", "options": ["M - Mission", "A - Audience", "G - Gravity Message", "N - Narrative", "E - Engagement", "T - Transaction", "All steps"]}]},
]

ACTION_TYPES = [
    {"id": "send_notification", "label": "Send Notification", "description": "Send an in-app notification", "icon": "bell", "fields": [{"id": "title", "label": "Title", "type": "text"}, {"id": "message", "label": "Message", "type": "textarea"}]},
    {"id": "change_campaign_status", "label": "Change Campaign Status", "description": "Update a campaign's status", "icon": "refresh-cw", "fields": [{"id": "status", "label": "New Status", "type": "select", "options": ["draft", "active", "paused", "complete"]}]},
    {"id": "generate_content", "label": "Generate Content", "description": "Auto-generate content using AI", "icon": "zap", "fields": [{"id": "content_type", "label": "Type", "type": "select", "options": ["Social post", "Email", "Blog outline", "Ad copy"]}, {"id": "platform", "label": "Platform", "type": "select", "options": ["Instagram", "LinkedIn", "X (Twitter)", "Email"]}]},
    {"id": "schedule_post", "label": "Schedule Post", "description": "Schedule a post for publishing", "icon": "calendar", "fields": [{"id": "delay_hours", "label": "Delay (hours)", "type": "number"}, {"id": "platform", "label": "Platform", "type": "select", "options": ["Instagram", "LinkedIn", "X (Twitter)", "TikTok", "Facebook"]}]},
    {"id": "add_tag", "label": "Add Tag to Lead", "description": "Add a tag to the triggering lead", "icon": "tag", "fields": [{"id": "tag", "label": "Tag", "type": "text"}]},
    {"id": "create_task", "label": "Create Task", "description": "Create a task in the calendar", "icon": "clipboard", "fields": [{"id": "title", "label": "Task Title", "type": "text"}, {"id": "priority", "label": "Priority", "type": "select", "options": ["low", "medium", "high"]}]},
    {"id": "webhook", "label": "Call Webhook", "description": "Send data to an external URL", "icon": "globe", "fields": [{"id": "url", "label": "Webhook URL", "type": "text"}, {"id": "method", "label": "Method", "type": "select", "options": ["POST", "PUT"]}]},
]

CONDITION_OPERATORS = [
    {"id": "and", "label": "AND"},
    {"id": "or", "label": "OR"},
]

@router.get("/config")
async def get_automation_config():
    """Return available trigger, action, and condition types."""
    return {
        "triggers": TRIGGER_TYPES,
        "actions": ACTION_TYPES,
        "condition_operators": CONDITION_OPERATORS,
    }

@router.get("")
async def list_automations(user_id: str, workspace_id: Optional[str] = None):
    db = get_db()
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id
    automations = await db.automations.find(query, {"_id": 0}).sort("updated_at", -1).to_list(50)
    return {"automations": automations}

@router.post("")
async def create_automation(data: AutomationCreate):
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    automation = {
        "id": str(uuid.uuid4()),
        **data.dict(),
        "execution_count": 0,
        "last_executed": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.automations.insert_one(automation)
    automation.pop("_id", None)
    return automation

@router.get("/{automation_id}")
async def get_automation(automation_id: str):
    db = get_db()
    a = await db.automations.find_one({"id": automation_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Automation not found")
    return a

@router.put("/{automation_id}")
async def update_automation(automation_id: str, data: AutomationUpdate):
    db = get_db()
    update = {k: v for k, v in data.dict().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.automations.update_one({"id": automation_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Automation not found")
    return await db.automations.find_one({"id": automation_id}, {"_id": 0})

@router.delete("/{automation_id}")
async def delete_automation(automation_id: str):
    db = get_db()
    result = await db.automations.delete_one({"id": automation_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Automation not found")
    return {"success": True}

@router.post("/{automation_id}/toggle")
async def toggle_automation(automation_id: str):
    db = get_db()
    a = await db.automations.find_one({"id": automation_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Automation not found")
    new_state = not a.get("is_active", False)
    await db.automations.update_one(
        {"id": automation_id},
        {"$set": {"is_active": new_state, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"is_active": new_state}

@router.get("/{automation_id}/logs")
async def get_automation_logs(automation_id: str, limit: int = 20):
    db = get_db()
    logs = await db.automation_logs.find(
        {"automation_id": automation_id}, {"_id": 0}
    ).sort("executed_at", -1).to_list(limit)
    return {"logs": logs}

@router.post("/{automation_id}/test")
async def test_automation(automation_id: str):
    """Simulate a test run of the automation."""
    a = await db.automations.find_one({"id": automation_id}, {"_id": 0})
    if not a:
        raise HTTPException(status_code=404, detail="Automation not found")
    db = get_db()

    log = {
        "id": str(uuid.uuid4()),
        "automation_id": automation_id,
        "trigger": a.get("trigger", {}),
        "actions_executed": [act.get("type", "unknown") for act in a.get("actions", [])],
        "status": "success",
        "is_test": True,
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "details": "Test run completed successfully. No real actions were performed.",
    }
    await db.automation_logs.insert_one(log)
    log.pop("_id", None)

    await db.automations.update_one(
        {"id": automation_id},
        {"$inc": {"execution_count": 1}, "$set": {"last_executed": datetime.now(timezone.utc).isoformat()}}
    )

    return {"success": True, "log": log}
