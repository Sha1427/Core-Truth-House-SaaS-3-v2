"""Billing summary routes."""

from fastapi import APIRouter, Depends, HTTPException

from backend.middleware.tenant_dependencies import TenantContext, get_tenant_context
from backend.services.billing_service import build_billing_summary

router = APIRouter(
    prefix="/api/billing",
    tags=["billing-summary"],
)

@router.get("/summary")
async def get_billing_summary(
    ctx: TenantContext = Depends(get_tenant_context),
):
    try:
        return await build_billing_summary(ctx.workspace_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load billing summary: {str(e)}",
        )

