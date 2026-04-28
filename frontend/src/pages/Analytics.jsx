import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
 BarChart3,
 FileText,
 Image,
 Loader2,
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
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const CHART_COLORS = ["var(--cth-admin-accent)", "var(--cth-brand-primary)", "var(--cth-admin-ruby)", "var(--cth-status-info)", "var(--cth-status-success-bright)", "var(--cth-status-warning)"];

function MetricCard({ label, value, icon: Icon, color, sublabel }) {
 return (
 <div
 className="rounded-2xl p-4"
 style={{
 background: "var(--cth-admin-panel)",
 border: "1px solid var(--cth-admin-border)",
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

export default function Analytics() {
 const colors = useColors();

 const [loading, setLoading] = useState(true);
 const [pageError, setPageError] = useState("");

 const [overview, setOverview] = useState(null);
 const [brandProgress, setBrandProgress] = useState([]);
 const [aiUsage, setAiUsage] = useState([]);
 const [contentBreakdown, setContentBreakdown] = useState([]);
 const [mediaBreakdown, setMediaBreakdown] = useState([]);
 const [brandMemory, setBrandMemory] = useState(null);

 const tooltipStyle = useMemo(
 () => ({
 backgroundColor: "var(--cth-admin-panel)",
 border: "1px solid rgba(175,0,36,0.3)",
 borderRadius: 8,
 fontSize: 12,
 color: "var(--cth-admin-ink)",
 }),
 []
 );

 const cardStyle = useMemo(
 () => ({
 background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175,0,36,0.06))`,
 border: `1px solid ${colors.tuscany}22`,
 borderRadius: 16,
 padding: "20px",
 }),
 [colors]
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

 setOverview(overviewRes?.summary || null);
 setBrandProgress(progressRes?.progress || []);
 setAiUsage(usageRes?.usage || []);
 setContentBreakdown(contentRes?.breakdown || []);
 setMediaBreakdown(mediaRes?.breakdown || []);
 setBrandMemory(memoryRes || null);
 } catch (error) {
 console.error("Failed to load analytics", error);
 setPageError(error?.message || "Failed to load analytics.");
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 loadAnalytics();
 }, [loadAnalytics]);

 const metricCards = useMemo(() => {
 return [
 {
 label: "Foundation",
 value: `${overview?.foundation_completion || 0}%`,
 icon: Shield,
 color: "var(--cth-admin-accent)",
 sublabel: "Strategic foundation completion",
 },
 {
 label: "Audit Score",
 value: overview?.brand_audit_score || 0,
 icon: TrendingUp,
 color: "var(--cth-status-info)",
 sublabel: "Latest brand score",
 },
 {
 label: "AI This Month",
 value: overview?.ai_generations_this_month || 0,
 icon: Sparkles,
 color: "var(--cth-status-focus)",
 sublabel: "Generations used this month",
 },
 {
 label: "Content",
 value: overview?.total_content || 0,
 icon: FileText,
 color: "var(--cth-status-success-bright)",
 sublabel: "Saved content assets",
 },
 {
 label: "Media",
 value: overview?.total_media || 0,
 icon: Image,
 color: "var(--cth-status-warning)",
 sublabel: "Generated media assets",
 },
 {
 label: "Systems",
 value: overview?.total_systems || 0,
 icon: BarChart3,
 color: "var(--cth-status-info)",
 sublabel: "Tracked system assets",
 },
 ];
 }, [overview]);

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
 color: "var(--cth-admin-accent)",
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
 <Bar dataKey="used" fill="var(--cth-admin-accent)" radius={[4, 4, 0, 0]} name="Used" />
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
 stroke="var(--cth-admin-accent)"
 fill="var(--cth-admin-accent)22"
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
 <div className="rounded-xl p-4" style={{ background: "var(--cth-admin-panel)" }}>
 <div className="text-xs uppercase tracking-wide cth-muted">Memory Score</div>
 <div className="mt-1 text-2xl font-bold cth-heading">
 {brandMemory?.memory_score ?? 0}%
 </div>
 </div>

 <div className="rounded-xl p-4" style={{ background: "var(--cth-admin-panel)" }}>
 <div className="text-xs uppercase tracking-wide cth-muted">Fields Completed</div>
 <div className="mt-1 text-2xl font-bold cth-heading">
 {brandMemory?.completed_fields ?? 0}
 </div>
 </div>

 <div className="rounded-xl p-4" style={{ background: "var(--cth-admin-panel)" }}>
 <div className="text-xs uppercase tracking-wide cth-muted">Content Generated</div>
 <div className="mt-1 text-2xl font-bold cth-heading">
 {brandMemory?.utilization?.content_generated ?? 0}
 </div>
 </div>

 <div className="rounded-xl p-4" style={{ background: "var(--cth-admin-panel)" }}>
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
 style={{ background: "var(--cth-admin-panel)" }}
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
 </>
 )}
 </div>
 </DashboardLayout>
 );
}
