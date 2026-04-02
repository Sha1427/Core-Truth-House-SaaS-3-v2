from __future__ import annotations

import os
from typing import Any

import stripe


# ============================================================================
# ENV
# ============================================================================

STRIPE_API_KEY = os.getenv("STRIPE_API_KEY", "").strip()
PUBLIC_APP_URL = os.getenv("PUBLIC_APP_URL", "").strip()
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()


def _string(value: Any) -> str:
    return str(value or "").strip()


def _require_api_key(api_key: str | None = None) -> str:
    resolved = _string(api_key or STRIPE_API_KEY)
    if not resolved:
        raise ValueError("STRIPE_API_KEY is not configured")
    return resolved


def _require_webhook_secret() -> str:
    resolved = _string(STRIPE_WEBHOOK_SECRET)
    if not resolved:
        raise ValueError("STRIPE_WEBHOOK_SECRET is not configured")
    return resolved


def _coerce_currency(currency: str | None) -> str:
    resolved = _string(currency or "usd").lower()
    if not resolved:
        return "usd"
    return resolved


def _coerce_metadata(metadata: dict[str, Any] | None) -> dict[str, str]:
    output: dict[str, str] = {}
    for key, value in (metadata or {}).items():
        key_str = _string(key)
        if not key_str:
            continue
        output[key_str] = _string(value)
    return output


def get_public_webhook_url() -> str:
    if not PUBLIC_APP_URL:
        raise ValueError("PUBLIC_APP_URL is not configured")
    return f"{PUBLIC_APP_URL.rstrip('/')}/api/webhooks/stripe"


# ============================================================================
# CLIENT
# ============================================================================

class StripeBillingClient:
    def __init__(self, *, api_key: str | None = None) -> None:
        self.api_key = _require_api_key(api_key)
        stripe.api_key = self.api_key

    async def create_checkout_session(
        self,
        *,
        success_url: str,
        cancel_url: str,
        metadata: dict[str, Any],
        currency: str = "usd",
        amount_cents: int | None = None,
        price_id: str | None = None,
        mode: str = "payment",
        customer_id: str | None = None,
        client_reference_id: str | None = None,
    ) -> dict[str, Any]:
        """
        Create a Stripe Checkout Session.

        Supported patterns:
        - price_id + mode="subscription" for recurring plans
        - price_id + mode="payment" for one-time products
        - amount_cents fallback for ad hoc one-time payment only

        Production preference:
        - use price_id whenever possible
        """
        normalized_mode = _string(mode or "payment").lower()
        if normalized_mode not in {"payment", "subscription"}:
            raise ValueError("Invalid Stripe checkout mode")

        normalized_success_url = _string(success_url)
        normalized_cancel_url = _string(cancel_url)
        if not normalized_success_url:
            raise ValueError("success_url is required")
        if not normalized_cancel_url:
            raise ValueError("cancel_url is required")

        normalized_metadata = _coerce_metadata(metadata)
        normalized_currency = _coerce_currency(currency)
        normalized_price_id = _string(price_id)
        normalized_customer_id = _string(customer_id) or None
        normalized_client_reference_id = _string(client_reference_id) or None

        session_payload: dict[str, Any] = {
            "payment_method_types": ["card"],
            "mode": normalized_mode,
            "success_url": normalized_success_url,
            "cancel_url": normalized_cancel_url,
            "metadata": normalized_metadata,
        }

        if normalized_customer_id:
            session_payload["customer"] = normalized_customer_id

        if normalized_client_reference_id:
            session_payload["client_reference_id"] = normalized_client_reference_id

        if normalized_price_id:
            session_payload["line_items"] = [
                {
                    "price": normalized_price_id,
                    "quantity": 1,
                }
            ]
        else:
            if normalized_mode != "payment":
                raise ValueError(
                    "price_id is required for subscription checkout sessions"
                )

            if amount_cents is None or int(amount_cents) <= 0:
                raise ValueError("amount_cents must be a positive integer")

            session_payload["line_items"] = [
                {
                    "price_data": {
                        "currency": normalized_currency,
                        "product_data": {
                            "name": normalized_metadata.get("type", "purchase"),
                        },
                        "unit_amount": int(amount_cents),
                    },
                    "quantity": 1,
                }
            ]

        session = stripe.checkout.Session.create(**session_payload)
        return dict(session)

    async def get_checkout_session(self, session_id: str) -> dict[str, Any]:
        normalized_session_id = _string(session_id)
        if not normalized_session_id:
            raise ValueError("session_id is required")

        session = stripe.checkout.Session.retrieve(normalized_session_id)
        return dict(session)

    async def construct_webhook_event(
        self,
        *,
        body: bytes,
        signature: str | None,
    ) -> dict[str, Any]:
        if not body:
            raise ValueError("Webhook body is required")

        normalized_signature = _string(signature)
        if not normalized_signature:
            raise ValueError("Missing Stripe-Signature header")

        event = stripe.Webhook.construct_event(
            payload=body,
            sig_header=normalized_signature,
            secret=_require_webhook_secret(),
        )
        return dict(event)


def build_stripe_billing_client() -> StripeBillingClient:
    return StripeBillingClient()

