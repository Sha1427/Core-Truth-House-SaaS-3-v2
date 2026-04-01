import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Users,
  MousePointerClick,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useColors } from '../../context/ThemeContext';
import { StatCard, PLAN_COLORS } from './shared';

const API = import.meta.env.VITE_BACKEND_URL;

const PIE_COLORS = ['#e04e35', '#763b5b', '#AF0024', '#22c55e', '#f59e0b', '#4a3550', '#3b82f6'];

export function AdminAnalytics({ adminId, overview }) {
  const colors = useColors();

  const [loading, setLoading] = useState(true);
  const [growth, setGrowth] = useState({});
  const [usage, setUsage] = useState({});
  const [affClicks, setAffClicks] = useState([]);
  const [promptStats, setPromptStats] = useState([]);

  useEffect(() => {
    if (!adminId) return;
    fetchAnalytics();
  }, [adminId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [growthRes, usageRes, affRes, promptRes] = await Promise.all([
        axios
          .get(`${API}/api/admin/analytics/growth`, {
            params: { admin_id: adminId, days: 30 },
          })
          .catch(() => ({ data: {} })),
        axios
          .get(`${API}/api/admin/analytics/usage`, {
            params: { admin_id: adminId },
          })
          .catch(() => ({ data: {} })),
        axios
          .get(`${API}/api/admin/affiliate-links`, {
            params: { admin_id: adminId },
          })
          .catch(() => ({ data: { links: [] } })),
        axios
          .get(`${API}/api/admin/preloaded-prompts`, {
            params: { admin_id: adminId },
          })
          .catch(() => ({ data: { prompts: [] } })),
      ]);

      setGrowth(growthRes.data || {});
      setUsage(usageRes.data || {});
      setAffClicks(Array.isArray(affRes.data?.links) ? affRes.data.links : []);
      setPromptStats(Array.isArray(promptRes.data?.prompts) ? promptRes.data.prompts : []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const signupData = useMemo(() => {
    const raw = Array.isArray(growth?.growth) ? growth.growth : [];
    return raw.map((item) => ({
      date: String(item.date || '').slice(5),
      signups: item.new_workspaces || 0,
    }));
  }, [growth]);

  const contentData = useMemo(() => {
    const byType = usage?.content_by_type || {};
    return Object.entries(byType)
      .map(([type, count]) => ({
        name: type.replace(/_/g, ' '),
        count: Number(count) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [usage]);

  const planRevData = useMemo(() => {
    const byPlan = overview?.mrr?.by_plan || {};
    return Object.entries(byPlan).map(([plan, data]) => ({
      name: plan.charAt(0).toUpperCase() + plan.slice(1),
      mrr: Number(data?.mrr) || 0,
      subscribers: Number(data?.subscribers) || 0,
      color: PLAN_COLORS?.[plan] || '#4a3550',
    }));
  }, [overview]);

  const topAffiliates = useMemo(() => {
    return [...affClicks]
      .sort((a, b) => (Number(b.clicks) || 0) - (Number(a.clicks) || 0))
      .slice(0, 5);
  }, [affClicks]);

  const promptCatData = useMemo(() => {
    const promptsByCategory = {};
    promptStats.forEach((p) => {
      const category = p?.category || 'general';
      promptsByCategory[category] = (promptsByCategory[category] || 0) + 1;
    });

    return Object.entries(promptsByCategory).map(([name, count]) => ({
      name,
      count,
    }));
  }, [promptStats]);

  const affiliateClickTotal = useMemo(() => {
    return affClicks.reduce((sum, item) => sum + (Number(item.clicks) || 0), 0);
  }, [affClicks]);

  const aiGenerationTotal =
    Number(overview?.ai_generations_this_month) ||
    Number(usage?.totals?.content) ||
    0;

  const growthTotal = useMemo(() => {
    return signupData.reduce((sum, item) => sum + (Number(item.signups) || 0), 0);
  }, [signupData]);

  const platformTotals = useMemo(() => {
    return usage?.totals ? Object.entries(usage.totals) : [];
  }, [usage]);

  const chartTooltipStyle = {
    background: colors.darkest,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    color: colors.textPrimary,
    fontSize: 12,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#e04e35]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-analytics-tab">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="New Workspaces (30d)"
          value={growthTotal}
          color="#e04e35"
        />
        <StatCard
          icon={Sparkles}
          label="AI Generations"
          value={aiGenerationTotal}
          color="#763b5b"
        />
        <StatCard
          icon={MousePointerClick}
          label="Affiliate Clicks"
          value={affiliateClickTotal}
          color="#22c55e"
        />
        <StatCard
          icon={FileText}
          label="Preloaded Prompts"
          value={promptStats.length}
          color="#f59e0b"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div
          className="p-6 rounded-2xl border"
          style={{ background: colors.darker, borderColor: colors.border }}
        >
          <h3 style={{ color: colors.textPrimary, fontWeight: 600, marginBottom: 16 }}>
            Workspace Growth (30 days)
          </h3>
          <div className="h-[250px]">
            {signupData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signupData}>
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e04e35" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e04e35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis dataKey="date" tick={{ fill: colors.textMuted, fontSize: 10 }} />
                  <YAxis tick={{ fill: colors.textMuted, fontSize: 10 }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    stroke="#e04e35"
                    fill="url(#signupGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full" style={{ color: colors.textMuted }}>
                No growth data yet
              </div>
            )}
          </div>
        </div>

        <div
          className="p-6 rounded-2xl border"
          style={{ background: colors.darker, borderColor: colors.border }}
        >
          <h3 style={{ color: colors.textPrimary, fontWeight: 600, marginBottom: 16 }}>
            Revenue by Plan
          </h3>
          <div className="h-[250px]">
            {planRevData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planRevData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis dataKey="name" tick={{ fill: colors.textMuted, fontSize: 11 }} />
                  <YAxis tick={{ fill: colors.textMuted, fontSize: 10 }} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => [`$${value}`, 'MRR']}
                  />
                  <Bar dataKey="mrr" radius={[6, 6, 0, 0]}>
                    {planRevData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full" style={{ color: colors.textMuted }}>
                No revenue data yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div
          className="p-6 rounded-2xl border"
          style={{ background: colors.darker, borderColor: colors.border }}
        >
          <h3 style={{ color: colors.textPrimary, fontWeight: 600, marginBottom: 16 }}>
            Content Generation by Type
          </h3>
          <div className="h-[250px]">
            {contentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis type="number" tick={{ fill: colors.textMuted, fontSize: 10 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fill: colors.textMuted, fontSize: 10 }}
                    width={110}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="#e04e35" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full" style={{ color: colors.textMuted }}>
                No content data yet
              </div>
            )}
          </div>
        </div>

        <div
          className="p-6 rounded-2xl border"
          style={{ background: colors.darker, borderColor: colors.border }}
        >
          <h3 style={{ color: colors.textPrimary, fontWeight: 600, marginBottom: 16 }}>
            Affiliate Link Performance
          </h3>
          {topAffiliates.length > 0 ? (
            <div className="space-y-3">
              {topAffiliates.map((link, i) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: colors.darkest }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{
                      background: i === 0 ? '#e04e35' : i === 1 ? '#763b5b' : '#4a3550',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                      {link.title}
                    </div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>
                      {link.commission || 'No commission set'}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold" style={{ color: colors.cinnabar }}>
                      {link.clicks || 0}
                    </div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>
                      clicks
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]" style={{ color: colors.textMuted }}>
              No affiliate links yet
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div
          className="p-6 rounded-2xl border"
          style={{ background: colors.darker, borderColor: colors.border }}
        >
          <h3 style={{ color: colors.textPrimary, fontWeight: 600, marginBottom: 16 }}>
            Prompts by Category
          </h3>
          <div className="h-[200px]">
            {promptCatData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={promptCatData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                  >
                    {promptCatData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full" style={{ color: colors.textMuted }}>
                No prompts yet
              </div>
            )}
          </div>

          {promptCatData.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {promptCatData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-xs capitalize" style={{ color: colors.textMuted }}>
                    {item.name}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="p-6 rounded-2xl border"
          style={{ background: colors.darker, borderColor: colors.border }}
        >
          <h3 style={{ color: colors.textPrimary, fontWeight: 600, marginBottom: 16 }}>
            Platform Totals
          </h3>

          {platformTotals.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {platformTotals.slice(0, 8).map(([key, value]) => (
                <div
                  key={key}
                  className="p-4 rounded-xl text-center"
                  style={{ background: colors.darkest }}
                >
                  <div className="text-2xl font-bold" style={{ color: colors.cinnabar }}>
                    {value}
                  </div>
                  <div className="text-xs capitalize" style={{ color: colors.textMuted }}>
                    {key.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px]" style={{ color: colors.textMuted }}>
              No platform totals yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
