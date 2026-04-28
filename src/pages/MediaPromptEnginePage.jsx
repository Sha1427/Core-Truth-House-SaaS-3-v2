import React, { useState } from 'react';
import { DashboardLayout } from '../components/Layout';
import { PromptBuilderPanel, PROMPT_LIBRARY, AI_TWIN_SYSTEM } from '../lib/MediaPromptEngine';
import { ChevronRight, Copy, Check, Wand2 } from 'lucide-react';

const TABS = [
 { id: 'builder', label: 'Prompt Builder' },
 { id: 'viral12', label: '12 Viral Concepts' },
 { id: 'library', label: 'Prompt Library' },
 { id: 'aitwin', label: 'AI Twin System' },
 { id: 'formulas', label: 'Formulas' },
];

function CopyButton({ text }) {
 const [copied, setCopied] = useState(false);
 const handle = () => {
 navigator.clipboard.writeText(text).catch(() => {});
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };
 return (
 <button onClick={handle} data-testid="copy-prompt-btn"
 className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-medium border transition-all ${copied ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400' : 'border-[var(--cth-admin-border)] cth-muted hover:cth-muted'}`}>
 {copied ? <Check size={11} /> : <Copy size={11} />}
 {copied ? 'Copied' : 'Copy'}
 </button>
 );
}

function PromptCard({ label, description, prompt, phase }) {
 const phaseColors = { awareness: '#7c3aed', education: '#0891b2', authority: '#059669', promotion: 'var(--cth-admin-accent)', lifestyle: 'var(--cth-status-warning)' };
 return (
 <div className="p-4 cth-card-muted rounded-xl border border-[var(--cth-admin-border)] hover:border-[rgba(224,78,53,0.24)] transition-all">
 <div className="flex items-start justify-between mb-2">
 <div>
 <p className="text-xs font-semibold cth-heading">{label}</p>
 {description && <p className="text-[10px] cth-muted mt-0.5">{description}</p>}
 </div>
 <div className="flex items-center gap-2">
 {phase && <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: phaseColors[phase] || 'var(--cth-admin-muted)', background: `${phaseColors[phase] || 'var(--cth-admin-muted)'}18` }}>{phase}</span>}
 <CopyButton text={prompt} />
 </div>
 </div>
 <p className="text-[11px] cth-muted leading-relaxed whitespace-pre-wrap line-clamp-4">{prompt}</p>
 </div>
 );
}

