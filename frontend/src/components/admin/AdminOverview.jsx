/**
 * AdminOverview.js — Redesigned Super Admin Overview
 * Uses the extended /api/admin/overview response shape
 */
import React from 'react';

// Brand tokens
const T = {
  bg: '#0D0010', bgCard: '#130018', bgPanel: '#1A0020',
  border: 'rgba(255,255,255,0.07)', borderMid: 'rgba(255,255,255,0.12)',
  aubergine: '#33033C', crimson: '#AF0024', cinnabar: '#E04E35',
  ruby: '#763B5B', tuscany: '#C7A09D', gold: '#C9A84C',
  white: '#fff', t80: 'rgba(255,255,255,0.8)', t60: 'rgba(255,255,255,0.6)',
  t40: 'rgba(255,255,255,0.4)', t30: 'rgba(255,255,255,0.3)',
  t25: 'rgba(255,255,255,0.25)', t15: 'rgba(255,255,255,0.15)',
  t08: 'rgba(255,255,255,0.08)',
  green: '#10B981', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6',
  font: "'DM Sans', -apple-system, sans-serif",
};

function fmt(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '$' + (n / 1000).toFixed(1) + 'k';
  return '$' + (n || 0).toFixed(0);
}

function statusColor(s) {
  return s === 'operational' ? T.green : s === 'degraded' ? T.amber : s === 'down' ? T.red : T.tuscany;
}
function statusLabel(s) {
  return s === 'operational' ? 'Operational' : s === 'degraded' ? 'Degraded' : s === 'down' ? 'Down' : 'Pending';
}

function Sparkline({ data = [], w = 120, h = 32, color = T.cinnabar }) {
  if (data.length < 2) {
    return (<svg width={w} height={h}><line x1={0} y1={h/2} x2={w} y2={h/2} stroke={T.t15} strokeWidth="1" strokeDasharray="3 3" /></svg>);
  }
  const vals = data.map(d => typeof d === 'object' ? d.mrr || 0 : d);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pad = 2;
  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const fill = `M${pts.join(' L')} L${w - pad},${h} L${pad},${h} Z`;
  const line = `M${pts.join(' L')}`;
  const last = pts[pts.length - 1].split(',');
  return (
    <svg width={w} height={h}>
      <path d={fill} fill={color} fillOpacity="0.12" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
    </svg>
  );
}

