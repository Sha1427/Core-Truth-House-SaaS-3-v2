from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request

from dependencies.auth_context import normalize_workspace_role
from middleware.tenant_dependencies import (
    TenantContext,
    audit_actor_metadata,
    enforce_workspace_match,
    get_db_from_request,
    get_tenant_context,
    require_platform_admin,
    require_tenant_context,
    require_tenant_member,
)


router = APIRouter(prefix="/api/permissions", tags=["permissions"])


WORKSPACE_ROLE_RANK: dict[str, int] = {
    "guest": 10,
    "viewer": 20,
    "member": 30,
    "editor": 40,
    "billing": 45,
    "admin": 80,
    "owner": 100,
}


def _rank_workspace_role(role: str | None) -> int:
    normalized = normalize_workspace_role(role)
    if not normalized:
        return 0
    return WORKSPACE_ROLE_RANK.get(normalized, 0)


def _is_same_workspace(tenant: TenantContext, workspace_id: str | None) -> bool:
    requested = str(workspace_id or "").strip()
    current = str(tenant.workspace_id or "").strip()
    return bool(requested and current and requested == current)


def _workspace_capabilities_for_role(role: str | None) -> dict[str, bool]:
    normalized = normalize_workspace_role(role)

    can_view = normalized in {
        "owner",
        "admin",
        "editor",
        "member",
        "viewer",
        "billing",
        "guest",
    }
    can_edit_content = normalized in {"owner", "admin", "editor"}
    can_manage_members = normalized in {"owner", "admin"}
    can_manage_workspace = normalized in {"owner", "admin"}
    can_manage_billing = normalized in {"owner", "admin", "billing"}
    can_publish_content = normalized in {"owner", "admin", "editor"}
    can_view_analytics = normalized in {
        "owner",
        "admin",
        "editor",
        "member",
        "billing",
        "viewer",
    }

    return {
        "can_view": can_view,
        "can_edit_content": can_edit_content,
        "can_manage_members": can_manage_members,
        "can_manage_workspace": can_manage_workspace,
        "can_manage_billing": can_manage_billing,
        "can_publish_content": can_publish_content,
        "can_view_analytics": can_view_analytics,
    }


def _super_admin_capabilities() -> dict[str, bool]:
    return {
        "can_view": True,
        "can_edit_content": True,
        "can_manage_members": True,
        "can_manage_workspace": True,
        "can_manage_billing": True,
        "can_publish_content": True,
        "can_view_analytics": True,
    }


async def _resolve_workspace_access_from_db(
    db,
    *,
    workspace_id: str,
    user_id: str,
) -> dict[str, Any] | None:
    workspace = await db.workspaces.find_one(
        {
            "$or": [
                {"id": workspace_id},
                {"workspace_id": workspace_id},
            ]
        },
        {"_id": 0, "id": 1, "workspace_id": 1, "owner_id": 1, "name": 1},
    )
    if not workspace:
        return None

    canonical_workspace_id = str(
        workspace.get("id") or workspace.get("workspace_id") or workspace_id
    ).strip()
    owner_id = str(workspace.get("owner_id") or "").strip()

    if owner_id and owner_id == user_id:
        return {
            "workspace_id": canonical_workspace_id,
            "workspace_role": "owner",
            "workspace_name": workspace.get("name"),
            "source": "owner",
        }

    membership = await db.workspace_members.find_one(
        {
            "workspace_id": {"$in": [workspace_id, canonical_workspace_id]},
            "user_id": user_id,
            "status": "active",
        },
        {"_id": 0, "role": 1},
    )
    if membership:
        role = normalize_workspace_role(membership.get("role"))
        if role:
            return {
                "workspace_id": canonical_workspace_id,
                "workspace_role": role,
                "workspace_name": workspace.get("name"),
                "source": "workspace_members",
            }

    team_membership = await db.team_members.find_one(
        {
            "workspace_id": {"$in": [workspace_id, canonical_workspace_id]},
            "user_id": user_id,
            "status": "active",
        },
        {"_id": 0, "role": 1},
    )
    if team_membership:
        role = normalize_workspace_role(team_membership.get("role"))
        if role:
            return {
                "workspace_id": canonical_workspace_id,
                "workspace_role": role,
                "workspace_name": workspace.get("name"),
                "source": "team_members",
            }

    return None


