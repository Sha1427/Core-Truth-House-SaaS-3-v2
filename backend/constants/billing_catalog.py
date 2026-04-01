from __future__ import annotations

import os
from typing import Any, Final


# ============================================================================
# CORE DEFAULTS
# ============================================================================

DEFAULT_CURRENCY: Final[str] = "usd"


def _string(value: Any) -> str:
    return str(value or "").strip()


def _int(value: Any, default: int = 0) -> int:
    try:
        if value is None or value == "":
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"1", "true", "yes", "on"}:
            return True
        if normalized in {"0", "false", "no", "off"}:
            return False
    return default


def _env(name: str, default: str = "") -> str:
    return _string(os.getenv(name, default))


def _recommended(*, recommended: bool = False, is_recommended: bool = False) -> bool:
    return bool(recommended or is_recommended)


# ============================================================================
# PLAN CATALOG
# ============================================================================
# Production rule:
# - human-readable ids stay stable
# - prices stay in cents
# - Stripe price IDs are injected from environment
# - "recommended" is canonical, but "is_recommended" is also included
#   for backward compatibility with older frontend/backend code
# - "default" is canonical, but "is_default" is also included
#   for backward compatibility
# ============================================================================

PLAN_CATALOG: dict[str, dict[str, Any]] = {
    "starter": {
        "id": "starter",
        "name": "Starter",
        "description": "Entry plan for early-stage founders.",
        "monthly_price_cents": 2900,
        "annual_price_cents": 29000,
        "monthly_credits": 100,
        "annual_credits": 1200,
        "currency": DEFAULT_CURRENCY,
        "active": True,
        "default": True,
        "is_default": True,
        "recommended": False,
        "is_recommended": False,
        "display_order": 1,
        "stripe_price_id_monthly": _env("STRIPE_PRICE_STARTER_MONTHLY"),
        "stripe_price_id_annual": _env("STRIPE_PRICE_STARTER_ANNUAL"),
        "features": [
            "Core billing access",
            "Base monthly credit allocation",
            "Workspace-level subscription tracking",
        ],
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "description": "Growth plan for active teams and operators.",
        "monthly_price_cents": 7900,
        "annual_price_cents": 79000,
        "monthly_credits": 400,
        "annual_credits": 4800,
        "currency": DEFAULT_CURRENCY,
        "active": True,
        "default": False,
        "is_default": False,
        "recommended": True,
        "is_recommended": True,
        "display_order": 2,
        "stripe_price_id_monthly": _env("STRIPE_PRICE_PRO_MONTHLY"),
        "stripe_price_id_annual": _env("STRIPE_PRICE_PRO_ANNUAL"),
        "features": [
            "Expanded monthly credit allocation",
            "Better fit for active client work",
            "Scales with team operations",
        ],
    },
    "enterprise": {
        "id": "enterprise",
        "name": "Enterprise",
        "description": "High-capacity plan for advanced operations.",
        "monthly_price_cents": 19900,
        "annual_price_cents": 199000,
        "monthly_credits": 1200,
        "annual_credits": 14400,
        "currency": DEFAULT_CURRENCY,
        "active": True,
        "default": False,
        "is_default": False,
        "recommended": False,
        "is_recommended": False,
        "display_order": 3,
        "stripe_price_id_monthly": _env("STRIPE_PRICE_ENTERPRISE_MONTHLY"),
        "stripe_price_id_annual": _env("STRIPE_PRICE_ENTERPRISE_ANNUAL"),
        "features": [
            "High-capacity credit allocation",
            "Advanced operational support fit",
            "Built for larger workloads",
        ],
    },
}


# ============================================================================
# CREDIT PACK CATALOG
# ============================================================================
# "credits" is the purchased amount
# "bonus_credits" stays explicit so pricing logic remains auditable
# "total_credits" is precomputed for convenience
# ============================================================================

