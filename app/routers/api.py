"""Minimal boot-safe API router registration."""
from __future__ import annotations
import logging
from fastapi import APIRouter, FastAPI
from backend.routes import (
    analytics_router,
    calendar_router,
    contact_router,
    crm_router,
    headshots_router,
)
from backend.app.routes.workspaces import router as workspaces_router
from backend.routes.audit import router as audit_router
from backend.routes.onboarding_router import router as onboarding_router
from backend.routes.workspace_stats import router as workspace_stats_router
from backend.routes.persist_router import router as persist_router
from backend.routes.campaigns import router as campaigns_router
from backend.routes.brand_health import router as brand_health_router
from backend.routes.core import router as core_router
from backend.routes.settings import router as settings_router
from backend.routes.business import router as business_router
from backend.routes.identity import router as identity_router
from backend.routes.notifications import router as notifications_router
from backend.routes.usage import router as usage_router
from backend.routes.subscription import router as subscription_router
from backend.routes.billing_checkout import router as billing_checkout_router
from backend.routes.billing_summary import router as billing_summary_router
from backend.routes.billing_catalog import router as billing_catalog_router
from backend.routes.documents import router as documents_router
from backend.routes.export import router as export_router
from backend.routes.media import router as media_router
from backend.routes.social import router as social_router
from backend.routes.teams import router as teams_router
from backend.routes.permissions import router as permissions_router
from backend.routes.prompts import router as prompts_router
from backend.routes.os_workflow import router as os_workflow_router
from backend.routes.digest import router as digest_router
from backend.routes.chatbot import router as chatbot_router
from backend.routes.admin import router as admin_router

logger = logging.getLogger(__name__)
api_router = APIRouter()

def register_api_routers(app: FastAPI) -> None:
    global api_router
    api_router = APIRouter()
    routers = [
        analytics_router,
        calendar_router,
        crm_router,
        contact_router,
        headshots_router,
        workspaces_router,
        audit_router,
        onboarding_router,
        workspace_stats_router,
        persist_router,
        campaigns_router,
        brand_health_router,
        core_router,
        settings_router,
        business_router,
        identity_router,
        notifications_router,
        usage_router,
        subscription_router,
        billing_checkout_router,
        billing_summary_router,
        billing_catalog_router,
        documents_router,
        export_router,
        media_router,
        social_router,
        teams_router,
        permissions_router,
        prompts_router,
        os_workflow_router,
        digest_router,
        chatbot_router,
        admin_router,
    ]
    for router in routers:
        try:
            api_router.include_router(router)
        except Exception as exc:
            logger.warning("Failed to register router: %s", exc)
    app.include_router(api_router)
    logger.info("All API routers registered")
