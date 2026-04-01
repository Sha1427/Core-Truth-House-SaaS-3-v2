from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel, Field

from dependencies.auth_context import normalize_global_role
from middleware.tenant_dependencies import (
    audit_actor_metadata,
    get_db_from_request,
    require_platform_admin,
    require_platform_super_admin,
)


router = APIRouter(prefix="/api/admin", tags=["admin"])


ALLOWED_GLOBAL_ROLE_UPDATES = {
    "user",
    "admin",
    "super_admin",
}

ALLOWED_WORKSPACE_STATUSES = {
    "active",
    "inactive",
    "suspended",
    "trialing",
    "cancelled",
    "archived",
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


async def _collection_exists(db, name: str) -> bool:
    return name in await db.list_collection_names()


async def _resolve_workspace(
    db,
    workspace_id: str,
    *,
    projection: dict[str, int] | None = None,
) -> dict[str, Any] | None:
    return await db.workspaces.find_one(
        {"$or": [{"id": workspace_id}, {"workspace_id": workspace_id}]},
        projection or {"_id": 0},
    )


async def _resolve_user(
    db,
    user_id: str,
    *,
    projection: dict[str, int] | None = None,
) -> dict[str, Any] | None:
    return await db.users.find_one(
        {"$or": [{"id": user_id}, {"clerk_user_id": user_id}, {"clerk_id": user_id}]},
        projection or {"_id": 0},
    )


def _canonical_workspace_id(workspace: dict[str, Any], fallback: str) -> str:
    return str(workspace.get("id") or workspace.get("workspace_id") or fallback).strip()


class WorkspaceStatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=50)


class WorkspacePlanUpdate(BaseModel):
    plan_id: str = Field(min_length=1, max_length=100)


class UserRoleUpdate(BaseModel):
    role: str = Field(min_length=1, max_length=100)


@router.get("/me")
async def admin_me(request: Request):
    tenant = require_platform_admin(request)

    return {
        "allowed": True,
        "user_id": tenant.user_id,
        "clerk_user_id": tenant.clerk_user_id,
        "global_role": tenant.global_role,
        "is_admin": tenant.is_admin,
        "is_super_admin": tenant.is_super_admin,
        "user": _clean_doc(tenant.user_record),
        "audit": audit_actor_metadata(tenant),
    }


@router.get("/overview")
async def admin_overview(request: Request):
    tenant = require_platform_admin(request)
    db = get_db_from_request(request)

    workspace_count = await db.workspaces.count_documents({})
    user_count = await db.users.count_documents({})
    active_workspace_count = await db.workspaces.count_documents({"status": "active"})
    active_user_count = await db.users.count_documents({"status": "active"})

    completed_store_orders = 0
    completed_store_revenue = 0
    if await _collection_exists(db, "store_purchases"):
        completed_store_orders = await db.store_purchases.count_documents({"status": "completed"})
        store_docs = await db.store_purchases.find(
            {"status": "completed"},
            {"_id": 0, "amount_cents": 1},
        ).to_list(length=5000)
        completed_store_revenue = sum(int(item.get("amount_cents", 0) or 0) for item in store_docs)

    billing_revenue = 0
    billing_paid_count = 0
    if await _collection_exists(db, "billing_transactions"):
        billing_paid_count = await db.billing_transactions.count_documents(
            {"status": {"$in": ["paid", "completed"]}}
        )
        billing_docs = await db.billing_transactions.find(
            {"status": {"$in": ["paid", "completed"]}},
            {"_id": 0, "amount_cents": 1},
        ).to_list(length=5000)
        billing_revenue = sum(int(item.get("amount_cents", 0) or 0) for item in billing_docs)

    return {
        "workspaces": {
            "total": workspace_count,
            "active": active_workspace_count,
        },
        "users": {
            "total": user_count,
            "active": active_user_count,
        },
        "store": {
            "completed_orders": completed_store_orders,
            "revenue_cents": completed_store_revenue,
            "revenue_dollars": round(completed_store_revenue / 100, 2),
        },
        "billing": {
            "paid_transactions": billing_paid_count,
            "revenue_cents": billing_revenue,
            "revenue_dollars": round(billing_revenue / 100, 2),
        },
        "viewer": {
            "user_id": tenant.user_id,
            "global_role": tenant.global_role,
            "is_super_admin": tenant.is_super_admin,
        },
        "generated_at": _utcnow().isoformat(),
    }


