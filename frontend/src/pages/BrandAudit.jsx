import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import apiClient from '../lib/apiClient';
import {
  AuditAnalysisText,
  AuditNextSteps,
  AuditExportButton,
} from '../components/brand/BrandAuditResults_patch';

const CARD_BG = 'rgba(255,255,255,0.03)';
const CARD_BORDER = 'rgba(255,255,255,0.07)';
const TEXT_80 = 'rgba(255,255,255,0.8)';
const TEXT_60 = 'rgba(255,255,255,0.6)';
const TEXT_40 = 'rgba(255,255,255,0.4)';
const ACCENT = '#E04E35';

const MODULE_LABELS = {
  brand_foundation: 'Brand Foundation',
  brand_memory: 'Brand Memory',
  visual_identity: 'Visual Identity',
  offer_suite: 'Offer Suite',
  offer_builder: 'Offer Builder',
  systems: 'Systems',
  content_library: 'Content Library',
  launch_readiness: 'Launch Readiness',
  first_campaign: 'First Campaign',
  strategic_os: 'Strategic OS',
};

const AUDIT_ENDPOINTS = [
  '/brand-audit/latest',
  '/brand-audit',
  '/audit/brand/latest',
  '/audit/brand',
];

function clampScore(value) {
  const n = Number(value || 0);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeModuleScores(raw) {
  const input = raw || {};
  return {
    brand_memory: clampScore(
      input.brand_memory ??
        input.brandMemory ??
        input.memory ??
        input.brand_memory_score
    ),
    brand_foundation: clampScore(
      input.brand_foundation ??
        input.foundation ??
        input.brandFoundation ??
        input.brand_foundation_score
    ),
    strategic_os: clampScore(
      input.strategic_os ??
        input.strategicOS ??
        input.systems ??
        input.strategy_systems ??
        input.systems_score
    ),
    offer_builder: clampScore(
      input.offer_builder ??
        input.offerBuilder ??
        input.offer_suite ??
        input.offers ??
        input.offerSuite ??
        input.offer_suite_score
    ),
    first_campaign: clampScore(
      input.first_campaign ??
        input.firstCampaign ??
        input.launch_readiness ??
        input.launch ??
        input.launchReadiness ??
        input.launch_readiness_score
    ),
    visual_identity: clampScore(
      input.visual_identity ??
        input.identity ??
        input.visualIdentity ??
        input.visual_identity_score
    ),
  };
}

function normalizeAuditPayload(payload) {
  const data = payload || {};

  const moduleScores = normalizeModuleScores(
    data.moduleScores ||
      data.module_scores ||
      data.scores ||
      data.breakdown ||
      {}
  );

  const values = Object.values(moduleScores);
  const computedOverall =
    values.length > 0
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : 0;

  return {
    auditId: data.auditId || data.audit_id || data.id || '',
    overallScore: clampScore(
      data.overallScore ||
        data.overall_score ||
        data.score ||
        computedOverall
    ),
    moduleScores,
    aiAnalysisText:
      data.aiAnalysisText ||
      data.ai_analysis_text ||
      data.analysis ||
      data.summary ||
      '',
    strengths: data.strengths || [],
    risks: data.risks || data.gaps || [],
    recommendations: data.recommendations || [],
    raw: data,
  };
}

function scoreTone(score) {
  if (score >= 80) return { label: 'Strong', color: '#10B981' };
  if (score >= 60) return { label: 'Growing', color: '#F59E0B' };
  return { label: 'Needs Work', color: '#EF4444' };
}

function ScoreCard({ label, score }) {
  const tone = scoreTone(score);

  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 14,
        padding: '14px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: TEXT_40,
              fontWeight: 700,
            }}
          >
            {label}
          </p>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 26,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1,
            }}
          >
            {score}
            <span style={{ fontSize: 12, color: TEXT_40, marginLeft: 4 }}>/100</span>
          </p>
        </div>

        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: tone.color,
            background: `${tone.color}1A`,
            border: `1px solid ${tone.color}33`,
            padding: '4px 8px',
            borderRadius: 999,
            whiteSpace: 'nowrap',
          }}
        >
          {tone.label}
        </span>
      </div>
    </div>
  );
}

