"""
Enhanced Notification System
- WebSocket real-time notifications
- Email notifications for specific events
- Extended notification types
- Custom notification preferences
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import asyncio
import json
from backend.database import get_db

router = APIRouter(prefix="/api/notifications")

# ============================================
# MODELS
# ============================================

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, success, warning, error, automation, deal, crm, content, ai_job, system, billing
    category: str = "general"  # general, crm, content, ai, billing, team, system
    link: Optional[str] = None
    metadata: Optional[dict] = None
    send_email: bool = False
    priority: str = "normal"  # low, normal, high, urgent

class NotificationPreferences(BaseModel):
    # In-app notifications
    in_app_enabled: bool = True
    
    # Email notifications
    email_enabled: bool = True
    email_digest: str = "instant"  # instant, daily, weekly, none
    
    # Push notifications (browser)
    push_enabled: bool = False
    
    # Notification categories
    crm_notifications: bool = True
    content_notifications: bool = True
    ai_job_notifications: bool = True
    billing_notifications: bool = True
    team_notifications: bool = True
    system_notifications: bool = True
    
    # Specific events
    deal_stage_changes: bool = True
    deal_won_lost: bool = True
    content_published: bool = True
    ai_generation_complete: bool = True
    weekly_digest: bool = True
    billing_alerts: bool = True
    team_invites: bool = True
    ai_usage_alerts: bool = True

class BulkNotificationCreate(BaseModel):
    user_ids: List[str]
    title: str
    message: str
    type: str = "info"
    category: str = "general"
    link: Optional[str] = None
    metadata: Optional[dict] = None

# ============================================
# NOTIFICATION TYPES & TEMPLATES
# ============================================

NOTIFICATION_TYPES = {
    # General
    "info": {"icon": "info", "color": "#3b82f6", "category": "general"},
    "success": {"icon": "check", "color": "#22c55e", "category": "general"},
    "warning": {"icon": "alert-triangle", "color": "#eab308", "category": "general"},
    "error": {"icon": "x-circle", "color": "#ef4444", "category": "general"},
    
    # CRM
    "deal": {"icon": "dollar-sign", "color": "#C7A09D", "category": "crm"},
    "deal_won": {"icon": "trophy", "color": "#22c55e", "category": "crm"},
    "deal_lost": {"icon": "x-circle", "color": "#ef4444", "category": "crm"},
    "deal_stage": {"icon": "arrow-right", "color": "#3b82f6", "category": "crm"},
    "contact_added": {"icon": "user-plus", "color": "#8b5cf6", "category": "crm"},
    
    # Content
    "content": {"icon": "file-text", "color": "#e04e35", "category": "content"},
    "content_published": {"icon": "globe", "color": "#22c55e", "category": "content"},
    "content_scheduled": {"icon": "clock", "color": "#eab308", "category": "content"},
    "blog_published": {"icon": "book-open", "color": "#e04e35", "category": "content"},
    
    # AI Jobs
    "ai_job": {"icon": "sparkles", "color": "#e04e35", "category": "ai"},
    "ai_complete": {"icon": "check-circle", "color": "#22c55e", "category": "ai"},
    "ai_failed": {"icon": "x-circle", "color": "#ef4444", "category": "ai"},
    "image_generated": {"icon": "image", "color": "#8b5cf6", "category": "ai"},
    "video_generated": {"icon": "video", "color": "#e04e35", "category": "ai"},
    
    # Automation
    "automation": {"icon": "zap", "color": "#e04e35", "category": "system"},
    "automation_triggered": {"icon": "zap", "color": "#eab308", "category": "system"},
    
    # Billing
    "billing": {"icon": "credit-card", "color": "#3b82f6", "category": "billing"},
    "payment_success": {"icon": "check-circle", "color": "#22c55e", "category": "billing"},
    "payment_failed": {"icon": "x-circle", "color": "#ef4444", "category": "billing"},
    "subscription_renewed": {"icon": "refresh-cw", "color": "#22c55e", "category": "billing"},
    "credits_low": {"icon": "alert-triangle", "color": "#eab308", "category": "billing"},
    
    # Team
    "team": {"icon": "users", "color": "#8b5cf6", "category": "team"},
    "team_invite": {"icon": "user-plus", "color": "#3b82f6", "category": "team"},
    "team_joined": {"icon": "user-check", "color": "#22c55e", "category": "team"},
    "team_left": {"icon": "user-minus", "color": "#ef4444", "category": "team"},
    
    # System
    "system": {"icon": "settings", "color": "#6b7280", "category": "system"},
    "maintenance": {"icon": "wrench", "color": "#eab308", "category": "system"},
    "update": {"icon": "download", "color": "#3b82f6", "category": "system"},
}

# ============================================
# WEBSOCKET CONNECTION MANAGER
# ============================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)
            # Clean up disconnected
            for conn in disconnected:
                self.disconnect(conn, user_id)
    
    async def broadcast(self, message: dict):
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, message)
    
    def is_user_online(self, user_id: str) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

manager = ConnectionManager()

# ============================================
# WEBSOCKET ENDPOINT
# ============================================

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    db = get_db()
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            elif message.get("type") == "mark_read":
                notification_id = message.get("notification_id")
                if notification_id:
                    await db.notifications.update_one(
                        {"id": notification_id}, {"$set": {"is_read": True}}
                    )
                    await websocket.send_json({"type": "read_confirmed", "notification_id": notification_id})
            elif message.get("type") == "get_unread_count":
                count = await db.notifications.count_documents({"user_id": user_id, "is_read": False})
                await websocket.send_json({"type": "unread_count", "count": count})
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception:
        manager.disconnect(websocket, user_id)

# ============================================
# NOTIFICATION CRUD
# ============================================

@router.get("")
async def get_notifications(
    user_id: str, 
    unread_only: bool = False, 
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    query = {"user_id": user_id}
    if unread_only:
        query["is_read"] = False
    if category:
        query["category"] = category
    
    notifications = await db.notifications.find(
        query, {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    unread_count = await db.notifications.count_documents({"user_id": user_id, "is_read": False})
    total_count = await db.notifications.count_documents({"user_id": user_id})
    
    return {
        "notifications": notifications, 
        "unread_count": unread_count,
        "total_count": total_count,
        "has_more": offset + limit < total_count
    }

@router.post("")
async def create_notification(data: NotificationCreate):
    """Create a notification and optionally send real-time + email."""
    
    # Check user's notification preferences
    prefs = await get_user_notification_preferences(data.user_id)
    
    # Check if this category is enabled
    category = NOTIFICATION_TYPES.get(data.type, {}).get("category", "general")
    category_enabled = prefs.get(f"{category}_notifications", True)
    
    if not prefs.get("in_app_enabled", True) or not category_enabled:
        return {"success": True, "skipped": True, "reason": "Notifications disabled for this category"}
    
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": data.user_id,
        "title": data.title,
        "message": data.message,
        "type": data.type,
        "category": category,
        "link": data.link,
        "metadata": data.metadata or {},
        "priority": data.priority,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.notifications.insert_one(notification)
    notification.pop("_id", None)
    
    # Send real-time notification via WebSocket
    if manager.is_user_online(data.user_id):
        unread_count = await db.notifications.count_documents({"user_id": data.user_id, "is_read": False})
        await manager.send_to_user(data.user_id, {
            "type": "new_notification",
            "notification": notification,
            "unread_count": unread_count
        })
    
    # Send email if requested and enabled
    if data.send_email and prefs.get("email_enabled", True):
        if prefs.get("email_digest") == "instant":
            await queue_email_notification(data.user_id, notification)
    
    return {"success": True, "notification": notification}
    db = get_db()

@router.post("/bulk")
async def create_bulk_notifications(data: BulkNotificationCreate):
    """Send notifications to multiple users at once."""
    created = []
    for user_id in data.user_ids:
        notification = NotificationCreate(
            user_id=user_id,
            title=data.title,
            message=data.message,
            type=data.type,
            category=data.category,
            link=data.link,
            metadata=data.metadata
        )
        result = await create_notification(notification)
        if result.get("success") and not result.get("skipped"):
            created.append(user_id)
    
    return {"success": True, "notified_users": len(created)}

@router.put("/{notification_id}/read")
async def mark_read(notification_id: str, user_id: str = None):
    db = get_db()
    result = await db.notifications.update_one(
        {"id": notification_id}, {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send real-time update if user is connected
    if user_id and manager.is_user_online(user_id):
        unread_count = await db.notifications.count_documents({"user_id": user_id, "is_read": False})
        await manager.send_to_user(user_id, {
            "type": "unread_count",
            "count": unread_count
        })
    
    return {"success": True}

@router.put("/mark-all-read")
async def mark_all_read(user_id: str):
    db = get_db()
    await db.notifications.update_many(
        {"user_id": user_id, "is_read": False}, 
        {"$set": {"is_read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send real-time update
    if manager.is_user_online(user_id):
        await manager.send_to_user(user_id, {
            "type": "unread_count",
            "count": 0
        })
    
    return {"success": True}

@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    db = get_db()
    await db.notifications.delete_one({"id": notification_id})
    return {"success": True}

@router.delete("/clear-all")
async def clear_all_notifications(user_id: str, read_only: bool = True):
    """Clear notifications - optionally only read ones."""
    query = {"user_id": user_id}
    if read_only:
        query["is_read"] = True
    result = await db.notifications.delete_many(query)
    return {"success": True, "deleted_count": result.deleted_count}
    db = get_db()

# ============================================
# NOTIFICATION PREFERENCES
# ============================================

@router.get("/preferences")
async def get_preferences(user_id: str):
    """Get user's notification preferences."""
    prefs = await get_user_notification_preferences(user_id)
    return {"preferences": prefs}

