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
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import DashboardMarquee from "../components/DashboardMarquee";
import { useColors } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useUser } from "../hooks/useAuth";
import { navigateToRoute } from "../navigation/navigationHelpers";
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

function StatCard({ label, value, Icon, color, sub, colors }) {
  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.tuscany}15`,
        borderRadius: 12,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Icon size={18} style={{ color }} />
      </div>

      <p
        style={{
          fontSize: 24,
          fontWeight: 800,
          color,
          margin: "0 0 2px",
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1,
        }}
      >
        {value}
      </p>

      <p
        style={{
          fontSize: 11,
          color: colors.textMuted,
          margin: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
      </p>

      {sub ? (
        <p
          style={{
            fontSize: 10,
            color: `${colors.tuscany}66`,
            margin: "4px 0 0",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {sub}
        </p>
      ) : null}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: color,
          opacity: 0.2,
        }}
      />
    </div>
  );
}

function JourneyProgress({ milestones, colors }) {
  const steps = Object.keys(MILESTONE_LABELS);
  const completed = steps.filter((key) => Boolean(milestones?.[key])).length;
  const pct = Math.round((completed / Math.max(steps.length, 1)) * 100);

  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.tuscany}15`,
        borderRadius: 12,
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: colors.textMuted,
              margin: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Brand OS Journey
          </p>
          <p style={{ margin: "6px 0 0", color: colors.textPrimary, fontWeight: 700 }}>
            {pct}% complete
          </p>
        </div>

        <div
          style={{
            fontSize: 12,
            color: colors.cinnabar,
            fontWeight: 700,
          }}
        >
          {completed}/{steps.length}
        </div>
      </div>

      <div
        style={{
          width: "100%",
          height: 8,
          background: `${colors.tuscany}18`,
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: colors.cinnabar,
            borderRadius: 999,
          }}
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {steps.map((key) => {
          const done = Boolean(milestones?.[key]);

          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: done ? colors.textPrimary : colors.textMuted,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done ? colors.cinnabar : `${colors.tuscany}15`,
                  color: done ? "#fff" : colors.textMuted,
                  flexShrink: 0,
                }}
              >
                {done ? <Check size={12} /> : null}
              </div>

              <span style={{ fontSize: 13 }}>{MILESTONE_LABELS[key]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShortcutCard({ item, colors, onClick }) {
  const { Icon, label, desc } = item;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        background: colors.cardBg,
        border: `1px solid ${colors.tuscany}15`,
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Icon size={18} style={{ color: colors.cinnabar }} />
        <ChevronRight size={16} style={{ color: colors.textMuted }} />
      </div>

      <div style={{ color: colors.textPrimary, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ color: colors.textMuted, fontSize: 12 }}>{desc}</div>
    </button>
  );
}

export default function CommandCenter() {
  const colors = useColors();
  const navigate = useNavigate();
  const { user } = useUser();
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [latestAudit, setLatestAudit] = useState(null);
  const [workspaceStats, setWorkspaceStats] = useState(null);
  const [error, setError] = useState("");

  const displayName = useMemo(() => {
    return (
      user?.fullName ||
      user?.firstName ||
      user?.name ||
      activeWorkspace?.name ||
      "there"
    );
  }, [user, activeWorkspace]);

  const loadCommandCenter = useCallback(async () => {
    if (!activeWorkspaceId) {
      setLoading(false);
      setError("No active workspace selected.");
      return;
    }

    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      apiClient.get(API_PATHS.onboarding.progress),
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
  }, [activeWorkspaceId]);

  useEffect(() => {
    loadCommandCenter();
  }, [loadCommandCenter]);

  const usage = workspaceStats?.usage || {};
  const overallScore =
    latestAudit?.overall_score ??
    latestAudit?.scores?.overall ??
    "—";

  return (
    <DashboardLayout>
      <TopBar
        title="Command Center"
        subtitle={`Welcome back, ${displayName}. Here’s the current state of your workspace.`}
      />

      <div style={{ padding: "20px 24px 32px" }}>
        <DashboardMarquee />

        {loading ? (
          <div
            style={{
              minHeight: 260,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Loader2 className="animate-spin" size={24} style={{ color: colors.cinnabar }} />
          </div>
        ) : (
          <>
            {error ? (
              <div
                style={{
                  marginBottom: 18,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "rgba(224,78,53,0.10)",
                  border: "1px solid rgba(224,78,53,0.25)",
                  color: colors.cinnabar,
                }}
              >
                {error}
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
              <StatCard
                label="Brand Score"
                value={overallScore}
                Icon={TrendingUp}
                color={colors.cinnabar}
                sub={latestAudit?.brand_health_rating || latestAudit?.rating || "No audit yet"}
                colors={colors}
              />
              <StatCard
                label="Content Generated"
                value={usage.content_generated ?? 0}
                Icon={PenTool}
                color={colors.alabamaCrimson}
                colors={colors}
              />
              <StatCard
                label="Campaigns"
                value={usage.campaigns ?? 0}
                Icon={Megaphone}
                color={colors.darkPurple}
                colors={colors}
              />
              <StatCard
                label="Assets"
                value={usage.assets ?? 0}
                Icon={Image}
                color={colors.cinnabar}
                colors={colors}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginBottom: 18 }}>
              <JourneyProgress milestones={progress} colors={colors} />

              <div
                style={{
                  background: colors.cardBg,
                  border: `1px solid ${colors.tuscany}15`,
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: colors.textMuted,
                    margin: 0,
                  }}
                >
                  Latest Audit Insight
                </p>

                <h3 style={{ margin: "10px 0 8px", color: colors.textPrimary }}>
                  {latestAudit?.brand_health_rating || latestAudit?.rating || "No audit available yet"}
                </h3>

                <p style={{ color: colors.textMuted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  {latestAudit?.analysis
                    ? String(latestAudit.analysis).slice(0, 280) + (String(latestAudit.analysis).length > 280 ? "..." : "")
                    : "Run your brand audit to generate a strategic snapshot and see your next best move."}
                </p>

                <button
                  type="button"
                  onClick={() => navigateToRoute(navigate, "/brand-audit")}
                  style={{
                    marginTop: 16,
                    background: colors.cinnabar,
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Open Brand Audit
                </button>
              </div>
            </div>

            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: colors.textMuted,
                  margin: "0 0 12px",
                }}
              >
                Workspace Shortcuts
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
                {MODULE_SHORTCUTS.map((item) => (
                  <ShortcutCard
                    key={item.route}
                    item={item}
                    colors={colors}
                    onClick={() => navigateToRoute(navigate, item.route)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
