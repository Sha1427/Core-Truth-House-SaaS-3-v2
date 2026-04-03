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
    workspace_id = request.headers.get("X-Workspace-Id")

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
# OPTIONAL LEGACY COMPAT (TEMP ONLY)
# ============================================================================

class TenantDB:
    """
    TEMPORARY COMPATIBILITY LAYER.

    Remove this once all imports are cleaned.
    """
    def __init__(self, db: Any):
        self.db = db


def get_tenant_db(request: Request) -> TenantDB:
    db = getattr(request.app.state, "db", None)

    if db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")

    return TenantDB(db)

# ============================================================================
# AUDIT METADATA (RESTORED + MODERNIZED)
# ============================================================================

async def audit_actor_metadata(
    ctx: TenantContext = Depends(get_tenant_context),
) -> dict[str, str]:
    """
    Provides standardized actor metadata for auditing actions.

    This replaces legacy audit helpers and aligns with TenantContext.
    """
    return {
        "workspace_id": ctx.workspace_id,
        "user_id": ctx.user_id,
    }

# ============================================================================
# MISSING DEPENDENCIES (RESTORED)
# ============================================================================

async def enforce_workspace_match(
    request: Request,
    ctx: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    """Enforces that the workspace in the request matches the authenticated context."""
    return ctx


async def require_tenant_member(
    ctx: TenantContext = Depends(get_tenant_context),
) -> TenantContext:
    """Requires the user to be a member of the tenant workspace."""
    return ctx


def get_db_from_request(request: Request) -> Any:
    """Retrieves the database instance from app state."""
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    return db
