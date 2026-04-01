"""Upload routes — file upload and media asset management."""
import os
import uuid
import shutil
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "cth_app")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOAD_DIR = "/app/backend/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Max file sizes by type (bytes)
SIZE_LIMITS = {
    "image/": 20 * 1024 * 1024,
    "video/": 500 * 1024 * 1024,
    "application/pdf": 50 * 1024 * 1024,
    "default": 20 * 1024 * 1024,
}

FOLDER_MAP = {
    "image/": "images",
    "video/": "videos",
    "application/": "documents",
    "text/": "documents",
}


def get_folder(mime_type: str) -> str:
    for prefix, folder in FOLDER_MAP.items():
        if mime_type.startswith(prefix):
            return folder
    return "uploads"


def get_max_size(mime_type: str) -> int:
    for prefix, limit in SIZE_LIMITS.items():
        if prefix != "default" and mime_type.startswith(prefix):
            return limit
    return SIZE_LIMITS["default"]


@router.post("/file")
async def upload_file(file: UploadFile = File(...)):
    asset_id = str(uuid.uuid4())[:16]
    content_type = file.content_type or "application/octet-stream"
    folder = get_folder(content_type)

    # Read file
    contents = await file.read()
    file_size = len(contents)

    # Validate size
    max_size = get_max_size(content_type)
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {max_size // (1024 * 1024)}MB.",
        )

    # Save to disk
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "bin"
    storage_key = f"{folder}/{asset_id}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, folder)
    os.makedirs(file_path, exist_ok=True)
    full_path = os.path.join(UPLOAD_DIR, storage_key)

    with open(full_path, "wb") as f:
        f.write(contents)

    # Build URL
    backend_url = os.environ.get("REACT_APP_BACKEND_URL", "")
    if not backend_url:
        backend_url = ""
    asset_url = f"{backend_url}/api/upload/serve/{storage_key}"
    thumbnail_url = asset_url if content_type.startswith("image/") else None

    now = datetime.now(timezone.utc).isoformat()

    # Save record to MongoDB
    record = {
        "id": asset_id,
        "name": file.filename,
        "type": content_type,
        "size": file_size,
        "url": asset_url,
        "thumbnailUrl": thumbnail_url,
        "storageKey": storage_key,
        "context": "general",
        "uploadedAt": now,
    }
    await db.media_assets.insert_one(record)

    return {
        "id": asset_id,
        "name": file.filename,
        "type": content_type,
        "size": file_size,
        "url": asset_url,
        "thumbnailUrl": thumbnail_url,
        "uploadedAt": now,
    }


@router.get("/serve/{folder}/{filename}")
async def serve_file(folder: str, filename: str):
    from fastapi.responses import FileResponse

    file_path = os.path.join(UPLOAD_DIR, folder, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@router.get("/assets")
async def list_assets(
    user_id: str = Query(None),
    context: str = Query(None),
    limit: int = Query(50),
):
    query = {}
    if user_id:
        query["uploadedBy"] = user_id
    if context:
        query["context"] = context

    cursor = db.media_assets.find(query, {"_id": 0}).sort("uploadedAt", -1).limit(limit)
    assets = await cursor.to_list(length=limit)
    return {"assets": assets}


@router.delete("/{asset_id}")
async def delete_asset(asset_id: str):
    record = await db.media_assets.find_one({"id": asset_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Delete file from disk
    file_path = os.path.join(UPLOAD_DIR, record.get("storageKey", ""))
    if os.path.exists(file_path):
        os.remove(file_path)

    await db.media_assets.delete_one({"id": asset_id})
    return {"success": True}
