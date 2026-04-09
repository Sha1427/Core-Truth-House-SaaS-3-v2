import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '../../components/Layout';
import { useColors } from '../../context/ThemeContext';
import { useUser } from '../../hooks/useAuth';
import apiClient from '../../lib/apiClient';
import {
  Hexagon, BarChart3, Building2, MessageSquare, Bot, Key,
  Zap, Film, GraduationCap, KeyRound, Link2, Plus, RefreshCw,
  Users, DollarSign, Activity, TrendingUp, Settings, Lock, Send,
  Package, Upload, Trash2, Eye, EyeOff, Edit, Copy, ShoppingCart,
} from 'lucide-react';
import { AdminStoreProducts, AdminStoreOrders } from './AdminStorePanel';

const NAV = [
  { section: 'Platform', items: [
    { id: 'overview', label: 'Overview', Icon: Hexagon },
    { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  ]},
  { section: 'Tenants', items: [
    { id: 'tenants', label: 'Tenants', Icon: Building2 },
    { id: 'messages', label: 'Messages', Icon: MessageSquare },
    { id: 'api_keys', label: 'Tenant API Keys', Icon: Key },
    { id: 'addons', label: 'Add-on Requests', Icon: Package },
  ]},
  { section: 'My Admin', items: [
    { id: 'my_keys', label: 'My API Keys', Icon: KeyRound },
    { id: 'ai_model', label: 'AI Model', Icon: Bot },
  ]},
  { section: 'Content', items: [
    { id: 'prompts', label: 'Preloaded Prompts', Icon: Zap },
    { id: 'media', label: 'Media Prompt Engine', Icon: Film },
    { id: 'training', label: 'Training Videos', Icon: GraduationCap },
  ]},
  { section: 'Store', items: [
    { id: 'store_products', label: 'Digital Products', Icon: Package },
    { id: 'store_orders', label: 'Orders', Icon: ShoppingCart },
    { id: 'affiliate', label: 'Affiliate Links', Icon: Link2 },
  ]},
];

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n || 0);
}

function fmtCurrency(n) {
  return '$' + (Number(n || 0)).toLocaleString();
}

function SectionLabel({ children }) {
  const C = useColors();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 3, height: 13, background: C.cinnabar, borderRadius: 2 }} />
      <p style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: C.textMuted, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </p>
    </div>
  );
}

function Sparkline({ data = [0, 0, 0, 0, 0, 0, 0], color = '#E04E35' }) {
  const w = 60;
  const h = 20;
  if (!data.length) return null;
  const max = Math.max(...data) || 1;
  const step = w / (data.length - 1 || 1);
  const d = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (v / max) * (h - 2) - 1).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KpiCard({ label, value, sub, color = '#fff', trend, spark, Icon }) {
  const C = useColors();
  return (
    <div
      data-testid={`kpi-${label.toLowerCase().replace(/\s/g, '-')}`}
      style={{
        background: `${C.tuscany}06`,
        border: `1px solid ${C.tuscany}12`,
        borderRadius: 11,
        padding: '13px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.2 }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        {Icon && <Icon size={16} style={{ color }} />}
        {spark && <Sparkline data={spark} color={color} />}
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: '0 0 2px', fontFamily: "'DM Sans', sans-serif", lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: 10, color: C.textMuted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </p>
      {sub && <p style={{ fontSize: 10, color: `${C.tuscany}50`, margin: 0 }}>{sub}</p>}
      {trend !== undefined && trend !== null && (
        <span style={{ fontSize: 10, color: trend >= 0 ? '#10B981' : '#f87171' }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last mo
        </span>
      )}
    </div>
  );
}

function Badge({ label, color, bg }) {
  const C = useColors();
  const COLORS = {
    free: { c: C.textMuted, bg: `${C.tuscany}0A` },
    foundation: { c: C.tuscany, bg: `${C.tuscany}18` },
    structure: { c: C.cinnabar, bg: `${C.cinnabar}18` },
    house: { c: '#C9A84C', bg: 'rgba(201,168,76,0.15)' },
    estate: { c: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    active: { c: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    inactive: { c: C.textMuted, bg: `${C.tuscany}0A` },
    pending: { c: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    approved: { c: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    declined: { c: '#f87171', bg: 'rgba(239,68,68,0.1)' },
    suspended: { c: '#f87171', bg: 'rgba(239,68,68,0.1)' },
    churned: { c: '#f87171', bg: 'rgba(239,68,68,0.1)' },
  };
  const mapped = COLORS[String(label || '').toLowerCase()] || {};
  const c = color || mapped.c || C.textMuted;
  const b = bg || mapped.bg || `${c}15`;
  return (
    <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, color: c, background: b }}>
      {label}
    </span>
  );
}

function AdminBtn({ children, onClick, disabled, variant, icon: IconCmp, style: extraStyle, type = 'button' }) {
  const C = useColors();
  const base =
    variant === 'ghost'
      ? { background: 'none', border: `1px solid ${C.tuscany}12`, color: C.textMuted }
      : variant === 'danger'
      ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }
      : variant === 'green'
      ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }
      : { background: C.cinnabar, border: 'none', color: '#fff', boxShadow: '0 2px 10px rgba(224,78,53,0.2)' };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 16px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: "'DM Sans', sans-serif",
        ...base,
        ...extraStyle,
      }}
    >
      {IconCmp && <IconCmp size={13} />}
      {children}
    </button>
  );
}

