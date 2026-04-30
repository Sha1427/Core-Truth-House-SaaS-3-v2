import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  KeyRound,
  BookOpen,
  Bell,
  Workflow,
  FileText,
  LifeBuoy,
  Handshake,
  FileStack,
  BarChart3,
  Settings,
  Mail,
  Boxes,
  FlaskConical,
  CalendarClock,
  Gauge,
  RefreshCw,
  DollarSign,
  Building2,
  TrendingUp,
} from "lucide-react";
import { useUser } from "../../hooks/useAuth";

const API = import.meta.env.VITE_BACKEND_URL;

function AdminCard({ title, description, to, icon: Icon, tone = "rose" }) {
  const tones = {
    rose: "bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]",
    plum: "bg-[color-mix(in srgb, var(--cth-admin-ruby) 12%, var(--cth-admin-panel))] text-[var(--cth-admin-ruby)]",
    gold: "bg-[color-mix(in srgb, var(--cth-brand-secondary) 16%, var(--cth-admin-panel))] text-[var(--cth-warning-gold-deep)]",
    green: "bg-[var(--cth-surface-success-soft)] text-[var(--cth-status-success-deep)]",
    blue: "bg-[var(--cth-surface-info-soft)] text-[var(--cth-info-blue-deep)]",
  };

  return (
    <Link
      to={to}
      className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-5 shadow-sm transition hover:border-[var(--cth-admin-muted)] hover:shadow-md"
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone] || tones.rose}`}>
        <Icon size={20} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--cth-admin-ink)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--cth-admin-muted)]">{description}</p>
    </Link>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-[var(--cth-admin-ink)]">{title}</h2>
        <p className="mt-1 text-sm text-[var(--cth-admin-muted)]">{subtitle}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function StatCard({ icon: Icon, label, value, tone = "rose" }) {
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
    </div>
  );
}

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

function formatDollars(value) {
  const num = Number(value || 0);
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function AdminDashboardPage() {
  const { user } = useUser();
  const adminId = user?.id || "default";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);

  const load = useCallback(async () => {
    if (!API) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/overview?admin_id=${adminId}`);
      setOverview(res.data || null);
    } catch (err) {
      console.error("Failed to load admin dashboard overview:", err);
      setOverview(null);
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

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]">
              <LayoutDashboard size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Manage</p>
              <h1 className="mt-1 text-3xl font-semibold text-[var(--cth-admin-ink)]">Admin Dashboard</h1>
            </div>
          </div>

          <SmallButton onClick={handleRefresh} disabled={refreshing || loading} icon={RefreshCw}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </SmallButton>
        </div>

        <p className="mt-3 max-w-3xl text-sm text-[var(--cth-admin-muted)]">
          Live admin command center for Core Truth House. Review platform health, operational totals, revenue snapshots,
          and jump into the right admin systems without dropping back into the tenant shell.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Building2} label="Workspaces" value={workspaces.total || 0} tone="blue" />
        <StatCard icon={Users} label="Users" value={users.total || 0} tone="green" />
        <StatCard icon={DollarSign} label="Store Revenue" value={formatDollars(store.revenue_dollars || 0)} tone="gold" />
        <StatCard icon={TrendingUp} label="Billing Revenue" value={formatDollars(billing.revenue_dollars || 0)} tone="rose" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PanelCard
          title="Operational Snapshot"
          subtitle="Live overview from the admin backend"
        >
          {loading ? (
            <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
          ) : (
            <div className="grid gap-3 text-sm text-[var(--cth-admin-ink)]">
              <div>Total workspaces: {workspaces.total || 0}</div>
              <div>Active workspaces: {workspaces.active || 0}</div>
              <div>Total users: {users.total || 0}</div>
              <div>Active users: {users.active || 0}</div>
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="Revenue Snapshot"
          subtitle="Store and billing summary"
        >
          {loading ? (
            <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
          ) : (
            <div className="grid gap-3 text-sm text-[var(--cth-admin-ink)]">
              <div>Store revenue: {formatDollars(store.revenue_dollars || 0)}</div>
              <div>Completed orders: {store.completed_orders || 0}</div>
              <div>Billing revenue: {formatDollars(billing.revenue_dollars || 0)}</div>
              <div>Paid transactions: {billing.paid_transactions || 0}</div>
            </div>
          )}
        </PanelCard>
      </div>

      <Section
        title="Operations"
        subtitle="Core administrative control surfaces for people, support, settings, and system communication."
      >
        <AdminCard
          title="Accounts & Users"
          description="Manage workspaces, user roles, access review, and admin-level oversight."
          to="/admin/accounts-users"
          icon={Users}
          tone="rose"
        />
        <AdminCard
          title="Onboarding & Training"
          description="Oversee onboarding structure, tutorials, and future guided setup controls."
          to="/admin/onboarding"
          icon={BookOpen}
          tone="plum"
        />
        <AdminCard
          title="Help Desk"
          description="Centralize support intake, escalation flow, and support-system planning."
          to="/admin/help-desk"
          icon={LifeBuoy}
          tone="gold"
        />
        <AdminCard
          title="Notifications"
          description="Manage platform-wide alerts, announcements, and future notification routing."
          to="/admin/notifications"
          icon={Bell}
          tone="green"
        />
        <AdminCard
          title="Analytics"
          description="Review usage visibility, platform reporting, and future executive analytics."
          to="/admin/analytics"
          icon={BarChart3}
          tone="rose"
        />
        <AdminCard
          title="Settings"
          description="Control platform defaults, governance preferences, and future admin configuration."
          to="/admin/settings"
          icon={Settings}
          tone="plum"
        />
      </Section>

      <Section
        title="Market & Content"
        subtitle="Publishing, relationship, and customer-facing admin systems."
      >
        <AdminCard
          title="Blog Admin"
          description="Manage Core Truth House blog publishing controls and editorial workflow planning."
          to="/admin/blog"
          icon={FileText}
          tone="rose"
        />
        <AdminCard
          title="Knowledge Base"
          description="Organize help content, docs, and future searchable support knowledge."
          to="/admin/knowledge-base"
          icon={BookOpen}
          tone="plum"
        />
        <AdminCard
          title="CRM Admin"
          description="Oversee relationship systems, pipeline visibility, and future CRM governance."
          to="/admin/crm"
          icon={Handshake}
          tone="gold"
        />
        <AdminCard
          title="Pages"
          description="Manage page structure, content blocks, and future site governance controls."
          to="/admin/pages"
          icon={FileStack}
          tone="green"
        />
        <AdminCard
          title="Email Marketing"
          description="Oversee campaign infrastructure, sequences, and outbound communication planning."
          to="/admin/email-marketing"
          icon={Mail}
          tone="rose"
        />
      </Section>

      <Section
        title="Build & Systems"
        subtitle="Platform structure, automation, experimentation, and internal system governance."
      >
        <AdminCard
          title="API & AI Controls"
          description="Review provider configuration, platform API controls, and future model governance."
          to="/admin/api"
          icon={KeyRound}
          tone="rose"
        />
        <AdminCard
          title="Workflows"
          description="Oversee orchestration, automation systems, and future run governance."
          to="/admin/workflows"
          icon={Workflow}
          tone="plum"
        />
        <AdminCard
          title="Entities"
          description="Manage system object visibility, structural governance, and future schema controls."
          to="/admin/entities"
          icon={Boxes}
          tone="gold"
        />
        <AdminCard
          title="Playground"
          description="Use internal testing surfaces for experiments, prototypes, and admin-only validation."
          to="/admin/playground"
          icon={FlaskConical}
          tone="green"
        />
        <AdminCard
          title="Events"
          description="Review system activity, event visibility, and operational trace planning."
          to="/admin/events"
          icon={CalendarClock}
          tone="rose"
        />
        <AdminCard
          title="Metrics"
          description="Centralize KPI definitions, reporting concepts, and future metrics governance."
          to="/admin/metrics"
          icon={Gauge}
          tone="plum"
        />
      </Section>
    </div>
  );
}
