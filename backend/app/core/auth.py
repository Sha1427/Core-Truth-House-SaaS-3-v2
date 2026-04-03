from __future__ import annotations
import os
from typing import Any
import httpx
import jwt as pyjwt
from fastapi import Depends, HTTPException, Request, status
from backend.dependencies.auth_context import (
    is_admin_global_role,
    is_super_admin_global_role,
    normalize_global_role,
    normalize_workspace_role,
)

AUTHORIZATION_HEADER = "Authorization"
BEARER_PREFIX = "bearer "
ENV_CLERK_SECRET_KEY = "CLERK_SECRET_KEY"
ENV_AUTH_ALLOW_UNSIGNED_DEV = "AUTH_ALLOW_UNSIGNED_DEV"
ENV_AUTH_DEV_USER_ID = "AUTH_DEV_USER_ID"
DEFAULT_DEV_USER_ID = "dev-user"


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

def _coerce_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return False

def _extract_bearer_token(request: Request) -> str:
    auth_header = _string(request.headers.get(AUTHORIZATION_HEADER))
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header.")
    if not auth_header.lower().startswith(BEARER_PREFIX):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header must use Bearer token format.")
    token = auth_header[len(BEARER_PREFIX):].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token.")
    return token

def clerk_is_configured() -> bool:
    return bool(_string(os.getenv(ENV_CLERK_SECRET_KEY)))

def get_clerk_client() -> Any | None:
    return True if clerk_is_configured() else None

def _normalize_roles_from_payload(payload: dict[str, Any]) -> tuple[str, str | None]:
    global_role = normalize_global_role(
        payload.get("global_role") or payload.get("role")
        or payload.get("public_metadata", {}).get("global_role")
        or payload.get("private_metadata", {}).get("global_role")
    )
    workspace_role = normalize_workspace_role(
        payload.get("workspace_role") or payload.get("role_in_workspace")
        or payload.get("public_metadata", {}).get("workspace_role")
        or payload.get("private_metadata", {}).get("workspace_role")
    )
    return global_role, workspace_role

def _normalize_user_payload(payload: dict[str, Any]) -> dict[str, Any]:
    global_role, workspace_role = _normalize_roles_from_payload(payload)
    user_id = _string(payload.get("user_id") or payload.get("id") or payload.get("sub") or payload.get("subject"))
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authenticated user id not found.")
    workspace_id = _string(
        payload.get("workspace_id") or payload.get("active_workspace_id") or payload.get("org_id")
        or payload.get("organization_id")
        or payload.get("public_metadata", {}).get("workspace_id")
        or payload.get("private_metadata", {}).get("workspace_id")
    ) or None
    clerk_user_id = _string(payload.get("clerk_user_id") or payload.get("sub") or user_id) or None
    session_id = _string(payload.get("session_id") or payload.get("sid")) or None
    is_super_admin = _coerce_bool(payload.get("is_super_admin")) or is_super_admin_global_role(global_role)
    is_admin = _coerce_bool(payload.get("is_admin")) or is_admin_global_role(global_role) or is_super_admin
    return {
        "user_id": user_id, "id": user_id, "clerk_user_id": clerk_user_id,
        "session_id": session_id, "workspace_id": workspace_id,
        "workspace_role": workspace_role, "global_role": global_role,
        "is_admin": is_admin, "is_super_admin": is_super_admin,
        "user_record": _safe_dict(payload.get("user_record")) or None,
        "raw_session": payload, "auth_source": _string(payload.get("auth_source") or "normalized"),
    }

