from __future__ import annotations

"""
Production-safe user plan route for Core Truth House.

Goals:
- Resolve the authenticated user server-side
- Resolve the active workspace server-side when possible
- Return a stable contract for PlanContext / PlanGate
- Never silently downgrade to "anonymous" in production
"""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Query, Request, status

logger = logging.getLogger("coretruthhouse.user_plan")

router = APIRouter(prefix="/user", tags=["user"])


# =========================================================
# Defaults / catalog
# =========================================================

PLAN_DEFAULT = "foundation"

PLAN_LIMITS: Dict[str, Dict[str, Any]] = {
    "free": {
        "workflow_runs_monthly": 10,
        "storage_mb": 250,
        "team_members": 1,
    },
    "audit": {
        "workflow_runs_monthly": 20,
        "storage_mb": 500,
        "team_members": 1,
    },
    "foundation": {
        "workflow_runs_monthly": 30,
        "storage_mb": 1000,
        "team_members": 3,
    },
    "structure": {
        "workflow_runs_monthly": 100,
        "storage_mb": 5000,
        "team_members": 10,
    },
    "house": {
        "workflow_runs_monthly": 500,
        "storage_mb": 20000,
        "team_members": 25,
    },
    "estate": {
        "workflow_runs_monthly": 2000,
        "storage_mb": 100000,
        "team_members": 100,
    },
    "legacy": {
        "workflow_runs_monthly": 10000,
        "storage_mb": 500000,
        "team_members": 999,
    },
}

PLAN_ENTITLEMENTS: Dict[str, Dict[str, bool]] = {
    "free": {
        "crm": False,
        "calendar": False,
        "analytics": False,
        "documents": False,
        "media": False,
        "agentic_workflows": False,
        "billing": False,
        "admin_dashboard": False,
    },
    "audit": {
        "crm": False,
        "calendar": False,
        "analytics": True,
        "documents": False,
        "media": False,
        "agentic_workflows": False,
        "billing": True,
        "admin_dashboard": False,
    },
    "foundation": {
        "crm": True,
        "calendar": True,
        "analytics": True,
        "documents": True,
        "media": False,
        "agentic_workflows": False,
        "billing": True,
        "admin_dashboard": False,
    },
    "structure": {
        "crm": True,
        "calendar": True,
        "analytics": True,
        "documents": True,
        "media": True,
        "agentic_workflows": False,
        "billing": True,
        "admin_dashboard": False,
    },
    "house": {
        "crm": True,
        "calendar": True,
        "analytics": True,
        "documents": True,
        "media": True,
        "agentic_workflows": True,
        "billing": True,
        "admin_dashboard": False,
    },
    "estate": {
        "crm": True,
        "calendar": True,
        "analytics": True,
        "documents": True,
        "media": True,
        "agentic_workflows": True,
        "billing": True,
        "admin_dashboard": True,
    },
    "legacy": {
        "crm": True,
        "calendar": True,
        "analytics": True,
        "documents": True,
        "media": True,
        "agentic_workflows": True,
        "billing": True,
        "admin_dashboard": True,
    },
}


# =========================================================
# Helpers
# =========================================================

def _as_dict(value: Any) -> Dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _string(value: Any, default: Optional[str] = None) -> Optional[str]:
    if value is None:
        return default
    text = str(value).strip()
    return text or default


def _normalize_plan(value: Any) -> str:
    raw = _string(value, PLAN_DEFAULT)
    if not raw:
        return PLAN_DEFAULT
    plan = raw.strip().lower()
    return plan if plan in PLAN_LIMITS else PLAN_DEFAULT


def _normalize_role(value: Any, default: str = "MEMBER") -> str:
    raw = _string(value, default)
    if not raw:
        return default
    return raw.strip().upper()


def _truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "on"}
    if isinstance(value, (int, float)):
        return bool(value)
    return False


def _merge_entitlements(plan: str, workspace_doc: Dict[str, Any]) -> Dict[str, bool]:
    base = dict(PLAN_ENTITLEMENTS.get(plan, PLAN_ENTITLEMENTS[PLAN_DEFAULT]))
    db_entitlements = _as_dict(workspace_doc.get("entitlements"))
    for key, value in db_entitlements.items():
        base[str(key)] = _truthy(value)
    return base


def _merge_limits(plan: str, workspace_doc: Dict[str, Any]) -> Dict[str, Any]:
    base = dict(PLAN_LIMITS.get(plan, PLAN_LIMITS[PLAN_DEFAULT]))
    db_limits = _as_dict(workspace_doc.get("limits"))
    for key, value in db_limits.items():
        base[str(key)] = value
    return base


