import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, RotateCcw } from 'lucide-react';

import { DashboardLayout, TopBar } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../lib/apiClient';
import PreAuditIntake from '../components/Brand/PreAuditIntake';
import { AuditAnalysisText, AuditNextSteps } from '../components/Brand/BrandAuditResults';
import { AuditExportButton } from '../components/Brand/AuditExportButton';

const AUDIT_ENDPOINT = '/api/audit/latest';

function clampScore(value) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function normalizeModuleScores(raw = {}) {
  return {
    brand_foundation: clampScore(
      raw.brand_foundation ??
        raw.foundation ??
        raw.brandFoundation ??
        raw.brand_foundation_score
    ),
    visual_identity: clampScore(
      raw.visual_identity ??
        raw.identity ??
        raw.visualIdentity ??
        raw.visual_identity_score
    ),
    offer_suite: clampScore(
      raw.offer_suite ??
        raw.offers ??
        raw.offerSuite ??
        raw.offer_suite_score
    ),
    systems_and_sops: clampScore(
      raw.systems_and_sops ??
        raw.systems ??
        raw.systemsAndSops ??
        raw.systems_score
    ),
    content_library: clampScore(
      raw.content_library ??
        raw.content ??
        raw.contentLibrary ??
        raw.content_library_score
    ),
    launch_readiness: clampScore(
      raw.launch_readiness ??
        raw.launch ??
        raw.launchReadiness ??
        raw.launch_readiness_score
    ),
  };
}

function normalizeAuditPayload(payload) {
  const data = payload?.audit || payload || {};
  const rawScores = data.module_scores || data.scores || {};

  const moduleScores = normalizeModuleScores({
    ...rawScores,
    brand_foundation: rawScores.brand_foundation ?? rawScores.foundation,
    visual_identity: rawScores.visual_identity ?? rawScores.identity,
    offer_suite: rawScores.offer_suite ?? rawScores.offers,
    systems_and_sops: rawScores.systems_and_sops ?? rawScores.systems,
    systems: rawScores.systems ?? rawScores.systems_and_sops,
    content_library: rawScores.content_library ?? rawScores.content,
    launch_readiness: rawScores.launch_readiness,
  });

  const values = Object.values(moduleScores).filter((value) => value > 0);
  const computedOverall = values.length
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;

  return {
    auditId: data.auditId || data.audit_id || data.id || '',
    overallScore: clampScore(
      data.overallScore ??
        data.overall_score ??
        data.score ??
        data.scores?.overall ??
        computedOverall
    ),
    rating:
      data.brand_health_rating ||
      data.rating ||
      data.health_rating ||
      'Not scored yet',
    moduleScores,
    aiAnalysisText:
      data.aiAnalysisText ||
      data.ai_analysis_text ||
      data.ai_analysis ||
      data.analysis ||
      data.summary ||
      '',
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    risks: Array.isArray(data.risks) ? data.risks : Array.isArray(data.gaps) ? data.gaps : [],
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
    intakeAnswers: data.intake_answers || data.answers || {},
    raw: data,
  };
}

function hasAuditData(audit) {
  return Boolean(
    audit?.auditId ||
      audit?.aiAnalysisText ||
      audit?.overallScore > 0 ||
      Object.values(audit?.moduleScores || {}).some((score) => score > 0)
  );
}

function scoreMessage(score) {
  if (score >= 80) {
    return 'Your brand has a strong baseline. The next leverage point is turning that foundation into repeatable systems, content, offers, and launch execution.';
  }

  if (score >= 60) {
    return 'Your brand has useful structure, but one or more growth engines still need to be tightened before the strategy can compound.';
  }

  if (score >= 36) {
    return 'Your brand is developing. The biggest opportunity is to clarify the foundation, strengthen the offer path, and close the gaps that are slowing momentum.';
  }

  return 'Your brand needs foundational work before deeper strategy, content, campaigns, or scaling will produce consistent results.';
}

