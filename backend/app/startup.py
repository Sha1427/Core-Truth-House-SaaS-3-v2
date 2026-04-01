from __future__ import annotations

from backend.database import get_db, logger
from repositories.billing_repository import billing_repository


# ============================================================================
# STARTUP INDEX INITIALIZATION
# ============================================================================

async def ensure_core_indexes() -> None:
    """
    Ensures all critical indexes for billing, usage, and webhook safety.

    This MUST run on application startup.
    """

    db = get_db()

    logger.info("Ensuring Core Truth House indexes...")

    # ============================================================================
    # BILLING TRANSACTIONS
    # ============================================================================
    await billing_repository.ensure_indexes()

    # ============================================================================
    # WEBHOOK IDEMPOTENCY (CRITICAL)
    # ============================================================================
    await db.billing_webhook_events.create_index(
        "event_id",
        unique=True,
    )

    # ============================================================================
    # USAGE LEDGER (CRITICAL)
    # ============================================================================
    await db.usage_events.create_index(
        [("workspace_id", 1), ("created_at", -1)]
    )

    await db.usage_events.create_index(
        [("workspace_id", 1), ("feature_key", 1)]
    )

    # ============================================================================
    # WORKSPACES (BILLING + LOOKUPS)
    # ============================================================================
    await db.workspaces.create_index("workspace_id", unique=True)

    await db.workspaces.create_index(
        [("billing.plan_id", 1), ("billing.subscription_status", 1)]
    )

    # ============================================================================
    # WORKSPACE MEMBERS (AUTH + TENANCY)
    # ============================================================================
    await db.workspace_members.create_index(
        [("user_id", 1), ("workspace_id", 1)],
        unique=True,
    )

    logger.info("All Core Truth House indexes ensured successfully")
