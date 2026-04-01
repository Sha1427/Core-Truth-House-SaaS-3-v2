from __future__ import annotations

import logging
import mimetypes
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from backend.database import UPLOAD_DIR, get_db
from backend.dependencies.auth_context import (
    get_request_context,
    require_authenticated_user,
    require_workspace_admin,
    require_workspace_member,
)

logger = logging.getLogger("cth.documents")
router = APIRouter(prefix="/api/documents", tags=["documents"])

DOCUMENTS_DIR = UPLOAD_DIR / "documents"
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _iso(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _clean_doc(doc: dict[str, Any]) -> dict[str, Any]:
    clean = dict(doc)
    clean.pop("_id", None)
    for key in (
        "created_at",
        "updated_at",
        "deleted_at",
        "archived_at",
    ):
        if key in clean:
            clean[key] = _iso(clean[key])
    return clean


def _safe_filename(filename: str) -> str:
    name = Path(filename).name.strip()
    if not name:
        return "document.bin"
    return name.replace(" ", "_")


def _workspace_dir(workspace_id: str) -> Path:
    path = DOCUMENTS_DIR / workspace_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def _guess_content_type(filename: str) -> str:
    content_type, _ = mimetypes.guess_type(filename)
    return content_type or "application/octet-stream"


class DocumentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str = Field(default="", max_length=5000)
    category: str = Field(default="general", max_length=100)
    tags: list[str] = Field(default_factory=list)
    is_public: bool = False


class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=300)
    description: Optional[str] = Field(default=None, max_length=5000)
    category: Optional[str] = Field(default=None, max_length=100)
    tags: Optional[list[str]] = None
    is_public: Optional[bool] = None
    is_archived: Optional[bool] = None


async def _get_document_or_404(document_id: str) -> dict[str, Any]:
    db = get_db()
    document = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


def _assert_workspace_scope(request: Request, workspace_id: str) -> dict[str, Any]:
    context = get_request_context(request)

    if context["is_super_admin"]:
        return context

    current_workspace_id = context.get("workspace_id")
    if current_workspace_id != workspace_id:
        raise HTTPException(
            status_code=403,
            detail="Workspace path does not match authenticated workspace context",
        )

    return context


@router.get("")
async def list_documents(
    request: Request,
    category: Optional[str] = Query(default=None),
    tag: Optional[str] = Query(default=None),
    include_archived: bool = Query(default=False),
):
    require_workspace_member(request)
    context = get_request_context(request)

    workspace_id = context.get("workspace_id")
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Workspace context required")

    db = get_db()
    query: dict[str, Any] = {
        "workspace_id": workspace_id,
        "is_deleted": {"$ne": True},
    }

    if not include_archived:
        query["is_archived"] = {"$ne": True}

    if category:
        query["category"] = category

    if tag:
        query["tags"] = tag

    documents = await db.documents.find(
        query,
        {"_id": 0},
    ).sort("updated_at", -1).to_list(length=500)

    return {
        "documents": [_clean_doc(doc) for doc in documents],
        "total": len(documents),
    }


@router.get("/{document_id}")
async def get_document(document_id: str, request: Request):
    require_workspace_member(request)
    document = await _get_document_or_404(document_id)
    _assert_workspace_scope(request, str(document["workspace_id"]))

    return _clean_doc(document)


@router.post("")
async def create_document(
    request: Request,
    data: DocumentCreate,
):
    require_workspace_admin(request)
    context = get_request_context(request)

    workspace_id = context.get("workspace_id")
    user_id = context.get("user_id")

    if not workspace_id or not user_id:
        raise HTTPException(status_code=400, detail="Missing authenticated workspace context")

    db = get_db()
    now = _utcnow()

    document_id = str(uuid.uuid4())
    doc = {
        "document_id": document_id,
        "workspace_id": str(workspace_id),
        "created_by": str(user_id),
        "updated_by": str(user_id),
        "title": data.title,
        "description": data.description,
        "category": data.category,
        "tags": data.tags,
        "is_public": data.is_public,
        "is_archived": False,
        "is_deleted": False,
        "file_url": None,
        "stored_filename": None,
        "original_filename": None,
        "content_type": None,
        "size_bytes": 0,
        "created_at": now,
        "updated_at": now,
        "deleted_at": None,
        "archived_at": None,
    }

    await db.documents.insert_one(doc)
    return _clean_doc(doc)


