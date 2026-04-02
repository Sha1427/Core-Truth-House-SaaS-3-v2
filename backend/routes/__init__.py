"""Stable route exports for the minimal boot-safe API surface.
Only include routers here that are confirmed import-safe and production-stable.
Add additional routers back one at a time after they are cleaned and tested.
"""
from backend.routes.analytics import router as analytics_router
from backend.routes.billing_catalog import router as billing_catalog_router
from backend.routes.billing_checkout import router as billing_checkout_router
from backend.routes.billing_summary import router as billing_summary_router
from backend.routes.billing_webhooks import router as billing_webhooks_router
from backend.routes.calendar import router as calendar_router
from backend.routes.contact import router as contact_router
from backend.routes.crm import router as crm_router
from backend.routes.headshots import router as headshots_router

__all__ = [
    "analytics_router",
    "billing_catalog_router",
    "billing_checkout_router",
    "billing_summary_router",
    "billing_webhooks_router",
    "calendar_router",
    "contact_router",
    "crm_router",
    "headshots_router",
]