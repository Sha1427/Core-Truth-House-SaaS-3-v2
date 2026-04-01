from __future__ import annotations

from datetime import datetime
from typing import Any, Final

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from backend.constants.billing_catalog import PLAN_CATALOG
from backend.db.workspace_db import build_workspace_plan_state, sync_workspace_plan_state
from middleware.tenant_dependencies import (
    enforce_workspace_match,
    get_db_from_request,
    require_platform_admin,
    require_tenant_member,
)

router = APIRouter(prefix="/api/subscription", tags=["subscription"])


# ============================================================================
# CANONICAL PLAN MODEL
# ============================================================================

DEFAULT_PLAN: Final[str] = "audit"

PLAN_ALIASES: Final[dict[str, str]] = {
    "free": "audit",
    "audit": "audit",
    "foundation": "starter",
    "starter": "starter",
    "structure": "pro",
    "house": "pro",
    "pro": "pro",
    "signature": "enterprise",
    "estate": "enterprise",
    "legacy": "enterprise",
    "enterprise": "enterprise",
}

PLAN_ORDER: Final[tuple[str, ...]] = (
    "audit",
    "starter",
    "pro",
    "enterprise",
)

PLAN_RANK: Final[dict[str, int]] = {
    plan_id: index for index, plan_id in enumerate(PLAN_ORDER)
}

PLAN_CONFIG: Final[dict[str, dict[str, Any]]] = {
    "audit": {
        "id": "audit",
        "name": "Audit",
        "description": "No paid subscription is active yet.",
        "active": True,
        "billing_enabled": False,
        "display_order": 0,
        "features": [],
    },
    "starter": {
        "id": "starter",
        "name": PLAN_CATALOG["starter"]["name"],
        "description": PLAN_CATALOG["starter"]["description"],
        "active": PLAN_CATALOG["starter"]["active"],
        "billing_enabled": True,
        "display_order": PLAN_CATALOG["starter"]["display_order"],
        "monthly_price_cents": PLAN_CATALOG["starter"]["monthly_price_cents"],
        "annual_price_cents": PLAN_CATALOG["starter"]["annual_price_cents"],
        "monthly_credits": PLAN_CATALOG["starter"]["monthly_credits"],
        "annual_credits": PLAN_CATALOG["starter"]["annual_credits"],
        "currency": PLAN_CATALOG["starter"]["currency"],
        "features": PLAN_CATALOG["starter"]["features"],
    },
    "pro": {
        "id": "pro",
        "name": PLAN_CATALOG["pro"]["name"],
        "description": PLAN_CATALOG["pro"]["description"],
        "active": PLAN_CATALOG["pro"]["active"],
        "billing_enabled": True,
        "display_order": PLAN_CATALOG["pro"]["display_order"],
        "monthly_price_cents": PLAN_CATALOG["pro"]["monthly_price_cents"],
        "annual_price_cents": PLAN_CATALOG["pro"]["annual_price_cents"],
        "monthly_credits": PLAN_CATALOG["pro"]["monthly_credits"],
        "annual_credits": PLAN_CATALOG["pro"]["annual_credits"],
        "currency": PLAN_CATALOG["pro"]["currency"],
        "features": PLAN_CATALOG["pro"]["features"],
    },
    "enterprise": {
        "id": "enterprise",
        "name": PLAN_CATALOG["enterprise"]["name"],
        "description": PLAN_CATALOG["enterprise"]["description"],
        "active": PLAN_CATALOG["enterprise"]["active"],
        "billing_enabled": True,
        "display_order": PLAN_CATALOG["enterprise"]["display_order"],
        "monthly_price_cents": PLAN_CATALOG["enterprise"]["monthly_price_cents"],
        "annual_price_cents": PLAN_CATALOG["enterprise"]["annual_price_cents"],
        "monthly_credits": PLAN_CATALOG["enterprise"]["monthly_credits"],
        "annual_credits": PLAN_CATALOG["enterprise"]["annual_credits"],
        "currency": PLAN_CATALOG["enterprise"]["currency"],
        "features": PLAN_CATALOG["enterprise"]["features"],
    },
}

FEATURE_PLANS: Final[dict[str, str]] = {
    "content_studio": "starter",
    "calendar": "starter",
    "blog_cms": "starter",
    "crm_suite": "pro",
    "team_invite": "pro",
    "agentic_workflows": "enterprise",
}

