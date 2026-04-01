"""Social Media Manager routes - content calendar, posts, scheduling."""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone, timedelta
import uuid
import os
import logging

from backend.database import get_db, UPLOAD_DIR
from backend.routes.permissions import verify_workspace_access
from backend.services.ai import generate_with_ai

logger = logging.getLogger("cth.social")

router = APIRouter(prefix="/api/social")

SOCIAL_MEDIA_DIR = UPLOAD_DIR / "social"
SOCIAL_MEDIA_DIR.mkdir(exist_ok=True)

# ===================
# PYDANTIC MODELS
# ===================

class SocialPostCreate(BaseModel):
    content: str
    platform: str  # instagram, twitter, linkedin, facebook, tiktok
    media_urls: List[str] = []
    scheduled_for: Optional[str] = None  # ISO datetime
    status: str = "draft"  # draft, scheduled, published, failed
    hashtags: List[str] = []
    campaign_id: Optional[str] = None

class SocialPostUpdate(BaseModel):
    content: Optional[str] = None
    platform: Optional[str] = None
    media_urls: Optional[List[str]] = None
    scheduled_for: Optional[str] = None
    status: Optional[str] = None
    hashtags: Optional[List[str]] = None

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    platforms: List[str] = []
    status: str = "active"  # active, paused, completed

class ContentGenerateRequest(BaseModel):
    topic: str
    platform: str
    tone: str = "professional"
    include_hashtags: bool = True
    include_cta: bool = True

# Platform configurations
PLATFORMS = [
    {"id": "instagram", "name": "Instagram", "icon": "📸", "color": "#E1306C", "char_limit": 2200},
    {"id": "twitter", "name": "Twitter/X", "icon": "𝕏", "color": "#1DA1F2", "char_limit": 280},
    {"id": "linkedin", "name": "LinkedIn", "icon": "in", "color": "#0A66C2", "char_limit": 3000},
    {"id": "facebook", "name": "Facebook", "icon": "f", "color": "#1877F2", "char_limit": 63206},
    {"id": "tiktok", "name": "TikTok", "icon": "♪", "color": "#000000", "char_limit": 2200},
]

# ===================
# POSTS ENDPOINTS
# ===================

@router.get("/posts")
async def get_posts(
    user_id: str = "default",
    workspace_id: Optional[str] = None,
    platform: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100
):
    """Get all social media posts."""
    if workspace_id:
        await verify_workspace_access(workspace_id, user_id)
    
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id
    if platform:
        query["platform"] = platform
    if status:
        query["status"] = status
    if start_date and end_date:
        query["scheduled_for"] = {"$gte": start_date, "$lte": end_date}
    
    posts = await db.social_posts.find(query, {"_id": 0}).sort("scheduled_for", 1).to_list(limit)
    return {"posts": posts, "total": len(posts)}

@router.get("/posts/calendar")
async def get_calendar_view(
    user_id: str = "default",
    workspace_id: Optional[str] = None,
    year: int = None,
    month: int = None
):
    """Get posts organized by day for calendar view."""
    if year is None:
        year = datetime.now().year
    if month is None:
        month = datetime.now().month
    
    # Calculate date range for the month
    start_date = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    
    query = {
        "user_id": user_id,
        "scheduled_for": {
            "$gte": start_date.isoformat(),
            "$lt": end_date.isoformat()
        }
    }
    if workspace_id:
        query["workspace_id"] = workspace_id
    
    posts = await db.social_posts.find(query, {"_id": 0}).to_list(500)
    
    # Group by day
    calendar_data = {}
    for post in posts:
        if post.get("scheduled_for"):
            day = post["scheduled_for"][:10]  # Get YYYY-MM-DD
            if day not in calendar_data:
                calendar_data[day] = []
            calendar_data[day].append(post)
    
    return {
        "calendar": calendar_data,
        "year": year,
        "month": month,
        "total_posts": len(posts)
    }

@router.post("/posts")
async def create_post(data: SocialPostCreate, user_id: str = "default", workspace_id: Optional[str] = None):
    """Create a new social media post."""
    post_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "workspace_id": workspace_id,
        "content": data.content,
        "platform": data.platform,
        "media_urls": data.media_urls,
        "scheduled_for": data.scheduled_for,
        "status": data.status,
        "hashtags": data.hashtags,
        "campaign_id": data.campaign_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "published_at": None
    }
    
    await db.social_posts.insert_one(post_doc)
    post_doc.pop("_id", None)
    return {"success": True, "post": post_doc}
    db = get_db()

