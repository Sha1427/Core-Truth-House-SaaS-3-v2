import React, { useMemo, useState } from 'react';
import { buildUrl, normalizeBaseUrl } from '../../lib/apiClient';

const C = {
  bg: '#0D0010',
  card: 'rgba(255,255,255,0.03)',
  panel: '#1A0020',
  border: 'rgba(255,255,255,0.07)',
  accent: '#E04E35',
  white: '#FFFFFF',
  t80: 'rgba(255,255,255,0.8)',
  t70: 'rgba(255,255,255,0.7)',
  t60: 'rgba(255,255,255,0.6)',
  t40: 'rgba(255,255,255,0.4)',
  t30: 'rgba(255,255,255,0.3)',
  t25: 'rgba(255,255,255,0.25)',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  font: "'DM Sans', sans-serif",
};

function resolveApiBase() {
  const candidates = [
    typeof import.meta !== 'undefined' ? import.meta?.env?.VITE_API_BASE_URL : undefined,
    typeof process !== 'undefined' ? process?.env?.REACT_APP_API_BASE_URL : undefined,
    typeof window !== 'undefined' ? window.__API_BASE_URL__ : undefined,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate);
    if (normalized) return normalized;
  }

  return '';
}

function inlineMarkdown(text) {
  if (!text) return '';
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ color: C.white, fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} style={{ color: C.t80 }}>
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
}

function renderMarkdown(text) {
  if (!text) return [];
  const lines = String(text).split('\n');
  const output = [];
  let listBuf = [];
  let key = 0;

  function flushList() {
    if (listBuf.length === 0) return;

    output.push(
      <ul key={`ul-${key++}`} style={{ margin: '8px 0 12px 0', paddingLeft: 20 }}>
        {listBuf.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: 13,
              color: C.t70,
              lineHeight: 1.7,
              marginBottom: 4,
              fontFamily: C.font,
            }}
          >
            {inlineMarkdown(item)}
          </li>
        ))}
      </ul>
    );

    listBuf = [];
  }

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      output.push(<div key={`br-${key++}`} style={{ height: 6 }} />);
      return;
    }

    if (/^#{1,2}\s/.test(trimmed)) {
      flushList();
      const headText = trimmed.replace(/^#{1,2}\s/, '');
      output.push(
        <p
          key={`h-${key++}`}
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: C.white,
            margin: '16px 0 6px',
            fontFamily: C.font,
            borderLeft: `3px solid ${C.accent}`,
            paddingLeft: 10,
          }}
        >
          {headText}
        </p>
      );
      return;
    }

    if (/^###\s/.test(trimmed)) {
      flushList();
      const h3Text = trimmed.replace(/^###\s/, '');
      output.push(
        <p
          key={`h3-${key++}`}
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: C.t80,
            margin: '12px 0 4px',
            fontFamily: C.font,
          }}
        >
          {h3Text}
        </p>
      );
      return;
    }

    if (/^[-*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '');
      listBuf.push(itemText);
      return;
    }

    if (/^---+$/.test(trimmed)) {
      flushList();
      output.push(
        <div
          key={`hr-${key++}`}
          style={{ height: 1, background: C.border, margin: '12px 0' }}
        />
      );
      return;
    }

    flushList();
    output.push(
      <p
        key={`p-${key++}`}
        style={{
          fontSize: 13,
          color: C.t60,
          lineHeight: 1.75,
          margin: '0 0 8px',
          fontFamily: C.font,
        }}
      >
        {inlineMarkdown(trimmed)}
      </p>
    );
  });

  flushList();
  return output;
}

export function AuditAnalysisText({ text = '' }) {
  const [expanded, setExpanded] = useState(false);
  const rendered = useMemo(() => renderMarkdown(text), [text]);
  const preview = rendered.slice(0, 8);

  return (
    <div>
      {expanded ? rendered : preview}
      {rendered.length > 8 && (
        <button
          onClick={() => setExpanded((p) => !p)}
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: C.accent,
            fontSize: 12,
            fontFamily: C.font,
            padding: 0,
          }}
        >
          {expanded ? 'Show less ↑' : 'Read full analysis ↓'}
        </button>
      )}
    </div>
  );
}

function routeReadiness(moduleScores = {}) {
  const score = (value) => Number(value || 0);

  return {
    brandMemory: score(moduleScores.brand_memory ?? moduleScores.brandMemory),
    brandFoundation: score(moduleScores.brand_foundation ?? moduleScores.brandFoundation),
    strategicOS: score(moduleScores.strategic_os ?? moduleScores.strategicOS ?? moduleScores.systems),
    offerBuilder: score(moduleScores.offer_builder ?? moduleScores.offerBuilder ?? moduleScores.offer_suite),
    firstCampaign: score(moduleScores.first_campaign ?? moduleScores.firstCampaign ?? moduleScores.launch_readiness),
  };
}