async def _resolve_current_user(request: Request) -> Dict[str, Any]:
    """
    Resolve the authenticated user via your backend auth layer.

    This intentionally fails closed.
    """
    auth_errors = []

    # Preferred: your existing auth helper
    try:
        from backend.app.core.auth import get_current_user  # type: ignore
        user = await get_current_user(request)
        if isinstance(user, dict) and user:
            return user
    except Exception as exc:
        auth_errors.append(f"backend.app.core.auth.get_current_user failed: {exc}")

    # Secondary fallback if auth helper was relocated
    try:
        from backend.core.auth import get_current_user  # type: ignore
        user = await get_current_user(request)
        if isinstance(user, dict) and user:
            return user
    except Exception as exc:
        auth_errors.append(f"backend.core.auth.get_current_user failed: {exc}")

    logger.warning("User authentication failed in /user/plan: %s", " | ".join(auth_errors))
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
    )


def _extract_user_id(user: Dict[str, Any]) -> str:
    for key in ("user_id", "id", "clerk_user_id", "clerk_id", "sub"):
        value = _string(user.get(key))
        if value:
            return value
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authenticated user is missing a stable user id",
    )


def _extract_global_role(user: Dict[str, Any]) -> str:
    public_metadata = _as_dict(user.get("public_metadata") or user.get("publicMetadata"))
    private_metadata = _as_dict(user.get("private_metadata") or user.get("privateMetadata"))
    unsafe_metadata = _as_dict(user.get("unsafe_metadata") or user.get("unsafeMetadata"))

    return _normalize_role(
        user.get("global_role")
        or public_metadata.get("global_role")
        or private_metadata.get("global_role")
        or unsafe_metadata.get("global_role")
        or user.get("role"),
        "MEMBER",
    )


def _extract_super_admin(user: Dict[str, Any], global_role: str) -> bool:
    if global_role == "SUPER_ADMIN":
        return True

    public_metadata = _as_dict(user.get("public_metadata") or user.get("publicMetadata"))
    private_metadata = _as_dict(user.get("private_metadata") or user.get("privateMetadata"))
    unsafe_metadata = _as_dict(user.get("unsafe_metadata") or user.get("unsafeMetadata"))

    return any(
        _truthy(v)
        for v in (
            user.get("is_super_admin"),
            public_metadata.get("is_super_admin"),
            private_metadata.get("is_super_admin"),
            unsafe_metadata.get("is_super_admin"),
        )
    )


def _pick_workspace_id(
    request: Request,
    user: Dict[str, Any],
    workspace_hint: Optional[str],
) -> Optional[str]:
    """
    Workspace selection precedence:
    1. explicit workspace_id query param
    2. request header
    3. request state
    4. user payload
    """
    if workspace_hint:
        return workspace_hint

    header_workspace_id = _string(request.headers.get("X-Workspace-Id"))
    if header_workspace_id:
        return header_workspace_id

    request_state_workspace_id = _string(getattr(request.state, "workspace_id", None))
    if request_state_workspace_id:
        return request_state_workspace_id

    for key in ("workspace_id", "active_workspace_id", "current_workspace_id", "default_workspace_id"):
        value = _string(user.get(key))
        if value:
            return value

    return None


async def _resolve_workspace_document(
    workspace_id: Optional[str],
    user_id: str,
) -> Dict[str, Any]:
    """
    Best-effort workspace lookup across likely database helpers.

    Returns {} if not found.
    """
    if not workspace_id:
        return {}

    lookup_errors = []

    # Preferred workspace database helper
    try:
        from backend.workspace_db import get_workspace_by_id  # type: ignore
        doc = await get_workspace_by_id(workspace_id)
        if isinstance(doc, dict) and doc:
            return doc
    except Exception as exc:
        lookup_errors.append(f"workspace_db.get_workspace_by_id failed: {exc}")

    # Generic database access fallback
    try:
        from backend.database import db  # type: ignore
        if db is not None:
            doc = await db.workspaces.find_one(
                {
                    "workspace_id": workspace_id,
                    "$or": [
                        {"owner_user_id": user_id},
                        {"user_id": user_id},
                        {"members.user_id": user_id},
                        {"team_members.user_id": user_id},
                    ],
                }
            )
            if isinstance(doc, dict) and doc:
                return doc
    except Exception as exc:
        lookup_errors.append(f"database.db.workspaces lookup failed: {exc}")

    # Alternate app database location
    try:
        from backend.app.database import db  # type: ignore
        if db is not None:
            doc = await db.workspaces.find_one(
                {
                    "workspace_id": workspace_id,
                    "$or": [
                        {"owner_user_id": user_id},
                        {"user_id": user_id},
                        {"members.user_id": user_id},
                        {"team_members.user_id": user_id},
                    ],
                }
            )
            if isinstance(doc, dict) and doc:
                return doc
    except Exception as exc:
        lookup_errors.append(f"app.database.db.workspaces lookup failed: {exc}")

    logger.info(
        "Workspace lookup returned no document for workspace_id=%s user_id=%s. Details: %s",
        workspace_id,
        user_id,
        " | ".join(lookup_errors) if lookup_errors else "no adapters matched",
    )
    return {}