NEVER_GATED_FEATURES: Final[set[str]] = {
    "billing",
    "settings",
    "usage",
    "workspace_access",
}


# ============================================================================
# REQUEST / RESPONSE MODELS
# ============================================================================

class UpgradeSubscriptionRequest(BaseModel):
    new_plan: str = Field(..., min_length=1)
    subscription_status: str = Field(default="active", min_length=1)
    plan_expires_at: datetime | None = None

    @field_validator("new_plan")
    @classmethod
    def validate_new_plan(cls, value: str) -> str:
        normalized = normalize_plan(value)
        if normalized not in PLAN_CONFIG:
            raise ValueError("Invalid plan")
        return normalized

    @field_validator("subscription_status")
    @classmethod
    def validate_subscription_status(cls, value: str) -> str:
        cleaned = str(value or "").strip().lower()
        if not cleaned:
            raise ValueError("subscription_status is required")
        return cleaned


# ============================================================================
# PLAN / FEATURE HELPERS
# ============================================================================

def normalize_plan(plan: str | None) -> str:
    raw = str(plan or "").strip().lower()
    if not raw:
        return DEFAULT_PLAN
    return PLAN_ALIASES.get(raw, DEFAULT_PLAN)


def _rank_for_plan(plan: str | None) -> int:
    normalized = normalize_plan(plan)
    return PLAN_RANK.get(normalized, PLAN_RANK[DEFAULT_PLAN])


def plan_includes(plan: str | None, minimum_plan: str | None) -> bool:
    if not minimum_plan:
        return True
    return _rank_for_plan(plan) >= _rank_for_plan(minimum_plan)


def _safe_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _workspace_id_from_doc(workspace: dict[str, Any]) -> str:
    return str(
        workspace.get("workspace_id")
        or workspace.get("id")
        or ""
    ).strip()


def build_features_map(
    plan: str | None,
    entitlements: dict[str, Any] | None = None,
) -> dict[str, bool]:
    normalized_plan = normalize_plan(plan)
    entitlements = _safe_dict(entitlements)

    features: dict[str, bool] = {}

    for feature_name, minimum_plan in FEATURE_PLANS.items():
        features[feature_name] = plan_includes(normalized_plan, minimum_plan)

    for feature_name in NEVER_GATED_FEATURES:
        features[feature_name] = True

    for key, value in entitlements.items():
        if isinstance(value, bool):
            features[key] = value

    return features


def _resolved_plan_state(workspace: dict[str, Any]) -> dict[str, Any]:
    normalized_plan = normalize_plan(
        workspace.get("plan_id")
        or workspace.get("plan")
        or workspace.get("billing", {}).get("plan_id")
    )

    base_state = build_workspace_plan_state(normalized_plan)

    stored_entitlements = _safe_dict(workspace.get("entitlements"))
    stored_limits = _safe_dict(workspace.get("limits"))

    merged_entitlements = {
        **_safe_dict(base_state.get("entitlements")),
        **stored_entitlements,
    }
    merged_limits = {
        **_safe_dict(base_state.get("limits")),
        **stored_limits,
    }

    return {
        "plan": normalized_plan,
        "entitlements": merged_entitlements,
        "limits": merged_limits,
        "credit_limit": base_state.get("credit_limit"),
        "credit_unlimited": base_state.get("credit_unlimited"),
        "credits_cap": base_state.get("credits_cap"),
    }


