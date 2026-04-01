"""Weekly Digest routes — preview, send, and preference management."""
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Query
from backend.database import get_db
from services import send_email
from backend.services.email_templates import weekly_digest_email

router = APIRouter(prefix="/api/digest", tags=["digest"])

async def _aggregate_digest_data(user_id: str):
    """Fetch all data needed for the weekly digest."""
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    week_ahead = now + timedelta(days=7)
    week_label = f"{now.strftime('%b %d')} — {week_ahead.strftime('%b %d, %Y')}"

    # Upcoming events (next 7 days)
    events_cursor = db.calendar_events.find(
        {"user_id": user_id, "start_time": {"$gte": now.isoformat(), "$lte": week_ahead.isoformat()}},
        {"_id": 0},
    ).sort("start_time", 1).limit(5)
    upcoming_events = await events_cursor.to_list(5)

    # Recent blog posts (last 7 days)
    posts_cursor = db.blog_articles.find(
        {"user_id": user_id},
        {"_id": 0, "title": 1, "status": 1, "created_at": 1},
    ).sort("created_at", -1).limit(5)
    recent_posts = await posts_cursor.to_list(5)

    # CRM analytics
    pipeline_cursor = db.crm_deals.find({"user_id": user_id}, {"_id": 0, "value": 1})
    deals = await pipeline_cursor.to_list(1000)
    pipeline_value = sum(d.get("value", 0) for d in deals)
    total_deals = len(deals)
    total_contacts = await db.crm_contacts.count_documents({"user_id": user_id})

    # New contacts this week
    new_contacts_count = await db.crm_contacts.count_documents(
        {"user_id": user_id, "created_at": {"$gte": week_ago.isoformat()}}
    )

    # Published posts this week
    published_posts_count = await db.blog_articles.count_documents(
        {"user_id": user_id, "status": "published", "published_at": {"$gte": week_ago.isoformat()}}
    )

    # AI generation count this week
    generation_count = await db.usage_logs.count_documents(
        {"user_id": user_id, "created_at": {"$gte": week_ago.isoformat()}}
    )

    return {
        "week_label": week_label,
        "upcoming_events": upcoming_events,
        "recent_posts": recent_posts,
        "pipeline_value": pipeline_value,
        "total_contacts": total_contacts,
        "total_deals": total_deals,
        "new_contacts_count": new_contacts_count,
        "published_posts_count": published_posts_count,
        "generation_count": generation_count,
    }

# -----------------------------------------------------------
# Preferences
# -----------------------------------------------------------

@router.get("/preferences")
async def get_preferences(user_id: str = Query(...)):
    """Return digest preferences for the user."""
    prefs = await db.digest_preferences.find_one(
        {"user_id": user_id}, {"_id": 0}
    )
    if not prefs:
        prefs = {
            "user_id": user_id,
            "enabled": False,
            "email": "",
            "day_of_week": "monday",
            "include_events": True,
            "include_blog": True,
            "include_crm": True,
            "include_usage": True,
            "user_name": "",
        }
    return prefs
    db = get_db()

@router.put("/preferences")
async def update_preferences(body: dict, user_id: str = Query(...)):
    """Create or update digest preferences."""
    allowed = {
        "enabled", "email", "day_of_week", "include_events",
        "include_blog", "include_crm", "include_usage", "user_name",
    }
    update = {k: v for k, v in body.items() if k in allowed}
    update["user_id"] = user_id
    update["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.digest_preferences.update_one(
        {"user_id": user_id},
        {"$set": update},
        upsert=True,
    )
    return {"status": "saved", **update}

# -----------------------------------------------------------
# Preview & Send
# -----------------------------------------------------------

@router.get("/preview")
async def preview_digest(user_id: str = Query(...)):
    """Generate and return the digest HTML for preview."""
    prefs = await db.digest_preferences.find_one(
        {"user_id": user_id}, {"_id": 0}
    )
    user_name = (prefs or {}).get("user_name", "") or "there"
    data = await _aggregate_digest_data(user_id)
    email = weekly_digest_email(user_name=user_name, **data)
    return {"html": email["html"], "subject": email["subject"], "data": data}
    db = get_db()

@router.post("/send")
async def send_digest(body: dict, user_id: str = Query(...)):
    """Send the weekly digest email now."""
    prefs = await db.digest_preferences.find_one(
        {"user_id": user_id}, {"_id": 0}
    )
    if not prefs or not prefs.get("email"):
        return {"status": "error", "message": "No email configured. Set your digest email in preferences."}
    db = get_db()

    user_name = prefs.get("user_name", "") or "there"
    data = await _aggregate_digest_data(user_id)
    email = weekly_digest_email(user_name=user_name, **data)

    result = await send_email(
        to=prefs["email"],
        subject=email["subject"],
        html=email["html"],
    )

    # Log the send
    await db.digest_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "email": prefs["email"],
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "result": result.get("status", "unknown"),
    })

    return {"status": "sent", "result": result, "subject": email["subject"]}

@router.get("/history")
async def digest_history(user_id: str = Query(...), limit: int = 10):
    """Return recent digest send history."""
    cursor = db.digest_logs.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("sent_at", -1).limit(limit)
    logs = await cursor.to_list(limit)
    return {"history": logs, "total": len(logs)}
    db = get_db()
