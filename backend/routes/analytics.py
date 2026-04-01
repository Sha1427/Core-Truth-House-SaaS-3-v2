from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

from backend.database import get_db
from backend.dependencies.auth_context import require_workspace_member

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

COLLECTION_CANDIDATES: dict[str, list[str]] = {
    "brand_foundation": ["brand_foundation", "persist_brand_foundation"],
    "brand_audits": ["brand_audits", "audit_results", "audits"],
    "ai_usage": ["ai_usage", "usage_ai", "ai_generations"],
    "content_assets": ["content_assets", "persist_content_assets", "content_library"],
    "media_assets": ["media_assets", "generated_media", "media_library"],
    "brand_assets": ["brand_assets", "identity_assets"],
    "identity": ["identity", "brand_identity"],
    "offers": ["offers"],
    "systems": ["systems"],
    "launches": ["launches"],
    "workspaces": ["workspaces", "workspace"],
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _month_key(dt: datetime | None = None) -> str:
    dt = dt or _utcnow()
    return dt.strftime("%Y-%m")


def _workspace_id(request: Request) -> str:
    context = require_workspace_member(request)
    workspace_id = str(context.get("workspace_id") or "").strip()
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Workspace context required")
    return workspace_id


def _user_id(request: Request) -> str:
    context = require_workspace_member(request)
    user_id = str(context.get("user_id") or "").strip()
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id


def _safe_bool(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return len(value) > 0
    if isinstance(value, dict):
        return len(value) > 0
    return bool(value)


async def _get_collection(logical_name: str):
    db = get_db()
    candidates = COLLECTION_CANDIDATES.get(logical_name, [logical_name])

    try:
        names = set(await db.list_collection_names())
    except Exception:
        names = set()

    for candidate in candidates:
        if candidate in names:
            return db[candidate]

    return db[candidates[0]]


async def _find_one(
    logical_name: str,
    query: dict[str, Any],
    projection: dict[str, int] | None = None,
) -> dict[str, Any] | None:
    collection = await _get_collection(logical_name)
    return await collection.find_one(query, projection or {"_id": 0})


async def _count(logical_name: str, query: dict[str, Any]) -> int:
    collection = await _get_collection(logical_name)
    return await collection.count_documents(query)


async def _list_docs(
    logical_name: str,
    query: dict[str, Any],
    sort: list[tuple[str, int]] | None = None,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    collection = await _get_collection(logical_name)
    cursor = collection.find(query, {"_id": 0})

    if sort:
        cursor = cursor.sort(sort)
    if limit:
        cursor = cursor.limit(limit)

    return await cursor.to_list(length=limit or 1000)


async def _aggregate(logical_name: str, pipeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
    collection = await _get_collection(logical_name)
    return await collection.aggregate(pipeline).to_list(length=1000)


def _foundation_fields(_: dict[str, Any]) -> list[tuple[str, str]]:
    return [
        ("mission", "Mission"),
        ("vision", "Vision"),
        ("values", "Values"),
        ("tagline", "Tagline"),
        ("positioning", "Positioning"),
        ("story", "Story"),
        ("tone_of_voice", "Tone of Voice"),
    ]


@router.get("/overview")
async def get_analytics_overview(request: Request):
    workspace_id = _workspace_id(request)
    user_id = _user_id(request)

    offers_count = await _count("offers", {"workspace_id": workspace_id})
    systems_count = await _count("systems", {"workspace_id": workspace_id})
    content_count = await _count("content_assets", {"workspace_id": workspace_id})
    launches_count = await _count("launches", {"workspace_id": workspace_id})
    media_count = await _count("media_assets", {"workspace_id": workspace_id})

    foundation = await _find_one("brand_foundation", {"workspace_id": workspace_id}) or {}
    fields = _foundation_fields(foundation)
    filled = sum(1 for key, _ in fields if _safe_bool(foundation.get(key)))
    foundation_pct = round((filled / len(fields)) * 100) if fields else 0

    usage_doc = await _find_one(
        "ai_usage",
        {"workspace_id": workspace_id, "user_id": user_id, "month": _month_key()},
    ) or {}
    ai_used = usage_doc.get("count", 0) or usage_doc.get("generations", 0) or 0

    audits = await _list_docs(
        "brand_audits",
        {"workspace_id": workspace_id},
        sort=[("created_at", -1)],
        limit=1,
    )
    latest_audit = audits[0] if audits else {}
    latest_scores = latest_audit.get("scores") or {}

    audit_score = latest_audit.get("overall_score") or latest_scores.get("overall") or 0

    return {
        "summary": {
            "foundation_completion": foundation_pct,
            "total_offers": offers_count,
            "total_systems": systems_count,
            "total_content": content_count,
            "total_launches": launches_count,
            "total_media": media_count,
            "ai_generations_this_month": ai_used,
            "brand_audit_score": audit_score,
        }
    }


@router.get("/brand-progress")
async def get_brand_progress(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
):
    workspace_id = _workspace_id(request)

    audits = await _list_docs(
        "brand_audits",
        {"workspace_id": workspace_id},
        sort=[("created_at", -1)],
        limit=limit,
    )
    audits.reverse()

    progress = []
    for audit in audits:
        scores = audit.get("scores") or {}
        progress.append(
            {
                "date": audit.get("created_at", ""),
                "overall": audit.get("overall_score", scores.get("overall", 0)),
                "foundation": scores.get("foundation", 0),
                "identity": scores.get("identity", 0),
                "offers": scores.get("offers", 0),
                "systems": scores.get("systems", 0),
                "content": scores.get("content", 0),
                "launch": scores.get("launch_readiness", 0),
            }
        )

    return {"progress": progress}


@router.get("/ai-usage")
async def get_ai_usage_analytics(
    request: Request,
    months: int = Query(default=6, ge=1, le=24),
):
    workspace_id = _workspace_id(request)
    user_id = _user_id(request)

    usage_history = await _list_docs(
        "ai_usage",
        {"workspace_id": workspace_id, "user_id": user_id},
        sort=[("month", -1)],
        limit=months,
    )
    usage_history.reverse()

    workspace = await _find_one(
        "workspaces",
        {"$or": [{"id": workspace_id}, {"workspace_id": workspace_id}]},
    ) or {}
    billing = workspace.get("billing") or {}

    plan = str(
        workspace.get("plan_id")
        or workspace.get("plan")
        or billing.get("plan_id")
        or "FOUNDATION"
    ).upper()

    limits = {
        "FOUNDATION": 30,
        "STRUCTURE": 150,
        "HOUSE": 400,
        "ESTATE": 999999,
    }
    limit_value = limits.get(plan, 30)

    usage = [
        {
            "month": item.get("month", ""),
            "used": item.get("count", 0) or item.get("generations", 0) or 0,
            "limit": limit_value,
        }
        for item in usage_history
    ]

    return {"usage": usage, "plan": plan, "limit": limit_value}


@router.get("/content-breakdown")
async def get_content_breakdown(request: Request):
    workspace_id = _workspace_id(request)

    results = await _aggregate(
        "content_assets",
        [
            {"$match": {"workspace_id": workspace_id}},
            {"$group": {"_id": "$content_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10},
        ],
    )

    return {
        "breakdown": [
            {"type": item.get("_id") or "unknown", "count": item.get("count", 0)}
            for item in results
        ]
    }


@router.get("/media-breakdown")
async def get_media_breakdown(request: Request):
    workspace_id = _workspace_id(request)

    results = await _aggregate(
        "media_assets",
        [
            {"$match": {"workspace_id": workspace_id}},
            {"$group": {"_id": "$media_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ],
    )

    return {
        "breakdown": [
            {"type": item.get("_id") or "unknown", "count": item.get("count", 0)}
            for item in results
        ]
    }


@router.get("/brand-memory")
async def get_brand_memory_stats(request: Request):
    workspace_id = _workspace_id(request)
    user_id = _user_id(request)

    foundation = await _find_one("brand_foundation", {"workspace_id": workspace_id}) or {}
    fields_meta = _foundation_fields(foundation)

    fields = []
    completed = 0
    for key, label in fields_meta:
        filled = _safe_bool(foundation.get(key))
        if filled:
            completed += 1
        fields.append({"key": key, "label": label, "filled": filled})

    memory_score = round((completed / len(fields_meta)) * 100) if fields_meta else 0

    identity = await _find_one("identity", {"workspace_id": workspace_id}) or {}
    colors_defined = len(identity.get("colors", []) or []) >= 3
    fonts = identity.get("fonts") or {}
    fonts_set = bool((fonts.get("heading") or "").strip() or (fonts.get("body") or "").strip())

    media_assets_count = await _count(
        "media_assets",
        {"workspace_id": workspace_id, "status": "confirmed"},
    )
    brand_assets_count = await _count("brand_assets", {"workspace_id": workspace_id})
    content_count = await _count("content_assets", {"workspace_id": workspace_id})
    media_count = await _count("media_assets", {"workspace_id": workspace_id})

    usage_doc = await _find_one(
        "ai_usage",
        {"workspace_id": workspace_id, "user_id": user_id, "month": _month_key()},
    ) or {}
    ai_used = usage_doc.get("count", 0) or usage_doc.get("generations", 0) or 0

    return {
        "memory_score": memory_score,
        "completed_fields": completed,
        "fields": fields,
        "identity": {
            "colors_defined": colors_defined,
            "fonts_set": fonts_set,
            "assets_uploaded": media_assets_count + brand_assets_count,
        },
        "utilization": {
            "content_generated": content_count,
            "media_generated": media_count,
            "ai_generations_this_month": ai_used,
        },
    }
