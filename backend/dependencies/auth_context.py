from __future__ import annotations

from typing import Any

from fastapi import HTTPException, Request


GLOBAL_ROLE_USER = "user"
GLOBAL_ROLE_ADMIN = "admin"
GLOBAL_ROLE_SUPER_ADMIN = "super_admin"

WORKSPACE_ROLE_OWNER = "owner"
WORKSPACE_ROLE_ADMIN = "admin"
WORKSPACE_ROLE_EDITOR = "editor"
WORKSPACE_ROLE_MEMBER = "member"
WORKSPACE_ROLE_VIEWER = "viewer"
WORKSPACE_ROLE_BILLING = "billing"
WORKSPACE_ROLE_GUEST = "guest"

ALLOWED_GLOBAL_ROLES = {
    GLOBAL_ROLE_USER,
    GLOBAL_ROLE_ADMIN,
    GLOBAL_ROLE_SUPER_ADMIN,
}

ALLOWED_WORKSPACE_ROLES = {
    WORKSPACE_ROLE_OWNER,
    WORKSPACE_ROLE_ADMIN,
    WORKSPACE_ROLE_EDITOR,
    WORKSPACE_ROLE_MEMBER,
    WORKSPACE_ROLE_VIEWER,
    WORKSPACE_ROLE_BILLING,
    WORKSPACE_ROLE_GUEST,
}

WORKSPACE_MEMBER_ROLES = {
    WORKSPACE_ROLE_OWNER,
    WORKSPACE_ROLE_ADMIN,
    WORKSPACE_ROLE_EDITOR,
    WORKSPACE_ROLE_MEMBER,
    WORKSPACE_ROLE_VIEWER,
    WORKSPACE_ROLE_BILLING,
    WORKSPACE_ROLE_GUEST,
}

WORKSPACE_ADMIN_ROLES = {
    WORKSPACE_ROLE_OWNER,
    WORKSPACE_ROLE_ADMIN,
}

ADMIN_GLOBAL_ROLES = {
    GLOBAL_ROLE_ADMIN,
    GLOBAL_ROLE_SUPER_ADMIN,
}


def _normalize_string(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip().lower()


def normalize_global_role(value: Any) -> str:
    role = _normalize_string(value)
    if role in {"superadmin", "super-admin", "super admin"}:
        return GLOBAL_ROLE_SUPER_ADMIN
    if role in {"administrator"}:
        return GLOBAL_ROLE_ADMIN
    if role in ALLOWED_GLOBAL_ROLES:
        return role
    return GLOBAL_ROLE_USER


def normalize_workspace_role(value: Any) -> str | None:
    role = _normalize_string(value)
    if not role:
        return None

    aliases = {
        "workspace_admin": WORKSPACE_ROLE_ADMIN,
        "workspace-admin": WORKSPACE_ROLE_ADMIN,
        "workspace owner": WORKSPACE_ROLE_OWNER,
        "workspace_owner": WORKSPACE_ROLE_OWNER,
        "workspace-owner": WORKSPACE_ROLE_OWNER,
    }
    role = aliases.get(role, role)

    if role in ALLOWED_WORKSPACE_ROLES:
        return role

    return None


def is_admin_global_role(value: Any) -> bool:
    return normalize_global_role(value) in ADMIN_GLOBAL_ROLES


def is_super_admin_global_role(value: Any) -> bool:
    return normalize_global_role(value) == GLOBAL_ROLE_SUPER_ADMIN


def is_workspace_member_role(value: Any) -> bool:
    normalized = normalize_workspace_role(value)
    return normalized in WORKSPACE_MEMBER_ROLES


def is_workspace_admin_role(value: Any) -> bool:
    normalized = normalize_workspace_role(value)
    return normalized in WORKSPACE_ADMIN_ROLES


def get_request_context(request: Request) -> dict[str, Any]:
    user_record = getattr(request.state, "user_record", None)

    global_role = normalize_global_role(
        getattr(request.state, "global_role", None)
        or (user_record or {}).get("role")
    )

    raw_workspace_role = getattr(request.state, "workspace_role", None)
    workspace_role = normalize_workspace_role(raw_workspace_role)

    state_is_super_admin = bool(getattr(request.state, "is_super_admin", False))
    state_is_admin = bool(getattr(request.state, "is_admin", False))

    is_super_admin = state_is_super_admin or is_super_admin_global_role(global_role)
    is_admin = state_is_admin or is_admin_global_role(global_role)

    return {
        "user_id": getattr(request.state, "user_id", None),
        "clerk_user_id": getattr(request.state, "clerk_user_id", None),
        "workspace_id": getattr(request.state, "workspace_id", None),
        "workspace_role": workspace_role,
        "global_role": global_role,
        "is_admin": is_admin,
        "is_super_admin": is_super_admin,
        "user_record": user_record,
    }


def require_authenticated_user(request: Request) -> dict[str, Any]:
    context = get_request_context(request)
    if not context["user_id"]:
        raise HTTPException(status_code=401, detail="Authentication required")
    return context


def require_workspace_context(request: Request) -> dict[str, Any]:
    context = require_authenticated_user(request)
    if not context["workspace_id"] and not context["is_super_admin"]:
        raise HTTPException(status_code=400, detail="Workspace context required")
    return context


def require_workspace_member(request: Request) -> dict[str, Any]:
    context = require_workspace_context(request)

    if context["is_super_admin"]:
        return context

    if not is_workspace_member_role(context["workspace_role"]):
        raise HTTPException(status_code=403, detail="Workspace access required")

    return context


def require_workspace_admin(request: Request) -> dict[str, Any]:
    context = require_workspace_context(request)

    if context["is_super_admin"]:
        return context

    if not is_workspace_admin_role(context["workspace_role"]):
        raise HTTPException(status_code=403, detail="Workspace admin access required")

    return context


def require_admin(request: Request) -> dict[str, Any]:
    context = require_authenticated_user(request)

    if not context["is_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")

    return context


def require_super_admin(request: Request) -> dict[str, Any]:
    context = require_authenticated_user(request)

    if not context["is_super_admin"]:
        raise HTTPException(status_code=403, detail="Super admin access required")

    return context
