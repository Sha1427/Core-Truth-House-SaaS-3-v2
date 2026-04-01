"""Minimal boot-safe API router registration."""

from __future__ import annotations

import logging

from fastapi import APIRouter, FastAPI

from backend.routes import (
    analytics_router,
    calendar_router,
    contact_router,
    crm_router,
)

logger = logging.getLogger(__name__)

api_router = APIRouter()


def register_api_routers(app: FastAPI) -> None:
    """
    Register only the stable routers that are currently certified to boot cleanly.
    Keep this list intentionally small until the rest of the route layer is hardened.
    """
    global api_router

    api_router = APIRouter()

    stable_routers = [
        analytics_router,
        calendar_router,
        crm_router,
        contact_router,
    ]

    for router in stable_routers:
        api_router.include_router(router)

    app.include_router(api_router)

    logger.info(
        "Registered stable API routers: %s",
        ", ".join(
            [
                "analytics",
                "calendar",
                "crm",
                "contact",
            ]
        ),
    )