function nextBestMovesFor(audit) {
  const score = audit.overallScore;
  const scores = audit.moduleScores || {};
  const moves = [];

  if (scores.brand_foundation < 70) {
    moves.push({
      title: 'Build or refine Brand Foundation',
      text: 'Clarify the mission, positioning, audience, values, voice, and brand promise before building deeper execution layers.',
      path: '/brand-foundation',
    });
  }

  if (scores.offer_suite < 70) {
    moves.push({
      title: 'Clarify the offer path',
      text: 'Your audit suggests the offer may need sharper packaging, pricing logic, or a clearer conversion path.',
      path: '/strategic-os',
    });
  }

  if (scores.content_library < 70) {
    moves.push({
      title: 'Create content from the audit gaps',
      text: 'Turn the audit findings into content pillars and focused messaging that speaks directly to your audience’s current friction.',
      path: '/content-studio',
    });
  }

  if (scores.systems_and_sops < 70) {
    moves.push({
      title: 'Turn strategy into a repeatable operating system',
      text: 'Use Strategic OS to translate the audit into repeatable decisions, workflow logic, and execution structure.',
      path: '/strategic-os',
    });
  }

  if (scores.launch_readiness < 70 || score < 60) {
    moves.push({
      title: 'Do not launch yet',
      text: 'The audit indicates that foundational clarity should come before campaign execution. Fix the base layer first.',
      path: '/brand-foundation',
    });
  }

  if (!moves.length) {
    moves.push({
      title: 'Move into Strategic OS',
      text: 'Your audit is strong enough to turn the foundation into a structured execution system.',
      path: '/strategic-os',
    });
  }

  return moves.slice(0, 3);
}

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const PAGE_STYLE = {
  background: 'var(--cth-command-blush)',
  minHeight: '100vh',
};

const SECTION_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  margin: 0,
};

const SECTION_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 26,
  fontWeight: 600,
  color: 'var(--cth-command-ink)',
  margin: '8px 0 0',
  letterSpacing: '-0.005em',
  lineHeight: 1.2,
};

const CONTENT_CARD_STYLE = {
  background: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
  padding: 28,
};

const MODULE_META = {
  brand_foundation: { label: 'Brand Foundation', accent: 'var(--cth-command-crimson)' },
  visual_identity: { label: 'Visual Identity', accent: 'var(--cth-command-purple)' },
  offer_suite: { label: 'Offer Suite', accent: 'var(--cth-command-cinnabar)' },
  systems_and_sops: { label: 'Systems & SOPs', accent: 'var(--cth-command-gold)' },
  content_library: { label: 'Content Library', accent: 'var(--cth-command-purple-mid)' },
  launch_readiness: { label: 'Launch Readiness', accent: 'var(--cth-command-crimson)' },
};

function MetricTile({ label, value, accent }) {
  return (
    <div
      style={{
        background: 'var(--cth-command-panel)',
        border: '1px solid var(--cth-command-border)',
        borderRadius: 14,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: accent,
            display: 'inline-block',
          }}
        />
        <p
          style={{
            ...SECTION_LABEL_STYLE,
            fontSize: 10,
            letterSpacing: '0.2em',
          }}
        >
          {label}
        </p>
      </div>
      <p
        style={{
          fontFamily: SERIF,
          fontSize: 44,
          fontWeight: 600,
          color: 'var(--cth-command-ink)',
          lineHeight: 1,
          margin: 0,
        }}
      >
        {value}
        <span
          style={{
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 400,
            color: 'var(--cth-command-muted)',
            marginLeft: 6,
          }}
        >
          /100
        </span>
      </p>
    </div>
  );
}

