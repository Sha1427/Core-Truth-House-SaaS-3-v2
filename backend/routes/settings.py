from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from middleware.tenant_dependencies import (
    audit_actor_metadata,
    enforce_workspace_match,
    get_db_from_request,
    require_platform_admin,
    require_tenant_admin,
    require_tenant_member,
)


router = APIRouter(prefix="/api/settings", tags=["settings"])


SETTINGS_COLLECTION_CANDIDATES = [
    "workspace_settings",
    "settings",
    "tenant_settings",
]

ALLOWED_TIMEZONES_FALLBACK = {
    "UTC",
    "America/Chicago",
    "America/New_York",
    "America/Los_Angeles",
    "America/Denver",
}

ALLOWED_VISIBILITY = {
    "private",
    "internal",
    "public",
}

ALLOWED_NOTIFICATION_MODES = {
    "all",
    "important",
    "none",
}

DEFAULT_FEATURE_FLAGS = {
    "brand_foundation_enabled": True,
    "strategic_os_enabled": True,
    "content_studio_enabled": True,
    "crm_enabled": True,
    "calendar_enabled": True,
    "blog_enabled": True,
    "store_enabled": False,
    "ai_generation_enabled": True,
    "admin_reporting_enabled": False,
}

DEFAULT_LIMITS = {
    "max_team_members": 5,
    "max_content_assets": 500,
    "max_crm_contacts": 1000,
    "max_calendar_events_per_month": 500,
    "monthly_ai_generations": 250,
}

DEFAULT_SETTINGS = {
    "workspace_name": None,
    "timezone": "UTC",
    "locale": "en-US",
    "brand_visibility": "private",
    "notification_mode": "all",
    "custom_domain": None,
    "logo_url": None,
    "primary_color": None,
    "secondary_color": None,
    "feature_flags": DEFAULT_FEATURE_FLAGS,
    "limits": DEFAULT_LIMITS,
}


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


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


async def _find_existing_collection(db, candidates: list[str]) -> str | None:
    names = set(await db.list_collection_names())
    for candidate in candidates:
        if candidate in names:
            return candidate
    return None


async def _get_settings_collection(db):
    name = await _find_existing_collection(db, SETTINGS_COLLECTION_CANDIDATES)
    if not name:
        raise HTTPException(status_code=500, detail="Settings collection is not configured")
    return getattr(db, name)


def _normalize_timezone(value: str | None) -> str:
    normalized = str(value or "").strip()
    if not normalized:
        return "UTC"
    return normalized


def _normalize_visibility(value: str | None) -> str:
    normalized = str(value or "").strip().lower()
    if not normalized:
        return "private"
    if normalized not in ALLOWED_VISIBILITY:
        raise HTTPException(status_code=400, detail="Invalid brand visibility")
    return normalized


def _normalize_notification_mode(value: str | None) -> str:
    normalized = str(value or "").strip().lower()
    if not normalized:
        return "all"
    if normalized not in ALLOWED_NOTIFICATION_MODES:
        raise HTTPException(status_code=400, detail="Invalid notification mode")
    return normalized


def _merge_defaults(doc: dict[str, Any] | None, workspace_id: str) -> dict[str, Any]:
    merged = {
        "workspace_id": workspace_id,
        **DEFAULT_SETTINGS,
    }

    if doc:
        merged.update(doc)

    merged["feature_flags"] = {
        **DEFAULT_FEATURE_FLAGS,
        **(doc.get("feature_flags", {}) if doc else {}),
    }
    merged["limits"] = {
        **DEFAULT_LIMITS,
        **(doc.get("limits", {}) if doc else {}),
    }

    return merged


class WorkspaceSettingsPatch(BaseModel):
    workspace_name: Optional[str] = Field(default=None, max_length=200)
    timezone: Optional[str] = Field(default=None, max_length=100)
    locale: Optional[str] = Field(default=None, max_length=50)
    brand_visibility: Optional[str] = Field(default=None, max_length=50)
    notification_mode: Optional[str] = Field(default=None, max_length=50)
    custom_domain: Optional[str] = Field(default=None, max_length=255)
    logo_url: Optional[str] = Field(default=None, max_length=1000)
    primary_color: Optional[str] = Field(default=None, max_length=50)
    secondary_color: Optional[str] = Field(default=None, max_length=50)


class FeatureFlagsPatch(BaseModel):
    brand_foundation_enabled: Optional[bool] = None
    strategic_os_enabled: Optional[bool] = None
    content_studio_enabled: Optional[bool] = None
    crm_enabled: Optional[bool] = None
    calendar_enabled: Optional[bool] = None
    blog_enabled: Optional[bool] = None
    store_enabled: Optional[bool] = None
    ai_generation_enabled: Optional[bool] = None
    admin_reporting_enabled: Optional[bool] = None


class LimitsPatch(BaseModel):
    max_team_members: Optional[int] = Field(default=None, ge=1, le=100000)
    max_content_assets: Optional[int] = Field(default=None, ge=1, le=1000000)
    max_crm_contacts: Optional[int] = Field(default=None, ge=1, le=1000000)
    max_calendar_events_per_month: Optional[int] = Field(default=None, ge=1, le=1000000)
    monthly_ai_generations: Optional[int] = Field(default=None, ge=0, le=1000000)


