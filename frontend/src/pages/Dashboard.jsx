import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../hooks/useAuth';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import { OnboardingChecklist } from '../components/OnboardingChecklist';
import { usePlan } from '../context/PlanContext';
import { useWorkspace } from '../context/WorkspaceContext';
import OnboardingWorkflow, { OnboardingTriggerButton } from './OnboardingWorkflow';
import { resolveAppPath } from '../navigation/navigationHelpers';
import {
  Palette,
  FileText,
  Package,
  Rocket,
  Zap,
  ArrowRight,
  Sparkles,
  CalendarDays,
  PenLine,
  Crown,
  Brain,
  CheckCircle2,
  Circle,
  Image,
} from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const MODULE_CARDS = [
  {
    id: 'brand_intelligence',
    name: 'Brand Intelligence',
    description: 'Memory + foundation in one place',
    icon: Brain,
    path: resolveAppPath('/brand-intelligence'),
    color: '#AF0024',
    journeyStep: 1,
  },
  {
    id: 'strategic_os',
    name: 'Strategic OS',
    description: 'AI-powered brand strategy',
    icon: Zap,
    path: resolveAppPath('/strategic-os'),
    color: '#E04E35',
    journeyStep: 2,
    badge: 'New',
  },
  {
    id: 'content_studio',
    name: 'Content Studio',
    description: 'Create on-brand content',
    icon: FileText,
    path: resolveAppPath('/content-studio'),
    color: '#e04e35',
    journeyStep: 3,
  },
  {
    id: 'media_studio',
    name: 'Media Studio',
    description: 'AI image & video generation',
    icon: Image,
    path: resolveAppPath('/media-studio'),
    color: '#763b5b',
    journeyStep: 4,
  },
  {
    id: 'offer_builder',
    name: 'Offer Builder',
    description: 'Craft irresistible offers',
    icon: Package,
    path: resolveAppPath('/offer-builder'),
    color: '#9B1B30',
    journeyStep: 5,
  },
  {
    id: 'launch_planner',
    name: 'Launch Planner',
    description: 'Plan your next launch',
    icon: Rocket,
    path: resolveAppPath('/launch-planner'),
    color: '#AF0024',
    journeyStep: 6,
  },
  {
    id: 'identity_studio',
    name: 'Identity Studio',
    description: 'Visual brand identity',
    icon: Sparkles,
    path: resolveAppPath('/identity-studio'),
    color: '#e04e35',
    journeyStep: 7,
  },
];

const emptyDashboard = {
  brand_name: 'Your Brand',
  metrics: {
    foundation_score: 0,
    offers_created: 0,
    systems_built: 0,
    content_generated: 0,
  },
  modules: {},
};

function getUserJourneyStage(metrics, osReadiness) {
  const foundationScore = metrics?.foundation_score || 0;
  const osScore = osReadiness?.score || 0;
  const contentCount = metrics?.content_generated || 0;
  const offersCount = metrics?.offers_created || 0;

  if (foundationScore < 50) {
    return { stage: 'foundation', label: 'Setting the Foundation', nextAction: 'Complete Brand Intelligence' };
  }
  if (osScore < 80) {
    return { stage: 'strategy', label: 'Building Strategy', nextAction: 'Complete Strategic OS variables' };
  }
  if (contentCount < 5) {
    return { stage: 'content', label: 'Creating Content', nextAction: 'Generate your first pieces of content' };
  }
  if (offersCount < 1) {
    return { stage: 'offers', label: 'Crafting Offers', nextAction: 'Build your first offer' };
  }
  return { stage: 'scaling', label: 'Scaling Your Brand', nextAction: 'Launch and grow' };
}

