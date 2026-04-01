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


router = APIRouter(prefix="/api/business", tags=["business"])


BUSINESS_COLLECTION_CANDIDATES = [
    "business_profiles",
    "business_settings",
    "workspace_business",
]


ALLOWED_BUSINESS_STATUSES = {
    "active",
    "inactive",
    "draft",
    "archived",
}

ALLOWED_BRAND_VISIBILITIES = {
    "private",
    "internal",
    "public",
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


async def _get_business_collection(db):
    name = await _find_existing_collection(db, BUSINESS_COLLECTION_CANDIDATES)
    if not name:
        raise HTTPException(status_code=500, detail="Business collection is not configured")
    return getattr(db, name)


def _normalize_status(value: str | None, default: str = "active") -> str:
    normalized = str(value or "").strip().lower()
    if not normalized:
        return default
    if normalized not in ALLOWED_BUSINESS_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid business status")
    return normalized


def _normalize_visibility(value: str | None, default: str = "private") -> str:
    normalized = str(value or "").strip().lower()
    if not normalized:
        return default
    if normalized not in ALLOWED_BRAND_VISIBILITIES:
        raise HTTPException(status_code=400, detail="Invalid brand visibility")
    return normalized


class BusinessProfileUpsert(BaseModel):
    legal_name: Optional[str] = Field(default=None, max_length=200)
    display_name: Optional[str] = Field(default=None, max_length=200)
    tagline: Optional[str] = Field(default=None, max_length=300)
    website: Optional[str] = Field(default=None, max_length=500)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)

    industry: Optional[str] = Field(default=None, max_length=120)
    niche: Optional[str] = Field(default=None, max_length=120)
    description: Optional[str] = Field(default=None, max_length=10000)

    status: Optional[str] = Field(default="active", max_length=50)
    brand_visibility: Optional[str] = Field(default="private", max_length=50)

    logo_url: Optional[str] = Field(default=None, max_length=1000)
    primary_color: Optional[str] = Field(default=None, max_length=50)
    secondary_color: Optional[str] = Field(default=None, max_length=50)

    address_line_1: Optional[str] = Field(default=None, max_length=255)
    address_line_2: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=30)
    country: Optional[str] = Field(default=None, max_length=100)

    tax_id: Optional[str] = Field(default=None, max_length=100)
    support_email: Optional[str] = Field(default=None, max_length=255)
    billing_email: Optional[str] = Field(default=None, max_length=255)

    metadata: dict[str, Any] = Field(default_factory=dict)


class BusinessProfilePatch(BaseModel):
    legal_name: Optional[str] = Field(default=None, max_length=200)
    display_name: Optional[str] = Field(default=None, max_length=200)
    tagline: Optional[str] = Field(default=None, max_length=300)
    website: Optional[str] = Field(default=None, max_length=500)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)

    industry: Optional[str] = Field(default=None, max_length=120)
    niche: Optional[str] = Field(default=None, max_length=120)
    description: Optional[str] = Field(default=None, max_length=10000)

    status: Optional[str] = Field(default=None, max_length=50)
    brand_visibility: Optional[str] = Field(default=None, max_length=50)

    logo_url: Optional[str] = Field(default=None, max_length=1000)
    primary_color: Optional[str] = Field(default=None, max_length=50)
    secondary_color: Optional[str] = Field(default=None, max_length=50)

    address_line_1: Optional[str] = Field(default=None, max_length=255)
    address_line_2: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    postal_code: Optional[str] = Field(default=None, max_length=30)
    country: Optional[str] = Field(default=None, max_length=100)

    tax_id: Optional[str] = Field(default=None, max_length=100)
    support_email: Optional[str] = Field(default=None, max_length=255)
    billing_email: Optional[str] = Field(default=None, max_length=255)

    metadata: Optional[dict[str, Any]] = None


async def _resolve_business_profile(db, workspace_id: str) -> dict[str, Any] | None:
    collection = await _get_business_collection(db)
    return await collection.find_one(
        {"workspace_id": workspace_id},
        {"_id": 0},
    )


def _profile_defaults(workspace_id: str) -> dict[str, Any]:
    now = _utcnow()
    return {
        "workspace_id": workspace_id,
        "legal_name": None,
        "display_name": None,
        "tagline": None,
        "website": None,
        "email": None,
        "phone": None,
        "industry": None,
        "niche": None,
        "description": None,
        "status": "active",
        "brand_visibility": "private",
        "logo_url": None,
        "primary_color": None,
        "secondary_color": None,
        "address_line_1": None,
        "address_line_2": None,
        "city": None,
        "state": None,
        "postal_code": None,
        "country": None,
        "tax_id": None,
        "support_email": None,
        "billing_email": None,
        "metadata": {},
        "created_at": now,
        "updated_at": now,
    }