function getNextSteps(score, moduleScores) {
  const s = routeReadiness(moduleScores);
  const steps = [];

  steps.push({
    order: 1,
    icon: '🩺',
    label: 'Brand Audit',
    desc: 'You diagnose first. This audit gives you the truth before you build anything else.',
    route: '/brand-audit',
    cta: 'Review Brand Audit',
    color: C.accent,
    status: 'complete',
  });

  if (s.brandMemory < 80) {
    steps.push({
      order: 2,
      icon: '🧠',
      label: 'Build Brand Memory',
      desc: 'Create the AI knowledge base first so every future output pulls from the same source of truth.',
      route: '/brand-memory',
      cta: 'Open Brand Memory',
      color: C.purple,
      status: 'next',
    });
  }

  if (s.brandFoundation < 80) {
    steps.push({
      order: 3,
      icon: '🏛',
      label: 'Lock Brand Foundation',
      desc: 'Define mission, positioning, messaging, and architecture before you try to scale execution.',
      route: '/brand-foundation',
      cta: 'Open Brand Foundation',
      color: C.accent,
      status: s.brandMemory < 80 ? 'queued' : 'next',
    });
  }

  if (s.strategicOS < 80) {
    steps.push({
      order: 4,
      icon: '⚙️',
      label: 'Run Strategic OS',
      desc: 'Work through the 9-step brand strategy sequence so your decisions are system-driven, not scattered.',
      route: '/strategic-os',
      cta: 'Open Strategic OS',
      color: C.blue,
      status: s.brandMemory < 80 || s.brandFoundation < 80 ? 'queued' : 'next',
    });
  }

  if (s.offerBuilder < 80) {
    steps.push({
      order: 5,
      icon: '💰',
      label: 'Document Offer Builder',
      desc: 'Build the offer ladder before you campaign so activation has something real to sell.',
      route: '/offer-builder',
      cta: 'Open Offer Builder',
      color: C.green,
      status:
        s.brandMemory < 80 || s.brandFoundation < 80 || s.strategicOS < 80
          ? 'queued'
          : 'next',
    });
  }

  if (s.firstCampaign < 80) {
    steps.push({
      order: 6,
      icon: '📣',
      label: 'Launch First Campaign',
      desc: 'Activate only after the offer exists and the strategy underneath it is solid.',
      route: '/first-campaign',
      cta: 'Open First Campaign',
      color: C.amber,
      status:
        s.brandMemory < 80 ||
        s.brandFoundation < 80 ||
        s.strategicOS < 80 ||
        s.offerBuilder < 80
          ? 'queued'
          : 'next',
    });
  }

  if (score >= 80 && steps.length === 1) {
    steps.push(
      {
        order: 2,
        icon: '🧠',
        label: 'Brand Memory',
        desc: 'Your next leverage point is strengthening the AI knowledge base that powers everything downstream.',
        route: '/brand-memory',
        cta: 'Open Brand Memory',
        color: C.purple,
        status: 'next',
      },
      {
        order: 3,
        icon: '🏛',
        label: 'Brand Foundation',
        desc: 'Lock the strategic architecture so the rest of the system compounds instead of drifting.',
        route: '/brand-foundation',
        cta: 'Open Brand Foundation',
        color: C.accent,
        status: 'queued',
      },
      {
        order: 4,
        icon: '⚙️',
        label: 'Strategic OS',
        desc: 'Run the full 9-step sequence after Foundation is locked.',
        route: '/strategic-os',
        cta: 'Open Strategic OS',
        color: C.blue,
        status: 'queued',
      }
    );
  }

  return steps.slice(0, 4);
}

function statusPill(step) {
  if (step.status === 'complete') {
    return {
      label: 'Done',
      color: C.green,
      bg: 'rgba(16,185,129,0.12)',
      border: 'rgba(16,185,129,0.24)',
    };
  }

  if (step.status === 'next') {
    return {
      label: 'Next',
      color: C.accent,
      bg: 'rgba(224,78,53,0.12)',
      border: 'rgba(224,78,53,0.24)',
    };
  }

  return {
    label: 'Queued',
    color: C.t40,
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.08)',
  };
}

export function AuditNextSteps({ score = 0, moduleScores = {}, onNavigate }) {
  const navigate = onNavigate || ((route) => (window.location.href = route));
  const steps = useMemo(() => getNextSteps(score, moduleScores), [score, moduleScores]);

  if (!steps.length) return null;

  return (
    <div style={{ marginTop: 24, fontFamily: C.font }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 3, height: 16, background: C.accent, borderRadius: 2 }} />
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: C.t40,
            margin: 0,
          }}
        >
          What to work on next
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {steps.map((step, i) => {
          const pill = statusPill(step);

          return (
            <div
              key={step.route}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{step.icon}</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: pill.color,
                      background: pill.bg,
                      border: `1px solid ${pill.border}`,
                      padding: '2px 8px',
                      borderRadius: 20,
                    }}
                  >
                    {pill.label}
                  </span>
                </div>

                {i === 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: C.t25,
                    }}
                  >
                    Journey
                  </span>
                )}
              </div>

              <div>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: C.white, margin: '0 0 4px' }}>
                  {step.label}
                </p>
                <p style={{ fontSize: 11, color: C.t40, margin: 0, lineHeight: 1.55 }}>
                  {step.desc}
                </p>
              </div>

              <button
                onClick={() => navigate(step.route)}
                style={{
                  marginTop: 'auto',
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: C.t70,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  fontFamily: C.font,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{step.cta}</span>
                <span style={{ color: step.color }}>→</span>
              </button>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, color: C.t25, textAlign: 'center', margin: '14px 0 0' }}>
        Fix the next stage, then re-run Brand Audit to measure what actually improved.
      </p>
    </div>
  );
}

