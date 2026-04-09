import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { DashboardLayout } from '../components/Layout';
import { Loader2, Plus, Zap, Calendar as CalendarIcon, X } from 'lucide-react';
import UploadZone from '../components/shared/UploadZone';
import apiClient from '../lib/apiClient';
import {
  useCampaignContext,
  CampaignContextBanner,
  StrategicOSSourceBadge,
} from '../hooks/useCampaignContext';

export const AI_CAMPAIGN_PROMPTS = {
  fullCampaign: (c, bm = {}) =>
    [
      'You are my marketing strategist and campaign architect.',
      `Brand: ${bm.brandName || '[from Brand Memory]'}`,
      `Mission: ${bm.mission || '[from Brand Memory]'}`,
      `Voice: ${bm.voice || '[from Brand Memory]'}`,
      `Positioning: ${bm.positioning || '[from Brand Memory]'}`,
      '',
      'Create a full marketing campaign brief.',
      `Offer: ${c.offer_name || ''} — ${c.offer_description || ''}`,
      `Audience: ${c.audience_description || ''}`,
      `Problem: ${c.audience_problem || ''}`,
      `Transformation: ${c.transformation || ''}`,
      `Desire: ${c.audience_desire || ''}`,
      `Awareness: ${c.awareness_stage || ''}`,
      `Goal: ${c.goal || ''}`,
      `Dates: ${c.start_date || ''} to ${c.end_date || ''}`,
      `Platforms: ${(c.platforms || []).join(', ')}`,
      `Hook: ${c.emotional_hook || ''}`,
      `Promise: ${c.promise || ''}`,
      `Authority: ${c.authority || ''}`,
      `CTA: ${c.cta_primary || ''}`,
      `Urgency: ${c.urgency_trigger || ''}`,
      '',
      'Generate: refined core message, campaign storyline, per-platform strategy, lead magnet idea, 3 objections to address, week-by-week content rhythm.',
      'Write in the brand voice. Be specific.',
    ].join('\n'),

  hookGenerator: (c) =>
    [
      'Create 20 marketing hooks for this campaign.',
      `Topic: ${c.name || ''} — ${c.offer_name || ''}`,
      `Audience: ${c.audience_description || ''}`,
      `Pain: ${c.audience_problem || ''}`,
      `Transformation: ${c.transformation || ''}`,
      `Awareness: ${c.awareness_stage || ''}`,
      '',
      'Use: curiosity triggers, authority openers, emotional mirrors, bold claims, contrarian takes.',
      'Label each: caption / reel first line / email subject / ad headline.',
    ].join('\n'),
};

const MAGNET_STEPS = [
  { id: 'M', letter: 'M', label: 'Mission', description: 'Define why this campaign exists and what offer drives it' },
  { id: 'A', letter: 'A', label: 'Audience', description: 'Define the exact person — problem, desire, awareness stage' },
  { id: 'G', letter: 'G', label: 'Gravity Message', description: 'Craft the emotional hook that attracts and converts' },
  { id: 'N', letter: 'N', label: 'Narrative Content System', description: 'Plan the content engine — types, formats, weekly rhythm' },
  { id: 'E', letter: 'E', label: 'Engagement Engine', description: 'Design how your audience interacts with the campaign' },
  { id: 'T', letter: 'T', label: 'Transaction', description: 'Build the conversion funnel from attention to sale' },
];

const GOAL_CONFIG = {
  offer_launch: { label: 'Offer Launch', color: '#E04E35' },
  lead_generation: { label: 'Lead Generation', color: '#0891b2' },
  audience_growth: { label: 'Audience Growth', color: '#059669' },
  engagement: { label: 'Engagement', color: '#d97706' },
  sales_conversion: { label: 'Sales Conversion', color: '#AF0024' },
  authority_building: { label: 'Authority Building', color: '#7c3aed' },
  re_engagement: { label: 'Re-Engagement', color: '#763B5B' },
  brand_awareness: { label: 'Brand Awareness', color: '#5D0012' },
};

const AWARENESS_STAGES = [
  { id: 'unaware', label: 'Unaware', description: 'Does not know they have the problem' },
  { id: 'problem_aware', label: 'Problem Aware', description: 'Knows the problem, not the solution' },
  { id: 'solution_aware', label: 'Solution Aware', description: 'Knows solutions exist, not your brand' },
  { id: 'brand_aware', label: 'Brand Aware', description: 'Knows you, not yet convinced' },
  { id: 'ready_to_buy', label: 'Ready to Buy', description: 'Needs the right offer and moment' },
];

const ENGAGEMENT_TACTICS = [
  'Comment prompt',
  'Poll or vote',
  'Free download',
  'Challenge',
  'Giveaway',
  'Webinar or live',
  'Quiz',
  'Template freebie',
  'Waitlist signup',
  'Community invite',
];

const CONVERSION_STEP_TYPES = [
  { type: 'ad', label: 'Ad / Paid Promotion' },
  { type: 'post', label: 'Organic Post' },
  { type: 'lead_magnet', label: 'Lead Magnet' },
  { type: 'email', label: 'Email Sequence' },
  { type: 'offer_page', label: 'Offer / Sales Page' },
  { type: 'purchase', label: 'Purchase' },
  { type: 'webinar', label: 'Webinar / Event' },
  { type: 'custom', label: 'Custom step' },
];

