from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Iterable

from fastapi import HTTPException, Request, status

from backend.routes.subscription import (
    NEVER_GATED_FEATURES,
    build_features_map,
    normalize_plan,
)

# Optional shared tenant helpers.
# These imports are kept defensive because some codebases move them during refactors.
try:
    from middleware.tenant_dependencies import get_db_from_request
except Exception:  # pragma: no cover
    get_db_from_request = None  # type: ignore[assignment]


# ============================================================================
# CONFIG
# ============================================================================

FEATURE_HEADER = "X-CTH-Required-Feature"
WORKSPACE_HEADER_CANDIDATES = (
    "X-Workspace-ID",
    "X-CTH-Workspace-ID",
)
PLATFORM_ADMIN_ROLES = {"super_admin", "platform_admin"}
WORKSPACE_ADMIN_ROLES = {"owner", "admin"}

DEFAULT_FEATURE_LIMITS: dict[str, dict[str, Any]] = {
    "content_studio": {"kind": "boolean"},
    "calendar": {"kind": "boolean"},
    "blog_cms": {"kind": "boolean"},
    "crm_suite": {"kind": "boolean"},
    "team_invite": {"kind": "boolean"},
    "agentic_workflows": {"kind": "boolean"},
}


# ============================================================================
# DATA STRUCTURES
# ============================================================================

@dataclass(slots=True)
class FeatureAccessContext:
    workspace_id: str
    workspace: dict[str, Any]
    plan: str
    entitlements: dict[str, Any]
    limits: dict[str, Any]
    features: dict[str, bool]

    @property
    def billing(self) -> dict[str, Any]:
        value = self.workspace.get("billing")
        return value if isinstance(value, dict) else {}


# ============================================================================
# LOW-LEVEL HELPERS
# ============================================================================

def _safe_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _safe_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _string(value: Any) -> str:
    return str(value or "").strip()


def _lower_string(value: Any) -> str:
    return _string(value).lower()


def _extract_request_state(request: Request, key: str, default: Any = None) -> Any:
    return getattr(request.state, key, default)


def _extract_workspace_id_from_headers(request: Request) -> str:
    for header_name in WORKSPACE_HEADER_CANDIDATES:
        value = request.headers.get(header_name)
        if value:
            return _string(value)
    return ""


def _extract_workspace_id_from_request(request: Request) -> str:
    return (
        _string(_extract_request_state(request, "workspace_id"))
        or _string(_extract_request_state(request, "tenant_id"))
        or _extract_workspace_id_from_headers(request)
        or _string(request.path_params.get("workspace_id"))
        or _string(request.query_params.get("workspace_id"))
    )


def _extract_actor_roles(request: Request) -> set[str]:
    roles: set[str] = set()

    for key in ("roles", "platform_roles", "workspace_roles"):
        raw = _extract_request_state(request, key, None)
        if isinstance(raw, (set, tuple, list)):
            roles.update(_lower_string(item) for item in raw if _string(item))
        elif isinstance(raw, str) and raw.strip():
            roles.add(raw.strip().lower())

    user = _extract_request_state(request, "user", None)
    if isinstance(user, dict):
        for key in ("roles", "platform_roles", "workspace_roles"):
            raw = user.get(key)
            if isinstance(raw, (set, tuple, list)):
                roles.update(_lower_string(item) for item in raw if _string(item))
            elif isinstance(raw, str) and raw.strip():
                roles.add(raw.strip().lower())

        role = user.get("role")
        if role:
            roles.add(_lower_string(role))

    tenant = _extract_request_state(request, "tenant", None)
    if isinstance(tenant, dict):
        for key in ("roles", "workspace_roles"):
            raw = tenant.get(key)
            if isinstance(raw, (set, tuple, list)):
                roles.update(_lower_string(item) for item in raw if _string(item))
            elif isinstance(raw, str) and raw.strip():
                roles.add(raw.strip().lower())

        role = tenant.get("role")
        if role:
            roles.add(_lower_string(role))

    return {role for role in roles if role}


def _is_platform_admin(request: Request) -> bool:
    roles = _extract_actor_roles(request)
    return bool(roles & PLATFORM_ADMIN_ROLES)


def _is_workspace_admin(request: Request) -> bool:
    roles = _extract_actor_roles(request)
    return bool(roles & WORKSPACE_ADMIN_ROLES) or _is_platform_admin(request)