def _build_user_from_request_state(request: Request) -> dict[str, Any] | None:
    state_user = _extract_state_value(request, "auth_user")
    if isinstance(state_user, dict) and _string(state_user.get("user_id")):
        normalized = _normalize_user_payload({**state_user, "auth_source": state_user.get("auth_source") or "request_state"})
        normalized["raw_session"] = state_user
        return normalized
    user_id = _string(_extract_state_value(request, "user_id"))
    if not user_id:
        return None
    user_record = _extract_state_value(request, "user_record")
    global_role = normalize_global_role(_extract_state_value(request, "global_role") or _safe_dict(user_record).get("role"))
    workspace_role = normalize_workspace_role(_extract_state_value(request, "workspace_role"))
    clerk_user_id = _string(_extract_state_value(request, "clerk_user_id")) or None
    workspace_id = _string(_extract_state_value(request, "workspace_id")) or None
    is_super_admin = _coerce_bool(_extract_state_value(request, "is_super_admin")) or is_super_admin_global_role(global_role)
    is_admin = _coerce_bool(_extract_state_value(request, "is_admin")) or is_admin_global_role(global_role) or is_super_admin
    return {
        "user_id": user_id, "id": user_id, "clerk_user_id": clerk_user_id,
        "session_id": None, "workspace_id": workspace_id,
        "workspace_role": workspace_role, "global_role": global_role,
        "is_admin": is_admin, "is_super_admin": is_super_admin,
        "user_record": user_record if isinstance(user_record, dict) else None,
        "raw_session": _extract_state_value(request, "auth_user"), "auth_source": "request_state",
    }

def _build_dev_user() -> dict[str, Any]:
    user_id = _string(os.getenv(ENV_AUTH_DEV_USER_ID, DEFAULT_DEV_USER_ID)) or DEFAULT_DEV_USER_ID
    return _normalize_user_payload({
        "user_id": user_id, "id": user_id, "global_role": "super_admin",
        "workspace_role": "owner", "is_admin": True, "is_super_admin": True, "auth_source": "dev_fallback",
    })

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

def _verify_with_clerk(token: str) -> dict[str, Any]:
    clerk_secret = _string(os.getenv(ENV_CLERK_SECRET_KEY))
    if not clerk_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token verification is unavailable because Clerk is not configured.")
    try:
        jwks_url = "https://api.clerk.com/v1/jwks"
        response = httpx.get(jwks_url, headers={"Authorization": f"Bearer {clerk_secret}"}, timeout=10)
        jwks = response.json()
        unverified_header = pyjwt.get_unverified_header(token)
        token_kid = unverified_header.get("kid")
        public_key = None
        for key in jwks["keys"]:
            if key.get("kid") == token_kid:
                public_key = pyjwt.algorithms.RSAAlgorithm.from_jwk(key)
                break
        if public_key is None:
            public_key = pyjwt.algorithms.RSAAlgorithm.from_jwk(jwks["keys"][0])
        payload = pyjwt.decode(
            token, public_key, algorithms=["RS256"],
            options={"verify_aud": False},
            leeway=60
        )
        return _normalize_user_payload({**payload, "user_id": payload.get("sub"), "auth_source": "clerk_jwt"})
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid or expired authentication token. {str(exc)}")

async def get_current_user(request: Request) -> dict[str, Any]:
    state_user = _build_user_from_request_state(request)
    if state_user is not None:
        return _cache_user_on_request(request, state_user)
    auth_header = _string(request.headers.get(AUTHORIZATION_HEADER))
    if auth_header:
        token = _extract_bearer_token(request)
        verified_user = _verify_with_clerk(token)
        return _cache_user_on_request(request, verified_user)
    if _truthy_env(ENV_AUTH_ALLOW_UNSIGNED_DEV, default=False):
        return _cache_user_on_request(request, _build_dev_user())
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

async def require_current_user(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return current_user

async def get_current_user_id(current_user: dict[str, Any] = Depends(get_current_user)) -> str:
    user_id = _string(current_user.get("user_id"))
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authenticated user id not found.")
    return user_id

async def require_admin_user(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if not bool(current_user.get("is_admin", False)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return current_user

async def require_super_admin_user(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if not bool(current_user.get("is_super_admin", False)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required.")
    return current_user

async def require_workspace_user(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if not _string(current_user.get("workspace_id")) and not bool(current_user.get("is_super_admin", False)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Workspace context required.")
    return current_user