@router.put("/{document_id}")
async def update_document(
    document_id: str,
    request: Request,
    data: DocumentUpdate,
):
    require_workspace_admin(request)
    document = await _get_document_or_404(document_id)
    context = _assert_workspace_scope(request, str(document["workspace_id"]))

    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    if "is_archived" in updates:
        updates["archived_at"] = _utcnow() if updates["is_archived"] else None

    updates["updated_at"] = _utcnow()
    updates["updated_by"] = str(context["user_id"])

    db = get_db()
    await db.documents.update_one(
        {"document_id": document_id},
        {"$set": updates},
    )

    updated = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    return _clean_doc(updated)


@router.delete("/{document_id}")
async def delete_document(document_id: str, request: Request):
    require_workspace_admin(request)
    document = await _get_document_or_404(document_id)
    context = _assert_workspace_scope(request, str(document["workspace_id"]))

    db = get_db()
    await db.documents.update_one(
        {"document_id": document_id},
        {
            "$set": {
                "is_deleted": True,
                "deleted_at": _utcnow(),
                "updated_at": _utcnow(),
                "updated_by": str(context["user_id"]),
            }
        },
    )

    return {"deleted": True, "document_id": document_id}


@router.post("/{document_id}/upload")
async def upload_document_file(
    document_id: str,
    request: Request,
    file: UploadFile = File(...),
):
    require_workspace_admin(request)
    document = await _get_document_or_404(document_id)
    _assert_workspace_scope(request, str(document["workspace_id"]))

    workspace_id = str(document["workspace_id"])
    workspace_dir = _workspace_dir(workspace_id)

    original_name = _safe_filename(file.filename or "document.bin")
    ext = Path(original_name).suffix or ".bin"
    stored_filename = f"doc_{document_id[:8]}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = workspace_dir / stored_filename

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    content_type = file.content_type or _guess_content_type(original_name)
    file_url = f"/api/documents/{document_id}/download"

    db = get_db()
    await db.documents.update_one(
        {"document_id": document_id},
        {
            "$set": {
                "original_filename": original_name,
                "stored_filename": stored_filename,
                "content_type": content_type,
                "size_bytes": len(content),
                "file_url": file_url,
                "updated_at": _utcnow(),
            }
        },
    )

    updated = await db.documents.find_one({"document_id": document_id}, {"_id": 0})
    return _clean_doc(updated)


@router.get("/{document_id}/download")
async def download_document(document_id: str, request: Request):
    require_workspace_member(request)
    document = await _get_document_or_404(document_id)
    _assert_workspace_scope(request, str(document["workspace_id"]))

    stored_filename = document.get("stored_filename")
    if not stored_filename:
        raise HTTPException(status_code=404, detail="No file attached to this document")

    file_path = _workspace_dir(str(document["workspace_id"])) / str(stored_filename)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File missing on server")

    original_filename = document.get("original_filename") or file_path.name
    content_type = document.get("content_type") or _guess_content_type(original_filename)

    return FileResponse(
        path=str(file_path),
        filename=str(original_filename),
        media_type=content_type,
    )


@router.get("/admin/all")
async def admin_list_all_documents(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
):
    from backend.dependencies.auth_context import require_super_admin

    require_super_admin(request)
    db = get_db()

    query: dict[str, Any] = {"is_deleted": {"$ne": True}}
    if workspace_id:
        query["workspace_id"] = workspace_id

    documents = await db.documents.find(
        query,
        {"_id": 0},
    ).sort("updated_at", -1).to_list(length=1000)

    return {
        "documents": [_clean_doc(doc) for doc in documents],
        "total": len(documents),
    }