def _extract_entitlements(workspace: dict[str, Any]) -> dict[str, Any]:
    base = _safe_dict(workspace.get("entitlements"))
    billing = _safe_dict(workspace.get("billing"))
    billing_entitlements = _safe_dict(billing.get("entitlements"))
    return {**billing_entitlements, **base}


def _extract_limits(workspace: dict[str, Any]) -> dict[str, Any]:
    base = _safe_dict(workspace.get("limits"))
    billing = _safe_dict(workspace.get("billing"))
    billing_limits = _safe_dict(billing.get("limits"))
    return {**billing_limits, **base}


def _extract_plan(workspace: dict[str, Any]) -> str:
    billing = _safe_dict(workspace.get("billing"))
    return normalize_plan(
        workspace.get("plan_id")
        or workspace.get("plan")
        or billing.get("plan_id")
    )


def _extract_workspace_id_from_doc(workspace: dict[str, Any]) -> str:
    return (
        _string(workspace.get("workspace_id"))
        or _string(workspace.get("id"))
        or _string(_safe_dict(workspace.get("billing")).get("workspace_id"))
    )


def _extract_subscription_status(workspace: dict[str, Any]) -> str:
    billing = _safe_dict(workspace.get("billing"))
    return _lower_string(
        billing.get("subscription_status")
        or workspace.get("subscription_status")
        or "inactive"
    )


def _subscription_is_active(workspace: dict[str, Any]) -> bool:
    status_value = _extract_subscription_status(workspace)
    return status_value in {"active", "trialing", "past_due"}


def _resolve_boolean_override(
    feature_name: str,
    entitlements: dict[str, Any],
) -> bool | None:
    if feature_name in entitlements and isinstance(entitlements[feature_name], bool):
        return entitlements[feature_name]

    feature_flags = _safe_dict(entitlements.get("feature_flags"))
    value = feature_flags.get(feature_name)
    if isinstance(value, bool):
        return value

    return None


async def _find_workspace_by_id(db: Any, workspace_id: str) -> dict[str, Any] | None:
    normalized = _string(workspace_id)
    if not normalized:
        return None

    return await db.workspaces.find_one(
        {
            "$or": [
                {"workspace_id": normalized},
                {"id": normalized},
            ]
        }
    )


async def _resolve_workspace_context(request: Request) -> FeatureAccessContext:
    if get_db_from_request is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tenant dependency loader is unavailable.",
        )

    workspace_id = _extract_workspace_id_from_request(request)
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workspace context is required.",
        )

    db = get_db_from_request(request)
    workspace = await _find_workspace_by_id(db, workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )

    canonical_workspace_id = _extract_workspace_id_from_doc(workspace) or workspace_id
    plan = _extract_plan(workspace)
    entitlements = _extract_entitlements(workspace)
    limits = _extract_limits(workspace)
    features = build_features_map(plan, entitlements)

    return FeatureAccessContext(
        workspace_id=canonical_workspace_id,
        workspace=workspace,
        plan=plan,
        entitlements=entitlements,
        limits=limits,
        features=features,
    )


def _get_usage_value(
    usage_summary: dict[str, Any] | None,
    feature_name: str,
) -> int | float:
    if not isinstance(usage_summary, dict):
        return 0

    direct_value = usage_summary.get(feature_name)
    if isinstance(direct_value, (int, float)):
        return direct_value

    features = _safe_dict(usage_summary.get("features"))
    nested_value = features.get(feature_name)
    if isinstance(nested_value, (int, float)):
        return nested_value

    return 0


# ============================================================================
# CORE ACCESS EVALUATION
# ============================================================================

