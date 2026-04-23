import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  CheckCircle2,
  Circle,
  Crown,
  FileText,
  Package,
  Rocket,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { useUser } from "../hooks/useAuth";
import { DashboardLayout, TopBar } from "../components/Layout";
import { useColors } from "../context/ThemeContext";
import { OnboardingChecklist } from "../components/OnboardingChecklist";
import { usePlan } from "../context/PlanContext";
import { useWorkspace } from "../context/WorkspaceContext";
import OnboardingWorkflow, { OnboardingTriggerButton } from "./OnboardingWorkflow";
import { resolveAppPath } from "../navigation/navigationHelpers";
import apiClient from "../lib/apiClient";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const emptyDashboard = {
  brand_name: "Your Brand",
  metrics: {
    foundation_score: 0,
    offers_created: 0,
    systems_built: 0,
    content_generated: 0,
  },
  modules: {},
};

function getUserJourneyStage(metrics, osReadiness) {
  const foundationScore = Number(metrics?.foundation_score || 0);
  const osScore = Number(osReadiness?.score || 0);
  const contentCount = Number(metrics?.content_generated || 0);
  const offersCount = Number(metrics?.offers_created || 0);

  if (foundationScore < 50) {
    return {
      key: "foundation",
      label: "Foundation",
      headline: "You are still shaping the core truth of the brand.",
      nextAction: "Complete Brand Foundation",
    };
  }

  if (osScore < 80) {
    return {
      key: "structure",
      label: "Structure",
      headline: "Your brand direction exists, but the strategy needs to be locked in.",
      nextAction: "Complete Strategic OS",
    };
  }

  if (contentCount < 5) {
    return {
      key: "execution",
      label: "Execution",
      headline: "Your strategy is taking shape. Now it needs visible movement.",
      nextAction: "Generate your next content assets",
    };
  }

  if (offersCount < 1) {
    return {
      key: "offers",
      label: "Offer",
      headline: "You have momentum, but the monetization path is not fully built yet.",
      nextAction: "Create your first offer",
    };
  }

  return {
    key: "growth",
    label: "Growth",
    headline: "The business has traction. Now the focus is consistency and scale.",
    nextAction: "Run campaigns and optimize performance",
  };
}