export default function MediaPromptEnginePage() {
 const [activeTab, setActiveTab] = useState('builder');
 const [expandedConcept, setExpandedConcept] = useState(null);

 return (
 <DashboardLayout>
 <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
 {/* Header */}
 <div className="pl-14 pr-4 py-3 md:px-8 md:py-4 border-b border-[var(--cth-admin-border)] bg-[rgba(248,244,242,0.94)] backdrop-blur-sm sticky top-0 z-20">
 <div className="flex items-center gap-2 mb-1">
 <Wand2 size={18} className="text-[var(--cth-admin-accent)]" />
 <h1 className="text-xl font-semibold cth-heading" data-testid="prompt-engine-title">Media Prompt Engine</h1>
 <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--cth-brand-primary)]/15 text-[var(--cth-admin-accent)] ml-2">Super Admin</span>
 </div>
 <p className="text-xs cth-muted">5 frameworks for image, video, and personal brand content generation</p>

 <div className="flex items-center gap-1 mt-3">
 {TABS.map(tab => (
 <button key={tab.id} onClick={() => setActiveTab(tab.id)} data-testid={`tab-${tab.id}`}
 className={`text-xs font-medium px-4 py-2 rounded-lg transition-all ${activeTab === tab.id ? 'cth-card-muted cth-heading' : 'cth-muted hover:cth-muted'}`}>
 {tab.label}
 </button>
 ))}
 </div>
 </div>

 <div className="flex-1 overflow-y-auto px-8 py-6">
 {/* Builder tab */}
 {activeTab === 'builder' && (
 <div className="max-w-2xl">
 <div className="mb-4">
 <p className="text-sm font-semibold cth-muted mb-1">Prompt Builder</p>
 <p className="text-xs cth-muted">Select a framework, fill in the pillars, and build a structured prompt for any AI image or video generator.</p>
 </div>
 <div className="p-5 cth-card-muted rounded-xl border border-[var(--cth-admin-border)]">
 <PromptBuilderPanel campaign={{}} onUsePrompt={(prompt) => navigator.clipboard.writeText(prompt)} />
 </div>
 </div>
 )}

 {/* 12 Viral Concepts tab */}
 {activeTab === 'viral12' && (
 <div>
 <div className="mb-5">
 <p className="text-sm font-semibold cth-muted mb-1">The 12 Viral AI Photoshoot Concepts</p>
 <p className="text-xs cth-muted">Pre-built prompts for the most effective brand photo types. Each supports Model ID for AI Twin consistency.</p>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
 {PROMPT_LIBRARY.viral12.map(concept => (
 <div key={concept.id} className="cth-card-muted rounded-xl border border-[var(--cth-admin-border)] overflow-hidden hover:border-[rgba(224,78,53,0.24)] transition-all">
 <button onClick={() => setExpandedConcept(expandedConcept === concept.id ? null : concept.id)}
 className="w-full text-left p-4 flex items-center gap-3" data-testid={`concept-${concept.id}`}>
 <div className="w-8 h-8 rounded-lg bg-[var(--cth-admin-accent)]/10 border border-[var(--cth-admin-accent)]/20 flex items-center justify-center text-[11px] font-bold text-[var(--cth-admin-accent)] flex-shrink-0">
 {concept.number}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold cth-heading">{concept.label}</p>
 <p className="text-[10px] cth-muted">{concept.purpose}</p>
 </div>
 <ChevronRight size={14} className={`cth-muted transition-transform ${expandedConcept === concept.id ? 'rotate-90' : ''}`} />
 </button>
 {expandedConcept === concept.id && (
 <div className="px-4 pb-4 space-y-3 border-t border-[var(--cth-admin-border)]">
 <div className="pt-3">
 <div className="flex items-center justify-between mb-1.5">
 <p className="text-[9.5px] font-semibold uppercase tracking-widest cth-muted">Generic Prompt</p>
 <CopyButton text={concept.prompt} />
 </div>
 <p className="text-[11px] cth-muted leading-relaxed">{concept.prompt}</p>
 </div>
 {concept.withModelId && (
 <div>
 <div className="flex items-center justify-between mb-1.5">
 <p className="text-[9.5px] font-semibold uppercase tracking-widest text-[var(--cth-admin-accent)]/50">With Model ID</p>
 <CopyButton text={concept.withModelId('[Your Model ID]')} />
 </div>
 <p className="text-[11px] cth-muted leading-relaxed">{concept.withModelId('[Your Model ID]')}</p>
 </div>
 )}
 <p className="text-[10px] cth-muted">Visual: {concept.visualIdea} · Phase: {concept.phase}</p>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Prompt Library tab */}
 {activeTab === 'library' && (
 <div className="space-y-6">
 <div>
 <p className="text-sm font-semibold cth-muted mb-1">Editorial Image Prompts</p>
 <p className="text-xs cth-muted mb-3">6-Pillar Shot Structure , for campaign content and brand imagery</p>
 <div className="space-y-2">
 {Object.values(PROMPT_LIBRARY.images).map(p => (
 <PromptCard key={p.label} label={p.label} description={p.platform} prompt={p.full_prompt} phase={p.phase} />
 ))}
 </div>
 </div>
 <div>
 <p className="text-sm font-semibold cth-muted mb-1">Brand Photoshoot Prompts</p>
 <p className="text-xs cth-muted mb-3">Luxury Branding Formula , for founder and CEO portrait sessions</p>
 <div className="space-y-2">
 {Object.values(PROMPT_LIBRARY.photoshoots).map(p => (
 <PromptCard key={p.label} label={p.label} description={p.framework} prompt={p.full_prompt} />
 ))}
 </div>
 </div>
 <div>
 <p className="text-sm font-semibold cth-muted mb-1">Video Prompts</p>
 <p className="text-xs cth-muted mb-3">6-Part Video Structure , for reels, clips, and campaign video</p>
 <div className="space-y-2">
 {Object.values(PROMPT_LIBRARY.videos).map(p => (
 <PromptCard key={p.label} label={p.label} description={p.platform} prompt={p.full_prompt} />
 ))}
 </div>
 </div>
 </div>
 )}

 {/* AI Twin System tab */}
 {activeTab === 'aitwin' && (
 <div className="max-w-2xl space-y-5">
 <div>
 <p className="text-sm font-semibold cth-muted mb-1">AI Twin System</p>
 <p className="text-xs cth-muted mb-4">Create a consistent personal brand identity across unlimited AI-generated photos.</p>
 </div>

 <div className="p-5 cth-card-muted rounded-xl border border-[var(--cth-admin-border)]">
 <p className="text-[9.5px] font-semibold uppercase tracking-widest cth-muted mb-3">Setup Instructions</p>
 <p className="text-xs cth-muted leading-relaxed whitespace-pre-wrap">{AI_TWIN_SYSTEM.setupInstructions}</p>
 </div>

 <div>
 <p className="text-xs font-semibold cth-muted mb-3">Content Categories</p>
 <div className="grid grid-cols-2 gap-3">
 {Object.entries(AI_TWIN_SYSTEM.contentCategories).map(([key, cat]) => (
 <div key={key} className="p-4 cth-card-muted rounded-xl border border-[var(--cth-admin-border)]">
 <div className="flex items-center justify-between mb-1.5">
 <p className="text-xs font-semibold cth-heading">{cat.label}</p>
 <span className="text-[10px] font-bold text-[var(--cth-admin-accent)]">{cat.ratio}</span>
 </div>
 <p className="text-[10.5px] cth-muted mb-2">{cat.description}</p>
 <CopyButton text={cat.sceneTemplate('[Your Model ID]')} />
 </div>
 ))}
 </div>
 </div>

 <div className="p-4 bg-[var(--cth-brand-primary-soft)]/30 rounded-xl border border-[var(--cth-admin-accent)]/15">
 <p className="text-xs font-semibold cth-muted mb-2">Batch Output (per session)</p>
 <div className="flex gap-4">
 {Object.entries(AI_TWIN_SYSTEM.batchOutput).map(([key, val]) => (
 <div key={key} className="text-center">
 <p className="text-lg font-bold cth-heading">{val}</p>
 <p className="text-[9.5px] cth-muted capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
 </div>
 ))}
 </div>
 </div>

 <div>
 <p className="text-xs font-semibold cth-muted mb-2">Reel Animation Ideas</p>
 <div className="flex flex-wrap gap-2">
 {AI_TWIN_SYSTEM.reelAnimations.map(anim => (
 <span key={anim} className="px-3 py-1.5 rounded-lg cth-card-muted border border-[var(--cth-admin-border)] text-[10.5px] cth-muted">{anim}</span>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* Formulas tab */}
 {activeTab === 'formulas' && (
 <div className="max-w-2xl space-y-4">
 <div>
 <p className="text-sm font-semibold cth-muted mb-1">Quick-Copy Formulas</p>
 <p className="text-xs cth-muted mb-4">Fill-in-the-blank templates for each framework.</p>
 </div>
 {[
 { label: '6-Pillar Image Formula', text: PROMPT_LIBRARY.formulas.image_6pillar },
 { label: 'Luxury Photoshoot Formula', text: PROMPT_LIBRARY.formulas.photoshoot_formula },
 { label: '6-Part Video Formula', text: PROMPT_LIBRARY.formulas.video_6part },
 { label: 'AI Twin + Scene Formula', text: PROMPT_LIBRARY.formulas.ai_twin },
 ].map(f => (
 <div key={f.label} className="p-4 cth-card-muted rounded-xl border border-[var(--cth-admin-border)]">
 <div className="flex items-center justify-between mb-2">
 <p className="text-xs font-semibold cth-muted">{f.label}</p>
 <CopyButton text={f.text} />
 </div>
 <p className="text-[11.5px] cth-muted leading-relaxed font-mono">{f.text}</p>
 </div>
 ))}

 <div className="p-4 cth-card-muted rounded-xl border border-[var(--cth-admin-border)]">
 <p className="text-xs font-semibold cth-muted mb-2">CTH Brand Defaults</p>
 <div className="space-y-2">
 <div><p className="text-[9.5px] font-semibold uppercase tracking-widest cth-muted mb-1">Palette</p><p className="text-[11px] cth-muted">{PROMPT_LIBRARY.formulas.cth_defaults.palette}</p></div>
 <div><p className="text-[9.5px] font-semibold uppercase tracking-widest cth-muted mb-1">Quality String</p><p className="text-[11px] cth-muted">{PROMPT_LIBRARY.formulas.cth_defaults.quality}</p></div>
 <div><p className="text-[9.5px] font-semibold uppercase tracking-widest cth-muted mb-1">Anti-Patterns</p><p className="text-[11px] cth-muted">{PROMPT_LIBRARY.formulas.cth_defaults.anti}</p></div>
 </div>
 </div>

 <div className="p-4 cth-card-muted rounded-xl border border-[var(--cth-admin-border)]">
 <p className="text-xs font-semibold cth-muted mb-2">Content Mix Ratios</p>
 <div className="flex gap-4">
 {Object.entries(PROMPT_LIBRARY.formulas.contentMix).map(([key, val]) => (
 <div key={key} className="text-center">
 <p className="text-lg font-bold text-[var(--cth-admin-accent)]">{val}</p>
 <p className="text-[9.5px] cth-muted capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </DashboardLayout>
 );
}