function getContextAwareActions(metrics, osReadiness) {
  const foundationScore = metrics?.foundation_score || 0;
  const osScore = osReadiness?.score || 0;
  const contentCount = metrics?.content_generated || 0;
  const actions = [];

  if (foundationScore < 100) {
    actions.push({
      label: foundationScore === 0 ? 'Start Brand Intelligence' : 'Complete Brand Intelligence',
      path: resolveAppPath('/brand-intelligence'),
      icon: Brain,
      priority: 1,
      status: foundationScore === 0 ? 'not_started' : 'in_progress',
    });
  }

  if (osScore < 80) {
    actions.push({
      label: osScore === 0 ? 'Set Up Strategic OS' : 'Complete OS Variables',
      path: resolveAppPath('/brand-intelligence'),
      icon: Zap,
      priority: 2,
      status: osScore === 0 ? 'not_started' : 'in_progress',
    });
  }

  if (foundationScore >= 50) {
    actions.push({
      label: contentCount === 0 ? 'Generate First Content' : 'Create More Content',
      path: resolveAppPath('/content-studio'),
      icon: FileText,
      priority: 3,
      status: contentCount === 0 ? 'not_started' : 'active',
    });
  }

  if (osScore >= 80) {
    actions.push({
      label: 'Run Strategic OS',
      path: resolveAppPath('/strategic-os'),
      icon: Zap,
      priority: 4,
      status: 'ready',
    });
  }

  actions.push({
    label: 'Create Offer',
    path: resolveAppPath('/offer-builder'),
    icon: Package,
    priority: 5,
    status: 'active',
  });

  return actions.sort((a, b) => a.priority - b.priority).slice(0, 4);
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
          axios.get(`${API}/dashboard`).catch(() => null),
          axios.get(`${API}/calendar/upcoming?user_id=${userId}&days=7&limit=5`).catch(() => null),
          axios.get(`${API}/blog/articles?user_id=${userId}&status=draft&limit=5`).catch(() => null),
          axios.get(`${API}/crm/analytics?user_id=${userId}`).catch(() => null),
          axios.get(`${API}/os-workflow/readiness?user_id=${userId}`).catch(() => null),
        ]);

        setDashboardData(dashRes?.data || emptyDashboard);
        setUpcomingEvents(eventsRes?.data?.events || []);
        setRecentDrafts(draftsRes?.data?.articles || []);
        setCrmAnalytics(crmRes?.data || null);
        setOsReadiness(osRes?.data || null);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
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
    if (activeWorkspace?.id) params.append('workspace_id', activeWorkspace.id);

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
  const brandName = activeWorkspace?.brand_name || activeWorkspace?.name || dashboardData?.brand_name || 'Your Brand';
  const journeyStage = getUserJourneyStage(metrics, osReadiness);
  const quickActions = getContextAwareActions(metrics, osReadiness);
  const osProgress = osReadiness?.score || 0;

  const metricCards = useMemo(
    () => [
      { label: 'Foundation Score', value: `${metrics.foundation_score || 0}%`, icon: Palette, change: metrics.foundation_score === 100 ? 'Complete' : null },
      { label: 'Strategic OS Ready', value: `${osProgress}%`, icon: Zap, change: osProgress >= 80 ? 'Ready' : `${osReadiness?.missing_fields?.length || 0} fields left` },
      { label: 'Offers Created', value: metrics.offers_created || 0, icon: Package, change: null },
      { label: 'Systems Built', value: metrics.systems_built || 0, icon: Rocket, change: null },
      { label: 'Content Generated', value: metrics.content_generated || 0, icon: FileText, change: null },
    ],
    [metrics, osProgress, osReadiness]
  );

  if (loading) {
    return (
      <DashboardLayout>
        <TopBar title="Dashboard" subtitle="Loading workspace" />
        <div className="flex-1 flex items-center justify-center">
          <div style={{ color: colors.textMuted }}>Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout>
        <TopBar title="Command Center" subtitle={`${journeyStage.label} · Building ${brandName}`} />

        <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
          {user ? (
            <div
              data-testid="account-info-banner"
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 rounded-[14px] p-3 sm:p-4"
              style={{
                background: `linear-gradient(135deg, ${colors.cardBg}, rgba(224, 78, 53, 0.06))`,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: activeWorkspace?.color_primary || colors.cinnabar,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'white',
                  }}
                >
                  {brandName.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{brandName}</span>
                    <span
                      data-testid="plan-badge"
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: isSuperAdmin
                          ? 'linear-gradient(135deg, #e04e35, #af0024)'
                          : plan === 'ESTATE'
                          ? 'linear-gradient(135deg, #af0024, #33033c)'
                          : plan === 'HOUSE'
                          ? 'linear-gradient(135deg, #9B1B30, #af0024)'
                          : plan === 'STRUCTURE'
                          ? 'linear-gradient(135deg, #763b5b, #9B1B30)'
                          : `${colors.cinnabar}20`,
                        color: isSuperAdmin || ['ESTATE', 'HOUSE', 'STRUCTURE'].includes(plan) ? '#fff' : colors.cinnabar,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {isSuperAdmin ? <Crown size={10} /> : null}
                      {isSuperAdmin ? 'SUPER ADMIN' : plan || 'FOUNDATION'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>{journeyStage.nextAction}</div>
                </div>
              </div>

              <button
                data-testid="show-clerk-id-btn"
                onClick={() => setShowClerkId((prev) => !prev)}
                style={{
                  fontSize: 11,
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  background: showClerkId ? `${colors.cinnabar}15` : 'transparent',
                  color: showClerkId ? colors.cinnabar : colors.textMuted,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {showClerkId ? 'Hide' : 'Show'} Clerk ID
              </button>
            </div>
          ) : null}

          {showClerkId && user ? (
            <div
              data-testid="clerk-id-display"
              style={{
                background: colors.darkest,
                border: `1px solid ${colors.cinnabar}33`,
                borderRadius: 12,
                padding: '14px 20px',
                marginBottom: 20,
                marginTop: -10,
              }}
            >
              <div style={{ fontSize: 10, color: colors.cinnabar, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
                Your Clerk User ID
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 14,
                  color: colors.textPrimary,
                  background: colors.cardBg,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  wordBreak: 'break-all',
                  userSelect: 'all',
                }}
              >
                {user.id}
              </div>
              <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 8, lineHeight: 1.5 }}>
                Copy this ID and add it to your backend .env file as <code style={{ color: colors.cinnabar }}>SUPER_ADMIN_CLERK_ID={user.id}</code>
              </p>
            </div>
          ) : null}

          {completedSteps < 5 ? (
            <div className="mb-4">
              <OnboardingTriggerButton completedSteps={completedSteps} onClick={() => setShowOnboarding(true)} />
            </div>
          ) : null}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
            {metricCards.map((metric, index) => (
              <div
                key={index}
                data-testid={`metric-${index}`}
                style={{
                  background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.06))`,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <metric.icon size={18} style={{ color: colors.cinnabar }} />
                  <span style={{ fontSize: 11, color: colors.tuscany, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{metric.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: colors.textPrimary, fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {metric.value}
                  </span>
                  {metric.change ? (
                    <span style={{ fontSize: 11, color: metric.change === 'Complete' || metric.change === 'Ready' ? '#22c55e' : colors.textMuted, fontWeight: 500 }}>
                      {metric.change === 'Complete' || metric.change === 'Ready' ? (
                        <>
                          <CheckCircle2 size={11} style={{ marginRight: 2 }} />
                          {metric.change}
                        </>
                      ) : (
                        metric.change
                      )}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: colors.textPrimary, marginBottom: 16 }}>
              Brand Modules
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {MODULE_CARDS.map((module) => {
                const Icon = module.icon;
                const progress = module.id === 'strategic_os' ? osProgress : dashboardData?.modules?.[module.id]?.progress || 0;

                return (
                  <Link
                    key={module.id}
                    to={module.path}
                    data-testid={`module-${module.id}`}
                    style={{ textDecoration: 'none', cursor: 'pointer' }}
                  >
                    <div
                      style={{
                        background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.08))`,
                        border: `1px solid ${module.color}33`,
                        borderRadius: 16,
                        padding: '24px',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `${colors.tuscany}22` }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: module.color, transition: 'width 0.3s ease' }} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: `${module.color}22`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 16,
                          }}
                        >
                          <Icon size={24} style={{ color: module.color }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {module.badge ? (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 4,
                                background: `${colors.cinnabar}20`,
                                color: colors.cinnabar,
                                textTransform: 'uppercase',
                              }}
                            >
                              {module.badge}
                            </span>
                          ) : null}
                          <ArrowRight size={18} style={{ color: colors.textMuted }} />
                        </div>
                      </div>

                      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, color: colors.textPrimary, marginBottom: 6 }}>
                        {module.name}
                      </h3>
                      <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>{module.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div
            style={{
              background: `linear-gradient(180deg, ${colors.cardBg}, rgba(224, 78, 53, 0.08))`,
              border: `1px solid ${colors.cinnabar}33`,
              borderRadius: 16,
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Zap size={18} style={{ color: colors.cinnabar }} />
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, color: colors.textPrimary, fontWeight: 600 }}>
                Quick Actions
              </span>
              <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 'auto' }}>Based on your progress</span>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.path}
                  data-testid={`quick-action-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: action.status === 'not_started' ? `${colors.cinnabar}15` : action.status === 'in_progress' ? `${colors.tuscany}15` : colors.darkest,
                    border: action.status === 'not_started' ? `1px solid ${colors.cinnabar}33` : `1px solid ${colors.border}`,
                    textDecoration: 'none',
                    color: colors.textPrimary,
                    fontSize: 13,
                    fontWeight: 500,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <action.icon size={16} style={{ color: colors.cinnabar }} />
                  {action.label}
                  {action.status === 'not_started' ? <Circle size={8} style={{ color: colors.cinnabar }} /> : null}
                  {action.status === 'in_progress' ? <span style={{ fontSize: 10, color: colors.tuscany }}>In Progress</span> : null}
                </Link>
              ))}
            </div>
          </div>

          <div data-testid="business-overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-5 md:mt-6">
            <div
              style={{
                background: `linear-gradient(180deg, ${colors.cardBg}, rgba(224, 78, 53, 0.06))`,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarDays size={16} style={{ color: colors.cinnabar }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>Upcoming Events</span>
                </div>
                <Link to={resolveAppPath('/calendar')} style={{ fontSize: 11, color: colors.cinnabar, textDecoration: 'none' }}>
                  View All
                </Link>
              </div>

              {upcomingEvents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcomingEvents.slice(0, 4).map((event, index) => (
                    <div
                      key={event.id || index}
                      data-testid={`upcoming-event-${index}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: colors.darkest,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: event.color || colors.cinnabar }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {event.title}
                        </div>
                        <div style={{ fontSize: 10, color: colors.textMuted }}>
                          {new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: colors.textMuted }}>No upcoming events</p>
                  <Link to={resolveAppPath('/calendar')} style={{ fontSize: 11, color: colors.cinnabar, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
                    + Add Event
                  </Link>
                </div>
              )}
            </div>

            <div
              style={{
                background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.06))`,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PenLine size={16} style={{ color: colors.cinnabar }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>Blog Drafts</span>
                </div>
                <Link to={resolveAppPath('/blog-cms')} style={{ fontSize: 11, color: colors.cinnabar, textDecoration: 'none' }}>
                  View All
                </Link>
              </div>

              {recentDrafts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentDrafts.slice(0, 4).map((draft, index) => (
                    <div
                      key={draft.id || index}
                      data-testid={`recent-draft-${index}`}
                      style={{ padding: '8px 10px', borderRadius: 8, background: colors.darkest, border: `1px solid ${colors.border}` }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 500, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {draft.title || 'Untitled Draft'}
                      </div>
                      <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>
                        Updated {draft.updated_at ? new Date(draft.updated_at).toLocaleDateString() : 'recently'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: colors.textMuted }}>No draft articles yet</p>
                  <Link to={resolveAppPath('/blog-cms')} style={{ fontSize: 11, color: colors.cinnabar, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
                    + Start Draft
                  </Link>
                </div>
              )}
            </div>

            <div
              style={{
                background: `linear-gradient(180deg, ${colors.cardBg}, rgba(118, 59, 91, 0.08))`,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Rocket size={16} style={{ color: colors.cinnabar }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>Business Snapshot</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: colors.textMuted }}>Pipeline Value</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>${crmAnalytics?.pipeline_value || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: colors.textMuted }}>Open Deals</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{crmAnalytics?.open_deals || 0}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: colors.textMuted }}>Workspace Plan</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{isSuperAdmin ? 'SUPER ADMIN' : plan || 'FOUNDATION'}</span>
                </div>
              </div>
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
