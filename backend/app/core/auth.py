from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

from fastapi import Depends, HTTPException, Request, status

from dependencies.auth_context import (
    is_admin_global_role,
    is_super_admin_global_role,
    normalize_global_role,
    normalize_workspace_role,
)

try:
    from clerk_backend_api import Clerk  # type: ignore
except Exception:  # pragma: no cover
    Clerk = None  # type: ignore[assignment]


# ============================================================================
# CONFIG
# ============================================================================

AUTHORIZATION_HEADER = "Authorization"
BEARER_PREFIX = "bearer "

ENV_CLERK_SECRET_KEY = "CLERK_SECRET_KEY"
ENV_AUTH_ALLOW_UNSIGNED_DEV = "AUTH_ALLOW_UNSIGNED_DEV"
ENV_AUTH_DEV_USER_ID = "AUTH_DEV_USER_ID"

DEFAULT_DEV_USER_ID = "dev-user"


# ============================================================================
# LOW-LEVEL HELPERS
# ============================================================================

def _string(value: Any) -> str:
    return str(value or "").strip()


def _lower_string(value: Any) -> str:
    return _string(value).lower()


def _truthy_env(name: str, default: bool = False) -> bool:
    raw = _lower_string(os.getenv(name))
    if not raw:
        return default
    return raw in {"1", "true", "yes", "on"}


def _extract_state_value(request: Request, key: str, default: Any = None) -> Any:
    return getattr(request.state, key, default)


def _safe_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _extract_bearer_token(request: Request) -> str:
    auth_header = _string(request.headers.get(AUTHORIZATION_HEADER))
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header.",
        )

    if not auth_header.lower().startswith(BEARER_PREFIX):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header must use Bearer token format.",
        )

    token = auth_header[len(BEARER_PREFIX):].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token.",
        )
    return token


def _coerce_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return False


# ============================================================================
# CLERK CLIENT
# ============================================================================

def clerk_is_configured() -> bool:
    return bool(_string(os.getenv(ENV_CLERK_SECRET_KEY))) and Clerk is not None


@lru_cache(maxsize=1)
def get_clerk_client() -> Any | None:
    secret_key = _string(os.getenv(ENV_CLERK_SECRET_KEY))
    if not secret_key or Clerk is None:
        return None

    try:
        return Clerk(secret_key=secret_key)
    except Exception:
        return None


# ============================================================================
# USER NORMALIZATION
# ============================================================================

def _normalize_roles_from_payload(payload: dict[str, Any]) -> tuple[str, str | None]:
    global_role = normalize_global_role(
        payload.get("global_role")
        or payload.get("role")
        or payload.get("public_metadata", {}).get("global_role")
        or payload.get("private_metadata", {}).get("global_role")
    )

    workspace_role = normalize_workspace_role(
        payload.get("workspace_role")
        or payload.get("role_in_workspace")
        or payload.get("public_metadata", {}).get("workspace_role")
        or payload.get("private_metadata", {}).get("workspace_role")
    )

    return global_role, workspace_role


def _normalize_user_payload(payload: dict[str, Any]) -> dict[str, Any]:
    global_role, workspace_role = _normalize_roles_from_payload(payload)

    user_id = _string(
        payload.get("user_id")
        or payload.get("id")
        or payload.get("sub")
        or payload.get("subject")
    )
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user id not found.",
        )

    workspace_id = _string(
        payload.get("workspace_id")
        or payload.get("active_workspace_id")
        or payload.get("org_id")
        or payload.get("organization_id")
        or payload.get("public_metadata", {}).get("workspace_id")
        or payload.get("private_metadata", {}).get("workspace_id")
    ) or None

    clerk_user_id = _string(payload.get("clerk_user_id") or payload.get("sub") or user_id) or None
    session_id = _string(payload.get("session_id") or payload.get("sid")) or None

    is_super_admin = _coerce_bool(payload.get("is_super_admin")) or is_super_admin_global_role(global_role)
    is_admin = (
        _coerce_bool(payload.get("is_admin"))
        or is_admin_global_role(global_role)
        or is_super_admin
    )

    normalized = {
        "user_id": user_id,
        "id": user_id,
        "clerk_user_id": clerk_user_id,
        "session_id": session_id,
        "workspace_id": workspace_id,
        "workspace_role": workspace_role,
        "global_role": global_role,
        "is_admin": is_admin,
        "is_super_admin": is_super_admin,
        "user_record": _safe_dict(payload.get("user_record")) or None,
        "raw_session": payload,
        "auth_source": _string(payload.get("auth_source") or "normalized"),
    }

    return normalized


def _normalize_clerk_session(session: Any) -> dict[str, Any]:
    if isinstance(session, dict):
        raw = dict(session)
    else:
        raw = {
            "id": getattr(session, "id", None),
            "sid": getattr(session, "id", None) or getattr(session, "session_id", None),
            "user_id": getattr(session, "user_id", None),
            "sub": getattr(session, "sub", None),
            "subject": getattr(session, "subject", None),
            "status": getattr(session, "status", None),
            "auth_source": "clerk",
        }

    raw["session_id"] = raw.get("session_id") or raw.get("id") or raw.get("sid")
    raw["auth_source"] = "clerk"
    return _normalize_user_payload(raw)


