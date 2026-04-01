"""
media_upload_router.py
Core Truth House OS — FastAPI Media Upload Routes
Stack: FastAPI / MongoDB

Routes:
  GET  /api/media-upload/health       — diagnostic endpoint
  POST /api/media-upload/upload-asset — upload file and get asset record
  GET  /api/media-upload/assets       — list workspace media assets
  PATCH /api/media-upload/assets/{id} — update asset label/category
  DELETE /api/media-upload/assets/{id} — delete an asset
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from datetime import datetime, timezone
from typing import Optional
import os
import uuid
import base64
from pathlib import Path

# Get MongoDB connection and UPLOAD_DIR
from backend.database import get_db, UPLOAD_DIR

router = APIRouter(prefix="/api/media-upload", tags=["media-upload"])

# Use absolute path for uploads directory
MEDIA_UPLOAD_DIR = UPLOAD_DIR / "media_assets"
MEDIA_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# R2 Configuration (optional)
R2_ACCOUNT_ID = os.getenv('R2_ACCOUNT_ID', '')
R2_ACCESS_KEY = os.getenv('R2_ACCESS_KEY_ID', '')
R2_SECRET = os.getenv('R2_SECRET_ACCESS_KEY', '')
R2_BUCKET = os.getenv('R2_BUCKET_NAME', '')
R2_PUBLIC_URL = os.getenv('R2_PUBLIC_URL', '')

def r2_available():
    return bool(R2_ACCOUNT_ID and R2_ACCESS_KEY and R2_SECRET and R2_BUCKET)

VALID_CONTEXTS = {
    'reference_image',
    'ai_twin',
    'brand_asset_reference',
    'logo_light',
    'logo_dark',
    'brand_asset',
    'icon',
    'pattern',
    'watermark',
    'font_file',
    'document',
    'content_source',
    'other',
}

VALID_TYPES = {
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'image/svg+xml', 'application/pdf',
    'font/ttf', 'font/woff', 'font/woff2',
}

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

@router.get("/health")
async def media_health_check():
    """Diagnostic endpoint — tells developer exactly what's configured."""
    r2_ok = r2_available()
    
    return {
        'status': 'operational',
        'upload_mode': 'r2' if r2_ok else 'local',
        'r2': {
            'configured': r2_ok,
            'bucket': R2_BUCKET or '(not set)',
            'public_url': R2_PUBLIC_URL or '(not set)',
        },
        'local': {
            'enabled': True,
            'upload_dir': str(MEDIA_UPLOAD_DIR),
        },
        'missing_env_vars': [
            v for v in ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL']
            if not os.getenv(v)
        ] if not r2_ok else [],
        'note': (
            'R2 cloud storage configured.' if r2_ok 
            else 'Using local file storage. Set R2 env vars for cloud storage.'
        ),
    }

@router.post("/upload-asset")
async def upload_asset(
    file: UploadFile = File(...),
    context: str = Form("brand_asset"),
    category: str = Form(""),
    label: str = Form(""),
    user_id: str = Form("default"),
    workspace_id: str = Form(""),
):
    """
    Upload a media asset file directly.
    Returns asset_id and preview_url for immediate use.
    """
    # Allow context to be the category if it's in VALID_CONTEXTS
    if context not in VALID_CONTEXTS:
        # Maybe context is actually the category
        if context in ['logo_light', 'logo_dark', 'icon', 'pattern', 'watermark', 'font_file', 'other']:
            category = context
            context = 'brand_asset'
        else:
            raise HTTPException(status_code=400, detail=f"Invalid context: {context}")
    
    # Check file type - allow fonts by extension
    file_ext = os.path.splitext(file.filename or '')[1].lower()
    is_font = file_ext in ['.ttf', '.woff', '.woff2']
    
    if file.content_type not in VALID_TYPES and not is_font:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")
    
    # Read file and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 20MB limit")
    
    # Generate unique asset ID and filename
    asset_id = str(uuid.uuid4()).replace("-", "")
    ext = os.path.splitext(file.filename)[1] or ".bin"
    stored_filename = f"{asset_id}{ext}"
    
    # Create context subdirectory
    context_dir = MEDIA_UPLOAD_DIR / context
    context_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_path = context_dir / stored_filename
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Generate preview URL (served by FastAPI static files or separate route)
    preview_url = f"/api/media-upload/files/{context}/{stored_filename}"
    
    # Auto-detect category from filename if not provided
    if not category:
        fn_lower = (file.filename or '').lower()
        if 'logo' in fn_lower and ('white' in fn_lower or 'light' in fn_lower):
            category = 'logo_light'
        elif 'logo' in fn_lower and ('dark' in fn_lower or 'black' in fn_lower):
            category = 'logo_dark'
        elif 'logo' in fn_lower:
            category = 'logo_light'
        elif 'icon' in fn_lower or 'favicon' in fn_lower:
            category = 'icon'
        elif 'pattern' in fn_lower or 'texture' in fn_lower:
            category = 'pattern'
        elif 'watermark' in fn_lower:
            category = 'watermark'
        elif is_font:
            category = 'font_file'
        else:
            category = 'other'
    
    # Auto-generate label from filename if not provided
    if not label:
        label = os.path.splitext(file.filename or '')[0]
    
    # Store asset record in MongoDB
    now = datetime.now(timezone.utc).isoformat()
    asset_doc = {
        "asset_id": asset_id,
        "workspace_id": workspace_id or "",
        "user_id": user_id,
        "filename": file.filename,
        "stored_filename": stored_filename,
        "file_type": file.content_type,
        "file_size": len(content),
        "context": context,
        "category": category,
        "label": label,
        "preview_url": preview_url,
        "storage_mode": "local",
        "status": "confirmed",
        "created_at": now,
        "updated_at": now,
    }
    
    await db.media_assets.insert_one(asset_doc)
    
    return {
        "asset_id": asset_id,
        "preview_url": preview_url,
        "filename": file.filename,
        "file_type": file.content_type,
        "file_size": len(content),
        "category": category,
        "label": label,
        "storage_mode": "local",
    }

