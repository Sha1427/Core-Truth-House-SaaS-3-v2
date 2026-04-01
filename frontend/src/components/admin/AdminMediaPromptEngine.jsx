/**
 * AdminMediaPromptEngine.js — Admin tab wrapper for MediaPromptEngine v2
 * Renders the Prompt Library, Builder Panel, AI Twin System docs, and Formula Reference.
 * Super Admin only.
 */
import React, { useState } from 'react';
import { Copy, Check, Image, Video, Sparkles, User, BookOpen, Wrench } from 'lucide-react';
import { PromptBuilderPanel, PROMPT_LIBRARY, AI_TWIN_SYSTEM } from './MediaPromptEngine';

const T = {
  bg: '#0D0010', bgCard: '#130018', bgPanel: '#1A0020',
  border: 'rgba(255,255,255,0.07)', accent: '#E04E35',
  gold: '#C9A84C', green: '#10B981', blue: '#3B82F6',
  white: '#fff', t80: 'rgba(255,255,255,0.8)', t60: 'rgba(255,255,255,0.6)',
  t40: 'rgba(255,255,255,0.4)', t30: 'rgba(255,255,255,0.3)',
  t25: 'rgba(255,255,255,0.25)', t08: 'rgba(255,255,255,0.08)',
  font: "'DM Sans', -apple-system, sans-serif",
};

const SECTIONS = [
  { id: 'builder', label: 'Prompt Builder', icon: Wrench },
  { id: 'library', label: 'Viral 12 Library', icon: BookOpen },
  { id: 'presets', label: 'Image / Video Presets', icon: Image },
  { id: 'aitwin', label: 'AI Twin System', icon: User },
  { id: 'formulas', label: 'Formula Reference', icon: Sparkles },
];

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} data-testid="copy-prompt-btn"
      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-medium cursor-pointer border-none"
      style={{ background: copied ? 'rgba(16,185,129,0.15)' : T.t08, color: copied ? T.green : T.t40 }}>
      {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
    </button>
  );
}

