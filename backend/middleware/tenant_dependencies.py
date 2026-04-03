from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import Depends, HTTPException, Request

from backend.app.core.auth import get_current_user


# ============================================================================
# TENANT CONTEXT
# ============================================================================

@dataclass
class TenantContext:
    workspace_id: str
    user_id: str
    role: str | None = None


# ============================================================================
# DEPENDENCIES
# ============================================================================

async def get_tenant_context(
    request: Request,
    user: dict[str, Any] = Depends(get_current_user),
) -> TenantContext:
    workspace_id = (
    request.headers.get("X-Workspace-Id")
    or request.headers.get("X-Workspace-ID")
    or request.headers.get("x-workspace-id")
)

    if not workspace_id:
        raise HTTPException(status_code=400, detail="Missing workspace context")

    user_id = str(
        user.get("user_id")
        or user.get("id")
        or ""
    ).strip()

    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    return TenantContext(
        workspace_id=workspace_id,
        user_id=user_id,
    )


# ============================================================================
# TENANT DB
# ============================================================================

class TenantDB:
    def __init__(self, db: Any, workspace_id: str = ""):
        self.db = db
        self.workspace_id = workspace_id

    def _scoped_query(self, query: dict) -> dict:
        if self.workspace_id:
            return {"workspace_id": self.workspace_id, **query}
        return query

    async def find_one(self, collection: str, query: dict = {}) -> dict | None:
        try:
            return await self.db[collection].find_one(self._scoped_query(query), {"_id": 0})
        except Exception:
            return None

    async def find(self, collection: str, query: dict = {}, sort: list = None, limit: int = 50) -> list:
        try:
            cursor = self.db[collection].find(self._scoped_query(query), {"_id": 0})
            if sort:
                cursor = cursor.sort(sort)
            if limit:
                cursor = cursor.limit(limit)
            return await cursor.to_list(length=limit)
        except Exception:
            return []

    async def count(self, collection: str, query: dict = {}) -> int:
        try:
            return await self.db[collection].count_documents(self._scoped_query(query))
        except Exception:
            return 0

    async def insert_one(self, collection: str, doc: dict) -> None:
        try:
            await self.db[collection].insert_one(doc)
        except Exception:
            pass


def get_tenant_db(
    request: Request,
    ctx: TenantContext = Depends(get_tenant_context),
) -> TenantDB:
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    return TenantDB(db, ctx.workspace_id)


def get_db_from_request(request: Request) -> Any:
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    return db


# ============================================================================
# AUDIT METADATA
# ============================================================================

async def audit_actor_metadata(
    ctx: TenantContext = Depends(get_tenant_context),
) -> dict[str, str]:
    return {
        "workspace_id": ctx.workspace_id,
        "user_id": ctx.user_id,
    }


# ============================================================================
# ACCESS CONTROL DEPENDENCIES
# ============================================================================

async def enforce_workspace_match(
    request: Request,
    ctx: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    return ctx


async def require_tenant_member(
    ctx: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    return ctx


async def require_tenant_admin(
    ctx: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    return ctx


async def require_tenant_context(
    ctx: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    return ctx


async def stamp_tenant_fields(
    ctx: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    return ctx


async def require_platform_admin(
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if not user.get("is_admin") and not user.get("is_super_admin"):
        raise HTTPException(status_code=403, detail="Platform admin access required.")
    return user


async def require_platform_super_admin(
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    if not user.get("is_super_admin"):
        raise HTTPException(status_code=403, detail="Super admin access required.")
    return user
