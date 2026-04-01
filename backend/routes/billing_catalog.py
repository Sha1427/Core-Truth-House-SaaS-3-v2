from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from constants.billing_catalog import CREDIT_PACKS, PLAN_CATALOG

router = APIRouter(
    prefix="/api/billing",
    tags=["billing-catalog"],
)


# ============================================================================
# HELPERS
# ============================================================================

def _string(value: Any) -> str:
    return str(value or "").strip()


def _safe_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _coerce_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes", "on"}:
            return True
        if normalized in {"false", "0", "no", "off"}:
            return False
    return default


def _public_plan_payload(plan: dict[str, Any]) -> dict[str, Any]:
    item = _safe_dict(plan)

    return {
        "id": _string(item.get("id")),
        "name": _string(item.get("name")),
        "description": _string(item.get("description")),
        "active": _coerce_bool(item.get("active"), default=False),
        "recommended": _coerce_bool(item.get("recommended"), default=False),
        "display_order": int(item.get("display_order", 0) or 0),
        "currency": _string(item.get("currency") or "usd").lower(),
        "monthly_price_cents": int(item.get("monthly_price_cents", 0) or 0),
        "annual_price_cents": int(item.get("annual_price_cents", 0) or 0),
        "monthly_credits": int(item.get("monthly_credits", 0) or 0),
        "annual_credits": int(item.get("annual_credits", 0) or 0),
        "features": list(item.get("features") or []),
        # Public-safe Stripe references for frontend checkout mapping.
        # Do not expose secret keys here.
        "stripe_price_id_monthly": _string(item.get("stripe_price_id_monthly")),
        "stripe_price_id_annual": _string(item.get("stripe_price_id_annual")),
    }


def _public_credit_pack_payload(pack: dict[str, Any]) -> dict[str, Any]:
    item = _safe_dict(pack)

    return {
        "id": _string(item.get("id")),
        "name": _string(item.get("name")),
        "description": _string(item.get("description")),
        "active": _coerce_bool(item.get("active"), default=False),
        "recommended": _coerce_bool(item.get("recommended"), default=False),
        "display_order": int(item.get("display_order", 0) or 0),
        "currency": _string(item.get("currency") or "usd").lower(),
        "price_cents": int(item.get("price_cents", 0) or 0),
        "credits": int(item.get("credits", 0) or 0),
        "stripe_price_id": _string(item.get("stripe_price_id")),
    }


def _sorted_active_plans() -> list[dict[str, Any]]:
    plans: list[dict[str, Any]] = []

    for raw_plan in PLAN_CATALOG.values():
        payload = _public_plan_payload(raw_plan)
        if not payload["active"]:
            continue
        plans.append(payload)

    plans.sort(
        key=lambda item: (
            int(item.get("display_order", 0)),
            _string(item.get("name")).lower(),
            _string(item.get("id")),
        )
    )
    return plans


def _sorted_active_credit_packs() -> list[dict[str, Any]]:
    packs: list[dict[str, Any]] = []

    for raw_pack in CREDIT_PACKS:
        payload = _public_credit_pack_payload(raw_pack)
        if not payload["active"]:
            continue
        packs.append(payload)

    packs.sort(
        key=lambda item: (
            int(item.get("display_order", 0)),
            _string(item.get("name")).lower(),
            _string(item.get("id")),
        )
    )
    return packs


# ============================================================================
# ROUTES
# ============================================================================

@router.get("/plans")
async def get_plans() -> dict[str, Any]:
    plans = _sorted_active_plans()
    return {
        "plans": plans,
        "total": len(plans),
    }


@router.get("/credit-packs")
async def get_credit_packs() -> dict[str, Any]:
    packs = _sorted_active_credit_packs()
    return {
        "packs": packs,
        "total": len(packs),
    }
