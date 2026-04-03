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

logger = logging.getLogger(__name__)

def _safe_import(module_path: str, attr: str):
    try:
        import importlib
        mod = importlib.import_module(module_path)
        return getattr(mod, attr, None)
    except Exception as exc:
        logger.warning("Skipping router %s: %s", module_path, exc)
        return None

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
        workspaces_router,
    ]
    optional_routers = [
        ("backend.routes.audit", "router"),
        ("backend.routes.onboarding_router", "router"),
        ("backend.routes.workspace_stats", "router"),
        ("backend.routes.persist_router", "router"),
        ("backend.routes.campaigns", "router"),
        ("backend.routes.brand_health", "router"),
        ("backend.routes.core", "router"),
        ("backend.routes.settings", "router"),
        ("backend.routes.business", "router"),
        ("backend.routes.identity", "router"),
        ("backend.routes.notifications", "router"),
        ("backend.routes.usage", "router"),
        ("backend.routes.subscription", "router"),
        ("backend.routes.billing_checkout", "router"),
        ("backend.routes.billing_summary", "router"),
        ("backend.routes.billing_catalog", "router"),
        ("backend.routes.documents", "router"),
        ("backend.routes.export", "router"),
        ("backend.routes.media", "router"),
        ("backend.routes.social", "router"),
        ("backend.routes.teams", "router"),
        ("backend.routes.permissions", "router"),
        ("backend.routes.prompts", "router"),
        ("backend.routes.os_workflow", "router"),
        ("backend.routes.digest", "router"),
        ("backend.routes.chatbot", "router"),
        ("backend.routes.admin", "router"),
    ]
    for router in stable_routers:
        api_router.include_router(router)
    for module_path, attr in optional_routers:
        router = _safe_import(module_path, attr)
        if router is not None:
            try:
                api_router.include_router(router)
            except Exception as exc:
                logger.warning("Failed to register router %s: %s", module_path, exc)
    app.include_router(api_router)
    logger.info("API routers registered successfully")
