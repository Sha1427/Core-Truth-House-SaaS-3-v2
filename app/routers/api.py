"""Minimal boot-safe API router registration."""

from __future__ import annotations

import importlib
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

logger = logging.getLogger("coretruthhouse.api")


def _safe_import(module_path: str, attr: str = "router"):
    try:
        module = importlib.import_module(module_path)
        router = getattr(module, attr, None)

        if router is None:
            logger.warning(
                "Skipping router %s: attribute '%s' not found",
                module_path,
                attr,
            )
            return None

        return router
    except Exception as exc:
        logger.warning("Skipping router %s: %s", module_path, exc)
        return None


def register_api_routers(app: FastAPI) -> None:
    api_router = APIRouter(prefix="/api")

    stable_routers = [
        analytics_router,
        calendar_router,
        crm_router,
        contact_router,
        headshots_router,
        workspaces_router,
    ]

    optional_router_modules = [
        "backend.routes.backfill",
        "backend.routes.user_plan",
        "backend.routes.audit",
        "backend.routes.onboarding_router",
        "backend.routes.workspace_stats",
        "backend.routes.persist_router",
        "backend.routes.campaigns",
        "backend.routes.brand_health",
        "backend.routes.core",
        "backend.routes.settings",
        "backend.routes.business",
        "backend.routes.identity",
        "backend.routes.notifications",
        "backend.routes.usage",
        "backend.routes.subscription",
        "backend.routes.billing_checkout",
        "backend.routes.billing_summary",
        "backend.routes.billing_catalog",
        "backend.routes.documents",
        "backend.routes.export",
        "backend.routes.media",
        "backend.routes.social",
        "backend.routes.teams",
        "backend.routes.permissions",
        "backend.routes.prompts",
        "backend.routes.os_workflow",
        "backend.routes.digest",
        "backend.routes.chatbot",
        "backend.routes.admin",
    ]

    for router in stable_routers:
        try:
            api_router.include_router(router)
        except Exception as exc:
            logger.warning("Failed to register stable router %s: %s", router, exc)

    for module_path in optional_router_modules:
        router = _safe_import(module_path, "router")
        if router is None:
            continue

        try:
            api_router.include_router(router)
        except Exception as exc:
            logger.warning("Failed to register router %s: %s", module_path, exc)

    app.include_router(api_router)
    logger.info("API routers registered successfully")