async def evaluate_feature_access(
    request: Request,
    feature_name: str,
    *,
    usage_summary: dict[str, Any] | None = None,
    require_active_subscription: bool = False,
) -> FeatureAccessContext:
    normalized_feature = _lower_string(feature_name)
    if not normalized_feature:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Feature name is required for access evaluation.",
        )

    if normalized_feature in NEVER_GATED_FEATURES:
        return await _resolve_workspace_context(request)

    if _is_platform_admin(request):
        return await _resolve_workspace_context(request)

    context = await _resolve_workspace_context(request)

    override = _resolve_boolean_override(normalized_feature, context.entitlements)
    if override is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Feature '{normalized_feature}' has been disabled for this workspace.",
        )

    if require_active_subscription and not _subscription_is_active(context.workspace):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="An active subscription is required to access this feature.",
        )

    is_enabled = context.features.get(normalized_feature)
    if not is_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Your current plan '{context.plan}' does not include "
                f"feature '{normalized_feature}'."
            ),
        )

    limit_rule = DEFAULT_FEATURE_LIMITS.get(normalized_feature, {"kind": "boolean"})
    limit_kind = _lower_string(limit_rule.get("kind"))

    if limit_kind == "boolean":
        return context

    # Numeric feature limits can be driven from workspace.limits.
    feature_limit = context.limits.get(normalized_feature)
    if feature_limit is None:
        return context

    if feature_limit == "unlimited":
        return context

    if isinstance(feature_limit, bool):
        if not feature_limit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{normalized_feature}' is disabled by workspace limits.",
            )
        return context

    if isinstance(feature_limit, (int, float)):
        used = _get_usage_value(usage_summary, normalized_feature)
        if used >= feature_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Feature limit reached for '{normalized_feature}'. "
                    f"Used {used} of {feature_limit}."
                ),
            )
        return context

    return context


# ============================================================================
# PUBLIC DEPENDENCY FACTORIES
# ============================================================================

def require_feature(
    feature_name: str,
    *,
    require_active_subscription: bool = False,
) -> Callable[[Request], Any]:
    async def dependency(request: Request) -> FeatureAccessContext:
        return await evaluate_feature_access(
            request,
            feature_name,
            require_active_subscription=require_active_subscription,
        )

    return dependency


def require_any_feature(
    feature_names: Iterable[str],
    *,
    require_active_subscription: bool = False,
) -> Callable[[Request], Any]:
    normalized = [_lower_string(name) for name in feature_names if _string(name)]
    if not normalized:
        raise ValueError("At least one feature name is required.")

    async def dependency(request: Request) -> FeatureAccessContext:
        last_error: HTTPException | None = None

        for feature_name in normalized:
            try:
                return await evaluate_feature_access(
                    request,
                    feature_name,
                    require_active_subscription=require_active_subscription,
                )
            except HTTPException as exc:
                last_error = exc

        if last_error is not None:
            raise last_error

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No eligible feature access found.",
        )

    return dependency


# ============================================================================
# ROUTE GUARD MIDDLEWARE HOOK
# ============================================================================

async def enforce_feature_gate(request: Request) -> None:
    """
    Optional request-level hook.

    Usage pattern:
    - A route or middleware can set `request.state.required_feature`
    - Or a reverse proxy / client can pass `X-CTH-Required-Feature`
    - This function resolves workspace context and enforces the gate

    It does not return a response. It raises HTTPException on failure.
    """
    required_feature = _lower_string(
        _extract_request_state(request, "required_feature")
        or request.headers.get(FEATURE_HEADER)
    )
    if not required_feature:
        return

    context = await evaluate_feature_access(
        request,
        required_feature,
        require_active_subscription=False,
    )

    request.state.feature_access = {
        "workspace_id": context.workspace_id,
        "plan": context.plan,
        "features": context.features,
        "limits": context.limits,
        "entitlements": context.entitlements,
        "subscription_status": _extract_subscription_status(context.workspace),
    }


# ============================================================================
# OPTIONAL CONVENIENCE HELPERS
# ============================================================================

async def require_workspace_admin_for_feature(
    request: Request,
    feature_name: str,
    *,
    require_active_subscription: bool = False,
) -> FeatureAccessContext:
    if not _is_workspace_admin(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Workspace admin access is required.",
        )

    return await evaluate_feature_access(
        request,
        feature_name,
        require_active_subscription=require_active_subscription,
    )


def feature_enabled_for_workspace_doc(
    workspace: dict[str, Any],
    feature_name: str,
) -> bool:
    normalized_feature = _lower_string(feature_name)
    if not normalized_feature:
        return False

    if normalized_feature in NEVER_GATED_FEATURES:
        return True

    plan = _extract_plan(workspace)
    entitlements = _extract_entitlements(workspace)
    features = build_features_map(plan, entitlements)
    return bool(features.get(normalized_feature, False))
