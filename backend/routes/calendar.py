from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any
import uuid

from fastapi import APIRouter, HTTPException, Query, Request, status
from pydantic import BaseModel, Field

from backend.database import get_db
from backend.dependencies.auth_context import (
    require_workspace_admin,
    require_workspace_member,
)

router = APIRouter(prefix="/api/calendar", tags=["calendar"])

CALENDAR_COLLECTION_CANDIDATES = ["calendar_events", "events"]

EVENT_CATEGORIES = [
    {"id": "general", "name": "General", "color": "#4a3550"},
    {"id": "meeting", "name": "Meeting", "color": "#e04e35"},
    {"id": "launch", "name": "Launch", "color": "#AF0024"},
    {"id": "content", "name": "Content", "color": "#763b5b"},
    {"id": "deadline", "name": "Deadline", "color": "#ef4444"},
    {"id": "personal", "name": "Personal", "color": "#22c55e"},
]
ALLOWED_CATEGORIES = {item["id"] for item in EVENT_CATEGORIES}
ALLOWED_RECURRING_VALUES = {"daily", "weekly", "monthly", "yearly"}


class Attendee(BaseModel):
    id: str | None = None
    name: str | None = None
    email: str | None = None


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=10000)
    start_time: str
    end_time: str | None = None
    all_day: bool = False
    location: str | None = Field(default=None, max_length=500)
    color: str = Field(default="#e04e35", max_length=50)
    category: str = Field(default="general", max_length=50)
    recurring: str | None = Field(default=None, max_length=50)
    reminders: list[int] = Field(default_factory=list)
    attendees: list[Attendee] = Field(default_factory=list)


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=10000)
    start_time: str | None = None
    end_time: str | None = None
    all_day: bool | None = None
    location: str | None = Field(default=None, max_length=500)
    color: str | None = Field(default=None, max_length=50)
    category: str | None = Field(default=None, max_length=50)
    recurring: str | None = Field(default=None, max_length=50)
    reminders: list[int] | None = None
    attendees: list[Attendee] | None = None


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_id() -> str:
    return str(uuid.uuid4())


def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid ISO datetime: {value}") from exc


def _normalize_category(value: str | None) -> str:
    normalized = str(value or "general").strip().lower()
    if normalized not in ALLOWED_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid event category")
    return normalized


