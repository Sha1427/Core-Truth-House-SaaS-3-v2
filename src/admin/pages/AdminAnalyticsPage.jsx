import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useUser } from "../../hooks/useAuth";
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  Activity,
  DollarSign,
  Users,
  Gauge,
  LineChart,
  PieChart,
  Target,
  AlertTriangle,
} from "lucide-react";

const API = import.meta.env.VITE_BACKEND_URL;

function PanelCard({ title, subtitle, children, actions = null }) {
  return (
    <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--cth-admin-border)] px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">{subtitle}</div> : null}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SmallButton({ onClick, children, disabled = false, icon: Icon = null }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-2 text-xs text-[var(--cth-admin-ruby)] transition hover:bg-[var(--cth-surface-elevated-soft)] disabled:opacity-50"
    >
      {Icon ? <Icon size={13} /> : null}
      {children}
    </button>
  );
}

function MetricCard({ icon: Icon, label, value, hint = "", tone = "rose" }) {
  const tones = {
    rose: "bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]",
    plum: "bg-[color-mix(in srgb, var(--cth-admin-ruby) 12%, var(--cth-admin-panel))] text-[var(--cth-admin-ruby)]",
    gold: "bg-[color-mix(in srgb, var(--cth-brand-secondary) 16%, var(--cth-admin-panel))] text-[var(--cth-warning-gold-deep)]",
    green: "bg-[var(--cth-surface-success-soft)] text-[var(--cth-status-success-deep)]",
    blue: "bg-[var(--cth-surface-info-soft)] text-[var(--cth-info-blue-deep)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone] || tones.rose}`}>
        <Icon size={20} />
      </div>
      <div className="mt-4 text-2xl font-semibold text-[var(--cth-admin-ink)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--cth-admin-muted)]">{label}</div>
      {hint ? <div className="mt-2 text-xs text-[var(--cth-copy-muted)]">{hint}</div> : null}
    </div>
  );
}

