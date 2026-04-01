/**
 * PlanGate.jsx  — v2 (Complete Module Coverage)
 * Core Truth House OS — Plan Gating System
 * Stack: React / FastAPI / MongoDB
 *
 * WHAT CHANGED IN v2:
 *   - All remaining modules now gated
 *   - Strategic OS: Step 1 preview, Steps 2-9 gated (inline per step)
 *   - Team page: full page visible, Invite button inline gated
 *   - Brand Audit: Print Report inline gated
 *   - Never-gated list: Brand Foundation, Brand Memory,
 *     Brand Audit, Training Videos, Billing, Settings
 *
 * GATE SUMMARY:
 *   Free/Audit (always open):
 *     Brand Foundation, Brand Memory, Brand Audit,
 *     Training Videos, Billing, Settings
 *
 *   Foundation ($47/mo) unlocks:
 *     Brand Health, Brand Scorecard, Strategic OS (all steps),
 *     Audience Psychology, Differentiation, Competitor Analysis,
 *     Content Pillars, Platform Strategy, Monetization,
 *     Content Studio, Media Studio, Media Workflow,
 *     Campaign Builder, Identity Studio (upload sections),
 *     Prompt Hub, Blog CMS, Social Media, Offer Builder,
 *     Systems Builder, Launch Planner, Calendar,
 *     Analytics, Keyword Generator, Brand Kit Export,
 *     Weekly Digest, Contacts, Documents, Request Add-ons
 *
 *   Structure ($97/mo) unlocks:
 *     SEO Intelligence, Team (invite members),
 *     CRM Suite, Pipeline Forecast, Automations
 *
 * USAGE:
 *   Full page:
 *     <PlanGate feature="content_studio"><ContentStudioPage /></PlanGate>
 *
 *   Inline (button/input):
 *     <PlanGate feature="brand_kit_export" inline><PrintButton /></PlanGate>
 *
 *   Strategic OS step gate:
 *     <StrategicOSStepGate stepNumber={3}><StepContent /></StrategicOSStepGate>
 *
 *   Team invite gate:
 *     <TeamInviteGate><InviteButton /></TeamInviteGate>
 */

import { useState, useEffect, createContext, useContext } from 'react'

// ─────────────────────────────────────────────────────────────
// PLAN HIERARCHY
// ─────────────────────────────────────────────────────────────

var PLAN_ORDER  = ['free', 'audit', 'foundation', 'structure', 'house', 'estate', 'legacy']
var PLAN_LABELS = {
  free:       'Free',
  audit:      'Brand Audit',
  foundation: 'The Foundation',
  structure:  'The Structure',
  house:      'The House',
  estate:     'The Estate',
  legacy:     'The Legacy Suite',
}
var PLAN_PRICES = {
  foundation: '$47/mo',
  structure:  '$97/mo',
  house:      '$197/mo',
  estate:     '$397/mo',
}

// ─────────────────────────────────────────────────────────────
// COMPLETE FEATURE CONFIG
// Every gated module defined here — never-gated modules are absent
// ─────────────────────────────────────────────────────────────

