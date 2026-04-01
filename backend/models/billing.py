"""Billing domain and API models."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator


# ============================================================================
# LITERAL TYPES
# ============================================================================

BillingCycle = Literal["monthly", "annual"]
TransactionType = Literal["subscription", "credit_topup"]
TransactionStatus = Literal[
    "pending",
    "paid",
    "expired",
    "failed",
    "cancelled",
    "completed",
]
SubscriptionStatus = Literal[
    "inactive",
    "trialing",
    "active",
    "past_due",
    "cancelled",
    "unpaid",
]
CurrencyCode = Literal["usd"]


# ============================================================================
# BASE MODEL
# ============================================================================

class BillingBaseModel(BaseModel):
    """Base model with shared config."""

    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
        str_strip_whitespace=True,
    )


# ============================================================================
# API REQUEST MODELS
# ============================================================================

class SubscriptionCheckoutRequest(BillingBaseModel):
    """Request payload for starting a subscription checkout."""

    plan_id: str = Field(..., min_length=1, description="Internal plan identifier")
    billing_cycle: BillingCycle = Field(..., description="Selected billing interval")
    origin_url: HttpUrl = Field(..., description="Frontend origin for redirect URLs")

    @field_validator("plan_id")
    @classmethod
    def validate_plan_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("plan_id cannot be empty")
        return cleaned


class CreditCheckoutRequest(BillingBaseModel):
    """Request payload for starting a credit pack checkout."""

    pack_id: str = Field(..., min_length=1, description="Internal credit pack identifier")
    origin_url: HttpUrl = Field(..., description="Frontend origin for redirect URLs")

    @field_validator("pack_id")
    @classmethod
    def validate_pack_id(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("pack_id cannot be empty")
        return cleaned


# ============================================================================
# CATALOG MODELS
# ============================================================================

class PlanCatalogItem(BillingBaseModel):
    """Public plan catalog item."""

    id: str
    name: str
    description: str = ""
    monthly_price_cents: int = Field(..., ge=0)
    annual_price_cents: int = Field(..., ge=0)
    monthly_credits: int = Field(..., ge=0)
    annual_credits: int = Field(..., ge=0)
    currency: CurrencyCode = "usd"
    active: bool = True

    default: bool = False
    is_default: bool = False
    recommended: bool = False
    is_recommended: bool = False
    display_order: int = 0

    stripe_price_id_monthly: str = ""
    stripe_price_id_annual: str = ""

    features: list[str] = Field(default_factory=list)

    @property
    def monthly_price_decimal(self) -> Decimal:
        return Decimal(self.monthly_price_cents) / Decimal("100")

    @property
    def annual_price_decimal(self) -> Decimal:
        return Decimal(self.annual_price_cents) / Decimal("100")


class CreditPackCatalogItem(BillingBaseModel):
    """Public credit pack catalog item."""

    id: str
    name: str
    description: str = ""
    credits: int = Field(..., ge=1)
    bonus_credits: int = Field(default=0, ge=0)
    total_credits: int = Field(..., ge=1)
    price_cents: int = Field(..., ge=0)
    currency: CurrencyCode = "usd"
    active: bool = True
    recommended: bool = False
    is_recommended: bool = False
    display_order: int = 0
    stripe_price_id: str = ""

    @property
    def price_decimal(self) -> Decimal:
        return Decimal(self.price_cents) / Decimal("100")

    @model_validator(mode="after")
    def validate_credit_totals(self) -> "CreditPackCatalogItem":
        minimum_total = self.credits + self.bonus_credits
        if self.total_credits < minimum_total:
            raise ValueError("total_credits must be at least credits + bonus_credits")
        return self


# ============================================================================
# CHECKOUT RESPONSE MODELS
# ============================================================================

class CheckoutSessionResult(BillingBaseModel):
    """Response returned after creating a checkout session."""

    success: bool = True
    checkout_url: str
    session_id: str


class CheckoutStatusResult(BillingBaseModel):
    """Read-only checkout status response."""

    status: str
    payment_status: str
    session_id: str


# ============================================================================
# TRANSACTION / WORKSPACE STATE MODELS
# ============================================================================

class BillingTransactionRecord(BillingBaseModel):
    """Stored billing transaction record."""

    type: TransactionType
    status: TransactionStatus

    workspace_id: str
    user_id: str

    plan_id: str | None = None
    billing_cycle: BillingCycle | None = None
    pack_id: str | None = None

    session_id: str

    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    stripe_payment_intent_id: str | None = None
    stripe_invoice_id: str | None = None

    amount_cents: int = Field(default=0, ge=0)
    currency: CurrencyCode = "usd"
    credits_delta: int = 0

    metadata: dict[str, Any] = Field(default_factory=dict)

    finalized_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    @field_validator("workspace_id", "user_id", "session_id")
    @classmethod
    def validate_required_ids(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Required identifier cannot be empty")
        return cleaned

    @model_validator(mode="after")
    def validate_transaction_shape(self) -> "BillingTransactionRecord":
        if self.type == "subscription":
            if not self.plan_id:
                raise ValueError("Subscription transaction must include plan_id")
            if not self.billing_cycle:
                raise ValueError("Subscription transaction must include billing_cycle")

        if self.type == "credit_topup":
            if not self.pack_id:
                raise ValueError("Credit topup transaction must include pack_id")

        return self


class WorkspaceBillingState(BillingBaseModel):
    """Billing state persisted on a workspace."""

    plan_id: str | None = None
    billing_cycle: BillingCycle | None = None
    subscription_status: SubscriptionStatus = "inactive"
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    updated_at: datetime | None = None


class WorkspaceUsageState(BillingBaseModel):
    """Usage and credits state persisted on a workspace."""

    credit_balance: int = Field(default=0, ge=0)
    monthly_credits_included: int = Field(default=0, ge=0)


class BillingSummaryResponse(BillingBaseModel):
    """Billing summary returned to the tenant-facing billing UI."""

    workspace_id: str
    plan_id: str | None = None
    billing_cycle: BillingCycle | None = None
    subscription_status: SubscriptionStatus = "inactive"
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    credit_balance: int = Field(default=0, ge=0)
    monthly_credits_included: int = Field(default=0, ge=0)
    recent_transactions: list[BillingTransactionRecord] = Field(default_factory=list)


# ============================================================================
# WEBHOOK / INTERNAL SERVICE MODELS
# ============================================================================

class WebhookProcessResult(BillingBaseModel):
    """Internal response shape after webhook processing."""

    event_type: str
    session_id: str | None = None
    duplicate: bool = False


class CreatePendingSubscriptionTransactionInput(BillingBaseModel):
    """Internal input model for creating a pending subscription transaction."""

    workspace_id: str
    user_id: str
    plan_id: str
    billing_cycle: BillingCycle
    session_id: str
    customer_id: str | None = None
    amount_cents: int = Field(..., ge=0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class CreatePendingCreditTransactionInput(BillingBaseModel):
    """Internal input model for creating a pending credit transaction."""

    workspace_id: str
    user_id: str
    pack_id: str
    session_id: str
    customer_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class MarkTransactionPaidInput(BillingBaseModel):
    """Internal input model for marking a transaction as paid."""

    session_id: str
    payment_intent_id: str | None = None
    invoice_id: str | None = None
    subscription_id: str | None = None


class ApplyWorkspaceSubscriptionInput(BillingBaseModel):
    """Internal input model for applying a subscription to a workspace."""

    workspace_id: str
    plan_id: str
    billing_cycle: BillingCycle
    stripe_customer_id: str | None = None
    stripe_subscription_id: str | None = None
    period_start: datetime
    period_end: datetime


class ApplyCreditTopupInput(BillingBaseModel):
    """Internal input model for applying purchased credits to a workspace."""

    workspace_id: str
    credits: int = Field(..., ge=1)
