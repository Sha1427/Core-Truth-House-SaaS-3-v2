/**
 * OnboardingWorkflow.jsx
 * Core Truth House OS — Client Onboarding Workflow
 *
 * 5-step guided onboarding: Brand Audit → Brand Memory → Brand Foundation
 * → Strategic OS → First Campaign
 */
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useUser } from '../hooks/useAuth'
import { useWorkspace } from '../context/WorkspaceContext'

const API = `${import.meta.env.VITE_BACKEND_URL}/api`

const C = {
  bg:      '#0D0010',
  card:    '#130018',
  panel:   '#1A0020',
  border:  'rgba(255,255,255,0.07)',
  borderA: 'rgba(224,78,53,0.35)',
  accent:  '#E04E35',
  purple:  '#33033C',
  green:   '#10B981',
  white:   '#fff',
  t80:     'rgba(255,255,255,0.8)',
  t60:     'rgba(255,255,255,0.6)',
  t40:     'rgba(255,255,255,0.4)',
  t30:     'rgba(255,255,255,0.3)',
  t25:     'rgba(255,255,255,0.25)',
  t20:     'rgba(255,255,255,0.2)',
  t15:     'rgba(255,255,255,0.15)',
  t08:     'rgba(255,255,255,0.08)',
  t50:     'rgba(255,255,255,0.5)',
  t70:     'rgba(255,255,255,0.7)',
  font:    "'DM Sans', sans-serif",
}

const STEPS = [
  {
    number: 1, id: 'brand_audit', label: 'Brand Audit', sublabel: 'Diagnose before you build',
    icon: '🔍', route: '/brand-audit', milestone: 'audit_complete',
    description: 'Run your free Brand Audit. It scores your brand across 5 dimensions and produces your priority action plan.',
    what_you_get: ['Brand health score across 5 areas', 'Priority action list ranked by impact', 'Clear picture of what to fix first'],
    cta: 'Run Brand Audit',
    completionCheck: (d) => !!(d && d.audit_complete),
  },
  {
    number: 2, id: 'brand_memory', label: 'Brand Memory', sublabel: "Build the AI's knowledge of your brand",
    icon: '🧠', route: '/brand-memory', milestone: 'brand_memory_complete',
    description: 'Fill in your Brand Memory — the single source of truth that every AI generation draws from. Aim for 80%+ completion.',
    what_you_get: ['AI knows your brand voice and audience', 'Every generation sounds like you', 'Foundation for all content and strategy'],
    cta: 'Open Brand Memory',
    completionCheck: (d) => !!(d && d.brand_memory_pct >= 80),
  },
  {
    number: 3, id: 'brand_foundation', label: 'Brand Foundation', sublabel: 'Lock your strategic architecture',
    icon: '🏛', route: '/brand-foundation', milestone: 'foundation_complete',
    description: 'Set your Mission, Vision, Values, Positioning Statement, and Brand Promise. This is the strategic architecture everything builds from.',
    what_you_get: ['Mission, vision, values locked', 'Positioning statement defined', 'Brand promise documented'],
    cta: 'Build Foundation',
    completionCheck: (d) => !!(d && d.foundation_complete),
  },
  {
    number: 4, id: 'strategic_os', label: 'Strategic OS', sublabel: 'Run your 9-step brand strategy',
    icon: '⚙️', route: '/strategic-os', milestone: 'strategic_os_started',
    description: 'Start your Strategic OS — the 9-step brand strategy engine. Complete at least Step 1 and Step 2 to unlock Content Studio.',
    what_you_get: ['Audience psychology mapped', 'Differentiation articulated', 'Content pillars defined'],
    cta: 'Open Strategic OS',
    completionCheck: (d) => !!(d && d.strategic_os_steps_complete >= 2),
  },
  {
    number: 5, id: 'campaign_builder', label: 'First Campaign', sublabel: 'Activate your Brand OS',
    icon: '📣', route: '/campaign-builder', milestone: 'first_campaign_created',
    description: 'Build your first campaign using the MAGNET Framework. This activates your Brand OS.',
    what_you_get: ['First campaign strategy built', 'Content plan auto-generated', 'Calendar populated automatically'],
    cta: 'Build First Campaign',
    completionCheck: (d) => !!(d && d.first_campaign_created),
  },
]