async def get_effective_workspace_access(
    request: Request,
    workspace_id: str | None = None,
) -> dict[str, Any]:
    tenant = require_tenant_context(request)
    db = get_db_from_request(request)

    target_workspace_id = str(workspace_id or "").strip()

    if tenant.is_super_admin:
        if not target_workspace_id and tenant.workspace_id:
            target_workspace_id = tenant.workspace_id

        if not target_workspace_id:
            return {
                "allowed": True,
                "workspace_id": None,
                "workspace_role": "owner",
                "workspace_name": None,
                "global_role": tenant.global_role,
                "is_admin": tenant.is_admin,
                "is_super_admin": tenant.is_super_admin,
                "source": "super_admin_global",
                "capabilities": _super_admin_capabilities(),
            }

        workspace = await db.workspaces.find_one(
            {
                "$or": [
                    {"id": target_workspace_id},
                    {"workspace_id": target_workspace_id},
                ]
            },
            {"_id": 0, "id": 1, "workspace_id": 1, "name": 1},
        )
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")

        canonical_workspace_id = str(
            workspace.get("id") or workspace.get("workspace_id") or target_workspace_id
        ).strip()

        return {
            "allowed": True,
            "workspace_id": canonical_workspace_id,
            "workspace_role": "owner",
            "workspace_name": workspace.get("name"),
            "global_role": tenant.global_role,
            "is_admin": tenant.is_admin,
            "is_super_admin": tenant.is_super_admin,
            "source": "super_admin_workspace",
            "capabilities": _super_admin_capabilities(),
        }

    if not target_workspace_id:
        if not tenant.workspace_id:
            raise HTTPException(status_code=400, detail="Workspace id required")
        target_workspace_id = tenant.workspace_id

    if _is_same_workspace(tenant, target_workspace_id):
        role = normalize_workspace_role(tenant.workspace_role)
        if not role:
            raise HTTPException(status_code=403, detail="Workspace access denied")

        workspace = await db.workspaces.find_one(
            {
                "$or": [
                    {"id": tenant.workspace_id},
                    {"workspace_id": tenant.workspace_id},
                ]
            },
            {"_id": 0, "id": 1, "workspace_id": 1, "name": 1},
        )

        return {
            "allowed": True,
            "workspace_id": tenant.workspace_id,
            "workspace_role": role,
            "workspace_name": (workspace or {}).get("name"),
            "global_role": tenant.global_role,
            "is_admin": tenant.is_admin,
            "is_super_admin": tenant.is_super_admin,
            "source": "request_state",
            "capabilities": _workspace_capabilities_for_role(role),
        }

    if not tenant.is_admin:
        raise HTTPException(status_code=403, detail="Cross-workspace access denied")

    resolved = await _resolve_workspace_access_from_db(
        db,
        workspace_id=target_workspace_id,
        user_id=tenant.user_id,
    )
    if not resolved:
        raise HTTPException(status_code=403, detail="Workspace access denied")

    role = normalize_workspace_role(resolved.get("workspace_role"))
    if not role:
        raise HTTPException(status_code=403, detail="Workspace access denied")

    return {
        "allowed": True,
        "workspace_id": resolved["workspace_id"],
        "workspace_role": role,
        "workspace_name": resolved.get("workspace_name"),
        "global_role": tenant.global_role,
        "is_admin": tenant.is_admin,
        "is_super_admin": tenant.is_super_admin,
        "source": resolved.get("source"),
        "capabilities": _workspace_capabilities_for_role(role),
    }


async def verify_workspace_access(
    request: Request,
    workspace_id: str | None = None,
    *,
    minimum_role: str | None = None,
) -> dict[str, Any]:
    access = await get_effective_workspace_access(request, workspace_id=workspace_id)

    required_rank = _rank_workspace_role(minimum_role)
    current_rank = _rank_workspace_role(access.get("workspace_role"))

    if required_rank and current_rank < required_rank:
        raise HTTPException(status_code=403, detail="Insufficient workspace role")

    return access


async def require_workspace_capability(
    request: Request,
    *,
    capability: str,
    workspace_id: str | None = None,
) -> dict[str, Any]:
    access = await get_effective_workspace_access(request, workspace_id=workspace_id)

    capabilities = access.get("capabilities") or {}
    if not bool(capabilities.get(capability, False)):
        raise HTTPException(status_code=403, detail=f"Missing permission: {capability}")

    return access


async def can_access_workspace(
    request: Request,
    workspace_id: str | None = None,
    *,
    minimum_role: str | None = None,
) -> bool:
    try:
        await verify_workspace_access(
            request,
            workspace_id=workspace_id,
            minimum_role=minimum_role,
        )
        return True
    except HTTPException:
        return False


async def require_workspace_admin_access(
    request: Request,
    workspace_id: str | None = None,
) -> dict[str, Any]:
    return await verify_workspace_access(
        request,
        workspace_id=workspace_id,
        minimum_role="admin",
    )


async def require_workspace_owner_access(
    request: Request,
    workspace_id: str | None = None,
) -> dict[str, Any]:
    return await verify_workspace_access(
        request,
        workspace_id=workspace_id,
        minimum_role="owner",
    )


@router.get("/me")
async def get_my_permissions(request: Request):
    tenant = get_tenant_context(request)

    payload = {
        "user_id": tenant.user_id,
        "workspace_id": tenant.workspace_id,
        "workspace_role": tenant.workspace_role,
        "global_role": tenant.global_role,
        "is_admin": tenant.is_admin,
        "is_super_admin": tenant.is_super_admin,
        "capabilities": (
            _super_admin_capabilities()
            if tenant.is_super_admin
            else _workspace_capabilities_for_role(tenant.workspace_role)
        ),
        "audit": audit_actor_metadata(tenant),
    }
    return payload


@router.get("/workspace/{workspace_id}")
async def inspect_workspace_permissions(workspace_id: str, request: Request):
    access = await get_effective_workspace_access(request, workspace_id=workspace_id)
    return access


@router.get("/workspace/current")
async def inspect_current_workspace_permissions(request: Request):
    tenant = require_tenant_member(request)
    access = await get_effective_workspace_access(
        request,
        workspace_id=tenant.workspace_id,
    )
    return access


@router.get("/workspace/{workspace_id}/admin-check")
async def admin_check_for_workspace(workspace_id: str, request: Request):
    access = await require_workspace_admin_access(
        request,
        workspace_id=workspace_id,
    )
    return {
        "allowed": True,
        "workspace_id": access["workspace_id"],
        "workspace_role": access["workspace_role"],
        "capabilities": access["capabilities"],
    }


@router.get("/platform/admin")
async def platform_admin_permissions(request: Request):
    tenant = require_platform_admin(request)
    return {
        "allowed": True,
        "user_id": tenant.user_id,
        "global_role": tenant.global_role,
        "is_admin": tenant.is_admin,
        "is_super_admin": tenant.is_super_admin,
        "audit": audit_actor_metadata(tenant),
    }
