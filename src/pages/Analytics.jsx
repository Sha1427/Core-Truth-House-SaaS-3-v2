import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
 BarChart3,
 ChevronRight,
 FileText,
 Image,
 Loader2,
 Lock,
 Shield,
 Sparkles,
 TrendingUp,
} from "lucide-react";
import {
 Area,
 AreaChart,
 Bar,
 BarChart,
 CartesianGrid,
 Cell,
 Pie,
 PieChart,
 ResponsiveContainer,
 Tooltip,
 XAxis,
 YAxis,
} from "recharts";

import { DashboardLayout, TopBar } from "../components/Layout";
import { useColors } from "../context/ThemeContext";
import { usePlan } from "../context/PlanContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { PLAN_ORDER } from "../config/routeConfig";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const CHART_COLORS = ["var(--cth-command-crimson)", "var(--cth-brand-primary)", "var(--cth-command-crimson)", "var(--cth-status-info)", "var(--cth-status-success-bright)", "var(--cth-status-warning)"];

function MetricCard({ label, value, icon: Icon, color, sublabel }) {
 return (
 <div
 className="p-4"
 style={{
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 }}
 >
 <div className="mb-3 flex items-center gap-2">
 <div
 className="flex h-10 w-10 items-center justify-center rounded-xl"
 style={{ background: `${color}20` }}
 >
 <Icon size={18} style={{ color }} />
 </div>
 </div>

 <div className="text-xs uppercase tracking-wide cth-muted">{label}</div>
 <div className="mt-1 text-2xl font-bold cth-heading">{value}</div>
 {sublabel ? <div className="mt-1 text-xs cth-muted">{sublabel}</div> : null}
 </div>
 );
}

function EmptyChart({ text }) {
 return (
 <div className="flex h-[240px] items-center justify-center text-sm cth-muted">
 {text}
 </div>
 );
}

function LockedOverlay() {
 return (
 <DashboardLayout>
 <TopBar
 title="Analytics"
 subtitle="Track your brand system, content usage, and momentum over time."
 />
 <div className="flex-1 overflow-auto">
 <div className="mx-auto max-w-3xl px-4 py-16 md:px-8">
 <div
 style={{
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 padding: 40,
 textAlign: "center",
 }}
 >
 <div
 className="mx-auto flex h-14 w-14 items-center justify-center"
 style={{
 borderRadius: 999,
 background: "color-mix(in srgb, var(--cth-command-crimson) 12%, transparent)",
 color: "var(--cth-command-crimson)",
 marginBottom: 16,
 }}
 >
 <Lock size={22} />
 </div>
 <p
 style={{
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: "0.18em",
 textTransform: "uppercase",
 color: "var(--cth-command-muted)",
 margin: 0,
 }}
 >
 Foundation Plan Required
 </p>
 <h2
 style={{
 fontFamily: "'Playfair Display', serif",
 fontSize: 32,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: "12px 0 16px",
 letterSpacing: "-0.005em",
 }}
 >
 Analytics
 </h2>
 <p
 style={{
 fontSize: 14,
 lineHeight: 1.65,
 color: "var(--cth-command-muted)",
 margin: "0 auto 24px",
 maxWidth: 520,
 }}
 >
 Track your brand system completion, content usage, and momentum over time. Available on The Foundation plan and above.
 </p>
 <a
 href="/billing"
 className="inline-flex items-center gap-2"
 style={{
 background: "var(--cth-command-purple)",
 color: "var(--cth-command-gold)",
 border: "none",
 borderRadius: 999,
 padding: "12px 22px",
 fontSize: 13,
 fontWeight: 600,
 letterSpacing: "0.04em",
 cursor: "pointer",
 textDecoration: "none",
 }}
 >
 Upgrade to Foundation
 <ChevronRight size={14} />
 </a>
 </div>
 </div>
 </div>
 </DashboardLayout>
 );
}