const OUTPUT_TYPES = [
  { id: 'website_headline', label: 'Website Headline', icon: '🌐', source: 'Brand Foundation → Brand Promise', preview: 'Your brand should be doing the convincing before you say a word.', route: '/content-studio', locked: false },
  { id: 'elevator_pitch', label: 'Elevator Pitch', icon: '🎤', source: 'Brand Foundation → Positioning + Brand Memory', preview: "Hi, I'm [Name] — I help [audience] go from [problem] to [transformation].", route: '/content-studio', locked: false },
  { id: 'sales_message', label: 'Sales Message', icon: '💬', source: 'Campaign Builder → MAGNET Brief', preview: 'Generated from your active campaign once Campaign Builder is complete.', route: '/campaign-builder', locked: true },
  { id: 'bio', label: 'Professional Bio', icon: '👤', source: 'Brand Memory → Content Studio', preview: 'Generates a short, long, and LinkedIn bio from your Brand Memory.', route: '/content-studio', locked: false },
  { id: 'brand_voice_statement', label: 'Brand Voice Statement', icon: '✍️', source: 'Brand Memory → Voice field', preview: 'A defined voice guide for every piece of content you produce.', route: '/brand-memory', locked: false },
  { id: 'core_values', label: 'Core Values', icon: '❤️', source: 'Brand Foundation → Values field', preview: 'Your 3-5 non-negotiable principles — the decision filter for the brand.', route: '/brand-foundation', locked: false },
  { id: 'audience_profile', label: 'Audience Profile', icon: '🧠', source: 'Strategic OS → Audience Psychology (Step 2)', preview: 'Full psychological profile of your ideal client.', route: '/strategic-os', locked: true },
  { id: 'positioning_statement', label: 'Positioning Statement', icon: '🎯', source: 'Strategic OS → Differentiation (Step 3)', preview: 'The one thing that makes you the only logical choice.', route: '/strategic-os', locked: true },
]

const AUTOMATIONS = [
  { id: 'profile_updated', label: 'Profile Updated', milestone: 'brand_memory_complete' },
  { id: 'brand_os_built', label: 'Brand OS Built', milestone: 'foundation_complete' },
  { id: 'content_ready', label: 'Content Ready to Generate', milestone: 'strategic_os_started' },
  { id: 'brand_os_activated', label: 'Brand OS Activated', milestone: 'first_campaign_created' },
]

function CheckIcon({ size = 14, color = C.green }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="rgba(224,78,53,0.5)" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )
}

function StepItem({ step, isActive, isDone, isLocked, onClick }) {
  const lineColor = isDone ? C.green : isActive ? C.accent : C.t15
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
        <div data-testid={`onboarding-step-${step.number}-indicator`} style={{ width: 28, height: 28, borderRadius: '50%', background: isDone ? 'rgba(16,185,129,0.15)' : isActive ? 'rgba(224,78,53,0.15)' : C.t08, border: '1.5px solid ' + (isDone ? 'rgba(16,185,129,0.4)' : isActive ? C.borderA : C.border), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isDone ? <CheckIcon size={12} color={C.green} /> : <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? C.accent : C.t40, fontFamily: C.font }}>{step.number}</span>}
        </div>
        {step.number < STEPS.length && <div style={{ width: 1.5, flex: 1, minHeight: 20, background: lineColor, marginTop: 2 }} />}
      </div>
      <button data-testid={`onboarding-step-${step.number}-btn`} onClick={() => { if (!isLocked) onClick(step) }} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'none', border: 'none', cursor: isLocked ? 'not-allowed' : 'pointer', textAlign: 'left', padding: '0 0 20px', opacity: isLocked ? 0.45 : 1, fontFamily: C.font, flex: 1 }}>
        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 4 }}>{step.icon}</span>
        <div>
          <p style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 500, color: isDone ? C.green : isActive ? C.white : C.t60, margin: '0 0 1px' }}>{step.label}</p>
          <p style={{ fontSize: 10.5, color: C.t30, margin: 0 }}>{step.sublabel}</p>
          {isDone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 9.5, color: C.green, background: 'rgba(16,185,129,0.1)', padding: '1px 7px', borderRadius: 20 }}><CheckIcon size={9} color={C.green} /> Complete</span>}
          {isLocked && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 9.5, color: 'rgba(224,78,53,0.6)', background: 'rgba(224,78,53,0.08)', padding: '1px 7px', borderRadius: 20 }}><LockIcon /> Complete previous step first</span>}
        </div>
      </button>
    </div>
  )
}