function ScorePanel({ score, rating, message }) {
  const sweep = Math.max(0, Math.min(360, score * 3.6));

  return (
    <div
      style={{
        ...CONTENT_CARD_STYLE,
        padding: '44px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 22,
      }}
    >
      <p style={SECTION_LABEL_STYLE}>Overall Score</p>

      <div
        style={{
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: `conic-gradient(var(--cth-command-crimson) ${sweep}deg, var(--cth-command-blush) ${sweep}deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'var(--cth-command-panel)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: SERIF,
              fontSize: 72,
              fontWeight: 600,
              color: 'var(--cth-command-ink)',
              lineHeight: 1,
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontFamily: SANS,
              fontSize: 11,
              color: 'var(--cth-command-muted)',
              marginTop: 6,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            /100
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 540 }}>
        <p
          style={{
            fontFamily: SERIF,
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--cth-command-ink)',
            margin: 0,
            lineHeight: 1.25,
          }}
        >
          {rating}
        </p>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            color: 'var(--cth-command-ink)',
            opacity: 0.78,
            lineHeight: 1.65,
            margin: '10px 0 0',
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export default function BrandAudit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentWorkspace, activeWorkspace } = useWorkspace();
  const { userId } = useAuth();

  const workspaceId =
    currentWorkspace?.id ||
    currentWorkspace?.workspace_id ||
    activeWorkspace?.id ||
    activeWorkspace?.workspace_id ||
    '';

  const auditIdFromQuery = searchParams.get('audit_id') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [error, setError] = useState('');
  const [audit, setAudit] = useState(() => normalizeAuditPayload({}));

  const loadAudit = useCallback(
    async (refresh = false, overrideAuditId = '') => {
      if (!workspaceId && !userId) {
        setError('No workspace or user found.');
        setIsLoading(false);
        return;
      }

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      try {
        const auditId = overrideAuditId || auditIdFromQuery || '';
        const query = new URLSearchParams();

        if (auditId) query.set('audit_id', auditId);
        if (workspaceId) query.set('workspace_id', workspaceId);
        if (userId) query.set('user_id', userId);

        // Prevent browser/proxy cache from returning stale audit data.
        query.set('_t', String(Date.now()));

        const data = await apiClient.get("/api/audit/latest", {
          params: Object.fromEntries(query.entries()),
        });
        const normalized = normalizeAuditPayload(data);

        if (hasAuditData(normalized)) {
          setAudit(normalized);
          setShowIntake(false);
        } else {
          setAudit(normalizeAuditPayload({}));
          setShowIntake(true);
        }
      } catch (err) {
        console.error('Failed to load Brand Audit:', err);
        setError(err?.message || 'Brand Audit could not be loaded.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [workspaceId, auditIdFromQuery, userId]
  );

  useEffect(() => {
    loadAudit(false);
  }, [loadAudit]);

  const nextMoves = useMemo(() => nextBestMovesFor(audit), [audit]);

  const handleAuditComplete = async (result) => {
    const newAuditId = result?.audit_id || result?.auditId || '';

    setShowIntake(false);

    if (newAuditId) {
      navigate(`/brand-audit?audit_id=${newAuditId}`, { replace: true });
      await loadAudit(true, newAuditId);
      return;
    }

    await loadAudit(true);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <TopBar
          title="Brand Audit"
          subtitle="Diagnose first, then move through the journey in sequence."
        />

        <div className="flex-1 overflow-auto px-4 py-7 md:px-8" style={PAGE_STYLE}>
          <div className="flex min-h-[280px] items-center justify-center">
            <div style={{ color: 'var(--cth-command-muted)', fontFamily: SANS }}>
              Loading Brand Audit...
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TopBar
        title="Brand Audit"
        subtitle="Answer the audit intake, generate your score, then use the results to choose the next move."
        action={
          showIntake ? null : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowIntake(true)}
                className="cth-button-secondary inline-flex items-center gap-2 text-xs"
              >
                <RotateCcw size={14} />
                Retake Audit
              </button>

              <button
                type="button"
                onClick={() => loadAudit(true)}
                disabled={isRefreshing}
                className="cth-button-secondary inline-flex items-center gap-2 text-xs"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>

              {audit.auditId ? (
                <AuditExportButton
                  auditId={audit.auditId || auditIdFromQuery}
                  variant="secondary"
                />
              ) : null}
            </div>
          )
        }
      />

      <div
        className="flex-1 overflow-auto px-4 py-7 md:px-8"
        style={PAGE_STYLE}
        data-testid="brand-audit-page"
      >
        {error ? (
          <div
            className="mb-5 rounded-2xl px-4 py-3 text-sm"
            style={{
              background: 'color-mix(in srgb, var(--cth-danger) 10%, var(--cth-command-panel))',
              border: '1px solid color-mix(in srgb, var(--cth-danger) 25%, var(--cth-command-border))',
              color: 'var(--cth-danger)',
              fontFamily: SANS,
            }}
          >
            {error}
          </div>
        ) : null}

        {showIntake ? (
          <div className="mx-auto max-w-4xl">
            <div style={{ ...CONTENT_CARD_STYLE, padding: 0, overflow: 'hidden' }}>
              <PreAuditIntake
                workspaceId={workspaceId}
                onComplete={handleAuditComplete}
              />
            </div>
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6">
            <ScorePanel
              score={audit.overallScore}
              rating={audit.rating}
              message={scoreMessage(audit.overallScore)}
            />

            <div style={CONTENT_CARD_STYLE}>
              <p style={SECTION_LABEL_STYLE}>AI Analysis</p>
              <h2 style={SECTION_HEADING_STYLE}>Brand Audit Results</h2>
              <div style={{ marginTop: 20 }}>
                <AuditAnalysisText
                  text={
                    audit.aiAnalysisText ||
                    'No analysis has been generated yet. Retake the audit to create a new answer-backed report.'
                  }
                />
              </div>
            </div>

            <div style={CONTENT_CARD_STYLE}>
              <p style={SECTION_LABEL_STYLE}>Audit Summary</p>
              <h2 style={SECTION_HEADING_STYLE}>Module Scores</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {Object.entries(MODULE_META).map(([key, meta]) => (
                  <MetricTile
                    key={key}
                    label={meta.label}
                    value={audit.moduleScores[key]}
                    accent={meta.accent}
                  />
                ))}
              </div>
            </div>

            <AuditNextSteps
              score={audit.overallScore}
              moduleScores={audit.moduleScores}
              onNavigate={navigate}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
