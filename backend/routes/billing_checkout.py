from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from middleware.tenant_dependencies import (
    TenantContext,
    enforce_workspace_match,
    require_tenant_member,
)

try:
    from backend.models.billing import (
        CreditCheckoutRequest,
        SubscriptionCheckoutRequest,
    )
except Exception:  # pragma: no cover
    from models.billing import (  # type: ignore
        CreditCheckoutRequest,
        SubscriptionCheckoutRequest,
    )

from backend.services.billing_service import (
    create_credit_checkout,
    create_subscription_checkout,
    get_checkout_status,
)

router = APIRouter(
    prefix="/api/billing",
    tags=["billing-checkout"],
)


# ============================================================================
# HELPERS
# ============================================================================

def _string(value: Any) -> str:
    return str(value or "").strip()


def _require_workspace_id(ctx: TenantContext) -> str:
    workspace_id = _string(ctx.workspace_id)
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace context required.",
        )
    return workspace_id


def _raise_checkout_error(exc: Exception, *, action: str) -> None:
    if isinstance(exc, HTTPException):
        raise exc

    if isinstance(exc, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if isinstance(exc, PermissionError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    if isinstance(exc, LookupError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Failed to {action}.",
    ) from exc


def _actor_metadata(ctx: TenantContext) -> dict[str, Any]:
    return {
        "actor_user_id": ctx.user_id,
        "actor_workspace_id": ctx.workspace_id,
        "actor_workspace_role": ctx.workspace_role,
        "actor_global_role": ctx.global_role,
        "actor_is_admin": ctx.is_admin,
        "actor_is_super_admin": ctx.is_super_admin,
    }


# ============================================================================
# ROUTES
# ============================================================================

@router.post("/checkout/subscription")
async def create_subscription_checkout_route(
    data: SubscriptionCheckoutRequest,
    request: Request,
    ctx: TenantContext = Depends(require_tenant_member),
):
    """
    Create a Stripe checkout session for a subscription plan upgrade or change.

    Rules:
    - caller must be an authenticated workspace member
    - workspace id always comes from tenant context, not client input
    - backend service decides plan validity and billing behavior
    """
    try:
        workspace_id = enforce_workspace_match(
            ctx,
            ctx.workspace_id,
            allow_super_admin=True,
        )
        user_id = _string(ctx.user_id)

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authenticated user id not found.",
            )

        if not workspace_id:
            workspace_id = _require_workspace_id(ctx)

        result = await create_subscription_checkout(
            workspace_id=workspace_id,
            user_id=user_id,
            plan_id=data.plan_id,
            billing_cycle=data.billing_cycle,
            origin_url=data.origin_url,
        )

        if isinstance(result, dict):
            result.setdefault("workspace_id", workspace_id)
            result.setdefault("requested_by_user_id", user_id)
            result.setdefault("actor", _actor_metadata(ctx))

        return result

    except Exception as exc:
        _raise_checkout_error(exc, action="create subscription checkout")


@router.post("/checkout/credits")
async def create_credit_checkout_route(
    data: CreditCheckoutRequest,
    request: Request,
    ctx: TenantContext = Depends(require_tenant_member),
):
    """
    Create a Stripe checkout session for a credit pack purchase.

    Rules:
    - caller must be an authenticated workspace member
    - workspace id always comes from tenant context
    """
    try:
        workspace_id = enforce_workspace_match(
            ctx,
            ctx.workspace_id,
            allow_super_admin=True,
        )
        user_id = _string(ctx.user_id)

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authenticated user id not found.",
            )

        if not workspace_id:
            workspace_id = _require_workspace_id(ctx)

        result = await create_credit_checkout(
            workspace_id=workspace_id,
            user_id=user_id,
            pack_id=data.pack_id,
            origin_url=data.origin_url,
        )

        if isinstance(result, dict):
            result.setdefault("workspace_id", workspace_id)
            result.setdefault("requested_by_user_id", user_id)
            result.setdefault("actor", _actor_metadata(ctx))

        return result

    except Exception as exc:
        _raise_checkout_error(exc, action="create credit checkout")


@router.get("/checkout/status/{session_id}")
async def get_checkout_status_route(
    session_id: str,
    request: Request,
    ctx: TenantContext = Depends(require_tenant_member),
):
    """
    Return checkout session status for the caller's workspace only.
    """
    try:
        normalized_session_id = _string(session_id)
        if not normalized_session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Checkout session id is required.",
            )

        workspace_id = enforce_workspace_match(
            ctx,
            ctx.workspace_id,
            allow_super_admin=True,
        )
        if not workspace_id:
            workspace_id = _require_workspace_id(ctx)

        result = await get_checkout_status(
            workspace_id=workspace_id,
            session_id=normalized_session_id,
        )

        if isinstance(result, dict):
            result.setdefault("workspace_id", workspace_id)
            result.setdefault("session_id", normalized_session_id)

        return result

    except Exception as exc:
        _raise_checkout_error(exc, action="get checkout status")
