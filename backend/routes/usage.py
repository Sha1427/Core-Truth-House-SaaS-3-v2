from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from backend.app.core.auth import get_current_user
from middleware.tenant_dependencies import (
    TenantContext,
    get_db_from_request,
    require_tenant_member,
)

router = APIRouter(prefix="/usage", tags=["usage"])


# =========================================================
# Core time helpers
# =========================================================

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _usage_window(window: str) -> tuple[datetime, datetime]:
    normalized = str(window or "30d").lower().strip()
    end = _utc_now()

    if normalized == "24h":
        return end - timedelta(hours=24), end
    if normalized == "7d":
        return end - timedelta(days=7), end
    if normalized == "30d":
        return end - timedelta(days=30), end
    if normalized == "90d":
        return end - timedelta(days=90), end

    raise HTTPException(status_code=400, detail="Invalid window")


def _coerce_datetime(value: Any) -> Any:
    """
    Preserve datetimes if already typed.
    If the collection stores ISO strings, passing ISO strings in the query is OK.
    """
    if isinstance(value, datetime):
      return value
    return value


# =========================================================
# Tenant / access helpers
# =========================================================

def _string(value: Any) -> str:
    return str(value or "").strip()


def _is_platform_admin(user: dict[str, Any]) -> bool:
    return bool(user.get("is_admin", False) or user.get("is_super_admin", False))


def _resolve_workspace_id(
    tenant: TenantContext,
    requested_workspace_id: Optional[str],
    *,
    allow_super_admin: bool = False,
) -> str:
    requested = _string(requested_workspace_id)

    if not requested:
        return tenant.workspace_id

    if requested == tenant.workspace_id:
        return requested

    if allow_super_admin and tenant.is_super_admin:
        return requested

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Workspace mismatch",
    )


def _require_platform_admin_from_user(user: dict[str, Any]) -> None:
    if not _is_platform_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform admin access required",
        )


# =========================================================
# Canonical collections
# =========================================================

def _usage_collection(db):
    return db.usage_events


def _transaction_collection(db):
    return db.billing_transactions


def _workspace_collection(db):
    return db.workspaces


# =========================================================
# Metrics
# =========================================================

async def _count_events(
    db,
    workspace_id: str,
    start: datetime,
    end: datetime,
) -> int:
    return await _usage_collection(db).count_documents(
        {
            "workspace_id": workspace_id,
            "created_at": {
                "$gte": _coerce_datetime(start),
                "$lte": _coerce_datetime(end),
            },
        }
    )


async def _sum_credits(
    db,
    workspace_id: str,
    start: datetime,
    end: datetime,
) -> int:
    pipeline = [
        {
            "$match": {
                "workspace_id": workspace_id,
                "created_at": {
                    "$gte": _coerce_datetime(start),
                    "$lte": _coerce_datetime(end),
                },
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": {"$ifNull": ["$credits_delta", 0]}},
            }
        },
    ]

    result = await _usage_collection(db).aggregate(pipeline).to_list(length=1)
    return int(result[0]["total"]) if result else 0


async def _credit_balance(db, workspace_id: str) -> int:
    workspace = await _workspace_collection(db).find_one(
        {"$or": [{"id": workspace_id}, {"workspace_id": workspace_id}]},
        {"_id": 0},
    )
    if not workspace:
        return 0

    return int(workspace.get("credit_balance", 0) or 0)


async def _plan_name(db, workspace_id: str) -> str | None:
    workspace = await _workspace_collection(db).find_one(
        {"$or": [{"id": workspace_id}, {"workspace_id": workspace_id}]},
        {"_id": 0},
    )
    if not workspace:
        return None

    return (
        _string(workspace.get("billing", {}).get("plan_id"))
        or _string(workspace.get("plan_id"))
        or _string(workspace.get("plan"))
        or None
    )


async def _transactions_summary(db, workspace_id: str) -> dict[str, Any]:
    docs = await _transaction_collection(db).find(
        {"workspace_id": workspace_id},
        {"_id": 0},
    ).to_list(length=5000)

    paid = 0
    amount_cents = 0

    for doc in docs:
        if doc.get("status") == "paid":
            paid += 1
            amount_cents += int(doc.get("amount_cents", 0) or 0)

    return {
        "total_transactions": len(docs),
        "paid_transactions": paid,
        "total_paid_amount_cents": amount_cents,
        "total_paid_amount_dollars": round(amount_cents / 100, 2),
    }


async def _usage_breakdown(
    db,
    workspace_id: str,
    start: datetime,
    end: datetime,
) -> list[dict[str, Any]]:
    pipeline = [
        {
            "$match": {
                "workspace_id": workspace_id,
                "created_at": {
                    "$gte": _coerce_datetime(start),
                    "$lte": _coerce_datetime(end),
                },
            }
        },
        {
            "$group": {
                "_id": "$feature_key",
                "events": {"$sum": 1},
                "credits": {"$sum": {"$ifNull": ["$credits_delta", 0]}},
            }
        },
    ]

    results = await _usage_collection(db).aggregate(pipeline).to_list(length=100)

    return [
        {
            "feature": result.get("_id") or "unknown",
            "events": int(result.get("events", 0) or 0),
            "credits_used": int(result.get("credits", 0) or 0),
        }
        for result in results
    ]


async def _build_usage_response(
    db,
    *,
    workspace_id: str,
    window: str,
) -> dict[str, Any]:
    start, end = _usage_window(window)

    return {
        "workspace_id": workspace_id,
        "window": window,
        "range": {
            "start_at": start.isoformat(),
            "end_at": end.isoformat(),
        },
        "plan": await _plan_name(db, workspace_id),
        "credit_balance": await _credit_balance(db, workspace_id),
        "usage_events": await _count_events(db, workspace_id, start, end),
        "credits_used": await _sum_credits(db, workspace_id, start, end),
        "transaction_summary": await _transactions_summary(db, workspace_id),
        "usage_breakdown": await _usage_breakdown(db, workspace_id, start, end),
    }


# =========================================================
# Routes
# =========================================================

@router.get("")
async def usage_summary(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
    window: str = Query(default="30d"),
):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    resolved_workspace_id = _resolve_workspace_id(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    return await _build_usage_response(
        db,
        workspace_id=resolved_workspace_id,
        window=window,
    )


@router.get("/events")
async def usage_events(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    resolved_workspace_id = _resolve_workspace_id(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    docs = (
        await _usage_collection(db)
        .find({"workspace_id": resolved_workspace_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(length=limit)
    )

    return {
        "workspace_id": resolved_workspace_id,
        "events": docs,
        "total": len(docs),
    }


@router.get("/summary")
async def usage_summary_alias(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
    window: str = Query(default="30d"),
):
    return await usage_summary(
        request=request,
        workspace_id=workspace_id,
        window=window,
    )


@router.get("/admin/workspace/{workspace_id}")
async def admin_workspace_usage(
    workspace_id: str,
    request: Request,
    window: str = Query(default="30d"),
    current_user: dict[str, Any] = Depends(get_current_user),
):
    _require_platform_admin_from_user(current_user)
    db = get_db_from_request(request)

    resolved_workspace_id = _string(workspace_id)
    if not resolved_workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="workspace_id is required",
        )

    return await _build_usage_response(
        db,
        workspace_id=resolved_workspace_id,
        window=window,
    )
