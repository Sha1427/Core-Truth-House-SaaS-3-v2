/**
 * PreAuditIntake.jsx
 * CTH OS — Pre-Audit Intake Form
 *
 * Shows before the Brand Audit runs for the first time.
 * Collects 12 questions across 4 sections.
 * On submit: saves answers to Brand Memory, then triggers the audit.
 */

import React, { useState } from 'react';
import { useColors } from '../../context/ThemeContext';
import { useUser } from '../../hooks/useAuth';
import axios from 'axios';
import { Shield, ChevronRight, ChevronLeft, Loader2, Check, Target, Megaphone, Globe, Crosshair } from 'lucide-react';
import apiClient from "../../lib/apiClient";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const SECTIONS = [
  {
    id: 'brand',
    number: 1,
    label: 'Your Brand',
    Icon: Shield,
    desc: "Tell us about the brand we're auditing.",
    questions: [
      { id: 'brand_name', label: 'What is your brand name?', sublabel: 'The name you operate under publicly.', type: 'input', placeholder: 'e.g. Oak & Ember Studio', required: true },
      { id: 'tagline', label: 'Do you have a tagline?', sublabel: "One sentence that describes what you do. Leave blank if you don't have one yet.", type: 'input', placeholder: 'e.g. Strategy that turns scattered effort into steady growth.', required: false },
      { id: 'what_you_do', label: 'What do you do?', sublabel: 'Describe your service, product, or expertise in 1-2 sentences.', type: 'textarea', placeholder: 'e.g. I help service-based founders clarify their message, package their offers, and build a repeatable marketing system.', required: true, rows: 3 },
      { id: 'who_you_serve', label: 'Who do you serve?', sublabel: 'Describe your ideal client. One specific person, not a broad demographic.', type: 'textarea', placeholder: "e.g. Service-based business owners who are getting referrals but struggling to turn online attention into consistent sales.", required: true, rows: 3 },
    ],
  },
  {
    id: 'offer',
    number: 2,
    label: 'Your Offer',
    Icon: Target,
    desc: 'Tell us what you sell and how.',
    questions: [
      { id: 'primary_offer', label: 'What is your primary offer?', sublabel: 'The main thing you want people to buy from you right now.', type: 'input', placeholder: 'e.g. A 6-week brand strategy intensive, monthly consulting plan, or digital toolkit.', required: true },
      { id: 'price_point', label: 'What is the price?', sublabel: 'Monthly, one-time, or hourly — just give us the number.', type: 'input', placeholder: 'e.g. $97/month, $2,500 one-time, $350/hour', required: true },
      { id: 'offer_type', label: 'What type of offer is it?', type: 'pills', required: true, options: ['Recurring subscription', 'One-time service', 'Digital product', 'Coaching / consulting', 'Course or program', 'Done-for-you', 'Agency retainer', 'Physical product'] },
      { id: 'other_offers', label: 'Do you have any other offers?', sublabel: 'List them briefly. Leave blank if this is your only one.', type: 'textarea', placeholder: 'e.g. Brand audit intensive ($497), Brand Foundation workshop ($997)', required: false, rows: 2 },
    ],
  },
  {
    id: 'presence',
    number: 3,
    label: 'Your Presence',
    Icon: Globe,
    desc: 'Tell us where you show up and how often.',
    questions: [
      { id: 'active_platforms', label: 'Where are you currently active?', sublabel: 'Select all platforms where you publish content regularly.', type: 'checkboxes', required: true, options: ['LinkedIn', 'Instagram', 'TikTok', 'Twitter/X', 'Threads', 'YouTube', 'Facebook', 'Pinterest', 'Email list', 'Podcast', 'Blog'] },
      { id: 'posting_frequency', label: 'How often do you post?', type: 'pills', required: false, options: ['Daily', '4-5x per week', '2-3x per week', 'Weekly', 'A few times a month', 'Rarely or never'] },
      { id: 'website', label: 'Do you have a website?', sublabel: 'Share the URL if yes.', type: 'input', placeholder: 'e.g. coretruthhouse.com (or leave blank)', required: false },
    ],
  },
  {
    id: 'goals',
    number: 4,
    label: 'Your Goals',
    Icon: Crosshair,
    desc: 'Tell us where you want to go.',
    questions: [
      { id: 'primary_goal', label: 'What is your primary goal right now?', type: 'pills', required: true, options: ['Get my first paying clients', 'Scale past 6 figures', 'Build to 7 figures', 'Launch a new offer', 'Build recurring revenue', 'Grow my audience', 'Position as an authority', 'Systematize and scale'] },
      { id: 'biggest_challenge', label: 'What is your biggest brand challenge right now?', sublabel: 'Be specific. The more precise, the more useful the audit.', type: 'textarea', placeholder: "e.g. I post consistently but nothing converts. I'm not sure if my messaging is off or if I'm reaching the wrong people.", required: true, rows: 3 },
      { id: 'revenue_target', label: 'What is your revenue goal for the next 90 days?', sublabel: 'Give us a number. Specific goals produce specific strategy.', type: 'input', placeholder: 'e.g. $10,000 MRR, $25,000 in new clients, $5K this month', required: false },
    ],
  },
];