@router.get("/files/{context}/{filename}")
async def serve_media_file(context: str, filename: str):
    """Serve uploaded media files."""
    from fastapi.responses import FileResponse
    
    file_path = MEDIA_UPLOAD_DIR / context / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Determine content type from extension
    ext = os.path.splitext(filename)[1].lower()
    content_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".pdf": "application/pdf",
    }
    content_type = content_types.get(ext, "application/octet-stream")
    
    return FileResponse(file_path, media_type=content_type)

@router.get("/assets")
async def list_assets(
    context: Optional[str] = None,
    category: Optional[str] = None,
    user_id: str = "default",
    workspace_id: str = "",
):
    """Returns all media assets for this user/workspace."""
    query = {"status": "confirmed"}
    if context:
        query["context"] = context
    if category:
        query["category"] = category
    if workspace_id:
        # Return assets scoped to this workspace OR orphaned (uploaded before
        # workspace context loaded). This fixes the race condition where
        # workspace_id is empty string on first upload but populated on load.
        # Also include 'default' as it's sometimes used as a placeholder.
        query["$or"] = [
            {"workspace_id": workspace_id},
            {"workspace_id": ""},
            {"workspace_id": "default"},
            {"workspace_id": {"$exists": False}},
        ]
    
    cursor = db.media_assets.find(query, {"_id": 0})
    assets = await cursor.to_list(200)
    
    return {
        "assets": [{
            "asset_id":     a.get("asset_id"),
            "filename":     a.get("filename"),
            "file_type":    a.get("file_type"),
            "file_size":    a.get("file_size"),
            "context":      a.get("context"),
            "category":     a.get("category", "other"),
            "label":        a.get("label", a.get("filename", "")),
            "preview_url":  a.get("preview_url"),
            "storage_mode": a.get("storage_mode", "local"),
            "created_at":   a.get("created_at"),
        } for a in assets]
    }

@router.patch("/assets/{asset_id}")
async def update_asset(asset_id: str, request: Request):
    """Update label and/or category of an uploaded asset."""
    body = await request.json()
    updates = {}
    if 'label' in body:
        updates['label'] = body['label']
    if 'category' in body:
        updates['category'] = body['category']
    
    if not updates:
        return {'updated': False}
    
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    # Match by asset_id only — no workspace scoping here so orphaned assets
    # can still be edited regardless of when they were uploaded
    result = await db.media_assets.update_one({'asset_id': asset_id}, {'$set': updates})
    return {'updated': result.modified_count > 0, 'asset_id': asset_id}
    db = get_db()

@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, user_id: str = "default"):
    """Deletes a media asset from storage and MongoDB."""
    # Find asset by asset_id regardless of workspace scope
    asset = await db.media_assets.find_one({"asset_id": asset_id}, {"_id": 0})
    if not asset:
        # Return success even if not found — prevents stuck delete buttons
        return {"deleted": True, "asset_id": asset_id, "note": "already_deleted"}
    
    # Delete file from disk
    context = asset.get("context", "")
    stored_filename = asset.get("stored_filename", "")
    if context and stored_filename:
        file_path = MEDIA_UPLOAD_DIR / context / stored_filename
        if file_path.exists():
            file_path.unlink()
    
    # Delete from MongoDB
    await db.media_assets.delete_one({"asset_id": asset_id})
    
    return {"deleted": True, "asset_id": asset_id}
    db = get_db()
