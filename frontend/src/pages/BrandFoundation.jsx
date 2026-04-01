import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DashboardLayout } from '../components/Layout';
import { useUser } from '../hooks/useAuth';
import { useWorkspace } from '../context/WorkspaceContext';
import { useMobile } from '../hooks/useMobile';
import { ChevronDown } from 'lucide-react';
import { BrandGuidelinesExportButton } from '../components/shared/BrandGuidelinesExport';
import axios from 'axios';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

// ─── Field definitions ────────────────────────────────────────────────────────

const FIELDS = [
  {
    id: 'mission',
    label: 'Mission Statement',
    subtitle: 'Why your brand exists',
    placeholder: 'Describe the work your brand does and who it serves...',
    minLength: 20,
    maxLength: 300,
    why: 'Your mission is the operational heart of the brand. It answers "what do we do and for whom?" — and it becomes the filter for every product, content, and business decision.',
    tips: [
      'Start with a verb: Build, Help, Equip, Create, Enable',
      'Name what you do, not what you want to become',
      'Keep it short enough to remember — one sentence is ideal',
    ],
    exampleSnippet: 'Build the strategy, systems, and content behind a brand that actually grows.',
  },
  {
    id: 'vision',
    label: 'Vision Statement',
    subtitle: 'Where your brand is going',
    placeholder: 'Describe the world your brand is working toward...',
    minLength: 30,
    maxLength: 500,
    why: 'Your vision is the north star — the long-range destination that makes the mission worth doing. It should feel slightly out of reach. That tension is what keeps a brand from stagnating.',
    tips: [
      'Describe a changed world, not a company milestone',
      'It should feel ambitious enough to outlast any one product',
      'Avoid timelines — vision is directional, not scheduled',
    ],
    exampleSnippet: 'A world where every serious founder stops guessing and starts building on a foundation of truth.',
  },
  {
    id: 'coreValues',
    label: 'Core Values',
    subtitle: 'What your brand stands for',
    placeholder: 'List your core values and what each one means in practice...',
    minLength: 30,
    maxLength: 600,
    why: 'Values are the operating standards behind every decision, every hire, and every piece of content. They should be specific enough that someone could use them to decide what to do in a difficult situation.',
    tips: [
      'Aim for 3–5 values — more than 5 becomes noise',
      'Give each value a short explanation, not just a word',
      'If a competitor could claim the same value, it is not specific enough',
    ],
    exampleSnippet: 'Strategy before aesthetics. Systems before scale. Foundation before visibility. Truth before trend.',
  },
  {
    id: 'tagline',
    label: 'Tagline',
    subtitle: 'Your memorable phrase',
    placeholder: 'The one line that captures your brand positioning...',
    minLength: 5,
    maxLength: 100,
    why: 'A tagline is not a slogan — it is a positioning shortcut. It should say something true and specific enough to stick in the mind of the right person and let the wrong person opt out.',
    tips: [
      'Test it: could a competitor claim this? If yes, rewrite it.',
      'Say something true — not aspirational or generic',
      'The best taglines are specific enough to exclude someone',
    ],
    exampleSnippet: 'Where serious brands are built.',
  },
  {
    id: 'positioning',
    label: 'Positioning Statement',
    subtitle: 'Your unique place in the market',
    placeholder: 'For [audience] who [problem], [brand] is the [category] that [differentiator]. Unlike [alternatives], [brand] [key difference].',
    minLength: 50,
    maxLength: 600,
    why: 'Positioning is the strategic decision about what corner of the market you own. It answers: who is this for, what is it, and why is it different? Without a clear position, every content decision is a guess.',
    tips: [
      'Name the specific type of person this is for — not everyone',
      'Name your category clearly, even if it is new',
      'Name one specific competitor or alternative you are replacing',
    ],
    exampleSnippet: 'For serious founders who are tired of building backwards — Core Truth House OS is the brand operating system that puts strategy first.',
  },
  {
    id: 'brandStory',
    label: 'Brand Story',
    subtitle: 'Your origin narrative',
    placeholder: 'The problem you saw, why you were the one to solve it, and what changed because of it...',
    minLength: 100,
    maxLength: 2000,
    why: 'Stories are how trust is built at scale. Your brand story is not a biography — it is a StoryBrand-structured narrative that positions the customer as the hero and your brand as the guide that helped them get there.',
    tips: [
      'Open with the problem — not with you',
      'Show what you saw that others missed',
      'End with what becomes possible — not your credentials',
    ],
    exampleSnippet: 'Most founders do not have a brand problem. They have a sequence problem. We built Core Truth House OS because the tool that should have existed did not.',
  },
  {
    id: 'toneOfVoice',
    label: 'Tone of Voice',
    subtitle: 'How your brand speaks',
    placeholder: 'Describe your brand voice with 3–5 descriptors and what each means in practice...',
    minLength: 30,
    maxLength: 600,
    why: 'Voice is the consistent personality behind everything the brand says. It should sound the same whether the content is a tweet, a sales page, or an onboarding email. Without a defined voice, AI outputs and team content will always sound generic.',
    tips: [
      'Use descriptor pairs: e.g. "Direct but not cold. Warm but not casual."',
      'Include what you are NOT — the contrast defines the voice',
      'Think of a person your brand would sound like, then describe them',
    ],
    exampleSnippet: 'Authoritative. Calm. Specific. Never loud. The brand speaks like a trusted strategist — not a hype coach.',
  },
];

