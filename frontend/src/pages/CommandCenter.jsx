import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Check,
  ChevronRight,
  Image,
  Loader2,
  Megaphone,
  Package,
  PenTool,
  Search,
  Sparkles,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import DashboardMarquee from "../components/DashboardMarquee";
import { useWorkspace } from "../context/WorkspaceContext";
import { useUser } from "../hooks/useAuth";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const MILESTONE_LABELS = {
  audit_complete: "Brand Audit",
  brand_memory_complete: "Brand Memory",
  foundation_complete: "Brand Foundation",
  strategic_os_started: "Strategic OS",
  first_campaign_created: "First Campaign",
};

const MODULE_SHORTCUTS = [
  { label: "Brand Audit", Icon: Search, route: "/brand-audit", desc: "Run or review your diagnostic" },
  { label: "Brand Intelligence", Icon: Brain, route: "/brand-intelligence", desc: "Memory + foundation" },
  { label: "Strategic OS", Icon: PenTool, route: "/strategic-os", desc: "Build your operating system" },
  { label: "Campaign Builder", Icon: Megaphone, route: "/campaign-builder", desc: "Plan your next campaign" },
  { label: "Offer Builder", Icon: Package, route: "/offer-builder", desc: "Shape your offers" },
  { label: "Media Studio", Icon: Image, route: "/media-studio", desc: "Manage visual assets" },
  { label: "Identity Studio", Icon: Sparkles, route: "/identity-studio", desc: "Refine brand assets" },
];

function StatCard({ label, value, Icon, sub }) {
  return (
    <div className="cth-card rounded-[24px] p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(20,15,43,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--cth-app-accent)]/12 cth-text-accent">
          <Icon size={18} />
        </div>
        <div className="rounded-full border border-[var(--cth-app-border)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] cth-muted">
          Live
        </div>
      </div>

      <div className="text-[28px] font-extrabold leading-none tracking-tight cth-heading">{value}</div>
      <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] cth-muted">{label}</div>
      {sub ? <div className="mt-3 text-[12px] leading-6 cth-muted">{sub}</div> : null}
    </div>
  );
}