export function AuditExportButton({ auditId = '', variant = 'secondary' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const apiBase = resolveApiBase();

  const buildExportUrl = (path) => {
    const url = buildUrl(apiBase, path);
    if (!auditId) return url;
    const joiner = url.includes('?') ? '&' : '?';
    return `${url}${joiner}audit_id=${encodeURIComponent(auditId)}`;
  };

  const openPrintPreview = () => {
    setShowMenu(false);
    window.open(buildExportUrl('/api/export/brand-audit/print-preview'), '_blank', 'noopener,noreferrer');
  };

  const tryStyledPdf = async () => {
    setShowMenu(false);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(buildExportUrl('/api/export/brand-audit-styled'), {
        credentials: 'include',
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let detail = 'Export failed';
        try {
          const data = await response.json();
          detail = data?.detail || detail;
        } catch {
          // ignore
        }
        throw new Error(detail);
      }

      if (contentType.includes('application/pdf')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'CTH_Brand_Audit.pdf';
        a.click();
        URL.revokeObjectURL(url);
        setLoading(false);
        return;
      }

      if (contentType.includes('application/json')) {
        const data = await response.json();

        if (data?.download_url) {
          window.location.href = data.download_url;
          setLoading(false);
          return;
        }

        if (data?.job_id) {
          const startedAt = Date.now();

          const poll = async () => {
            const statusRes = await fetch(
              buildExportUrl(`/api/export/brand-audit/status?job_id=${encodeURIComponent(data.job_id)}`),
              { credentials: 'include' }
            );

            const statusData = await statusRes.json();

            if (statusData?.status === 'ready' && statusData?.download_url) {
              window.location.href = statusData.download_url;
              setLoading(false);
              return;
            }

            if (statusData?.status === 'error') {
              throw new Error(statusData?.error || 'Export failed');
            }

            if (Date.now() - startedAt > 30000) {
              throw new Error('Export timed out. Try print preview instead.');
            }

            window.setTimeout(poll, 1500);
          };

          window.setTimeout(poll, 1500);
          return;
        }
      }

      openPrintPreview();
      setLoading(false);
    } catch (err) {
      console.error('Brand Audit export failed:', err);
      const msg = err?.message || 'Export failed';
      setLoading(false);

      if (
        msg.toLowerCase().includes('playwright') ||
        msg.toLowerCase().includes('chromium') ||
        msg.toLowerCase().includes('timed out')
      ) {
        setError('Styled PDF is not ready on the server. Opening print preview instead.');
        window.setTimeout(() => {
          openPrintPreview();
          setError('');
        }, 1200);
        return;
      }

      setError(msg);
    }
  };

  const btnBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '7px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: C.font,
    fontSize: 12,
    transition: 'all 0.12s',
    position: 'relative',
  };

  const btnStyle =
    variant === 'primary'
      ? {
          ...btnBase,
          border: 'none',
          background: C.accent,
          color: C.white,
          fontWeight: 600,
        }
      : {
          ...btnBase,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.6)',
        };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowMenu((p) => !p)}
        disabled={loading}
        style={btnStyle}
      >
        {loading ? (
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.3)',
              borderTopColor: C.white,
              animation: 'cth-spin 0.8s linear infinite',
            }}
          />
        ) : (
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        {loading ? 'Generating...' : 'Export PDF'}
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 2 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              zIndex: 10,
              background: C.panel,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              overflow: 'hidden',
              minWidth: 190,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <button
              onClick={tryStyledPdf}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: C.font,
                fontSize: 12,
                color: C.t70,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 15 }}>📄</span>
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>Styled PDF</p>
                <p style={{ margin: 0, fontSize: 10, color: C.t30 }}>Branded export</p>
              </div>
            </button>

            <div style={{ height: 1, background: C.border }} />

            <button
              onClick={openPrintPreview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: C.font,
                fontSize: 12,
                color: C.t70,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 15 }}>🖨</span>
              <div>
                <p style={{ margin: 0, fontWeight: 500 }}>Print / Save PDF</p>
                <p style={{ margin: 0, fontSize: 10, color: C.t30 }}>Browser print dialog</p>
              </div>
            </button>
          </div>
        </>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            width: 260,
            padding: '8px 12px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
          }}
        >
          <p style={{ fontSize: 11, color: '#fca5a5', margin: 0, fontFamily: C.font }}>
            {error}
          </p>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: '@keyframes cth-spin{to{transform:rotate(360deg)}}',
        }}
      />
    </div>
  );
}