def workspace_to_subscription_payload(
    workspace_id: str,
    workspace: dict[str, Any],
) -> dict[str, Any]:
    billing = _safe_dict(workspace.get("billing"))
    state = _resolved_plan_state(workspace)
    plan_id = state["plan"]
    features = build_features_map(plan_id, state["entitlements"])
    plan_meta = PLAN_CONFIG[plan_id]

    return {
        "workspace_id": workspace_id,
        "plan": plan_id,
        "plan_id": plan_id,
        "plan_name": plan_meta["name"],
        "plan_description": plan_meta["description"],
        "subscription_status": str(
            billing.get("subscription_status")
            or workspace.get("subscription_status")
            or "inactive"
        ).strip().lower(),
        "plan_expires_at": (
            billing.get("plan_expires_at")
            or workspace.get("plan_expires_at")
        ),
        "billing_cycle": billing.get("billing_cycle"),
        "stripe_customer_id": billing.get("stripe_customer_id"),
        "stripe_subscription_id": billing.get("stripe_subscription_id"),
        "entitlements": state["entitlements"],
        "limits": state["limits"],
        "features": features,
        "credit_limit": state["credit_limit"],
        "credit_unlimited": state["credit_unlimited"],
        "credits_cap": state["credits_cap"],
        "catalog": {
            "id": plan_meta["id"],
            "name": plan_meta["name"],
            "description": plan_meta["description"],
            "billing_enabled": plan_meta["billing_enabled"],
            "monthly_price_cents": plan_meta.get("monthly_price_cents"),
            "annual_price_cents": plan_meta.get("annual_price_cents"),
            "monthly_credits": plan_meta.get("monthly_credits"),
            "annual_credits": plan_meta.get("annual_credits"),
            "currency": plan_meta.get("currency"),
            "features": plan_meta.get("features", []),
        },
    }


async def _find_workspace_by_id(db, workspace_id: str) -> dict[str, Any] | None:
    normalized = str(workspace_id or "").strip()
    if not normalized:
        return None

    return await db.workspaces.find_one(
        {
            "$or": [
                {"workspace_id": normalized},
                {"id": normalized},
            ]
        },
        {"_id": 0},
    )


# ============================================================================
# ROUTES
# ============================================================================

@router.get("/{workspace_id}")
async def get_subscription(workspace_id: str, request: Request):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    resolved_workspace_id = enforce_workspace_match(tenant, workspace_id)
    workspace = await _find_workspace_by_id(db, resolved_workspace_id)

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    canonical_workspace_id = _workspace_id_from_doc(workspace) or resolved_workspace_id
    return workspace_to_subscription_payload(canonical_workspace_id, workspace)


@router.post("/{workspace_id}/upgrade")
async def upgrade_subscription(
    workspace_id: str,
    payload: UpgradeSubscriptionRequest,
    request: Request,
):
    tenant = require_platform_admin(request)
    db = get_db_from_request(request)

    resolved_workspace_id = enforce_workspace_match(
        tenant,
        workspace_id,
        allow_super_admin=True,
    )

    existing = await _find_workspace_by_id(db, resolved_workspace_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Workspace not found")

    new_plan = normalize_plan(payload.new_plan)

    await sync_workspace_plan_state(
        db=db,
        workspace_id=resolved_workspace_id,
        plan=new_plan,
        subscription_status=payload.subscription_status,
    )

    update_fields: dict[str, Any] = {
        "plan": new_plan,
        "plan_id": new_plan,
        "subscription_status": payload.subscription_status,
        "updated_at": datetime.utcnow(),
    }

    if payload.plan_expires_at is not None:
        update_fields["plan_expires_at"] = payload.plan_expires_at
        update_fields["billing.plan_expires_at"] = payload.plan_expires_at

    update_fields["billing.plan_id"] = new_plan
    update_fields["billing.subscription_status"] = payload.subscription_status

    await db.workspaces.update_one(
        {
            "$or": [
                {"workspace_id": resolved_workspace_id},
                {"id": resolved_workspace_id},
            ]
        },
        {"$set": update_fields},
    )

    updated = await _find_workspace_by_id(db, resolved_workspace_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Workspace not found after update")

    canonical_workspace_id = _workspace_id_from_doc(updated) or resolved_workspace_id
    return workspace_to_subscription_payload(canonical_workspace_id, updated)


@router.get("/{workspace_id}/features")
async def get_feature_access(workspace_id: str, request: Request):
    tenant = require_tenant_member(request)
    db = get_db_from_request(request)

    resolved_workspace_id = enforce_workspace_match(tenant, workspace_id)
    workspace = await _find_workspace_by_id(db, resolved_workspace_id)

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    state = _resolved_plan_state(workspace)
    canonical_workspace_id = _workspace_id_from_doc(workspace) or resolved_workspace_id

    return {
        "workspace_id": canonical_workspace_id,
        "plan": state["plan"],
        "features": build_features_map(
            state["plan"],
            state["entitlements"],
        ),
        "entitlements": state["entitlements"],
        "limits": state["limits"],
    }