def _derive_workspace_role(user: Dict[str, Any], workspace_doc: Dict[str, Any]) -> Optional[str]:
    if workspace_doc:
        for key in ("workspace_role", "role"):
            value = _string(workspace_doc.get(key))
            if value:
                return _normalize_role(value)

    public_metadata = _as_dict(user.get("public_metadata") or user.get("publicMetadata"))
    private_metadata = _as_dict(user.get("private_metadata") or user.get("privateMetadata"))
    unsafe_metadata = _as_dict(user.get("unsafe_metadata") or user.get("unsafeMetadata"))

    value = (
        user.get("workspace_role")
        or public_metadata.get("workspace_role")
        or private_metadata.get("workspace_role")
        or unsafe_metadata.get("workspace_role")
    )
    return _normalize_role(value, "MEMBER") if value else None


def _derive_plan(workspace_doc: Dict[str, Any]) -> str:
    if not workspace_doc:
        return PLAN_DEFAULT

    billing = _as_dict(workspace_doc.get("billing"))
    subscription = _as_dict(workspace_doc.get("subscription"))

    return _normalize_plan(
        workspace_doc.get("plan")
        or workspace_doc.get("plan_id")
        or subscription.get("plan")
        or subscription.get("plan_id")
        or billing.get("plan")
        or billing.get("plan_id")
        or PLAN_DEFAULT
    )


def _derive_status(workspace_doc: Dict[str, Any]) -> str:
    if not workspace_doc:
        return "active"

    billing = _as_dict(workspace_doc.get("billing"))
    subscription = _as_dict(workspace_doc.get("subscription"))

    return _string(
        workspace_doc.get("status")
        or subscription.get("status")
        or billing.get("status"),
        "active",
    ) or "active"


# =========================================================
# Route
# =========================================================

@router.get("/plan")
async def get_user_plan(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
) -> Dict[str, Any]:
    """
    Return a stable user-plan contract for frontend gating.

    This endpoint intentionally does NOT trust a user_id query param.
    Identity is resolved from the authenticated request.
    """
    user = await _resolve_current_user(request)
    user_id = _extract_user_id(user)

    global_role = _extract_global_role(user)
    is_super_admin = _extract_super_admin(user, global_role)

    resolved_workspace_id = _pick_workspace_id(request, user, workspace_id)
    workspace_doc = await _resolve_workspace_document(resolved_workspace_id, user_id)

    workspace_role = _derive_workspace_role(user, workspace_doc)

    plan = _derive_plan(workspace_doc)
    status_value = _derive_status(workspace_doc)

    entitlements = _merge_entitlements(plan, workspace_doc)
    limits = _merge_limits(plan, workspace_doc)

    is_admin = is_super_admin or global_role in {
        "SUPER_ADMIN",
        "ADMIN",
        "OPS_ADMIN",
        "BILLING_ADMIN",
        "CONTENT_ADMIN",
        "SUPPORT_ADMIN",
    }

    resolved_role = "SUPER_ADMIN" if is_super_admin else (global_role or workspace_role or "MEMBER")

    if is_super_admin:
        entitlements["admin_dashboard"] = True

    response = {
        "user_id": user_id,
        "workspace_id": resolved_workspace_id,
        "plan": plan,
        "plan_id": plan,
        "status": status_value,
        "role": resolved_role,
        "global_role": global_role,
        "workspace_role": workspace_role,
        "is_admin": is_admin,
        "is_super_admin": is_super_admin,
        "entitlements": entitlements,
        "limits": limits,
    }

    return response