var FEATURE_CONFIG = {

  // ── BRAND FOUNDATION GROUP ─────────────────────────────────
  // Brand Foundation, Brand Memory, Brand Audit → NEVER GATED
  // They are the on-ramp. Never gate them.

  brand_health: {
    requiredPlan: 'foundation',
    label:        'Brand Health',
    icon:         '📊',
    description:  'Track your brand consistency score across every output as you generate and publish content. Meaningful only once content is flowing.',
  },
  brand_scorecard: {
    requiredPlan: 'foundation',
    label:        'Brand Scorecard',
    icon:         '🏆',
    description:  'Your brand KPI dashboard — performance metrics, content health, and growth indicators. Requires active content and campaign data.',
  },

  // ── STRATEGIC OS GROUP ─────────────────────────────────────
  // Step 1 is shown as a read-only preview. Steps 2-9 are gated.
  // Use StrategicOSStepGate component for per-step gating.

  strategic_os: {
    requiredPlan: 'foundation',
    label:        'Strategic OS',
    icon:         '⚙️',
    description:  'The 9-step brand strategy engine. Audience psychology, differentiation, content pillars, platform strategy, and monetization — all in one locked sequence. This is what separates a brand from a brand strategy.',
  },
  audience_psychology: {
    requiredPlan: 'foundation',
    label:        'Audience Psychology',
    icon:         '🧠',
    description:  'Deep audience profiling and psychological messaging triggers built into your brand strategy.',
  },
  differentiation: {
    requiredPlan: 'foundation',
    label:        'Differentiation',
    icon:         '🎯',
    description:  'Articulate your unique position against every alternative in your market.',
  },
  competitor_analysis: {
    requiredPlan: 'foundation',
    label:        'Competitor Analysis',
    icon:         '🔍',
    description:  'Real-time competitive research and content gap analysis powered by your brand niche.',
  },
  content_pillars: {
    requiredPlan: 'foundation',
    label:        'Content Pillars',
    icon:         '🗂',
    description:  'Platform-specific content strategy and topic mapping for every channel you publish on.',
  },
  platform_strategy: {
    requiredPlan: 'foundation',
    label:        'Platform Strategy',
    icon:         '📱',
    description:  'Channel selection and publishing strategy built around your audience and offer.',
  },
  monetization: {
    requiredPlan: 'foundation',
    label:        'Monetization',
    icon:         '💰',
    description:  'Your offer ladder, pricing strategy, and revenue path — built into your brand system.',
  },

  // ── CONTENT TOOLS GROUP ────────────────────────────────────

  content_studio: {
    requiredPlan: 'foundation',
    label:        'Content Studio',
    icon:         '✍️',
    description:  'Generate captions, emails, blog posts, ad copy, threads, and more — all powered by your Brand Memory and active campaign.',
  },
  media_studio: {
    requiredPlan: 'foundation',
    label:        'Media Studio',
    icon:         '🎨',
    description:  'Generate on-brand images and videos with your palette, prompts, and campaign context pre-loaded.',
  },
  media_workflow: {
    requiredPlan: 'foundation',
    label:        'Media Workflow',
    icon:         '🎬',
    description:  'Build a full asset queue from your campaign content plan and generate everything in one session.',
  },
  campaign_builder: {
    requiredPlan: 'foundation',
    label:        'Campaign Builder',
    icon:         '📣',
    description:  'Plan complete marketing campaigns using the MAGNET Framework — from offer to funnel to content checklist.',
  },
  automations: {
    requiredPlan: 'structure',
    label:        'Automations',
    icon:         '⚙️',
    description:  'Build automated workflows that trigger content creation and distribution on schedule.',
  },
  identity_studio: {
    requiredPlan: 'foundation',
    label:        'Identity Studio',
    icon:         '🎨',
    description:  'Upload your logo, lock your palette, and build a complete visual identity for your brand.',
  },
  prompt_hub: {
    requiredPlan: 'foundation',
    label:        'Prompt Hub',
    icon:         '⚡',
    description:  'Save and reuse your best prompts across all generators with brand context pre-filled.',
  },
  keyword_generator: {
    requiredPlan: 'foundation',
    label:        'Keyword Generator',
    icon:         '🔍',
    description:  'Surface SEO keyword opportunities tied to your brand niche and content pillars.',
  },
  brand_kit_export: {
    requiredPlan: 'foundation',
    label:        'Brand Kit Export',
    icon:         '📦',
    description:  'Export your complete brand guidelines as a downloadable PDF — logo, colors, typography, voice, and positioning.',
  },

  // ── OFFERS AND SYSTEMS GROUP ───────────────────────────────

  offer_builder: {
    requiredPlan: 'foundation',
    label:        'Offer Builder',
    icon:         '💰',
    description:  'Build your full offer stack with AI-powered pricing, value stacks, and positioning.',
  },
  systems_builder: {
    requiredPlan: 'foundation',
    label:        'Systems Builder',
    icon:         '🔧',
    description:  'Build SOPs and operational workflows that make your brand run without you.',
  },
  launch_planner: {
    requiredPlan: 'foundation',
    label:        'Launch Planner',
    icon:         '🚀',
    description:  'Campaign launch sequencing and milestone planning for every offer you take to market.',
  },

  // ── DISTRIBUTION GROUP ─────────────────────────────────────

  social_media: {
    requiredPlan: 'foundation',
    label:        'Social Media',
    icon:         '📱',
    description:  'Connect your social accounts and publish content directly from the platform.',
  },
  blog_cms: {
    requiredPlan: 'foundation',
    label:        'Blog CMS',
    icon:         '📝',
    description:  'Publish long-form content directly to your site from inside CTH OS.',
  },
  calendar: {
    requiredPlan: 'foundation',
    label:        'Calendar',
    icon:         '📅',
    description:  'Your content calendar — auto-populated from Campaign Builder and ready to publish from.',
  },
  seo_intelligence: {
    requiredPlan: 'structure',
    label:        'SEO Intelligence',
    icon:         '🌐',
    description:  'Site audit, ranking gaps, backlink analysis, competitor SEO, and market shift monitoring. Foundation users start with Keyword Generator.',
  },
  weekly_digest: {
    requiredPlan: 'foundation',
    label:        'Weekly Digest',
    icon:         '📬',
    description:  'Every Monday: content generated, content published, top-performing posts, credit usage, and recommended next actions.',
  },

  // ── BUSINESS TOOLS GROUP ───────────────────────────────────

  contacts: {
    requiredPlan: 'foundation',
    label:        'Contacts',
    icon:         '👤',
    description:  'Contact database for leads and clients — connected to your CRM pipeline.',
  },
  crm_suite: {
    requiredPlan: 'structure',
    label:        'CRM Suite',
    icon:         '👥',
    description:  'Manage leads, clients, and deals in a pipeline connected to your brand strategy.',
  },
  pipeline_forecast: {
    requiredPlan: 'structure',
    label:        'Pipeline Forecast',
    icon:         '📈',
    description:  'Forecast revenue from your active pipeline.',
  },
  analytics: {
    requiredPlan: 'foundation',
    label:        'Analytics',
    icon:         '📊',
    description:  'Track content performance, credit usage, and brand health over time.',
  },

  // ── ACCOUNT GROUP ──────────────────────────────────────────
  // Training Videos, Billing, Settings → NEVER GATED

  documents: {
    requiredPlan: 'foundation',
    label:        'Documents',
    icon:         '📁',
    description:  'Brand document storage for SOPs, brand guidelines, and strategic references.',
  },
  request_addons: {
    requiredPlan: 'foundation',
    label:        'Request Add-ons',
    icon:         '📋',
    description:  'Submit custom feature or integration requests. Available on Foundation and above.',
  },
  // team_invite is for the Invite button only — not a full page gate
  team_invite: {
    requiredPlan: 'structure',
    label:        'Team Members',
    icon:         '👥',
    description:  'Invite team members to your workspace. Structure plan supports up to 3 workspaces with team access.',
  },
}