function StepDetail({ step, isDone, onNavigate }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: isDone ? 'rgba(16,185,129,0.12)' : C.purple, border: '1px solid ' + (isDone ? 'rgba(16,185,129,0.3)' : 'rgba(224,78,53,0.2)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{step.icon}</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: C.white, margin: 0 }}>Step {step.number}: {step.label}</h2>
            {isDone && <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 20 }}>Complete</span>}
          </div>
          <p style={{ fontSize: 12, color: C.t30, margin: '2px 0 0', fontFamily: C.font }}>{step.sublabel}</p>
        </div>
      </div>
      <p style={{ fontSize: 13, color: C.t60, lineHeight: 1.7, marginBottom: 20, fontFamily: C.font }}>{step.description}</p>
      <div style={{ background: C.t08, border: '1px solid ' + C.border, borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.t30, margin: '0 0 10px', fontFamily: C.font }}>What this unlocks</p>
        {step.what_you_get.map((item) => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <CheckIcon size={12} color={C.green} />
            <span style={{ fontSize: 12, color: C.t70, fontFamily: C.font }}>{item}</span>
          </div>
        ))}
      </div>
      <button data-testid={`onboarding-step-${step.number}-cta`} onClick={() => onNavigate(step.route)} style={{ width: '100%', padding: '11px', borderRadius: 10, border: isDone ? '1px solid rgba(16,185,129,0.25)' : 'none', background: isDone ? 'rgba(16,185,129,0.12)' : C.accent, color: isDone ? C.green : C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: isDone ? 'none' : '0 4px 16px rgba(224,78,53,0.25)' }}>
        {isDone ? <><CheckIcon size={14} color={C.green} /> Open {step.label} to review or edit</> : <>{step.cta} →</>}
      </button>
    </div>
  )
}

function OutputItem({ output, isUnlocked, onNavigate }) {
  return (
    <div onClick={() => { if (isUnlocked) onNavigate(output.route) }} style={{ padding: '10px 12px', borderRadius: 9, border: '1px solid ' + (isUnlocked ? 'rgba(255,255,255,0.08)' : C.border), background: isUnlocked ? C.t08 : 'rgba(255,255,255,0.02)', cursor: isUnlocked ? 'pointer' : 'default', marginBottom: 6, opacity: isUnlocked ? 1 : 0.55 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 14 }}>{output.icon}</span>
        <p style={{ fontSize: 12, fontWeight: 600, color: isUnlocked ? C.white : C.t40, margin: 0, flex: 1, fontFamily: C.font }}>{output.label}</p>
        {!isUnlocked && <LockIcon />}
      </div>
      <p style={{ fontSize: 10, color: C.t25, margin: '0 0 3px', fontFamily: C.font }}>{output.source}</p>
      <p style={{ fontSize: 11, color: isUnlocked ? C.t50 : C.t25, margin: 0, lineHeight: 1.45, fontFamily: C.font, fontStyle: 'italic' }}>{output.preview}</p>
    </div>
  )
}

