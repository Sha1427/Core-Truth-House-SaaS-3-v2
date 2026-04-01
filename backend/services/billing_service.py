from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlparse

from backend.database import get_db, logger
from backend.db.workspace_db import sync_workspace_plan_state
from backend.services.stripe_client import build_stripe_billing_client
from constants.billing_catalog import (
    CREDIT_PACKS,
    PLAN_CATALOG,
    get_credit_pack_catalog_item,
    get_credit_pack_stripe_price_id,
    get_plan_catalog_item,
    get_plan_stripe_price_id,
)
from models.billing import (
    ApplyCreditTopupInput,
    ApplyWorkspaceSubscriptionInput,
    BillingSummaryResponse,
    CheckoutSessionResult,
    CheckoutStatusResult,
    CreatePendingCreditTransactionInput,
    CreatePendingSubscriptionTransactionInput,
    CreditPackCatalogItem,
    MarkTransactionPaidInput,
    PlanCatalogItem,
    WebhookProcessResult,
)
from repositories.billing_repository import billing_repository


PUBLIC_APP_URL = os.getenv("PUBLIC_APP_URL", "").strip()
ALLOWED_CHECKOUT_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_CHECKOUT_ORIGINS", "").split(",")
    if origin.strip()
]

WORKSPACE_PLAN_MAP: dict[str, str] = {
    "starter": "starter",
    "pro": "pro",
    "enterprise": "enterprise",
}


# ============================================================================
# CORE HELPERS
# ============================================================================

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _period_window(billing_cycle: str) -> tuple[datetime, datetime]:
    now = _utc_now()
    normalized = str(billing_cycle or "monthly").strip().lower()
    if normalized == "annual":
        return now, now + timedelta(days=365)
    return now, now + timedelta(days=30)