const ALL_QUESTIONS = SECTIONS.flatMap(s => s.questions);
const REQUIRED_COUNT = ALL_QUESTIONS.filter(q => q.required).length;

function QuestionInput({ question: q, value, onChange, colors }) {
  const [focused, setFocused] = useState(false);

  const inputSt = {
    width: '100%',
    background: focused ? `${colors.cinnabar}0F` : `${colors.tuscany}0A`,
    border: `1px solid ${focused ? colors.cinnabar + '55' : colors.tuscany + '18'}`,
    borderRadius: 9,
    padding: '10px 13px',
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
    lineHeight: 1.6,
    transition: 'border-color 0.15s, background 0.15s',
  };

  if (q.type === 'textarea') {
    return (
      <textarea
        data-testid={`intake-${q.id}`}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={q.placeholder}
        rows={q.rows || 3}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputSt, resize: 'vertical' }}
      />
    );
  }

  if (q.type === 'pills') {
    const selected = value || '';
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {q.options.map(opt => {
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              data-testid={`intake-${q.id}-${opt.replace(/\s/g, '-').toLowerCase()}`}
              onClick={() => onChange(isSelected ? '' : opt)}
              style={{
                padding: '7px 16px', borderRadius: 20,
                border: `1px solid ${isSelected ? colors.cinnabar + '60' : colors.tuscany + '18'}`,
                background: isSelected ? `${colors.cinnabar}18` : `${colors.tuscany}0A`,
                color: isSelected ? colors.cinnabar : colors.textMuted,
                fontSize: 12.5, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.12s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === 'checkboxes') {
    const selectedArr = Array.isArray(value) ? value : [];
    const toggle = opt =>
      onChange(
        selectedArr.includes(opt)
          ? selectedArr.filter(x => x !== opt)
          : [...selectedArr, opt]
      );
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {q.options.map(opt => {
          const isSelected = selectedArr.includes(opt);
          return (
            <button
              key={opt}
              data-testid={`intake-${q.id}-${opt.replace(/\s/g, '-').toLowerCase()}`}
              onClick={() => toggle(opt)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 14px', borderRadius: 20,
                border: `1px solid ${isSelected ? colors.cinnabar + '60' : colors.tuscany + '18'}`,
                background: isSelected ? `${colors.cinnabar}15` : `${colors.tuscany}0A`,
                color: isSelected ? colors.cinnabar : colors.textMuted,
                fontSize: 12.5, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.12s',
              }}
            >
              {isSelected && <Check size={10} />}
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      data-testid={`intake-${q.id}`}
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={q.placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={inputSt}
    />
  );
}

function IntakeProgress({ current, total, colors }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const isPast = n < current;
        const isCurrent = n === current;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: isPast ? 'rgba(16,185,129,0.2)' : isCurrent ? `${colors.cinnabar}25` : `${colors.tuscany}0A`,
              border: `1.5px solid ${isPast ? 'rgba(16,185,129,0.5)' : isCurrent ? `${colors.cinnabar}60` : colors.tuscany + '18'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              {isPast ? (
                <Check size={10} style={{ color: 'var(--cth-status-success-bright)' }} />
              ) : (
                <span style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? colors.cinnabar : colors.textMuted }}>{n}</span>
              )}
            </div>
            {n < total && <div style={{ width: 20, height: 1.5, background: isPast ? 'rgba(16,185,129,0.3)' : colors.tuscany + '18' }} />}
          </div>
        );
      })}
    </div>
  );
}

/**
 * PreAuditIntake
 * Props:
 *   onComplete  — called after intake + audit trigger succeeds
 *   onSkip      — allow skipping intake
 */
export default function PreAuditIntake({ onComplete, onSkip, workspaceId = '' }) {
  const colors = useColors();
  const { user } = useUser();
  const userId = user?.id;
  const storageKey = `cth-brand-audit-intake:${workspaceId || userId || 'default'}`;

  const [step, setStep] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return saved.step || 1;
    } catch {
      return 1;
    }
  });

  const [answers, setAnswers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return saved.answers || {};
    } catch {
      return {};
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currentSection = SECTIONS[step - 1];
  const SectionIcon = currentSection.Icon;
  const isLastStep = step === SECTIONS.length;

  const persistDraft = (nextAnswers, nextStep = step) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        answers: nextAnswers,
        step: nextStep,
        updatedAt: new Date().toISOString(),
      }));
    } catch {
      // localStorage can fail in private mode; do not block the form.
    }
  };

  const setAnswer = (qId, value) => {
    setAnswers(prev => {
      const next = { ...prev, [qId]: value };
      persistDraft(next);
      return next;
    });
  };

  const canAdvance = () => {
    return currentSection.questions
      .filter(q => q.required)
      .every(q => {
        const val = answers[q.id];
        if (Array.isArray(val)) return val.length > 0;
        return val && val.toString().trim().length > 0;
      });
  };

  const handleNext = () => {
    if (!canAdvance()) {
      setError('Please fill in the required fields before continuing.');
      return;
    }
    setError(null);
    if (isLastStep) {
      handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(s => {
      const nextStep = Math.max(1, s - 1);
      persistDraft(answers, nextStep);
      return nextStep;
    });
  };

  const handleSubmit = async () => {
    if (!canAdvance()) {
      setError('Please fill in the required fields.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.post("/api/brand-audit/intake", {
        answers,
        user_id: userId || 'default',
      });
      onComplete?.();
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filledRequired = ALL_QUESTIONS
    .filter(q => q.required)
    .filter(q => {
      const val = answers[q.id];
      if (Array.isArray(val)) return val.length > 0;
      return val && val.toString().trim().length > 0;
    }).length;

  const overallProgress = Math.round((filledRequired / REQUIRED_COUNT) * 100);

  return (
    <div data-testid="pre-audit-intake" style={{ minHeight: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes cth-spin{to{transform:rotate(360deg)}} @keyframes cth-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: `${colors.darkest}F2`,
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${colors.tuscany}15`,
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: `${colors.cinnabar}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={16} style={{ color: colors.cinnabar }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Brand Audit Intake</p>
            <p style={{ fontSize: 10, color: colors.textMuted, margin: 0 }}>Answer a few questions to get a meaningful score</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <IntakeProgress current={step} total={SECTIONS.length} colors={colors} />
          {onSkip && (
            <button
              data-testid="intake-skip-btn"
              onClick={onSkip}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: colors.textMuted, fontSize: 11,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Skip intake
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 24px', animation: 'cth-fade 0.25s ease' }} key={step}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 13,
            background: `${colors.cinnabar}15`,
            border: `1px solid ${colors.cinnabar}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <SectionIcon size={22} style={{ color: colors.cinnabar }} />
          </div>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.15em', color: colors.cinnabar, margin: '0 0 4px',
            }}>
              Section {currentSection.number} of {SECTIONS.length}
            </p>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 24, fontWeight: 700, color: colors.textPrimary,
              margin: '0 0 6px', lineHeight: 1.2,
            }}>
              {currentSection.label}
            </h1>
            <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>{currentSection.desc}</p>
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {currentSection.questions.map(q => (
            <div key={q.id} style={{
              background: colors.cardBg,
              border: `1px solid ${colors.tuscany}15`,
              borderRadius: 12, padding: '18px 20px',
            }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: q.sublabel ? 3 : 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>{q.label}</p>
                  {q.required && <span style={{ fontSize: 11, color: colors.cinnabar }}>*</span>}
                </div>
                {q.sublabel && (
                  <p style={{ fontSize: 11.5, color: colors.textMuted, margin: 0, lineHeight: 1.5 }}>{q.sublabel}</p>
                )}
              </div>
              <QuestionInput
                question={q}
                value={answers[q.id]}
                onChange={val => { setAnswer(q.id, val); setError(null); }}
                colors={colors}
              />
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 9,
          }}>
            <p data-testid="intake-error" style={{ fontSize: 12, color: 'var(--cth-status-danger)', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {step > 1 && (
            <button
              data-testid="intake-back-btn"
              onClick={handleBack}
              style={{
                padding: '11px 22px', borderRadius: 9,
                border: `1px solid ${colors.tuscany}22`,
                background: 'none', color: colors.textMuted,
                fontSize: 13, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <ChevronLeft size={14} /> Back
            </button>
          )}
          <button
            data-testid="intake-next-btn"
            onClick={handleNext}
            disabled={submitting}
            style={{
              flex: 1, padding: '11px', borderRadius: 9,
              border: 'none',
              background: canAdvance()
                ? `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`
                : `${colors.tuscany}0F`,
              color: canAdvance() ? 'var(--cth-white)' : colors.textMuted,
              fontSize: 13, fontWeight: 600,
              cursor: canAdvance() && !submitting ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: canAdvance() ? `0 4px 16px ${colors.cinnabar}40` : 'none',
              transition: 'all 0.15s',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={14} style={{ animation: 'cth-spin 0.8s linear infinite' }} />
                Running your Brand Audit...
              </>
            ) : isLastStep ? (
              <>
                <Shield size={14} /> Run my Brand Audit <ChevronRight size={14} />
              </>
            ) : (
              <>Continue <ChevronRight size={14} /></>
            )}
          </button>
        </div>

        {/* Progress summary */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 3, background: `${colors.tuscany}0F`, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${overallProgress}%`,
              background: colors.cinnabar, borderRadius: 2,
              transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: 10, color: colors.textMuted, flexShrink: 0 }}>{filledRequired}/{REQUIRED_COUNT} required</span>
        </div>

        {isLastStep && (
          <p style={{
            fontSize: 11, color: colors.textMuted,
            textAlign: 'center', margin: '12px 0 0', lineHeight: 1.6,
          }}>
            Your answers pre-populate Brand Memory and give the AI the context it needs to produce a meaningful score — even on day one.
          </p>
        )}
      </div>
    </div>
  );
}