CREDIT_PACKS: list[dict[str, Any]] = [
    {
        "id": "pack_100",
        "name": "100 Credits",
        "description": "Flexible top-up for lighter usage.",
        "credits": 100,
        "bonus_credits": 0,
        "total_credits": 100,
        "price_cents": 1900,
        "currency": DEFAULT_CURRENCY,
        "active": True,
        "recommended": False,
        "is_recommended": False,
        "display_order": 1,
        "stripe_price_id": _env("STRIPE_PRICE_CREDIT_100"),
    },
    {
        "id": "pack_250",
        "name": "250 Credits",
        "description": "Mid-sized credit top-up for active work.",
        "credits": 250,
        "bonus_credits": 0,
        "total_credits": 250,
        "price_cents": 3900,
        "currency": DEFAULT_CURRENCY,
        "active": True,
        "recommended": True,
        "is_recommended": True,
        "display_order": 2,
        "stripe_price_id": _env("STRIPE_PRICE_CREDIT_250"),
    },
    {
        "id": "pack_500",
        "name": "500 Credits",
        "description": "Larger credit reserve for heavier usage.",
        "credits": 500,
        "bonus_credits": 0,
        "total_credits": 500,
        "price_cents": 6900,
        "currency": DEFAULT_CURRENCY,
        "active": True,
        "recommended": False,
        "is_recommended": False,
        "display_order": 3,
        "stripe_price_id": _env("STRIPE_PRICE_CREDIT_500"),
    },
]


# ============================================================================
# DERIVED INDEXES
# ============================================================================

PLAN_IDS: tuple[str, ...] = tuple(PLAN_CATALOG.keys())

ACTIVE_PLAN_IDS: tuple[str, ...] = tuple(
    plan_id
    for plan_id, plan in PLAN_CATALOG.items()
    if _bool(plan.get("active"), False)
)

DEFAULT_PLAN_ID: str = next(
    (
        plan_id
        for plan_id, plan in PLAN_CATALOG.items()
        if _bool(plan.get("default"), False) or _bool(plan.get("is_default"), False)
    ),
    "starter",
)

RECOMMENDED_PLAN_ID: str | None = next(
    (
        plan_id
        for plan_id, plan in PLAN_CATALOG.items()
        if _recommended(
            recommended=_bool(plan.get("recommended"), False),
            is_recommended=_bool(plan.get("is_recommended"), False),
        )
    ),
    None,
)

CREDIT_PACK_MAP: dict[str, dict[str, Any]] = {
    pack["id"]: pack for pack in CREDIT_PACKS
}

ACTIVE_CREDIT_PACK_IDS: tuple[str, ...] = tuple(
    pack["id"]
    for pack in CREDIT_PACKS
    if _bool(pack.get("active"), False)
)

RECOMMENDED_CREDIT_PACK_ID: str | None = next(
    (
        pack["id"]
        for pack in CREDIT_PACKS
        if _recommended(
            recommended=_bool(pack.get("recommended"), False),
            is_recommended=_bool(pack.get("is_recommended"), False),
        )
    ),
    None,
)


# ============================================================================
# LOOKUP HELPERS
# ============================================================================

def get_plan_catalog_item(plan_id: str) -> dict[str, Any]:
    normalized = _string(plan_id)
    item = PLAN_CATALOG.get(normalized)
    if not item or not _bool(item.get("active"), False):
        raise ValueError("Invalid or inactive plan")
    return item


def get_credit_pack_catalog_item(pack_id: str) -> dict[str, Any]:
    normalized = _string(pack_id)
    item = CREDIT_PACK_MAP.get(normalized)
    if not item or not _bool(item.get("active"), False):
        raise ValueError("Invalid or inactive credit pack")
    return item


def get_plan_stripe_price_id(plan_id: str, billing_cycle: str) -> str:
    plan = get_plan_catalog_item(plan_id)
    normalized_cycle = _string(billing_cycle).lower()

    if normalized_cycle == "monthly":
        price_id = _string(plan.get("stripe_price_id_monthly"))
    elif normalized_cycle == "annual":
        price_id = _string(plan.get("stripe_price_id_annual"))
    else:
        raise ValueError("Invalid billing cycle")

    if not price_id:
        raise ValueError(
            f"Stripe price id is not configured for plan '{plan_id}' and cycle '{billing_cycle}'"
        )

    return price_id


def get_credit_pack_stripe_price_id(pack_id: str) -> str:
    pack = get_credit_pack_catalog_item(pack_id)
    price_id = _string(pack.get("stripe_price_id"))
    if not price_id:
        raise ValueError(f"Stripe price id is not configured for credit pack '{pack_id}'")
    return price_id
