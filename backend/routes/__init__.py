"""Stable route exports for the minimal boot-safe API surface."""
from backend.routes.analytics import router as analytics_router
from backend.routes.calendar import router as calendar_router
from backend.routes.contact import router as contact_router
from backend.routes.crm import router as crm_router
from backend.routes.headshots import router as headshots_router

__all__ = [
    "analytics_router",
    "calendar_router",
    "contact_router",
    "crm_router",
    "headshots_router",
]