const PLATFORMS = ['Instagram', 'LinkedIn', 'X (Twitter)', 'TikTok', 'YouTube', 'Facebook', 'Email', 'Blog'];
const FORMATS = ['Instagram Caption', 'Reel Hook', 'Carousel Outline', 'Email Newsletter', 'Blog Post', 'Thread', 'Ad Copy', 'Sales Page'];
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
  draft: { label: 'Draft', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  active: { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  paused: { label: 'Paused', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  complete: { label: 'Complete', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
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
    M: !!(c.offer_name && c.goal && c.start_date && c.end_date && (c.platforms || []).length),
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
      className="text-[9.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ color: c.color, background: c.bg }}
    >
      {c.label}
    </span>
  );
}

function GoalBadge({ goal }) {
  const c = GOAL_CONFIG[goal] || { label: goal, color: '#888' };
  return (
    <span
      className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ color: c.color, background: `${c.color}18` }}
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
      {MAGNET_STEPS.map((step) => (
        <div
          key={step.id}
          title={`${step.letter} — ${step.label}`}
          className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold transition-all"
          style={{
            background: completion[step.id] ? '#E04E35' : 'rgba(255,255,255,0.07)',
            color: completion[step.id] ? '#fff' : 'rgba(255,255,255,0.2)',
          }}
        >
          {step.letter}
        </div>
      ))}
      <span className="text-[10px] text-white/25 ml-1">{count}/6</span>
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
        <p className="text-sm font-semibold text-white/60">Campaign Results</p>
        <button
          onClick={handleSave}
          data-testid="save-results-btn"
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            isSaved
              ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400'
              : 'border-[#E04E35]/25 bg-[#E04E35]/10 text-[#E04E35]'
          }`}
        >
          {isSaved ? '✓ Saved' : 'Save results'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-5 bg-white/[0.03] rounded-xl border border-white/[0.07]">
          <p className="text-[9.5px] font-semibold uppercase tracking-widest text-white/25 mb-2">Target</p>
          <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
            {campaign.target_value || '—'}
          </p>
          <p className="text-xs text-white/30 mt-0.5">{campaign.target_metric || 'Primary metric'}</p>
        </div>

        <div className="p-5 bg-white/[0.03] rounded-xl border border-white/[0.07]">
          <p className="text-[9.5px] font-semibold uppercase tracking-widest text-white/25 mb-2">Actual</p>
          <input
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            placeholder="Enter result..."
            className="bg-transparent border-none outline-none text-3xl font-bold w-full p-0"
            style={{
              fontFamily: 'Georgia, serif',
              color: act > 0 ? (overAchieved ? '#34d399' : '#E04E35') : 'rgba(255,255,255,0.25)',
            }}
          />
          <p className="text-xs text-white/30 mt-0.5">
            {campaign.target_metric || 'Primary metric'} {act > 0 && target > 0 ? `· ${pct}% of target` : ''}
          </p>
        </div>
      </div>

      <div>
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.min(pct, 100)}%`,
              background: overAchieved ? '#34d399' : pct >= 70 ? '#f59e0b' : '#E04E35',
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-semibold text-white/50">Additional Metrics</p>
          <button onClick={addMetric} className="text-[10.5px] text-[#E04E35]">+ Add metric</button>
        </div>

        <div className="bg-white/[0.02] rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_100px_80px] px-3.5 py-2 border-b border-white/[0.05] bg-white/[0.02]">
            {['Metric', 'Target', 'Actual', ''].map((h) => (
              <span key={h} className="text-[9px] font-semibold uppercase tracking-widest text-white/25">
                {h}
              </span>
            ))}
          </div>

          {metrics.length === 0 && (
            <p className="text-xs text-white/20 px-3.5 py-3">No additional metrics yet.</p>
          )}

          {metrics.map((m) => (
            <div key={m.id} className="grid grid-cols-[1fr_100px_100px_80px] items-center px-3.5 py-2 border-b border-white/[0.04] last:border-b-0">
              <input
                value={m.label}
                onChange={(e) => updateMetric(m.id, 'label', e.target.value)}
                placeholder="e.g. Impressions"
                list="metric-presets"
                className="bg-transparent border-none outline-none text-xs text-white/65"
              />
              <input
                value={m.target}
                onChange={(e) => updateMetric(m.id, 'target', e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white/40"
              />
              <input
                value={m.actual}
                onChange={(e) => updateMetric(m.id, 'actual', e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white/40"
              />
              <button onClick={() => removeMetric(m.id)} className="text-white/20 hover:text-red-400 text-sm ml-auto">
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
          <p className="text-xs font-semibold text-white/50">Weekly Breakdown</p>
          <button onClick={addWeek} className="text-[10.5px] text-[#E04E35]">+ Add week</button>
        </div>

        <div className="bg-white/[0.02] rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="grid grid-cols-[100px_1fr_1fr_1fr] px-3.5 py-2 border-b border-white/[0.05] bg-white/[0.02]">
            {['Week', 'Reach', 'Engagements', 'Leads'].map((h) => (
              <span key={h} className="text-[9px] font-semibold uppercase tracking-widest text-white/25">
                {h}
              </span>
            ))}
          </div>

          {weekly.map((w, idx) => (
            <div key={w.week} className={`grid grid-cols-[100px_1fr_1fr_1fr] items-center px-3.5 py-2 ${idx < weekly.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
              <div>
                <p className="text-xs font-semibold text-white/60">Week {w.week}</p>
                <p className="text-[9.5px] text-white/25">{w.label}</p>
              </div>
              <input value={w.reach || ''} onChange={(e) => updateWeekly(w.week, 'reach', e.target.value)} className="bg-transparent border-none outline-none text-xs text-white/50" />
              <input value={w.engagements || ''} onChange={(e) => updateWeekly(w.week, 'engagements', e.target.value)} className="bg-transparent border-none outline-none text-xs text-white/50" />
              <input value={w.leads || ''} onChange={(e) => updateWeekly(w.week, 'leads', e.target.value)} className="bg-transparent border-none outline-none text-xs text-white/50" />
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
      <div className="bg-[#1A0020] border border-white/10 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <p className="text-base font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
            Push to Calendar
          </p>
          <button onClick={onCancel} className="text-white/30 hover:text-white/60">
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-white/30 mb-4">
          This will create {items.length} scheduled draft{items.length !== 1 ? 's' : ''}.
        </p>

        <div className="mb-4 space-y-1.5">
          {items.map((item) => (
            <div key={`${item.campaign_id}-${item.content_item_id}`} className="flex items-center gap-2.5 p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-medium text-white/65 truncate">{item.format}</p>
                <p className="text-[10px] text-white/25 truncate">{item.platform} · {item.topic || 'No topic set'}</p>
              </div>
              <span className="text-[10px] text-white/25 font-mono flex-shrink-0">{item.scheduled_date}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-white/[0.09] text-white/40 text-xs">
            Cancel
          </button>
          <button onClick={() => onConfirm(items)} className="flex-[2] py-2.5 rounded-lg bg-[#E04E35] text-white text-xs font-semibold">
            Push {items.length} items to Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

function MAGNETForm({ workspaceId, savedOffers = [], onSave, onCancel, initialData = null }) {
  const navigate = useNavigate();
  const ctx = useCampaignContext(null, workspaceId);

  const [activeStep, setActiveStep] = useState('M');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [form, setForm] = useState(initialData ? { ...DEFAULT_FORM, ...initialData } : DEFAULT_FORM);

  useEffect(() => {
    setForm(initialData ? { ...DEFAULT_FORM, ...initialData } : DEFAULT_FORM);
  }, [initialData]);

  useEffect(() => {
    if (ctx.loading || !ctx.data || Object.keys(ctx.data).length === 0) return;

    setForm((prev) => {
      const updates = {};
      const usedFields = [];

      const fieldMapping = {
        target_audience: 'audience_description',
        pain_points: 'audience_problem',
        desired_outcome: 'audience_desire',
        unique_mechanism: 'authority',
        positioning: 'promise',
        primary_offer: 'offer_description',
        brand_voice: 'brand_voice',
      };

      Object.entries(fieldMapping).forEach(([osField, formField]) => {
        if (ctx.data[osField] && !prev[formField]) {
          updates[formField] = ctx.data[osField];
          usedFields.push(osField);
        }
      });

      if (ctx.data.primary_platform && (!prev.platforms || prev.platforms.length === 0)) {
        updates.platforms = [ctx.data.primary_platform];
        usedFields.push('primary_platform');
      }

      updates.os_context_used = usedFields;
      return { ...prev, ...updates };
    });
  }, [ctx.loading, ctx.data]);

  const up = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const selectOffer = (offer) =>
    setForm((p) => ({
      ...p,
      offer_id: offer.id,
      offer_name: offer.name,
      offer_description: offer.description,
      transformation: offer.transformation || p.transformation,
    }));

  const togglePlatform = (p) => {
    const curr = form.platforms || [];
    up('platforms', curr.includes(p) ? curr.filter((x) => x !== p) : [...curr, p]);
  };

  const toggleEngagement = (t) => {
    const curr = form.engagement_tactics || [];
    up('engagement_tactics', curr.includes(t) ? curr.filter((x) => x !== t) : [...curr, t]);
  };

  const handleSave = async () => {
    const errors = [];
    if (!form.name.trim()) errors.push('Campaign name is required');
    if (!form.offer_name.trim()) errors.push('Offer name is required');
    if (!form.audience_description.trim()) errors.push('Audience description is required');
    if (!form.audience_problem.trim()) errors.push('Audience problem is required');
    if (!form.emotional_hook.trim()) errors.push('Emotional hook is required');
    if (!form.cta_primary.trim()) errors.push('Primary CTA is required');

    if (errors.length) {
      alert(`Please complete the following before saving:\n\n${errors.map((e) => `• ${e}`).join('\n')}`);
      return;
    }

    try {
      let savedCampaign;
      if (form.id) {
        const res = await apiClient.put(`/api/campaigns/${form.id}`, form);
        savedCampaign = res?.id ? res : { ...form };
      } else {
        const res = await apiClient.post('/api/campaigns', form);
        savedCampaign = res;
      }
      onSave(savedCampaign);
    } catch (e) {
      alert(`Failed to save campaign: ${e?.payload?.detail || e.message}`);
    }
  };

  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    try {
      let campaignId = form.id;
      if (!campaignId) {
        const res = await apiClient.post('/api/campaigns', form);
        campaignId = res.id;
        setForm((p) => ({ ...p, id: campaignId }));
      }
      const briefRes = await apiClient.post(`/api/campaigns/${campaignId}/generate-brief`);
      up('brief', briefRes.brief);
    } catch {
      up(
        'brief',
        `Campaign: ${form.name || 'Untitled Campaign'}\n\nCore Message: ${form.emotional_hook || '...'}\n\nThis campaign targets ${form.audience_description || 'your defined audience'} who are at the ${form.awareness_stage} stage.\n\nThe campaign runs ${form.start_date} – ${form.end_date} across ${(form.platforms || []).join(', ')}.`
      );
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleGenerateHooks = async () => {
    setIsGeneratingHooks(true);
    try {
      let campaignId = form.id;
      if (!campaignId) {
        const res = await apiClient.post('/api/campaigns', form);
        campaignId = res.id;
        setForm((p) => ({ ...p, id: campaignId }));
      }
      const hooksRes = await apiClient.post(`/api/campaigns/${campaignId}/generate-hooks`);
      up('generated_hooks', hooksRes.hooks);
    } catch {
      up('generated_hooks', [
        `You do not have a ${(form.offer_name || 'brand').toLowerCase()} problem. You have a sequence problem.`,
        `Nobody talks about why ${(form.audience_desire || 'consistent results')} stays out of reach.`,
        `After watching hundreds of founders do this wrong — here is what actually works.`,
      ]);
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  const completionMap = magnetCompletion(form);

  const weekPhases = [
    { week: 1, type: 'awareness', label: 'Week 1 — Awareness' },
    { week: 2, type: 'education', label: 'Week 2 — Education' },
    { week: 3, type: 'authority', label: 'Week 3 — Authority' },
    { week: 4, type: 'promotion', label: 'Week 4 — Promotion' },
  ];

  const addContentItem = (week, type) => {
    up('content_plan', [
      ...(form.content_plan || []),
      {
        id: Date.now().toString(),
        week,
        type,
        format: 'Instagram Caption',
        platform: 'Instagram',
        topic: '',
        status: 'pending',
      },
    ]);
  };

  const inputClass =
    'w-full bg-white/[0.04] border border-white/[0.09] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#E04E35]/40';
  const taClass = `${inputClass} resize-none leading-relaxed`;
  const labelClass = 'text-[10px] font-semibold tracking-widest uppercase text-white/35 block mb-1.5';

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-52 flex-shrink-0 border-r border-white/[0.07] py-5 px-4 bg-[#0D0010] flex flex-col">
        <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white/25 mb-4">MAGNET Framework</p>

        {MAGNET_STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg mb-1.5 text-left ${
              activeStep === step.id ? 'bg-[#33033C]/80' : 'hover:bg-white/[0.03]'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                completionMap[step.id]
                  ? 'bg-emerald-400/20 text-emerald-400'
                  : activeStep === step.id
                  ? 'bg-[#E04E35] text-white'
                  : 'bg-white/[0.07] text-white/30'
              }`}
            >
              {completionMap[step.id] ? '✓' : step.letter}
            </div>
            <div>
              <p className={`text-[11.5px] font-semibold ${activeStep === step.id ? 'text-white' : 'text-white/45'}`}>
                {step.label}
              </p>
              <p className="text-[9.5px] text-white/20 mt-0.5">{step.description}</p>
            </div>
          </button>
        ))}

        <div className="mt-4 pt-4 border-t border-white/[0.07]">
          <label className={labelClass}>Campaign name</label>
          <input
            value={form.name}
            onChange={(e) => up('name', e.target.value)}
            placeholder="e.g. Q2 Launch"
            className={inputClass}
          />
        </div>

        <div className="mt-auto pt-4 border-t border-white/[0.07] space-y-2">
          <button onClick={handleSave} className="w-full py-2.5 rounded-lg bg-[#E04E35] text-white text-xs font-semibold">
            {form.id ? 'Save Changes' : 'Save Campaign'}
          </button>
          <button onClick={onCancel} className="w-full py-2 text-xs text-white/30">
            Cancel
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-7">
        <CampaignContextBanner ctx={ctx} onViewOS={() => navigate('/strategic-os')} />

        {ctx.loading && (
          <div className="flex items-center gap-2 p-3 rounded-lg mb-5 bg-white/[0.04]">
            <Loader2 size={14} className="animate-spin text-[#E04E35]" />
            <span className="text-[11.5px] text-white/40">Loading your Strategic OS context...</span>
          </div>
        )}

        {activeStep === 'M' && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                M — Mission
              </p>
              <p className="text-xs text-white/40 mb-5">Define why this campaign exists.</p>
            </div>

            {!!savedOffers.length && (
              <div>
                <label className={labelClass}>Select from saved offers</label>
                <div className="grid grid-cols-1 gap-2 mb-3">
                  {savedOffers.map((offer) => (
                    <button
                      key={offer.id}
                      onClick={() => selectOffer(offer)}
                      className={`p-3 rounded-lg border text-left ${
                        form.offer_id === offer.id
                          ? 'border-[#E04E35]/50 bg-[#E04E35]/10'
                          : 'border-white/[0.08] bg-white/[0.02]'
                      }`}
                    >
                      <p className="text-xs font-semibold text-white/75">{offer.name}</p>
                      <p className="text-[10.5px] text-white/35 mt-1">{offer.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>Offer name</label>
              <input value={form.offer_name} onChange={(e) => up('offer_name', e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Offer description</label>
              <textarea value={form.offer_description} onChange={(e) => up('offer_description', e.target.value)} className={taClass} rows={2} />
            </div>

            <div>
              <label className={labelClass}>Transformation</label>
              <input value={form.transformation} onChange={(e) => up('transformation', e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Campaign goal</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(GOAL_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => up('goal', key)}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium ${
                      form.goal === key
                        ? 'border-[#E04E35]/50 bg-[#E04E35]/10 text-white'
                        : 'border-white/[0.08] bg-white/[0.02] text-white/45'
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Start date</label>
                <input type="date" value={form.start_date} onChange={(e) => up('start_date', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>End date</label>
                <input type="date" value={form.end_date} onChange={(e) => up('end_date', e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      (form.platforms || []).includes(p)
                        ? 'bg-[#E04E35]/15 border-[#E04E35]/40 text-[#E04E35]'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/40'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeStep === 'A' && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                A — Audience
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className={labelClass + ' mb-0'}>Who exactly is this campaign for?</label>
                {ctx.prefilled?.includes('target_audience') && <StrategicOSSourceBadge step="Audience Psychology" />}
              </div>
              <textarea value={form.audience_description} onChange={(e) => up('audience_description', e.target.value)} className={taClass} rows={3} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className={labelClass + ' mb-0'}>What problem are they experiencing?</label>
                {ctx.prefilled?.includes('pain_points') && <StrategicOSSourceBadge step="Audience Psychology" />}
              </div>
              <textarea value={form.audience_problem} onChange={(e) => up('audience_problem', e.target.value)} className={taClass} rows={2} />
            </div>

            <div>
              <label className={labelClass}>What do they deeply desire?</label>
              <textarea value={form.audience_desire} onChange={(e) => up('audience_desire', e.target.value)} className={taClass} rows={2} />
            </div>

            <div>
              <label className={labelClass}>Awareness stage</label>
              <div className="flex flex-col gap-2">
                {AWARENESS_STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => up('awareness_stage', s.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left ${
                      form.awareness_stage === s.id
                        ? 'border-[#E04E35]/50 bg-[#E04E35]/10'
                        : 'border-white/[0.07] bg-white/[0.02]'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${form.awareness_stage === s.id ? 'bg-[#E04E35]' : 'bg-white/[0.12]'}`} />
                    <div>
                      <p className={`text-xs font-semibold ${form.awareness_stage === s.id ? 'text-white' : 'text-white/55'}`}>
                        {s.label}
                      </p>
                      <p className="text-[10px] text-white/30">{s.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeStep === 'G' && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                G — Gravity Message
              </p>
            </div>

            <div>
              <label className={labelClass}>Emotional hook</label>
              <input value={form.emotional_hook} onChange={(e) => up('emotional_hook', e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Promise</label>
              <textarea value={form.promise} onChange={(e) => up('promise', e.target.value)} className={taClass} rows={2} />
            </div>

            <div>
              <label className={labelClass}>Authority statement</label>
              <input value={form.authority} onChange={(e) => up('authority', e.target.value)} className={inputClass} />
            </div>

            <div className="pt-3 border-t border-white/[0.07]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-white/60">AI Hook Generator</p>
                </div>
                <button
                  onClick={handleGenerateHooks}
                  disabled={isGeneratingHooks}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E04E35]/10 border border-[#E04E35]/20 text-[10.5px] text-[#E04E35]"
                >
                  {isGeneratingHooks ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  {isGeneratingHooks ? 'Generating...' : 'Generate Hooks'}
                </button>
              </div>

              {(form.generated_hooks || []).length > 0 && (
                <div className="space-y-2">
                  {form.generated_hooks.map((hook, i) => (
                    <button
                      key={i}
                      onClick={() => up('emotional_hook', hook)}
                      className="w-full text-left p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]"
                    >
                      <p className="text-xs text-white/60 leading-relaxed italic">"{hook}"</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeStep === 'N' && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                N — Narrative Content System
              </p>
            </div>

            {weekPhases.map((phase) => (
              <div key={phase.week}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-white/60">{phase.label}</p>
                  <button onClick={() => addContentItem(phase.week, phase.type)} className="text-[10px] text-[#E04E35]">
                    + Add item
                  </button>
                </div>

                <div className="space-y-2">
                  {(form.content_plan || []).filter((item) => item.week === phase.week).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                      <select
                        value={item.format}
                        onChange={(e) =>
                          up(
                            'content_plan',
                            form.content_plan.map((c) => (c.id === item.id ? { ...c, format: e.target.value } : c))
                          )
                        }
                        className="bg-[#1A0020] border border-white/[0.08] rounded-md px-2 py-1 text-[10.5px] text-white/60"
                      >
                        {FORMATS.map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>

                      <select
                        value={item.platform}
                        onChange={(e) =>
                          up(
                            'content_plan',
                            form.content_plan.map((c) => (c.id === item.id ? { ...c, platform: e.target.value } : c))
                          )
                        }
                        className="bg-[#1A0020] border border-white/[0.08] rounded-md px-2 py-1 text-[10.5px] text-white/60"
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>

                      <input
                        value={item.topic}
                        onChange={(e) =>
                          up(
                            'content_plan',
                            form.content_plan.map((c) => (c.id === item.id ? { ...c, topic: e.target.value } : c))
                          )
                        }
                        placeholder="Topic or angle..."
                        className="flex-1 bg-transparent text-[11px] text-white/60 placeholder:text-white/20 focus:outline-none"
                      />

                      <button
                        onClick={() => up('content_plan', form.content_plan.filter((c) => c.id !== item.id))}
                        className="text-white/20 hover:text-red-400 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeStep === 'E' && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                E — Engagement Engine
              </p>
            </div>

            <div>
              <label className={labelClass}>Engagement tactics</label>
              <div className="flex flex-wrap gap-2">
                {ENGAGEMENT_TACTICS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleEngagement(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      (form.engagement_tactics || []).includes(t)
                        ? 'bg-[#E04E35]/15 border-[#E04E35]/40 text-[#E04E35]'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/40'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Lead magnet idea</label>
              <textarea value={form.lead_magnet_idea} onChange={(e) => up('lead_magnet_idea', e.target.value)} className={taClass} rows={2} />
            </div>
          </div>
        )}

        {activeStep === 'T' && (
          <div className="space-y-5">
            <div>
              <p className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                T — Transaction
              </p>
            </div>

            <div>
              <label className={labelClass}>Primary CTA</label>
              <input value={form.cta_primary} onChange={(e) => up('cta_primary', e.target.value)} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Urgency trigger</label>
              <input value={form.urgency_trigger} onChange={(e) => up('urgency_trigger', e.target.value)} className={inputClass} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass + ' mb-0'}>Conversion funnel</label>
                <button
                  onClick={() =>
                    up('conversion_funnel', [
                      ...(form.conversion_funnel || []),
                      { id: Date.now().toString(), order: (form.conversion_funnel || []).length + 1, label: 'New step', type: 'custom' },
                    ])
                  }
                  className="text-[10px] text-[#E04E35]"
                >
                  + Add step
                </button>
              </div>

              <div className="space-y-2">
                {(form.conversion_funnel || []).map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white/[0.07] flex items-center justify-center text-[9px] font-bold text-white/40">
                      {idx + 1}
                    </div>
                    <select
                      value={step.type}
                      onChange={(e) =>
                        up(
                          'conversion_funnel',
                          form.conversion_funnel.map((s) => (s.id === step.id ? { ...s, type: e.target.value } : s))
                        )
                      }
                      className="bg-[#1A0020] border border-white/[0.08] rounded-md px-2 py-1.5 text-[10.5px] text-white/55"
                    >
                      {CONVERSION_STEP_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={step.label}
                      onChange={(e) =>
                        up(
                          'conversion_funnel',
                          form.conversion_funnel.map((s) => (s.id === step.id ? { ...s, label: e.target.value } : s))
                        )
                      }
                      className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-md px-2.5 py-1.5 text-[11px] text-white/60"
                    />
                    <button
                      onClick={() => up('conversion_funnel', form.conversion_funnel.filter((s) => s.id !== step.id))}
                      className="text-white/20 hover:text-red-400 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.07]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-white/60">Generate Campaign Brief</p>
                </div>
                <button
                  onClick={handleGenerateBrief}
                  disabled={isGeneratingBrief}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E04E35]/10 border border-[#E04E35]/20 text-[10.5px] text-[#E04E35]"
                >
                  {isGeneratingBrief ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                  {isGeneratingBrief ? 'Writing brief...' : 'Generate Brief'}
                </button>
              </div>

              {form.brief && (
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.07]">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-white/25 mb-2">Campaign Brief</p>
                  <p className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap">{form.brief}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignBuilderPageContent() {
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const workspaceId = currentWorkspace?.id || currentWorkspace?.workspace_id || '';

  const [campaigns, setCampaigns] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailTab, setDetailTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [savedOffers, setSavedOffers] = useState([]);
  const [calendarCampaign, setCalendarCampaign] = useState(null);
  const [calendarDone, setCalendarDone] = useState({});

  const loadCampaigns = useCallback(async () => {
    if (!workspaceId) return;

    try {
      const res = await apiClient.get('/api/campaigns');
      const nextCampaigns = res?.campaigns || [];
      setCampaigns(nextCampaigns);

      setSelectedId((prev) => {
        if (prev && nextCampaigns.some((c) => c.id === prev)) return prev;
        return nextCampaigns[0]?.id || null;
      });
    } catch (e) {
      console.error('Failed to load campaigns:', e);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const loadOffers = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await apiClient.get('/api/offers');
      setSavedOffers(res?.offers || []);
    } catch (e) {
      console.error('Failed to load offers:', e);
      setSavedOffers([]);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    loadCampaigns();
    loadOffers();
  }, [workspaceId, loadCampaigns, loadOffers]);

  const selected = useMemo(
    () => campaigns.find((c) => c.id === selectedId) || null,
    [campaigns, selectedId]
  );

  const filtered = useMemo(
    () => campaigns.filter((c) => statusFilter === 'all' || c.status === statusFilter),
    [campaigns, statusFilter]
  );

  const handleSave = (campaign) => {
    setCampaigns((prev) => [campaign, ...prev.filter((c) => c.id !== campaign.id)]);
    setSelectedId(campaign.id);
    setIsCreating(false);
    setIsEditing(false);
    setEditingId(null);
    setDetailTab('overview');
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
      if (camp?.content_plan?.length && !calendarDone[id]) {
        setCalendarCampaign(camp);
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

  if (!workspaceId || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-[#E04E35]" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {calendarCampaign && (
          <CalendarPopulateModal
            campaign={calendarCampaign}
            onConfirm={handleCalendarConfirm}
            onCancel={() => setCalendarCampaign(null)}
          />
        )}

        <div className="flex items-center justify-between pl-14 pr-4 py-3 md:px-8 md:py-4 border-b border-white/[0.07] bg-[#0D0010]/90 backdrop-blur-sm sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>
              Campaign Builder
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              MAGNET Framework — Mission · Audience · Gravity · Narrative · Engagement · Transaction
            </p>
          </div>

          <button
            onClick={() => {
              setIsCreating(true);
              setIsEditing(false);
              setEditingId(null);
              setSelectedId(null);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E04E35] text-white text-xs font-semibold"
          >
            <Plus size={14} /> New Campaign
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="md:w-60 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/[0.07] flex flex-col bg-[#0D0010]">
            <div className="px-3 py-2.5 border-b border-white/[0.07] flex flex-wrap gap-1.5">
              {['all', 'active', 'draft', 'paused', 'complete'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`text-[10px] font-medium capitalize px-2.5 py-1 rounded-full ${
                    statusFilter === f ? 'bg-[#E04E35] text-white' : 'bg-white/[0.05] text-white/40'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto py-2 max-h-40 md:max-h-none">
              {filtered.length === 0 && (
                <p className="text-xs text-white/25 text-center py-8">No campaigns yet</p>
              )}

              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedId(c.id);
                    setIsCreating(false);
                    setIsEditing(false);
                    setEditingId(null);
                    setDetailTab('overview');
                  }}
                  className={`w-full text-left px-4 py-3.5 border-l-2 ${
                    selectedId === c.id && !isCreating ? 'bg-[#33033C]/70 border-[#E04E35]' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className={`text-[12px] font-semibold leading-tight ${selectedId === c.id ? 'text-white' : 'text-white/65'}`}>
                      {c.name}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                  <GoalBadge goal={c.goal} />
                  <div className="mt-2.5">
                    <MAGNETProgress campaign={c} />
                  </div>
                  {c.end_date && c.status === 'active' && (
                    <p className="text-[9.5px] text-white/20 mt-1.5">{daysLeft(c.end_date)} days left</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {isCreating || isEditing ? (
            <MAGNETForm
              workspaceId={workspaceId}
              savedOffers={savedOffers}
              onSave={handleSave}
              initialData={isEditing ? campaigns.find((c) => c.id === editingId) || null : null}
              onCancel={() => {
                setIsCreating(false);
                setIsEditing(false);
                setEditingId(null);
                setSelectedId(campaigns[0]?.id || null);
              }}
            />
          ) : selected ? (
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-4 md:px-8 md:py-6 border-b border-white/[0.07]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge status={selected.status} />
                        <GoalBadge goal={selected.goal} />
                      </div>
                      <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
                        {selected.name}
                      </h2>
                      <p className="text-sm text-white/35 mt-1">{selected.offer_name}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditingId(selected.id);
                          setIsCreating(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.09] text-xs text-white/60"
                      >
                        Edit Campaign
                      </button>

                      {selected.status !== 'active' && (
                        <button
                          onClick={() => handleStatusChange(selected.id, 'active')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-400/10 border border-emerald-400/20 text-xs font-medium text-emerald-400"
                        >
                          Activate
                        </button>
                      )}

                      {selected.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(selected.id, 'paused')}
                          className="px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-xs font-medium text-amber-400"
                        >
                          Pause
                        </button>
                      )}

                      <button
                        onClick={() => handleStatusChange(selected.id, 'complete')}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.09] text-xs text-white/40"
                      >
                        Complete
                      </button>
                    </div>
                  </div>

                  <MAGNETProgress campaign={selected} />

                  <div className="flex items-center gap-1 mt-4">
                    {['overview', 'content', 'funnel', 'results', 'assets', 'brief'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab)}
                        className={`capitalize text-xs font-medium px-4 py-2 rounded-lg ${
                          detailTab === tab ? 'bg-white/[0.08] text-white' : 'text-white/35'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-8 py-6">
                  {detailTab === 'overview' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Emotional Hook', value: selected.emotional_hook },
                          { label: 'Audience', value: selected.audience_description },
                          { label: 'Promise', value: selected.promise },
                          { label: 'Primary CTA', value: selected.cta_primary },
                        ].map((item) => (
                          <div key={item.label} className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.07]">
                            <p className="text-[9.5px] font-semibold uppercase tracking-widest text-white/25 mb-1.5">
                              {item.label}
                            </p>
                            <p className="text-sm text-white/65 leading-relaxed">{item.value || 'Not set'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailTab === 'content' && (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-white/50 mb-3">Content Checklist</p>
                      {[1, 2, 3, 4].map((week) => {
                        const weekTypes = { 1: 'Awareness', 2: 'Education', 3: 'Authority', 4: 'Promotion' };
                        const items = (selected.content_plan || []).filter((i) => i.week === week);
                        if (!items.length) return null;

                        return (
                          <div key={week}>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2">
                              Week {week} — {weekTypes[week]}
                            </p>
                            <div className="bg-white/[0.02] rounded-xl border border-white/[0.07] divide-y divide-white/[0.05]">
                              {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                                  <div>
                                    <p className="text-xs font-medium text-white/65">{item.format}</p>
                                    <p className="text-[10px] text-white/30">
                                      {item.platform}
                                      {item.topic ? ` · ${item.topic}` : ''}
                                    </p>
                                  </div>
                                  <button className="text-[10.5px] px-2.5 py-1 rounded-md bg-[#E04E35]/10 border border-[#E04E35]/20 text-[#E04E35] font-medium">
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

                  {detailTab === 'funnel' && (
                    <div>
                      <p className="text-sm font-semibold text-white/60 mb-4">Conversion Funnel</p>
                      <div className="space-y-1">
                        {(selected.conversion_funnel || []).map((step, idx) => (
                          <div key={step.id} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[10px] font-bold text-white/40">
                                {idx + 1}
                              </div>
                            </div>
                            <div className="flex-1 p-3 bg-white/[0.03] rounded-lg border border-white/[0.07] mb-1">
                              <p className="text-xs font-medium text-white/65">{step.label}</p>
                              <p className="text-[10px] text-white/30 capitalize">{(step.type || '').replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {detailTab === 'results' && (
                    <TabResults campaign={selected} onSaveResults={handleSaveResults} />
                  )}

                  {detailTab === 'assets' && (
                    <div>
                      <p className="text-sm font-semibold text-white/60 mb-1">Campaign Assets</p>
                      <p className="text-xs text-white/30 mb-4">
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
                        helpText="Ad images, videos, PDFs — up to 50MB each"
                      />
                    </div>
                  )}

                  {detailTab === 'brief' && (
                    <div>
                      <p className="text-sm font-semibold text-white/60 mb-4">Campaign Brief</p>
                      {selected.brief ? (
                        <div className="p-5 bg-white/[0.02] rounded-xl border border-white/[0.07]">
                          <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                            {selected.brief}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-white/25">No brief generated yet.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-56 flex-shrink-0 border-l border-white/[0.07] overflow-y-auto bg-[#0D0010] p-4">
                <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white/25 mb-2.5">
                  Quick Actions
                </p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => navigate('/content-studio', { state: { campaignId: selected.id } })}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[#E04E35]/20 bg-[#E04E35]/10 text-[#E04E35] text-xs font-medium text-left"
                  >
                    Open Content Studio
                  </button>
                  <button
                    onClick={() => navigate('/media-studio', { state: { campaignId: selected.id } })}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/40 text-xs text-left"
                  >
                    Open Media Studio
                  </button>
                  {selected.status === 'active' && selected.content_plan?.length > 0 && (
                    <button
                      onClick={() => setCalendarCampaign(selected)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/40 text-xs text-left"
                    >
                      <CalendarIcon size={12} /> Push to Calendar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-[#E04E35]/10 border border-[#E04E35]/15 flex items-center justify-center mb-5">
                <span className="text-2xl font-black text-[#E04E35]/50">M</span>
              </div>
              <h3 className="text-base font-semibold text-white/40 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                Build your first campaign
              </h3>
              <p className="text-sm text-white/25 max-w-sm leading-relaxed mb-6">
                Every piece of content should serve a campaign.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-5 py-2.5 rounded-xl bg-[#E04E35] text-white text-sm font-semibold"
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