function InsightCard({ title, body, tone = "neutral" }) {
  const tones = {
    neutral: "border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)]",
    success: "border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.06)]",
    warning: "border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.06)]",
    danger: "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)]",
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.neutral}`}>
      <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">{title}</div>
      <div className="mt-2 text-sm text-[var(--cth-admin-muted)]">{body}</div>
    </div>
  );
}

function SimpleTable({ columns, rows, emptyLabel = "No records found" }) {
  if (!rows.length) {
    return <div className="text-sm text-[var(--cth-admin-muted)]">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="border-b border-[var(--cth-admin-border)] pb-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((col) => (
                <td key={col.key} className="border-b border-[var(--cth-surface-elevated-soft)] py-3 pr-4 align-top text-sm text-[var(--cth-admin-ink)]">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDollars(value) {
  const num = Number(value || 0);
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function safeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function flattenUsageAnalytics(usageAnalytics) {
  if (!usageAnalytics || typeof usageAnalytics !== "object") return [];

  const rows = [];
  Object.entries(usageAnalytics).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (typeof subValue !== "object") {
          rows.push({
            id: `${key}-${subKey}`,
            category: key,
            metric: subKey,
            value: String(subValue),
          });
        }
      });
    } else if (!Array.isArray(value)) {
      rows.push({
        id: key,
        category: "general",
        metric: key,
        value: String(value),
      });
    }
  });

  return rows;
}

export default function AdminAnalyticsPage() {
  const { user } = useUser();
  const adminId = user?.id || "default";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [usageAnalytics, setUsageAnalytics] = useState(null);

  const load = useCallback(async () => {
    if (!API) return;

    setLoading(true);
    try {
      const [overviewRes, usageRes] = await Promise.all([
        axios.get(`${API}/api/admin/overview?admin_id=${adminId}`),
        axios.get(`${API}/api/admin/analytics/usage?admin_id=${adminId}`),
      ]);

      setOverview(overviewRes.data || null);
      setUsageAnalytics(usageRes.data || null);
    } catch (err) {
      console.error("Failed to load admin analytics:", err);
      setOverview(null);
      setUsageAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const workspaces = overview?.workspaces || {};
  const users = overview?.users || {};
  const store = overview?.store || {};
  const billing = overview?.billing || {};

  const usageRows = useMemo(() => flattenUsageAnalytics(usageAnalytics), [usageAnalytics]);

  const mrr = safeNumber(billing.revenue_dollars || 0);
  const arr = mrr * 12;
  const customerCount = Math.max(safeNumber(workspaces.total || 0), 1);
  const arpu = mrr / customerCount;

  const activeUsers = safeNumber(users.active || 0);
  const totalUsers = safeNumber(users.total || 0);
  const engagementRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : "0.0";

  const completedOrders = safeNumber(store.completed_orders || 0);
  const churnPlaceholder = "Not wired yet";
  const nrrPlaceholder = "Not wired yet";
  const clvPlaceholder = "Not wired yet";
  const cacPlaceholder = "Not wired yet";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Manage</p>
              <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-admin-ink)]">Analytics</h2>
            </div>
          </div>

          <SmallButton onClick={handleRefresh} disabled={refreshing || loading} icon={RefreshCw}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </SmallButton>
        </div>

        <p className="mt-3 max-w-3xl text-sm text-[var(--cth-admin-muted)]">
          This page is for SaaS performance analysis. It should answer: how healthy is revenue, how engaged are users,
          where are adoption gaps, and what needs intervention next.
        </p>
      </section>

      <PanelCard
        title="Revenue & Business Health"
        subtitle="Core SaaS metrics for financial health and efficiency"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={DollarSign} label="MRR" value={formatDollars(mrr)} hint="Recurring revenue baseline" tone="rose" />
          <MetricCard icon={TrendingUp} label="ARR" value={formatDollars(arr)} hint="MRR x 12 projection" tone="plum" />
          <MetricCard icon={Gauge} label="ARPU" value={formatDollars(arpu)} hint="Revenue per workspace" tone="gold" />
          <MetricCard icon={Target} label="Completed Orders" value={completedOrders} hint="Commercial activity signal" tone="green" />
        </div>
      </PanelCard>

      <PanelCard
        title="Retention & Unit Economics"
        subtitle="These should drive retention and growth decisions"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Users} label="Customer Churn" value={churnPlaceholder} hint="Needs retention endpoint" tone="rose" />
          <MetricCard icon={LineChart} label="NRR" value={nrrPlaceholder} hint="Needs expansion/contraction logic" tone="plum" />
          <MetricCard icon={DollarSign} label="CLV / LTV" value={clvPlaceholder} hint="Needs historical revenue model" tone="gold" />
          <MetricCard icon={Target} label="CAC" value={cacPlaceholder} hint="Needs acquisition spend data" tone="green" />
        </div>
      </PanelCard>

      <PanelCard
        title="Product Usage & Engagement"
        subtitle="How sticky the product is and how actively it is being used"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Users} label="Total Users" value={totalUsers} hint="Registered user count" tone="blue" />
          <MetricCard icon={Activity} label="Active Users" value={activeUsers} hint="Current active base" tone="green" />
          <MetricCard icon={PieChart} label="Engagement Rate" value={`${engagementRate}%`} hint="Active / total users" tone="plum" />
          <MetricCard icon={BarChart3} label="Workspaces" value={safeNumber(workspaces.total || 0)} hint="Tenant/customer footprint" tone="rose" />
        </div>
      </PanelCard>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PanelCard
          title="Actionable Insights"
          subtitle="What the current data suggests"
        >
          {loading ? (
            <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
          ) : (
            <div className="grid gap-4">
              <InsightCard
                title="Revenue baseline exists, but retention is still blind"
                body="You can see MRR/ARR-style financial totals now, but churn, NRR, CAC, and LTV are not wired yet. That means revenue is visible, but retention economics are still hidden."
                tone="warning"
              />
              <InsightCard
                title="User engagement can be monitored immediately"
                body={`Current active user ratio is ${engagementRate}%. That gives you a directional signal for product stickiness even before feature-level analytics are connected.`}
                tone="success"
              />
              <InsightCard
                title="Next leverage point is product adoption visibility"
                body="The next strongest improvement is connecting feature adoption, MAU/WAU/DAU, and funnel drop-off metrics so this page becomes a true product analytics surface."
                tone="neutral"
              />
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="Risk Signals"
          subtitle="Areas that still need instrumentation"
        >
          <div className="grid gap-4">
            <InsightCard
              title="No churn instrumentation yet"
              body="Without churn and retention metrics, the business can grow revenue while still leaking value underneath."
              tone="danger"
            />
            <InsightCard
              title="No funnel data yet"
              body="There is no onboarding or workflow drop-off visibility yet, so conversion bottlenecks are still hidden."
              tone="warning"
            />
            <InsightCard
              title="No cohort segmentation yet"
              body="You cannot yet compare behavior by plan, customer type, or usage segment inside this page."
              tone="neutral"
            />
          </div>
        </PanelCard>
      </div>

      <PanelCard
        title="Usage Analytics Feed"
        subtitle="Current raw usage metrics from the backend"
      >
        {loading ? (
          <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
        ) : (
          <SimpleTable
            columns={[
              { key: "category", label: "Category" },
              { key: "metric", label: "Metric" },
              { key: "value", label: "Value" },
            ]}
            rows={usageRows}
            emptyLabel="No usage analytics found"
          />
        )}
      </PanelCard>

      <PanelCard
        title="Instrumentation Roadmap"
        subtitle="What still needs to be added to make this a true SaaS analytics surface"
      >
        <div className="grid gap-3 text-sm text-[var(--cth-admin-ink)]">
          <div>1. DAU / WAU / MAU tracking</div>
          <div>2. Feature adoption by module</div>
          <div>3. Onboarding funnel drop-off</div>
          <div>4. Churn, NRR, and retention cohorts</div>
          <div>5. CAC / LTV by acquisition source</div>
          <div>6. Segmentation by plan, industry, and workspace size</div>
          <div>7. Proactive alerts for high-value accounts with falling usage</div>
        </div>
      </PanelCard>
    </div>
  );
}
