// frontend/src/pages/Billing.js

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle, CreditCard, Loader2, RefreshCw, XCircle } from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { useUser } from "../hooks/useAuth";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

function StatusBanner({ status }) {
  if (!status) return null;

  const isSuccess = status.type === "success";
  const isError = status.type === "error";

  return (
    <div
      className="mb-5 flex items-center gap-3 rounded-xl p-4"
      style={{
        background: isSuccess
          ? "rgba(34,197,94,0.10)"
          : isError
          ? "rgba(239,68,68,0.10)"
          : "rgba(224,78,53,0.10)",
        border: isSuccess
          ? "1px solid rgba(34,197,94,0.30)"
          : isError
          ? "1px solid rgba(239,68,68,0.30)"
          : "1px solid rgba(224,78,53,0.30)",
      }}
    >
      {isSuccess ? (
        <CheckCircle size={18} className="text-green-500" />
      ) : isError ? (
        <XCircle size={18} className="text-red-500" />
      ) : (
        <RefreshCw size={18} className="cth-text-accent" />
      )}

      <span
        className="text-sm"
        style={{
          color: isSuccess ? "var(--cth-status-success-bright)" : isError ? "var(--cth-status-danger)" : "var(--cth-admin-accent)",
        }}
      >
        {status.text}
      </span>
    </div>
  );
}

function PlanCard({
  plan,
  billingCycle,
  activePlanId,
  busy,
  onSelect,
}) {
  const isActive = String(activePlanId || "").toLowerCase() === String(plan.id || "").toLowerCase();
  const price =
    billingCycle === "annual"
      ? plan.annual_price_cents
      : plan.monthly_price_cents;

  const formattedPrice =
    typeof price === "number" ? `$${(price / 100).toFixed(0)}` : "Custom";

  const credits =
    billingCycle === "annual"
      ? plan.annual_credits
      : plan.monthly_credits;

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--cth-admin-panel)",
        border: isActive
          ? "1px solid rgba(224,78,53,0.35)"
          : "1px solid var(--cth-admin-border)",
      }}
    >
      <div className="mb-4">
        <div className="mb-1 text-lg font-semibold cth-heading">{plan.name}</div>
        <p className="m-0 text-sm cth-muted">{plan.description || "Workspace subscription plan"}</p>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold cth-heading">
          {formattedPrice}
          <span className="ml-1 text-sm font-normal cth-muted">
            / {billingCycle === "annual" ? "year" : "month"}
          </span>
        </div>
        <div className="mt-1 text-sm cth-muted">
          {typeof credits === "number" ? `${credits} credits included` : "Credits included"}
        </div>
      </div>

      <button
        type="button"
        disabled={busy || isActive}
        onClick={() => onSelect(plan.id)}
        className="w-full rounded-lg px-4 py-2 text-sm font-medium transition"
        style={{
          background: isActive ? "var(--cth-admin-border)" : "var(--cth-admin-accent)",
          color: "var(--cth-on-dark)",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? "Starting checkout..." : isActive ? "Current plan" : "Choose plan"}
      </button>
    </div>
  );
}

function CreditPackCard({ pack, busy, onSelect }) {
  const price =
    typeof pack.price_cents === "number"
      ? `$${(pack.price_cents / 100).toFixed(0)}`
      : "N/A";

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--cth-admin-panel)",
        border: "1px solid var(--cth-admin-border)",
      }}
    >
      <div className="mb-2 text-base font-semibold cth-heading">{pack.name}</div>
      <div className="mb-1 text-2xl font-bold cth-heading">{price}</div>
      <div className="mb-4 text-sm cth-muted">
        {pack.credits} credits
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => onSelect(pack.id)}
        className="cth-button-primary w-full rounded-lg px-4 py-2 text-sm font-medium"
        style={{
          background: "var(--cth-admin-ruby)",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? "Starting checkout..." : "Buy credits"}
      </button>
    </div>
  );
}

export default function Billing() {
  const { user } = useUser();
  const { activeWorkspaceId } = useWorkspace();
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
          setSearchParams({});
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
    [loadBillingData, setSearchParams]
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
        workspace_id: activeWorkspaceId || undefined,
        success_url: `${window.location.origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/billing?cancelled=true`,
        customer_email: user?.primaryEmailAddress?.emailAddress || undefined,
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
        workspace_id: activeWorkspaceId || undefined,
        success_url: `${window.location.origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/billing?cancelled=true`,
        customer_email: user?.primaryEmailAddress?.emailAddress || undefined,
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

  return (
    <DashboardLayout>
      <TopBar
        title="Billing"
        subtitle="Manage your subscription, credits, and checkout status."
      />

      <div className="px-4 py-4 md:px-7 md:py-6">
        <div className="mx-auto max-w-6xl">
          <StatusBanner status={status} />

          {loading ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <Loader2 size={24} className="animate-spin text-[var(--cth-admin-accent)]" />
            </div>
          ) : (
            <>
              <div
                className="mb-6 rounded-xl p-5"
                style={{
                  background: "var(--cth-admin-panel)",
                  border: "1px solid var(--cth-admin-border)",
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard size={18} className="cth-text-accent" />
                  <h2 className="m-0 text-lg font-semibold cth-heading">Current subscription</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-wide cth-muted">Plan</div>
                    <div className="mt-1 cth-heading">
                      {summary?.subscription?.plan_name || summary?.plan_name || "No active plan"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wide cth-muted">Status</div>
                    <div className="mt-1 cth-heading">
                      {summary?.subscription?.status || summary?.subscription_status || "inactive"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wide cth-muted">Credits</div>
                    <div className="mt-1 cth-heading">
                      {summary?.credits?.available ?? summary?.available_credits ?? 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className="rounded-lg px-4 py-2 text-sm font-medium"
                  style={{
                    background: billingCycle === "monthly" ? "var(--cth-admin-accent)" : "var(--cth-admin-panel-alt)",
                    color: "var(--cth-on-dark)",
                  }}
                >
                  Monthly
                </button>

                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className="rounded-lg px-4 py-2 text-sm font-medium"
                  style={{
                    background: billingCycle === "annual" ? "var(--cth-admin-accent)" : "var(--cth-admin-panel-alt)",
                    color: "var(--cth-on-dark)",
                  }}
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
                <h2 className="mb-3 text-lg font-semibold cth-heading">Credit packs</h2>
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