def _normalize_recurring(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip().lower()
    if not normalized:
        return None
    if normalized not in ALLOWED_RECURRING_VALUES:
        raise HTTPException(status_code=400, detail="Invalid recurring value")
    return normalized


def _normalize_reminders(reminders: list[int] | None) -> list[int]:
    if reminders is None:
        return []
    normalized: list[int] = []
    for item in reminders:
        try:
            minutes = int(item)
        except (TypeError, ValueError) as exc:
            raise HTTPException(status_code=400, detail="Invalid reminder value") from exc
        if minutes < 0:
            raise HTTPException(status_code=400, detail="Reminder value must be positive")
        normalized.append(minutes)
    return sorted(set(normalized))


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


async def _get_events_collection():
    db = get_db()
    collection_names = set(await db.list_collection_names())
    for candidate in CALENDAR_COLLECTION_CANDIDATES:
        if candidate in collection_names:
            return db[candidate]
    return db[CALENDAR_COLLECTION_CANDIDATES[0]]


def _workspace_id_from_request(request: Request, require_admin: bool = False) -> str:
    context = require_workspace_admin(request) if require_admin else require_workspace_member(request)
    workspace_id = str(context.get("workspace_id") or "").strip()
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Workspace context required")
    return workspace_id


async def _resolve_event_or_404(workspace_id: str, event_id: str) -> dict[str, Any]:
    events = await _get_events_collection()
    doc = await events.find_one(
        {"id": event_id, "workspace_id": workspace_id},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Event not found")
    return doc


def _month_window(year: int, month: int) -> tuple[datetime, datetime]:
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")

    start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    return start, end


def _today_window() -> tuple[datetime, datetime]:
    start = _utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return start, end


def _week_window(reference: datetime | None = None) -> tuple[datetime, datetime]:
    now = reference or _utcnow()
    start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=7)
    return start, end


def _range_query(start_dt: datetime, end_dt: datetime) -> dict[str, Any]:
    return {
        "start_time": {
            "$gte": start_dt.isoformat(),
            "$lt": end_dt.isoformat(),
        }
    }


def _event_to_day_key(event: dict[str, Any]) -> str:
    raw = str(event.get("start_time") or "")
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return dt.date().isoformat()
    except Exception:
        return raw[:10]


async def _ensure_indexes() -> None:
    events = await _get_events_collection()
    await events.create_index("id", unique=True, name="calendar_events_id_unique")
    await events.create_index([("workspace_id", 1), ("start_time", 1)], name="calendar_events_workspace_start_idx")
    await events.create_index([("workspace_id", 1), ("category", 1)], name="calendar_events_workspace_category_idx")


@router.get("/categories")
async def get_event_categories(request: Request):
    _workspace_id_from_request(request)
    return {"categories": EVENT_CATEGORIES}


@router.get("/events")
async def list_events(
    request: Request,
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    category: str | None = Query(default=None),
    limit: int = Query(default=500, ge=1, le=2000),
):
    workspace_id = _workspace_id_from_request(request)
    events = await _get_events_collection()

    query: dict[str, Any] = {"workspace_id": workspace_id}

    if start_date and end_date:
        start_dt = _parse_iso_datetime(start_date)
        end_dt = _parse_iso_datetime(end_date)
        if not start_dt or not end_dt:
            raise HTTPException(status_code=400, detail="Both start_date and end_date are required")
        query.update(_range_query(start_dt, end_dt))

    if category:
        query["category"] = _normalize_category(category)

    docs = await events.find(query, {"_id": 0}).sort("start_time", 1).limit(limit).to_list(length=limit)
    clean = [_clean_doc(doc) for doc in docs]

    events_by_day: dict[str, list[dict[str, Any]]] = {}
    for doc in clean:
        day_key = _event_to_day_key(doc)
        events_by_day.setdefault(day_key, []).append(doc)

    return {
        "workspace_id": workspace_id,
        "events": clean,
        "events_by_day": events_by_day,
        "total": len(clean),
    }


@router.get("/events/month/{year}/{month}")
async def list_events_for_month(request: Request, year: int, month: int):
    workspace_id = _workspace_id_from_request(request)
    events = await _get_events_collection()

    start_dt, end_dt = _month_window(year, month)
    query = {
        "workspace_id": workspace_id,
        **_range_query(start_dt, end_dt),
    }

    docs = await events.find(query, {"_id": 0}).sort("start_time", 1).to_list(length=2000)
    clean = [_clean_doc(doc) for doc in docs]

    events_by_day: dict[str, list[dict[str, Any]]] = {}
    for doc in clean:
        day_key = _event_to_day_key(doc)
        events_by_day.setdefault(day_key, []).append(doc)

    return {
        "workspace_id": workspace_id,
        "year": year,
        "month": month,
        "events": clean,
        "events_by_day": events_by_day,
        "total": len(clean),
    }


@router.get("/events/week")
async def list_events_for_week(request: Request):
    workspace_id = _workspace_id_from_request(request)
    events = await _get_events_collection()

    start_dt, end_dt = _week_window()
    docs = await events.find(
        {"workspace_id": workspace_id, **_range_query(start_dt, end_dt)},
        {"_id": 0},
    ).sort("start_time", 1).to_list(length=500)

    return {
        "workspace_id": workspace_id,
        "events": [_clean_doc(doc) for doc in docs],
        "total": len(docs),
    }


@router.get("/events/today")
async def list_events_for_today(request: Request):
    workspace_id = _workspace_id_from_request(request)
    events = await _get_events_collection()

    start_dt, end_dt = _today_window()
    docs = await events.find(
        {"workspace_id": workspace_id, **_range_query(start_dt, end_dt)},
        {"_id": 0},
    ).sort("start_time", 1).to_list(length=200)

    return {
        "workspace_id": workspace_id,
        "events": [_clean_doc(doc) for doc in docs],
        "total": len(docs),
    }


@router.get("/upcoming")
async def list_upcoming_events(
    request: Request,
    limit: int = Query(default=10, ge=1, le=100),
):
    workspace_id = _workspace_id_from_request(request)
    events = await _get_events_collection()

    now_iso = _utcnow().isoformat()
    docs = await events.find(
        {
            "workspace_id": workspace_id,
            "start_time": {"$gte": now_iso},
        },
        {"_id": 0},
    ).sort("start_time", 1).limit(limit).to_list(length=limit)

    return {
        "workspace_id": workspace_id,
        "events": [_clean_doc(doc) for doc in docs],
        "total": len(docs),
    }


@router.get("/events/{event_id}")
async def get_event(request: Request, event_id: str):
    workspace_id = _workspace_id_from_request(request)
    doc = await _resolve_event_or_404(workspace_id, event_id)
    return {"event": _clean_doc(doc)}


@router.post("/events", status_code=status.HTTP_201_CREATED)
async def create_event(request: Request, payload: EventCreate):
    workspace_id = _workspace_id_from_request(request, require_admin=True)
    context = require_workspace_admin(request)
    await _ensure_indexes()
    events = await _get_events_collection()

    start_dt = _parse_iso_datetime(payload.start_time)
    end_dt = _parse_iso_datetime(payload.end_time)
    if start_dt is None:
        raise HTTPException(status_code=400, detail="start_time is required")
    if end_dt and end_dt < start_dt:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    now = _utcnow()
    doc = {
        "id": _new_id(),
        "workspace_id": workspace_id,
        "created_by": context["user_id"],
        "updated_by": context["user_id"],
        "title": payload.title.strip(),
        "description": (payload.description or "").strip() or None,
        "start_time": start_dt.isoformat(),
        "end_time": end_dt.isoformat() if end_dt else None,
        "all_day": bool(payload.all_day),
        "location": (payload.location or "").strip() or None,
        "color": payload.color,
        "category": _normalize_category(payload.category),
        "recurring": _normalize_recurring(payload.recurring),
        "reminders": _normalize_reminders(payload.reminders),
        "attendees": [item.model_dump() for item in payload.attendees],
        "created_at": now,
        "updated_at": now,
    }

    await events.insert_one(doc)
    return {"event": _clean_doc(doc)}


@router.put("/events/{event_id}")
async def update_event(request: Request, event_id: str, payload: EventUpdate):
    workspace_id = _workspace_id_from_request(request, require_admin=True)
    context = require_workspace_admin(request)
    events = await _get_events_collection()

    existing = await _resolve_event_or_404(workspace_id, event_id)

    updates: dict[str, Any] = {}
    raw = payload.model_dump(exclude_unset=True)

    if "title" in raw:
        updates["title"] = raw["title"].strip()
    if "description" in raw:
        updates["description"] = (raw["description"] or "").strip() or None
    if "start_time" in raw:
        start_dt = _parse_iso_datetime(raw["start_time"])
        updates["start_time"] = start_dt.isoformat() if start_dt else None
    if "end_time" in raw:
        end_dt = _parse_iso_datetime(raw["end_time"])
        updates["end_time"] = end_dt.isoformat() if end_dt else None
    if "all_day" in raw:
        updates["all_day"] = bool(raw["all_day"])
    if "location" in raw:
        updates["location"] = (raw["location"] or "").strip() or None
    if "color" in raw:
        updates["color"] = raw["color"]
    if "category" in raw:
        updates["category"] = _normalize_category(raw["category"])
    if "recurring" in raw:
        updates["recurring"] = _normalize_recurring(raw["recurring"])
    if "reminders" in raw:
        updates["reminders"] = _normalize_reminders(raw["reminders"])
    if "attendees" in raw:
        updates["attendees"] = [item.model_dump() if isinstance(item, Attendee) else item for item in raw["attendees"]]

    candidate_start = updates.get("start_time", existing.get("start_time"))
    candidate_end = updates.get("end_time", existing.get("end_time"))
    start_dt = _parse_iso_datetime(candidate_start)
    end_dt = _parse_iso_datetime(candidate_end)
    if start_dt and end_dt and end_dt < start_dt:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    updates["updated_by"] = context["user_id"]
    updates["updated_at"] = _utcnow()

    await events.update_one(
        {"id": event_id, "workspace_id": workspace_id},
        {"$set": updates},
    )

    updated = await _resolve_event_or_404(workspace_id, event_id)
    return {"event": _clean_doc(updated)}


@router.delete("/events/{event_id}")
async def delete_event(request: Request, event_id: str):
    workspace_id = _workspace_id_from_request(request, require_admin=True)
    events = await _get_events_collection()

    result = await events.delete_one({"id": event_id, "workspace_id": workspace_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")

    return {"success": True, "deleted_id": event_id}


@router.get("/analytics")
async def get_calendar_analytics(request: Request):
    workspace_id = _workspace_id_from_request(request)
    events = await _get_events_collection()

    now = _utcnow()
    month_start, month_end = _month_window(now.year, now.month)

    total_events = await events.count_documents({"workspace_id": workspace_id})
    events_this_month = await events.count_documents(
        {"workspace_id": workspace_id, **_range_query(month_start, month_end)}
    )
    upcoming_7_days = await events.count_documents(
        {
            "workspace_id": workspace_id,
            **_range_query(now, now + timedelta(days=7)),
        }
    )

    return {
        "workspace_id": workspace_id,
        "total_events": total_events,
        "events_this_month": events_this_month,
        "upcoming_7_days": upcoming_7_days,
    }