export default function OnboardingWorkflow({ onComplete, onNavigate, onDismiss }) {
  const { user } = useUser()
  const { activeWorkspace } = useWorkspace()
  const userId = user?.id || 'default'
  const workspaceId = activeWorkspace?.id || activeWorkspace?.workspace_id || ''

  const [activeStep, setActiveStep] = useState(1)
  const [milestones, setMilestones] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ user_id: userId })
    if (workspaceId) params.append('workspace_id', workspaceId)
    axios.get(`${API}/api/onboarding/progress?${params}`)
      .then(res => {
        const data = res.data || {}
        setMilestones(data)
        for (let i = 0; i < STEPS.length; i++) {
          if (!STEPS[i].completionCheck(data)) { setActiveStep(STEPS[i].number); break }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, workspaceId])

  const completedSteps = STEPS.filter(s => s.completionCheck(milestones)).length
  const overallPct = Math.round((completedSteps / STEPS.length) * 100)
  const allComplete = completedSteps === STEPS.length
  const activeStepData = STEPS.find(s => s.number === activeStep) || STEPS[0]
  const isActiveComplete = activeStepData.completionCheck(milestones)

  const isOutputUnlocked = (output) => {
    if (!output.locked) return completedSteps >= 2
    return completedSteps >= 4
  }

  const handleNavigate = (route) => {
    if (onNavigate) onNavigate(route)
    else window.location.href = route
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, background: C.bg }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(224,78,53,0.3)', borderTopColor: C.accent, animation: 'cth-spin 0.8s linear infinite' }} />
        <style>{`@keyframes cth-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div data-testid="onboarding-workflow" style={{ background: C.bg, border: '1px solid ' + C.border, borderRadius: 16, overflow: 'hidden', fontFamily: C.font, display: 'flex', flexDirection: 'column', height: 740 }}>
      <style>{`@keyframes cth-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid ' + C.border, background: C.card, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: C.accent, fontWeight: 800, fontSize: 14 }}>C</span>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.white, margin: 0 }}>Core Truth House OS</p>
            <p style={{ fontSize: 10, color: C.t30, margin: 0 }}>Brand OS Journey</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 120, height: 4, background: C.t08, borderRadius: 2, overflow: 'hidden' }}>
              <div data-testid="onboarding-progress-bar" style={{ height: '100%', width: overallPct + '%', background: overallPct === 100 ? C.green : C.accent, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 10.5, color: C.t40, fontFamily: C.font }}>{completedSteps}/{STEPS.length} complete</span>
          </div>
          {allComplete && <button data-testid="onboarding-finish-btn" onClick={onComplete} style={{ padding: '5px 14px', borderRadius: 7, border: 'none', background: C.green, color: C.white, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>Finish setup →</button>}
          <button data-testid="onboarding-dismiss-btn" onClick={onDismiss} style={{ background: 'none', border: 'none', color: C.t25, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
        </div>
      </div>

      {/* Three-panel layout */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* LEFT — journey steps */}
        <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid ' + C.border, padding: '20px 16px', overflowY: 'auto', background: C.card }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.t25, margin: '0 0 16px' }}>Brand OS Journey</p>
          {STEPS.map((step, i) => {
            const isDone = step.completionCheck(milestones)
            const prevDone = i === 0 || STEPS[i - 1].completionCheck(milestones)
            return <StepItem key={step.id} step={step} isActive={activeStep === step.number} isDone={isDone} isLocked={!isDone && !prevDone} onClick={(s) => setActiveStep(s.number)} />
          })}
          <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid ' + C.border }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.t25, margin: '0 0 10px' }}>Milestones</p>
            {AUTOMATIONS.map(auto => {
              const done = !!milestones[auto.milestone]
              return (
                <div key={auto.id} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: done ? 'rgba(16,185,129,0.15)' : C.t08, border: '1px solid ' + (done ? 'rgba(16,185,129,0.35)' : C.border), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {done && <CheckIcon size={8} color={C.green} />}
                  </div>
                  <span style={{ fontSize: 11, color: done ? C.green : C.t30, fontFamily: C.font }}>{auto.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* CENTER — step detail */}
        <StepDetail step={activeStepData} isDone={isActiveComplete} onNavigate={handleNavigate} />

        {/* RIGHT — outputs */}
        <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid ' + C.border, padding: '18px 14px', overflowY: 'auto', background: C.card }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.t25, margin: '0 0 12px' }}>Brand OS Outputs</p>
          <p style={{ fontSize: 10.5, color: C.t25, margin: '0 0 14px', lineHeight: 1.5 }}>These generate automatically as you complete each step.</p>
          {OUTPUT_TYPES.map(output => <OutputItem key={output.id} output={output} isUnlocked={isOutputUnlocked(output)} onNavigate={handleNavigate} />)}
          {completedSteps < 2 && <p style={{ fontSize: 10, color: C.t20, textAlign: 'center', margin: '10px 0 0', fontFamily: C.font }}>Complete Brand Memory to unlock outputs</p>}
        </div>
      </div>
    </div>
  )
}

export function OnboardingTriggerButton({ completedSteps = 0, onClick }) {
  const total = STEPS.length
  const pct = Math.round((completedSteps / total) * 100)
  if (completedSteps >= total) return null
  return (
    <button data-testid="onboarding-trigger-btn" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(224,78,53,0.3)', background: 'rgba(224,78,53,0.07)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'left' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0 }}>Get started — Brand OS Journey</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{completedSteps} of {total} steps complete ({pct}%)</p>
      </div>
      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="rgba(224,78,53,0.6)" strokeWidth="2" style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
    </button>
  )
}