function PromptCard({ label, badge, purpose, phase, prompt, number }) {
  const phaseColor = { awareness: T.blue, education: T.t40, authority: T.gold, promotion: T.accent, lifestyle: T.green }[phase] || T.t40;
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
      <div className="px-4 py-3 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {number && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: T.t08, color: T.t30 }}>#{number}</span>}
            <h4 className="text-[13px] font-bold text-white m-0 truncate">{label}</h4>
          </div>
          {purpose && <p className="text-[11px] m-0" style={{ color: T.t40 }}>{purpose}</p>}
          {phase && (
            <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: phaseColor + '18', color: phaseColor }}>
              {phase}
            </span>
          )}
        </div>
        <CopyBtn text={prompt} />
      </div>
      <div className="px-4 pb-3">
        <div className="rounded-lg p-3 max-h-[120px] overflow-y-auto" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
          <p className="text-[11px] m-0 leading-relaxed" style={{ color: T.t60, whiteSpace: 'pre-wrap' }}>{prompt}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(224,78,53,0.12)' }}>
        <Icon size={16} style={{ color: T.accent }} />
      </div>
      <div>
        <h3 className="text-[14px] font-bold text-white m-0">{title}</h3>
        {subtitle && <p className="text-[11px] m-0" style={{ color: T.t30 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

/* ─── LIBRARY SECTION ─── */
function LibrarySection() {
  return (
    <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: `${T.t25} transparent` }}>
      <SectionHeader icon={BookOpen} title="The 12 Viral AI Photoshoot Concepts" subtitle="Ready-to-use prompts — copy and paste into any image AI" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {PROMPT_LIBRARY.viral12.map(concept => (
          <PromptCard
            key={concept.id}
            number={concept.number}
            label={concept.label}
            purpose={concept.purpose}
            phase={concept.phase}
            prompt={concept.prompt}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── PRESETS SECTION ─── */
function PresetsSection() {
  const imgKeys = Object.keys(PROMPT_LIBRARY.images || {});
  const vidKeys = Object.keys(PROMPT_LIBRARY.videos || {});
  const shootKeys = Object.keys(PROMPT_LIBRARY.photoshoots || {});

  return (
    <div className="space-y-8 max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: `${T.t25} transparent` }}>
      {/* Editorial image presets */}
      <div>
        <SectionHeader icon={Image} title="Editorial Image Presets" subtitle="6-Pillar Shot Structure — brand campaign imagery" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {imgKeys.map(key => {
            const p = PROMPT_LIBRARY.images[key];
            return <PromptCard key={key} label={p.label} phase={p.phase} prompt={p.full_prompt} badge={p.platform} />;
          })}
        </div>
      </div>

      {/* Photoshoot presets */}
      <div>
        <SectionHeader icon={User} title="Luxury Photoshoot Presets" subtitle="Luxury Branding Formula — founder/CEO shots" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {shootKeys.map(key => {
            const p = PROMPT_LIBRARY.photoshoots[key];
            return <PromptCard key={key} label={p.label} prompt={p.full_prompt} badge={p.framework} />;
          })}
        </div>
      </div>

      {/* Video presets */}
      <div>
        <SectionHeader icon={Video} title="Video Prompt Presets" subtitle="6-Part Video Structure — reels, clips, campaign video" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {vidKeys.map(key => {
            const p = PROMPT_LIBRARY.videos[key];
            return <PromptCard key={key} label={p.label} prompt={p.full_prompt} badge={p.platform} />;
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── AI TWIN SECTION ─── */
function AITwinSection() {
  const cats = AI_TWIN_SYSTEM.contentCategories;
  const catKeys = Object.keys(cats);

  return (
    <div className="space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: `${T.t25} transparent` }}>
      <SectionHeader icon={User} title="AI Twin System" subtitle="Model ID framework for consistent personal brand identity" />

      {/* Setup instructions */}
      <div className="rounded-xl p-5" style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
        <h4 className="text-[13px] font-bold text-white mb-3">Step 1 — Create Your AI Twin</h4>
        <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
          <pre className="text-[11.5px] m-0 whitespace-pre-wrap leading-relaxed" style={{ color: T.t60, fontFamily: T.font }}>
            {AI_TWIN_SYSTEM.setupInstructions}
          </pre>
        </div>
        <CopyBtn text={AI_TWIN_SYSTEM.setupInstructions} />
      </div>

      {/* Content categories */}
      <div className="rounded-xl p-5" style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
        <h4 className="text-[13px] font-bold text-white mb-3">Content Mix Categories</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {catKeys.map(key => {
            const cat = cats[key];
            return (
              <div key={key} className="rounded-lg p-3" style={{ background: T.t08, border: `1px solid ${T.border}` }}>
                <p className="text-[12px] font-bold text-white mb-0.5">{cat.label}</p>
                <p className="text-[10px] mb-1" style={{ color: T.t30 }}>{cat.description}</p>
                <span className="text-[11px] font-bold" style={{ color: T.accent }}>{cat.ratio}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Batch output stats */}
      <div className="rounded-xl p-5" style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
        <h4 className="text-[13px] font-bold text-white mb-3">One AI Twin Batch Output</h4>
        <div className="flex flex-wrap gap-4">
          {Object.entries(AI_TWIN_SYSTEM.batchOutput).map(([key, val]) => (
            <div key={key} className="text-center">
              <p className="text-xl font-extrabold text-white m-0">{val}</p>
              <p className="text-[10px] uppercase tracking-wider m-0" style={{ color: T.t30 }}>{key.replace(/([A-Z])/g, ' $1')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reel animations */}
      <div className="rounded-xl p-5" style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
        <h4 className="text-[13px] font-bold text-white mb-3">Reel Animation Ideas</h4>
        <div className="flex flex-wrap gap-2">
          {AI_TWIN_SYSTEM.reelAnimations.map((anim, i) => (
            <span key={i} className="px-3 py-1.5 rounded-full text-[11px]" style={{ background: T.t08, color: T.t60, border: `1px solid ${T.border}` }}>
              {anim}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── FORMULA REFERENCE SECTION ─── */
function FormulaSection() {
  const formulas = PROMPT_LIBRARY.formulas || {};

  return (
    <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: `${T.t25} transparent` }}>
      <SectionHeader icon={Sparkles} title="Formula Reference" subtitle="Quick-copy master formulas for each framework" />

      {[
        { key: 'image_6pillar', label: '6-Pillar Image Formula', desc: 'Editorial brand imagery' },
        { key: 'photoshoot_formula', label: 'Luxury Photoshoot Formula', desc: 'Founder/CEO portraits' },
        { key: 'video_6part', label: '6-Part Video Formula', desc: 'Reels, clips, campaign video' },
        { key: 'ai_twin', label: 'AI Twin Scene Formula', desc: 'Consistent identity across scenes' },
      ].map(({ key, label, desc }) => {
        const val = formulas[key];
        if (!val || typeof val !== 'string') return null;
        return (
          <div key={key} className="rounded-xl overflow-hidden" style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
            <div className="px-4 py-3 flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-white m-0">{label}</h4>
                <p className="text-[10.5px] m-0" style={{ color: T.t30 }}>{desc}</p>
              </div>
              <CopyBtn text={val} />
            </div>
            <div className="px-4 pb-3">
              <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                <p className="text-[11px] m-0 leading-relaxed" style={{ color: T.t60, whiteSpace: 'pre-wrap' }}>{val}</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Brand defaults */}
      {formulas.cth_defaults && (
        <div className="rounded-xl p-5" style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
          <h4 className="text-[13px] font-bold text-white mb-3">CTH Brand Defaults</h4>
          <div className="space-y-2">
            {Object.entries(formulas.cth_defaults).map(([key, val]) => (
              <div key={key} className="flex items-start gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0 mt-0.5" style={{ color: T.t30, minWidth: 60 }}>{key}</span>
                <p className="text-[11px] m-0 leading-relaxed" style={{ color: T.t60 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MAIN EXPORT ─── */
export function AdminMediaPromptEngine() {
  const [section, setSection] = useState('builder');

  return (
    <div data-testid="media-prompt-engine" className="space-y-5">
      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap">
        {SECTIONS.map(s => {
          const active = section === s.id;
          return (
            <button key={s.id} onClick={() => setSection(s.id)}
              data-testid={`mpe-tab-${s.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium cursor-pointer"
              style={{
                border: `1px solid ${active ? 'rgba(224,78,53,0.4)' : T.border}`,
                background: active ? 'rgba(224,78,53,0.1)' : T.t08,
                color: active ? T.accent : T.t40,
              }}>
              <s.icon size={13} /> {s.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {section === 'builder' && (
        <div className="rounded-xl p-5" style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
          <SectionHeader icon={Wrench} title="Prompt Builder" subtitle="Build structured prompts using CTH frameworks" />
          <PromptBuilderPanel campaign={{ name: '', emotionalHook: '' }} />
        </div>
      )}

      {section === 'library' && <LibrarySection />}
      {section === 'presets' && <PresetsSection />}
      {section === 'aitwin' && <AITwinSection />}
      {section === 'formulas' && <FormulaSection />}
    </div>
  );
}
