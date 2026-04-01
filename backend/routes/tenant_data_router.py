"""
Tenant Data Dashboard API
Core Truth House OS

Provides a unified view of tenant-scoped data across collections.
Uses tenant context from middleware/dependencies instead of trusting query params.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Any

from middleware.tenant_dependencies import (
    TenantContext,
    TenantDB,
    get_tenant_context,
    get_tenant_db,
)

router = APIRouter(prefix="/api/tenant-data", tags=["tenant-data"])


ALLOWED_COLLECTIONS = {
    "brand_memory",
    "brand_foundation",
    "strategic_os_steps",
    "brand_audits",
    "campaigns",
    "documents",
    "media_assets",
    "content_assets",
    "onboarding_progress",
}


def _safe_iso(dt: Any):
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    try:
        return dt.isoformat()
    except Exception:
        return str(dt)


def _latest_timestamp(items: list[dict], field: str):
    vals = [item.get(field) for item in items if item.get(field)]
    if not vals:
        return None
    vals = [_safe_iso(v) for v in vals]
    return max(vals)


@router.get("/summary")
async def get_tenant_data_summary(
    ctx: TenantContext = Depends(get_tenant_context),
    tdb: TenantDB = Depends(get_tenant_db),
):
    """
    Returns a summary of all data stored for the current tenant/workspace.
    """
    summary = {
        "workspace_id": ctx.workspace_id or "default",
        "user_id": ctx.user_id,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "collections": {}
    }

    # Brand Memory
    brand_memory = await tdb.find_one("brand_memory")
    summary["collections"]["brand_memory"] = {
        "count": 1 if brand_memory else 0,
        "completion_pct": brand_memory.get("completion_pct", 0) if brand_memory else 0,
        "fields_filled": len([
            k for k, v in (brand_memory or {}).items()
            if v and k not in {"_id", "workspace_id", "user_id", "created_at", "updated_at"}
        ]),
        "last_updated": _safe_iso((brand_memory or {}).get("updated_at")),
    }

    # Brand Foundation
    foundation = await tdb.find_one("brand_foundation")
    foundation_fields = [
        "mission", "vision", "values", "tagline", "positioning",
        "story", "tone_of_voice", "target_audience"
    ]
    summary["collections"]["brand_foundation"] = {
        "count": 1 if foundation else 0,
        "fields_filled": len([f for f in foundation_fields if foundation and foundation.get(f)]),
        "total_fields": len(foundation_fields),
        "last_updated": _safe_iso((foundation or {}).get("updated_at")),
    }

    # Strategic OS Steps
    steps = await tdb.find("strategic_os_steps", limit=20)
    completed_steps = [s for s in steps if s.get("is_complete")]
    summary["collections"]["strategic_os_steps"] = {
        "count": len(steps),
        "completed": len(completed_steps),
        "total": 9,
        "last_updated": _latest_timestamp(steps, "updated_at"),
    }

    # Brand Audits
    audits = await tdb.find("brand_audits", sort=[("created_at", -1)], limit=10)
    latest_audit = audits[0] if audits else None
    summary["collections"]["brand_audits"] = {
        "count": len(audits),
        "latest_score": (
            latest_audit.get("score")
            or latest_audit.get("overall_score")
            or (latest_audit.get("scores") or {}).get("overall")
        ) if latest_audit else None,
        "last_audit": _safe_iso(latest_audit.get("created_at")) if latest_audit else None,
    }

    # Campaigns
    campaigns = await tdb.find("campaigns", limit=100)
    summary["collections"]["campaigns"] = {
        "count": len(campaigns),
        "by_status": {
            "draft": len([c for c in campaigns if c.get("status") == "draft"]),
            "active": len([c for c in campaigns if c.get("status") == "active"]),
            "complete": len([c for c in campaigns if c.get("status") in {"complete", "completed"}]),
            "paused": len([c for c in campaigns if c.get("status") == "paused"]),
        },
    }

    # Documents
    docs = await tdb.find("documents", limit=200)
    by_category = {}
    for d in docs:
        cat = d.get("category", "uncategorized")
        by_category[cat] = by_category.get(cat, 0) + 1

    summary["collections"]["documents"] = {
        "count": len(docs),
        "total_size_bytes": sum(d.get("file_size", 0) or 0 for d in docs),
        "by_category": by_category,
    }

    # Media Assets
    media = await tdb.find("media_assets", limit=200)
    summary["collections"]["media_assets"] = {
        "count": len(media),
        "images": len([m for m in media if m.get("media_type") == "image"]),
        "videos": len([m for m in media if m.get("media_type") == "video"]),
    }

    # Content Assets
    # If these are truly user-scoped in your app, filter by user_id in addition to workspace scope.
    content = await tdb.find("content_assets", extra_filter={"user_id": ctx.user_id}, limit=200)
    by_type = {}
    for c in content:
        ctype = c.get("content_type", "other")
        by_type[ctype] = by_type.get(ctype, 0) + 1

    summary["collections"]["content_assets"] = {
        "count": len(content),
        "by_type": by_type,
    }

    # Onboarding Progress
    onboarding = await tdb.find_one("onboarding_progress")
    summary["collections"]["onboarding"] = {
        "milestones_completed": len((onboarding or {}).get("milestones", [])),
        "current_step": (onboarding or {}).get("current_step"),
    }

    return summary


@router.get("/full-export")
async def export_all_tenant_data(
    ctx: TenantContext = Depends(get_tenant_context),
    tdb: TenantDB = Depends(get_tenant_db),
):
    """
    Export all tenant-scoped data as one JSON document.
    Should be protected by auth + tenant middleware upstream.
    """
    export = {
        "workspace_id": ctx.workspace_id or "default",
        "user_id": ctx.user_id,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "data": {}
    }

    export["data"]["brand_memory"] = await tdb.find_one("brand_memory") or {}
    export["data"]["brand_foundation"] = await tdb.find_one("brand_foundation") or {}
    export["data"]["strategic_os_steps"] = await tdb.find("strategic_os_steps", limit=20)
    export["data"]["brand_audits"] = await tdb.find("brand_audits", sort=[("created_at", -1)], limit=5)
    export["data"]["campaigns"] = await tdb.find("campaigns", limit=100)

    # Exclude file contents if documents collection stores embedded content
    docs = await tdb.find("documents", limit=200)
    export["data"]["documents"] = [
        {k: v for k, v in d.items() if k != "content"}
        for d in docs
    ]

    export["data"]["media_assets"] = await tdb.find("media_assets", limit=200)
    export["data"]["content_assets"] = await tdb.find(
        "content_assets",
        extra_filter={"user_id": ctx.user_id},
        limit=200,
    )
    export["data"]["onboarding"] = await tdb.find_one("onboarding_progress") or {}

    return export


@router.get("/collections/{collection_name}")
async def get_collection_data(
    collection_name: str,
    limit: int = Query(default=50, ge=1, le=500),
    ctx: TenantContext = Depends(get_tenant_context),
    tdb: TenantDB = Depends(get_tenant_db),
):
    """
    Returns tenant-scoped data from a specific collection.
    """
    if collection_name not in ALLOWED_COLLECTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Collection not allowed. Choose from: {sorted(ALLOWED_COLLECTIONS)}"
        )

    if collection_name in {"brand_memory", "brand_foundation", "onboarding_progress"}:
        doc = await tdb.find_one(collection_name)
        return {"collection": collection_name, "data": doc or {}}

    extra_filter = {"user_id": ctx.user_id} if collection_name == "content_assets" else None
    docs = await tdb.find(collection_name, extra_filter=extra_filter, limit=limit)

    return {
        "collection": collection_name,
        "count": len(docs),
        "data": docs,
    }