function PlanBadge({ label, color }) {
 return (
 <span
 style={{
 display: "inline-flex",
 alignItems: "center",
 padding: "4px 10px",
 borderRadius: 999,
 background: `color-mix(in srgb, ${color} 12%, transparent)`,
 color,
 fontSize: 10,
 fontWeight: 700,
 letterSpacing: "0.18em",
 textTransform: "uppercase",
 }}
 >
 {label}
 </span>
 );
}

function SectionHeader({ title, badgeLabel, badgeColor }) {
 return (
 <div className="mb-4 flex flex-wrap items-center gap-3">
 <h3
 style={{
 fontFamily: "'Playfair Display', serif",
 fontSize: 20,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: 0,
 letterSpacing: "-0.005em",
 }}
 >
 {title}
 </h3>
 <PlanBadge label={badgeLabel} color={badgeColor} />
 </div>
 );
}

function UpgradeCard({ heading, body, ctaLabel }) {
 return (
 <div
 style={{
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 padding: 28,
 textAlign: "center",
 }}
 >
 <div
 className="mx-auto flex h-12 w-12 items-center justify-center"
 style={{
 borderRadius: 999,
 background: "color-mix(in srgb, var(--cth-command-crimson) 12%, transparent)",
 color: "var(--cth-command-crimson)",
 marginBottom: 14,
 }}
 >
 <Lock size={18} />
 </div>
 <h4
 style={{
 fontFamily: "'Playfair Display', serif",
 fontSize: 20,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: 0,
 letterSpacing: "-0.005em",
 }}
 >
 {heading}
 </h4>
 <p
 style={{
 fontSize: 13,
 lineHeight: 1.6,
 color: "var(--cth-command-muted)",
 margin: "10px auto 18px",
 maxWidth: 460,
 }}
 >
 {body}
 </p>
 <a
 href="/billing"
 className="inline-flex items-center gap-2"
 style={{
 background: "var(--cth-command-purple)",
 color: "var(--cth-command-gold)",
 border: "none",
 borderRadius: 999,
 padding: "10px 18px",
 fontSize: 12,
 fontWeight: 600,
 letterSpacing: "0.04em",
 cursor: "pointer",
 textDecoration: "none",
 }}
 >
 {ctaLabel}
 <ChevronRight size={14} />
 </a>
 </div>
 );
}

