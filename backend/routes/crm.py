from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
import uuid

from fastapi import APIRouter, HTTPException, Query, Request, status
from pydantic import BaseModel, Field

from backend.database import get_db
from backend.dependencies.auth_context import (
    require_workspace_admin,
    require_workspace_member,
)

router = APIRouter(prefix="/api/crm", tags=["crm"])

CONTACT_COLLECTION_CANDIDATES = ["crm_contacts", "contacts"]
DEAL_COLLECTION_CANDIDATES = ["crm_deals", "deals"]
ACTIVITY_COLLECTION_CANDIDATES = ["crm_activities", "activities"]
NOTE_COLLECTION_CANDIDATES = ["crm_notes", "notes"]


class ContactCreate(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    full_name: str | None = Field(default=None, max_length=200)
    email: str | None = Field(default=None, max_length=320)
    phone: str | None = Field(default=None, max_length=50)
    company: str | None = Field(default=None, max_length=200)
    title: str | None = Field(default=None, max_length=200)
    status: str | None = Field(default="lead", max_length=50)
    source: str | None = Field(default=None, max_length=200)
    tags: list[str] = Field(default_factory=list)


class DealCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    contact_id: str | None = None
    stage: str | None = Field(default="lead", max_length=50)
    status: str | None = Field(default="open", max_length=50)
    value_cents: int = Field(default=0, ge=0)
    currency: str = Field(default="USD", max_length=10)
    expected_close_date: str | None = None
    notes: str | None = Field(default=None, max_length=10000)


class ActivityCreate(BaseModel):
    type: str = Field(..., min_length=1, max_length=50)
    subject: str | None = Field(default=None, max_length=200)
    contact_id: str | None = None
    deal_id: str | None = None
    status: str | None = Field(default="completed", max_length=50)
    occurred_at: str | None = None
    details: str | None = Field(default=None, max_length=10000)


class NoteCreate(BaseModel):
    entity_type: str = Field(..., min_length=1, max_length=50)
    entity_id: str = Field(..., min_length=1, max_length=200)
    body: str = Field(..., min_length=1, max_length=10000)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_id() -> str:
    return str(uuid.uuid4())


def _iso(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _clean_doc(doc: dict[str, Any] | None) -> dict[str, Any]:
    if not doc:
        return {}
    clean = dict(doc)
    clean.pop("_id", None)
    for key, value in list(clean.items()):
        clean[key] = _iso(value)
    return clean


def _normalize_status(value: str | None, default: str) -> str:
    normalized = str(value or "").strip().lower()
    return normalized or default


def _normalize_datetime(value: str | None) -> str | None:
    if not value:
        return None
    try:
      return datetime.fromisoformat(str(value).replace("Z", "+00:00")).isoformat()
    except Exception as exc:
      raise HTTPException(status_code=400, detail=f"Invalid ISO datetime: {value}") from exc


def _workspace_id_from_request(request: Request, require_admin: bool = False) -> str:
    context = require_workspace_admin(request) if require_admin else require_workspace_member(request)
    workspace_id = str(context.get("workspace_id") or "").strip()
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Workspace context required")
    return workspace_id


def _user_id_from_request(request: Request, require_admin: bool = False) -> str:
    context = require_workspace_admin(request) if require_admin else require_workspace_member(request)
    user_id = str(context.get("user_id") or "").strip()
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id


async def _get_collection(candidates: list[str]):
    db = get_db()
    names = set(await db.list_collection_names())
    for candidate in candidates:
        if candidate in names:
            return db[candidate]
    return db[candidates[0]]


async def _contacts():
    return await _get_collection(CONTACT_COLLECTION_CANDIDATES)


async def _deals():
    return await _get_collection(DEAL_COLLECTION_CANDIDATES)


async def _activities():
    return await _get_collection(ACTIVITY_COLLECTION_CANDIDATES)


async def _notes():
    return await _get_collection(NOTE_COLLECTION_CANDIDATES)


async def _ensure_indexes() -> None:
    contacts = await _contacts()
    deals = await _deals()
    activities = await _activities()
    notes = await _notes()

    await contacts.create_index("id", unique=True, name="crm_contacts_id_unique")
    await contacts.create_index([("workspace_id", 1), ("updated_at", -1)], name="crm_contacts_workspace_updated_idx")

    await deals.create_index("id", unique=True, name="crm_deals_id_unique")
    await deals.create_index([("workspace_id", 1), ("updated_at", -1)], name="crm_deals_workspace_updated_idx")

    await activities.create_index("id", unique=True, name="crm_activities_id_unique")
    await activities.create_index([("workspace_id", 1), ("occurred_at", -1)], name="crm_activities_workspace_occurred_idx")

    await notes.create_index("id", unique=True, name="crm_notes_id_unique")
    await notes.create_index([("workspace_id", 1), ("created_at", -1)], name="crm_notes_workspace_created_idx")


def _match_search(search: str, fields: list[str]) -> list[dict[str, Any]]:
    return [{field: {"$regex": search, "$options": "i"}} for field in fields]


@router.get("/dashboard/summary")
async def get_crm_dashboard_summary(request: Request):
    workspace_id = _workspace_id_from_request(request)

    contacts = await _contacts()
    deals = await _deals()

    contacts_count = await contacts.count_documents({"workspace_id": workspace_id})
    deals_count = await deals.count_documents({"workspace_id": workspace_id})
    open_deals = await deals.count_documents(
        {
            "workspace_id": workspace_id,
            "status": {"$in": ["open", "active"]},
        }
    )

    open_pipeline = await deals.aggregate(
        [
            {"$match": {"workspace_id": workspace_id, "status": {"$in": ["open", "active"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$value_cents"}}},
        ]
    ).to_list(length=1)

    won_pipeline = await deals.aggregate(
        [
            {"$match": {"workspace_id": workspace_id, "status": {"$in": ["won", "closed_won"]}}},
            {"$group": {"_id": None, "total": {"$sum": "$value_cents"}}},
        ]
    ).to_list(length=1)

    return {
        "contacts": contacts_count,
        "deals": deals_count,
        "open_deals": open_deals,
        "open_pipeline_dollars": round((open_pipeline[0]["total"] if open_pipeline else 0) / 100, 2),
        "won_revenue_dollars": round((won_pipeline[0]["total"] if won_pipeline else 0) / 100, 2),
    }


@router.get("/contacts")
async def list_contacts(
    request: Request,
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
):
    workspace_id = _workspace_id_from_request(request)
    contacts = await _contacts()

    query: dict[str, Any] = {"workspace_id": workspace_id}

    if status:
        query["status"] = _normalize_status(status, "lead")

    if search:
        query["$or"] = _match_search(
            search,
            ["first_name", "last_name", "full_name", "email", "phone", "company", "title"],
        )

    docs = await contacts.find(query, {"_id": 0}).sort("updated_at", -1).limit(limit).to_list(length=limit)
    return {"contacts": [_clean_doc(doc) for doc in docs], "total": len(docs)}


@router.post("/contacts", status_code=status.HTTP_201_CREATED)
async def create_contact(request: Request, payload: ContactCreate):
    workspace_id = _workspace_id_from_request(request, require_admin=True)
    user_id = _user_id_from_request(request, require_admin=True)
    await _ensure_indexes()
    contacts = await _contacts()

    now = _utcnow()
    doc = {
        "id": _new_id(),
        "workspace_id": workspace_id,
        "created_by": user_id,
        "updated_by": user_id,
        "first_name": (payload.first_name or "").strip() or None,
        "last_name": (payload.last_name or "").strip() or None,
        "full_name": (payload.full_name or "").strip() or None,
        "email": (payload.email or "").strip().lower() or None,
        "phone": (payload.phone or "").strip() or None,
        "company": (payload.company or "").strip() or None,
        "title": (payload.title or "").strip() or None,
        "status": _normalize_status(payload.status, "lead"),
        "source": (payload.source or "").strip() or None,
        "tags": [str(item).strip() for item in payload.tags if str(item).strip()],
        "created_at": now,
        "updated_at": now,
    }

    if not doc["full_name"]:
        first = doc["first_name"] or ""
        last = doc["last_name"] or ""
        doc["full_name"] = f"{first} {last}".strip() or None

    await contacts.insert_one(doc)
    return {"contact": _clean_doc(doc)}


@router.delete("/contacts/{contact_id}")
async def delete_contact(request: Request, contact_id: str):
    workspace_id = _workspace_id_from_request(request, require_admin=True)
    contacts = await _contacts()

    result = await contacts.delete_one({"id": contact_id, "workspace_id": workspace_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")

    return {"success": True, "deleted_id": contact_id}


@router.get("/deals")
async def list_deals(
    request: Request,
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    stage: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
):
    workspace_id = _workspace_id_from_request(request)
    deals = await _deals()

    query: dict[str, Any] = {"workspace_id": workspace_id}

    if status:
        query["status"] = _normalize_status(status, "open")
    if stage:
        query["stage"] = _normalize_status(stage, "lead")
    if search:
        query["$or"] = _match_search(search, ["title", "notes", "stage", "status"])

    docs = await deals.find(query, {"_id": 0}).sort("updated_at", -1).limit(limit).to_list(length=limit)
    return {"deals": [_clean_doc(doc) for doc in docs], "total": len(docs)}


@router.post("/deals", status_code=status.HTTP_201_CREATED)
async def create_deal(request: Request, payload: DealCreate):
    workspace_id = _workspace_id_from_request(request, require_admin=True)
    user_id = _user_id_from_request(request, require_admin=True)
    await _ensure_indexes()
    deals = await _deals()

    now = _utcnow()
    doc = {
        "id": _new_id(),
        "workspace_id": workspace_id,
        "created_by": user_id,
        "updated_by": user_id,
        "title": payload.title.strip(),
        "contact_id": (payload.contact_id or "").strip() or None,
        "stage": _normalize_status(payload.stage, "lead"),
        "status": _normalize_status(payload.status, "open"),
        "value_cents": int(payload.value_cents or 0),
        "currency": payload.currency.strip().upper(),
        "expected_close_date": payload.expected_close_date or None,
        "notes": (payload.notes or "").strip() or None,
        "created_at": now,
        "updated_at": now,
    }

    await deals.insert_one(doc)
    return {"deal": _clean_doc(doc)}


@router.delete("/deals/{deal_id}")
async def delete_deal(request: Request, deal_id: str):
    workspace_id = _workspace_id_from_request(request, require_admin=True)
    deals = await _deals()

    result = await deals.delete_one({"id": deal_id, "workspace_id": workspace_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")

    return {"success": True, "deleted_id": deal_id}


@router.get("/activities")
async def list_activities(
    request: Request,
    limit: int = Query(default=200, ge=1, le=1000),
):
    workspace_id = _workspace_id_from_request(request)
    activities = await _activities()

    docs = await activities.find(
        {"workspace_id": workspace_id},
        {"_id": 0},
    ).sort("occurred_at", -1).limit(limit).to_list(length=limit)

    return {"activities": [_clean_doc(doc) for doc in docs], "total": len(docs)}


@router.post("/activities", status_code=status.HTTP_201_CREATED)
async def create_activity(request: Request, payload: ActivityCreate):
    workspace_id = _workspace_id_from_request(request, require_admin=True)
    user_id = _user_id_from_request(request, require_admin=True)
    await _ensure_indexes()
    activities = await _activities()

    now = _utcnow()
    doc = {
        "id": _new_id(),
        "workspace_id": workspace_id,
        "created_by": user_id,
        "updated_by": user_id,
        "type": payload.type.strip().lower(),
        "subject": (payload.subject or "").strip() or None,
        "contact_id": (payload.contact_id or "").strip() or None,
        "deal_id": (payload.deal_id or "").strip() or None,
        "status": _normalize_status(payload.status, "completed"),
        "occurred_at": _normalize_datetime(payload.occurred_at) or now.isoformat(),
        "details": (payload.details or "").strip() or None,
        "created_at": now,
        "updated_at": now,
    }

    await activities.insert_one(doc)
    return {"activity": _clean_doc(doc)}


@router.get("/notes")
async def list_notes(
    request: Request,
    limit: int = Query(default=200, ge=1, le=1000),
):
    workspace_id = _workspace_id_from_request(request)
    notes = await _notes()

    docs = await notes.find(
        {"workspace_id": workspace_id},
        {"_id": 0},
    ).sort("created_at", -1).limit(limit).to_list(length=limit)

    return {"notes": [_clean_doc(doc) for doc in docs], "total": len(docs)}


@router.post("/notes", status_code=status.HTTP_201_CREATED)
async def create_note(request: Request, payload: NoteCreate):
    workspace_id = _workspace_id_from_request(request, require_admin=True)
    user_id = _user_id_from_request(request, require_admin=True)
    await _ensure_indexes()
    notes = await _notes()

    entity_type = payload.entity_type.strip().lower()
    if entity_type not in {"contact", "deal"}:
        raise HTTPException(status_code=400, detail="entity_type must be 'contact' or 'deal'")

    now = _utcnow()
    doc = {
        "id": _new_id(),
        "workspace_id": workspace_id,
        "created_by": user_id,
        "updated_by": user_id,
        "entity_type": entity_type,
        "entity_id": payload.entity_id.strip(),
        "body": payload.body.strip(),
        "created_at": now,
        "updated_at": now,
    }

    await notes.insert_one(doc)
    return {"note": _clean_doc(doc)}
