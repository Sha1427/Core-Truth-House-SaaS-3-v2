import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, BookOpen,
  Zap, Target, LayoutGrid, Sparkles, Trophy, ArrowRight, FileText
} from 'lucide-react';

// ─── STEP DEFINITIONS ────────────────────────────────────────
const STEPS = [
  {
    id: 'brand-memory',
    title: 'Complete Your Brand Memory',
    description:
      'Brand Memory is the engine behind every AI generation on this platform. The more complete it is, the more your content sounds like you — not like generic AI output. Start here before anything else.',
    icon: Zap,
    route: '/brand-memory',
    cta: 'Open Brand Memory',
    tip: 'Aim for 80% or above. The five fields that matter most: Positioning Statement, Audience Pains, Audience Desires, Brand Voice Settings, and Audience Transformation.',
    successCriteria: 'Brand Memory at 70%+',
    minutesEstimate: 20,
  },
  {
    id: 'brand-foundation',
    title: 'Build Your Brand Foundation',
    description:
      'Your Brand Foundation documents your mission, vision, values, brand story, positioning statement, and tagline — all generated from your Brand Memory. This is your internal brand bible.',
    icon: BookOpen,
    route: '/brand-foundation',
    cta: 'Build Foundation',
    tip: 'Click Generate with AI and let the platform draft every section from your Brand Memory. Edit anything that does not feel accurate before saving.',
    successCriteria: 'Brand Clarity Score 75+',
    minutesEstimate: 10,
  },
  {
    id: 'offer-builder',
    title: 'Document Your First Offer',
    description:
      'The Offer Builder documents what you sell in a structured format the AI uses to generate offer-specific content. Every caption, email, and sales page can now be anchored to a real offer.',
    icon: Target,
    route: '/offer-builder',
    cta: 'Create Your Offer',
    tip: 'The Transformation Statement is the most important field. Finish this sentence: "After working with me, my client goes from ___ to ___." This is the result, not a description of what you do.',
    successCriteria: 'One offer published',
    minutesEstimate: 5,
  },
  {
    id: 'content-studio',
    title: 'Generate Your First Content',
    description:
      'Content Studio is where your brand comes to life. Generate captions, emails, sales copy, blog posts, video scripts, and more — all written using your Brand Memory as context.',
    icon: Sparkles,
    route: '/content-studio',
    cta: 'Generate Content',
    tip: 'Start with an Instagram Caption or Brand Statement. Select your offer from the dropdown, click Generate, then add it to your Content Calendar.',
    successCriteria: 'First content published',
    minutesEstimate: 5,
  },
  {
    id: 'content-calendar',
    title: 'Populate Your Content Calendar',
    description:
      'The Content Calendar is your unified publishing plan. Content you generate in Content Studio auto-populates here. Fill your first month so you stop scrambling and start executing.',
    icon: LayoutGrid,
    route: '/calendar',
    cta: 'Open Calendar',
    tip: 'Target 3–4 events per week across at least two content types. Add your offer launch or promotion dates first — then build content around them.',
    successCriteria: 'Calendar populated for the month',
    minutesEstimate: 30,
  },
];

// ─── PROGRESS CALCULATOR ─────────────────────────────────────
function calcProgress({ foundationScore, offersCreated, contentGenerated, hasCalendarEvents, brandMemoryScore }) {
  return {
    'brand-memory':     (brandMemoryScore || 0) >= 70,
    'brand-foundation': (foundationScore || 0) >= 75,
    'offer-builder':    (offersCreated || 0) >= 1,
    'content-studio':   (contentGenerated || 0) >= 1,
    'content-calendar': !!hasCalendarEvents,
  };
}

