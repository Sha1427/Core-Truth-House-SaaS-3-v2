"""Stable route exports for production API surface."""

from backend.routes.analytics import router as analytics_router
from backend.routes.calendar import router as calendar_router
from backend.routes.contact import router as contact_router
from backend.routes.crm import router as crm_router
from backend.routes.headshots import router as headshots_router
from backend.routes.identity import router as identity_router
from backend.routes.notifications import router as notifications_router
from backend.routes.onboarding_router import router as onboarding_router
from backend.routes.usage import router as usage_router
from backend.routes.user_plan import router as user_plan_router
from backend.routes.audit import router as audit_router

__all__ = [
    "analytics_router",
    "calendar_router",
    "contact_router",
    "crm_router",
    "headshots_router",
    "identity_router",
    "notifications_router",
    "onboarding_router",
    "usage_router",
    "user_plan_router",
    "audit_router",
]