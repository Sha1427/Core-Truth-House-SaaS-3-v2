from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query, Request

from backend.middleware.tenant_dependencies import (
    enforce_workspace_match,
    get_db_from_request,
    require_platform_admin,
    require_tenant_member,
)

router = APIRouter(prefix="/usage", tags=["usage"])


# =========================================================
# Core time helpers
# =========================================================

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _usage_window(window: str) -> tuple[datetime, datetime]:
    normalized = str(window or "30d").lower()
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
            "created_at": {"$gte": start, "$lte": end},
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
                "created_at": {"$gte": start, "$lte": end},
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": "$credits_delta"},
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

    return int(workspace.get("credit_balance", 0))


async def _plan_name(db, workspace_id: str) -> str | None:
    workspace = await _workspace_collection(db).find_one(
        {"$or": [{"id": workspace_id}, {"workspace_id": workspace_id}]},
        {"_id": 0},
    )
    if not workspace:
        return None

    return str(
        workspace.get("billing", {}).get("plan_id")
        or workspace.get("plan_id")
        or workspace.get("plan")
        or ""
    ) or None


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
            amount_cents += int(doc.get("amount_cents", 0))

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
                "created_at": {"$gte": start, "$lte": end},
            }
        },
        {
            "$group": {
                "_id": "$feature_key",
                "events": {"$sum": 1},
                "credits": {"$sum": "$credits_delta"},
            }
        },
    ]

    results = await _usage_collection(db).aggregate(pipeline).to_list(length=100)

    return [
        {
            "feature": result.get("_id") or "unknown",
            "events": int(result.get("events", 0)),
            "credits_used": int(result.get("credits", 0)),
        }
        for result in results
    ]


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

    workspace_id = await enforce_workspace_match(tenant, workspace_id)
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


@router.get("/events")
async def usage_events(
    request: Request,
    workspace_id: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    workspace_id = await enforce_workspace_match(tenant, workspace_id)

    docs = (
        await _usage_collection(db)
        .find({"workspace_id": workspace_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(length=limit)
    )

    return {
        "workspace_id": workspace_id,
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
):
    require_platform_admin(request)
    db = get_db_from_request(request)

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