function JourneyProgress({ milestones }) {
  const steps = Object.keys(MILESTONE_LABELS);
  const completed = steps.filter((key) => Boolean(milestones?.[key])).length;
  const pct = Math.round((completed / Math.max(steps.length, 1)) * 100);

  return (
    <div className="cth-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="cth-kicker">Brand OS Journey</div>
          <div className="mt-2 text-lg font-bold cth-heading">{pct}% complete</div>
        </div>
        <div className="text-sm font-bold cth-text-accent">
          {completed}/{steps.length}
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full cth-card-muted">
        <div
          className="h-full rounded-full bg-[var(--cth-app-accent)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid gap-2">
        {steps.map((key) => {
          const done = Boolean(milestones?.[key]);

          return (
            <div key={key} className="flex items-center gap-3 text-sm">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  done ? "bg-[var(--cth-app-accent)] text-white" : "cth-card-muted cth-muted"
                }`}
              >
                {done ? <Check size={12} /> : null}
              </div>
              <span className={done ? "cth-heading" : "cth-muted"}>{MILESTONE_LABELS[key]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShortcutCard({ item, onClick }) {
  const { Icon, label, desc } = item;

  return (
    <button
      type="button"
      onClick={onClick}
      className="cth-card group w-full rounded-[24px] p-5 text-left transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(20,15,43,0.09)]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--cth-app-accent)]/12 cth-text-accent">
          <Icon size={18} />
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl cth-card-muted transition group-hover:translate-x-1">
          <ChevronRight size={16} className="cth-muted" />
        </div>
      </div>

      <div className="font-bold text-[15px] cth-heading">{label}</div>
      <div className="mt-2 text-[13px] leading-6 cth-muted">{desc}</div>
    </button>
  );
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [latestAudit, setLatestAudit] = useState(null);
  const [workspaceStats, setWorkspaceStats] = useState(null);
  const [error, setError] = useState("");

  const displayName = useMemo(() => {
    return user?.fullName || user?.firstName || user?.name || activeWorkspace?.name || "there";
  }, [activeWorkspace?.name, user?.fullName, user?.firstName, user?.name]);

  const loadCommandCenter = useCallback(async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      setError("No active workspace selected.");
      return;
    }

    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      apiClient.get(API_PATHS.onboarding.progress, {
        params: {
          user_id: user?.id,
          workspace_id: activeWorkspaceId,
        },
      }),
      apiClient.get(API_PATHS.audit.latest),
      apiClient.get(API_PATHS.workspace.stats(activeWorkspaceId)),
    ]);

    const [progressResult, auditResult, statsResult] = results;

    if (progressResult.status === "fulfilled") {
      setProgress(progressResult.value || {});
    } else {
      console.error("Failed to load onboarding progress", progressResult.reason);
    }

    if (auditResult.status === "fulfilled") {
      setLatestAudit(auditResult.value?.audit || null);
    } else {
      console.error("Failed to load latest audit", auditResult.reason);
    }

    if (statsResult.status === "fulfilled") {
      setWorkspaceStats(statsResult.value || null);
    } else {
      console.error("Failed to load workspace stats", statsResult.reason);
    }

    const failedAll = results.every((item) => item.status === "rejected");
    if (failedAll) {
      setError("Unable to load your command center right now.");
    }

    setLoading(false);
  }, [activeWorkspaceId, user?.id]);

  useEffect(() => {
    loadCommandCenter();
  }, [loadCommandCenter]);

  const usage = workspaceStats?.usage || {};
  const overallScore = latestAudit?.overall_score ?? latestAudit?.scores?.overall ?? "—";

  return (
    <DashboardLayout>
      <TopBar
        title="Command Center"
        subtitle={`Welcome back, ${displayName}. Here’s the current state of your workspace.`}
      />

      <div className="cth-page flex-1 overflow-auto px-4 py-5 md:px-7">
        <div className="mx-auto max-w-7xl space-y-5">
          <DashboardMarquee />

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <Loader2 className="animate-spin cth-text-accent" size={24} />
            </div>
          ) : (
            <>
              {error ? (
                <div className="cth-card flex items-center gap-2 p-4 text-sm cth-text-danger">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Brand Score"
                  value={overallScore}
                  Icon={TrendingUp}
                  sub={latestAudit?.brand_health_rating || latestAudit?.rating || "No audit yet"}
                />
                <StatCard label="Content Generated" value={usage.content_generated ?? 0} Icon={PenTool} />
                <StatCard label="Campaigns" value={usage.campaigns ?? 0} Icon={Megaphone} />
                <StatCard label="Assets" value={usage.assets ?? 0} Icon={Image} />
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
                <JourneyProgress milestones={progress} />

                <div className="cth-card p-5">
                  <div className="cth-kicker">Latest Audit Insight</div>

                  <h3 className="mt-3 text-xl font-bold cth-heading">
                    {latestAudit?.brand_health_rating || latestAudit?.rating || "No audit available yet"}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed cth-muted">
                    {latestAudit?.analysis
                      ? String(latestAudit.analysis).slice(0, 280) +
                        (String(latestAudit.analysis).length > 280 ? "..." : "")
                      : "Run your brand audit to generate a strategic snapshot and see your next best move."}
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/brand-audit")}
                    className="cth-button-primary mt-5 inline-flex items-center gap-2"
                  >
                    Open Brand Audit
                  </button>
                </div>
              </div>

              <div>
                <div className="cth-kicker mb-3">Workspace Shortcuts</div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {MODULE_SHORTCUTS.map((item) => (
                    <ShortcutCard key={item.route} item={item} onClick={() => navigate(item.route)} />
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
