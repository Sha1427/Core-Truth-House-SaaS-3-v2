from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import Depends, HTTPException, Request, status

from backend.app.core.auth import get_current_user


# ============================================================================
# TENANT CONTEXT
# ============================================================================

@dataclass
class TenantContext:
    workspace_id: str
    user_id: str
    role: str | None = None
    global_role: str | None = None
    is_admin: bool = False
    is_super_admin: bool = False


# ============================================================================
# INTERNAL HELPERS
# ============================================================================

def _string(value: Any) -> str:
    return str(value or "").strip()


def _get_request_db(request: Request) -> Any:
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not initialized",
        )
    return db


async def _resolve_membership_role(
    db: Any,
    *,
    workspace_id: str,
    user_id: str,
    fallback_role: str | None = None,
    is_super_admin: bool = False,
) -> str | None:
    if is_super_admin:
        return "owner"

    collection_names = set(await db.list_collection_names())

    candidate_collections = [
        "workspace_members",
        "team_members",
        "memberships",
        "workspace_users",
    ]

    for collection_name in candidate_collections:
        if collection_name not in collection_names:
            continue

        collection = getattr(db, collection_name)

        doc = await collection.find_one(
            {
                "workspace_id": workspace_id,
                "$or": [
                    {"user_id": user_id},
                    {"member_id": user_id},
                    {"clerk_user_id": user_id},
                    {"id": user_id},
                ],
            }
        )

        if doc:
            role = (
                doc.get("role")
                or doc.get("workspace_role")
                or doc.get("member_role")
                or fallback_role
            )
            return _string(role) or fallback_role

    return fallback_role


# ============================================================================
# PRIMARY TENANT CONTEXT
# ============================================================================

async def get_tenant_context(
    request: Request,
    user: dict[str, Any] = Depends(get_current_user),
) -> TenantContext:
    workspace_id = _string(
        request.headers.get("X-Workspace-ID")
        or request.headers.get("X-Workspace-Id")
        or request.headers.get("x-workspace-id")
        or user.get("workspace_id")
    )

    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing workspace context",
        )

    user_id = _string(user.get("user_id") or user.get("id"))
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated",
        )

    global_role = _string(user.get("global_role")) or None
    workspace_role = _string(user.get("workspace_role")) or None
    is_super_admin = bool(user.get("is_super_admin", False))
    is_admin = bool(user.get("is_admin", False)) or is_super_admin

    db = _get_request_db(request)
    resolved_role = await _resolve_membership_role(
        db,
        workspace_id=workspace_id,
        user_id=user_id,
        fallback_role=workspace_role,
        is_super_admin=is_super_admin,
    )

    return TenantContext(
        workspace_id=workspace_id,
        user_id=user_id,
        role=resolved_role,
        global_role=global_role,
        is_admin=is_admin,
        is_super_admin=is_super_admin,
    )


# ============================================================================
# PUBLIC HELPERS EXPECTED BY ROUTERS
# ============================================================================

def get_db_from_request(request: Request) -> Any:
    return _get_request_db(request)


def stamp_tenant_fields(doc: dict[str, Any] | None, tenant: TenantContext) -> dict[str, Any]:
    stamped = dict(doc or {})
    stamped["workspace_id"] = tenant.workspace_id

    stamped.setdefault("user_id", tenant.user_id)
    stamped.setdefault("created_by", tenant.user_id)
    stamped["updated_by"] = tenant.user_id

    if tenant.role:
        stamped.setdefault("workspace_role", tenant.role)

    return stamped


async def require_tenant_member(
    request: Request,
    tenant: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    if tenant.is_super_admin:
        return tenant

    if not tenant.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Workspace membership required",
        )

    return tenant


async def require_tenant_admin(
    request: Request,
    tenant: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    if tenant.is_super_admin:
        return tenant

    allowed_admin_roles = {"owner", "admin"}

    if _string(tenant.role).lower() not in allowed_admin_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Workspace admin access required",
        )

    return tenant


# ============================================================================
# OPTIONAL LEGACY COMPAT
# ============================================================================

class TenantDB:
    """
    Temporary compatibility wrapper for older code paths.
    """

    def __init__(self, db: Any):
        self.db = db


def get_tenant_db(request: Request) -> TenantDB:
    return TenantDB(_get_request_db(request))


# ============================================================================
# AUDIT METADATA
# ============================================================================

async def audit_actor_metadata(
    tenant: TenantContext = Depends(get_tenant_context),
) -> dict[str, str]:
    return {
        "workspace_id": tenant.workspace_id,
        "user_id": tenant.user_id,
    }