// ─────────────────────────────────────────────────────────────
// SUBSCRIPTION CONTEXT
// ─────────────────────────────────────────────────────────────

var SubscriptionContext = createContext(null)

export function SubscriptionProvider(props) {
  var workspaceId = props.workspaceId
  var apiBase     = props.apiBase || '/api'
  var children    = props.children

  var planState  = useState(null); var plan    = planState[0]; var setPlan    = planState[1]
  var loadState  = useState(true); var loading = loadState[0]; var setLoading = loadState[1]

  useEffect(function() {
    if (!workspaceId) { setLoading(false); return }
    fetch(apiBase + '/workspaces/' + workspaceId + '/subscription', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then(function(r) { return r.ok ? r.json() : Promise.reject() })
      .then(function(data) { setPlan(data.plan || 'free'); setLoading(false) })
      .catch(function()   { setPlan('free');               setLoading(false) })
  }, [workspaceId])

  function hasAccess(requiredPlan) {
    if (!plan) return false
    return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(requiredPlan)
  }

  return (
    <SubscriptionContext.Provider value={{ plan, loading, hasAccess, planLabel: PLAN_LABELS[plan] || 'Free' }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  var ctx = useContext(SubscriptionContext)
  if (!ctx) return { plan: 'free', loading: false, hasAccess: function() { return false }, planLabel: 'Free' }
  return ctx
}

// ─────────────────────────────────────────────────────────────
// STYLE HELPERS
// ─────────────────────────────────────────────────────────────

var C = {
  bg:     '#0D0010',
  purple: '#33033C',
  accent: '#E04E35',
  crimson:'#AF0024',
  white:  '#fff',
  t50:    'rgba(255,255,255,0.5)',
  t30:    'rgba(255,255,255,0.3)',
  t25:    'rgba(255,255,255,0.25)',
  font:   "'DM Sans', sans-serif",
}

// ─────────────────────────────────────────────────────────────
// UPGRADE MODAL
// ─────────────────────────────────────────────────────────────

function UpgradeModal(props) {
  var feature      = props.feature
  var requiredPlan = props.requiredPlan
  var description  = props.description
  var onClose      = props.onClose

  var config   = FEATURE_CONFIG[feature] || {}
  var reqPlan  = requiredPlan || config.requiredPlan || 'foundation'
  var reqLabel = PLAN_LABELS[reqPlan]
  var reqPrice = PLAN_PRICES[reqPlan]

  // Show required plan + up to 2 plans above it
  var reqIdx = PLAN_ORDER.indexOf(reqPlan)
  var plans  = PLAN_ORDER.slice(reqIdx).filter(function(p) { return PLAN_PRICES[p] }).slice(0, 3)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24 }}>
      <div style={{ background: '#1A0020', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '32px 36px', width: '100%', maxWidth: 480, fontFamily: C.font }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {config.icon || '🔒'}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.white, margin: 0 }}>{config.label || 'This feature'}</p>
            <p style={{ fontSize: 11, color: C.t30, margin: 0 }}>Requires {reqLabel} ({reqPrice})</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.t30, cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <p style={{ fontSize: 13, color: C.t50, lineHeight: 1.65, margin: '0 0 22px' }}>
          {description || config.description || 'Upgrade your plan to unlock this feature.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {plans.map(function(p, i) {
            var isRec = i === 0
            return (
              <button key={p} onClick={function() { window.location.href = '/billing?plan=' + p }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: C.font, border: isRec ? '1px solid rgba(224,78,53,0.5)' : '1px solid rgba(255,255,255,0.1)', background: isRec ? 'rgba(224,78,53,0.1)' : 'rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  {isRec && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: C.accent, color: C.white, padding: '2px 8px', borderRadius: 20 }}>Best fit</span>}
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{PLAN_LABELS[p]}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: isRec ? C.accent : C.t30 }}>{PLAN_PRICES[p]}</span>
              </button>
            )
          })}
        </div>

        <button onClick={function() { window.location.href = '/billing' }} style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: C.accent, color: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font, boxShadow: '0 4px 16px rgba(224,78,53,0.3)' }}>
          View all plans →
        </button>
        <p style={{ fontSize: 11, color: C.t25, textAlign: 'center', margin: '12px 0 0' }}>Cancel or change plans anytime.</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// INLINE LOCK — wraps a button / input / small element