// Field ID mapping from new component to API
const FIELD_MAP = {
  mission: 'mission',
  vision: 'vision',
  coreValues: 'values',
  tagline: 'tagline',
  positioning: 'positioning',
  brandStory: 'story',
  toneOfVoice: 'tone_of_voice',
};

const REVERSE_FIELD_MAP = Object.fromEntries(
  Object.entries(FIELD_MAP).map(([k, v]) => [v, k])
);

// ─── Utility ──────────────────────────────────────────────────────────────────

function getCompletionStatus(value, minLength) {
  const strVal = value ? String(value) : '';
  if (!strVal || strVal.trim().length === 0) return 'empty';
  if (strVal.trim().length < minLength) return 'draft';
  return 'complete';
}

function getScoreFromData(data) {
  const scores = FIELDS.map((f) => {
    const val = data[f.id] || '';
    const status = getCompletionStatus(val, f.minLength);
    if (status === 'complete') return 1;
    if (status === 'draft') return 0.5;
    return 0;
  });
  return Math.round((scores.reduce((a, b) => a + b, 0) / FIELDS.length) * 100);
}

function getSnippet(value) {
  const strVal = value ? String(value) : '';
  if (!strVal || strVal.trim().length === 0) return '';
  return strVal.length > 60 ? strVal.substring(0, 60).trim() + '...' : strVal;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score === 100 ? '#10b981' : score >= 60 ? '#E04E35' : '#C7A09D';

  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{score}%</span>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  if (status === 'complete') return <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />;
  if (status === 'draft') return <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const EMPTY_DATA = {
  mission: '',
  vision: '',
  coreValues: '',
  tagline: '',
  positioning: '',
  brandStory: '',
  toneOfVoice: '',
};

export default function BrandFoundation() {
  const { user } = useUser();
  const { activeWorkspace } = useWorkspace();
  const userId = user?.id || 'default';
  const workspaceId = activeWorkspace?.id;
  
  const [data, setData] = useState(EMPTY_DATA);
  const [activeField, setActiveField] = useState(FIELDS[0].id);
  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const saveTimeout = useRef();
  const textareaRef = useRef(null);

  const activeConfig = FIELDS.find((f) => f.id === activeField);
  const activeValue = data[activeField] || '';
  const activeStatus = getCompletionStatus(activeValue, activeConfig.minLength);
  const score = getScoreFromData(data);

  // Load saved data on mount
  useEffect(() => {
    const loadFoundation = async () => {
      try {
        const params = new URLSearchParams({ user_id: userId });
        if (workspaceId) params.append('workspace_id', workspaceId);
        const response = await axios.get(`${API}/api/persist/brand-foundation?${params}`);
        if (response.data) {
          setData({
            mission: response.data.mission || '',
            vision: response.data.vision || '',
            coreValues: Array.isArray(response.data.values) 
              ? response.data.values.join('\n') 
              : (response.data.coreValues || response.data.values || ''),
            tagline: response.data.tagline || '',
            positioning: response.data.positioning || '',
            brandStory: response.data.story || response.data.brandStory || '',
            toneOfVoice: response.data.tone_of_voice || response.data.toneOfVoice || '',
          });
        }
      } catch (error) {
        console.error('Failed to load foundation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFoundation();
  }, [userId, workspaceId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(160, textareaRef.current.scrollHeight)}px`;
    }
  }, [activeValue, activeField]);

  // Autosave on change
  const handleChange = useCallback((value) => {
    setData((prev) => {
      const updated = { ...prev, [activeField]: value };
      setSaveState('saving');
      setGeneratedPreview(null);
      clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          const params = new URLSearchParams({ user_id: userId });
          if (workspaceId) params.append('workspace_id', workspaceId);
          
          // Send full data mapped to API fields
          const payload = {
            mission: updated.mission,
            vision: updated.vision,
            values: updated.coreValues ? updated.coreValues.split('\n').filter(v => v.trim()) : [],
            tagline: updated.tagline,
            positioning: updated.positioning,
            story: updated.brandStory,
            tone_of_voice: updated.toneOfVoice,
          };
          
          await axios.post(`${API}/api/persist/brand-foundation?${params}`, payload);
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
          console.error('Save failed:', error);
          setSaveState('idle');
        }
      }, 800);
      return updated;
    });
  }, [activeField, userId, workspaceId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedPreview(null);
    try {
      const apiField = FIELD_MAP[activeField];
      const response = await axios.post(`${API}/api/persist/brand-foundation/generate`, {
        field: apiField,
        context: `Brand: ${data.mission || 'A professional brand'}. Current ${activeConfig.label}: ${activeValue || 'not defined yet'}`
      });
      
      if (response.data?.options?.length > 0) {
        // Take the first option as preview
        setGeneratedPreview(response.data.options[0]);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptGenerated = () => {
    if (generatedPreview) {
      handleChange(generatedPreview);
      setGeneratedPreview(null);
    }
  };

  const handleFieldSwitch = (fieldId) => {
    setActiveField(fieldId);
    setGeneratedPreview(null);
    setSaveState('idle');
  };

  const handleExportPDF = () => {
    const params = new URLSearchParams({ user_id: userId });
    if (workspaceId) params.append('workspace_id', workspaceId);
    window.open(`${API}/api/export/brand-guidelines-styled?${params}`, '_blank');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-screen bg-[#0D0010]">
          <div className="text-white/40">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  const completedCount = FIELDS.filter(f => 
    getCompletionStatus(data[f.id] || '', f.minLength) === 'complete'
  ).length;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full min-h-screen bg-[#0D0010]" data-testid="brand-foundation-page">

        {/* ── Top Header Bar ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pl-14 pr-4 py-3 md:px-8 md:py-4 border-b border-white/[0.08] bg-[#0D0010]/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-xl font-semibold text-white truncate" style={{ fontFamily: 'Georgia, serif' }}>
              Brand Foundation
            </h1>
            <p className="text-[11px] md:text-xs text-white/40 mt-0.5 truncate">
              Define the core truth your brand is built on
            </p>
          </div>

          <div className="flex items-center gap-3 md:gap-6 flex-shrink-0 ml-2">
            {/* Score ring */}
            <div className="flex items-center gap-2 md:gap-3">
              <ScoreRing score={score} />
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-white/80">Foundation Score</p>
                <p className="text-[11px] text-white/40">
                  {score === 100 ? 'Complete — ready for Strategic OS' : `${7 - completedCount} fields remaining`}
                </p>
              </div>
            </div>

            {/* Export */}
            <BrandGuidelinesExportButton />
          </div>
        </div>

        {/* ── Mobile field selector ────────────────────────────────────── */}
        <div className="md:hidden px-4 py-3 border-b border-white/[0.08] bg-[#0D0010]">
          <div className="relative">
            <select
              value={activeField}
              onChange={(e) => handleFieldSwitch(e.target.value)}
              data-testid="mobile-field-selector"
              className="w-full appearance-none bg-white/[0.04] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#E04E35]/50"
            >
              {FIELDS.map((f) => {
                const val = data[f.id] || '';
                const status = getCompletionStatus(val, f.minLength);
                const indicator = status === 'complete' ? '\u2713' : status === 'draft' ? '\u25CF' : '\u25CB';
                return (
                  <option key={f.id} value={f.id} className="bg-[#1c0828]">
                    {indicator} {f.label}
                  </option>
                );
              })}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Score: {score}%</span>
            <div className="w-24 h-1 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: score === 100 ? '#10b981' : '#E04E35' }} />
            </div>
          </div>
        </div>

        {/* ── Three-zone body ───────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* ── LEFT NAV RAIL ─────────────────────────────────────────── */}
          <div className="hidden md:block w-64 flex-shrink-0 border-r border-white/[0.08] overflow-y-auto py-4 bg-[#0D0010]">
            <p className="px-5 mb-3 text-[10px] font-semibold tracking-widest uppercase text-white/30">
              Foundation Elements
            </p>
            {FIELDS.map((field) => {
              const val = data[field.id] || '';
              const status = getCompletionStatus(val, field.minLength);
              const isActive = activeField === field.id;
              const snippet = getSnippet(val);

              return (
                <button
                  key={field.id}
                  onClick={() => handleFieldSwitch(field.id)}
                  data-testid={`field-nav-${field.id}`}
                  className={`w-full text-left px-5 py-3.5 transition-all group ${
                    isActive
                      ? 'bg-[#33033C]/80 border-l-2 border-[#E04E35]'
                      : 'border-l-2 border-transparent hover:bg-white/[0.03] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <StatusDot status={status} />
                    <span className={`text-sm font-medium leading-none ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white/90'}`}>
                      {field.label}
                    </span>
                  </div>
                  {snippet ? (
                    <p className="text-[11px] text-white/30 leading-relaxed line-clamp-2 pl-[18px]">
                      {snippet}
                    </p>
                  ) : (
                    <p className="text-[11px] text-white/20 italic pl-[18px]">
                      {field.subtitle}
                    </p>
                  )}
                </button>
              );
            })}

            {/* Score bar at bottom of nav */}
            <div className="mx-5 mt-6 pt-5 border-t border-white/[0.08]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-white/30 uppercase tracking-widest">Score</span>
                <span className={`text-[11px] font-semibold ${score === 100 ? 'text-emerald-400' : 'text-[#E04E35]'}`}>{score}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${score}%`,
                    background: score === 100 ? '#10b981' : '#E04E35',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── CENTER EDITOR ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-5 md:px-8 md:py-8">

              {/* Field header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E04E35]/15 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#E04E35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white" style={{ fontFamily: 'Georgia, serif' }}>
                      {activeConfig.label}
                    </h2>
                    <p className="text-xs text-white/40">{activeConfig.subtitle}</p>
                  </div>
                </div>

                {/* Save indicator */}
                <div className="flex items-center gap-1.5 text-[11px] mt-1">
                  {saveState === 'saving' && (
                    <><div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /><span className="text-white/30">Saving...</span></>
                  )}
                  {saveState === 'saved' && (
                    <><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-white/40">Saved</span></>
                  )}
                </div>
              </div>

              {/* Completion badge */}
              <div className="flex items-center gap-2 mb-5 ml-11">
                {activeStatus === 'complete' && (
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Complete
                  </span>
                )}
                {activeStatus === 'draft' && (
                  <span className="text-[11px] text-amber-400/80 bg-amber-400/10 px-2.5 py-1 rounded-full">In progress</span>
                )}
                {activeStatus === 'empty' && (
                  <span className="text-[11px] text-white/25 bg-white/5 px-2.5 py-1 rounded-full">Not started</span>
                )}
              </div>

              {/* Main textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={activeValue}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder={activeStatus === 'empty' ? `${activeConfig.placeholder}\n\nExample: "${activeConfig.exampleSnippet}"` : activeConfig.placeholder}
                  data-testid={`input-${activeField}`}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-sm text-white
                             placeholder:text-white/20 focus:outline-none focus:border-[#E04E35]/50
                             focus:ring-1 focus:ring-[#E04E35]/30 transition-all resize-none leading-relaxed"
                  style={{ minHeight: 160 }}
                  maxLength={activeConfig.maxLength}
                />
                <div className="absolute bottom-3 right-4 text-[10px] text-white/20">
                  {activeValue.length}/{activeConfig.maxLength}
                </div>
              </div>

              {/* AI Generate section */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  data-testid="generate-ai-btn"
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isGenerating
                      ? 'bg-[#E04E35]/50 text-white/50 cursor-not-allowed'
                      : 'bg-[#E04E35] text-white hover:bg-[#c73e28]'
                  }`}
                >
                  {isGenerating ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generating...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Generate with AI</>
                  )}
                </button>

                {activeValue && (
                  <button
                    onClick={() => handleChange('')}
                    className="px-4 py-2.5 rounded-lg text-sm text-white/40 hover:text-white/70 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* AI generated preview */}
              {generatedPreview && (
                <div className="mt-4 p-4 bg-[#E04E35]/[0.08] border border-[#E04E35]/20 rounded-xl" data-testid="generated-preview">
                  <p className="text-[11px] text-[#E04E35] uppercase tracking-widest font-medium mb-3">
                    AI Draft — Review Before Accepting
                  </p>
                  <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {generatedPreview}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleAcceptGenerated}
                      data-testid="accept-generated-btn"
                      className="px-4 py-2 rounded-lg bg-[#E04E35] text-sm text-white font-medium hover:bg-[#c73e28] transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="px-4 py-2 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white transition-all"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => setGeneratedPreview(null)}
                      className="px-4 py-2 text-sm text-white/30 hover:text-white/60 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {/* Field navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08]">
                {(() => {
                  const idx = FIELDS.findIndex(f => f.id === activeField);
                  const prev = FIELDS[idx - 1];
                  const next = FIELDS[idx + 1];
                  return (
                    <>
                      <button
                        onClick={() => prev && handleFieldSwitch(prev.id)}
                        disabled={!prev}
                        data-testid="prev-field-btn"
                        className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 disabled:opacity-0 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        {prev?.label}
                      </button>
                      <span className="text-[11px] text-white/20">{FIELDS.findIndex(f => f.id === activeField) + 1} of {FIELDS.length}</span>
                      <button
                        onClick={() => next && handleFieldSwitch(next.id)}
                        disabled={!next}
                        data-testid="next-field-btn"
                        className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 disabled:opacity-0 transition-all"
                      >
                        {next?.label}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </>
                  );
                })()}
              </div>

            </div>
          </div>

          {/* ── RIGHT CONTEXT PANEL ───────────────────────────────────── */}
          <div className="hidden lg:block w-72 flex-shrink-0 border-l border-white/[0.08] overflow-y-auto py-6 px-5 bg-[#0D0010]">

            {/* Why this matters */}
            <div className="mb-6">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-[#E04E35] mb-3">
                Why This Matters
              </p>
              <p className="text-[12.5px] text-white/55 leading-relaxed">
                {activeConfig.why}
              </p>
            </div>

            <div className="h-px bg-white/[0.08] mb-6" />

            {/* Writing tips */}
            <div className="mb-6">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-3">
                Writing Tips
              </p>
              <div className="flex flex-col gap-3">
                {activeConfig.tips.map((tip, i) => (
                  <div key={i} className="flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#E04E35]/15 text-[#E04E35] text-[10px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-[12px] text-white/50 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/[0.08] mb-6" />

            {/* Example */}
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-3">
                Example
              </p>
              <div className="p-3.5 bg-white/[0.03] rounded-lg border-l-2 border-[#E04E35]/40">
                <p className="text-[12px] text-white/40 italic leading-relaxed">
                  "{activeConfig.exampleSnippet}"
                </p>
                <p className="text-[10px] text-white/20 mt-2">Core Truth House OS</p>
              </div>
            </div>

            <div className="h-px bg-white/[0.08] mt-6 mb-6" />

            {/* All fields overview */}
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/30 mb-3">
                All Fields
              </p>
              <div className="flex flex-col gap-1.5">
                {FIELDS.map((f) => {
                  const val = data[f.id] || '';
                  const status = getCompletionStatus(val, f.minLength);
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleFieldSwitch(f.id)}
                      className={`flex items-center gap-2.5 text-left px-2.5 py-1.5 rounded-lg transition-all ${
                        f.id === activeField ? 'bg-[#33033C]/60' : 'hover:bg-white/[0.03]'
                      }`}
                    >
                      <StatusDot status={status} />
                      <span className={`text-[12px] ${f.id === activeField ? 'text-white' : 'text-white/50'}`}>
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Strategic OS prompt if score is high enough */}
            {score >= 80 && (
              <>
                <div className="h-px bg-white/[0.08] mt-6 mb-5" />
                <div className="p-4 bg-[#E04E35]/[0.08] rounded-xl border border-[#E04E35]/20">
                  <p className="text-[11px] font-semibold text-[#E04E35] mb-1.5">Ready for Strategic OS</p>
                  <p className="text-[11px] text-white/50 leading-relaxed mb-3">
                    Your foundation is strong enough to run the 9-step Strategic OS.
                  </p>
                  <a
                    href="/strategic-os"
                    className="flex items-center gap-1.5 text-[11px] font-medium text-[#E04E35] hover:text-[#ff6b52] transition-colors"
                  >
                    Launch Strategic OS
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </a>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
