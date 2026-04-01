from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Request, Response, status

from backend.database import logger
from backend.services.billing_service import process_stripe_webhook

router = APIRouter(
    prefix="/api/webhooks",
    tags=["billing-webhooks"],
)


# ============================================================================
# HELPERS
# ============================================================================

def _string(value: Any) -> str:
    return str(value or "").strip()


def _json_response(
    payload: str,
    *,
    status_code: int = status.HTTP_200_OK,
) -> Response:
    return Response(
        content=payload,
        media_type="application/json",
        status_code=status_code,
    )


def _event_log_value(result: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = result.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return None


# ============================================================================
# ROUTES
# ============================================================================

@router.post("/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request) -> Response:
    """
    Stripe webhook receiver.

    Design rules:
    - this route must stay unauthenticated
    - signature verification is delegated to the billing service
    - failures should be logged clearly without leaking internals to Stripe
    - successful replays should still return 200 if the service treats them as safe
    """
    body = await request.body()
    signature = _string(request.headers.get("Stripe-Signature"))

    if not body:
        logger.warning("Stripe webhook rejected: empty body")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook body is required.",
        )

    if not signature:
        logger.warning("Stripe webhook rejected: missing Stripe-Signature header")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe-Signature header.",
        )

    try:
        result = await process_stripe_webhook(
            body=body,
            signature=signature,
        )

        event_type = _event_log_value(result, "event_type", "type")
        event_id = _event_log_value(result, "event_id", "stripe_event_id", "id")
        session_id = _event_log_value(result, "session_id", "checkout_session_id")
        workspace_id = _event_log_value(result, "workspace_id")
        transaction_id = _event_log_value(result, "transaction_id")

        logger.info(
            "Stripe webhook processed: event_id=%s event_type=%s session_id=%s workspace_id=%s transaction_id=%s",
            event_id,
            event_type,
            session_id,
            workspace_id,
            transaction_id,
        )

        return _json_response('{"received": true}')

    except ValueError as exc:
        logger.warning("Stripe webhook rejected: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except PermissionError as exc:
        logger.warning("Stripe webhook forbidden: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Webhook not permitted.",
        ) from exc

    except LookupError as exc:
        logger.warning("Stripe webhook lookup failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced billing record was not found.",
        ) from exc

    except HTTPException:
        raise

    except Exception:
        logger.exception("Stripe webhook processing failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed.",
        )