// ─────────────────────────────────────────────────────────────

function InlineLock(props) {
  var feature      = props.feature
  var requiredPlan = props.requiredPlan
  var description  = props.description

  var modalS = useState(false); var show = modalS[0]; var setShow = modalS[1]

  var config  = FEATURE_CONFIG[feature] || {}
  var reqPlan = requiredPlan || config.requiredPlan || 'foundation'

  return (
    <>
      {show && <UpgradeModal feature={feature} requiredPlan={reqPlan} description={description} onClose={function() { setShow(false) }} />}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <div style={{ filter: 'blur(1px)', opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }}>{props.children}</div>
        <button onClick={function() { setShow(true) }} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(51,3,60,0.88)', border: '1px solid rgba(224,78,53,0.35)', borderRadius: 8, cursor: 'pointer', fontFamily: C.font }}>
          <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke={C.accent} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.accent }}>{PLAN_LABELS[reqPlan]}</span>
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// FULL PAGE LOCK
// ─────────────────────────────────────────────────────────────

function FullPageLock(props) {
  var feature      = props.feature
  var requiredPlan = props.requiredPlan
  var title        = props.title
  var description  = props.description
  var showPreview  = props.showPreview !== false

  var modalS = useState(false); var show = modalS[0]; var setShow = modalS[1]

  var config   = FEATURE_CONFIG[feature] || {}
  var reqPlan  = requiredPlan || config.requiredPlan || 'foundation'
  var reqLabel = PLAN_LABELS[reqPlan]
  var reqPrice = PLAN_PRICES[reqPlan]
  var lockTitle = title || config.label || 'This feature'
  var lockDesc  = description || config.description || 'Upgrade to unlock this feature.'

  // Features to highlight in the "what you get" block
  var highlightMap = {
    foundation: ['Content Studio', 'Campaign Builder', 'Media Studio', 'Strategic OS', 'Identity Studio', 'Brand Scorecard'],
    structure:  ['SEO Intelligence', 'CRM Suite', 'Automations', 'Pipeline Forecast', 'Team Management', 'Multi-workspace'],
  }
  var highlights = highlightMap[reqPlan] || highlightMap.foundation

  return (
    <>
      {show && <UpgradeModal feature={feature} requiredPlan={reqPlan} description={lockDesc} onClose={function() { setShow(false) }} />}

      <div style={{ position: 'relative', minHeight: '100%', fontFamily: C.font }}>
        {showPreview && (
          <div style={{ filter: 'blur(4px)', opacity: 0.22, pointerEvents: 'none', userSelect: 'none', overflow: 'hidden', maxHeight: '100vh' }}>
            {props.children}
          </div>
        )}
        <div style={{ position: showPreview ? 'absolute' : 'relative', inset: showPreview ? 0 : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 40px', background: showPreview ? 'rgba(13,0,16,0.86)' : 'transparent', backdropFilter: showPreview ? 'blur(4px)' : 'none', textAlign: 'center', zIndex: 10 }}>

          <div style={{ width: 70, height: 70, borderRadius: 20, background: 'rgba(51,3,60,0.8)', border: '1px solid rgba(224,78,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 20 }}>
            {config.icon || '🔒'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="rgba(224,78,53,0.8)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(224,78,53,0.8)' }}>{reqLabel} — {reqPrice}</span>
          </div>

          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: C.white, margin: '0 0 12px', lineHeight: 1.2 }}>{lockTitle}</h2>
          <p style={{ fontSize: 14, color: C.t50, lineHeight: 1.7, maxWidth: 440, margin: '0 0 28px' }}>{lockDesc}</p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', padding: '14px 20px', background: 'rgba(51,3,60,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 28, maxWidth: 480 }}>
            {highlights.map(function(item) {
              return (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="10" height="10" fill="none" viewBox="0 0 12 12"><path d="M10 3L5 8.5 2 5.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontSize: 11, color: C.t50 }}>{item}</span>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={function() { window.location.href = '/billing?plan=' + reqPlan }} style={{ padding: '11px 28px', borderRadius: 10, border: 'none', background: C.accent, color: C.white, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: C.font, boxShadow: '0 4px 20px rgba(224,78,53,0.35)' }}>
              Upgrade to {reqLabel}
            </button>
            <button onClick={function() { setShow(true) }} style={{ padding: '11px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: C.t50, fontSize: 14, cursor: 'pointer', fontFamily: C.font }}>
              Compare plans
            </button>
          </div>
          <p style={{ fontSize: 11, color: C.t25, marginTop: 16 }}>No long-term contracts. Cancel anytime.</p>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// LOADING SPINNER
// ─────────────────────────────────────────────────────────────

function GateLoader(props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: props.inline ? 'auto' : 200, background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(224,78,53,0.3)', borderTopColor: C.accent, animation: 'cth-gate-spin 0.8s linear infinite' }} />
      <style dangerouslySetInnerHTML={{ __html: '@keyframes cth-gate-spin{to{transform:rotate(360deg)}}' }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PLANGATE COMPONENT
// ─────────────────────────────────────────────────────────────

export default function PlanGate(props) {
  var feature      = props.feature
  var requiredPlan = props.requiredPlan || (FEATURE_CONFIG[feature] && FEATURE_CONFIG[feature].requiredPlan) || 'foundation'
  var children     = props.children
  var inline       = props.inline || false

  var sub = useSubscription()

  if (sub.loading) return <GateLoader inline={inline} />
  if (sub.hasAccess(requiredPlan)) return children

  if (inline) {
    return <InlineLock feature={feature} requiredPlan={requiredPlan} description={props.description}>{children}</InlineLock>
  }
  return (
    <FullPageLock feature={feature} requiredPlan={requiredPlan} title={props.title} description={props.description} showPreview={props.showPreview}>
      {children}
    </FullPageLock>
  )
}

// ─────────────────────────────────────────────────────────────
// STRATEGIC OS STEP GATE
// Step 1 is always shown as a read-only preview.
// Steps 2-9 are gated inline until Foundation is active.
// ─────────────────────────────────────────────────────────────

/**
 * StrategicOSStepGate
 * Props:
 *   stepNumber  number   — 1-9
 *   stepLabel   string   — e.g. "Audience Psychology"
 *   children    node     — the step content
 */
export function StrategicOSStepGate(props) {
  var stepNumber = props.stepNumber || 1
  var stepLabel  = props.stepLabel  || 'Step ' + stepNumber
  var children   = props.children

  var sub      = useSubscription()
  var modalS   = useState(false); var show = modalS[0]; var setShow = modalS[1]

  // Step 1 is always visible — shown as read-only preview for free/audit
  var isPreviewStep = stepNumber === 1

  if (sub.loading) return <GateLoader />

  // Has Foundation or above — show everything
  if (sub.hasAccess('foundation')) return children

  // Step 1 — show preview with a soft upgrade nudge below
  if (isPreviewStep) {
    return (
      <div>
        {/* Preview — fully readable, not blurred */}
        <div style={{ position: 'relative' }}>
          {children}
          {/* Soft read-only badge */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(51,3,60,0.8)', border: '1px solid rgba(224,78,53,0.2)' }}>
            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="rgba(224,78,53,0.7)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: 'rgba(224,78,53,0.8)', fontFamily: C.font }}>Preview</span>
          </div>
        </div>
        {/* Upgrade nudge below Step 1 */}
        <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(51,3,60,0.45)', border: '1px solid rgba(224,78,53,0.18)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, fontFamily: C.font }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.white, margin: '0 0 3px' }}>Steps 2–9 are locked</p>
            <p style={{ fontSize: 11, color: C.t30, margin: 0 }}>Audience Psychology, Differentiation, Content Pillars, Platform Strategy, Monetization and more — all 9 steps unlock on The Foundation.</p>
          </div>
          <button onClick={function() { window.location.href = '/billing?plan=foundation' }} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 8, border: 'none', background: C.accent, color: C.white, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>
            Unlock All Steps
          </button>
        </div>
      </div>
    )
  }

  // Steps 2-9 — locked, show what step it is and CTA
  return (
    <>
      {show && <UpgradeModal feature="strategic_os" requiredPlan="foundation" onClose={function() { setShow(false) }} />}
      <div style={{ padding: '32px 24px', textAlign: 'center', background: 'rgba(51,3,60,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, fontFamily: C.font }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(51,3,60,0.8)', border: '1px solid rgba(224,78,53,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={C.accent} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.white, margin: '0 0 6px' }}>Step {stepNumber}: {stepLabel}</p>
        <p style={{ fontSize: 12, color: C.t30, margin: '0 0 18px' }}>Complete Step 1 first, then unlock all remaining steps with The Foundation.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={function() { window.location.href = '/billing?plan=foundation' }} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: C.accent, color: C.white, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>
            Upgrade to Foundation
          </button>
          <button onClick={function() { setShow(true) }} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: C.t30, fontSize: 12, cursor: 'pointer', fontFamily: C.font }}>
            Compare plans
          </button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// TEAM INVITE GATE
// Shows the Team page normally. Only gates the Invite button.
// ─────────────────────────────────────────────────────────────

/**
 * TeamInviteGate
 * Wraps just the Invite Member button on the Team page.
 * The page itself is always visible.
 */
export function TeamInviteGate(props) {
  return (
    <PlanGate feature="team_invite" requiredPlan="structure" inline>
      {props.children}
    </PlanGate>
  )
}

// ─────────────────────────────────────────────────────────────
// BRAND AUDIT PRINT GATE
// Inline gate for the Print Report button only.
// The audit results are always visible.
// ─────────────────────────────────────────────────────────────

export function AuditPrintGate(props) {
  return (
    <PlanGate feature="brand_kit_export" requiredPlan="foundation" inline
      description="Save and share your full Brand Audit report as a PDF. Unlock with The Foundation plan."
    >
      {props.children}
    </PlanGate>
  )
}

// ─────────────────────────────────────────────────────────────
// UPGRADE NUDGE — shown on Brand Audit page for free/audit users
// ─────────────────────────────────────────────────────────────

export function AuditUpgradeNudge() {
  var sub = useSubscription()
  if (sub.hasAccess('foundation')) return null

  return (
    <div style={{ marginTop: 24, padding: '18px 22px', background: 'rgba(51,3,60,0.4)', border: '1px solid rgba(224,78,53,0.2)', borderRadius: 12, fontFamily: C.font }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: C.white, margin: '0 0 8px' }}>Your audit is complete. Now act on it.</p>
      <p style={{ fontSize: 13, color: C.t30, margin: '0 0 18px', lineHeight: 1.6 }}>
        The Foundation plan gives you Content Studio, Campaign Builder, Media Studio, Strategic OS, and everything you need to execute on every priority action above.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
        {[['Content Studio', '✍️'], ['Campaign Builder', '📣'], ['Media Studio', '🎨'], ['Strategic OS', '⚙️'], ['Identity Studio', '🎨'], ['Brand Scorecard', '🏆']].map(function(item) {
          return (
            <div key={item[0]} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 13 }}>{item[1]}</span>
              <span style={{ fontSize: 11, color: C.t50 }}>{item[0]}</span>
            </div>
          )
        })}
      </div>
      <button onClick={function() { window.location.href = '/billing?plan=foundation' }} style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: C.accent, color: C.white, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font, boxShadow: '0 4px 16px rgba(224,78,53,0.3)' }}>
        Upgrade to The Foundation — $47/mo
      </button>
      <p style={{ fontSize: 11, color: C.t25, margin: '10px 0 0' }}>Cancel anytime. No long-term contracts.</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CONVENIENCE WRAPPERS — one line per module
// ─────────────────────────────────────────────────────────────

export function BrandHealthGate(p)        { return <PlanGate feature="brand_health"         {...p}>{p.children}</PlanGate> }
export function BrandScorecardGate(p)     { return <PlanGate feature="brand_scorecard"       {...p}>{p.children}</PlanGate> }
export function StrategicOSGate(p)        { return <PlanGate feature="strategic_os"          {...p}>{p.children}</PlanGate> }
export function ContentStudioGate(p)      { return <PlanGate feature="content_studio"        {...p}>{p.children}</PlanGate> }
export function MediaStudioGate(p)        { return <PlanGate feature="media_studio"          {...p}>{p.children}</PlanGate> }
export function MediaWorkflowGate(p)      { return <PlanGate feature="media_workflow"        {...p}>{p.children}</PlanGate> }
export function CampaignBuilderGate(p)    { return <PlanGate feature="campaign_builder"      {...p}>{p.children}</PlanGate> }
export function AutomationsGate(p)        { return <PlanGate feature="automations"           {...p}>{p.children}</PlanGate> }
export function IdentityStudioGate(p)     { return <PlanGate feature="identity_studio"       {...p}>{p.children}</PlanGate> }
export function PromptHubGate(p)          { return <PlanGate feature="prompt_hub"            {...p}>{p.children}</PlanGate> }
export function KeywordGeneratorGate(p)   { return <PlanGate feature="keyword_generator"     {...p}>{p.children}</PlanGate> }
export function BrandKitExportGate(p)     { return <PlanGate feature="brand_kit_export"      {...p}>{p.children}</PlanGate> }
export function OfferBuilderGate(p)       { return <PlanGate feature="offer_builder"         {...p}>{p.children}</PlanGate> }
export function SystemsBuilderGate(p)     { return <PlanGate feature="systems_builder"       {...p}>{p.children}</PlanGate> }
export function LaunchPlannerGate(p)      { return <PlanGate feature="launch_planner"        {...p}>{p.children}</PlanGate> }
export function SocialMediaGate(p)        { return <PlanGate feature="social_media"          {...p}>{p.children}</PlanGate> }
export function BlogCMSGate(p)            { return <PlanGate feature="blog_cms"              {...p}>{p.children}</PlanGate> }
export function CalendarGate(p)           { return <PlanGate feature="calendar"              {...p}>{p.children}</PlanGate> }
export function SEOIntelligenceGate(p)    { return <PlanGate feature="seo_intelligence"      {...p}>{p.children}</PlanGate> }
export function WeeklyDigestGate(p)       { return <PlanGate feature="weekly_digest"         {...p}>{p.children}</PlanGate> }
export function ContactsGate(p)           { return <PlanGate feature="contacts"              {...p}>{p.children}</PlanGate> }
export function CRMGate(p)                { return <PlanGate feature="crm_suite"             {...p}>{p.children}</PlanGate> }
export function PipelineForecastGate(p)   { return <PlanGate feature="pipeline_forecast"     {...p}>{p.children}</PlanGate> }
export function AnalyticsGate(p)          { return <PlanGate feature="analytics"             {...p}>{p.children}</PlanGate> }
export function DocumentsGate(p)          { return <PlanGate feature="documents"             {...p}>{p.children}</PlanGate> }
export function RequestAddonsGate(p)      { return <PlanGate feature="request_addons" inline {...p}>{p.children}</PlanGate> }