@router.get("/workspaces")
async def admin_list_workspaces(
    request: Request,
    search: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
):
    require_platform_admin(request)
    db = get_db_from_request(request)

    query: dict[str, Any] = {}

    if status:
        query["status"] = status

    if search:
        query["$or"] = [
            {"id": {"$regex": search, "$options": "i"}},
            {"workspace_id": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
            {"owner_id": {"$regex": search, "$options": "i"}},
            {"owner_email": {"$regex": search, "$options": "i"}},
        ]

    workspaces = await db.workspaces.find(
        query,
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=limit)

    return {
        "workspaces": [_clean_doc(item) for item in workspaces],
        "total": len(workspaces),
    }


@router.get("/workspaces/{workspace_id}")
async def admin_get_workspace(workspace_id: str, request: Request):
    require_platform_admin(request)
    db = get_db_from_request(request)

    workspace = await _resolve_workspace(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    canonical_workspace_id = _canonical_workspace_id(workspace, workspace_id)

    members: list[dict[str, Any]] = []
    if await _collection_exists(db, "workspace_members"):
        members = await db.workspace_members.find(
            {"workspace_id": {"$in": [workspace_id, canonical_workspace_id]}},
            {"_id": 0},
        ).to_list(length=500)

    team_members: list[dict[str, Any]] = []
    if await _collection_exists(db, "team_members"):
        team_members = await db.team_members.find(
            {"workspace_id": {"$in": [workspace_id, canonical_workspace_id]}},
            {"_id": 0},
        ).to_list(length=500)

    return {
        "workspace": _clean_doc(workspace),
        "workspace_members": [_clean_doc(item) for item in members],
        "team_members": [_clean_doc(item) for item in team_members],
    }


@router.put("/workspaces/{workspace_id}/status")
async def admin_update_workspace_status(
    workspace_id: str,
    data: WorkspaceStatusUpdate,
    request: Request,
):
    tenant = require_platform_super_admin(request)
    db = get_db_from_request(request)

    normalized_status = str(data.status or "").strip().lower()
    if normalized_status not in ALLOWED_WORKSPACE_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid workspace status")

    result = await db.workspaces.update_one(
        {"$or": [{"id": workspace_id}, {"workspace_id": workspace_id}]},
        {
            "$set": {
                "status": normalized_status,
                "updated_at": _utcnow(),
                "updated_by": tenant.user_id,
                "updated_by_role": tenant.global_role,
            }
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Workspace not found")

    updated = await _resolve_workspace(db, workspace_id)
    return {"workspace": _clean_doc(updated)}


@router.put("/workspaces/{workspace_id}/plan")
async def admin_update_workspace_plan(
    workspace_id: str,
    data: WorkspacePlanUpdate,
    request: Request,
):
    tenant = require_platform_super_admin(request)
    db = get_db_from_request(request)

    plan_id = str(data.plan_id or "").strip()
    if not plan_id:
        raise HTTPException(status_code=400, detail="Plan id is required")

    result = await db.workspaces.update_one(
        {"$or": [{"id": workspace_id}, {"workspace_id": workspace_id}]},
        {
            "$set": {
                "plan_id": plan_id,
                "updated_at": _utcnow(),
                "updated_by": tenant.user_id,
                "updated_by_role": tenant.global_role,
            }
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Workspace not found")

    updated = await _resolve_workspace(db, workspace_id)
    return {"workspace": _clean_doc(updated)}


@router.get("/users")
async def admin_list_users(
    request: Request,
    search: Optional[str] = Query(default=None),
    role: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
):
    require_platform_admin(request)
    db = get_db_from_request(request)

    query: dict[str, Any] = {}

    if role:
        query["role"] = normalize_global_role(role)

    if search:
        query["$or"] = [
            {"id": {"$regex": search, "$options": "i"}},
            {"clerk_user_id": {"$regex": search, "$options": "i"}},
            {"clerk_id": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    users = await db.users.find(
        query,
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=limit)

    return {
        "users": [_clean_doc(item) for item in users],
        "total": len(users),
    }


@router.get("/users/{user_id}")
async def admin_get_user(user_id: str, request: Request):
    require_platform_admin(request)
    db = get_db_from_request(request)

    user = await _resolve_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    memberships: list[dict[str, Any]] = []
    if await _collection_exists(db, "workspace_members"):
        memberships = await db.workspace_members.find(
            {"user_id": str(user.get("id") or "").strip()},
            {"_id": 0},
        ).to_list(length=500)

    return {
        "user": _clean_doc(user),
        "workspace_memberships": [_clean_doc(item) for item in memberships],
    }


@router.put("/users/{user_id}/role")
async def admin_update_user_role(
    user_id: str,
    data: UserRoleUpdate,
    request: Request,
):
    tenant = require_platform_super_admin(request)
    db = get_db_from_request(request)

    normalized_role = normalize_global_role(data.role)
    if normalized_role not in ALLOWED_GLOBAL_ROLE_UPDATES:
        raise HTTPException(status_code=400, detail="Invalid user role")

    target_user = await _resolve_user(db, user_id, projection={"_id": 0, "id": 1, "role": 1})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if str(target_user.get("id") or "").strip() == tenant.user_id and normalized_role != "super_admin":
        raise HTTPException(status_code=400, detail="Cannot downgrade your own super admin access")

    result = await db.users.update_one(
        {"$or": [{"id": user_id}, {"clerk_user_id": user_id}, {"clerk_id": user_id}]},
        {
            "$set": {
                "role": normalized_role,
                "updated_at": _utcnow(),
                "updated_by": tenant.user_id,
                "updated_by_role": tenant.global_role,
            }
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    updated = await _resolve_user(db, user_id)
    return {"user": _clean_doc(updated)}


@router.get("/store/products")
async def admin_store_products(
    request: Request,
    limit: int = Query(default=200, ge=1, le=1000),
):
    require_platform_admin(request)
    db = get_db_from_request(request)

    if not await _collection_exists(db, "store_products"):
        return {
            "products": [],
            "total": 0,
        }

    products = await db.store_products.find(
        {},
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=limit)

    return {
        "products": [_clean_doc(item) for item in products],
        "total": len(products),
    }


@router.get("/store/orders")
async def admin_store_orders(
    request: Request,
    status: Optional[str] = Query(default=None),
    limit: int = Query(default=500, ge=1, le=2000),
):
    require_platform_admin(request)
    db = get_db_from_request(request)

    if not await _collection_exists(db, "store_purchases"):
        return {
            "orders": [],
            "total": 0,
            "completed_revenue_cents": 0,
            "completed_revenue_dollars": 0.0,
        }

    query: dict[str, Any] = {}
    if status:
        query["status"] = status

    orders = await db.store_purchases.find(
        query,
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=limit)

    total_cents = sum(
        int(item.get("amount_cents", 0) or 0)
        for item in orders
        if item.get("status") == "completed"
    )

    return {
        "orders": [_clean_doc(item) for item in orders],
        "total": len(orders),
        "completed_revenue_cents": total_cents,
        "completed_revenue_dollars": round(total_cents / 100, 2),
    }


@router.get("/documents")
async def admin_documents(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
    limit: int = Query(default=500, ge=1, le=2000),
):
    require_platform_admin(request)
    db = get_db_from_request(request)

    if not await _collection_exists(db, "documents"):
        return {
            "documents": [],
            "total": 0,
        }

    query: dict[str, Any] = {}
    if workspace_id:
        query["workspace_id"] = workspace_id

    documents = await db.documents.find(
        query,
        {"_id": 0},
    ).sort("updated_at", -1).to_list(length=limit)

    return {
        "documents": [_clean_doc(item) for item in documents],
        "total": len(documents),
    }


@router.get("/audit/workspace-access/{workspace_id}")
async def admin_audit_workspace_access(workspace_id: str, request: Request):
    require_platform_admin(request)
    db = get_db_from_request(request)

    workspace = await _resolve_workspace(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    canonical_workspace_id = _canonical_workspace_id(workspace, workspace_id)

    workspace_members: list[dict[str, Any]] = []
    team_members: list[dict[str, Any]] = []

    if await _collection_exists(db, "workspace_members"):
        workspace_members = await db.workspace_members.find(
            {"workspace_id": {"$in": [workspace_id, canonical_workspace_id]}},
            {"_id": 0},
        ).to_list(length=1000)

    if await _collection_exists(db, "team_members"):
        team_members = await db.team_members.find(
            {"workspace_id": {"$in": [workspace_id, canonical_workspace_id]}},
            {"_id": 0},
        ).to_list(length=1000)

    return {
        "workspace": _clean_doc(workspace),
        "workspace_members": [_clean_doc(item) for item in workspace_members],
        "team_members": [_clean_doc(item) for item in team_members],
        "workspace_member_count": len(workspace_members),
        "team_member_count": len(team_members),
    }
