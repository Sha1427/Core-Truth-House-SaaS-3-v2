// frontend/src/pages/Billing.js

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, CreditCard, Loader2, RefreshCw, XCircle } from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePlan } from "../context/PlanContext";
import { useUser, useClerk } from "../hooks/useAuth";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const PAGE_STYLE = {
  background: "var(--cth-command-blush)",
  minHeight: "100vh",
};

const CARD_STYLE = {
  background: "var(--cth-command-panel)",
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
};

const SECTION_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--cth-command-muted)",
  margin: 0,
};

const SECTION_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 22,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.25,
};

const SUMMARY_VALUE_STYLE = {
  fontFamily: SERIF,
  fontSize: 18,
  fontWeight: 600,
  color: "var(--cth-command-ink)",
  margin: 0,
  letterSpacing: "-0.005em",
  lineHeight: 1.3,
};

const BODY_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.6,
  color: "var(--cth-command-ink)",
  margin: 0,
};

const MUTED_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  lineHeight: 1.55,
  color: "var(--cth-command-muted)",
  margin: 0,
};

const PRICE_STYLE = {
  fontFamily: SERIF,
  fontSize: 36,
  fontWeight: 700,
  color: "var(--cth-command-ink)",
  lineHeight: 1.1,
  margin: 0,
  letterSpacing: "-0.01em",
};

const PRICE_UNIT_STYLE = {
  fontFamily: SANS,
  fontSize: 14,
  fontWeight: 400,
  color: "var(--cth-command-muted)",
  marginLeft: 6,
};

const PRIMARY_CTA_STYLE = {
  background: "var(--cth-command-purple)",
  color: "var(--cth-command-gold)",
  border: "none",
  borderRadius: 4,
  padding: "12px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "0.04em",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
};

const TOGGLE_BUTTON_BASE = {
  border: "1px solid var(--cth-command-border)",
  borderRadius: 4,
  padding: "8px 18px",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: "0.02em",
};

function getToggleStyle(active) {
  return active
    ? {
        ...TOGGLE_BUTTON_BASE,
        background: "var(--cth-command-crimson)",
        borderColor: "var(--cth-command-crimson)",
        color: "var(--cth-command-panel)",
      }
    : {
        ...TOGGLE_BUTTON_BASE,
        background: "transparent",
        color: "var(--cth-command-ink)",
      };
}

function StatusBanner({ status }) {
  if (!status) return null;

  const isSuccess = status.type === "success";
  const isError = status.type === "error";

  const tintColor = isSuccess
    ? "var(--cth-status-success-bright)"
    : isError
    ? "var(--cth-danger)"
    : "var(--cth-command-crimson)";

  return (
    <div
      className="mb-5 flex items-center gap-3"
      style={{
        borderRadius: 4,
        padding: 14,
        background: `color-mix(in srgb, ${tintColor} 8%, var(--cth-command-panel))`,
        border: `1px solid color-mix(in srgb, ${tintColor} 35%, var(--cth-command-border))`,
      }}
    >
      {isSuccess ? (
        <CheckCircle size={18} style={{ color: tintColor }} />
      ) : isError ? (
        <XCircle size={18} style={{ color: tintColor }} />
      ) : (
        <RefreshCw size={18} style={{ color: tintColor }} />
      )}

      <span
        style={{
          fontFamily: SANS,
          fontSize: 13,
          color: tintColor,
        }}
      >
        {status.text}
      </span>
    </div>
  );
}

function PlanCard({ plan, billingCycle, activePlanId, busy, onSelect }) {
  const isActive = String(activePlanId || "").toLowerCase() === String(plan.id || "").toLowerCase();
  const price =
    billingCycle === "annual" ? plan.annual_price_cents : plan.monthly_price_cents;

  const formattedPrice =
    typeof price === "number" ? `$${(price / 100).toFixed(0)}` : "Custom";

  const credits =
    billingCycle === "annual" ? plan.annual_credits : plan.monthly_credits;

  return (
    <div
      style={{
        ...CARD_STYLE,
        padding: 20,
        borderColor: isActive ? "var(--cth-command-crimson)" : "var(--cth-command-border)",
      }}
    >
      <div className="mb-4">
        <p style={SECTION_LABEL_STYLE}>{plan.name}</p>
        <p style={{ ...MUTED_STYLE, marginTop: 8 }}>
          {plan.description || "Workspace subscription plan"}
        </p>
      </div>

      <div className="mb-4">
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ ...PRICE_STYLE, fontSize: 30 }}>{formattedPrice}</span>
          <span style={PRICE_UNIT_STYLE}>
            / {billingCycle === "annual" ? "year" : "month"}
          </span>
        </div>
        <p style={{ ...MUTED_STYLE, marginTop: 6 }}>
          {typeof credits === "number" ? `${credits} credits included` : "Credits included"}
        </p>
      </div>

      {isActive ? (
        <div
          style={{
            ...PRIMARY_CTA_STYLE,
            background: "transparent",
            color: "var(--cth-command-crimson)",
            border: "1px solid var(--cth-command-crimson)",
            cursor: "default",
          }}
        >
          Current plan
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => onSelect(plan.id)}
          style={{
            ...PRIMARY_CTA_STYLE,
            opacity: busy ? 0.65 : 1,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Starting checkout..." : "Choose plan"}
        </button>
      )}
    </div>
  );
}