def _build_user_from_request_state(request: Request) -> dict[str, Any] | None:
    state_user = _extract_state_value(request, "auth_user")
    if isinstance(state_user, dict) and _string(state_user.get("user_id")):
        normalized = _normalize_user_payload(
            {
                **state_user,
                "auth_source": state_user.get("auth_source") or "request_state",
            }
        )
        normalized["raw_session"] = state_user
        return normalized

    user_record = _extract_state_value(request, "user_record")
    global_role = normalize_global_role(
        _extract_state_value(request, "global_role")
        or _safe_dict(user_record).get("role")
    )
    workspace_role = normalize_workspace_role(_extract_state_value(request, "workspace_role"))

    user_id = _string(_extract_state_value(request, "user_id"))
    clerk_user_id = _string(_extract_state_value(request, "clerk_user_id")) or None
    workspace_id = _string(_extract_state_value(request, "workspace_id")) or None

    if not user_id:
        return None

    is_super_admin = (
        _coerce_bool(_extract_state_value(request, "is_super_admin"))
        or is_super_admin_global_role(global_role)
    )
    is_admin = (
        _coerce_bool(_extract_state_value(request, "is_admin"))
        or is_admin_global_role(global_role)
        or is_super_admin
    )

    return {
        "user_id": user_id,
        "id": user_id,
        "clerk_user_id": clerk_user_id,
        "session_id": None,
        "workspace_id": workspace_id,
        "workspace_role": workspace_role,
        "global_role": global_role,
        "is_admin": is_admin,
        "is_super_admin": is_super_admin,
        "user_record": user_record if isinstance(user_record, dict) else None,
        "raw_session": _extract_state_value(request, "auth_user"),
        "auth_source": "request_state",
    }


def _build_dev_user() -> dict[str, Any]:
    user_id = _string(os.getenv(ENV_AUTH_DEV_USER_ID, DEFAULT_DEV_USER_ID)) or DEFAULT_DEV_USER_ID
    payload = {
        "user_id": user_id,
        "id": user_id,
        "global_role": "super_admin",
        "workspace_role": "owner",
        "is_admin": True,
        "is_super_admin": True,
        "auth_source": "dev_fallback",
    }
    return _normalize_user_payload(payload)


def _cache_user_on_request(request: Request, user: dict[str, Any]) -> dict[str, Any]:
    request.state.auth_user = user
    request.state.user_id = user.get("user_id")
    request.state.clerk_user_id = user.get("clerk_user_id")
    request.state.workspace_id = user.get("workspace_id")
    request.state.workspace_role = user.get("workspace_role")
    request.state.global_role = user.get("global_role")
    request.state.is_admin = bool(user.get("is_admin", False))
    request.state.is_super_admin = bool(user.get("is_super_admin", False))
    return user


# ============================================================================
# TOKEN VERIFICATION
# ============================================================================

def _verify_with_clerk(token: str) -> dict[str, Any]:
    clerk = get_clerk_client()
    if clerk is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification is unavailable because Clerk is not configured.",
        )

    last_error: Exception | None = None

    verify_candidates = [
        ("sessions.verify_session", lambda: clerk.sessions.verify_session(token)),
        ("verify_token", lambda: clerk.verify_token(token)),
    ]

    for _, verifier in verify_candidates:
        try:
            result = verifier()
            if result is not None:
                return _normalize_clerk_session(result)
        except AttributeError as exc:
            last_error = exc
            continue
        except Exception as exc:
            last_error = exc
            break

    detail = "Invalid or expired authentication token."
    if last_error is not None:
        message = _string(last_error)
        if message:
            detail = f"{detail} {message}"

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
    )


# ============================================================================
# PUBLIC DEPENDENCIES
# ============================================================================

async def get_current_user(request: Request) -> dict[str, Any]:
    """
    Unified auth accessor.

    Order of truth:
    1. Request state populated by middleware
    2. Clerk bearer token verification, if configured
    3. Optional dev fallback, only when explicitly enabled
    """
    state_user = _build_user_from_request_state(request)
    if state_user is not None:
        return _cache_user_on_request(request, state_user)

    auth_header = _string(request.headers.get(AUTHORIZATION_HEADER))
    if auth_header:
        token = _extract_bearer_token(request)
        verified_user = _verify_with_clerk(token)
        return _cache_user_on_request(request, verified_user)

    if _truthy_env(ENV_AUTH_ALLOW_UNSIGNED_DEV, default=False):
        dev_user = _build_dev_user()
        return _cache_user_on_request(request, dev_user)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
    )


async def require_current_user(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return current_user


async def get_current_user_id(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> str:
    user_id = _string(current_user.get("user_id"))
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user id not found.",
        )
    return user_id


async def require_admin_user(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if not bool(current_user.get("is_admin", False)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user


async def require_super_admin_user(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if not bool(current_user.get("is_super_admin", False)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required.",
        )
    return current_user


async def require_workspace_user(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if not _string(current_user.get("workspace_id")) and not bool(current_user.get("is_super_admin", False)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace context required.",
        )
    return current_user
