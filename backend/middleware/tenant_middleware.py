from __future__ import annotations

import os
import re
import time
from typing import Any

import httpx
from fastapi import Request
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware

from backend.dependencies.auth_context import (
    GLOBAL_ROLE_USER,
    WORKSPACE_ROLE_OWNER,
    is_admin_global_role,
    is_super_admin_global_role,
    normalize_global_role,
    normalize_workspace_role,
)


WORKSPACE_HEADER = "x-workspace-id"

PUBLIC_ROUTES = [
    r"^/$",
    r"^/health$",
    r"^/health/deps$",
    r"^/debug/routes$",
    r"^/debug/frontend-check$",
    r"^/debug/frontend-files$",
    r"^/docs(?:/.*)?$",
    r"^/openapi(?:\.json)?$",
    r"^/redoc(?:/.*)?$",
    r"^/static/.*$",
    r"^/assets/.*$",
    r"^/favicon\.ico$",
    r"^/manifest\.json$",
    r"^/browserconfig\.xml$",
    r"^/icons/.*$",
    r"^/logo.*$",
    r"^/cth-logo.*$",
    r"^/api/version$",
    r"^/api/health$",
    r"^/api/auth/login$",
    r"^/api/auth/register$",
    r"^/api/auth/refresh$",
    r"^/api/auth/forgot-password$",
    r"^/api/auth/reset-password$",
    r"^/api/plan/features$",
    r"^/api/workspaces/stripe/webhook$",
    r"^/api/billing/webhooks(?:/.*)?$",
    r"^/api/upload/serve/.*$",
    r"^/api/blog/public(?:/.*)?$",
    r"^/blog(?:/.*)?$",
    r"^/about$",
    r"^/contact$",
    r"^/privacy$",
    r"^/terms$",
    r"^/sign-in(?:/.*)?$",
    r"^/sign-up(?:/.*)?$",
    r"^/admin/sign-in(?:/.*)?$",
    r"^/store(?:/.*)?$",
    r"^/api/store/products$",
    r"^/api/store/products/[^/]+$",
    r"^/api/store/webhook$",
]

AUTHENTICATED_NO_WORKSPACE_ROUTES = [
    r"^/api/admin(?:/.*)?$",
    r"^/api/auth/me$",
    r"^/api/workspaces/mine$",
    r"^/api/teams/accept-invite$",
]

DEV_BYPASS_ENABLED = os.getenv("ALLOW_DEV_AUTH_BYPASS", "false").lower() == "true"


def _matches(path: str, patterns: list[str]) -> bool:
    return any(re.match(pattern, path) for pattern in patterns)


def is_public_route(path: str) -> bool:
    return _matches(path, PUBLIC_ROUTES)


def is_authenticated_no_workspace_route(path: str) -> bool:
    return _matches(path, AUTHENTICATED_NO_WORKSPACE_ROUTES)


class ClerkJWTVerifier:
    def __init__(self) -> None:
        self.jwks_url = os.getenv("CLERK_JWKS_URL", "https://api.clerk.com/v1/jwks")
        self._jwks_cache: dict[str, Any] | None = None
        self._jwks_cache_exp: float = 0.0

    async def get_jwks(self) -> dict[str, Any]:
        now = time.time()
        if self._jwks_cache and now < self._jwks_cache_exp:
            return self._jwks_cache

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(self.jwks_url)
            response.raise_for_status()
            jwks = response.json()

        self._jwks_cache = jwks
        self._jwks_cache_exp = now + 3600
        return jwks

    async def verify(self, token: str) -> dict[str, Any]:
        jwks = await self.get_jwks()

        try:
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            if not kid:
                raise JWTError("Missing signing key id")

            matching_key = None
            for jwk in jwks.get("keys", []):
                if jwk.get("kid") == kid:
                    matching_key = jwk
                    break

            if not matching_key:
                raise JWTError("Signing key not found")

            claims = jwt.decode(
                token,
                matching_key,
                algorithms=[header.get("alg", "RS256")],
                options={"verify_aud": False},
            )
            return claims
        except JWTError as exc:
            raise JWTError(f"Token verification failed: {exc}") from exc