export default function Analytics() {
 const colors = useColors();
 const { plan } = usePlan();
 const { activeWorkspaceId } = useWorkspace();

 const normalizedPlan = String(plan || "free").toLowerCase();
 const planIndex = PLAN_ORDER.indexOf(normalizedPlan);
 const isLocked = normalizedPlan === "free" || normalizedPlan === "audit";
 const isStructurePlus = planIndex >= PLAN_ORDER.indexOf("structure");
 const isHousePlus = planIndex >= PLAN_ORDER.indexOf("house");
 const isEstate = normalizedPlan === "estate";

 const [loading, setLoading] = useState(true);
 const [pageError, setPageError] = useState("");

 const [overview, setOverview] = useState(null);
 const [brandProgress, setBrandProgress] = useState([]);
 const [aiUsage, setAiUsage] = useState([]);
 const [contentBreakdown, setContentBreakdown] = useState([]);
 const [mediaBreakdown, setMediaBreakdown] = useState([]);
 const [brandMemory, setBrandMemory] = useState(null);
 const [workspaceStats, setWorkspaceStats] = useState(null);

 const tooltipStyle = useMemo(
 () => ({
 backgroundColor: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 fontSize: 12,
 color: "var(--cth-command-ink)",
 }),
 []
 );

 const cardStyle = useMemo(
 () => ({
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 padding: "20px",
 }),
 []
 );

 const loadAnalytics = useCallback(async () => {
 setLoading(true);
 setPageError("");

 try {
 const [overviewRes, progressRes, usageRes, contentRes, mediaRes, memoryRes] =
 await Promise.all([
 apiClient.get(API_PATHS.analytics.overview),
 apiClient.get(API_PATHS.analytics.brandProgress),
 apiClient.get(API_PATHS.analytics.aiUsage),
 apiClient.get(API_PATHS.analytics.contentBreakdown),
 apiClient.get(API_PATHS.analytics.mediaBreakdown),
 apiClient.get(API_PATHS.analytics.brandMemory),
 ]);

 setOverview(overviewRes || null);
 setBrandProgress(progressRes?.progress || []);
 setAiUsage(usageRes?.usage || []);
 setContentBreakdown(contentRes?.breakdown || []);
 setMediaBreakdown(mediaRes?.breakdown || []);
 setBrandMemory(memoryRes || null);

 if (isStructurePlus && activeWorkspaceId) {
 try {
 const stats = await apiClient.get(`/api/workspace/${activeWorkspaceId}/stats`);
 setWorkspaceStats(stats || null);
 } catch (statsError) {
 console.error("Failed to load workspace stats", statsError);
 setWorkspaceStats(null);
 }
 } else {
 setWorkspaceStats(null);
 }
 } catch (error) {
 console.error("Failed to load analytics", error);
 setPageError(error?.message || "Failed to load analytics.");
 } finally {
 setLoading(false);
 }
 }, [isStructurePlus, activeWorkspaceId]);

 useEffect(() => {
 loadAnalytics();
 }, [loadAnalytics]);

 const metricCards = useMemo(() => {
 return [
 {
 label: "Foundation",
 value: `${overview?.summary?.foundation_completion || 0}%`,
 icon: Shield,
 color: "var(--cth-command-crimson)",
 sublabel: "Strategic foundation completion",
 },
 {
 label: "Audit Score",
 value: overview?.summary?.brand_audit_score || 0,
 icon: TrendingUp,
 color: "var(--cth-status-info)",
 sublabel: "Latest brand score",
 },
 {
 label: "AI This Month",
 value: overview?.summary?.ai_generations_this_month || 0,
 icon: Sparkles,
 color: "var(--cth-status-focus)",
 sublabel: "Generations used this month",
 },
 {
 label: "Content",
 value: overview?.summary?.total_content || 0,
 icon: FileText,
 color: "var(--cth-status-success-bright)",
 sublabel: "Saved content assets",
 },
 {
 label: "Media",
 value: overview?.summary?.total_media || 0,
 icon: Image,
 color: "var(--cth-status-warning)",
 sublabel: "Generated media assets",
 },
 {
 label: "Systems",
 value: overview?.summary?.total_systems || 0,
 icon: BarChart3,
 color: "var(--cth-status-info)",
 sublabel: "Tracked system assets",
 },
 ];
 }, [overview]);

 const foundationPct = overview?.summary?.foundation_completion || 0;
 const auditScore = overview?.summary?.brand_audit_score || 0;

 let healthRecommendation;
 if (foundationPct < 50) {
 healthRecommendation = "Complete your Brand Foundation to unlock accurate analytics across all modules.";
 } else if (foundationPct < 80) {
 healthRecommendation = "Your foundation is taking shape. Focus on completing Brand Positioning and Messaging Structure next.";
 } else if (auditScore < 60) {
 healthRecommendation = "Run a Brand Audit to get a full picture of where your brand stands.";
 } else {
 healthRecommendation = "Your brand foundation is strong. Focus on execution and content consistency.";
 }

 const launchFactors = [
 Boolean(workspaceStats?.has_brand_foundation),
 Boolean(workspaceStats?.has_positioning),
 Boolean(workspaceStats?.has_messaging),
 Number(workspaceStats?.total_avatars) > 0,
 Number(workspaceStats?.campaign_count) > 0,
 Number(workspaceStats?.offers_count) > 0,
 ];
 const launchReadiness = Math.round((launchFactors.filter(Boolean).length / 6) * 100);

 if (isLocked) {
 return <LockedOverlay />;
 }

 return (
 <DashboardLayout>
 <TopBar
 title="Analytics"
 subtitle="Track your brand system, content usage, and momentum over time."
 />

 <div className="px-4 py-5 md:px-7">
 {pageError ? (
 <div
 className="mb-4 rounded-xl px-4 py-3 text-sm"
 style={{
 background: "rgba(224,78,53,0.10)",
 border: "1px solid rgba(224,78,53,0.25)",
 color: "var(--cth-command-crimson)",
 }}
 >
 {pageError}
 </div>
 ) : null}

 {loading ? (
 <div className="flex min-h-[320px] items-center justify-center">
 <Loader2 size={24} className="animate-spin cth-text-accent" />
 </div>
 ) : (
 <>
 <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
 {metricCards.map((item) => (
 <MetricCard
 key={item.label}
 label={item.label}
 value={item.value}
 icon={item.icon}
 color={item.color}
 sublabel={item.sublabel}
 />
 ))}
 </div>

 <div className="mb-6 grid gap-5 xl:grid-cols-2">
 <div style={cardStyle}>
 <div className="mb-4 text-sm font-semibold cth-heading">
 AI Usage by Month
 </div>

 {aiUsage.length > 0 ? (
 <ResponsiveContainer width="100%" height={240}>
 <BarChart data={aiUsage}>
 <CartesianGrid strokeDasharray="3 3" stroke={`${colors.tuscany}15`} />
 <XAxis dataKey="month" tick={{ fontSize: 11, fill: colors.textMuted }} />
 <YAxis tick={{ fontSize: 11, fill: colors.textMuted }} />
 <Tooltip contentStyle={tooltipStyle} />
 <Bar dataKey="used" fill="var(--cth-command-crimson)" radius={[4, 4, 0, 0]} name="Used" />
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <EmptyChart text="No AI usage history yet." />
 )}
 </div>

 <div style={cardStyle}>
 <div className="mb-4 text-sm font-semibold cth-heading">
 Brand Progress Over Time
 </div>

 {brandProgress.length > 0 ? (
 <ResponsiveContainer width="100%" height={240}>
 <AreaChart data={brandProgress}>
 <CartesianGrid strokeDasharray="3 3" stroke={`${colors.tuscany}15`} />
 <XAxis
 dataKey="date"
 tick={{ fontSize: 10, fill: colors.textMuted }}
 tickFormatter={(value) => {
 if (!value) return "";
 return String(value).slice(5, 10);
 }}
 />
 <YAxis tick={{ fontSize: 11, fill: colors.textMuted }} domain={[0, 100]} />
 <Tooltip contentStyle={tooltipStyle} />
 <Area
 type="monotone"
 dataKey="overall"
 stroke="var(--cth-command-crimson)"
 fill="var(--cth-command-crimson)22"
 strokeWidth={2}
 name="Overall"
 />
 </AreaChart>
 </ResponsiveContainer>
 ) : (
 <EmptyChart text="Run a brand audit to see progress history." />
 )}
 </div>
 </div>

 <div className="mb-6 grid gap-5 xl:grid-cols-2">
 <div style={cardStyle}>
 <div className="mb-4 text-sm font-semibold cth-heading">
 Content Breakdown
 </div>

 {contentBreakdown.length > 0 ? (
 <ResponsiveContainer width="100%" height={240}>
 <PieChart>
 <Pie
 data={contentBreakdown}
 dataKey="count"
 nameKey="type"
 cx="50%"
 cy="50%"
 outerRadius={84}
 label={({ type, count }) => `${type} (${count})`}
 labelLine={false}
 >
 {contentBreakdown.map((_, index) => (
 <Cell key={`content-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
 ))}
 </Pie>
 <Tooltip contentStyle={tooltipStyle} />
 </PieChart>
 </ResponsiveContainer>
 ) : (
 <EmptyChart text="Generate and save content to see the breakdown." />
 )}
 </div>

 <div style={cardStyle}>
 <div className="mb-4 text-sm font-semibold cth-heading">
 Media Breakdown
 </div>

 {mediaBreakdown.length > 0 ? (
 <ResponsiveContainer width="100%" height={240}>
 <BarChart data={mediaBreakdown}>
 <CartesianGrid strokeDasharray="3 3" stroke={`${colors.tuscany}15`} />
 <XAxis dataKey="type" tick={{ fontSize: 11, fill: colors.textMuted }} />
 <YAxis tick={{ fontSize: 11, fill: colors.textMuted }} />
 <Tooltip contentStyle={tooltipStyle} />
 <Bar dataKey="count" radius={[4, 4, 0, 0]}>
 {mediaBreakdown.map((_, index) => (
 <Cell key={`media-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <EmptyChart text="Generate media to see the breakdown." />
 )}
 </div>
 </div>

 <div style={cardStyle}>
 <div className="mb-4 text-sm font-semibold cth-heading">
 Brand Memory Coverage
 </div>

 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <div className="rounded-xl p-4" style={{ background: "var(--cth-command-panel)" }}>
 <div className="text-xs uppercase tracking-wide cth-muted">Memory Score</div>
 <div className="mt-1 text-2xl font-bold cth-heading">
 {brandMemory?.memory_score ?? 0}%
 </div>
 </div>

 <div className="rounded-xl p-4" style={{ background: "var(--cth-command-panel)" }}>
 <div className="text-xs uppercase tracking-wide cth-muted">Fields Completed</div>
 <div className="mt-1 text-2xl font-bold cth-heading">
 {brandMemory?.completed_fields ?? 0}
 </div>
 </div>

 <div className="rounded-xl p-4" style={{ background: "var(--cth-command-panel)" }}>
 <div className="text-xs uppercase tracking-wide cth-muted">Content Generated</div>
 <div className="mt-1 text-2xl font-bold cth-heading">
 {brandMemory?.utilization?.content_generated ?? 0}
 </div>
 </div>

 <div className="rounded-xl p-4" style={{ background: "var(--cth-command-panel)" }}>
 <div className="text-xs uppercase tracking-wide cth-muted">AI This Month</div>
 <div className="mt-1 text-2xl font-bold cth-heading">
 {brandMemory?.utilization?.ai_generations_this_month ?? 0}
 </div>
 </div>
 </div>

 {Array.isArray(brandMemory?.fields) && brandMemory.fields.length > 0 ? (
 <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
 {brandMemory.fields.map((field) => (
 <div
 key={field.key || field.label}
 className="rounded-xl p-4"
 style={{ background: "var(--cth-command-panel)" }}
 >
 <div className="mb-2 text-sm font-semibold cth-heading">
 {field.label || field.key}
 </div>
 <div className="text-xs cth-muted">
 {field.filled ? "Completed" : "Not completed"}
 </div>
 </div>
 ))}
 </div>
 ) : null}
 </div>

 {/* Brand Health Summary */}
 <div className="mt-6" style={cardStyle}>
 <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
 <div className="text-sm font-semibold cth-heading">
 Brand Health Summary
 </div>
 <PlanBadge label="Foundation+" color="var(--cth-command-crimson)" />
 </div>
 <div className="grid gap-4 md:grid-cols-2">
 <div
 className="rounded-xl p-4"
 style={{
 background: "color-mix(in srgb, var(--cth-command-crimson) 6%, var(--cth-command-panel))",
 border: "1px solid var(--cth-command-border)",
 }}
 >
 <div className="text-xs uppercase tracking-wide cth-muted">Foundation Completion</div>
 <div className="mt-1 text-3xl font-bold cth-heading">{foundationPct}%</div>
 </div>
 <div
 className="rounded-xl p-4"
 style={{
 background: "color-mix(in srgb, var(--cth-status-info) 6%, var(--cth-command-panel))",
 border: "1px solid var(--cth-command-border)",
 }}
 >
 <div className="text-xs uppercase tracking-wide cth-muted">Audit Score</div>
 <div className="mt-1 text-3xl font-bold cth-heading">{auditScore}</div>
 </div>
 </div>
 <p
 className="mt-4"
 style={{
 fontSize: 13,
 lineHeight: 1.65,
 color: "var(--cth-command-ink)",
 margin: "16px 0 0",
 }}
 >
 {healthRecommendation}
 </p>
 </div>

 {/* Strategy Analytics — Structure+ */}
 <div className="mt-8">
 <SectionHeader
 title="Strategy Analytics"
 badgeLabel="Structure+"
 badgeColor="var(--cth-status-info)"
 />
 {isStructurePlus ? (
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <MetricCard
 label="Campaigns Created"
 value={workspaceStats?.campaign_count || 0}
 icon={BarChart3}
 color="var(--cth-status-info)"
 sublabel="Total campaigns built"
 />
 <MetricCard
 label="Offers Built"
 value={workspaceStats?.offers_count || 0}
 icon={FileText}
 color="var(--cth-command-crimson)"
 sublabel="Offers in your library"
 />
 <MetricCard
 label="Content Generated"
 value={workspaceStats?.content_generated || 0}
 icon={Sparkles}
 color="var(--cth-status-success-bright)"
 sublabel="AI content pieces created"
 />
 <MetricCard
 label="Prompts Saved"
 value={workspaceStats?.has_prompts ? "Active" : "None yet"}
 icon={Sparkles}
 color="var(--cth-status-focus)"
 sublabel="Prompt Generator usage"
 />
 </div>
 ) : (
 <UpgradeCard
 heading="Upgrade to Structure to unlock Strategy Analytics"
 body="See campaigns, offers, content output, and prompt usage at a glance. Available on The Structure plan and above."
 ctaLabel="Upgrade to Structure"
 />
 )}
 </div>

 {/* Execution Analytics — House+ */}
 <div className="mt-8">
 <SectionHeader
 title="Execution Analytics"
 badgeLabel="House+"
 badgeColor="var(--cth-status-success-bright)"
 />
 {isHousePlus ? (
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <MetricCard
 label="CRM Contacts"
 value={workspaceStats?.contacts_count || 0}
 icon={Shield}
 color="var(--cth-status-info)"
 sublabel="Contacts in your CRM"
 />
 <MetricCard
 label="Media Generated"
 value={workspaceStats?.total_media || 0}
 icon={Image}
 color="var(--cth-status-warning)"
 sublabel="Media assets created"
 />
 <MetricCard
 label="Social Posts"
 value={workspaceStats?.social_posts || 0}
 icon={BarChart3}
 color="var(--cth-command-crimson)"
 sublabel="Posts created or scheduled"
 />
 <MetricCard
 label="Launch Readiness"
 value={`${launchReadiness}%`}
 icon={TrendingUp}
 color="var(--cth-status-success-bright)"
 sublabel="Across 6 key launch factors"
 />
 </div>
 ) : (
 <UpgradeCard
 heading="Upgrade to The House to unlock Execution Analytics"
 body="See CRM movement, media production, social activity, and launch readiness. Available on The House plan and above."
 ctaLabel="Upgrade to The House"
 />
 )}
 </div>

 {/* Full Analytics — Estate */}
 <div className="mt-8 mb-6">
 <SectionHeader
 title="Full Analytics"
 badgeLabel="Estate"
 badgeColor="var(--cth-command-gold)"
 />
 {isEstate ? (
 <div style={{ ...cardStyle, textAlign: "center" }}>
 <div
 className="mx-auto flex h-12 w-12 items-center justify-center"
 style={{
 borderRadius: 999,
 background: "color-mix(in srgb, var(--cth-command-gold) 14%, transparent)",
 color: "var(--cth-command-gold)",
 marginBottom: 14,
 }}
 >
 <TrendingUp size={18} />
 </div>
 <h4
 style={{
 fontFamily: "'Playfair Display', serif",
 fontSize: 20,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: 0,
 letterSpacing: "-0.005em",
 }}
 >
 Advanced Analytics Coming Soon
 </h4>
 <p
 style={{
 fontSize: 13,
 lineHeight: 1.6,
 color: "var(--cth-command-muted)",
 margin: "10px auto 0",
 maxWidth: 520,
 }}
 >
 Team performance, client vault reporting, cross-workspace insights, and white-label reporting are on the roadmap for Estate.
 </p>
 </div>
 ) : (
 <UpgradeCard
 heading="Upgrade to The Estate to unlock Full Analytics"
 body="Team performance, client vault reporting, cross-workspace insights, and white-label reporting are on the roadmap for Estate."
 ctaLabel="Upgrade to The Estate"
 />
 )}
 </div>
 </>
 )}
 </div>
 </DashboardLayout>
 );
}