function SmallListCard({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 14,
        padding: '16px',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: TEXT_40,
          fontWeight: 700,
        }}
      >
        {title}
      </p>

      <ul style={{ margin: '12px 0 0', paddingLeft: 18 }}>
        {items.slice(0, 5).map((item, idx) => (
          <li
            key={`${title}-${idx}`}
            style={{
              color: TEXT_60,
              fontSize: 13,
              lineHeight: 1.7,
              marginBottom: 6,
            }}
          >
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function JourneyCard({ navigate }) {
  const items = [
    { label: '1. Brand Audit', path: '/brand-audit' },
    { label: '2. Brand Memory', path: '/brand-memory' },
    { label: '3. Brand Foundation', path: '/brand-foundation' },
    { label: '4. Strategic OS', path: '/strategic-os' },
    { label: '5. Offer Builder', path: '/offer-builder' },
    { label: '6. First Campaign', path: '/first-campaign' },
  ];

  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: TEXT_40,
        }}
      >
        6-step journey
      </p>

      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full text-left px-4 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.03]"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BrandAudit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentWorkspace } = useWorkspace();

  const workspaceId =
    currentWorkspace?.id ||
    currentWorkspace?.workspace_id ||
    '';

  const auditIdFromQuery = searchParams.get('audit_id') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [audit, setAudit] = useState(() =>
    normalizeAuditPayload({})
  );

  const loadAudit = useCallback(
    async (refresh = false) => {
      if (!workspaceId) {
        setError('No workspace selected.');
        setIsLoading(false);
        return;
      }

      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      const params = auditIdFromQuery ? { audit_id: auditIdFromQuery } : {};

      let lastError = null;

      try {
        for (const endpoint of AUDIT_ENDPOINTS) {
          try {
            const data = await apiClient.get(endpoint, { params });
            const normalized = normalizeAuditPayload(data);

            if (
              normalized.auditId ||
              normalized.aiAnalysisText ||
              Object.values(normalized.moduleScores).some((v) => v > 0)
            ) {
              setAudit(normalized);
              setError('');
              return;
            }
          } catch (err) {
            lastError = err;
          }
        }

        throw lastError || new Error('Brand Audit could not be loaded.');
      } catch (err) {
        console.error('Failed to load Brand Audit:', err);
        setError(err?.message || 'Brand Audit could not be loaded.');
        setAudit(normalizeAuditPayload({}));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [workspaceId, auditIdFromQuery]
  );

  useEffect(() => {
    loadAudit(false);
  }, [loadAudit]);

  const orderedModuleCards = useMemo(() => {
    const order = [
      'brand_memory',
      'brand_foundation',
      'strategic_os',
      'offer_builder',
      'first_campaign',
      'visual_identity',
    ];

    return order.map((key) => ({
      key,
      label: MODULE_LABELS[key] || key,
      score: clampScore(audit.moduleScores[key]),
    }));
  }, [audit.moduleScores]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-screen bg-[#1c0828]">
          <div className="text-white/40">Loading Brand Audit...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className="flex flex-col min-h-screen bg-[#1c0828]"
        data-testid="brand-audit-page"
      >
        <div className="flex items-center justify-between pl-14 pr-4 py-3 md:px-8 md:py-4 border-b border-white/[0.07] sticky top-0 z-10 bg-[#1c0828]/95 backdrop-blur-sm">
          <div>
            <h1
              className="text-xl font-semibold text-white"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Brand Audit
            </h1>
            <p className="text-xs text-white/40 mt-0.5">
              Diagnose first, then move through the 6-step journey in sequence
            </p>
            {workspaceId ? (
              <p className="text-[10px] text-white/25 mt-1">Workspace: {workspaceId}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05]">
              <div className="w-7 h-7 rounded-full border-2 border-[#E04E35] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                  {audit.overallScore}%
                </span>
              </div>
              <span className="text-[10px] text-white/50">Overall</span>
            </div>

            <button
              onClick={() => loadAudit(true)}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <AuditExportButton
              auditId={audit.auditId || auditIdFromQuery}
              variant="secondary"
            />
          </div>
        </div>

        {error ? (
          <div className="mx-4 md:mx-8 mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div
                style={{
                  background: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      height: 16,
                      background: ACCENT,
                      borderRadius: 2,
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      color: TEXT_40,
                    }}
                  >
                    AI analysis
                  </p>
                </div>

                <AuditAnalysisText text={audit.aiAnalysisText} />
              </div>

              <div
                style={{
                  background: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      height: 16,
                      background: ACCENT,
                      borderRadius: 2,
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      color: TEXT_40,
                    }}
                  >
                    Module scores
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {orderedModuleCards.map((item) => (
                    <ScoreCard
                      key={item.key}
                      label={item.label}
                      score={item.score}
                    />
                  ))}
                </div>

                <div style={{ marginTop: 20 }}>
                  <AuditNextSteps
                    score={audit.overallScore}
                    moduleScores={audit.moduleScores}
                    onNavigate={navigate}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div
                style={{
                  background: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    color: TEXT_40,
                  }}
                >
                  Audit summary
                </p>

                <div style={{ marginTop: 14 }}>
                  <p style={{ margin: 0, fontSize: 34, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                    {audit.overallScore}
                    <span style={{ fontSize: 14, color: TEXT_40, marginLeft: 4 }}>/100</span>
                  </p>
                  <p style={{ margin: '10px 0 0', color: TEXT_60, fontSize: 13, lineHeight: 1.7 }}>
                    {audit.overallScore >= 80 &&
                      'You have a strong diagnostic baseline. Next, build Brand Memory, lock Brand Foundation, then move through Strategic OS, Offer Builder, and First Campaign in order.'}
                    {audit.overallScore >= 60 && audit.overallScore < 80 &&
                      'You have momentum, but the next move is still sequence, not speed: Brand Memory first, then Brand Foundation, Strategic OS, Offer Builder, and only then First Campaign.'}
                    {audit.overallScore < 60 &&
                      'This audit is your diagnosis, not your launch signal. Build Brand Memory next, then Brand Foundation, then Strategic OS before you try to push offers or campaigns.'}
                  </p>
                </div>
              </div>

              <SmallListCard title="Strengths" items={audit.strengths} />
              <SmallListCard title="Risks / gaps" items={audit.risks} />
              <SmallListCard title="Recommendations" items={audit.recommendations} />

              <JourneyCard navigate={navigate} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