@router.put("/posts/{post_id}")
async def update_post(post_id: str, data: SocialPostUpdate, user_id: str = "default"):
    """Update a social media post."""
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.social_posts.update_one(
        {"id": post_id, "user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True, "message": "Post updated"}
    db = get_db()

@router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user_id: str = "default"):
    """Delete a social media post."""
    result = await db.social_posts.delete_one({"id": post_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"success": True, "message": "Post deleted"}
    db = get_db()

@router.post("/posts/{post_id}/publish")
async def publish_post(post_id: str, user_id: str = "default"):
    """Mark a post as published (actual publishing would require platform APIs)."""
    result = await db.social_posts.update_one(
        {"id": post_id, "user_id": user_id},
        {"$set": {
            "status": "published",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"success": True, "message": "Post marked as published"}
    db = get_db()

# ===================
# CAMPAIGNS ENDPOINTS
# ===================

@router.get("/campaigns")
async def get_campaigns(user_id: str = "default", workspace_id: Optional[str] = None):
    """Get all campaigns."""
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id
    
    campaigns = await db.social_campaigns.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    # Count posts per campaign
    for campaign in campaigns:
        post_count = await db.social_posts.count_documents({"campaign_id": campaign["id"]})
        campaign["post_count"] = post_count
    
    return {"campaigns": campaigns}
    db = get_db()

@router.post("/campaigns")
async def create_campaign(data: CampaignCreate, user_id: str = "default", workspace_id: Optional[str] = None):
    """Create a new campaign."""
    campaign_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "workspace_id": workspace_id,
        "name": data.name,
        "description": data.description,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "platforms": data.platforms,
        "status": data.status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.social_campaigns.insert_one(campaign_doc)
    campaign_doc.pop("_id", None)
    return {"success": True, "campaign": campaign_doc}
    db = get_db()

@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user_id: str = "default"):
    """Delete a campaign and optionally its posts."""
    result = await db.social_campaigns.delete_one({"id": campaign_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"success": True, "message": "Campaign deleted"}
    db = get_db()

# ===================
# AI CONTENT GENERATION
# ===================

@router.post("/generate")
async def generate_social_content(data: ContentGenerateRequest, user_id: str = "default"):
    """Generate social media content using AI."""
    platform_config = next((p for p in PLATFORMS if p["id"] == data.platform), PLATFORMS[0])
    
    prompt = f"""Generate a {data.platform} post about: {data.topic}

Requirements:
- Tone: {data.tone}
- Character limit: {platform_config['char_limit']} characters
- Platform: {platform_config['name']}
{"- Include 3-5 relevant hashtags" if data.include_hashtags else ""}
{"- Include a clear call-to-action" if data.include_cta else ""}

Format your response as:
CONTENT:
[The post content here]

{"HASHTAGS:" if data.include_hashtags else ""}
{"[hashtags here, comma-separated]" if data.include_hashtags else ""}

Make the content engaging, authentic, and optimized for {data.platform}."""

    try:
        result = await generate_with_ai(prompt)
        
        # Parse response
        content = result
        hashtags = []
        
        if "CONTENT:" in result:
            parts = result.split("HASHTAGS:")
            content = parts[0].replace("CONTENT:", "").strip()
            if len(parts) > 1:
                hashtags = [h.strip().replace("#", "") for h in parts[1].split(",") if h.strip()]
        
        return {
            "success": True,
            "generated_content": content,
            "hashtags": hashtags,
            "platform": data.platform,
            "char_count": len(content)
        }
    except Exception as e:
        logger.error(f"Social content generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================
# PLATFORMS CONFIG
# ===================

@router.get("/platforms")
async def get_platforms():
    """Get supported social media platforms."""
    return {"platforms": PLATFORMS}

# ===================
# ANALYTICS
# ===================

@router.get("/analytics")
async def get_social_analytics(
    user_id: str = "default",
    workspace_id: Optional[str] = None,
    days: int = 30
):
    """Get social media analytics."""
    query = {"user_id": user_id}
    if workspace_id:
        query["workspace_id"] = workspace_id
    
    # Posts by platform
    platform_pipeline = [
        {"$match": query},
        {"$group": {"_id": "$platform", "count": {"$sum": 1}}}
    ]
    posts_by_platform = {}
    async for item in db.social_posts.aggregate(platform_pipeline):
        posts_by_platform[item["_id"]] = item["count"]
    
    # Posts by status
    status_pipeline = [
        {"$match": query},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    posts_by_status = {}
    async for item in db.social_posts.aggregate(status_pipeline):
        posts_by_status[item["_id"]] = item["count"]
    
    # Posts scheduled this week
    start_of_week = datetime.now(timezone.utc) - timedelta(days=datetime.now().weekday())
    end_of_week = start_of_week + timedelta(days=7)
    
    scheduled_this_week = await db.social_posts.count_documents({
        **query,
        "scheduled_for": {
            "$gte": start_of_week.isoformat(),
            "$lt": end_of_week.isoformat()
        }
    })
    
    return {
        "posts_by_platform": posts_by_platform,
        "posts_by_status": posts_by_status,
        "scheduled_this_week": scheduled_this_week,
        "total_posts": sum(posts_by_platform.values()),
        "total_published": posts_by_status.get("published", 0),
        "total_scheduled": posts_by_status.get("scheduled", 0),
        "total_drafts": posts_by_status.get("draft", 0)
    }

# ===================
# MEDIA UPLOAD
# ===================

ALLOWED_MEDIA = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".mov", ".avi"}

@router.post("/upload-media")
async def upload_social_media(
    file: UploadFile = File(...),
    user_id: str = "default",
):
    """Upload an image or video for use in social media posts."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_MEDIA:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not supported. Use: {', '.join(ALLOWED_MEDIA)}")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")

    file_id = uuid.uuid4().hex[:12]
    safe_name = f"social_{file_id}{ext}"
    filepath = SOCIAL_MEDIA_DIR / safe_name

    with open(filepath, "wb") as f:
        f.write(content)

    file_url = f"/api/assets/file/{safe_name}"
    is_video = ext in {".mp4", ".mov", ".avi"}

    return {
        "success": True,
        "file_url": file_url,
        "filename": file.filename,
        "media_type": "video" if is_video else "image",
        "file_size": len(content),
    }
