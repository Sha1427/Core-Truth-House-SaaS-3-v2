/**
 * BrandAuditResults.jsx
 * CTH OS — Brand Audit Results Components
 */

import { useState } from 'react';

const C = {
  bg: '#0D0010',
  card: 'rgba(255,255,255,0.03)',
  panel: '#1A0020',
  border: 'rgba(255,255,255,0.07)',
  accent: '#E04E35',
  purple: '#33033C',
  white: '#fff',
  t80: 'rgba(255,255,255,0.8)',
  t70: 'rgba(255,255,255,0.7)',
  t60: 'rgba(255,255,255,0.6)',
  t40: 'rgba(255,255,255,0.4)',
  t30: 'rgba(255,255,255,0.3)',
  t25: 'rgba(255,255,255,0.25)',
  t10: 'rgba(255,255,255,0.1)',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
  font: "'DM Sans', sans-serif",
};

const API = import.meta.env.VITE_BACKEND_URL || '';

function inlineMarkdown(text) {
  if (!text) return '';
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

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
    return <span key={i}>{part}</span>;
  });
}

function renderMarkdown(text) {
  if (!text) return [];

  const lines = text.split('\n');
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

export function AuditAnalysisText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const rendered = renderMarkdown(text || '');
  const hasMore = rendered.length > 8;
  const preview = hasMore ? rendered.slice(0, 8) : rendered;

  return (
    <div>
      {expanded ? rendered : preview}
      {hasMore && (
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

function getScore(ms, ...keys) {
  for (const key of keys) {
    const value = ms?.[key];
    if (typeof value === 'number') return value;
  }
  return 0;
}

function getNextSteps(score, moduleScores) {
  const ms = moduleScores || {};
  const steps = [];

  if (getScore(ms, 'foundation', 'brand_foundation') < 80) {
    steps.push({
      priority: 1,
      icon: '🏛',
      label: 'Complete Brand Foundation',
      desc: 'Your foundation score needs work. Mission, vision, values, and positioning are the base everything else builds from.',
      route: '/brand-foundation',
      cta: 'Open Brand Foundation',
      color: C.accent,
    });
  }

  if (getScore(ms, 'identity', 'visual_identity') < 80) {
    steps.push({
      priority: 2,
      icon: '🎨',
      label: 'Finish Identity Studio',
      desc: "Upload your logos, define your colors and typography. Visual identity completes your brand's first impression.",
      route: '/identity-studio',
      cta: 'Open Identity Studio',
      color: C.amber,
    });
  }

  if (getScore(ms, 'offers', 'offer_suite') < 50) {
    steps.push({
      priority: 3,
      icon: '💰',
      label: 'Build your Offer Suite',
      desc: 'No documented offers means no monetization infrastructure. Define your offer ladder in the Offer Builder.',
      route: '/offer-builder',
      cta: 'Open Offer Builder',
      color: C.green,
    });
  }

  if (getScore(ms, 'systems', 'systems_sops') < 50) {
    steps.push({
      priority: 4,
      icon: '⚙️',
      label: 'Run the Strategic OS',
      desc: 'Your systems and strategy score is low. Complete the 9-step Strategic OS to build your brand architecture.',
      route: '/strategic-os',
      cta: 'Open Strategic OS',
      color: C.blue,
    });
  }

  if (getScore(ms, 'content', 'content_library') < 50) {
    steps.push({
      priority: 5,
      icon: '✍️',
      label: 'Generate content in Content Studio',
      desc: 'No content library means no market presence. Start generating in your voice with Content Studio.',
      route: '/content-studio',
      cta: 'Open Content Studio',
      color: '#A78BFA',
    });
  }

  if (getScore(ms, 'launch_readiness') < 50) {
    steps.push({
      priority: 6,
      icon: '📣',
      label: 'Build your first Campaign',
      desc: 'Launch readiness requires an active campaign. Build one using the MAGNET Framework in Campaign Builder.',
      route: '/campaign-builder',
      cta: 'Build First Campaign',
      color: '#F97316',
    });
  }

  if (score >= 80 && steps.length === 0) {
    steps.push({
      priority: 1,
      icon: '🔄',
      label: 'Run your Strategic OS',
      desc: 'Your brand foundation is strong. Now build the execution infrastructure on top of it.',
      route: '/strategic-os',
      cta: 'Open Strategic OS',
      color: C.green,
    });
    steps.push({
      priority: 2,
      icon: '📣',
      label: 'Launch a campaign',
      desc: 'Strong brand, no active campaign. Build your first campaign now.',
      route: '/campaign-builder',
      cta: 'Build Campaign',
      color: C.accent,
    });
  }

  return steps.slice(0, 4);
}

export function AuditNextSteps({ score, moduleScores, onNavigate }) {
  const steps = getNextSteps(score || 0, moduleScores || {});
  const navigate = onNavigate || ((route) => { window.location.href = route; });

  if (steps.length === 0) return null;

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
        {steps.map((step, i) => (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{step.icon}</span>
              {i === 0 && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: C.accent,
                    background: 'rgba(224,78,53,0.1)',
                    padding: '1px 8px',
                    borderRadius: 20,
                  }}
                >
                  Top priority
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
        ))}
      </div>

      <p style={{ fontSize: 11, color: C.t25, textAlign: 'center', margin: '14px 0 0' }}>
        Fix these gaps and re-run your Brand Audit to see your score improve.
      </p>
    </div>
  );
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function AuditExportButton({ auditId, variant = 'secondary' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  function handlePrint() {
    setShowMenu(false);
    setError(null);
    const params = auditId ? `?audit_id=${encodeURIComponent(auditId)}` : '';
    window.open(`${API}/api/export/brand-audit/print-preview${params}`, '_blank');
  }

  async function pollJob(jobId) {
    let attempts = 0;

    while (attempts < 20) {
      attempts += 1;

      const res = await fetch(`${API}/api/export/brand-audit/status?job_id=${encodeURIComponent(jobId)}`);
      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.detail || 'Export status check failed');
      }

      if (data?.status === 'ready' && data?.download_url) {
        window.location.href = `${API}${data.download_url}`;
        return;
      }

      if (data?.status === 'error') {
        throw new Error(data?.error || 'Export failed');
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error('Export timed out. Try print instead.');
  }

  async function handlePDF() {
    setShowMenu(false);
    setLoading(true);
    setError(null);

    try {
      const params = auditId ? `?audit_id=${encodeURIComponent(auditId)}` : '';
      const res = await fetch(`${API}/api/export/brand-audit-styled${params}`);
      const contentType = res.headers.get('content-type') || '';

      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data?.detail || 'Export failed');
      }

      if (contentType.includes('application/json')) {
        const data = await safeJson(res);
        if (!data?.job_id) {
          throw new Error('Export job could not be started');
        }
        await pollJob(data.job_id);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CTH_Brand_Audit.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err?.message || 'Export failed';
      if (msg.toLowerCase().includes('playwright') || msg.toLowerCase().includes('chromium')) {
        setError('Styled PDF is unavailable right now. Opening print version instead...');
        setTimeout(() => {
          handlePrint();
          setError(null);
        }, 1200);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const btnStyle =
    variant === 'primary'
      ? {
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 14px',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: C.font,
          fontSize: 12,
          border: 'none',
          background: C.accent,
          color: C.white,
          fontWeight: 600,
        }
      : {
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 14px',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: C.font,
          fontSize: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.6)',
        };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setShowMenu((p) => !p)} disabled={loading} style={btnStyle}>
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
              minWidth: 180,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <button
              onClick={handlePDF}
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
                <p style={{ margin: 0, fontSize: 10, color: C.t30 }}>Fully branded document</p>
              </div>
            </button>

            <div style={{ height: 1, background: C.border }} />

            <button
              onClick={handlePrint}
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
          <p style={{ fontSize: 11, color: '#fca5a5', margin: 0, fontFamily: C.font }}>{error}</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: '@keyframes cth-spin{to{transform:rotate(360deg)}}' }} />
    </div>
  );
}