// ─── WELCOME MODAL ───────────────────────────────────────────
function WelcomeModal({ userFirstName, onStart, onDismiss }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div style={{ width: '100%', maxWidth: 480, borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.7)', background: 'var(--cth-surface-deep)', border: '1px solid var(--cth-brand-primary-soft)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--cth-brand-primary), var(--cth-admin-accent), var(--cth-admin-muted))' }} />
        <div style={{ padding: 32 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 99, background: 'var(--cth-brand-primary-soft)', border: '1px solid var(--cth-brand-primary-deep)', marginBottom: 24 }}>
            <Sparkles size={13} style={{ color: 'var(--cth-admin-accent)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cth-admin-muted)' }}>Quick Start</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--cth-on-dark)', marginBottom: 12, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.25 }}>
            Welcome to Core Truth House,{' '}
            <span style={{ color: 'var(--cth-admin-accent)' }}>{userFirstName}.</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(248,245,250,0.6)', marginBottom: 28, lineHeight: 1.7 }}>
            Your brand house is open. Your Quick Start gets you from setup to your first published content in 30 minutes.
          </p>

          {/* 30-day goals */}
          <div style={{ borderRadius: 16, padding: 20, marginBottom: 24, background: 'var(--cth-surface-raised)', border: '1px solid var(--cth-brand-primary-soft)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cth-admin-accent)', marginBottom: 14 }}>Your 30-Day Goals</p>
            {[
              'Brand Foundation completed',
              'Offer documented in Offer Builder',
              'First piece of content generated and published',
              'Content Calendar populated for the month',
            ].map((goal) => (
              <div key={goal} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--cth-admin-accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(248,245,250,0.7)' }}>{goal}</span>
              </div>
            ))}
          </div>

          {/* Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 12, padding: '12px 18px', background: 'var(--cth-surface-raised-strong)', border: '1px solid var(--cth-brand-primary-soft)', marginBottom: 28 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--cth-admin-accent)' }}>30</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--cth-on-dark)', margin: 0 }}>minutes to your first content</p>
              <p style={{ fontSize: 12, color: 'rgba(248,245,250,0.4)', margin: 0 }}>Five steps. One clear path.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onStart}
              data-testid="onboarding-start-btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 12, fontWeight: 700, color: 'var(--cth-on-dark)', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, var(--cth-brand-primary), var(--cth-admin-accent))', fontSize: 14 }}
            >
              Start Quick Start <ArrowRight size={16} />
            </button>
            <button
              onClick={onDismiss}
              data-testid="onboarding-skip-btn"
              style={{ padding: '14px 20px', borderRadius: 12, fontSize: 13, color: 'rgba(248,245,250,0.5)', cursor: 'pointer', background: 'var(--cth-surface-raised)', border: '1px solid var(--cth-brand-primary-soft)' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STEP MODAL ───────────────────────────────────────────────
function StepModal({ steps, progress, currentIdx, onNext, onPrev, onGo, onDismiss }) {
  const step = steps[currentIdx];
  const Icon = step.icon;
  const done = progress[step.id];
  const total = steps.length;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.85)' }}
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div style={{ width: '100%', maxWidth: 480, borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.7)', background: 'var(--cth-surface-deep)', border: '1px solid var(--cth-brand-primary-soft)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--cth-brand-primary), var(--cth-admin-accent), var(--cth-admin-muted))' }} />

        {/* Progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '20px 28px 8px' }}>
          {steps.map((s, i) => (
            <div
              key={s.id}
              style={{
                height: 6,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                width: i === currentIdx ? 28 : 6,
                background: progress[s.id] ? 'var(--cth-status-success)' : i === currentIdx ? 'var(--cth-admin-accent)' : 'var(--cth-brand-primary-soft)',
              }}
            />
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--cth-admin-muted)' }}>{currentIdx + 1} of {total}</span>
        </div>

        <div style={{ padding: '16px 28px 28px' }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cth-brand-primary-soft)', color: 'var(--cth-admin-accent)', flexShrink: 0 }}>
              <Icon size={22} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--cth-admin-muted)', margin: 0 }}>Step {currentIdx + 1}</p>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--cth-on-dark)', margin: 0, lineHeight: 1.25 }}>{step.title}</h2>
            </div>
            {done && <CheckCircle2 size={18} style={{ color: 'var(--cth-status-success)', marginLeft: 'auto', flexShrink: 0 }} />}
          </div>

          {/* Description */}
          <p style={{ fontSize: 13, color: 'rgba(248,245,250,0.65)', lineHeight: 1.75, marginBottom: 18 }}>{step.description}</p>

          {/* Tip */}
          <div style={{ borderRadius: 12, padding: '12px 16px', marginBottom: 18, background: 'var(--cth-surface-raised)', border: '1px solid var(--cth-brand-primary-deep)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--cth-admin-accent)', margin: '0 0 6px' }}>TIP</p>
            <p style={{ fontSize: 12, color: 'rgba(248,245,250,0.6)', lineHeight: 1.65, margin: 0 }}>{step.tip}</p>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cth-admin-accent)' }} />
              <span style={{ fontSize: 12, color: 'rgba(248,245,250,0.5)' }}>{step.minutesEstimate} min</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: 'var(--cth-status-success)' }} />
              <span style={{ fontSize: 12, color: 'rgba(248,245,250,0.5)' }}>{step.successCriteria}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onPrev}
              disabled={currentIdx === 0}
              style={{ padding: '12px', borderRadius: 12, border: '1px solid var(--cth-brand-primary-soft)', background: 'var(--cth-surface-raised)', color: 'var(--cth-admin-muted)', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer', opacity: currentIdx === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => onGo(step.route)}
              data-testid={`onboarding-step-${step.id}-btn`}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: done ? '1px solid var(--cth-status-success)' : 'none',
                background: done ? 'color-mix(in srgb, var(--cth-status-success) 55%, var(--cth-surface-night))' : 'linear-gradient(135deg, var(--cth-brand-primary), var(--cth-admin-accent))',
                color: done ? 'color-mix(in srgb, var(--cth-status-success-bright) 70%, white)' : 'var(--cth-white)',
              }}
            >
              {done ? <><CheckCircle2 size={15} style={{ color: 'var(--cth-status-success)' }} /> Complete — Review Again</> : <>{step.cta} <ArrowRight size={15} /></>}
            </button>

            <button
              onClick={onNext}
              disabled={currentIdx === total - 1}
              style={{ padding: '12px', borderRadius: 12, border: '1px solid var(--cth-brand-primary-soft)', background: 'var(--cth-surface-raised)', color: 'var(--cth-admin-muted)', cursor: currentIdx === total - 1 ? 'not-allowed' : 'pointer', opacity: currentIdx === total - 1 ? 0.3 : 1, display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 }}>
            <button
              onClick={onDismiss}
              style={{ fontSize: 12, color: 'rgba(248,245,250,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT: OnboardingChecklist ────────────────────────
export function OnboardingChecklist({ metrics, upcomingEvents, userFirstName, userId }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showStep, setShowStep] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  const STORAGE_KEY = `cth-onboarding-dismissed-${userId || 'anon'}`;

  useEffect(() => {
    if (!userId) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Show welcome modal after short delay on first visit
      const t = setTimeout(() => setShowWelcome(true), 1200);
      return () => clearTimeout(t);
    }
  }, [userId]);

  const progress = calcProgress({
    foundationScore: metrics?.foundation_score,
    offersCreated: metrics?.offers_created,
    contentGenerated: metrics?.content_generated,
    hasCalendarEvents: upcomingEvents?.length > 0,
    brandMemoryScore: metrics?.brand_memory_score,
  });

  const completed = STEPS.filter((s) => progress[s.id]).length;
  const total = STEPS.length;
  const pct = Math.round((completed / total) * 100);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowWelcome(false);
    setShowStep(false);
  };

  const handleGo = (route) => {
    dismiss();
    navigate(route);
  };

  const handleStart = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowWelcome(false);
    setShowStep(true);
    setCurrentIdx(0);
  };

  // Hide floating button if all complete
  if (pct === 100) return null;

  return (
    <>
      {/* Welcome Modal */}
      {showWelcome && !showStep && (
        <WelcomeModal
          userFirstName={userFirstName || 'there'}
          onStart={() => handleStart()}
          onDismiss={dismiss}
        />
      )}

      {/* Step Modal */}
      {showStep && !showWelcome && (
        <StepModal
          steps={STEPS}
          progress={progress}
          currentIdx={currentIdx}
          onNext={() => setCurrentIdx(i => Math.min(i + 1, STEPS.length - 1))}
          onPrev={() => setCurrentIdx(i => Math.max(i - 1, 0))}
          onGo={handleGo}
          onDismiss={() => { dismiss(); setShowStep(false); }}
        />
      )}

      {/* Floating Widget */}
      <div style={{ position: 'fixed', bottom: 72, right: 24, zIndex: 8000 }}>
        {open ? (
          <div
            data-testid="onboarding-checklist-panel"
            style={{ width: 300, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', background: 'var(--cth-surface-deep)', border: '1px solid var(--cth-brand-primary-soft)' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'var(--cth-surface-strong)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Trophy size={16} style={{ color: 'var(--cth-admin-accent)' }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--cth-on-dark)' }}>Your Quick Start</span>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,245,250,0.5)', display: 'flex' }}>
                <X size={15} />
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ padding: '14px 18px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(248,245,250,0.5)' }}>{completed} of {total} complete</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--cth-admin-accent)' }}>{pct}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'var(--cth-brand-primary-soft)' }}>
                <div style={{ height: '100%', borderRadius: 3, transition: 'width 0.5s ease', width: `${pct}%`, background: 'linear-gradient(90deg, var(--cth-brand-primary), var(--cth-admin-accent))' }} />
              </div>
            </div>

            {/* Steps list */}
            <div style={{ padding: '8px 10px 10px' }}>
              {STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const done = progress[step.id];
                return (
                  <button
                    key={step.id}
                    data-testid={`checklist-step-${step.id}`}
                    onClick={() => {
                      if (!done) {
                        setCurrentIdx(i);
                        setShowStep(true);
                        setOpen(false);
                      }
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 12, textAlign: 'left',
                      marginBottom: 4, border: done ? '1px solid transparent' : '1px solid var(--cth-brand-primary-soft)',
                      background: done ? 'transparent' : 'var(--cth-surface-raised)',
                      opacity: done ? 0.5 : 1, cursor: done ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      {done
                        ? <CheckCircle2 size={15} style={{ color: 'var(--cth-status-success)' }} />
                        : <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--cth-admin-accent)' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--cth-on-dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step.title}</p>
                      <p style={{ fontSize: 11, color: 'rgba(248,245,250,0.4)', margin: 0 }}>{step.minutesEstimate} min · {step.successCriteria}</p>
                    </div>
                    {!done && <ChevronRight size={13} style={{ color: 'rgba(248,245,250,0.3)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {/* View guide link */}
            <div style={{ padding: '0 10px 12px' }}>
              <button
                onClick={() => { setCurrentIdx(0); setShowStep(true); setOpen(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, fontSize: 12, color: 'var(--cth-admin-muted)', background: 'var(--cth-surface-deep)', border: '1px solid var(--cth-brand-primary-soft)', cursor: 'pointer' }}
              >
                <FileText size={12} />
                View Step-by-Step Guide
              </button>
            </div>
          </div>
        ) : (
          <button
            data-testid="onboarding-checklist-toggle"
            onClick={() => setOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
              borderRadius: 99, fontWeight: 700, fontSize: 13, color: 'var(--cth-on-dark)',
              cursor: 'pointer', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              background: 'linear-gradient(135deg, var(--cth-surface-strong), var(--cth-brand-primary-deep))',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(175,0,36,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)'; }}
          >
            <Trophy size={15} style={{ color: 'var(--cth-admin-accent)' }} />
            <span>Quick Start</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 800, background: 'var(--cth-admin-accent)', color: 'var(--cth-on-dark)' }}>{pct}%</span>
          </button>
        )}
      </div>
    </>
  );
}

export default OnboardingChecklist;