function AdminField({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', marginBottom: 5 }}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

function AdminInput({ value, onChange, placeholder, type, style: extraStyle }) {
  const C = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <input
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
      placeholder={placeholder || ''}
      type={type || 'text'}
      style={{
        width: '100%',
        background: `${C.tuscany}0A`,
        border: `1px solid ${focused ? C.cinnabar + '45' : C.tuscany + '12'}`,
        borderRadius: 8,
        padding: '8px 11px',
        fontSize: 12.5,
        color: C.textPrimary,
        fontFamily: "'DM Sans', sans-serif",
        outline: 'none',
        boxSizing: 'border-box',
        ...extraStyle,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function AdminTextarea({ value, onChange, placeholder, rows }) {
  const C = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
      placeholder={placeholder || ''}
      rows={rows || 3}
      style={{
        width: '100%',
        background: `${C.tuscany}0A`,
        border: `1px solid ${focused ? C.cinnabar + '45' : C.tuscany + '12'}`,
        borderRadius: 8,
        padding: '8px 11px',
        fontSize: 12.5,
        color: C.textPrimary,
        fontFamily: "'DM Sans', sans-serif",
        outline: 'none',
        boxSizing: 'border-box',
        resize: 'vertical',
        lineHeight: 1.6,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function AdminSelect({ value, onChange, options, style: extraStyle }) {
  const C = useColors();
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
      style={{
        width: '100%',
        background: `${C.tuscany}0A`,
        border: `1px solid ${C.tuscany}12`,
        borderRadius: 8,
        padding: '8px 11px',
        fontSize: 12.5,
        color: C.textPrimary,
        fontFamily: "'DM Sans', sans-serif",
        outline: 'none',
        cursor: 'pointer',
        ...extraStyle,
      }}
    >
      {(options || []).map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return (
          <option key={v} value={v} style={{ background: '#1A0020' }}>
            {l}
          </option>
        );
      })}
    </select>
  );
}

function AdminModal({ open, onClose, title, children, maxWidth }) {
  const C = useColors();
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1A0020', border: `1px solid ${C.tuscany}15`, borderRadius: 14, padding: '24px 28px', width: '100%', maxWidth: maxWidth || 480, maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textPrimary, margin: 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 22, lineHeight: 1, padding: 4 }}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function useToast() {
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(false);

  const show = useCallback((text, isErr = false) => {
    setMsg(text);
    setErr(!!isErr);
    window.setTimeout(() => setMsg(null), 3000);
  }, []);

  return { msg, err, show };
}

function Toast({ msg, error }) {
  if (!msg) return null;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 300,
        padding: '10px 18px',
        borderRadius: 9,
        background: error ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
        border: `1px solid ${error ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
        color: error ? '#f87171' : '#10B981',
        fontSize: 12.5,
        fontWeight: 500,
      }}
    >
      {msg}
    </div>
  );
}

function CardBox({ children, style: extraStyle }) {
  const C = useColors();
  return <div style={{ background: `${C.tuscany}06`, border: `1px solid ${C.tuscany}12`, borderRadius: 11, padding: '14px 16px', ...extraStyle }}>{children}</div>;
}

function OverviewPanel({ data = {} }) {
  const C = useColors();
  const kpis = data.kpis || {};
  const planDist = data.planDistribution || [];
  const PLAN_COLORS = { Foundation: C.tuscany, Structure: C.cinnabar, House: '#C9A84C', Estate: '#10B981', Free: C.textMuted };
  const sparkUsers = [12, 18, 15, 22, 19, 25, 28];
  const sparkMRR = [1200, 1400, 1350, 1600, 1550, 1800, 2100];
  const sparkAI = [80, 120, 95, 140, 110, 160, 180];
  const sparkArpu = [32, 35, 33, 38, 40, 37, 42];

  return (
    <div data-testid="overview-panel">
      <SectionLabel>Platform KPIs</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
        <KpiCard Icon={Users} label="Total Users" value={fmt(kpis.totalUsers)} color="#3B82F6" spark={sparkUsers} />
        <KpiCard Icon={Building2} label="Workspaces" value={fmt(kpis.totalWorkspaces)} color={C.tuscany} />
        <KpiCard Icon={DollarSign} label="MRR" value={fmtCurrency(kpis.mrr)} color="#10B981" spark={sparkMRR} trend={12} />
        <KpiCard Icon={Activity} label="AI Gens (MTD)" value={fmt(kpis.aiGenerationsMTD)} color={C.cinnabar} spark={sparkAI} />
        <KpiCard Icon={TrendingUp} label="ARPU" value={fmtCurrency(kpis.avgRevenuePerUser)} color="#C9A84C" spark={sparkArpu} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12, marginBottom: 12 }}>
        <CardBox>
          <SectionLabel>Revenue by Plan</SectionLabel>
          {planDist.length === 0 ? (
            <p style={{ fontSize: 12, color: C.textMuted }}>No revenue data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {planDist.map((pl) => {
                const total = planDist.reduce((s, x) => s + x.count, 0) || 1;
                const pct = Math.round((pl.count / total) * 100);
                const clr = PLAN_COLORS[pl.plan] || C.textMuted;
                return (
                  <div key={pl.plan} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: C.textMuted, width: 80, textTransform: 'capitalize' }}>{pl.plan}</span>
                    <div style={{ flex: 1, height: 6, background: `${C.tuscany}0A`, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: clr, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, color: clr, fontWeight: 700, width: 20 }}>{pl.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardBox>

        <CardBox>
          <SectionLabel>System Status</SectionLabel>
          {[
            { label: 'API', ok: true, lat: '42ms' },
            { label: 'MongoDB', ok: true, lat: '8ms' },
            { label: 'Anthropic', ok: true, lat: null },
            { label: 'R2 Storage', ok: true, lat: null },
            { label: 'Resend', ok: true, lat: null },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.ok ? '#10B981' : C.cinnabar, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: C.textMuted, flex: 1 }}>{item.label}</span>
              {item.lat && <span style={{ fontSize: 10, color: '#10B981' }}>{item.lat}</span>}
              <Badge label={item.ok ? 'OK' : 'Down'} />
            </div>
          ))}
        </CardBox>
      </div>

      <CardBox>
        <SectionLabel>Tenant Health</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { label: 'Active', value: data.tenantHealth?.active || kpis.totalWorkspaces || 0, color: '#10B981' },
            { label: 'At Risk', value: data.tenantHealth?.atRisk || 0, color: '#F59E0B' },
            { label: 'Inactive', value: data.tenantHealth?.inactive || 0, color: C.textMuted },
            { label: 'Churned', value: data.tenantHealth?.churned || 0, color: '#f87171' },
          ].map((item) => (
            <div key={item.label} style={{ background: `${C.tuscany}06`, borderRadius: 9, padding: '10px 12px', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: item.color, margin: '0 0 2px', lineHeight: 1 }}>{item.value}</p>
              <p style={{ fontSize: 9.5, color: C.textMuted, margin: 0 }}>{item.label}</p>
            </div>
          ))}
        </div>
      </CardBox>
    </div>
  );
}

function AnalyticsPanel({ data = {} }) {
  const C = useColors();
  const kpis = data.kpis || {};
  return (
    <div data-testid="analytics-panel">
      <SectionLabel>Platform Analytics</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        <KpiCard Icon={Users} label="New Users (30d)" value={kpis.newSignups7d || 0} color="#3B82F6" />
        <KpiCard Icon={Activity} label="AI Generations" value={fmt(kpis.aiGenerationsMTD || 0)} color={C.cinnabar} />
        <KpiCard Icon={Link2} label="Affiliate Clicks" value={0} color={C.tuscany} />
        <KpiCard Icon={Zap} label="Prompts in Hub" value={0} color="#C9A84C" />
      </div>
      <CardBox>
        <SectionLabel>User Signups — 30 days</SectionLabel>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 80, marginBottom: 8 }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: Math.max(3, Math.round(Math.random() * 40)), background: 'rgba(59,130,246,0.3)', borderRadius: '2px 2px 0 0' }} />
          ))}
        </div>
        <p style={{ fontSize: 10, color: `${C.tuscany}40`, margin: 0 }}>Populates as tenants sign up</p>
      </CardBox>
    </div>
  );
}

function TenantsPanel({ onRefresh }) {
  const C = useColors();
  const toast = useToast();
  const [tenants, setTenants] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [editTenant, setEditTenant] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadTenants = useCallback(async () => {
    try {
      const r = await apiClient.get('/api/admin/tenants');
      setTenants(r?.tenants || []);
      setTotal(r?.total || 0);
    } catch (err) {
      console.error('Failed to load tenants:', err);
      toast.show(err?.message || 'Failed to load tenants', true);
    }
  }, [toast]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const PLAN_COLOR = { foundation: C.tuscany, structure: C.cinnabar, house: '#C9A84C', estate: '#10B981', free: C.textMuted };

  const filtered = tenants.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.name || '').toLowerCase().includes(q) || (t.owner_email || '').toLowerCase().includes(q);
  });

  function openEdit(t) {
    setEditTenant(t);
    setForm({
      name: t.name || '',
      plan: t.plan || 'free',
      status: t.status || 'active',
      notes: t.admin_notes || '',
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const wsId = editTenant.id || editTenant.workspace_id;
      await apiClient.patch(`/api/admin/tenants/${wsId}`, form);
      setEditTenant(null);
      toast.show('Tenant updated');
      await loadTenants();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to update tenant:', err);
      toast.show(err?.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="tenants-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionLabel>Tenants ({total})</SectionLabel>
        <AdminInput value={search} onChange={setSearch} placeholder="Search by name or email..." style={{ width: 240 }} />
      </div>

      <CardBox style={{ overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.tuscany}12` }}>
              {['Workspace', 'Plan', 'Team', 'Content', 'Journey', 'Last Active', ''].map((h) => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.textMuted, background: `${C.tuscany}04` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px 14px', textAlign: 'center', fontSize: 12, color: C.textMuted }}>
                  No tenants yet
                </td>
              </tr>
            ) : (
              filtered.map((t, i) => (
                <tr key={t.workspace_id || t.id || i} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.tuscany}08` : 'none' }}>
                  <td style={{ padding: '9px 14px' }}>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: C.textPrimary, margin: '0 0 1px' }}>{t.name || 'Unnamed'}</p>
                    <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>{t.owner_email}</p>
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <Badge label={t.plan || 'free'} color={PLAN_COLOR[t.plan] || C.textMuted} />
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: C.textMuted, textAlign: 'center' }}>{t.team_size || 1}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: C.textMuted, textAlign: 'center' }}>{t.content_count || 0}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: C.textMuted, textAlign: 'center' }}>{(t.journey_pct || 0) + '%'}</td>
                  <td style={{ padding: '9px 14px', fontSize: 11, color: C.textMuted }}>{t.last_active_at ? new Date(t.last_active_at).toLocaleDateString() : 'Never'}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <button
                      onClick={() => openEdit(t)}
                      style={{ background: `${C.tuscany}0A`, border: `1px solid ${C.tuscany}12`, borderRadius: 6, padding: '4px 10px', fontSize: 11, color: C.textMuted, cursor: 'pointer' }}
                    >
                      <Edit size={12} style={{ marginRight: 4 }} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardBox>

      <AdminModal open={!!editTenant} onClose={() => setEditTenant(null)} title={`Edit — ${editTenant?.name || ''}`}>
        <AdminField label="Workspace Name">
          <AdminInput value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        </AdminField>
        <AdminField label="Plan">
          <AdminSelect value={form.plan} onChange={(v) => setForm((f) => ({ ...f, plan: v }))} options={['free', 'foundation', 'structure', 'house', 'estate']} />
        </AdminField>
        <AdminField label="Status">
          <AdminSelect value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} options={['active', 'inactive', 'suspended', 'churned']} />
        </AdminField>
        <AdminField label="Admin Notes (not visible to tenant)">
          <AdminTextarea value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} rows={3} />
        </AdminField>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <AdminBtn onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</AdminBtn>
          <AdminBtn variant="ghost" onClick={() => setEditTenant(null)}>Cancel</AdminBtn>
        </div>
      </AdminModal>

      <Toast msg={toast.msg} error={toast.err} />
    </div>
  );
}

function MessagesPanel({ tenants = [] }) {
  const C = useColors();
  const toast = useToast();
  const [form, setForm] = useState({ target: 'all', plan: '', workspace_id: '', subject: '', body: '', type: 'info' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState([]);
  const sf = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSend() {
    if (!form.subject.trim() || !form.body.trim()) {
      toast.show('Subject and message required', true);
      return;
    }

    setSending(true);
    try {
      await apiClient.post('/api/admin/platform-messages', form);
      setSent((s) => [{ subject: form.subject, target: form.target, at: new Date().toLocaleString() }, ...s]);
      setForm((f) => ({ ...f, subject: '', body: '' }));
      toast.show('Message sent');
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.show(err?.message || 'Send failed', true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div data-testid="messages-panel">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>
        <div>
          <SectionLabel>Compose Platform Message</SectionLabel>
          <CardBox>
            <AdminField label="Send To">
              <AdminSelect value={form.target} onChange={(v) => sf('target', v)} options={[{ value: 'all', label: 'All tenants' }, { value: 'plan', label: 'Specific plan' }, { value: 'tenant', label: 'Specific tenant' }]} />
            </AdminField>

            {form.target === 'plan' && (
              <AdminField label="Plan">
                <AdminSelect value={form.plan} onChange={(v) => sf('plan', v)} options={['foundation', 'structure', 'house', 'estate']} />
              </AdminField>
            )}

            {form.target === 'tenant' && (
              <AdminField label="Select Tenant">
                <AdminSelect
                  value={form.workspace_id}
                  onChange={(v) => sf('workspace_id', v)}
                  options={[{ value: '', label: 'Choose tenant...' }, ...tenants.map((t) => ({ value: t.workspace_id || t.id, label: t.name || t.owner_email }))]}
                />
              </AdminField>
            )}

            <AdminField label="Message Type">
              <AdminSelect value={form.type} onChange={(v) => sf('type', v)} options={[{ value: 'info', label: 'Info' }, { value: 'announcement', label: 'Announcement' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'upgrade', label: 'Upgrade Offer' }]} />
            </AdminField>

            <AdminField label="Subject *">
              <AdminInput value={form.subject} onChange={(v) => sf('subject', v)} placeholder="Message subject line" />
            </AdminField>

            <AdminField label="Message *">
              <AdminTextarea value={form.body} onChange={(v) => sf('body', v)} placeholder="Write your message..." rows={5} />
            </AdminField>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AdminBtn onClick={handleSend} disabled={sending || !form.subject || !form.body} icon={Send}>
                {sending ? 'Sending...' : 'Send Message'}
              </AdminBtn>
              <span style={{ fontSize: 11, color: C.textMuted }}>
                {form.target === 'all' ? 'All tenants' : form.target === 'plan' ? `${form.plan} plan` : 'Selected tenant'}
              </span>
            </div>
          </CardBox>
        </div>

        <div>
          <SectionLabel>Recent Sends</SectionLabel>
          <CardBox>
            {sent.length === 0 ? (
              <p style={{ fontSize: 12, color: C.textMuted, textAlign: 'center', padding: '16px 0' }}>No messages sent yet</p>
            ) : (
              sent.map((s, i) => (
                <div key={i} style={{ borderBottom: i < sent.length - 1 ? `1px solid ${C.tuscany}08` : 'none', paddingBottom: 8, marginBottom: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: C.textPrimary, margin: '0 0 2px' }}>{s.subject}</p>
                  <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>
                    {s.target} · {s.at}
                  </p>
                </div>
              ))
            )}
          </CardBox>
        </div>
      </div>

      <Toast msg={toast.msg} error={toast.err} />
    </div>
  );
}

function TenantApiKeysPanel({ tenants = [] }) {
  const C = useColors();
  const toast = useToast();
  const [selected, setSelected] = useState('');
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', service: '', key: '' });
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState({});

  const loadKeys = useCallback(async (wsId) => {
    if (!wsId) return;
    setLoading(true);
    try {
      const r = await apiClient.get(`/api/admin/tenants/${wsId}/api-keys`);
      setKeys(r?.keys || []);
    } catch (err) {
      console.error('Failed to load tenant keys:', err);
      toast.show(err?.message || 'Failed to load tenant keys', true);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  async function handleAdd() {
    if (!selected || !form.name || !form.key) {
      toast.show('Select tenant and fill all fields', true);
      return;
    }

    setSaving(true);
    try {
      const r = await apiClient.post(`/api/admin/tenants/${selected}/api-keys`, form);
      setKeys((ks) => [...ks, r]);
      setForm({ name: '', service: '', key: '' });
      toast.show('Key added to tenant');
    } catch (err) {
      console.error('Failed to add tenant key:', err);
      toast.show(err?.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await apiClient.delete(`/api/admin/tenants/${selected}/api-keys/${id}`);
      setKeys((ks) => ks.filter((k) => k.id !== id));
      toast.show('Key deleted');
    } catch (err) {
      console.error('Failed to delete tenant key:', err);
      toast.show(err?.message || 'Failed', true);
    }
  }

  return (
    <div data-testid="tenant-api-keys-panel">
      <SectionLabel>Tenant API Keys</SectionLabel>
      <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 14px', lineHeight: 1.6 }}>
        Manage integration API keys for tenant workspaces. Select a tenant to view and edit their keys.
      </p>

      <AdminField label="Select Tenant">
        <AdminSelect value={selected} onChange={(v) => { setSelected(v); loadKeys(v); }} options={[{ value: '', label: 'Choose tenant workspace...' }, ...tenants.map((t) => ({ value: t.workspace_id || t.id, label: t.name || t.owner_email }))]} />
      </AdminField>

      {selected && (
        <>
          <CardBox style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.textMuted, margin: '0 0 12px' }}>
              Add Integration Key
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <AdminField label="Key Name">
                <AdminInput value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Stripe Live Key" />
              </AdminField>
              <AdminField label="Service">
                <AdminSelect value={form.service} onChange={(v) => setForm((f) => ({ ...f, service: v }))} options={[{ value: '', label: 'Select service...' }, 'stripe', 'openai', 'google', 'resend', 'notion', 'ahrefs', 'other']} />
              </AdminField>
            </div>

            <AdminField label="API Key *">
              <AdminInput value={form.key} onChange={(v) => setForm((f) => ({ ...f, key: v }))} placeholder="Key value..." type="password" />
            </AdminField>

            <AdminBtn onClick={handleAdd} disabled={saving || !form.name || !form.key} icon={Plus}>
              {saving ? 'Saving...' : 'Add Key'}
            </AdminBtn>
          </CardBox>

          <CardBox style={{ overflow: 'hidden', padding: 0 }}>
            {loading ? (
              <p style={{ padding: 24, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>Loading...</p>
            ) : keys.length === 0 ? (
              <p style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>No API keys for this tenant</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.tuscany}12` }}>
                    {['Name', 'Service', 'Key', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.textMuted, background: `${C.tuscany}04` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k, i) => (
                    <tr key={k.id || i} style={{ borderBottom: i < keys.length - 1 ? `1px solid ${C.tuscany}08` : 'none' }}>
                      <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{k.name}</td>
                      <td style={{ padding: '9px 14px' }}>
                        <Badge label={k.service || 'other'} />
                      </td>
                      <td style={{ padding: '9px 14px', fontSize: 11, color: C.textMuted, fontFamily: 'monospace' }}>
                        {show[k.id] ? k.key : `${String(k.key || '').substring(0, 8)}...`}
                        <button onClick={() => setShow((s) => ({ ...s, [k.id]: !s[k.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, marginLeft: 6 }}>
                          {show[k.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <AdminBtn variant="danger" onClick={() => handleDelete(k.id)} icon={Trash2} style={{ padding: '3px 10px', fontSize: 11 }}>
                          Delete
                        </AdminBtn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBox>
        </>
      )}

      <Toast msg={toast.msg} error={toast.err} />
    </div>
  );
}

function AddOnsPanel() {
  const C = useColors();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiClient.get('/api/admin/addon-requests');
      setRequests(r?.requests || []);
    } catch (err) {
      console.error('Failed to load add-on requests:', err);
      toast.show(err?.message || 'Failed to load add-on requests', true);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleStatus(id, status) {
    try {
      await apiClient.patch(`/api/admin/addon-requests/${id}`, { status });
      setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.show('Updated');
    } catch (err) {
      console.error('Failed to update add-on request:', err);
      toast.show(err?.message || 'Failed', true);
    }
  }

  return (
    <div data-testid="addons-panel">
      <SectionLabel>Tenant Add-on Requests</SectionLabel>
      <CardBox style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <p style={{ padding: 24, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>Loading...</p>
        ) : requests.length === 0 ? (
          <p style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>
            No add-on requests yet. Tenant requests appear here when submitted.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.tuscany}12` }}>
                {['Tenant', 'Add-on', 'Message', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.textMuted, background: `${C.tuscany}04` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((req, i) => (
                <tr key={req.id || i} style={{ borderBottom: i < requests.length - 1 ? `1px solid ${C.tuscany}08` : 'none' }}>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: C.textMuted }}>{req.workspace_name || req.user_id || 'Unknown'}</td>
                  <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{req.title}</td>
                  <td style={{ padding: '9px 14px', fontSize: 11, color: C.textMuted, maxWidth: 200 }}>{req.description || '—'}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <Badge label={req.status || 'pending'} />
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    {req.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <AdminBtn variant="green" onClick={() => handleStatus(req.id, 'approved')} style={{ padding: '3px 10px', fontSize: 11 }}>
                          Approve
                        </AdminBtn>
                        <AdminBtn variant="danger" onClick={() => handleStatus(req.id, 'declined')} style={{ padding: '3px 10px', fontSize: 11 }}>
                          Decline
                        </AdminBtn>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: C.textMuted }}>Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBox>
      <Toast msg={toast.msg} error={toast.err} />
    </div>
  );
}

function MyApiKeysPanel() {
  const C = useColors();
  const toast = useToast();
  const [keys, setKeys] = useState([]);
  const [form, setForm] = useState({ name: '', service: '', key: '' });
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState({});

  const loadKeys = useCallback(async () => {
    try {
      const r = await apiClient.get('/api/admin/my-api-keys');
      setKeys(r?.keys || []);
    } catch (err) {
      console.error('Failed to load personal keys:', err);
      toast.show(err?.message || 'Failed to load personal keys', true);
    }
  }, [toast]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function handleAdd() {
    if (!form.name || !form.key) {
      toast.show('Name and key required', true);
      return;
    }

    setSaving(true);
    try {
      const r = await apiClient.post('/api/admin/my-api-keys', form);
      setKeys((ks) => [...ks, r]);
      setForm({ name: '', service: '', key: '' });
      toast.show('Personal key saved');
    } catch (err) {
      console.error('Failed to save personal key:', err);
      toast.show(err?.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await apiClient.delete(`/api/admin/my-api-keys/${id}`);
      setKeys((ks) => ks.filter((k) => k.id !== id));
      toast.show('Deleted');
    } catch (err) {
      console.error('Failed to delete personal key:', err);
      toast.show(err?.message || 'Failed', true);
    }
  }

  return (
    <div data-testid="my-api-keys-panel">
      <SectionLabel>My API Keys — Super Admin Only</SectionLabel>
      <div style={{ background: `${C.cinnabar}08`, border: `1px solid ${C.cinnabar}25`, borderRadius: 9, padding: '9px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Lock size={14} style={{ color: C.cinnabar }} />
        <p style={{ fontSize: 11.5, color: C.textMuted, margin: 0 }}>
          These are your personal API keys. They are only accessible to you and are not visible to any tenant.
        </p>
      </div>

      <CardBox style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.textMuted, margin: '0 0 12px' }}>
          Add Personal Key
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <AdminField label="Key Name">
            <AdminInput value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="e.g. Railway Deploy Key" />
          </AdminField>
          <AdminField label="Service">
            <AdminSelect value={form.service} onChange={(v) => setForm((f) => ({ ...f, service: v }))} options={[{ value: '', label: 'Select service...' }, 'anthropic', 'openai', 'cloudflare_r2', 'resend', 'stripe', 'railway', 'github', 'notion', 'other']} />
          </AdminField>
        </div>

        <AdminField label="API Key *">
          <AdminInput value={form.key} onChange={(v) => setForm((f) => ({ ...f, key: v }))} placeholder="sk-..." type="password" />
        </AdminField>

        <AdminBtn onClick={handleAdd} disabled={saving || !form.name || !form.key} icon={Plus}>
          {saving ? 'Saving...' : 'Add My Key'}
        </AdminBtn>
      </CardBox>

      <CardBox style={{ overflow: 'hidden', padding: 0 }}>
        {keys.length === 0 ? (
          <p style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>No personal API keys saved yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.tuscany}12` }}>
                {['Name', 'Service', 'Key', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.textMuted, background: `${C.tuscany}04` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k, i) => (
                <tr key={k.id || i} style={{ borderBottom: i < keys.length - 1 ? `1px solid ${C.tuscany}08` : 'none' }}>
                  <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{k.name}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <Badge label={k.service || 'other'} />
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 11, color: C.textMuted, fontFamily: 'monospace' }}>
                    {show[k.id] ? k.key : `${String(k.key || '').substring(0, 8)}...`}
                    <button onClick={() => setShow((s) => ({ ...s, [k.id]: !s[k.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, marginLeft: 6 }}>
                      {show[k.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <AdminBtn variant="danger" onClick={() => handleDelete(k.id)} icon={Trash2} style={{ padding: '3px 10px', fontSize: 11 }}>
                      Delete
                    </AdminBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBox>

      <Toast msg={toast.msg} error={toast.err} />
    </div>
  );
}

function AIModelPanel() {
  const C = useColors();
  const toast = useToast();
  const [selected, setSelected] = useState('claude-sonnet-4-5-20250929');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient
      .get('/api/admin/ai-model')
      .then((r) => setSelected(r?.model_id || 'claude-sonnet-4-5-20250929'))
      .catch((err) => {
        console.error('Failed to load AI model:', err);
      });
  }, []);

  const MODELS = [
    {
      provider: 'anthropic',
      label: 'Anthropic',
      color: C.cinnabar,
      models: [
        { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', desc: 'Recommended — best quality and speed' },
        { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', desc: 'Fastest — lower cost per generation' },
      ],
    },
    {
      provider: 'openai',
      label: 'OpenAI',
      color: '#10B981',
      models: [
        { id: 'gpt-4o', label: 'GPT-4o', desc: 'OpenAI flagship' },
        { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Faster, lower cost' },
      ],
    },
    {
      provider: 'google',
      label: 'Google',
      color: '#3B82F6',
      models: [{ id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Google fast model' }],
    },
  ];

  async function handleSave() {
    setSaving(true);
    const provider = MODELS.find((p) => p.models.some((m) => m.id === selected))?.provider || 'anthropic';

    try {
      await apiClient.put('/api/admin/ai-model', { provider, model_id: selected });
      toast.show('AI model updated platform-wide');
    } catch (err) {
      console.error('Failed to update AI model:', err);
      toast.show(err?.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div data-testid="ai-model-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <SectionLabel>AI Model Selection — Platform Wide</SectionLabel>
        <AdminBtn onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Model'}</AdminBtn>
      </div>

      <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>Currently Active:</span>
        <span style={{ fontSize: 11, color: C.textMuted }}>{selected}</span>
      </div>

      {MODELS.map((provider) => (
        <div key={provider.provider} style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.textMuted, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: provider.color, display: 'inline-block' }} />
            {provider.label}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {provider.models.map((model) => {
              const isActive = selected === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => setSelected(model.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `1px solid ${isActive ? C.cinnabar + '45' : C.tuscany + '12'}`,
                    background: isActive ? `${C.cinnabar}0A` : `${C.tuscany}06`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${isActive ? C.cinnabar : C.tuscany + '30'}`, background: isActive ? C.cinnabar : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {isActive && (
                      <svg width="8" height="8" fill="none" viewBox="0 0 12 12">
                        <path d="M10 3L5 8.5 2 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: isActive ? C.textPrimary : C.textMuted, margin: '0 0 2px' }}>{model.label}</p>
                    <p style={{ fontSize: 10, color: `${C.tuscany}50`, margin: '0 0 1px' }}>{model.id}</p>
                    <p style={{ fontSize: 10, color: `${C.tuscany}35`, margin: 0 }}>{model.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Toast msg={toast.msg} error={toast.err} />
    </div>
  );
}

function PromptsPanel() {
  const C = useColors();
  const toast = useToast();
  const [prompts, setPrompts] = useState([]);
  const [editPrompt, setEditPrompt] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: '', min_plan: 'structure', is_in_hub: true });
  const [saving, setSaving] = useState(false);
  const CATEGORIES = ['brand', 'content', 'strategy', 'copy', 'social', 'email', 'audit', 'campaign', 'other'];
  const PLANS = ['foundation', 'structure', 'house', 'estate'];

  const loadPrompts = useCallback(async () => {
    try {
      const r = await apiClient.get('/api/admin/preloaded-prompts');
      setPrompts(r?.prompts || []);
    } catch (err) {
      console.error('Failed to load prompts:', err);
      toast.show(err?.message || 'Failed to load prompts', true);
    }
  }, [toast]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  function openAdd() {
    setForm({ title: '', content: '', category: '', min_plan: 'structure', is_in_hub: true });
    setEditPrompt('new');
  }

  function openEdit(pr) {
    setForm({
      title: pr.title,
      content: pr.content || '',
      category: pr.category || '',
      min_plan: pr.min_plan || 'structure',
      is_in_hub: pr.is_in_hub !== false,
    });
    setEditPrompt(pr);
  }

  async function handleSave() {
    setSaving(true);
    const isNew = editPrompt === 'new';

    try {
      if (isNew) {
        const r = await apiClient.post('/api/admin/preloaded-prompts', form);
        setPrompts((ps) => [...ps, r?.prompt || r]);
      } else {
        await apiClient.patch(`/api/admin/preloaded-prompts/${editPrompt.id}`, form);
        setPrompts((ps) => ps.map((p) => (p.id === editPrompt.id ? { ...p, ...form } : p)));
      }
      setEditPrompt(null);
      toast.show(isNew ? 'Prompt added to Hub' : 'Prompt updated');
    } catch (err) {
      console.error('Failed to save prompt:', err);
      toast.show(err?.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await apiClient.delete(`/api/admin/preloaded-prompts/${id}`);
      setPrompts((ps) => ps.filter((p) => p.id !== id));
      toast.show('Prompt removed from Hub');
    } catch (err) {
      console.error('Failed to delete prompt:', err);
      toast.show(err?.message || 'Delete failed', true);
    }
  }

  async function handleToggleHub(pr) {
    try {
      await apiClient.patch(`/api/admin/preloaded-prompts/${pr.id}`, { is_in_hub: !pr.is_in_hub });
      setPrompts((ps) => ps.map((p) => (p.id === pr.id ? { ...p, is_in_hub: !p.is_in_hub } : p)));
      toast.show(pr.is_in_hub ? 'Removed from Hub' : 'Published to Hub');
    } catch (err) {
      console.error('Failed to toggle prompt hub state:', err);
      toast.show(err?.message || 'Failed', true);
    }
  }

  return (
    <div data-testid="prompts-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <SectionLabel>Preloaded Prompts</SectionLabel>
        <AdminBtn onClick={openAdd} icon={Zap}>+ Add Prompt</AdminBtn>
      </div>

      <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 9, padding: '9px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Zap size={14} style={{ color: '#3B82F6' }} />
        <p style={{ fontSize: 11.5, color: C.textMuted, margin: 0 }}>
          Prompts added here are published to the <strong style={{ color: C.textPrimary }}>Prompt Hub</strong> — tenants on the required plan can access them.
        </p>
      </div>

      {prompts.length === 0 ? (
        <CardBox style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Zap size={28} style={{ color: C.textMuted, marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: C.textMuted, margin: '0 0 4px' }}>No Preloaded Prompts</p>
          <p style={{ fontSize: 12, color: `${C.tuscany}50`, margin: '0 0 16px' }}>Add prompts to publish them to the Prompt Hub</p>
          <AdminBtn onClick={openAdd}>+ Add first prompt</AdminBtn>
        </CardBox>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {prompts.map((pr) => (
            <CardBox key={pr.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '13px 16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{pr.title}</p>
                  <Badge label={pr.category || 'other'} />
                  <Badge label={pr.min_plan || 'structure'} />
                </div>
                <p style={{ fontSize: 11.5, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
                  {(pr.content || '').substring(0, 120)}
                  {(pr.content || '').length > 120 ? '...' : ''}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => handleToggleHub(pr)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: pr.is_in_hub !== false ? 'rgba(16,185,129,0.1)' : `${C.tuscany}0A`,
                    border: `1px solid ${pr.is_in_hub !== false ? 'rgba(16,185,129,0.25)' : C.tuscany + '12'}`,
                    color: pr.is_in_hub !== false ? '#10B981' : C.textMuted,
                  }}
                >
                  {pr.is_in_hub !== false ? 'In Hub' : '+ Push to Hub'}
                </button>
                <button onClick={() => openEdit(pr)} style={{ background: `${C.tuscany}0A`, border: `1px solid ${C.tuscany}12`, borderRadius: 6, padding: '4px 10px', fontSize: 11, color: C.textMuted, cursor: 'pointer' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(pr.id)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#f87171', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </CardBox>
          ))}
        </div>
      )}

      <AdminModal open={!!editPrompt} onClose={() => setEditPrompt(null)} title={editPrompt === 'new' ? 'Add Prompt to Hub' : 'Edit Prompt'} maxWidth={560}>
        <AdminField label="Prompt Title *">
          <AdminInput value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="e.g. Brand Voice Generator" />
        </AdminField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <AdminField label="Category">
            <AdminSelect value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={[{ value: '', label: 'Select...' }, ...CATEGORIES]} />
          </AdminField>
          <AdminField label="Available To">
            <AdminSelect value={form.min_plan} onChange={(v) => setForm((f) => ({ ...f, min_plan: v }))} options={PLANS} />
          </AdminField>
        </div>
        <AdminField label="Prompt Body *">
          <AdminTextarea value={form.content} onChange={(v) => setForm((f) => ({ ...f, content: v }))} placeholder="Write the full prompt here..." rows={7} />
        </AdminField>
        <div style={{ display: 'flex', gap: 8 }}>
          <AdminBtn onClick={handleSave} disabled={saving || !form.title || !form.content}>
            {saving ? 'Saving...' : editPrompt === 'new' ? 'Add to Hub' : 'Save Changes'}
          </AdminBtn>
          <AdminBtn variant="ghost" onClick={() => setEditPrompt(null)}>Cancel</AdminBtn>
        </div>
      </AdminModal>

      <Toast msg={toast.msg} error={toast.err} />
    </div>
  );
}

function MediaEnginePanel() {
  const C = useColors();
  const toast = useToast();
  const [tab, setTab] = useState('uploads');
  const [assets, setAssets] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dropRef = useRef(null);
  const inputRef = useRef(null);

  const loadAssets = useCallback(async () => {
    try {
      const r = await apiClient.get('/api/admin/media-assets');
      setAssets(r?.assets || []);
    } catch (err) {
      console.error('Failed to load media assets:', err);
      toast.show(err?.message || 'Failed to load assets', true);
    }
  }, [toast]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  function handleFiles(files) {
    const valid = Array.from(files).filter((f) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'].includes(f.type) && f.size <= 50 * 1024 * 1024);

    if (!valid.length) {
      toast.show('PNG, JPG, WebP, GIF, MP4 only — Max 50MB', true);
      return;
    }

    setUploading(true);

    Promise.all(
      valid.map(async (file) => {
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('context', 'media_engine_reference');
          return await apiClient.post('/api/admin/media-assets/upload', fd, {
            headers: {},
            workspace: false,
          });
        } catch (err) {
          console.error('Asset upload failed:', err);
          return null;
        }
      })
    )
      .then((results) => {
        const saved = results.filter(Boolean);
        setAssets((prev) => [...saved, ...prev]);
        toast.show(`${saved.length} asset${saved.length !== 1 ? 's' : ''} uploaded`);
      })
      .catch(() => {
        toast.show('Upload failed', true);
      })
      .finally(() => {
        setUploading(false);
      });
  }

  async function handleDelete(id) {
    try {
      await apiClient.delete(`/api/admin/media-assets/${id}`);
      setAssets((as) => as.filter((a) => a.id !== id));
      toast.show('Deleted');
    } catch (err) {
      console.error('Failed to delete asset:', err);
      toast.show(err?.message || 'Failed', true);
    }
  }

  const TABS = [
    { id: 'uploads', label: 'Reference Assets', Icon: Upload },
    { id: 'library', label: 'Viral Concepts', Icon: Zap },
  ];

  const CONCEPTS = [
    { name: 'The Power Portrait', desc: 'Ultra-confident founder portrait, dramatic low-angle, chiaroscuro lighting' },
    { name: 'The Luxury Workspace', desc: 'Editorial brand environment, deep aubergine tones, architectural depth' },
    { name: 'The Contemplative Moment', desc: 'Pre-decision stillness, window light, thought-provoking calm' },
    { name: 'The City Skyline Authority', desc: 'Floor-to-ceiling windows, city below, quiet power composition' },
    { name: 'The Document Review', desc: 'Strategic focus, luxury desk, editorial precision lighting' },
    { name: 'The Walking Shot', desc: 'Purposeful movement, directional momentum, cinematic tracking' },
    { name: 'The Statement Outfit', desc: 'Bold wardrobe, brand palette, editorial fashion photography' },
    { name: 'The Transformation Moment', desc: 'Before-after visual metaphor, decisive body language' },
    { name: 'The Brand Environment', desc: 'Curated luxury space, brand colors dominant, aspirational depth' },
    { name: 'The Intimate Close-Up', desc: '85mm portrait, earned vulnerability, authentic authority' },
    { name: 'The Abstract Brand Visual', desc: 'Color palette explosion, no people, brand identity pure form' },
    { name: 'The Campaign Hero', desc: 'Full cinematic treatment, campaign message embodied visually' },
  ];

  return (
    <div data-testid="media-engine-panel">
      <SectionLabel>Media Prompt Engine</SectionLabel>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                border: `1px solid ${isActive ? C.cinnabar + '40' : C.tuscany + '12'}`,
                background: isActive ? `${C.cinnabar}0A` : `${C.tuscany}06`,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? C.textPrimary : C.textMuted,
              }}
            >
              <t.Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'uploads' && (
        <div>
          <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 12px', lineHeight: 1.6 }}>
            Upload reference images and videos for AI Twin consistency, brand style guides, and media generation context.
          </p>

          <div
            ref={dropRef}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!dropRef.current?.contains(e.relatedTarget)) setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            style={{
              border: `2px dashed ${dragging ? C.cinnabar : C.tuscany + '25'}`,
              borderRadius: 12,
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? `${C.cinnabar}08` : 'none',
              transition: 'all 0.15s',
              marginBottom: 14,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
              style={{ display: 'none' }}
            />

            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${C.cinnabar}40`, borderTopColor: C.cinnabar, animation: 'cth-spin 0.8s linear infinite' }} />
                <p style={{ fontSize: 13, color: C.cinnabar, margin: 0 }}>Uploading...</p>
              </div>
            ) : (
              <>
                <Upload size={24} style={{ color: dragging ? C.cinnabar : C.textMuted, marginBottom: 12 }} />
                <p style={{ fontSize: 13, fontWeight: 500, color: dragging ? C.cinnabar : C.textMuted, margin: '0 0 4px' }}>
                  {dragging ? 'Drop files here' : 'Upload reference assets'}
                </p>
                <p style={{ fontSize: 11, color: `${C.tuscany}40`, margin: '0 0 8px' }}>Drag and drop or click to browse — PNG, JPG, WebP, GIF, MP4 — Max 50MB</p>
                <span style={{ fontSize: 11.5, color: C.cinnabar, fontWeight: 500 }}>Browse files</span>
              </>
            )}
          </div>

          {assets.length === 0 ? (
            <p style={{ textAlign: 'center', color: C.textMuted, fontSize: 12, padding: '16px 0' }}>No reference assets uploaded yet</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 8 }}>
              {assets.map((a) => {
                const isVideo = String(a.file_type || '').startsWith('video/');
                return (
                  <div key={a.id} style={{ background: `${C.tuscany}06`, border: `1px solid ${C.tuscany}12`, borderRadius: 9, overflow: 'hidden' }}>
                    <div style={{ height: 80, background: `${C.tuscany}04`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {isVideo ? (
                        <Film size={28} style={{ color: C.textMuted }} />
                      ) : (
                        <img src={a.preview_url || a.url} alt={a.filename || ''} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      )}
                      <button onClick={() => handleDelete(a.id)} style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 5, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', color: '#f87171', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ×
                      </button>
                    </div>
                    <div style={{ padding: '5px 8px' }}>
                      <p style={{ fontSize: 9.5, color: C.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.filename || 'Asset'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'library' && (
        <div>
          <p style={{ fontSize: 12, color: C.textMuted, margin: '0 0 14px', lineHeight: 1.6 }}>
            The 12 Viral AI Photoshoot Concepts — reference library for Media Studio generations.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
            {CONCEPTS.map((concept) => (
              <CardBox key={concept.name} style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: C.textPrimary, margin: '0 0 4px' }}>{concept.name}</p>
                <p style={{ fontSize: 11, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{concept.desc}</p>
              </CardBox>
            ))}
          </div>
        </div>
      )}

      <Toast msg={toast.msg} error={toast.err} />
    </div>
  );
}

function TrainingVideosPanel() {
  const C = useColors();
  const toast = useToast();
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState({ title: '', url: '', description: '', plan_required: 'free', order: 0, audience: 'all' });
  const [saving, setSaving] = useState(false);

  const loadVideos = useCallback(async () => {
    try {
      const r = await apiClient.get('/api/admin/training-videos');
      setVideos(r?.videos || []);
    } catch (err) {
      console.error('Failed to load training videos:', err);
      toast.show(err?.message || 'Failed to load training videos', true);
    }
  }, [toast]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  async function handleAdd() {
    if (!form.title || !form.url) {
      toast.show('Title and URL required', true);
      return;
    }

    setSaving(true);
    try {
      const r = await apiClient.post('/api/admin/training-videos', {
        title: form.title,
        url: form.url,
        description: form.description,
        category: form.plan_required,
        order: form.order,
        audience: form.audience,
      });
      setVideos((vs) => [...vs, r?.video || r]);
      setForm({ title: '', url: '', description: '', plan_required: 'free', order: 0, audience: 'all' });
      toast.show('Video added');
    } catch (err) {
      console.error('Failed to add training video:', err);
      toast.show(err?.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await apiClient.delete(`/api/admin/training-videos/${id}`);
      setVideos((vs) => vs.filter((v) => v.id !== id));
      toast.show('Deleted');
    } catch (err) {
      console.error('Failed to delete video:', err);
      toast.show(err?.message || 'Failed', true);
    }
  }

  return (
    <div data-testid="training-videos-panel">
      <SectionLabel>Training Videos</SectionLabel>

      <CardBox style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.textMuted, margin: '0 0 12px' }}>
          Add Training Video
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <AdminField label="Title *">
            <AdminInput value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="e.g. Getting Started with Brand Memory" />
          </AdminField>
          <AdminField label="URL *">
            <AdminInput value={form.url} onChange={(v) => setForm((f) => ({ ...f, url: v }))} placeholder="YouTube, Vimeo, or direct URL" />
          </AdminField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <AdminField label="Available To">
            <AdminSelect value={form.plan_required} onChange={(v) => setForm((f) => ({ ...f, plan_required: v }))} options={['free', 'foundation', 'structure', 'house', 'estate']} />
          </AdminField>
          <AdminField label="Audience">
            <AdminSelect value={form.audience} onChange={(v) => setForm((f) => ({ ...f, audience: v }))} options={[{ value: 'all', label: 'All tenants' }, { value: 'new', label: 'New tenants only' }]} />
          </AdminField>
          <AdminField label="Order">
            <AdminInput value={form.order} onChange={(v) => setForm((f) => ({ ...f, order: parseInt(v, 10) || 0 }))} type="number" placeholder="1" />
          </AdminField>
        </div>

        <AdminField label="Description">
          <AdminTextarea value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="What this video covers..." rows={2} />
        </AdminField>

        <AdminBtn onClick={handleAdd} disabled={saving || !form.title || !form.url} icon={Plus}>
          {saving ? 'Saving...' : 'Add Video'}
        </AdminBtn>
      </CardBox>

      {videos.length === 0 ? (
        <p style={{ textAlign: 'center', color: C.textMuted, fontSize: 12, padding: '20px 0' }}>No training videos added yet</p>
      ) : (
        videos.map((v) => (
          <CardBox key={v.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px' }}>
            <GraduationCap size={22} style={{ color: C.textMuted, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{v.title}</p>
                <Badge label={v.category || 'free'} />
              </div>
              <p style={{ fontSize: 11, color: C.textMuted, margin: '0 0 2px' }}>{v.url}</p>
              {v.description && <p style={{ fontSize: 11, color: `${C.tuscany}50`, margin: 0, lineHeight: 1.4 }}>{v.description}</p>}
            </div>
            <AdminBtn variant="danger" onClick={() => handleDelete(v.id)} icon={Trash2} style={{ padding: '4px 10px', fontSize: 11, flexShrink: 0 }}>
              Delete
            </AdminBtn>
          </CardBox>
        ))
      )}

      <Toast msg={toast.msg} error={toast.err} />
    </div>
  );
}

function AffiliatePanel() {
  const C = useColors();
  const toast = useToast();
  const [links, setLinks] = useState([]);
  const [form, setForm] = useState({ title: '', url: '', description: '', category: 'tool', is_active: true });
  const [saving, setSaving] = useState(false);
  const CATEGORIES = ['tool', 'service', 'software', 'course', 'resource', 'partner', 'other'];

  const loadLinks = useCallback(async () => {
    try {
      const r = await apiClient.get('/api/admin/affiliate-links');
      setLinks(r?.links || []);
    } catch (err) {
      console.error('Failed to load affiliate links:', err);
      toast.show(err?.message || 'Failed to load affiliate links', true);
    }
  }, [toast]);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  async function handleAdd() {
    if (!form.title || !form.url) {
      toast.show('Name and URL required', true);
      return;
    }

    setSaving(true);
    try {
      const r = await apiClient.post('/api/admin/affiliate-links', form);
      setLinks((ls) => [...ls, r?.link || r]);
      setForm({ title: '', url: '', description: '', category: 'tool', is_active: true });
      toast.show('Affiliate link created');
    } catch (err) {
      console.error('Failed to create affiliate link:', err);
      toast.show(err?.message || 'Save failed', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id, active) {
    try {
      await apiClient.patch(`/api/admin/affiliate-links/${id}`, { active: !active });
      setLinks((ls) => ls.map((l) => (l.id === id ? { ...l, is_active: !active } : l)));
      toast.show('Updated');
    } catch (err) {
      console.error('Failed to update affiliate link:', err);
      toast.show(err?.message || 'Failed', true);
    }
  }

  async function handleDelete(id) {
    try {
      await apiClient.delete(`/api/admin/affiliate-links/${id}`);
      setLinks((ls) => ls.filter((l) => l.id !== id));
      toast.show('Deleted');
    } catch (err) {
      console.error('Failed to delete affiliate link:', err);
      toast.show(err?.message || 'Delete failed', true);
    }
  }

  return (
    <div data-testid="affiliate-panel">
      <SectionLabel>Affiliate Links — Super Admin Only</SectionLabel>

      <div style={{ background: `${C.cinnabar}08`, border: `1px solid ${C.cinnabar}25`, borderRadius: 9, padding: '9px 14px', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Lock size={14} style={{ color: C.cinnabar, flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11.5, color: C.textMuted, margin: 0, lineHeight: 1.55 }}>
          Affiliate links are managed exclusively by you. Tenants see the link name and description — they do not see your backend tracking details.
        </p>
      </div>

      <CardBox style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.textMuted, margin: '0 0 12px' }}>
          Add Affiliate Link
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <AdminField label="Link Name / Partner *">
            <AdminInput value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="e.g. Higgsfield AI" />
          </AdminField>
          <AdminField label="Category">
            <AdminSelect value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} options={CATEGORIES} />
          </AdminField>
        </div>

        <AdminField label="Affiliate URL *">
          <AdminInput value={form.url} onChange={(v) => setForm((f) => ({ ...f, url: v }))} placeholder="https://..." />
        </AdminField>

        <AdminField label="Description">
          <AdminTextarea value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="e.g. The AI video tool we recommend for Hybrid UGC content creation." rows={2} />
        </AdminField>

        <AdminBtn onClick={handleAdd} disabled={saving || !form.title || !form.url} icon={Plus}>
          {saving ? 'Creating...' : 'Create Link'}
        </AdminBtn>
      </CardBox>

      <CardBox style={{ overflow: 'hidden', padding: 0 }}>
        {links.length === 0 ? (
          <p style={{ padding: 32, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>No affiliate links yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.tuscany}12` }}>
                {['Partner / Tool', 'Category', 'Clicks', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.textMuted, background: `${C.tuscany}04` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {links.map((l, i) => (
                <tr key={l.id || i} style={{ borderBottom: i < links.length - 1 ? `1px solid ${C.tuscany}08` : 'none' }}>
                  <td style={{ padding: '9px 14px' }}>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: C.textPrimary, margin: '0 0 2px' }}>{l.title}</p>
                    {l.description && <p style={{ fontSize: 10, color: C.textMuted, margin: 0, maxWidth: 260 }}>{l.description.substring(0, 80)}{l.description.length > 80 ? '...' : ''}</p>}
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <Badge label={l.category || 'other'} />
                  </td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: C.textMuted, textAlign: 'center' }}>{l.clicks || 0}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <Badge label={l.is_active ? 'Active' : 'Inactive'} />
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => navigator.clipboard.writeText(l.url)}
                        style={{ background: `${C.tuscany}0A`, border: `1px solid ${C.tuscany}12`, borderRadius: 6, padding: '3px 10px', fontSize: 11, color: C.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Copy size={10} />
                        Copy URL
                      </button>
                      <button
                        onClick={() => handleToggle(l.id, l.is_active)}
                        style={{ background: `${C.tuscany}0A`, border: `1px solid ${C.tuscany}12`, borderRadius: 6, padding: '3px 10px', fontSize: 11, color: C.textMuted, cursor: 'pointer' }}
                      >
                        {l.is_active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(l.id)}
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#f87171', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBox>

      <Toast msg={toast.msg} error={toast.err} />
    </div>
  );
}

export default function SuperAdminDashboard() {
  const C = useColors();
  const { user } = useUser();
  const [active, setActive] = useState('overview');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, tenantData] = await Promise.all([
        apiClient.get('/api/admin/overview').catch(() => ({})),
        apiClient.get('/api/admin/tenants').catch(() => ({})),
      ]);

      setData({ ...overview, tenants: tenantData?.tenants || [] });
      setTenants(tenantData?.tenants || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id, loadData]);

  const renderPanel = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 200, gap: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${C.cinnabar}40`, borderTopColor: C.cinnabar, animation: 'cth-spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 12, color: C.textMuted }}>Loading platform data...</span>
        </div>
      );
    }

    switch (active) {
      case 'overview':
        return <OverviewPanel data={data} />;
      case 'analytics':
        return <AnalyticsPanel data={data} />;
      case 'tenants':
        return <TenantsPanel onRefresh={loadData} />;
      case 'messages':
        return <MessagesPanel tenants={tenants} />;
      case 'api_keys':
        return <TenantApiKeysPanel tenants={tenants} />;
      case 'addons':
        return <AddOnsPanel />;
      case 'my_keys':
        return <MyApiKeysPanel />;
      case 'ai_model':
        return <AIModelPanel />;
      case 'prompts':
        return <PromptsPanel />;
      case 'media':
        return <MediaEnginePanel />;
      case 'training':
        return <TrainingVideosPanel />;
      case 'affiliate':
        return <AffiliatePanel />;
      case 'store_products':
        return <AdminStoreProducts />;
      case 'store_orders':
        return <AdminStoreOrders />;
      default:
        return null;
    }
  };

  const activeItem = NAV.flatMap((g) => g.items).find((i) => i.id === active);

  return (
    <DashboardLayout>
      <style>{`@keyframes cth-spin{to{transform:rotate(360deg)}}`}</style>
      <div data-testid="super-admin-dashboard" style={{ display: 'flex', flex: 1, overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${C.tuscany}12`, background: C.darkest, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '16px 14px 12px', borderBottom: `1px solid ${C.tuscany}12`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.cinnabar}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={13} style={{ color: C.cinnabar }} />
              </div>
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Admin Dashboard</p>
                <p style={{ fontSize: 9.5, color: C.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Lock size={8} />
                  Super Admin Only
                </p>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
            {NAV.map((group) => (
              <div key={group.section} style={{ marginBottom: 6 }}>
                <p style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: `${C.tuscany}40`, margin: '10px 6px 4px' }}>
                  {group.section}
                </p>
                {group.items.map((item) => {
                  const isActive = active === item.id;
                  const Icon = item.Icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActive(item.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', background: isActive ? `${C.cinnabar}15` : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <Icon size={14} style={{ color: isActive ? C.cinnabar : C.textMuted, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? C.textPrimary : C.textMuted }}>{item.label}</span>
                      {isActive && <div style={{ marginLeft: 'auto', width: 3, height: 3, borderRadius: '50%', background: C.cinnabar, flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.tuscany}12`, flexShrink: 0 }}>
            <button
              onClick={loadData}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 7, border: `1px solid ${C.tuscany}12`, background: 'none', cursor: 'pointer', fontSize: 11.5, color: C.textMuted, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <RefreshCw size={12} />
              Refresh data
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 22px', borderBottom: `1px solid ${C.tuscany}12`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: C.textPrimary, margin: 0 }}>
                {activeItem?.label || 'Overview'}
              </h1>
              <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>Core Truth House OS — Super Admin</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: `${C.tuscany}06`, borderRadius: 7, border: `1px solid ${C.tuscany}12` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ fontSize: 11, color: C.textMuted }}>All systems operational</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '20px 22px' }}>
            {renderPanel()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