@router.put("/preferences")
async def update_preferences(user_id: str, preferences: NotificationPreferences):
    """Update user's notification preferences."""
    await db.notification_preferences.update_one(
        {"user_id": user_id},
        {"$set": {
            **preferences.model_dump(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }, "$setOnInsert": {
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"success": True, "preferences": preferences.model_dump()}
    db = get_db()

async def get_user_notification_preferences(user_id: str) -> dict:
    """Get user's notification preferences with defaults."""
    doc = await db.notification_preferences.find_one({"user_id": user_id}, {"_id": 0})
    if not doc:
        return NotificationPreferences().model_dump()
    return {**NotificationPreferences().model_dump(), **doc}
    db = get_db()

# ============================================
# NOTIFICATION HELPERS (for other modules)
# ============================================

async def notify_user(
    user_id: str,
    title: str,
    message: str,
    type: str = "info",
    link: str = None,
    metadata: dict = None,
    send_email: bool = False,
    priority: str = "normal"
):
    """Helper function to create a notification from other modules."""
    data = NotificationCreate(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        link=link,
        metadata=metadata,
        send_email=send_email,
        priority=priority
    )
    return await create_notification(data)

async def notify_deal_stage_change(user_id: str, deal_name: str, from_stage: str, to_stage: str, deal_id: str):
    """Notify when a deal changes stage."""
    return await notify_user(
        user_id=user_id,
        title="Deal Stage Changed",
        message=f'"{deal_name}" moved from {from_stage} to {to_stage}',
        type="deal_stage",
        link=f"/crm?deal={deal_id}",
        metadata={"deal_id": deal_id, "from_stage": from_stage, "to_stage": to_stage}
    )

async def notify_deal_won(user_id: str, deal_name: str, value: float, deal_id: str):
    """Notify when a deal is won."""
    return await notify_user(
        user_id=user_id,
        title="Deal Won! 🎉",
        message=f'Congratulations! "{deal_name}" is closed won (${value:,.0f})',
        type="deal_won",
        link=f"/crm?deal={deal_id}",
        metadata={"deal_id": deal_id, "value": value},
        priority="high"
    )

async def notify_content_published(user_id: str, content_title: str, content_type: str, content_id: str):
    """Notify when content is published."""
    return await notify_user(
        user_id=user_id,
        title="Content Published",
        message=f'Your {content_type} "{content_title}" is now live',
        type="content_published",
        link=f"/blog-cms?id={content_id}",
        metadata={"content_id": content_id, "content_type": content_type}
    )

async def notify_ai_job_complete(user_id: str, job_type: str, job_id: str, success: bool = True):
    """Notify when an AI generation job completes."""
    if success:
        return await notify_user(
            user_id=user_id,
            title="AI Generation Complete",
            message=f"Your {job_type} is ready to view",
            type="ai_complete",
            link=f"/media-studio?job={job_id}",
            metadata={"job_id": job_id, "job_type": job_type}
        )
    else:
        return await notify_user(
            user_id=user_id,
            title="AI Generation Failed",
            message=f"Your {job_type} could not be generated. Please try again.",
            type="ai_failed",
            link=f"/media-studio",
            metadata={"job_id": job_id, "job_type": job_type},
            priority="high"
        )

async def notify_credits_low(user_id: str, remaining_credits: int, plan: str):
    """Notify when AI credits are running low."""
    return await notify_user(
        user_id=user_id,
        title="AI Credits Running Low",
        message=f"You have {remaining_credits} AI credits remaining this month",
        type="credits_low",
        link="/billing",
        metadata={"remaining_credits": remaining_credits, "plan": plan},
        send_email=True,
        priority="high"
    )

async def notify_team_invite(user_id: str, inviter_name: str, workspace_name: str, invite_id: str):
    """Notify when user is invited to a team."""
    return await notify_user(
        user_id=user_id,
        title="Team Invitation",
        message=f'{inviter_name} invited you to join "{workspace_name}"',
        type="team_invite",
        link=f"/team?invite={invite_id}",
        metadata={"invite_id": invite_id, "workspace_name": workspace_name},
        send_email=True,
        priority="high"
    )

# ============================================
# EMAIL NOTIFICATION QUEUE
# ============================================

async def queue_email_notification(user_id: str, notification: dict):
    """Queue an email notification for sending."""
    # Store in email queue for processing
    await db.email_queue.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "notification_id": notification["id"],
        "title": notification["title"],
        "message": notification["message"],
        "type": notification["type"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    db = get_db()

@router.get("/email-queue")
async def get_email_queue(status: str = "pending", limit: int = 100):
    """Get pending email notifications (for email worker)."""
    queue = await db.email_queue.find(
        {"status": status}, {"_id": 0}
    ).sort("created_at", 1).to_list(limit)
    return {"queue": queue}
    db = get_db()

@router.put("/email-queue/{queue_id}/sent")
async def mark_email_sent(queue_id: str):
    """Mark an email notification as sent."""
    await db.email_queue.update_one(
        {"id": queue_id},
        {"$set": {"status": "sent", "sent_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True}
    db = get_db()

# ============================================
# NOTIFICATION STATS
# ============================================

@router.get("/stats")
async def get_notification_stats(user_id: str):
    """Get notification statistics for a user."""
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$category",
            "count": {"$sum": 1},
            "unread": {"$sum": {"$cond": [{"$eq": ["$is_read", False]}, 1, 0]}}
        }}
    ]
    
    stats_by_category = await db.notifications.aggregate(pipeline).to_list(20)
    
    total = await db.notifications.count_documents({"user_id": user_id})
    unread = await db.notifications.count_documents({"user_id": user_id, "is_read": False})
    
    return {
        "total": total,
        "unread": unread,
        "by_category": {s["_id"]: {"count": s["count"], "unread": s["unread"]} for s in stats_by_category}
    }
    db = get_db()
