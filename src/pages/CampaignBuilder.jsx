import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useWorkspace } from '../context/WorkspaceContext';
import { useUser } from '../hooks/useAuth';
import { DashboardLayout, TopBar } from '../components/Layout';
import { Loader2, Plus, Zap, Calendar as CalendarIcon, X, Bell, Home, MessageCircle, Trash2, RefreshCw } from 'lucide-react';
import TrackingLinkManager from "../components/mail/TrackingLinkManager";
import UploadZone from '../components/shared/UploadZone';
import apiClient from '../lib/apiClient';
import { API_PATHS } from '../lib/apiPaths';
import RegenerateModal from '../components/campaign/RegenerateModal';
import RetrospectiveSection from '../components/campaign/RetrospectiveSection';

const MAGNET_STEPS = [
 { id: 'M', letter: 'M', label: 'Mission', description: 'Define why this campaign exists and what offer drives it' },
 { id: 'A', letter: 'A', label: 'Audience', description: 'Define the exact person , problem, desire, awareness stage' },
 { id: 'G', letter: 'G', label: 'Gravity Message', description: 'Craft the emotional hook that attracts and converts' },
 { id: 'N', letter: 'N', label: 'Narrative Content System', description: 'Plan the content engine , types, formats, weekly rhythm' },
 { id: 'E', letter: 'E', label: 'Engagement Engine', description: 'Design how your audience interacts with the campaign' },
 { id: 'T', letter: 'T', label: 'Transaction', description: 'Build the conversion funnel from attention to sale' },
];

const OFFER_REQUIRED_GOALS = new Set(['offer_launch', 'sales_conversion']);
const goalRequiresOffer = (goal) => OFFER_REQUIRED_GOALS.has(goal);

const GOAL_CONFIG = {
 offer_launch: { label: 'Offer Launch', color: 'var(--cth-command-crimson)', bg: 'rgba(224,78,53,0.12)' },
 lead_generation: { label: 'Lead Generation', color: 'var(--cth-command-ink)', bg: 'rgba(43,16,64,0.08)' },
 audience_growth: { label: 'Audience Growth', color: 'var(--cth-command-crimson)', bg: 'rgba(118,59,91,0.10)' },
 engagement: { label: 'Engagement', color: 'var(--cth-command-crimson)', bg: 'rgba(224,78,53,0.10)' },
 sales_conversion: { label: 'Sales Conversion', color: 'var(--cth-command-crimson)', bg: 'rgba(118,59,91,0.14)' },
 authority_building: { label: 'Authority Building', color: 'var(--cth-command-ink)', bg: 'rgba(43,16,64,0.10)' },
 re_engagement: { label: 'Re-Engagement', color: 'var(--cth-command-crimson)', bg: 'rgba(118,59,91,0.10)' },
 brand_awareness: { label: 'Brand Awareness', color: 'var(--cth-command-ink)', bg: 'rgba(43,16,64,0.12)' },
};

const METRIC_PRESETS = [
 'Impressions',
 'Reach',
 'Clicks',
 'Link-in-bio visits',
 'Email opens',
 'Email clicks',
 'Leads captured',
 'Sales calls booked',
 'Revenue',
 'New followers',
 'Engagement rate',
 'Content pieces published',
];

const STATUS_CONFIG = {
 draft: { label: 'Draft', color: 'var(--cth-command-muted)', bg: 'var(--cth-command-panel-soft)', border: '1px solid var(--cth-command-border)' },
 active: { label: 'Active', color: 'var(--cth-command-crimson)', bg: 'rgba(175, 0, 42, 0.1)', border: '1px solid rgba(175, 0, 42, 0.2)' },
 paused: { label: 'Paused', color: 'var(--cth-command-gold)', bg: 'rgba(196, 169, 91, 0.1)', border: '1px solid rgba(196, 169, 91, 0.2)' },
 complete: { label: 'Complete', color: 'var(--cth-command-purple)', bg: 'rgba(51, 3, 60, 0.1)', border: '1px solid rgba(51, 3, 60, 0.2)' },
 completed_won: { label: 'Won', color: 'var(--cth-command-crimson)', bg: 'rgba(175, 0, 42, 0.16)', border: '1px solid rgba(175, 0, 42, 0.32)' },
 completed_lost: { label: 'Lost', color: 'var(--cth-command-muted)', bg: 'rgba(122, 106, 114, 0.08)', border: '1px solid rgba(122, 106, 114, 0.22)' },
 completed_learning: { label: 'Learning', color: 'var(--cth-command-gold)', bg: 'rgba(196, 169, 91, 0.16)', border: '1px solid rgba(196, 169, 91, 0.32)' },
};

const DEFAULT_FORM = {
 id: null,
 name: '',
 goal: 'offer_launch',
 offer_id: '',
 offer_name: '',
 offer_description: '',
 transformation: '',
 start_date: '',
 end_date: '',
 platforms: [],
 target_metric: '',
 target_value: '',
 audience_description: '',
 audience_problem: '',
 audience_desire: '',
 awareness_stage: 'problem_aware',
 emotional_hook: '',
 problem_statement: '',
 promise: '',
 authority: '',
 content_plan: [],
 engagement_tactics: [],
 lead_magnet_idea: '',
 conversion_funnel: [
 { id: 'f1', order: 1, label: 'Organic content (social)', type: 'post' },
 { id: 'f2', order: 2, label: 'Lead magnet', type: 'lead_magnet' },
 { id: 'f3', order: 3, label: 'Email sequence', type: 'email' },
 { id: 'f4', order: 4, label: 'Offer page', type: 'offer_page' },
 { id: 'f5', order: 5, label: 'Purchase / signup', type: 'purchase' },
 ],
 cta_primary: '',
 landing_page_url: '',
 cta_url: '',
 urgency_trigger: '',
 notes: '',
 brief: '',
 generated_hooks: [],
 actual_value: '',
 additional_metrics: [],
 weekly_results: [
 { week: 1, type: 'awareness', label: 'Week 1', reach: '', engagements: '', leads: '' },
 { week: 2, type: 'education', label: 'Week 2', reach: '', engagements: '', leads: '' },
 { week: 3, type: 'authority', label: 'Week 3', reach: '', engagements: '', leads: '' },
 { week: 4, type: 'promotion', label: 'Week 4', reach: '', engagements: '', leads: '' },
 ],
 brand_voice: '',
 os_context_used: [],
 campaign_assets: [],
};

function daysLeft(end) {
 return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000));
}

function magnetCompletion(c) {
 return {
 M: !!(
 c.goal &&
 c.start_date &&
 c.end_date &&
 (c.platforms || []).length &&
 (!goalRequiresOffer(c.goal) || c.offer_name)
 ),
 A: !!(c.audience_description && c.audience_problem && c.awareness_stage),
 G: !!(c.emotional_hook && c.promise),
 N: (c.content_plan || []).length >= 1,
 E: (c.engagement_tactics || []).length >= 1,
 T: !!c.cta_primary,
 };
}

export function buildCalendarItems(campaign) {
 if (!campaign.content_plan?.length) return [];

 const start = campaign.start_date ? new Date(campaign.start_date) : new Date();

 return campaign.content_plan.map((item) => {
 const weekOffset = (item.week - 1) * 7;
 const dayOffset =
 item.type === 'awareness'
 ? 0
 : item.type === 'education'
 ? 3
 : item.type === 'authority'
 ? 0
 : 3;

 const scheduledDate = new Date(start.getTime() + (weekOffset + dayOffset) * 86400000);

 return {
 campaign_id: campaign.id,
 campaign_name: campaign.name,
 content_item_id: item.id,
 format: item.format,
 platform: item.platform,
 topic: item.topic,
 phase: item.type,
 status: 'draft',
 scheduled_date: scheduledDate.toISOString().split('T')[0],
 generated_id: item.generatedId || null,
 };
 });
}