function getContextAwareActions(metrics, osReadiness) {
  const foundationScore = Number(metrics?.foundation_score || 0);
  const osScore = Number(osReadiness?.score || 0);
  const contentCount = Number(metrics?.content_generated || 0);

  const actions = [];

  if (foundationScore < 100) {
    actions.push({
      label: foundationScore === 0 ? "Start Brand Foundation" : "Complete Brand Foundation",
      helper: foundationScore === 0 ? "Clarify the business identity first." : "Finish your core message and positioning.",
      path: resolveAppPath("/brand-foundation"),
      icon: Brain,
      priority: 1,
      status: foundationScore === 0 ? "not_started" : "in_progress",
    });
  }

  if (osScore < 80) {
    actions.push({
      label: osScore === 0 ? "Start Strategic OS" : "Complete Strategic OS",
      helper: "Turn your vision into a practical strategy system.",
      path: resolveAppPath("/strategic-os"),
      icon: Zap,
      priority: 2,
      status: osScore === 0 ? "not_started" : "in_progress",
    });
  }

  if (foundationScore >= 40) {
    actions.push({
      label: contentCount === 0 ? "Generate First Content" : "Create More Content",
      helper: "Translate your strategy into visible execution.",
      path: resolveAppPath("/content-studio"),
      icon: FileText,
      priority: 3,
      status: contentCount === 0 ? "not_started" : "active",
    });
  }

  actions.push({
    label: "Build an Offer",
    helper: "Package the value into something the market can buy.",
    path: resolveAppPath("/offer-builder"),
    icon: Package,
    priority: 4,
    status: "active",
  });

  actions.push({
    label: "Open Systems Builder",
    helper: "Turn strategy into repeatable business structure.",
    path: resolveAppPath("/systems-builder"),
    icon: Rocket,
    priority: 5,
    status: "ready",
  });

  return actions.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

function buildStageCards(metrics, osReadiness, crmAnalytics) {
  const foundationScore = Number(metrics?.foundation_score || 0);
  const osScore = Number(osReadiness?.score || 0);
  const contentCount = Number(metrics?.content_generated || 0);
  const systemsCount = Number(metrics?.systems_built || 0);
  const offersCount = Number(metrics?.offers_created || 0);
  const openDeals = Number(crmAnalytics?.open_deals || 0);

  return [
    {
      key: "foundation",
      title: "Foundation",
      description: "Brand truth, positioning, clarity",
      progress: Math.max(0, Math.min(100, foundationScore)),
      path: resolveAppPath("/brand-foundation"),
    },
    {
      key: "structure",
      title: "Structure",
      description: "Strategy, systems, and workflows",
      progress: Math.max(0, Math.min(100, Math.round((osScore + systemsCount * 15) / 2))),
      path: resolveAppPath("/systems-builder"),
    },
    {
      key: "execution",
      title: "Execution",
      description: "Content, campaigns, and weekly movement",
      progress: Math.max(0, Math.min(100, Math.round(contentCount * 15))),
      path: resolveAppPath("/content-studio"),
    },
    {
      key: "insights",
      title: "Insights",
      description: "Health, traction, pipeline, feedback loops",
      progress: Math.max(0, Math.min(100, Math.round((openDeals * 10) + (offersCount * 20)))),
      path: resolveAppPath("/analytics"),
    },
  ];
}

function getWeeklyPriorities(metrics, osReadiness, crmAnalytics, upcomingEvents) {
  const priorities = [];
  const foundationScore = Number(metrics?.foundation_score || 0);
  const osScore = Number(osReadiness?.score || 0);
  const contentCount = Number(metrics?.content_generated || 0);
  const openDeals = Number(crmAnalytics?.open_deals || 0);

  if (foundationScore < 100) {
    priorities.push("Finish the brand foundation so the rest of the system has a clear source of truth.");
  }

  if (osScore < 80) {
    priorities.push("Complete Strategic OS so your next business decisions are based on structure, not guesswork.");
  }

  if (contentCount < 5) {
    priorities.push("Create or refine content this week so the brand is visible, not just organized internally.");
  }

  if (openDeals > 0) {
    priorities.push(`Review ${openDeals} open deal${openDeals === 1 ? "" : "s"} and move at least one forward this week.`);
  }

  if ((upcomingEvents || []).length > 0) {
    priorities.push("Prepare for your upcoming calendar items so execution stays on schedule.");
  }

  if (priorities.length === 0) {
    priorities.push("Review analytics and decide what to optimize next.");
    priorities.push("Strengthen one system that will make weekly execution easier.");
  }

  return priorities.slice(0, 4);
}

function getBusinessHealth(metrics, osReadiness, crmAnalytics) {
  const foundationScore = Number(metrics?.foundation_score || 0);
  const osScore = Number(osReadiness?.score || 0);
  const contentCount = Number(metrics?.content_generated || 0);
  const openDeals = Number(crmAnalytics?.open_deals || 0);
  const pipelineValue = Number(crmAnalytics?.pipeline_value || 0);

  const readinessAverage = Math.round((foundationScore + osScore) / 2);

  return [
    {
      label: "Brand Readiness",
      value: `${readinessAverage}%`,
      helper: readinessAverage >= 80 ? "Strong" : "Still developing",
      icon: Target,
    },
    {
      label: "Content Momentum",
      value: contentCount,
      helper: contentCount >= 5 ? "Active" : "Needs more output",
      icon: FileText,
    },
    {
      label: "Open Deals",
      value: openDeals,
      helper: openDeals > 0 ? "Pipeline in motion" : "No active deals",
      icon: TrendingUp,
    },
    {
      label: "Pipeline Value",
      value: `$${pipelineValue}`,
      helper: pipelineValue > 0 ? "Revenue potential" : "No tracked value yet",
      icon: Rocket,
    },
  ];
}

function getContinueBuildingCards() {
  return [
    {
      title: "Brand Foundation",
      description: "Clarify the core message, offer, and positioning.",
      path: resolveAppPath("/brand-foundation"),
    },
    {
      title: "Strategic OS",
      description: "Turn your brand direction into a working strategy engine.",
      path: resolveAppPath("/strategic-os"),
    },
    {
      title: "Systems Builder",
      description: "Create the structure that makes your business repeatable.",
      path: resolveAppPath("/systems-builder"),
    },
    {
      title: "Content Studio",
      description: "Turn your strategy into visible, on-brand execution.",
      path: resolveAppPath("/content-studio"),
    },
  ];
}

export default function Dashboard() {
  const colors = useColors();
  const { user } = useUser();
  const { plan, isSuperAdmin } = usePlan();
  const { activeWorkspace } = useWorkspace();

  const [dashboardData, setDashboardData] = useState(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentDrafts, setRecentDrafts] = useState([]);
  const [crmAnalytics, setCrmAnalytics] = useState(null);
  const [osReadiness, setOsReadiness] = useState(null);
  const [showClerkId, setShowClerkId] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const userId = user?.id || null;

      if (!userId) {
        setDashboardData(emptyDashboard);
        setLoading(false);
        return;
      }

      try {
        const [dashRes, eventsRes, draftsRes, crmRes, osRes] = await Promise.all([
          apiClient.get("/dashboard").catch(() => null),
          apiClient.get("/calendar/upcoming", { params: { user_id: userId, days: 7, limit: 5 } }).catch(() => null),
          apiClient.get("/blog/articles", { params: { user_id: userId, status: "draft", limit: 5 } }).catch(() => null),
          apiClient.get("/crm/analytics", { params: { user_id: userId } }).catch(() => null),
          apiClient.get("/os-workflow/readiness", { params: { user_id: userId } }).catch(() => null),
        ]);

        setDashboardData(dashRes?.data || emptyDashboard);
        setUpcomingEvents(eventsRes?.data?.events || []);
        setRecentDrafts(draftsRes?.data?.articles || []);
        setCrmAnalytics(crmRes?.data || null);
        setOsReadiness(osRes?.data || null);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
        setDashboardData(emptyDashboard);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user?.id]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;

    const params = new URLSearchParams({ user_id: userId });
    if (activeWorkspace?.id) params.append("workspace_id", activeWorkspace.id);

    axios
      .get(`${API}/onboarding/progress?${params}`)
      .then((res) => {
        const data = res.data || {};
        const done = [
          data.audit_complete,
          data.brand_memory_complete,
          data.foundation_complete,
          data.strategic_os_started,
          data.first_campaign_created,
        ].filter(Boolean).length;

        setCompletedSteps(done);
        if (done === 0) setShowOnboarding(true);
      })
      .catch(() => {});
  }, [user?.id, activeWorkspace?.id]);

  const metrics = dashboardData?.metrics || {};
  const brandName =
    activeWorkspace?.brand_name ||
    activeWorkspace?.name ||
    dashboardData?.brand_name ||
    "Your Brand";

  const journeyStage = getUserJourneyStage(metrics, osReadiness);
  const quickActions = getContextAwareActions(metrics, osReadiness);
  const stageCards = buildStageCards(metrics, osReadiness, crmAnalytics);
  const weeklyPriorities = getWeeklyPriorities(metrics, osReadiness, crmAnalytics, upcomingEvents);
  const businessHealth = getBusinessHealth(metrics, osReadiness, crmAnalytics);
  const continueBuildingCards = getContinueBuildingCards();

  const statusTone = useMemo(() => {
    switch (journeyStage.key) {
      case "foundation":
        return { bg: `${colors.cinnabar}14`, border: `${colors.cinnabar}33`, text: colors.cinnabar };
      case "structure":
        return { bg: `${colors.tuscany}18`, border: `${colors.border}`, text: colors.tuscany };
      case "execution":
        return { bg: `${colors.ruby || colors.cinnabar}14`, border: `${colors.border}`, text: colors.textPrimary };
      default:
        return { bg: `${colors.cardBg}`, border: `${colors.border}`, text: colors.textPrimary };
    }
  }, [journeyStage.key, colors]);

  if (loading) {
    return (
      <DashboardLayout>
        <TopBar title="Command Center" subtitle="Loading founder workspace" />
        <div className="flex-1 flex items-center justify-center">
          <div style={{ color: colors.textMuted }}>Loading command center...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout>
        <TopBar
          title="Command Center"
          subtitle={`A founder operating view for ${brandName}`}
        />

        <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
          <div
            style={{
              background: `linear-gradient(135deg, ${colors.cardBg}, rgba(224, 78, 53, 0.08))`,
              border: `1px solid ${colors.border}`,
              borderRadius: 20,
              padding: 24,
              marginBottom: 20,
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div style={{ maxWidth: 760 }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "999px",
                      background: activeWorkspace?.color_primary || colors.cinnabar,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--cth-on-dark)",
                    }}
                  >
                    {brandName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div style={{ fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Founder Workspace
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: colors.textPrimary }}>
                      {brandName}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: statusTone.bg,
                    border: `1px solid ${statusTone.border}`,
                    color: statusTone.text,
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 14,
                  }}
                >
                  <CheckCircle2 size={14} />
                  Current Stage: {journeyStage.label}
                </div>

                <h2
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 28,
                    lineHeight: 1.15,
                    color: colors.textPrimary,
                    marginBottom: 10,
                  }}
                >
                  {journeyStage.headline}
                </h2>

                <p style={{ fontSize: 14, lineHeight: 1.7, color: colors.textMuted, maxWidth: 700 }}>
                  Core Truth House should help you move from scattered effort to clear execution.
                  This Command Center is designed to show what matters now, what needs attention next,
                  and which part of the business you should strengthen this week.
                </p>
              </div>

              <div
                style={{
                  minWidth: 260,
                  background: colors.darkest,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Next Best Move
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, marginBottom: 10 }}>
                  {journeyStage.nextAction}
                </div>
                <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 14 }}>
                  Follow the next action before jumping across tools. That keeps the business flowing in the right order.
                </div>
                <Link
                  to={quickActions[0]?.path || resolveAppPath("/brand-foundation")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: colors.cinnabar,
                    color: "var(--cth-on-dark)",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Continue
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {completedSteps < 5 ? (
            <div className="mb-4">
              <OnboardingTriggerButton
                completedSteps={completedSteps}
                onClick={() => setShowOnboarding(true)}
              />
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div
              style={{
                background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.05))`,
                border: `1px solid ${colors.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Progress Across the Business
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
                    Stage Overview
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {stageCards.map((stage) => (
                  <Link
                    key={stage.key}
                    to={stage.path}
                    style={{
                      textDecoration: "none",
                      background: colors.darkest,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
                          {stage.title}
                        </div>
                        <div style={{ fontSize: 12, color: colors.textMuted }}>
                          {stage.description}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary }}>
                        {stage.progress}%
                      </div>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 8,
                        borderRadius: 999,
                        background: `${colors.border}`,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${stage.progress}%`,
                          height: "100%",
                          background: colors.cinnabar,
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div
              style={{
                background: `linear-gradient(180deg, ${colors.cardBg}, rgba(224, 78, 53, 0.06))`,
                border: `1px solid ${colors.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <div className="mb-4">
                <div style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  This Week
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
                  Founder Priorities
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {weeklyPriorities.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      background: colors.darkest,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <div style={{ marginTop: 2 }}>
                      {index === 0 ? (
                        <CheckCircle2 size={16} style={{ color: colors.cinnabar }} />
                      ) : (
                        <Circle size={16} style={{ color: colors.textMuted }} />
                      )}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: colors.textPrimary }}>{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              background: `linear-gradient(180deg, ${colors.cardBg}, rgba(224, 78, 53, 0.08))`,
              border: `1px solid ${colors.cinnabar}33`,
              borderRadius: 18,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <div style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Recommended Next Actions
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
                  Build in Order
                </div>
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>
                Based on your current progress
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.path}
                  style={{
                    textDecoration: "none",
                    background: action.status === "not_started"
                      ? `${colors.cinnabar}12`
                      : colors.darkest,
                    border: action.status === "not_started"
                      ? `1px solid ${colors.cinnabar}33`
                      : `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: 16,
                    display: "block",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-10">
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: `${colors.cinnabar}18`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <action.icon size={18} style={{ color: colors.cinnabar }} />
                      </div>

                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                          {action.label}
                        </div>
                        <div style={{ fontSize: 12, lineHeight: 1.5, color: colors.textMuted }}>
                          {action.helper}
                        </div>
                      </div>
                    </div>

                    <ArrowRight size={16} style={{ color: colors.textMuted, flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
            <div
              style={{
                background: `linear-gradient(180deg, ${colors.cardBg}, rgba(118, 59, 91, 0.08))`,
                border: `1px solid ${colors.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <div className="mb-4">
                <div style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Business Snapshot
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
                  Health Signals
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {businessHealth.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: colors.darkest,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon size={15} style={{ color: colors.cinnabar }} />
                      <div style={{ fontSize: 12, color: colors.textMuted }}>{item.label}</div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: colors.textPrimary, marginBottom: 4 }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>
                      {item.helper}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.05))`,
                border: `1px solid ${colors.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <div className="mb-4">
                <div style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Continue Building
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
                  Core Founder Workspaces
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {continueBuildingCards.map((card) => (
                  <Link
                    key={card.title}
                    to={card.path}
                    style={{
                      textDecoration: "none",
                      background: colors.darkest,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 14,
                      padding: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, marginBottom: 4 }}>
                        {card.title}
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.5, color: colors.textMuted }}>
                        {card.description}
                      </div>
                    </div>
                    <ArrowRight size={16} style={{ color: colors.textMuted, flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div
              style={{
                background: `linear-gradient(180deg, ${colors.cardBg}, rgba(224, 78, 53, 0.05))`,
                border: `1px solid ${colors.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Calendar
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
                    Upcoming Events
                  </div>
                </div>
                <Link
                  to={resolveAppPath("/calendar")}
                  style={{ fontSize: 12, color: colors.cinnabar, textDecoration: "none", fontWeight: 700 }}
                >
                  View Calendar
                </Link>
              </div>

              {upcomingEvents.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {upcomingEvents.slice(0, 4).map((event, index) => (
                    <div
                      key={event.id || index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        background: colors.darkest,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 14,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "999px",
                          background: event.color || colors.cinnabar,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: colors.textPrimary,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {event.title}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>
                          {new Date(event.start_time).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    background: colors.darkest,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: 18,
                    textAlign: "center",
                    color: colors.textMuted,
                    fontSize: 13,
                  }}
                >
                  No upcoming events yet.
                </div>
              )}
            </div>

            <div
              style={{
                background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.05))`,
                border: `1px solid ${colors.border}`,
                borderRadius: 18,
                padding: 20,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Writing Pipeline
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
                    Recent Drafts
                  </div>
                </div>
                <Link
                  to={resolveAppPath("/blog-cms")}
                  style={{ fontSize: 12, color: colors.cinnabar, textDecoration: "none", fontWeight: 700 }}
                >
                  Open Blog CMS
                </Link>
              </div>

              {recentDrafts.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {recentDrafts.slice(0, 4).map((draft, index) => (
                    <div
                      key={draft.id || index}
                      style={{
                        background: colors.darkest,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 14,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: colors.textPrimary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          marginBottom: 4,
                        }}
                      >
                        {draft.title || "Untitled Draft"}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textMuted }}>
                        Updated {draft.updated_at ? new Date(draft.updated_at).toLocaleDateString() : "recently"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    background: colors.darkest,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: 18,
                    textAlign: "center",
                    color: colors.textMuted,
                    fontSize: 13,
                  }}
                >
                  No recent drafts yet.
                </div>
              )}
            </div>
          </div>

          {isSuperAdmin && user ? (
            <div
              style={{
                marginTop: 20,
                background: colors.darkest,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div style={{ fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Admin Utility
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>
                    Super Admin Clerk ID
                  </div>
                </div>

                <button
                  onClick={() => setShowClerkId((prev) => !prev)}
                  style={{
                    fontSize: 12,
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    background: showClerkId ? `${colors.cinnabar}15` : "transparent",
                    color: showClerkId ? colors.cinnabar : colors.textMuted,
                    cursor: "pointer",
                  }}
                >
                  {showClerkId ? "Hide" : "Show"} Clerk ID
                </button>
              </div>

              {showClerkId ? (
                <div>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                      color: colors.textPrimary,
                      background: colors.cardBg,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1px solid ${colors.border}`,
                      wordBreak: "break-all",
                      userSelect: "all",
                    }}
                  >
                    {user.id}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
                    Add this to backend environment config as SUPER_ADMIN_CLERK_ID.
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div style={{ marginTop: 20 }}>
            <div className="flex items-center gap-2 mb-2">
              <Crown size={14} style={{ color: colors.cinnabar }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary }}>
                Workspace Plan
              </span>
            </div>
            <div style={{ fontSize: 13, color: colors.textMuted }}>
              {isSuperAdmin ? "SUPER ADMIN" : plan || "FOUNDATION"}
            </div>
          </div>
        </div>
      </DashboardLayout>

      {showOnboarding ? (
        <OnboardingWorkflow open={showOnboarding} onClose={() => setShowOnboarding(false)} />
      ) : null}

      {!showOnboarding && completedSteps > 0 && completedSteps < 5 ? (
        <OnboardingChecklist completedSteps={completedSteps} onOpen={() => setShowOnboarding(true)} />
      ) : null}
    </>
  );
}
