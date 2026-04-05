"""Full stable API router registration for production SaaS."""
from __future__ import annotations

import logging

from fastapi import APIRouter, FastAPI

from backend.routes import (
    analytics_router,
    calendar_router,
    contact_router,
    crm_router,
    headshots_router,
    identity_router,
    notifications_router,
    onboarding_router,
    usage_router,
    user_plan_router,
    audit_router,
)

from backend.app.routes.workspaces import router as workspaces_router

logger = logging.getLogger(__name__)
api_router = APIRouter()


def register_api_routers(app: FastAPI) -> None:
    global api_router
    api_router = APIRouter()

    stable_routers = [
        analytics_router,
        calendar_router,
        crm_router,
        contact_router,
        headshots_router,
        identity_router,
        notifications_router,
        onboarding_router,
        usage_router,
        user_plan_router,
        audit_router,
        workspaces_router,
    ]

    for router in stable_routers:
        api_router.include_router(router)

    app.include_router(api_router)

    logger.info(
        "Registered production API routers: %s",
        ", ".join(
            [
                "analytics",
                "calendar",
                "crm",
                "contact",
                "headshots",
                "identity",
                "notifications",
                "onboarding",
                "usage",
                "user_plan",
                "audit",
                "workspaces",
            ]
        ),
    )