function DonutChart({ segments = [], size = 80, stroke = 9, label = '', sublabel = '' }) {
  const r = (size / 2) - stroke;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const total = segments.reduce((a, s) => a + (s.count || 0), 0);

  let offset = 0;
  const arcs = total ? segments.map(seg => {
    const len = (seg.count / total) * circ;
    const arc = { offset, len, color: seg.color || T.t25 };
    offset += len;
    return arc;
  }) : [];

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={T.t08} strokeWidth={stroke} />
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={arc.color}
            strokeWidth={stroke} strokeDasharray={`${arc.len} ${circ - arc.len}`}
            strokeDashoffset={-arc.offset} strokeLinecap="butt" />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p style={{ fontSize: 22, fontWeight: 800, color: T.white, margin: 0, lineHeight: 1, fontFamily: T.font }}>{label}</p>
        {sublabel && <p style={{ fontSize: 9, color: T.t40, margin: '2px 0 0', fontFamily: T.font }}>{sublabel}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <div className="flex items-center gap-2">
        <div className="w-[3px] h-4 rounded-sm" style={{ background: T.cinnabar }} />
        <h2 style={{ fontSize: 13, fontWeight: 700, color: T.t80, margin: 0, fontFamily: T.font, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</h2>
      </div>
      {action && <button onClick={onAction} className="bg-transparent border-none cursor-pointer p-0" style={{ fontSize: 11, color: T.cinnabar, fontFamily: T.font }}>{action} &rarr;</button>}
    </div>
  );
}

function KPICard({ icon, value, label, change, sub, accent = T.white }) {
  const cc = !change ? T.t40 : change > 0 ? T.green : T.red;
  return (
    <div className="relative overflow-hidden" style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px' }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 20 }}>{icon}</span>
        {change !== undefined && (
          <span style={{ fontSize: 10, fontWeight: 700, color: cc, background: cc + '18', padding: '2px 7px', borderRadius: 20, fontFamily: T.font }}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <p style={{ fontSize: 26, fontWeight: 800, color: accent, margin: 0, lineHeight: 1, fontFamily: T.font }}>{value}</p>
        <p style={{ fontSize: 11, color: T.t40, margin: '3px 0 0', fontFamily: T.font }}>{label}</p>
      </div>
      {sub && <p style={{ fontSize: 10, color: T.t25, margin: '4px 0 0', fontFamily: T.font }}>{sub}</p>}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl" style={{ background: accent, opacity: 0.2 }} />
    </div>
  );
}

export function AdminOverview({ overview, onTabSwitch }) {
  const d = overview || {};
  const kpis = d.kpis || {};
  const mrrTrend = d.mrrTrend || [];
  const planDist = d.planDistribution || [];
  const tenantHealth = d.tenantHealth || {};
  const platformUsage = d.platformUsage || [];
  const recentActivity = d.recentActivity || [];
  const systemStatus = d.systemStatus || [];

  const maxUsageVal = Math.max(...platformUsage.map(u => u.value || 0)) || 1;
  const healthItems = [
    { label: 'Active',   value: tenantHealth.active || 0,   color: T.green,   desc: 'Generated in last 7d' },
    { label: 'At risk',  value: tenantHealth.atRisk || 0,   color: T.amber,   desc: 'No activity 7-30d' },
    { label: 'Inactive', value: tenantHealth.inactive || 0, color: T.tuscany, desc: 'No activity 30-90d' },
    { label: 'Churned',  value: tenantHealth.churned || 0,  color: T.red,     desc: 'Cancelled plan' },
  ];
  const totalHealth = healthItems.reduce((a, h) => a + h.value, 0) || 1;

  return (
    <div className="flex flex-col gap-3.5" data-testid="admin-overview-redesign">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <KPICard icon="&#x1f464;" value={kpis.totalUsers || 0} label="Total Users" change={kpis.mrrGrowth} sub={`${kpis.newSignups7d || 0} new this week`} accent={T.blue} />
        <KPICard icon="&#x1f3e2;" value={kpis.totalWorkspaces || 0} label="Workspaces" sub="Active tenant spaces" accent={T.tuscany} />
        <KPICard icon="&#x1f4b0;" value={fmt(kpis.mrr || 0)} label="MRR" change={kpis.mrrGrowth} sub="Monthly recurring revenue" accent={T.green} />
        <KPICard icon="&#x26a1;" value={kpis.aiGenerationsMTD || 0} label="AI Generations MTD" sub="Credits consumed this month" accent={T.cinnabar} />
        <KPICard icon="&#x1f4c8;" value={fmt(kpis.avgRevenuePerUser || 0)} label="ARPU" sub="Avg revenue per user" accent={T.gold} />
      </div>

      {/* Revenue + Plan distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3">
        {/* MRR Trend */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <SectionHeader title="MRR Trend" action="Full analytics" onAction={() => onTabSwitch?.('analytics')} />
          <div className="flex items-end justify-between mb-4">
            <div>
              <p style={{ fontSize: 32, fontWeight: 800, color: T.white, margin: 0, fontFamily: T.font }}>{fmt(kpis.mrr || 0)}</p>
              <p style={{ fontSize: 11, color: T.t40, margin: '2px 0 0', fontFamily: T.font }}>Monthly Recurring Revenue</p>
            </div>
            <Sparkline data={mrrTrend} w={140} h={48} color={T.cinnabar} />
          </div>
          <div className="flex gap-1.5 items-end h-12">
            {mrrTrend.map((m, i) => {
              const maxMrr = Math.max(...mrrTrend.map(x => x.mrr)) || 1;
              const barH = Math.max(4, Math.round((m.mrr / maxMrr) * 44));
              const isLast = i === mrrTrend.length - 1;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div style={{ width: '100%', height: barH, background: isLast ? T.cinnabar : T.t15, borderRadius: 3, transition: 'height 0.3s' }} />
                  <span style={{ fontSize: 9, color: T.t25, fontFamily: T.font }}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plan distribution donut */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <SectionHeader title="MRR by Plan" />
          <div className="flex items-center gap-4 mb-3.5">
            <DonutChart segments={planDist} size={80} stroke={9} label={String(kpis.totalWorkspaces || 0)} sublabel="workspaces" />
            <div className="flex-1 flex flex-col gap-1.5">
              {planDist.map(p => (
                <div key={p.plan} className="flex items-center gap-1.5">
                  <div className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: p.color }} />
                  <span style={{ fontSize: 11, color: T.t60, flex: 1, fontFamily: T.font }}>{p.plan}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.t40, fontFamily: T.font }}>{p.count}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.white, fontFamily: T.font }}>{fmt(p.mrr)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
            <div className="flex justify-between">
              <span style={{ fontSize: 10, color: T.t25, fontFamily: T.font }}>Total MRR</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: T.font }}>{fmt(kpis.mrr || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant health */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
        <SectionHeader title="Tenant Health" action="View all tenants" onAction={() => onTabSwitch?.('tenants')} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
          {healthItems.map(h => (
            <div key={h.label} style={{ padding: '12px 14px', background: T.bgPanel, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: h.color, margin: '0 0 3px', lineHeight: 1, fontFamily: T.font }}>{h.value}</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: T.t60, margin: '0 0 2px', fontFamily: T.font }}>{h.label}</p>
              <p style={{ fontSize: 9.5, color: T.t25, margin: 0, fontFamily: T.font }}>{h.desc}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 h-1.5 rounded-sm overflow-hidden">
          {healthItems.map(h => h.value > 0 ? (
            <div key={h.label} style={{ width: `${Math.max(4, (h.value / totalHealth) * 100)}%`, background: h.color, borderRadius: 3 }} />
          ) : null)}
          {totalHealth <= 0 && <div className="w-full rounded-sm" style={{ background: T.t08 }} />}
        </div>
        <p style={{ fontSize: 10, color: T.t25, margin: '5px 0 0', fontFamily: T.font }}>
          {kpis.newSignups7d || 0} new signup{(kpis.newSignups7d || 0) !== 1 ? 's' : ''} this week
        </p>
      </div>

      {/* Platform usage */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
        <SectionHeader title="Platform Usage (MTD)" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {platformUsage.map(item => {
            const barH = Math.max(item.value > 0 ? 8 : 3, (item.value / maxUsageVal) * 48);
            return (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <div className="w-full flex items-end justify-center" style={{ height: 52 }}>
                  <div style={{ width: '60%', height: barH, background: item.value > 0 ? T.cinnabar : T.t08, borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }} />
                </div>
                <p style={{ fontSize: 18, fontWeight: 800, color: item.value > 0 ? T.white : T.t25, margin: '0 0 2px', lineHeight: 1, fontFamily: T.font }}>{item.value}</p>
                <p style={{ fontSize: 9.5, color: T.t25, margin: 0, fontFamily: T.font, textAlign: 'center' }}>{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity + System status */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
        {/* Recent activity */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <SectionHeader title="Recent Activity" />
          {recentActivity.length === 0 ? (
            <p style={{ fontSize: 12, color: T.t25, fontFamily: T.font }}>No recent activity.</p>
          ) : (
            <div className="flex flex-col">
              {recentActivity.map((event, i) => (
                <div key={i} className="flex items-start gap-3" style={{ padding: '10px 0', borderBottom: i < recentActivity.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div className="flex-shrink-0 flex items-center justify-center text-sm" style={{ width: 28, height: 28, borderRadius: 8, background: T.bgPanel }}>{event.icon}</div>
                  <div className="flex-1">
                    <p style={{ fontSize: 12, color: T.t80, margin: '0 0 2px', fontFamily: T.font, lineHeight: 1.4 }}>{event.text}</p>
                    <p style={{ fontSize: 10, color: T.t25, margin: 0, fontFamily: T.font }}>{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System status */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <SectionHeader title="System Status" />
          <div className="flex flex-col">
            {systemStatus.map((svc, i) => {
              const sc = statusColor(svc.status);
              return (
                <div key={svc.label} className="flex items-center gap-2.5" style={{ padding: '9px 0', borderBottom: i < systemStatus.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div className="flex-shrink-0" style={{ width: 7, height: 7, borderRadius: '50%', background: sc, boxShadow: svc.status === 'operational' ? `0 0 6px ${sc}66` : 'none' }} />
                  <span style={{ fontSize: 12, color: T.t60, flex: 1, fontFamily: T.font }}>{svc.label}</span>
                  <span style={{ fontSize: 10, color: sc, fontFamily: T.font }}>{statusLabel(svc.status)}</span>
                  {svc.latency !== '\u2014' && <span style={{ fontSize: 9.5, color: T.t25, fontFamily: T.font, minWidth: 34, textAlign: 'right' }}>{svc.latency}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5" style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}66` }} />
            <span style={{ fontSize: 11, color: T.green, fontWeight: 600, fontFamily: T.font }}>All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
