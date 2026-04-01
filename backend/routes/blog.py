from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional, List
import os
import re
import uuid

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from dependencies.auth_context import require_super_admin
from middleware.tenant_dependencies import (
    audit_actor_metadata,
    enforce_workspace_match,
    get_db_from_request,
    require_platform_admin,
    require_tenant_admin,
    require_tenant_member,
    stamp_tenant_fields,
)
from middleware.feature_gate import require_feature


router = APIRouter(prefix="/api/blog", tags=["blog"])


ARTICLE_COLLECTION_CANDIDATES = ["blog_articles", "articles"]
CATEGORY_COLLECTION_CANDIDATES = ["blog_categories", "categories"]

ALLOWED_ARTICLE_STATUSES = {"draft", "review", "published", "archived"}

CORE_TRUTH_HOUSE_MAIN_WORKSPACE_ID = os.getenv(
    "CORE_TRUTH_HOUSE_MAIN_WORKSPACE_ID",
    ""
).strip()


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


def _new_id() -> str:
    return str(uuid.uuid4())


def _generate_slug(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", str(title).lower()).strip("-")
    return slug[:100] or _new_id()


def _normalize_status(value: str | None, default: str = "draft") -> str:
    normalized = str(value or "").strip().lower()
    if not normalized:
        normalized = default
    if normalized not in ALLOWED_ARTICLE_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid article status")
    return normalized


def _excerpt_from_content(content: str, limit: int = 220) -> str:
    text = str(content or "").strip()
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "..."


def _is_core_truth_house_main_workspace(workspace_id: str | None) -> bool:
    if not CORE_TRUTH_HOUSE_MAIN_WORKSPACE_ID:
        return False
    return str(workspace_id or "").strip() == CORE_TRUTH_HOUSE_MAIN_WORKSPACE_ID


def _is_publish_status(status: str | None) -> bool:
    return str(status or "").strip().lower() == "published"


def _enforce_main_site_publish_rule(
    request: Request,
    workspace_id: str,
    status: str | None,
) -> None:
    if _is_core_truth_house_main_workspace(workspace_id) and _is_publish_status(status):
        require_super_admin(request)


def _enforce_main_site_delete_rule(
    request: Request,
    workspace_id: str,
) -> None:
    if _is_core_truth_house_main_workspace(workspace_id):
        require_super_admin(request)


async def _find_existing_collection(db, candidates: list[str]) -> str | None:
    names = set(await db.list_collection_names())
    for candidate in candidates:
        if candidate in names:
            return candidate
    return None


async def _get_articles_collection(db):
    name = await _find_existing_collection(db, ARTICLE_COLLECTION_CANDIDATES)
    if not name:
        raise HTTPException(status_code=500, detail="Blog articles collection is not configured")
    return getattr(db, name)


async def _get_categories_collection(db):
    name = await _find_existing_collection(db, CATEGORY_COLLECTION_CANDIDATES)
    if not name:
        raise HTTPException(status_code=500, detail="Blog categories collection is not configured")
    return getattr(db, name)


async def _ensure_unique_slug(
    db,
    slug: str,
    workspace_id: str,
    exclude_id: Optional[str] = None,
) -> str:
    articles = await _get_articles_collection(db)
    base = slug
    counter = 2

    while True:
        query: dict[str, Any] = {"slug": slug, "workspace_id": workspace_id}
        if exclude_id:
            query["id"] = {"$ne": exclude_id}

        exists = await articles.find_one(query, {"_id": 0, "id": 1})
        if not exists:
            return slug

        truncated = base[:92].rstrip("-")
        slug = f"{truncated}-{counter}"
        counter += 1


async def _resolve_article_by_id(
    db,
    workspace_id: str,
    article_id: str,
) -> dict[str, Any] | None:
    articles = await _get_articles_collection(db)
    return await articles.find_one(
        {"id": article_id, "workspace_id": workspace_id},
        {"_id": 0},
    )


async def _resolve_article_by_slug_public(
    db,
    slug: str,
) -> dict[str, Any] | None:
    articles = await _get_articles_collection(db)
    return await articles.find_one(
        {"slug": slug, "status": "published"},
        {"_id": 0},
    )


async def _category_exists(
    db,
    workspace_id: str,
    category_id: Optional[str],
) -> bool:
    if not category_id:
        return True
    categories = await _get_categories_collection(db)
    existing = await categories.find_one(
        {"id": category_id, "workspace_id": workspace_id},
        {"_id": 0, "id": 1},
    )
    return bool(existing)


class ArticleCreate(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    content: str = Field(default="", max_length=100000)
    excerpt: Optional[str] = Field(default=None, max_length=1000)
    status: str = Field(default="draft", max_length=50)
    tags: List[str] = Field(default_factory=list)
    category_id: Optional[str] = Field(default=None, max_length=100)
    featured_image: Optional[str] = Field(default=None, max_length=2000)
    seo_title: Optional[str] = Field(default=None, max_length=300)
    seo_description: Optional[str] = Field(default=None, max_length=500)
    author_name: Optional[str] = Field(default=None, max_length=200)


class ArticleUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=300)
    content: Optional[str] = Field(default=None, max_length=100000)
    excerpt: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[str] = Field(default=None, max_length=50)
    tags: Optional[List[str]] = None
    category_id: Optional[str] = Field(default=None, max_length=100)
    featured_image: Optional[str] = Field(default=None, max_length=2000)
    seo_title: Optional[str] = Field(default=None, max_length=300)
    seo_description: Optional[str] = Field(default=None, max_length=500)
    author_name: Optional[str] = Field(default=None, max_length=200)


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    color: str = Field(default="#e04e35", max_length=50)


@router.get("/articles")
async def list_articles(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    category_id: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    await require_feature(request, "blog_cms", workspace_id=workspace_id)

    articles = await _get_articles_collection(db)
    resolved_workspace_id = enforce_workspace_match(tenant, workspace_id, allow_super_admin=True)

    query: dict[str, Any] = {"workspace_id": resolved_workspace_id}

    if status:
        query["status"] = _normalize_status(status)
    if category_id:
        query["category_id"] = category_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
            {"slug": {"$regex": search, "$options": "i"}},
        ]

    docs = await articles.find(
        query,
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=limit)

    return {
        "workspace_id": resolved_workspace_id,
        "articles": [_clean_doc(doc) for doc in docs],
        "total": len(docs),
    }


@router.get("/articles/{article_id}")
async def get_article(
    article_id: str,
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    await require_feature(request, "blog_cms", workspace_id=workspace_id)

    resolved_workspace_id = enforce_workspace_match(tenant, workspace_id, allow_super_admin=True)
    article = await _resolve_article_by_id(db, resolved_workspace_id, article_id)

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    return {"article": _clean_doc(article)}


@router.post("/articles")
async def create_article(
    request: Request,
    payload: ArticleCreate,
):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    await require_feature(request, "blog_cms")

    if not await _category_exists(db, tenant.workspace_id, payload.category_id):
        raise HTTPException(status_code=400, detail="Referenced category does not exist in this workspace")

    articles = await _get_articles_collection(db)

    base = payload.model_dump()
    now = _utcnow()

    status = _normalize_status(base.get("status"), "draft")
    _enforce_main_site_publish_rule(request, tenant.workspace_id, status)

    slug = await _ensure_unique_slug(
        db,
        _generate_slug(base["title"]),
        tenant.workspace_id,
    )

    excerpt = base.get("excerpt") or _excerpt_from_content(base.get("content", ""))

    stamped = stamp_tenant_fields(
        base,
        tenant,
        workspace_field="workspace_id",
        user_field="created_by",
        force_user_id=True,
        force_workspace_id=True,
    )
    stamped["id"] = _new_id()
    stamped["slug"] = slug
    stamped["status"] = status
    stamped["excerpt"] = excerpt
    stamped["seo_title"] = stamped.get("seo_title") or stamped.get("title")
    stamped["seo_description"] = stamped.get("seo_description") or excerpt
    stamped["views"] = 0
    stamped["created_at"] = now
    stamped["updated_at"] = now
    stamped["updated_by"] = tenant.user_id

    if status == "published":
        stamped["published_at"] = now
    else:
        stamped["published_at"] = None

    result = await articles.insert_one(stamped)
    created = await articles.find_one({"_id": result.inserted_id}, {"_id": 0})

    return {
        "article": _clean_doc(created),
        "audit": audit_actor_metadata(tenant),
    }


@router.put("/articles/{article_id}")
async def update_article(
    article_id: str,
    request: Request,
    payload: ArticleUpdate,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    await require_feature(request, "blog_cms", workspace_id=workspace_id)

    articles = await _get_articles_collection(db)
    resolved_workspace_id = enforce_workspace_match(tenant, workspace_id, allow_super_admin=True)

    existing = await _resolve_article_by_id(db, resolved_workspace_id, article_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates.pop("workspace_id", None)
    updates.pop("created_by", None)

    if "category_id" in updates and not await _category_exists(db, resolved_workspace_id, updates.get("category_id")):
        raise HTTPException(status_code=400, detail="Referenced category does not exist in this workspace")

    if "title" in updates:
        updates["slug"] = await _ensure_unique_slug(
            db,
            _generate_slug(updates["title"]),
            resolved_workspace_id,
            exclude_id=article_id,
        )

    if "status" in updates:
        normalized_status = _normalize_status(updates["status"], existing.get("status") or "draft")
        _enforce_main_site_publish_rule(request, resolved_workspace_id, normalized_status)
        updates["status"] = normalized_status

    merged_content = updates.get("content", existing.get("content", ""))
    if "excerpt" not in updates:
        updates["excerpt"] = updates.get("excerpt") or existing.get("excerpt") or _excerpt_from_content(merged_content)

    updates["seo_title"] = updates.get("seo_title", existing.get("seo_title")) or updates.get("title", existing.get("title"))
    updates["seo_description"] = (
        updates.get("seo_description", existing.get("seo_description"))
        or updates.get("excerpt")
        or _excerpt_from_content(merged_content)
    )

    if updates.get("status") == "published" and not existing.get("published_at"):
        updates["published_at"] = _utcnow()

    if updates.get("status") in {"draft", "review", "archived"} and existing.get("status") == "published":
        updates["published_at"] = existing.get("published_at")

    updates["updated_at"] = _utcnow()
    updates["updated_by"] = tenant.user_id

    await articles.update_one(
        {"id": article_id, "workspace_id": resolved_workspace_id},
        {"$set": updates},
    )

    updated = await _resolve_article_by_id(db, resolved_workspace_id, article_id)

    return {
        "article": _clean_doc(updated),
        "audit": audit_actor_metadata(tenant),
    }


@router.delete("/articles/{article_id}")
async def delete_article(
    article_id: str,
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_admin(request)
    db = get_db_from_request(request)

    await require_feature(request, "blog_cms", workspace_id=workspace_id)

    articles = await _get_articles_collection(db)
    resolved_workspace_id = enforce_workspace_match(tenant, workspace_id, allow_super_admin=True)

    _enforce_main_site_delete_rule(request, resolved_workspace_id)

    result = await articles.delete_one(
        {"id": article_id, "workspace_id": resolved_workspace_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")

    return {
        "deleted": True,
        "article_id": article_id,
        "workspace_id": resolved_workspace_id,
    }


@router.get("/categories")
async def list_categories(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    await require_feature(request, "blog_cms", workspace_id=workspace_id)

    categories = await _get_categories_collection(db)
    articles = await _get_articles_collection(db)
    resolved_workspace_id = enforce_workspace_match(tenant, workspace_id, allow_super_admin=True)

    docs = await categories.find(
        {"workspace_id": resolved_workspace_id},
        {"_id": 0},
    ).sort("name", 1).to_list(length=limit)

    results: list[dict[str, Any]] = []
    for category in docs:
        count = await articles.count_documents(
            {
                "workspace_id": resolved_workspace_id,
                "category_id": category["id"],
            }
        )
        cleaned = _clean_doc(category)
        cleaned["article_count"] = count
        results.append(cleaned)

    return {
        "workspace_id": resolved_workspace_id,
        "categories": results,
        "total": len(results),
    }


@router.post("/categories")
async def create_category(
    request: Request,
    payload: CategoryCreate,
):
    tenant = require_tenant_admin(request)
    db = get_db_from_request(request)

    await require_feature(request, "blog_cms")

    categories = await _get_categories_collection(db)

    slug = payload.slug or _generate_slug(payload.name)

    existing = await categories.find_one(
        {"workspace_id": tenant.workspace_id, "slug": slug},
        {"_id": 0, "id": 1},
    )
    if existing:
        raise HTTPException(status_code=400, detail="Category slug already exists in this workspace")

    base = payload.model_dump()
    now = _utcnow()

    stamped = stamp_tenant_fields(
        base,
        tenant,
        workspace_field="workspace_id",
        user_field="created_by",
        force_user_id=True,
        force_workspace_id=True,
    )
    stamped["id"] = _new_id()
    stamped["slug"] = slug
    stamped["created_at"] = now
    stamped["updated_at"] = now
    stamped["updated_by"] = tenant.user_id

    result = await categories.insert_one(stamped)
    created = await categories.find_one({"_id": result.inserted_id}, {"_id": 0})

    return {
        "category": _clean_doc(created),
        "audit": audit_actor_metadata(tenant),
    }


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
):
    tenant = require_tenant_admin(request)
    db = get_db_from_request(request)

    await require_feature(request, "blog_cms", workspace_id=workspace_id)

    categories = await _get_categories_collection(db)
    articles = await _get_articles_collection(db)
    resolved_workspace_id = enforce_workspace_match(tenant, workspace_id, allow_super_admin=True)

    _enforce_main_site_delete_rule(request, resolved_workspace_id)

    result = await categories.delete_one(
        {"id": category_id, "workspace_id": resolved_workspace_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")

    await articles.update_many(
        {"workspace_id": resolved_workspace_id, "category_id": category_id},
        {
            "$set": {
                "category_id": None,
                "updated_at": _utcnow(),
                "updated_by": tenant.user_id,
            }
        },
    )

    return {
        "deleted": True,
        "category_id": category_id,
        "workspace_id": resolved_workspace_id,
    }


@router.get("/public/articles")
async def public_articles(
    request: Request,
    category_id: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    workspace_id: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    db = get_db_from_request(request)
    articles = await _get_articles_collection(db)

    query: dict[str, Any] = {"status": "published"}

    if workspace_id:
        query["workspace_id"] = workspace_id
    if category_id:
        query["category_id"] = category_id
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
        ]

    total = await articles.count_documents(query)
    docs = await articles.find(
        query,
        {"_id": 0, "content": 0},
    ).sort("published_at", -1).skip(offset).limit(limit).to_list(length=limit)

    return {
        "articles": [_clean_doc(doc) for doc in docs],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/public/articles/{slug}")
async def public_article(
    slug: str,
    request: Request,
):
    db = get_db_from_request(request)
    articles = await _get_articles_collection(db)

    article = await _resolve_article_by_slug_public(db, slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    await articles.update_one(
        {"id": article["id"]},
        {"$inc": {"views": 1}},
    )
    article["views"] = int(article.get("views", 0) or 0) + 1

    return {"article": _clean_doc(article)}


@router.get("/public/categories")
async def public_categories(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
):
    db = get_db_from_request(request)
    categories = await _get_categories_collection(db)
    articles = await _get_articles_collection(db)

    category_query: dict[str, Any] = {}
    if workspace_id:
        category_query["workspace_id"] = workspace_id

    docs = await categories.find(category_query, {"_id": 0}).sort("name", 1).to_list(length=200)

    published_counts: dict[str, int] = {}
    for category in docs:
        count_query: dict[str, Any] = {
            "status": "published",
            "category_id": category["id"],
        }
        if workspace_id:
            count_query["workspace_id"] = workspace_id

        count = await articles.count_documents(count_query)
        if count > 0:
            published_counts[category["id"]] = count

    results: list[dict[str, Any]] = []
    for category in docs:
        if category["id"] in published_counts:
            cleaned = _clean_doc(category)
            cleaned["article_count"] = published_counts[category["id"]]
            results.append(cleaned)

    return {
        "categories": results,
        "total": len(results),
    }


@router.get("/admin/all")
async def admin_all_articles(
    request: Request,
    status: Optional[str] = Query(default=None),
    workspace_id: Optional[str] = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
):
    require_platform_admin(request)
    db = get_db_from_request(request)

    articles = await _get_articles_collection(db)

    query: dict[str, Any] = {}
    if status:
        query["status"] = _normalize_status(status)
    if workspace_id:
        query["workspace_id"] = workspace_id

    docs = await articles.find(
        query,
        {"_id": 0},
    ).sort("updated_at", -1).to_list(length=limit)

    return {
        "articles": [_clean_doc(doc) for doc in docs],
        "total": len(docs),
    }