function CreditPackCard({ pack, busy, onSelect }) {
  const price =
    typeof pack.price_cents === "number" ? `$${(pack.price_cents / 100).toFixed(0)}` : "N/A";

  return (
    <div style={{ ...CARD_STYLE, padding: 20 }}>
      <p style={SECTION_LABEL_STYLE}>{pack.name}</p>
      <div style={{ marginTop: 10, display: "flex", alignItems: "baseline" }}>
        <span style={{ ...PRICE_STYLE, fontSize: 30 }}>{price}</span>
      </div>
      <p style={{ ...MUTED_STYLE, marginTop: 6, marginBottom: 16 }}>
        {pack.credits} credits
      </p>

      <button
        type="button"
        disabled={busy}
        onClick={() => onSelect(pack.id)}
        style={{
          ...PRIMARY_CTA_STYLE,
          opacity: busy ? 0.65 : 1,
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Starting checkout..." : "Buy credits"}
      </button>
    </div>
  );
}

function CheckoutWall({
  loading,
  status,
  plans,
  billingCycle,
  setBillingCycle,
  activePlanId,
  checkoutBusy,
  onSelectPlan,
  onSignOut,
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--cth-command-purple)",
        padding: "64px 24px 48px",
        fontFamily: SANS,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          background: "var(--cth-command-panel)",
          borderRadius: 4,
          padding: 48,
          border: "1px solid var(--cth-command-border)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <img src="/cth-logo.png" alt="Core Truth House" style={{ height: 48 }} />
        </div>

        <h1
          style={{
            fontFamily: SERIF,
            fontSize: 36,
            lineHeight: 1.15,
            color: "var(--cth-command-ink)",
            margin: "0 0 12px",
            textAlign: "center",
            letterSpacing: "-0.01em",
          }}
        >
          Choose Your Plan
        </h1>

        <p
          style={{
            fontFamily: SANS,
            fontSize: 15,
            color: "var(--cth-command-muted)",
            margin: "0 0 32px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Your brand diagnostic is complete. Select a plan to access your results.
        </p>

        <StatusBanner status={status} />

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            style={getToggleStyle(billingCycle === "monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            style={getToggleStyle(billingCycle === "annual")}
          >
            Annual
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: "var(--cth-command-crimson)" }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 20,
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
          >
            {plans.map((plan) => {
              const planId = String(plan.id || "").toLowerCase();
              const isFeatured = planId === "structure";
              const priceCents =
                billingCycle === "annual"
                  ? plan.annual_price_cents
                  : plan.monthly_price_cents;
              const formattedPrice =
                typeof priceCents === "number"
                  ? `$${(priceCents / 100).toFixed(0)}`
                  : "Custom";
              const cycleLabel = billingCycle === "annual" ? "/yr" : "/mo";
              const busy = checkoutBusy === plan.id;
              const isCurrent =
                String(activePlanId || "").toLowerCase() === planId && planId !== "";

              return (
                <div key={plan.id} style={{ position: "relative" }}>
                  {isFeatured ? (
                    <div
                      style={{
                        position: "absolute",
                        top: -12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--cth-command-gold)",
                        color: "var(--cth-command-purple)",
                        fontFamily: SANS,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "4px 12px",
                        borderRadius: 999,
                        zIndex: 1,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Recommended
                    </div>
                  ) : null}
                  <div
                    style={{
                      background: "var(--cth-command-panel)",
                      border: isFeatured
                        ? "2px solid var(--cth-command-gold)"
                        : "1px solid var(--cth-command-border)",
                      borderRadius: 4,
                      padding: 24,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        ...SECTION_LABEL_STYLE,
                        marginBottom: 8,
                      }}
                    >
                      {plan.name}
                    </div>
                    <div
                      style={{
                        fontFamily: SANS,
                        fontSize: 13,
                        color: "var(--cth-command-muted)",
                        lineHeight: 1.5,
                        marginBottom: 16,
                        minHeight: 40,
                      }}
                    >
                      {plan.description || "Workspace subscription plan"}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ ...PRICE_STYLE, fontSize: 32 }}>{formattedPrice}</span>
                      <span style={PRICE_UNIT_STYLE}>{cycleLabel}</span>
                    </div>
                    <div style={{ flex: 1 }} />
                    {isCurrent ? (
                      <div
                        style={{
                          ...PRIMARY_CTA_STYLE,
                          marginTop: 20,
                          background: "transparent",
                          color: "var(--cth-command-crimson)",
                          border: "1px solid var(--cth-command-crimson)",
                          cursor: "default",
                        }}
                      >
                        Current plan
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onSelectPlan(plan.id)}
                        style={{
                          ...PRIMARY_CTA_STYLE,
                          marginTop: 20,
                          opacity: busy ? 0.65 : 1,
                          cursor: busy ? "not-allowed" : "pointer",
                        }}
                      >
                        {busy ? "Starting checkout..." : "Choose Plan"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSignOut}
        style={{
          marginTop: 28,
          background: "transparent",
          border: "none",
          color: "color-mix(in srgb, var(--cth-command-ivory) 60%, transparent)",
          fontFamily: SANS,
          fontSize: 13,
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        Sign out
      </button>
    </main>
  );
}

export default function Billing() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { activeWorkspaceId } = useWorkspace();
  const { hasActivePlan, refreshPlan } = usePlan();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [billingCycle, setBillingCycle] = useState("monthly");
  const [plans, setPlans] = useState([]);
  const [creditPacks, setCreditPacks] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(null);
  const [creditBusy, setCreditBusy] = useState(null);
  const [status, setStatus] = useState(null);

  const sessionId = searchParams.get("session_id");
  const success = searchParams.get("success");

  const activePlanId = useMemo(() => {
    return summary?.subscription?.plan_id || summary?.plan_id || null;
  }, [summary]);

  const loadBillingData = useCallback(async () => {
    setLoading(true);

    try {
      const [plansRes, packsRes, summaryRes] = await Promise.all([
        apiClient.get(API_PATHS.billing.plans),
        apiClient.get(API_PATHS.billing.creditPacks),
        apiClient.get(API_PATHS.billing.summary),
      ]);

      setPlans(plansRes?.plans || plansRes?.items || []);
      setCreditPacks(packsRes?.credit_packs || packsRes?.items || []);
      setSummary(summaryRes || null);
    } catch (error) {
      console.error("Failed to load billing data", error);
      setStatus({
        type: "error",
        text: error?.message || "Failed to load billing data.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const pollCheckoutStatus = useCallback(
    async (id, attempt = 0) => {
      if (!id) return;
      if (attempt >= 10) {
        setStatus({
          type: "info",
          text: "Checkout completed, but status verification timed out. Refreshing billing data.",
        });
        await loadBillingData();
        setSearchParams({});
        return;
      }

      try {
        const res = await apiClient.get(API_PATHS.billing.checkoutStatus(id), {
          workspace: false,
        });

        const paid =
          res?.payment_status === "paid" ||
          res?.status === "paid" ||
          res?.transaction_status === "paid";

        const expired =
          res?.status === "expired" || res?.transaction_status === "expired";

        if (paid) {
          setStatus({
            type: "success",
            text: "Payment successful. Billing has been updated.",
          });
          await loadBillingData();
          try {
            await refreshPlan();
          } catch (err) {
            console.warn("Failed to refresh plan after payment", err);
          }
          setSearchParams({});
          navigate("/command-center", { replace: true });
          return;
        }

        if (expired) {
          setStatus({
            type: "error",
            text: "Checkout session expired. Please try again.",
          });
          setSearchParams({});
          return;
        }

        window.setTimeout(() => {
          pollCheckoutStatus(id, attempt + 1);
        }, 2000);
      } catch (error) {
        window.setTimeout(() => {
          pollCheckoutStatus(id, attempt + 1);
        }, 2000);
      }
    },
    [loadBillingData, setSearchParams, refreshPlan, navigate]
  );

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  useEffect(() => {
    if (sessionId && success === "true") {
      pollCheckoutStatus(sessionId);
    }
  }, [sessionId, success, pollCheckoutStatus]);

  const startSubscriptionCheckout = async (planId) => {
    setCheckoutBusy(planId);
    setStatus(null);

    try {
      const res = await apiClient.post(API_PATHS.billing.checkoutSubscription, {
        plan_id: planId,
        billing_cycle: billingCycle,
        origin_url: window.location.origin,
      });

      if (res?.checkout_url) {
        window.location.assign(res.checkout_url);
        return;
      }

      throw new Error("Checkout URL was not returned by the server.");
    } catch (error) {
      console.error("Failed to start subscription checkout", error);
      setStatus({
        type: "error",
        text: error?.message || "Failed to start subscription checkout.",
      });
    } finally {
      setCheckoutBusy(null);
    }
  };

  const startCreditCheckout = async (packId) => {
    setCreditBusy(packId);
    setStatus(null);

    try {
      const res = await apiClient.post(API_PATHS.billing.checkoutCredits, {
        pack_id: packId,
        origin_url: window.location.origin,
      });

      if (res?.checkout_url) {
        window.location.assign(res.checkout_url);
        return;
      }

      throw new Error("Checkout URL was not returned by the server.");
    } catch (error) {
      console.error("Failed to start credit checkout", error);
      setStatus({
        type: "error",
        text: error?.message || "Failed to start credit checkout.",
      });
    } finally {
      setCreditBusy(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn("Sign out failed", err);
    }
    navigate("/", { replace: true });
  };

  if (!hasActivePlan) {
    return (
      <CheckoutWall
        loading={loading}
        status={status}
        plans={plans}
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
        activePlanId={activePlanId}
        checkoutBusy={checkoutBusy}
        onSelectPlan={startSubscriptionCheckout}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <DashboardLayout>
      <TopBar
        title="Billing"
        subtitle="Manage your subscription, credits, and checkout status."
      />

      <div
        className="flex-1 overflow-auto px-4 py-7 md:px-8"
        style={PAGE_STYLE}
        data-testid="billing-page"
      >
        <div className="mx-auto max-w-6xl">
          <StatusBanner status={status} />

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <Loader2
                size={24}
                className="animate-spin"
                style={{ color: "var(--cth-command-crimson)" }}
              />
            </div>
          ) : (
            <>
              <div className="mb-6" style={{ ...CARD_STYLE, padding: 24 }}>
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard size={18} style={{ color: "var(--cth-command-crimson)" }} />
                  <h2 style={SECTION_HEADING_STYLE}>Current subscription</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p style={SECTION_LABEL_STYLE}>Plan</p>
                    <p style={{ ...SUMMARY_VALUE_STYLE, marginTop: 8 }}>
                      {summary?.subscription?.plan_name || summary?.plan_name || "No active plan"}
                    </p>
                  </div>

                  <div>
                    <p style={SECTION_LABEL_STYLE}>Status</p>
                    <p style={{ ...SUMMARY_VALUE_STYLE, marginTop: 8 }}>
                      {summary?.subscription?.status || summary?.subscription_status || "inactive"}
                    </p>
                  </div>

                  <div>
                    <p style={SECTION_LABEL_STYLE}>Credits</p>
                    <p style={{ ...SUMMARY_VALUE_STYLE, marginTop: 8 }}>
                      {summary?.credits?.available ?? summary?.available_credits ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  style={getToggleStyle(billingCycle === "monthly")}
                >
                  Monthly
                </button>

                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  style={getToggleStyle(billingCycle === "annual")}
                >
                  Annual
                </button>
              </div>

              <div className="mb-8 grid gap-4 lg:grid-cols-4">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    billingCycle={billingCycle}
                    activePlanId={activePlanId}
                    busy={checkoutBusy === plan.id}
                    onSelect={startSubscriptionCheckout}
                  />
                ))}
              </div>

              <div className="mb-4">
                <h2 className="mb-4" style={SECTION_HEADING_STYLE}>
                  Credit packs
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  {creditPacks.map((pack) => (
                    <CreditPackCard
                      key={pack.id}
                      pack={pack}
                      busy={creditBusy === pack.id}
                      onSelect={startCreditCheckout}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