function StatusBadge({ status }) {
 const c = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
 return (
 <span
 className="font-semibold uppercase"
 style={{
 color: c.color,
 background: c.bg,
 border: c.border,
 borderRadius: 4,
 fontSize: 11,
 letterSpacing: '0.14em',
 padding: '3px 8px',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 {c.label}
 </span>
 );
}

function GoalBadge({ goal }) {
 const c = GOAL_CONFIG[goal] || { label: goal };
 return (
 <span
 className="font-semibold uppercase"
 style={{
 color: 'var(--cth-command-ink)',
 background: 'var(--cth-command-panel-soft)',
 border: '1px solid var(--cth-command-border)',
 borderRadius: 4,
 fontSize: 11,
 letterSpacing: '0.14em',
 padding: '3px 8px',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 {c.label}
 </span>
 );
}

function MAGNETProgress({ campaign }) {
 const completion = magnetCompletion(campaign);
 const count = Object.values(completion).filter(Boolean).length;

 return (
 <div className="flex items-center gap-1">
 {MAGNET_STEPS.map((step) => {
 const done = completion[step.id];
 return (
 <div
 key={step.id}
 title={`${step.letter} , ${step.label}`}
 className="w-5 h-5 flex items-center justify-center text-[9px] font-bold transition-all"
 style={{
 background: done ? 'var(--cth-command-crimson)' : 'var(--cth-command-panel-soft)',
 color: done ? 'var(--cth-command-ivory)' : 'var(--cth-command-muted)',
 border: done ? 'none' : '1px solid var(--cth-command-border)',
 borderRadius: 4,
 }}
 >
 {step.letter}
 </div>
 );
 })}
 <span className="text-[10px] cth-muted ml-1">{count}/6</span>
 </div>
 );
}

function TabResults({ campaign, onSaveResults }) {
 const [actual, setActual] = useState(campaign.actual_value || '');
 const [metrics, setMetrics] = useState(campaign.additional_metrics || []);
 const [weekly, setWeekly] = useState(
 campaign.weekly_results?.length
 ? campaign.weekly_results
 : DEFAULT_FORM.weekly_results
 );
 const [isSaved, setIsSaved] = useState(false);

 useEffect(() => {
 setActual(campaign.actual_value || '');
 setMetrics(campaign.additional_metrics || []);
 setWeekly(campaign.weekly_results?.length ? campaign.weekly_results : DEFAULT_FORM.weekly_results);
 }, [campaign]);

 const target = parseFloat(campaign.target_value) || 0;
 const act = parseFloat(actual) || 0;
 const pct = target > 0 ? Math.min(Math.round((act / target) * 100), 200) : 0;
 const overAchieved = pct > 100;

 const addMetric = () =>
 setMetrics((prev) => [...prev, { id: Date.now().toString(), label: '', target: '', actual: '' }]);

 const updateMetric = (id, key, val) =>
 setMetrics((prev) => prev.map((m) => (m.id === id ? { ...m, [key]: val } : m)));

 const removeMetric = (id) =>
 setMetrics((prev) => prev.filter((m) => m.id !== id));

 const updateWeekly = (week, key, val) =>
 setWeekly((prev) => prev.map((w) => (w.week === week ? { ...w, [key]: val } : w)));

 const addWeek = () =>
 setWeekly((prev) => [
 ...prev,
 { week: prev.length + 1, type: 'custom', label: `Week ${prev.length + 1}`, reach: '', engagements: '', leads: '' },
 ]);

 const handleSave = async () => {
 await onSaveResults(campaign.id, {
 actual_value: actual,
 additional_metrics: metrics,
 weekly_results: weekly,
 });
 setIsSaved(true);
 setTimeout(() => setIsSaved(false), 1500);
 };

 return (
 <div data-testid="results-tab" className="space-y-5">
 <div className="flex items-center justify-between">
 <p className="text-sm font-semibold cth-muted">Campaign Results</p>
 <button
 onClick={handleSave}
 data-testid="save-results-btn"
 className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
 isSaved
 ? 'border-[var(--cth-command-crimson)]/15 bg-[var(--cth-command-crimson)]/10 text-[var(--cth-command-crimson)]'
 : 'border-[var(--cth-command-crimson)]/25 bg-[var(--cth-command-crimson)]/10 cth-text-accent'
 }`}
 >
 {isSaved ? '✓ Saved' : 'Save results'}
 </button>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="p-5 cth-card-muted rounded-xl border border-[var(--cth-command-border)]">
 <p className="text-[9.5px] font-semibold uppercase tracking-widest cth-muted mb-2">Target</p>
 <p className="text-3xl font-bold cth-heading" >
 {campaign.target_value || ', '}
 </p>
 <p className="text-xs cth-muted mt-0.5">{campaign.target_metric || 'Primary metric'}</p>
 </div>

 <div className="p-5 cth-card-muted rounded-xl border border-[var(--cth-command-border)]">
 <p className="text-[9.5px] font-semibold uppercase tracking-widest cth-muted mb-2">Actual</p>
 <input
 value={actual}
 onChange={(e) => setActual(e.target.value)}
 placeholder="Enter result..."
 className="bg-transparent border-none outline-none text-3xl font-bold w-full p-0"
 style={{
 fontFamily: 'DM Sans, system-ui, sans-serif',
 color: act > 0 ? (overAchieved ? 'var(--cth-command-crimson)' : 'var(--cth-command-crimson)') : 'var(--cth-command-muted)',
 }}
 />
 <p className="text-xs cth-muted mt-0.5">
 {campaign.target_metric || 'Primary metric'} {act > 0 && target > 0 ? `· ${pct}% of target` : ''}
 </p>
 </div>
 </div>

 <div>
 <div className="h-2 cth-card-muted rounded-full overflow-hidden">
 <div
 className="h-full rounded-full"
 style={{
 width: `${Math.min(pct, 100)}%`,
 background: overAchieved ? 'var(--cth-command-crimson)' : pct >= 70 ? 'var(--cth-command-ink)' : 'var(--cth-command-crimson)',
 }}
 />
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-2.5">
 <p className="text-xs font-semibold cth-muted">Additional Metrics</p>
 <button onClick={addMetric} className="text-[10.5px] cth-text-accent">+ Add metric</button>
 </div>

 <div className="cth-card-muted rounded-xl border border-[var(--cth-command-border)] overflow-hidden">
 <div className="grid grid-cols-[1fr_100px_100px_80px] px-3.5 py-2 border-b border-[var(--cth-command-border)] cth-card-muted">
 {['Metric', 'Target', 'Actual', ''].map((h) => (
 <span key={h} className="text-[9px] font-semibold uppercase tracking-widest cth-muted">
 {h}
 </span>
 ))}
 </div>

 {metrics.length === 0 && (
 <p className="text-xs cth-muted px-3.5 py-3">No additional metrics yet.</p>
 )}

 {metrics.map((m) => (
 <div key={m.id} className="grid grid-cols-[1fr_100px_100px_80px] items-center px-3.5 py-2 border-b border-[var(--cth-command-border)] last:border-b-0">
 <input
 value={m.label}
 onChange={(e) => updateMetric(m.id, 'label', e.target.value)}
 placeholder="e.g. Impressions"
 list="metric-presets"
 className="bg-transparent border-none outline-none text-xs cth-muted"
 />
 <input
 value={m.target}
 onChange={(e) => updateMetric(m.id, 'target', e.target.value)}
 className="bg-transparent border-none outline-none text-xs cth-muted"
 />
 <input
 value={m.actual}
 onChange={(e) => updateMetric(m.id, 'actual', e.target.value)}
 className="bg-transparent border-none outline-none text-xs cth-muted"
 />
 <button onClick={() => removeMetric(m.id)} className="cth-muted hover:text-red-400 text-sm ml-auto">
 ×
 </button>
 </div>
 ))}
 </div>

 <datalist id="metric-presets">
 {METRIC_PRESETS.map((p) => (
 <option key={p} value={p} />
 ))}
 </datalist>
 </div>

 <div>
 <div className="flex items-center justify-between mb-2.5">
 <p className="text-xs font-semibold cth-muted">Weekly Breakdown</p>
 <button onClick={addWeek} className="text-[10.5px] cth-text-accent">+ Add week</button>
 </div>

 <div className="cth-card-muted rounded-xl border border-[var(--cth-command-border)] overflow-hidden">
 <div className="grid grid-cols-[100px_1fr_1fr_1fr] px-3.5 py-2 border-b border-[var(--cth-command-border)] cth-card-muted">
 {['Week', 'Reach', 'Engagements', 'Leads'].map((h) => (
 <span key={h} className="text-[9px] font-semibold uppercase tracking-widest cth-muted">
 {h}
 </span>
 ))}
 </div>

 {weekly.map((w, idx) => (
 <div key={w.week} className={`grid grid-cols-[100px_1fr_1fr_1fr] items-center px-3.5 py-2 ${idx < weekly.length - 1 ? 'border-b border-[var(--cth-command-border)]' : ''}`}>
 <div>
 <p className="text-xs font-semibold cth-muted">Week {w.week}</p>
 <p className="text-[9.5px] cth-muted">{w.label}</p>
 </div>
 <input value={w.reach || ''} onChange={(e) => updateWeekly(w.week, 'reach', e.target.value)} className="bg-transparent border-none outline-none text-xs cth-muted" />
 <input value={w.engagements || ''} onChange={(e) => updateWeekly(w.week, 'engagements', e.target.value)} className="bg-transparent border-none outline-none text-xs cth-muted" />
 <input value={w.leads || ''} onChange={(e) => updateWeekly(w.week, 'leads', e.target.value)} className="bg-transparent border-none outline-none text-xs cth-muted" />
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

function CalendarPopulateModal({ campaign, onConfirm, onCancel }) {
 const items = buildCalendarItems(campaign);

 return (
 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6" data-testid="calendar-modal">
 <div className="cth-card border border-[var(--cth-command-border)] rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
 <div className="flex items-center justify-between mb-1">
 <p className="text-base font-bold cth-heading" >
 Push to Calendar
 </p>
 <button onClick={onCancel} className="cth-muted hover:cth-muted">
 <X size={16} />
 </button>
 </div>

 <p className="text-xs cth-muted mb-4">
 This will create {items.length} scheduled draft{items.length !== 1 ? 's' : ''}.
 </p>

 <div className="mb-4 space-y-1.5">
 {items.map((item) => (
 <div key={`${item.campaign_id}-${item.content_item_id}`} className="flex items-center gap-2.5 p-2.5 cth-card-muted rounded-lg border border-[var(--cth-command-border)]">
 <div className="flex-1 min-w-0">
 <p className="text-[11.5px] font-medium cth-muted truncate">{item.format}</p>
 <p className="text-[10px] cth-muted truncate">{item.platform} · {item.topic || 'No topic set'}</p>
 </div>
 <span className="text-[10px] cth-muted font-mono flex-shrink-0">{item.scheduled_date}</span>
 </div>
 ))}
 </div>

 <div className="flex gap-2">
 <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-[var(--cth-command-border)] cth-muted text-xs">
 Cancel
 </button>
 <button onClick={() => onConfirm(items)} className="flex-[2] py-2.5 rounded bg-[var(--cth-command-purple)] text-[var(--cth-command-gold)] text-xs font-semibold">
 Push {items.length} items to Calendar
 </button>
 </div>
 </div>
 </div>
 );
}

const LINKAGE_PANEL_STYLE = {
 marginTop: 24,
 padding: '20px 24px',
 background: 'var(--cth-command-panel, #fbf7f1)',
 border: '1px solid var(--cth-command-border, rgba(216,197,195,0.6))',
 borderRadius: 6,
};
const LINKAGE_EYEBROW_STYLE = {
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 10,
 fontWeight: 600,
 letterSpacing: '0.22em',
 textTransform: 'uppercase',
 color: 'var(--cth-command-muted, #7a6a72)',
 marginBottom: 6,
};
const LINKAGE_HEADING_STYLE = {
 fontFamily: '"Playfair Display", serif',
 fontSize: 20,
 color: 'var(--cth-command-ink, #2a1a25)',
 margin: 0,
};
const LINKAGE_ADD_BTN_STYLE = {
 padding: '8px 16px',
 borderRadius: 4,
 backgroundColor: 'var(--cth-command-purple, #33033C)',
 color: 'var(--cth-command-gold, #C4A95B)',
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 12,
 fontWeight: 600,
 letterSpacing: '0.04em',
 border: 'none',
 cursor: 'pointer',
};
const LINKAGE_SOURCE_BADGE = {
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 9,
 fontWeight: 700,
 letterSpacing: '0.14em',
 textTransform: 'uppercase',
 padding: '3px 7px',
 borderRadius: 3,
 background: 'var(--cth-command-panel-soft, #f4eee5)',
 color: 'var(--cth-command-purple, #33033C)',
 border: '1px solid var(--cth-command-border, rgba(216,197,195,0.6))',
};

function CampaignLinkagePanels({
 selected,
 linkedMedia,
 linkedContent,
 linkedSocialPosts,
 linkageLoading,
 onRemoveMedia,
 onAddMedia,
 onAddContent,
 onAddSocial,
}) {
 if (!selected) return null;

 const cardBg = 'var(--cth-command-panel-soft, #f4eee5)';
 const cardBorder = '1px solid var(--cth-command-border, rgba(216,197,195,0.6))';
 const ink = 'var(--cth-command-ink, #2a1a25)';
 const muted = 'var(--cth-command-muted, #7a6a72)';

 return (
 <div style={{ padding: '0 32px 32px' }}>
 {/* CAMPAIGN MEDIA */}
 <div style={LINKAGE_PANEL_STYLE}>
 <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
 <div>
 <div style={LINKAGE_EYEBROW_STYLE}>Campaign Media</div>
 <h3 style={LINKAGE_HEADING_STYLE}>Linked Media</h3>
 </div>
 <button type="button" onClick={onAddMedia} style={LINKAGE_ADD_BTN_STYLE}>+ Add Media</button>
 </div>
 {linkageLoading ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>Loading…</p>
 ) : linkedMedia.length === 0 ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>No media linked yet. Generate or upload assets in Media Studio.</p>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
 {linkedMedia.map((m) => {
 const id = m.asset_id || m.id;
 const url = m.preview_url || m.file_url || m.url || '';
 const isVideo = m.media_type === 'video' || m.file_type?.startsWith?.('video');
 return (
 <div key={id} style={{ background: cardBg, border: cardBorder, borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
 <div style={{ aspectRatio: '4 / 3', background: 'var(--cth-command-panel, #fbf7f1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 {url ? (
 isVideo ? (
 <video src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
 ) : (
 <img src={url} alt={m.label || m.prompt || 'Media'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
 )
 ) : (
 <span style={{ color: muted, fontSize: 11 }}>No preview</span>
 )}
 </div>
 <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
 <span style={LINKAGE_SOURCE_BADGE}>{m.source === 'uploaded' ? 'Uploaded' : 'Generated'}</span>
 <button
 type="button"
 onClick={() => onRemoveMedia(id)}
 style={{
 background: 'none',
 border: 'none',
 padding: 0,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 11,
 color: 'var(--cth-command-crimson, #AF0024)',
 cursor: 'pointer',
 textDecoration: 'underline',
 }}
 >
 Remove
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>

 {/* CAMPAIGN CONTENT */}
 <div style={LINKAGE_PANEL_STYLE}>
 <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
 <div>
 <div style={LINKAGE_EYEBROW_STYLE}>Campaign Content</div>
 <h3 style={LINKAGE_HEADING_STYLE}>Linked Content</h3>
 </div>
 <button type="button" onClick={onAddContent} style={LINKAGE_ADD_BTN_STYLE}>+ Create Content</button>
 </div>
 {linkageLoading ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>Loading…</p>
 ) : linkedContent.length === 0 ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>No content linked yet. Generate copy in Content Studio.</p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {linkedContent.map((c) => (
 <div key={c.id} style={{ background: cardBg, border: cardBorder, borderRadius: 4, padding: '12px 14px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
 <span style={LINKAGE_SOURCE_BADGE}>{c.content_type || 'Content'}</span>
 <span style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: ink }}>{c.title || 'Untitled'}</span>
 </div>
 <p style={{ margin: 0, color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 12, lineHeight: 1.5 }}>
 {(c.content || '').replace(/[#*_>`]/g, '').slice(0, 100)}{(c.content || '').length > 100 ? '…' : ''}
 </p>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* SOCIAL POSTS */}
 <div style={LINKAGE_PANEL_STYLE}>
 <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
 <div>
 <div style={LINKAGE_EYEBROW_STYLE}>Social Posts</div>
 <h3 style={LINKAGE_HEADING_STYLE}>Scheduled Posts</h3>
 </div>
 <button type="button" onClick={onAddSocial} style={LINKAGE_ADD_BTN_STYLE}>+ Schedule Post</button>
 </div>
 {linkageLoading ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>Loading…</p>
 ) : linkedSocialPosts.length === 0 ? (
 <p style={{ color: muted, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13 }}>No social posts linked yet. Schedule one in Social Planner.</p>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
 {linkedSocialPosts.map((p) => {
 const statusColors = {
 draft: { bg: 'var(--cth-command-panel, #fbf7f1)', fg: muted },
 scheduled: { bg: 'rgba(196,169,91,0.18)', fg: 'var(--cth-command-purple, #33033C)' },
 published: { bg: 'rgba(51,3,60,0.10)', fg: 'var(--cth-command-purple, #33033C)' },
 failed: { bg: 'rgba(175,0,36,0.12)', fg: 'var(--cth-command-crimson, #AF0024)' },
 };
 const sc = statusColors[p.status] || statusColors.draft;
 return (
 <div key={p.id} style={{ background: cardBg, border: cardBorder, borderRadius: 4, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
 <div style={{ minWidth: 0, flex: 1 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
 <span style={LINKAGE_SOURCE_BADGE}>{p.platform || 'Platform'}</span>
 <span style={{ ...LINKAGE_SOURCE_BADGE, background: sc.bg, color: sc.fg }}>{p.status || 'draft'}</span>
 {p.scheduled_for ? (
 <span style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 11, color: muted }}>
 {new Date(p.scheduled_for).toLocaleDateString()}
 </span>
 ) : null}
 </div>
 <p style={{ margin: 0, color: ink, fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 13, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
 {(p.content || '').slice(0, 140)}
 </p>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 );
}

function CampaignBuilderPageContent() {
 const { user } = useUser();
 const { currentWorkspace } = useWorkspace();
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();

 const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || '';
 const userId = user?.id || '';

 const [campaigns, setCampaigns] = useState([]);
 const [selectedId, setSelectedId] = useState(null);
 const [statusFilter, setStatusFilter] = useState('all');
 const [searchQuery, setSearchQuery] = useState('');
 const [sortOrder, setSortOrder] = useState('newest');
 const [detailTab, setDetailTab] = useState('overview');
 const [loading, setLoading] = useState(true);
 const [savedOffers, setSavedOffers] = useState([]);
 const [calendarCampaign, setCalendarCampaign] = useState(null);
 const [calendarDone, setCalendarDone] = useState({});

 const [linkedMedia, setLinkedMedia] = useState([]);
 const [linkedContent, setLinkedContent] = useState([]);
 const [linkedSocialPosts, setLinkedSocialPosts] = useState([]);
 const [linkageLoading, setLinkageLoading] = useState(false);

 const [briefGenerating, setBriefGenerating] = useState(false);
 const [briefRegenerating, setBriefRegenerating] = useState(false);
 const [briefModalOpen, setBriefModalOpen] = useState(false);

 const [hooksGenerating, setHooksGenerating] = useState(false);
 const [hooksRegenerating, setHooksRegenerating] = useState(false);
 const [hooksModalOpen, setHooksModalOpen] = useState(false);

 const loadCampaigns = useCallback(async () => {
 if (!workspaceId || !userId) return;

 try {
 const res = await apiClient.get('/api/campaigns', {
 params: {
 user_id: userId,
 workspace_id: workspaceId,
 },
 });
 const nextCampaigns = res?.campaigns || [];
 setCampaigns(nextCampaigns);

 const idFromUrl = searchParams.get('id');
 setSelectedId((prev) => {
 if (idFromUrl && nextCampaigns.some((c) => c.id === idFromUrl)) return idFromUrl;
 if (prev && nextCampaigns.some((c) => c.id === prev)) return prev;
 return nextCampaigns[0]?.id || null;
 });
 } catch (e) {
 console.error('Failed to load campaigns:', e);
 } finally {
 setLoading(false);
 }
 }, [workspaceId, userId, searchParams]);

 const loadOffers = useCallback(async () => {
 if (!workspaceId || !userId) return;
 try {
 const res = await apiClient.get('/api/offers', {
 params: {
 user_id: userId,
 workspace_id: workspaceId,
 },
 });
 setSavedOffers(res?.offers || []);
 } catch (e) {
 console.error('Failed to load offers:', e);
 setSavedOffers([]);
 }
 }, [workspaceId, userId]);

 useEffect(() => {
 if (!workspaceId) return;
 loadCampaigns();
 loadOffers();
 }, [workspaceId, loadCampaigns, loadOffers]);

 const selected = useMemo(
 () => campaigns.find((c) => c.id === selectedId) || null,
 [campaigns, selectedId]
 );

 const loadLinkedAssets = useCallback(async (campaignId) => {
 if (!campaignId) {
 setLinkedMedia([]);
 setLinkedContent([]);
 setLinkedSocialPosts([]);
 return;
 }
 setLinkageLoading(true);
 try {
 const [mediaRes, contentRes, socialRes] = await Promise.allSettled([
 apiClient.get(`/api/media/campaign/${campaignId}`),
 apiClient.get('/api/persist/content/library', { params: { user_id: userId, workspace_id: workspaceId, campaign_id: campaignId } }),
 apiClient.get(`/api/social/posts/by-campaign/${campaignId}`),
 ]);
 setLinkedMedia(mediaRes.status === 'fulfilled' ? (mediaRes.value?.media || []) : []);
 const allContent = contentRes.status === 'fulfilled' ? (contentRes.value?.items || contentRes.value?.content || []) : [];
 setLinkedContent(allContent.filter((it) => it.campaign_id === campaignId));
 setLinkedSocialPosts(socialRes.status === 'fulfilled' ? (socialRes.value?.posts || []) : []);
 } catch (e) {
 console.error('Failed to load linked assets:', e);
 } finally {
 setLinkageLoading(false);
 }
 }, [userId, workspaceId]);

 useEffect(() => {
 if (selectedId) loadLinkedAssets(selectedId);
 else {
 setLinkedMedia([]);
 setLinkedContent([]);
 setLinkedSocialPosts([]);
 }
 }, [selectedId, loadLinkedAssets]);

 const handleRemoveLinkedMedia = useCallback(async (assetId) => {
 if (!selected || !assetId) return;
 const currentIds = Array.isArray(selected.media_asset_ids) ? selected.media_asset_ids : [];
 const nextIds = currentIds.filter((id) => id !== assetId);
 try {
 await apiClient.put(`/api/campaigns/${selected.id}`, { media_asset_ids: nextIds });
 setCampaigns((prev) => prev.map((c) => (c.id === selected.id ? { ...c, media_asset_ids: nextIds } : c)));
 setLinkedMedia((prev) => prev.filter((m) => (m.asset_id || m.id) !== assetId));
 } catch (e) {
 console.error('Failed to remove media from campaign:', e);
 }
 }, [selected]);

 const filtered = useMemo(
 () => {
 let list = campaigns.filter((c) => statusFilter === 'all' || c.status === statusFilter);

 const term = searchQuery.trim().toLowerCase();
 if (term) {
 list = list.filter((c) => (c.name || '').toLowerCase().includes(term));
 }

 const sorted = [...list];
 switch (sortOrder) {
 case 'oldest':
 sorted.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
 break;
 case 'name-asc':
 sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
 break;
 case 'newest':
 default:
 sorted.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
 break;
 }

 return sorted;
 },
 [campaigns, statusFilter, searchQuery, sortOrder]
 );

 const renderedCampaignBrief = useMemo(() => {
 if (!selected?.brief) return '';
 return DOMPurify.sanitize(marked.parse(selected.brief));
 }, [selected?.brief]);

 const handleSave = (campaign) => {
 setCampaigns((prev) => [campaign, ...prev.filter((c) => c.id !== campaign.id)]);
 setSelectedId(campaign.id);
 setDetailTab('overview');
 setSearchQuery('');
 };

 const handleStatusChange = async (id, status) => {
 setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));

 try {
 await apiClient.post(`/api/campaigns/${id}/status`, null, { params: { status } });
 } catch (e) {
 console.error('Status update failed:', e);
 }

 if (status === 'active') {
 const camp = campaigns.find((c) => c.id === id);
 if (camp?.content_plan?.length) {
 navigate('/social-media-manager', {
 state: {
 campaignId: camp.id,
 campaignName: camp.name,
 offerName: camp.offer_name || '',
 contentPlan: camp.content_plan || [],
 source: 'campaign-builder',
 },
 });
 }
 }
 };

 const handleSaveResults = async (id, updates) => {
 setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
 try {
 await apiClient.post(`/api/campaigns/${id}/update-results`, updates);
 } catch (e) {
 console.error('Results save failed:', e);
 }
 };

 const handleDelete = async (id) => {
 const target = campaigns.find((c) => c.id === id);
 const label = target?.name ? `"${target.name}"` : 'this campaign';
 if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

 const previous = campaigns;
 setCampaigns((prev) => prev.filter((c) => c.id !== id));
 if (selectedId === id) {
 const remaining = previous.filter((c) => c.id !== id);
 setSelectedId(remaining[0]?.id || null);
 }
 try {
 await apiClient.delete(`/api/campaigns/${id}`);
 } catch (e) {
 console.error('Delete failed:', e);
 setCampaigns(previous);
 setSelectedId(id);
 window.alert('Could not delete campaign. Please try again.');
 }
 };

 const handleCalendarConfirm = async (items) => {
 try {
 await apiClient.post('/api/campaigns/calendar-items', { items });
 } catch (e) {
 console.error('Calendar push failed:', e);
 }
 if (calendarCampaign?.id) {
 setCalendarDone((prev) => ({ ...prev, [calendarCampaign.id]: true }));
 }
 setCalendarCampaign(null);
 };

 const handleAssetsUpdate = async (campaignId, nextAssets) => {
 setCampaigns((prev) =>
 prev.map((c) => (c.id === campaignId ? { ...c, campaign_assets: nextAssets } : c))
 );

 try {
 await apiClient.patch(`/api/campaigns/${campaignId}`, {
 campaign_assets: nextAssets,
 });
 } catch (e) {
 console.error('Failed to persist campaign assets:', e);
 }
 };

 const handleGenerateBrief = async () => {
 if (!selected || briefGenerating) return;
 setBriefGenerating(true);
 try {
 const res = await apiClient.post(`/api/campaigns/${selected.id}/generate-brief`);
 const newBrief = res?.brief || '';
 setCampaigns((prev) =>
 prev.map((c) => (c.id === selected.id ? { ...c, brief: newBrief } : c))
 );
 toast.success('Brief generated.');
 } catch (err) {
 toast.error(err?.message || 'Failed to generate brief.');
 } finally {
 setBriefGenerating(false);
 }
 };

 const handleBriefRegenerate = async (mode) => {
 if (!selected || briefRegenerating) return;
 setBriefRegenerating(true);
 try {
 const res = await apiClient.post(
 API_PATHS.campaigns.regenerateBrief(selected.id),
 null,
 { params: { mode } }
 );
 if (res?.id) {
 setCampaigns((prev) =>
 prev.map((c) => (c.id === res.id ? res : c))
 );
 }
 setBriefModalOpen(false);
 toast.success('Brief regenerated.');
 } catch (err) {
 toast.error(err?.message || 'Failed to regenerate brief.');
 } finally {
 setBriefRegenerating(false);
 }
 };

 const handleGenerateHooks = async () => {
 if (!selected || hooksGenerating) return;
 setHooksGenerating(true);
 try {
 const res = await apiClient.post(`/api/campaigns/${selected.id}/generate-hooks`);
 const newHooks = Array.isArray(res?.hooks) ? res.hooks : [];
 setCampaigns((prev) =>
 prev.map((c) => (c.id === selected.id ? { ...c, generated_hooks: newHooks } : c))
 );
 toast.success('Hooks generated.');
 } catch (err) {
 toast.error(err?.message || 'Failed to generate hooks.');
 } finally {
 setHooksGenerating(false);
 }
 };

 const handleHooksRegenerate = async (mode) => {
 if (!selected || hooksRegenerating) return;
 setHooksRegenerating(true);
 try {
 const res = await apiClient.post(
 API_PATHS.campaigns.regenerateHooks(selected.id),
 null,
 { params: { mode } }
 );
 if (res?.id) {
 setCampaigns((prev) =>
 prev.map((c) => (c.id === res.id ? res : c))
 );
 }
 setHooksModalOpen(false);
 toast.success('Hooks regenerated.');
 } catch (err) {
 toast.error(err?.message || 'Failed to regenerate hooks.');
 } finally {
 setHooksRegenerating(false);
 }
 };

 const handleCampaignUpdate = (updated) => {
 if (!updated?.id) return;
 setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
 };

 if (!workspaceId || loading) {
 return (
 <DashboardLayout>
 <div className="flex items-center justify-center h-full">
 <Loader2 className="animate-spin cth-text-accent" size={32} />
 </div>
 </DashboardLayout>
 );
 }

 return (
 <DashboardLayout>
 <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', sans-serif", backgroundColor: 'var(--cth-command-blush)', minHeight: '100vh' }}>
 {calendarCampaign && (
 <CalendarPopulateModal
 campaign={calendarCampaign}
 onConfirm={handleCalendarConfirm}
 onCancel={() => setCalendarCampaign(null)}
 />
 )}

 <RegenerateModal
 isOpen={briefModalOpen}
 onClose={() => setBriefModalOpen(false)}
 onConfirm={handleBriefRegenerate}
 target="brief"
 isProcessing={briefRegenerating}
 />

 <RegenerateModal
 isOpen={hooksModalOpen}
 onClose={() => setHooksModalOpen(false)}
 onConfirm={handleHooksRegenerate}
 target="hooks"
 isProcessing={hooksRegenerating}
 />

 <TopBar
 title="Campaign Builder"
 subtitle="MAGNET Framework — Mission · Audience · Gravity · Narrative · Engagement · Transaction"
 action={
 <div className="flex items-center gap-2">
 <button
 onClick={() => navigate('/command-center')}
 className="h-9 w-9 flex items-center justify-center transition-colors hover:opacity-80"
 style={{
 borderRadius: 4,
 border: '1px solid var(--cth-command-border)',
 background: 'transparent',
 color: 'var(--cth-command-ink)',
 }}
 aria-label="Go to Command Center"
 title="Home"
 >
 <Home size={16} />
 </button>
 <button
 onClick={() => navigate('/help')}
 className="h-9 w-9 flex items-center justify-center transition-colors hover:opacity-80"
 style={{
 borderRadius: 4,
 border: '1px solid var(--cth-command-border)',
 background: 'transparent',
 color: 'var(--cth-command-ink)',
 }}
 aria-label="Messages"
 title="Messages"
 >
 <MessageCircle size={16} />
 </button>
 <button
 onClick={() => navigate('/notifications')}
 className="h-9 w-9 flex items-center justify-center transition-colors hover:opacity-80"
 style={{
 borderRadius: 4,
 border: '1px solid var(--cth-command-border)',
 background: 'transparent',
 color: 'var(--cth-command-ink)',
 }}
 aria-label="Notifications"
 title="Notifications"
 >
 <Bell size={16} />
 </button>
 </div>
 }
 />

 <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
 <div className="md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-[var(--cth-command-border)] flex flex-col bg-[var(--cth-command-panel)]/85 backdrop-blur-sm">
 <div className="px-3.5 py-3 border-b border-[var(--cth-command-border)] space-y-2">
 <button
 onClick={() => {
 navigate('/campaign-setup');
 }}
 data-testid="campaigns-new-button"
 className="w-full inline-flex items-center justify-center gap-2 transition-all hover:opacity-90"
 style={{
 background: 'var(--cth-command-purple)',
 color: 'var(--cth-command-gold)',
 border: 'none',
 borderRadius: 4,
 padding: '9px 12px',
 fontFamily: "'DM Sans', sans-serif",
 fontSize: 13,
 fontWeight: 600,
 cursor: 'pointer',
 }}
 >
 <Plus size={14} /> New Campaign
 </button>

 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search campaigns..."
 data-testid="campaigns-search-input"
 style={{
 width: '100%',
 background: 'var(--cth-command-panel)',
 color: 'var(--cth-command-ink)',
 border: '1px solid var(--cth-command-border)',
 borderRadius: 4,
 padding: '8px 12px',
 fontFamily: "'DM Sans', sans-serif",
 fontSize: 13,
 outline: 'none',
 boxSizing: 'border-box',
 }}
 />

 <select
 value={sortOrder}
 onChange={(e) => setSortOrder(e.target.value)}
 data-testid="campaigns-sort-select"
 style={{
 width: '100%',
 background: 'var(--cth-command-panel)',
 color: 'var(--cth-command-ink)',
 border: '1px solid var(--cth-command-border)',
 borderRadius: 4,
 padding: '8px 12px',
 fontFamily: "'DM Sans', sans-serif",
 fontSize: 13,
 outline: 'none',
 boxSizing: 'border-box',
 }}
 >
 <option value="newest">Newest First</option>
 <option value="oldest">Oldest First</option>
 <option value="name-asc">Name A-Z</option>
 </select>

 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="w-full rounded-xl border border-[var(--cth-command-border)] bg-white/80 px-3 py-2.5 text-xs font-medium cth-heading focus:outline-none focus:border-[var(--cth-command-crimson)]"
 >
 <option value="all">All Campaigns</option>
 <option value="active">Active</option>
 <option value="draft">Draft</option>
 <option value="paused">Paused</option>
 <option value="complete">Complete</option>
 </select>
 </div>

 <div className="flex-1 overflow-y-auto px-3 py-3 max-h-40 md:max-h-none space-y-2">
 {filtered.length === 0 && (
 <p className="text-xs cth-muted text-center py-8">
 {searchQuery.trim()
 ? `No campaigns matching "${searchQuery.trim()}"`
 : 'No campaigns yet'}
 </p>
 )}

 {filtered.map((c) => {
 const isActive = selectedId === c.id;
 return (
 <button
 key={c.id}
 onClick={() => {
 setSelectedId(c.id);
 setDetailTab('overview');
 }}
 className="w-full text-left px-4 py-3 transition-all"
 style={{
 background: isActive ? 'rgba(175, 0, 42, 0.04)' : 'var(--cth-command-panel-soft)',
 border: isActive ? '1px solid var(--cth-command-crimson)' : '1px solid var(--cth-command-border)',
 borderRadius: 4,
 }}
 >
 <div className="flex items-start justify-between mb-1.5">
 <span
 style={{
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 13,
 fontWeight: 600,
 color: 'var(--cth-command-ink)',
 }}
 >
 {c.name}
 </span>
 <StatusBadge status={c.status} />
 </div>
 <GoalBadge goal={c.goal} />
 <div className="mt-2.5">
 <MAGNETProgress campaign={c} />
 </div>
 {c.end_date && c.status === 'active' && (
 <p style={{ fontSize: 11, color: 'var(--cth-command-muted)', marginTop: 6 }}>
 {daysLeft(c.end_date)} days left
 </p>
 )}
 </button>
 );
 })}
 </div>
 </div>

 {selected ? (
 <div className="flex flex-1 overflow-hidden bg-[var(--cth-command-panel)] pt-4 md:pt-6">
 <div className="flex-1 overflow-y-auto">
 <div className="px-5 py-5 md:px-8 md:py-7 border-b border-[var(--cth-command-border)] space-y-5">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
 <div>
 <div className="flex flex-wrap items-center gap-2.5 mb-3">
 <StatusBadge status={selected.status} />
 <GoalBadge goal={selected.goal} />
 </div>
 <h2 className="text-2xl font-bold cth-heading" >
 {selected.name}
 </h2>
 <p className="text-sm cth-muted mt-1">{selected.offer_name}</p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {selected.status !== 'active' && (
 <button
 onClick={() => handleStatusChange(selected.id, 'active')}
 className="px-3.5 py-2.5 text-xs font-semibold transition-all hover:opacity-90"
 style={{
 background: 'var(--cth-command-purple)',
 color: 'var(--cth-command-gold)',
 border: 'none',
 borderRadius: 4,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 Activate
 </button>
 )}

 {selected.status === 'active' && (
 <button
 onClick={() => handleStatusChange(selected.id, 'paused')}
 className="px-3.5 py-2.5 text-xs font-semibold transition-all hover:opacity-80"
 style={{
 border: '1px solid var(--cth-command-gold)',
 background: 'transparent',
 color: 'var(--cth-command-gold)',
 borderRadius: 4,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 Pause
 </button>
 )}

 <button
 onClick={() => handleStatusChange(selected.id, 'completed_won')}
 className="px-3.5 py-2.5 text-xs font-semibold transition-all hover:opacity-90"
 style={{
 background: 'var(--cth-command-crimson)',
 color: 'var(--cth-command-ivory)',
 border: 'none',
 borderRadius: 4,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 Complete
 </button>

 <button
 onClick={() => handleDelete(selected.id)}
 title="Delete campaign"
 className="px-3 py-2.5 text-xs font-semibold transition-all hover:opacity-80 inline-flex items-center gap-1.5"
 style={{
 border: '1px solid var(--cth-command-border)',
 background: 'transparent',
 color: 'var(--cth-command-muted)',
 borderRadius: 4,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 <Trash2 size={14} />
 Delete
 </button>
 </div>
 </div>

 <MAGNETProgress campaign={selected} />

 <div
 className="flex flex-wrap items-center gap-0"
 style={{ borderBottom: '1px solid var(--cth-command-border)' }}
 >
 {['overview', 'content', 'launch', 'funnel', 'results', 'assets', 'brief', 'hooks'].map((tab) => {
 const active = detailTab === tab;
 return (
 <button
 key={tab}
 onClick={() => setDetailTab(tab)}
 className="text-sm transition-all"
 style={{
 padding: '10px 16px',
 background: 'transparent',
 borderBottom: active ? '2px solid var(--cth-command-crimson)' : '2px solid transparent',
 marginBottom: -1,
 color: active ? 'var(--cth-command-ink)' : 'var(--cth-command-muted)',
 fontWeight: active ? 600 : 500,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 }}
 >
 {tab === 'overview' ? 'Overview' : tab === 'content' ? 'Checklist' : tab === 'launch' ? 'Launch View' : tab === 'funnel' ? 'Funnel' : tab === 'results' ? 'Results' : tab === 'assets' ? 'Assets' : tab === 'brief' ? 'Brief' : tab === 'hooks' ? 'Hooks' : tab}
 </button>
 );
 })}
 </div>
 </div>

 <div className="px-8 py-6">
 {detailTab === 'overview' && (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 {[
 { label: 'Emotional Hook', value: selected.emotional_hook },
 { label: 'Audience', value: selected.avatar_snapshot?.name || selected.audience_description },
 { label: 'Promise', value: selected.promise },
 { label: 'Primary CTA', value: selected.cta_primary },
 ].map((item) => (
 <div
 key={item.label}
 style={{
 padding: 16,
 background: 'var(--cth-command-panel)',
 border: '1px solid var(--cth-command-border)',
 borderRadius: 4,
 }}
 >
 <p
 style={{
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: '0.18em',
 textTransform: 'uppercase',
 color: 'var(--cth-command-muted)',
 margin: 0,
 marginBottom: 8,
 }}
 >
 {item.label}
 </p>
 <p
 style={{
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 15,
 lineHeight: 1.7,
 color: 'var(--cth-command-ink)',
 margin: 0,
 }}
 >
 {item.value || 'Not set'}
 </p>
 </div>
 ))}
 </div>

 <RetrospectiveSection campaign={selected} onUpdate={handleCampaignUpdate} />

 <div className="pt-2">
 <button
 onClick={() => {
 navigate('/campaign-setup');
 }}
 className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--cth-command-purple)] text-[var(--cth-command-gold)] text-xs font-semibold shadow-sm"
 >
 <Plus size={14} /> New Campaign
 </button>
 </div>
 </div>
 )}

 {detailTab === 'content' && (
 <div className="space-y-4">
 <p className="text-sm font-semibold cth-muted mb-3">Content Checklist</p>
 {(() => {
 const allItems = selected.content_plan || [];
 const generatedItems = allItems.filter((item) => item.status === 'generated' || item.status === 'published' || item.status === 'complete').length;
 const pendingItems = allItems.filter((item) => !['generated', 'published', 'complete'].includes(item.status)).length;
 const completionPct = allItems.length ? Math.round((generatedItems / allItems.length) * 100) : 0;

 return (
 <div className="grid grid-cols-4 gap-3 mb-2">
 <div className="rounded-2xl border border-[var(--cth-command-border)] bg-white/70 p-3 shadow-sm">
 <p className="text-[9px] font-semibold uppercase tracking-widest cth-muted mb-1">Checklist Items</p>
 <p className="text-lg font-semibold cth-heading">{allItems.length}</p>
 </div>
 <div className="rounded-2xl border border-[var(--cth-command-border)] bg-white/70 p-3 shadow-sm">
 <p className="text-[9px] font-semibold uppercase tracking-widest cth-muted mb-1">Generated</p>
 <p className="text-lg font-semibold cth-heading">{generatedItems}</p>
 </div>
 <div className="rounded-2xl border border-[var(--cth-command-border)] bg-white/70 p-3 shadow-sm">
 <p className="text-[9px] font-semibold uppercase tracking-widest cth-muted mb-1">Pending</p>
 <p className="text-lg font-semibold cth-heading">{pendingItems}</p>
 </div>
 <div className="rounded-2xl border border-[var(--cth-command-border)] bg-white/70 p-3 shadow-sm">
 <p className="text-[9px] font-semibold uppercase tracking-widest cth-muted mb-1">Completion</p>
 <p className="text-lg font-semibold cth-heading">{completionPct}%</p>
 </div>
 </div>
 );
 })()}

 {[1, 2, 3, 4].map((week) => {
 const weekTypes = { 1: 'Awareness', 2: 'Education', 3: 'Authority', 4: 'Promotion' };
 const items = (selected.content_plan || []).filter((i) => i.week === week);
 if (!items.length) return null;

 return (
 <div key={week}>
 <p className="text-[10px] font-semibold uppercase tracking-widest cth-muted mb-2">
 Week {week} , {weekTypes[week]}
 </p>
 <div className="cth-card-muted rounded-xl border border-[var(--cth-command-border)] divide-y divide-white/[0.05]">
 {items.map((item) => (
 <div key={item.id} className="flex items-center justify-between px-4 py-3">
 <div>
 <p className="text-xs font-medium cth-muted">{item.format}</p>
 <p className="text-[10px] cth-muted">
 {item.platform}
 {item.topic ? ` · ${item.topic}` : ''}
 </p>
 </div>
 <button
 onClick={() =>
 navigate('/content-studio', {
 state: {
 campaignId: selected.id,
 contentItemId: item.id,
 format: item.format,
 platform: item.platform,
 topic:
 item.topic ||
 `${selected.offer_name || selected.name || 'Campaign'} ${item.format || 'content'}`,
 },
 })
 }
 className="text-[10.5px] px-2.5 py-1 rounded-md bg-[var(--cth-command-crimson)]/10 border border-[var(--cth-command-crimson)]/20 cth-text-accent font-medium"
 >
 {item.status === 'pending' ? 'Generate' : 'View'}
 </button>
 </div>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 )}

 {detailTab === 'launch' && (
 <div className="space-y-4">
 <p className="text-sm font-semibold cth-muted mb-1">Launch View</p>
 <p className="text-xs cth-muted mb-4">
 Read-only launch timeline derived from this campaign’s content checklist.
 </p>
 {(() => {
 const allItems = selected.content_plan || [];
 const completedItems = allItems.filter((item) => item.status === 'generated' || item.status === 'published' || item.status === 'complete').length;
 const pendingItems = allItems.filter((item) => !['generated', 'published', 'complete'].includes(item.status)).length;
 const completionPct = allItems.length ? Math.round((completedItems / allItems.length) * 100) : 0;

 return (
 <div className="grid grid-cols-4 gap-3">
 <div className="rounded-2xl border border-[var(--cth-command-border)] bg-white/70 p-3 shadow-sm">
 <p className="text-[9px] font-semibold uppercase tracking-widest cth-muted mb-1">Checklist Items</p>
 <p className="text-lg font-semibold cth-heading">{allItems.length}</p>
 </div>
 <div className="rounded-2xl border border-[var(--cth-command-border)] bg-white/70 p-3 shadow-sm">
 <p className="text-[9px] font-semibold uppercase tracking-widest cth-muted mb-1">Generated</p>
 <p className="text-lg font-semibold cth-heading">{completedItems}</p>
 </div>
 <div className="rounded-2xl border border-[var(--cth-command-border)] bg-white/70 p-3 shadow-sm">
 <p className="text-[9px] font-semibold uppercase tracking-widest cth-muted mb-1">Pending</p>
 <p className="text-lg font-semibold cth-heading">{pendingItems}</p>
 </div>
 <div className="rounded-2xl border border-[var(--cth-command-border)] bg-white/70 p-3 shadow-sm">
 <p className="text-[9px] font-semibold uppercase tracking-widest cth-muted mb-1">Completion</p>
 <p className="text-lg font-semibold cth-heading">{completionPct}%</p>
 </div>
 </div>
 );
 })()}


 {[
 { id: 'pre-launch', name: 'Pre-Launch', weeks: [1, 2] },
 { id: 'launch', name: 'Launch', weeks: [3] },
 { id: 'post-launch', name: 'Post-Launch', weeks: [4] },
 ].map((phase) => {
 const items = (selected.content_plan || []).filter((item) => phase.weeks.includes(item.week));
 const completed = items.filter((item) => item.status === 'generated' || item.status === 'published' || item.status === 'complete').length;

 return (
 <div key={phase.id} className="rounded-2xl border border-[var(--cth-command-border)] bg-white/70 p-4 shadow-sm">
 <div className="flex items-center justify-between mb-3">
 <div>
 <p className="text-sm font-semibold cth-heading">{phase.name}</p>
 <p className="text-[10px] cth-muted">
 {items.length} item{items.length !== 1 ? 's' : ''} · {completed}/{items.length} complete
 </p>
 </div>
 </div>

 {items.length === 0 ? (
 <p className="text-xs cth-muted">No campaign items mapped to this phase yet.</p>
 ) : (
 <div className="space-y-2">
 {items.map((item) => (
 <div
 key={item.id}
 className="flex items-center justify-between rounded-lg border border-[var(--cth-command-border)] px-3 py-2"
 >
 <div>
 <p className="text-xs font-medium cth-muted">{item.format || 'Content item'}</p>
 <p className="text-[10px] cth-muted">
 Week {item.week}
 {item.platform ? ` · ${item.platform}` : ''}
 {item.topic ? ` · ${item.topic}` : ''}
 </p>
 </div>
 <span className="text-[10px] font-semibold uppercase tracking-widest cth-text-accent">
 {item.status || 'pending'}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}

 {detailTab === 'funnel' && (
 <div>
 <p className="text-sm font-semibold cth-muted mb-4">Conversion Funnel</p>
 <div className="space-y-1">
 {(selected.conversion_funnel || []).map((step, idx) => (
 <div key={step.id} className="flex items-start gap-3">
 <div className="flex flex-col items-center">
 <div className="w-7 h-7 rounded-full cth-card-muted border border-[var(--cth-command-border)] flex items-center justify-center text-[10px] font-bold cth-muted">
 {idx + 1}
 </div>
 </div>
 <div className="flex-1 p-3 cth-card-muted rounded-lg border border-[var(--cth-command-border)] mb-1">
 <p className="text-xs font-medium cth-muted">{step.label}</p>
 <p className="text-[10px] cth-muted capitalize">{(step.type || '').replace(/_/g, ' ')}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 
 <div className="mt-6">
 <TrackingLinkManager
 title="Campaign Tracking Links"
 subtitle="Create campaign-specific tracked links for CTAs, launch emails, funnels, and social posts."
 defaultLabel={selected?.cta_primary || selected?.name || "Campaign CTA"}
 defaultUrl={selected?.cta_url || selected?.landing_page_url || selected?.url || ""}
 context={{
 source: "campaign_builder",
 campaign_id: selected?.id || selected?.campaign_id || "",
 metadata: {
 campaign_name: selected?.name || selected?.title || "",
 campaign_goal: selected?.goal || "",
 landing_page_url: selected?.landing_page_url || "",
 cta_url: selected?.cta_url || "",
 },
 }}
 />
 </div>

 {detailTab === 'results' && (
 <TabResults campaign={selected} onSaveResults={handleSaveResults} />
 )}

 {detailTab === 'assets' && (
 <div>
 <p className="text-sm font-semibold cth-muted mb-1">Campaign Assets</p>
 <p className="text-xs cth-muted mb-4">
 Upload creative files, ad images, and campaign assets.
 </p>
 <UploadZone
 context={`campaign-${selected.id}`}
 accept={['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']}
 maxFiles={30}
 maxSizeMB={50}
 assets={selected.campaign_assets || []}
 onUploadComplete={(newAssets) => {
 const updated = [...(selected.campaign_assets || []), ...newAssets];
 handleAssetsUpdate(selected.id, updated);
 }}
 onRemove={(assetId) => {
 const updated = (selected.campaign_assets || []).filter((a) => a.id !== assetId);
 handleAssetsUpdate(selected.id, updated);
 }}
 label="Campaign Creative"
 helpText="Ad images, videos, PDFs , up to 50MB each"
 />
 </div>
 )}

 {detailTab === 'brief' && (
 <div>
 <div className="flex items-center justify-between mb-4">
 <p className="text-sm font-semibold cth-muted">Campaign Brief</p>
 {selected.brief && (
 <button
 type="button"
 onClick={() => setBriefModalOpen(true)}
 disabled={briefRegenerating}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--cth-command-crimson)]/10 border border-[var(--cth-command-crimson)]/20 text-[10.5px] cth-text-accent disabled:opacity-50"
 >
 <RefreshCw size={12} />
 Regenerate Brief
 </button>
 )}
 </div>
 {selected.brief ? (
 <div className="p-5 rounded-2xl border border-[var(--cth-command-border)] bg-white/70 shadow-sm">
 <div
 className="cth-body text-sm cth-muted leading-relaxed [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1"
 dangerouslySetInnerHTML={{ __html: renderedCampaignBrief }}
 />
 </div>
 ) : (
 <div className="p-6 rounded-2xl border border-[var(--cth-command-border)] bg-white/70 shadow-sm text-center">
 <p className="text-sm cth-muted mb-4">No brief generated yet.</p>
 <button
 type="button"
 onClick={handleGenerateBrief}
 disabled={briefGenerating}
 className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[var(--cth-command-purple)] text-[var(--cth-command-gold)] text-xs font-semibold disabled:opacity-50"
 >
 {briefGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
 {briefGenerating ? 'Generating…' : 'Generate Brief'}
 </button>
 </div>
 )}
 </div>
 )}

 {detailTab === 'hooks' && (
 <div>
 <div className="flex items-center justify-between mb-4">
 <p className="text-sm font-semibold cth-muted">Campaign Hooks</p>
 {(selected.generated_hooks || []).length > 0 && (
 <button
 type="button"
 onClick={() => setHooksModalOpen(true)}
 disabled={hooksRegenerating}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--cth-command-crimson)]/10 border border-[var(--cth-command-crimson)]/20 text-[10.5px] cth-text-accent disabled:opacity-50"
 >
 <RefreshCw size={12} />
 Regenerate Hooks
 </button>
 )}
 </div>
 {(selected.generated_hooks || []).length > 0 ? (
 <div className="p-5 rounded-2xl border border-[var(--cth-command-border)] bg-white/70 shadow-sm">
 <ol className="space-y-2.5 list-decimal list-inside text-sm cth-muted leading-relaxed">
 {selected.generated_hooks.map((hook, i) => (
 <li key={i}>{hook}</li>
 ))}
 </ol>
 </div>
 ) : (
 <div className="p-6 rounded-2xl border border-[var(--cth-command-border)] bg-white/70 shadow-sm text-center">
 <p className="text-sm cth-muted mb-4">No hooks generated yet.</p>
 <button
 type="button"
 onClick={handleGenerateHooks}
 disabled={hooksGenerating}
 className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[var(--cth-command-purple)] text-[var(--cth-command-gold)] text-xs font-semibold disabled:opacity-50"
 >
 {hooksGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
 {hooksGenerating ? 'Generating…' : 'Generate Hooks'}
 </button>
 </div>
 )}
 </div>
 )}
 </div>

 <CampaignLinkagePanels
 selected={selected}
 linkedMedia={linkedMedia}
 linkedContent={linkedContent}
 linkedSocialPosts={linkedSocialPosts}
 linkageLoading={linkageLoading}
 onRemoveMedia={handleRemoveLinkedMedia}
 onAddMedia={() => navigate('/media-studio', { state: { campaignId: selected.id, campaignName: selected.name } })}
 onAddContent={() => navigate('/content-studio', { state: { campaignId: selected.id } })}
 onAddSocial={() => navigate('/social-media-manager', { state: { campaignId: selected.id, campaignName: selected.name } })}
 />
 </div>

 <div
 className="w-56 flex-shrink-0 self-start mt-6 mr-4 space-y-3"
 style={{
 background: 'var(--cth-command-panel)',
 border: '1px solid var(--cth-command-border)',
 borderRadius: 4,
 padding: 16,
 }}
 >
 <p
 style={{
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: '0.18em',
 textTransform: 'uppercase',
 color: 'var(--cth-command-muted)',
 margin: 0,
 marginBottom: 8,
 }}
 >
 Quick Actions
 </p>
 <div className="space-y-2">
 <button
 onClick={() => navigate('/content-studio', { state: { campaignId: selected.id } })}
 className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:opacity-90"
 style={{
 border: '1px solid var(--cth-command-border)',
 background: 'transparent',
 color: 'var(--cth-command-ink)',
 borderRadius: 4,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 13,
 }}
 onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cth-command-panel-soft)'; }}
 onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
 >
 Open Content Studio
 </button>
 <button
 onClick={() => navigate('/media-studio', { state: { campaignId: selected.id } })}
 className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:opacity-90"
 style={{
 border: '1px solid var(--cth-command-border)',
 background: 'transparent',
 color: 'var(--cth-command-ink)',
 borderRadius: 4,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 13,
 }}
 onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cth-command-panel-soft)'; }}
 onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
 >
 Open Media Studio
 </button>
 {selected.status === 'active' && selected.content_plan?.length > 0 && (
 <button
 onClick={() => setCalendarCampaign(selected)}
 className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:opacity-90"
 style={{
 border: '1px solid var(--cth-command-border)',
 background: 'transparent',
 color: 'var(--cth-command-ink)',
 borderRadius: 4,
 fontFamily: '"DM Sans", system-ui, sans-serif',
 fontSize: 13,
 }}
 onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cth-command-panel-soft)'; }}
 onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
 >
 <CalendarIcon size={12} /> Push to Calendar
 </button>
 )}
 </div>
 </div>
 </div>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
 <div className="w-16 h-16 rounded-2xl bg-[var(--cth-command-crimson)]/10 border border-[var(--cth-command-crimson)]/15 flex items-center justify-center mb-5">
 <span className="text-2xl font-black cth-text-accent/50">M</span>
 </div>
 <h3 className="text-base font-semibold cth-muted mb-2" >
 Build your first campaign
 </h3>
 <p className="text-sm cth-muted max-w-sm leading-relaxed mb-6">
 Every piece of content should serve a campaign.
 </p>
 <button
 onClick={() => navigate('/campaign-setup')}
 className="px-5 py-2.5 rounded bg-[var(--cth-command-purple)] text-[var(--cth-command-gold)] text-sm font-semibold"
 >
 Create Your First Campaign
 </button>
 </div>
 )}
 </div>
 </div>
 </DashboardLayout>
 );
}

export default function CampaignBuilderPage() {
 return <CampaignBuilderPageContent />;
}