def _coerce_subscription_status(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    allowed = {"inactive", "trialing", "active", "past_due", "cancelled", "unpaid"}
    return normalized if normalized in allowed else "inactive"


def _extract_object_id(value: Any) -> str | None:
    if value is None:
        return None

    if isinstance(value, str):
        return value or None

    if isinstance(value, dict):
        inner = value.get("id")
        return inner if isinstance(inner, str) and inner else None

    inner = getattr(value, "id", None)
    return inner if isinstance(inner, str) and inner else None


def _workspace_plan_for_billing_plan(plan_id: str) -> str:
    return WORKSPACE_PLAN_MAP.get(plan_id, plan_id)


def validate_origin_url(origin_url: str) -> str:
    parsed = urlparse(origin_url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Invalid origin URL")

    normalized = f"{parsed.scheme}://{parsed.netloc}"

    if ALLOWED_CHECKOUT_ORIGINS and normalized not in ALLOWED_CHECKOUT_ORIGINS:
        raise ValueError("Origin is not allowed")

    return normalized


def get_public_webhook_url() -> str:
    if not PUBLIC_APP_URL:
        raise ValueError("PUBLIC_APP_URL is not configured")
    return f"{PUBLIC_APP_URL.rstrip('/')}/api/webhooks/stripe"


def get_plan(plan_id: str) -> dict[str, Any]:
    raw_plan = get_plan_catalog_item(plan_id)
    plan = PlanCatalogItem(**raw_plan)
    if not plan.active:
        raise ValueError("Invalid or inactive plan")
    return plan.model_dump()


def get_credit_pack(pack_id: str) -> dict[str, Any]:
    raw_pack = get_credit_pack_catalog_item(pack_id)
    pack = CreditPackCatalogItem(**raw_pack)
    if not pack.active:
        raise ValueError("Invalid or inactive credit pack")
    return pack.model_dump()


def get_plan_price(plan_id: str, billing_cycle: str) -> int:
    plan = get_plan(plan_id)
    normalized_cycle = str(billing_cycle or "").strip().lower()
    if normalized_cycle == "annual":
        return int(plan["annual_price_cents"])
    if normalized_cycle == "monthly":
        return int(plan["monthly_price_cents"])
    raise ValueError("Invalid billing cycle")


def get_plan_credits(plan_id: str, billing_cycle: str) -> int:
    plan = get_plan(plan_id)
    normalized_cycle = str(billing_cycle or "").strip().lower()
    if normalized_cycle == "annual":
        return int(plan["annual_credits"])
    if normalized_cycle == "monthly":
        return int(plan["monthly_credits"])
    raise ValueError("Invalid billing cycle")


# ============================================================================
# WORKSPACE ACCESS
# ============================================================================

async def get_workspace_or_raise(workspace_id: str) -> dict[str, Any]:
    workspace = await billing_repository.get_workspace(workspace_id)
    if not workspace:
        raise ValueError("Workspace not found")
    return workspace


# ============================================================================
# TRANSACTION CREATION
# ============================================================================

async def create_pending_subscription_transaction(
    *,
    workspace_id: str,
    user_id: str,
    plan_id: str,
    billing_cycle: str,
    session_id: str,
    customer_id: str | None,
    amount_cents: int,
    metadata: dict[str, Any],
) -> None:
    credits = get_plan_credits(plan_id, billing_cycle)

    payload = CreatePendingSubscriptionTransactionInput(
        workspace_id=workspace_id,
        user_id=user_id,
        plan_id=plan_id,
        billing_cycle=billing_cycle,
        session_id=session_id,
        customer_id=customer_id,
        amount_cents=amount_cents,
        metadata=metadata,
    )

    await billing_repository.create_transaction(
        {
            "type": "subscription",
            "status": "pending",
            "workspace_id": payload.workspace_id,
            "user_id": payload.user_id,
            "plan_id": payload.plan_id,
            "billing_cycle": payload.billing_cycle,
            "session_id": payload.session_id,
            "stripe_customer_id": payload.customer_id,
            "stripe_subscription_id": None,
            "stripe_payment_intent_id": None,
            "stripe_invoice_id": None,
            "amount_cents": payload.amount_cents,
            "currency": "usd",
            "credits_delta": credits,
            "metadata": payload.metadata,
            "finalized_at": None,
        }
    )


async def create_pending_credit_transaction(
    *,
    workspace_id: str,
    user_id: str,
    pack_id: str,
    session_id: str,
    customer_id: str | None,
    metadata: dict[str, Any],
) -> None:
    pack = get_credit_pack(pack_id)

    payload = CreatePendingCreditTransactionInput(
        workspace_id=workspace_id,
        user_id=user_id,
        pack_id=pack_id,
        session_id=session_id,
        customer_id=customer_id,
        metadata=metadata,
    )

    await billing_repository.create_transaction(
        {
            "type": "credit_topup",
            "status": "pending",
            "workspace_id": payload.workspace_id,
            "user_id": payload.user_id,
            "pack_id": payload.pack_id,
            "session_id": payload.session_id,
            "stripe_customer_id": payload.customer_id,
            "stripe_subscription_id": None,
            "stripe_payment_intent_id": None,
            "stripe_invoice_id": None,
            "amount_cents": int(pack["price_cents"]),
            "currency": "usd",
            "credits_delta": int(pack.get("total_credits") or pack["credits"]),
            "metadata": payload.metadata,
            "finalized_at": None,
        }
    )


async def mark_transaction_status(*, session_id: str, status: str) -> None:
    await billing_repository.mark_transaction_status(session_id, status)


async def mark_transaction_paid(
    *,
    session_id: str,
    payment_intent_id: str | None = None,
    invoice_id: str | None = None,
    subscription_id: str | None = None,
) -> dict[str, Any] | None:
    payload = MarkTransactionPaidInput(
        session_id=session_id,
        payment_intent_id=payment_intent_id,
        invoice_id=invoice_id,
        subscription_id=subscription_id,
    )

    return await billing_repository.mark_transaction_paid(
        session_id=payload.session_id,
        payment_intent_id=payload.payment_intent_id,
        invoice_id=payload.invoice_id,
        subscription_id=payload.subscription_id,
    )


# ============================================================================
# WORKSPACE BILLING MUTATIONS
# ============================================================================

async def _sync_top_level_workspace_plan_state(
    *,
    workspace_id: str,
    plan_id: str,
    subscription_status: str,
) -> None:
    try:
        db = get_db()
        await sync_workspace_plan_state(
            db=db,
            workspace_id=workspace_id,
            plan=_workspace_plan_for_billing_plan(plan_id),
            subscription_status=_coerce_subscription_status(subscription_status),
        )
    except Exception as exc:
        logger.warning("Workspace top-level plan sync skipped: %s", exc)


async def _set_workspace_subscription_status_only(
    *,
    workspace_id: str,
    subscription_status: str,
) -> None:
    normalized_status = _coerce_subscription_status(subscription_status)

    try:
        db = get_db()
        await db.workspaces.update_one(
            {"workspace_id": workspace_id},
            {
                "$set": {
                    "billing.subscription_status": normalized_status,
                    "subscription_status": normalized_status,
                    "billing.updated_at": _utc_now(),
                    "updated_at": _utc_now(),
                }
            },
            upsert=False,
        )
    except Exception as exc:
        logger.warning("Failed to update workspace subscription status: %s", exc)


async def apply_workspace_subscription(
    *,
    workspace_id: str,
    plan_id: str,
    billing_cycle: str,
    stripe_customer_id: str | None,
    stripe_subscription_id: str | None,
    period_start: datetime,
    period_end: datetime,
    subscription_status: str = "active",
) -> None:
    payload = ApplyWorkspaceSubscriptionInput(
        workspace_id=workspace_id,
        plan_id=plan_id,
        billing_cycle=billing_cycle,
        stripe_customer_id=stripe_customer_id,
        stripe_subscription_id=stripe_subscription_id,
        period_start=period_start,
        period_end=period_end,
    )

    included_credits = get_plan_credits(payload.plan_id, payload.billing_cycle)

    await billing_repository.update_workspace_subscription(
        workspace_id=payload.workspace_id,
        plan_id=payload.plan_id,
        billing_cycle=payload.billing_cycle,
        stripe_customer_id=payload.stripe_customer_id,
        stripe_subscription_id=payload.stripe_subscription_id,
        period_start=payload.period_start,
        period_end=payload.period_end,
        included_credits=included_credits,
    )

    await _set_workspace_subscription_status_only(
        workspace_id=payload.workspace_id,
        subscription_status=subscription_status,
    )

    await _sync_top_level_workspace_plan_state(
        workspace_id=payload.workspace_id,
        plan_id=payload.plan_id,
        subscription_status=subscription_status,
    )


async def apply_credit_topup(*, workspace_id: str, credits: int) -> None:
    payload = ApplyCreditTopupInput(
        workspace_id=workspace_id,
        credits=credits,
    )

    await billing_repository.increment_credit_balance(
        workspace_id=payload.workspace_id,
        credits=payload.credits,
    )


async def ensure_checkout_session_owned_by_workspace(
    *,
    workspace_id: str,
    session_id: str,
) -> dict[str, Any]:
    txn = await billing_repository.get_transaction_by_session_id(session_id)
    if not txn:
        raise ValueError("Checkout session not found")
    if txn.get("workspace_id") != workspace_id:
        raise PermissionError("You do not have access to this checkout session")
    return txn


# ============================================================================
# CHECKOUT CREATION
# ============================================================================

async def create_subscription_checkout(
    *,
    workspace_id: str,
    user_id: str,
    plan_id: str,
    billing_cycle: str,
    origin_url: str,
) -> dict[str, Any]:
    plan = get_plan(plan_id)
    amount_cents = get_plan_price(plan_id, billing_cycle)
    safe_origin = validate_origin_url(origin_url)
    workspace = await get_workspace_or_raise(workspace_id)

    stripe_client = build_stripe_billing_client()
    stripe_price_id = get_plan_stripe_price_id(plan_id, billing_cycle)

    success_url = f"{safe_origin}/billing?session_id={{CHECKOUT_SESSION_ID}}&success=true"
    cancel_url = f"{safe_origin}/billing?cancelled=true"

    existing_customer_id = (
        workspace.get("billing", {}).get("stripe_customer_id")
        or workspace.get("stripe_customer_id")
    )

    metadata = {
        "type": "subscription",
        "workspace_id": workspace_id,
        "user_id": user_id,
        "plan_id": plan["id"],
        "billing_cycle": billing_cycle,
        "workspace_name": str(workspace.get("name", "")),
        "user_email": str(workspace.get("owner_email", "")),
    }

    session = await stripe_client.create_checkout_session(
        price_id=stripe_price_id,
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
        currency="usd",
        customer_id=existing_customer_id,
        client_reference_id=workspace_id,
    )

    session_id = _extract_object_id(session.get("id")) or session.get("id")
    checkout_url = session.get("url")

    if not session_id:
        raise ValueError("Stripe checkout session did not return a session ID")
    if not checkout_url:
        raise ValueError("Stripe checkout session did not return a checkout URL")

    await create_pending_subscription_transaction(
        workspace_id=workspace_id,
        user_id=user_id,
        plan_id=plan["id"],
        billing_cycle=billing_cycle,
        session_id=session_id,
        customer_id=existing_customer_id,
        amount_cents=amount_cents,
        metadata={
            **metadata,
            "stripe_price_id": stripe_price_id,
        },
    )

    result = CheckoutSessionResult(
        success=True,
        checkout_url=checkout_url,
        session_id=session_id,
    )
    return result.model_dump()


async def create_credit_checkout(
    *,
    workspace_id: str,
    user_id: str,
    pack_id: str,
    origin_url: str,
) -> dict[str, Any]:
    pack = get_credit_pack(pack_id)
    safe_origin = validate_origin_url(origin_url)
    workspace = await get_workspace_or_raise(workspace_id)

    stripe_client = build_stripe_billing_client()
    stripe_price_id = get_credit_pack_stripe_price_id(pack_id)

    success_url = (
        f"{safe_origin}/billing?session_id={{CHECKOUT_SESSION_ID}}"
        f"&credit_success=true&pack_id={pack_id}"
    )
    cancel_url = f"{safe_origin}/billing?credit_cancelled=true"

    existing_customer_id = (
        workspace.get("billing", {}).get("stripe_customer_id")
        or workspace.get("stripe_customer_id")
    )

    metadata = {
        "type": "credit_topup",
        "workspace_id": workspace_id,
        "user_id": user_id,
        "pack_id": pack["id"],
        "credits": str(pack.get("total_credits") or pack["credits"]),
        "workspace_name": str(workspace.get("name", "")),
        "user_email": str(workspace.get("owner_email", "")),
    }

    session = await stripe_client.create_checkout_session(
        price_id=stripe_price_id,
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
        currency="usd",
        customer_id=existing_customer_id,
        client_reference_id=workspace_id,
    )

    session_id = _extract_object_id(session.get("id")) or session.get("id")
    checkout_url = session.get("url")

    if not session_id:
        raise ValueError("Stripe checkout session did not return a session ID")
    if not checkout_url:
        raise ValueError("Stripe checkout session did not return a checkout URL")

    await create_pending_credit_transaction(
        workspace_id=workspace_id,
        user_id=user_id,
        pack_id=pack["id"],
        session_id=session_id,
        customer_id=existing_customer_id,
        metadata={
            **metadata,
            "stripe_price_id": stripe_price_id,
        },
    )

    result = CheckoutSessionResult(
        success=True,
        checkout_url=checkout_url,
        session_id=session_id,
    )
    return result.model_dump()


async def get_checkout_status(
    *,
    workspace_id: str,
    session_id: str,
) -> dict[str, Any]:
    await ensure_checkout_session_owned_by_workspace(
        workspace_id=workspace_id,
        session_id=session_id,
    )

    stripe_client = build_stripe_billing_client()
    session = await stripe_client.get_checkout_session(session_id)

    status = session.get("status", "unknown")
    payment_status = session.get("payment_status", "unknown")

    if status == "expired":
        await mark_transaction_status(session_id=session_id, status="expired")

    result = CheckoutStatusResult(
        status=status,
        payment_status=payment_status,
        session_id=session_id,
    )
    return result.model_dump()


# ============================================================================
# FINALIZATION
# ============================================================================

async def finalize_paid_transaction(txn: dict[str, Any]) -> None:
    txn_type = txn.get("type")

    if txn_type == "subscription":
        start, end = _period_window(txn.get("billing_cycle", "monthly"))
        await apply_workspace_subscription(
            workspace_id=txn["workspace_id"],
            plan_id=txn["plan_id"],
            billing_cycle=txn["billing_cycle"],
            stripe_customer_id=txn.get("stripe_customer_id"),
            stripe_subscription_id=txn.get("stripe_subscription_id"),
            period_start=start,
            period_end=end,
            subscription_status="active",
        )
        return

    if txn_type == "credit_topup":
        await apply_credit_topup(
            workspace_id=txn["workspace_id"],
            credits=int(txn.get("credits_delta", 0)),
        )
        return


async def _finalize_transaction_once(txn: dict[str, Any]) -> None:
    if txn.get("finalized_at"):
        logger.info("Transaction already finalized: %s", txn.get("session_id"))
        return

    await finalize_paid_transaction(txn)
    await billing_repository.mark_transaction_status(
        txn["session_id"],
        "completed",
    )


# ============================================================================
# WEBHOOK HELPERS
# ============================================================================

def _event_type(event: Any) -> str:
    if isinstance(event, dict):
        return str(event.get("type", "unknown"))
    return str(getattr(event, "type", "unknown"))


def _event_data_object(event: Any) -> dict[str, Any]:
    if isinstance(event, dict):
        return dict(event.get("data", {}).get("object", {}) or {})

    data = getattr(event, "data", None)
    obj = getattr(data, "object", None)
    if isinstance(obj, dict):
        return dict(obj)

    try:
        return dict(obj)
    except Exception:
        return {}


async def _is_event_processed(event_id: str) -> bool:
    db = get_db()
    existing = await db.billing_webhook_events.find_one({"event_id": event_id})
    return existing is not None


async def _mark_event_processed(event_id: str) -> None:
    db = get_db()
    await db.billing_webhook_events.insert_one(
        {
            "event_id": event_id,
            "processed_at": _utc_now(),
        }
    )


# ============================================================================
# WEBHOOK PROCESSING
# ============================================================================

async def process_stripe_webhook(
    *,
    body: bytes,
    signature: str | None,
) -> dict[str, Any]:
    stripe_client = build_stripe_billing_client()
    event = await stripe_client.construct_webhook_event(
        body=body,
        signature=signature,
    )

    event_id = event.get("id")
    if not event_id:
        raise ValueError("Webhook missing event ID")

    if await _is_event_processed(event_id):
        logger.info("Skipping duplicate webhook event: %s", event_id)
        return {
            "event_type": _event_type(event),
            "session_id": None,
            "duplicate": True,
        }

    event_type = _event_type(event)
    obj = _event_data_object(event)

    session_id = obj.get("id")
    if not session_id:
        raise ValueError("Webhook missing checkout session ID")

    logger.info(
        "Stripe webhook received: event_id=%s type=%s session=%s",
        event_id,
        event_type,
        session_id,
    )

    payment_status = str(obj.get("payment_status", "") or "")
    status = str(obj.get("status", "") or "")
    metadata = obj.get("metadata", {}) or {}

    txn = None

    if event_type in {
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
    }:
        txn = await mark_transaction_paid(
            session_id=session_id,
            payment_intent_id=_extract_object_id(obj.get("payment_intent")),
            invoice_id=_extract_object_id(obj.get("invoice")),
            subscription_id=_extract_object_id(obj.get("subscription")),
        )
        if txn:
            await _finalize_transaction_once(txn)

    elif event_type == "checkout.session.expired" or status == "expired":
        await mark_transaction_status(session_id=session_id, status="expired")

        workspace_id = metadata.get("workspace_id")
        if workspace_id:
            await _set_workspace_subscription_status_only(
                workspace_id=workspace_id,
                subscription_status="inactive",
            )

    elif event_type == "checkout.session.async_payment_failed":
        await mark_transaction_status(session_id=session_id, status="failed")

    else:
        logger.info("Unhandled Stripe event type: %s", event_type)

    if payment_status == "paid":
        txn = await mark_transaction_paid(
            session_id=session_id,
            payment_intent_id=_extract_object_id(obj.get("payment_intent")),
            invoice_id=_extract_object_id(obj.get("invoice")),
            subscription_id=_extract_object_id(obj.get("subscription")),
        )
        if txn:
            await _finalize_transaction_once(txn)

    await _mark_event_processed(event_id)

    result = WebhookProcessResult(
        event_type=event_type,
        session_id=session_id,
    )
    return result.model_dump()


# ============================================================================
# BILLING SUMMARY
# ============================================================================

async def build_billing_summary(workspace_id: str) -> dict[str, Any]:
    workspace = await get_workspace_or_raise(workspace_id)

    billing = workspace.get("billing", {}) or {}
    usage = workspace.get("usage", {}) or {}
    recent_transactions = await billing_repository.list_recent_transactions(
        workspace_id,
        limit=10,
    )

    top_level_plan = workspace.get("plan")
    top_level_subscription_status = workspace.get("subscription_status")

    response = BillingSummaryResponse(
        workspace_id=workspace_id,
        plan_id=top_level_plan or billing.get("plan_id"),
        billing_cycle=billing.get("billing_cycle"),
        subscription_status=_coerce_subscription_status(
            top_level_subscription_status or billing.get("subscription_status", "inactive")
        ),
        stripe_customer_id=billing.get("stripe_customer_id"),
        stripe_subscription_id=billing.get("stripe_subscription_id"),
        current_period_start=billing.get("current_period_start"),
        current_period_end=billing.get("current_period_end"),
        credit_balance=int(usage.get("credit_balance", 0) or 0),
        monthly_credits_included=int(usage.get("monthly_credits_included", 0) or 0),
        recent_transactions=recent_transactions,
    )
    return response.model_dump()