class TenantMiddleware(BaseHTTPMiddleware):
    def __init__(self, app) -> None:
        super().__init__(app)
        self.verifier = ClerkJWTVerifier()

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        self._reset_request_state(request)

        if not path.startswith("/api"):
            return await call_next(request)

        if is_public_route(path):
            return await call_next(request)

        db = getattr(request.app.state, "db", None)
        if db is None:
            return JSONResponse(
                status_code=503,
                content={"detail": "Database not initialized"},
            )

        bearer_token = self._extract_bearer_token(request)
        if not bearer_token and DEV_BYPASS_ENABLED:
            user = await self._load_dev_bypass_user(db)
            if user:
                clerk_user_id = str(
                    user.get("clerk_user_id")
                    or user.get("clerk_id")
                    or user.get("id")
                    or ""
                )
                return await self._authorize_request(
                    request=request,
                    call_next=call_next,
                    db=db,
                    user=user,
                    clerk_user_id=clerk_user_id,
                    path=path,
                )

        if not bearer_token:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid Authorization header."},
            )

        try:
            claims = await self.verifier.verify(bearer_token)
        except Exception as exc:
            return JSONResponse(
                status_code=401,
                content={"detail": str(exc)},
            )

        clerk_user_id = str(claims.get("sub") or "").strip()
        if not clerk_user_id:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing subject in token."},
            )

        user = await db.users.find_one(
            {
                "$or": [
                    {"clerk_user_id": clerk_user_id},
                    {"clerk_id": clerk_user_id},
                ]
            },
            {"_id": 0},
        )

        if not user:
            return JSONResponse(
                status_code=403,
                content={"detail": "Authenticated user is not provisioned in this system."},
            )

        return await self._authorize_request(
            request=request,
            call_next=call_next,
            db=db,
            user=user,
            clerk_user_id=clerk_user_id,
            path=path,
        )

    def _reset_request_state(self, request: Request) -> None:
        request.state.user_id = None
        request.state.user_record = None
        request.state.clerk_user_id = None
        request.state.workspace_id = None
        request.state.workspace_role = None
        request.state.global_role = GLOBAL_ROLE_USER
        request.state.is_admin = False
        request.state.is_super_admin = False

    def _extract_bearer_token(self, request: Request) -> str:
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            return auth_header.split(" ", 1)[1].strip()
        return ""

    async def _load_dev_bypass_user(self, db) -> dict[str, Any] | None:
        dev_user_id = os.getenv("DEV_BYPASS_USER_ID", "dev_user_default")
        return await db.users.find_one(
            {
                "$or": [
                    {"id": dev_user_id},
                    {"clerk_id": dev_user_id},
                    {"clerk_user_id": dev_user_id},
                ]
            },
            {"_id": 0},
        )

    async def _authorize_request(
        self,
        request: Request,
        call_next,
        db,
        user: dict[str, Any],
        clerk_user_id: str,
        path: str,
    ):
        user_id = str(user.get("id") or user.get("_id") or "").strip()
        if not user_id:
            return JSONResponse(
                status_code=403,
                content={"detail": "Authenticated user record is missing an internal id."},
            )

        global_role = normalize_global_role(user.get("role"))
        is_super_admin = is_super_admin_global_role(global_role)
        is_admin = is_admin_global_role(global_role)

        request.state.user_id = user_id
        request.state.user_record = user
        request.state.clerk_user_id = clerk_user_id
        request.state.global_role = global_role
        request.state.is_admin = is_admin
        request.state.is_super_admin = is_super_admin

        if is_authenticated_no_workspace_route(path):
            request.state.workspace_role = WORKSPACE_ROLE_OWNER if is_super_admin else None
            return await call_next(request)

        requested_workspace_id = str(request.headers.get(WORKSPACE_HEADER) or "").strip()
        if not requested_workspace_id:
            return JSONResponse(
                status_code=400,
                content={"detail": "Missing X-Workspace-ID header."},
            )

        workspace_access = await self._resolve_workspace_access(
            db=db,
            requested_workspace_id=requested_workspace_id,
            user_id=user_id,
            is_super_admin=is_super_admin,
        )

        if not workspace_access:
            return JSONResponse(
                status_code=403,
                content={"detail": "You do not have access to this workspace."},
            )

        request.state.workspace_id = workspace_access["workspace_id"]
        request.state.workspace_role = workspace_access["workspace_role"]

        return await call_next(request)

    async def _resolve_workspace_access(
        self,
        db,
        requested_workspace_id: str,
        user_id: str,
        is_super_admin: bool,
    ) -> dict[str, str] | None:
        workspace = await db.workspaces.find_one(
            {
                "$or": [
                    {"id": requested_workspace_id},
                    {"workspace_id": requested_workspace_id},
                ]
            },
            {"_id": 0, "id": 1, "workspace_id": 1, "owner_id": 1},
        )
        if not workspace:
            return None

        canonical_workspace_id = str(
            workspace.get("id") or workspace.get("workspace_id") or requested_workspace_id
        ).strip()
        owner_id = str(workspace.get("owner_id") or "").strip()

        if is_super_admin:
            return {
                "workspace_id": canonical_workspace_id,
                "workspace_role": WORKSPACE_ROLE_OWNER,
            }

        if owner_id and owner_id == user_id:
            return {
                "workspace_id": canonical_workspace_id,
                "workspace_role": WORKSPACE_ROLE_OWNER,
            }

        membership_role = await self._find_membership_role(
            db=db,
            workspace_ids=self._workspace_id_candidates(
                requested_workspace_id=requested_workspace_id,
                canonical_workspace_id=canonical_workspace_id,
            ),
            user_id=user_id,
        )
        if membership_role:
            normalized_role = normalize_workspace_role(membership_role)
            if normalized_role:
                return {
                    "workspace_id": canonical_workspace_id,
                    "workspace_role": normalized_role,
                }

        team_role = await self._find_team_role(
            db=db,
            workspace_ids=self._workspace_id_candidates(
                requested_workspace_id=requested_workspace_id,
                canonical_workspace_id=canonical_workspace_id,
            ),
            user_id=user_id,
        )
        if team_role:
            normalized_role = normalize_workspace_role(team_role)
            if normalized_role:
                return {
                    "workspace_id": canonical_workspace_id,
                    "workspace_role": normalized_role,
                }

        return None

    def _workspace_id_candidates(
        self,
        requested_workspace_id: str,
        canonical_workspace_id: str,
    ) -> list[str]:
        candidates: list[str] = []
        for value in [requested_workspace_id, canonical_workspace_id]:
            value = str(value or "").strip()
            if value and value not in candidates:
                candidates.append(value)
        return candidates

    async def _find_membership_role(
        self,
        db,
        workspace_ids: list[str],
        user_id: str,
    ) -> str | None:
        membership = await db.workspace_members.find_one(
            {
                "workspace_id": {"$in": workspace_ids},
                "user_id": user_id,
                "status": "active",
            },
            {"_id": 0, "role": 1},
        )
        if not membership:
            return None
        return str(membership.get("role") or "").strip() or None

    async def _find_team_role(
        self,
        db,
        workspace_ids: list[str],
        user_id: str,
    ) -> str | None:
        team_membership = await db.team_members.find_one(
            {
                "workspace_id": {"$in": workspace_ids},
                "user_id": user_id,
                "status": "active",
            },
            {"_id": 0, "role": 1},
        )
        if not team_membership:
            return None
        return str(team_membership.get("role") or "").strip() or None