async def _resolve_workspace_settings(db, workspace_id: str) -> dict[str, Any]:
    collection = await _get_settings_collection(db)
    existing = await collection.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0},
    )
    return _merge_defaults(existing, workspace_id)


@router.get("")
async def get_workspace_settings(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    settings = await _resolve_workspace_settings(db, resolved_workspace_id)
    return {
        "workspace_id": resolved_workspace_id,
        "settings": _clean_doc(settings),
    }


@router.patch("")
async def patch_workspace_settings(
    request: Request,
    payload: WorkspaceSettingsPatch,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_admin(request)
    db = get_db_from_request(request)
    collection = await _get_settings_collection(db)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}

    if "timezone" in updates:
        updates["timezone"] = _normalize_timezone(updates["timezone"])
    if "brand_visibility" in updates:
        updates["brand_visibility"] = _normalize_visibility(updates["brand_visibility"])
    if "notification_mode" in updates:
        updates["notification_mode"] = _normalize_notification_mode(updates["notification_mode"])

    updates["updated_at"] = _utcnow()
    updates["updated_by"] = tenant.user_id
    updates["updated_by_role"] = tenant.global_role

    await collection.update_one(
        {"workspace_id": resolved_workspace_id},
        {"$set": {"workspace_id": resolved_workspace_id, **updates}},
        upsert=True,
    )

    settings = await _resolve_workspace_settings(db, resolved_workspace_id)

    return {
        "workspace_id": resolved_workspace_id,
        "settings": _clean_doc(settings),
        "audit": audit_actor_metadata(tenant),
    }


@router.get("/features")
async def get_workspace_feature_flags(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    settings = await _resolve_workspace_settings(db, resolved_workspace_id)

    return {
        "workspace_id": resolved_workspace_id,
        "feature_flags": settings.get("feature_flags", DEFAULT_FEATURE_FLAGS),
    }


@router.patch("/features")
async def patch_workspace_feature_flags(
    request: Request,
    payload: FeatureFlagsPatch,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_admin(request)
    db = get_db_from_request(request)
    collection = await _get_settings_collection(db)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No feature flag updates provided")

    doc = await _resolve_workspace_settings(db, resolved_workspace_id)
    feature_flags = {
        **doc.get("feature_flags", DEFAULT_FEATURE_FLAGS),
        **updates,
    }

    await collection.update_one(
        {"workspace_id": resolved_workspace_id},
        {
            "$set": {
                "workspace_id": resolved_workspace_id,
                "feature_flags": feature_flags,
                "updated_at": _utcnow(),
                "updated_by": tenant.user_id,
                "updated_by_role": tenant.global_role,
            }
        },
        upsert=True,
    )

    settings = await _resolve_workspace_settings(db, resolved_workspace_id)

    return {
        "workspace_id": resolved_workspace_id,
        "feature_flags": settings.get("feature_flags", DEFAULT_FEATURE_FLAGS),
        "audit": audit_actor_metadata(tenant),
    }


@router.get("/limits")
async def get_workspace_limits(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    settings = await _resolve_workspace_settings(db, resolved_workspace_id)

    return {
        "workspace_id": resolved_workspace_id,
        "limits": settings.get("limits", DEFAULT_LIMITS),
    }


@router.patch("/limits")
async def patch_workspace_limits(
    request: Request,
    payload: LimitsPatch,
    workspace_id: str,
):
    tenant = require_platform_admin(request)
    db = get_db_from_request(request)
    collection = await _get_settings_collection(db)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No limit updates provided")

    doc = await _resolve_workspace_settings(db, resolved_workspace_id)
    limits = {
        **doc.get("limits", DEFAULT_LIMITS),
        **updates,
    }

    await collection.update_one(
        {"workspace_id": resolved_workspace_id},
        {
            "$set": {
                "workspace_id": resolved_workspace_id,
                "limits": limits,
                "updated_at": _utcnow(),
                "updated_by": tenant.user_id,
                "updated_by_role": tenant.global_role,
            }
        },
        upsert=True,
    )

    settings = await _resolve_workspace_settings(db, resolved_workspace_id)

    return {
        "workspace_id": resolved_workspace_id,
        "limits": settings.get("limits", DEFAULT_LIMITS),
        "audit": audit_actor_metadata(tenant),
    }


@router.get("/admin/portfolio")
async def admin_settings_portfolio(
    request: Request,
    limit: int = Query(default=100, ge=1, le=500),
):
    require_platform_admin(request)
    db = get_db_from_request(request)
    collection = await _get_settings_collection(db)

    docs = await collection.find(
        {},
        {"_id": 0},
    ).sort("updated_at", -1).to_list(length=limit)

    rows = []
    for doc in docs:
        merged = _merge_defaults(doc, str(doc.get("workspace_id") or ""))
        rows.append(
            {
                "workspace_id": merged.get("workspace_id"),
                "workspace_name": merged.get("workspace_name"),
                "timezone": merged.get("timezone"),
                "brand_visibility": merged.get("brand_visibility"),
                "notification_mode": merged.get("notification_mode"),
                "custom_domain": merged.get("custom_domain"),
                "feature_flags": merged.get("feature_flags"),
                "limits": merged.get("limits"),
                "updated_at": _iso(merged.get("updated_at")),
            }
        )

    return {
        "settings": rows,
        "total": len(rows),
    }