@router.get("/profile")
async def get_business_profile(
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

    existing = await _resolve_business_profile(db, resolved_workspace_id)
    if existing:
        return {
            "workspace_id": resolved_workspace_id,
            "profile": _clean_doc(existing),
        }

    return {
        "workspace_id": resolved_workspace_id,
        "profile": _clean_doc(_profile_defaults(resolved_workspace_id)),
    }


@router.put("/profile")
async def upsert_business_profile(
    request: Request,
    payload: BusinessProfileUpsert,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_admin(request)
    db = get_db_from_request(request)
    collection = await _get_business_collection(db)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    now = _utcnow()
    existing = await _resolve_business_profile(db, resolved_workspace_id)

    doc = payload.model_dump()
    doc["status"] = _normalize_status(doc.get("status"), "active")
    doc["brand_visibility"] = _normalize_visibility(doc.get("brand_visibility"), "private")
    doc["workspace_id"] = resolved_workspace_id
    doc["updated_at"] = now
    doc["updated_by"] = tenant.user_id
    doc["updated_by_role"] = tenant.global_role

    if existing:
        await collection.update_one(
            {"workspace_id": resolved_workspace_id},
            {"$set": doc},
        )
    else:
        doc["created_at"] = now
        doc["created_by"] = tenant.user_id
        doc["created_by_role"] = tenant.global_role
        await collection.insert_one(doc)

    updated = await _resolve_business_profile(db, resolved_workspace_id)

    return {
        "workspace_id": resolved_workspace_id,
        "profile": _clean_doc(updated),
        "audit": audit_actor_metadata(tenant),
    }


@router.patch("/profile")
async def patch_business_profile(
    request: Request,
    payload: BusinessProfilePatch,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_admin(request)
    db = get_db_from_request(request)
    collection = await _get_business_collection(db)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    existing = await _resolve_business_profile(db, resolved_workspace_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Business profile not found")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}

    if "status" in updates:
        updates["status"] = _normalize_status(updates.get("status"))
    if "brand_visibility" in updates:
        updates["brand_visibility"] = _normalize_visibility(updates.get("brand_visibility"))

    updates["updated_at"] = _utcnow()
    updates["updated_by"] = tenant.user_id
    updates["updated_by_role"] = tenant.global_role

    await collection.update_one(
        {"workspace_id": resolved_workspace_id},
        {"$set": updates},
    )

    updated = await _resolve_business_profile(db, resolved_workspace_id)

    return {
        "workspace_id": resolved_workspace_id,
        "profile": _clean_doc(updated),
        "audit": audit_actor_metadata(tenant),
    }


@router.delete("/profile")
async def archive_business_profile(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_admin(request)
    db = get_db_from_request(request)
    collection = await _get_business_collection(db)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    existing = await _resolve_business_profile(db, resolved_workspace_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Business profile not found")

    await collection.update_one(
        {"workspace_id": resolved_workspace_id},
        {
            "$set": {
                "status": "archived",
                "updated_at": _utcnow(),
                "updated_by": tenant.user_id,
                "updated_by_role": tenant.global_role,
            }
        },
    )

    updated = await _resolve_business_profile(db, resolved_workspace_id)

    return {
        "workspace_id": resolved_workspace_id,
        "profile": _clean_doc(updated),
        "archived": True,
    }


@router.get("/public-profile")
async def get_public_business_profile(
    request: Request,
    workspace_id: str = Query(...),
):
    db = get_db_from_request(request)

    profile = await _resolve_business_profile(db, workspace_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")

    visibility = str(profile.get("brand_visibility") or "private").strip().lower()
    status = str(profile.get("status") or "inactive").strip().lower()

    if visibility != "public" or status != "active":
        raise HTTPException(status_code=404, detail="Business profile not found")

    public_fields = {
        "workspace_id": workspace_id,
        "display_name": profile.get("display_name"),
        "tagline": profile.get("tagline"),
        "website": profile.get("website"),
        "email": profile.get("email"),
        "phone": profile.get("phone"),
        "industry": profile.get("industry"),
        "niche": profile.get("niche"),
        "description": profile.get("description"),
        "logo_url": profile.get("logo_url"),
        "primary_color": profile.get("primary_color"),
        "secondary_color": profile.get("secondary_color"),
        "city": profile.get("city"),
        "state": profile.get("state"),
        "country": profile.get("country"),
        "brand_visibility": visibility,
        "status": status,
    }

    return {"profile": public_fields}


@router.get("/admin/portfolio")
async def admin_business_portfolio(
    request: Request,
    limit: int = Query(default=100, ge=1, le=500),
):
    require_platform_admin(request)
    db = get_db_from_request(request)
    collection = await _get_business_collection(db)

    docs = await collection.find(
        {},
        {"_id": 0},
    ).sort("updated_at", -1).to_list(length=limit)

    rows = []
    for doc in docs:
        clean = _clean_doc(doc)
        rows.append(
            {
                "workspace_id": clean.get("workspace_id"),
                "display_name": clean.get("display_name"),
                "legal_name": clean.get("legal_name"),
                "status": clean.get("status"),
                "brand_visibility": clean.get("brand_visibility"),
                "industry": clean.get("industry"),
                "website": clean.get("website"),
                "updated_at": clean.get("updated_at"),
            }
        )

    return {
        "profiles": rows,
        "total": len(rows),
    }
