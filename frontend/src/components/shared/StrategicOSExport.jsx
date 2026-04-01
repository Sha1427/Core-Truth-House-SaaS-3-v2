/**
 * StrategicOSExport.jsx
 * Core Truth House OS — Strategic OS Export UI
 * Clean build
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import axios from 'axios';

const API = import.meta.env.VITE_BACKEND_URL;

const C = {
  bg: '#0D0010',
  card: '#1A0020',
  panel: '#120018',
  border: 'rgba(255,255,255,0.07)',
  borderA: 'rgba(224,78,53,0.35)',
  accent: '#E04E35',
  purple: '#33033C',
  white: '#fff',
  t80: 'rgba(255,255,255,0.8)',
  t60: 'rgba(255,255,255,0.6)',
  t40: 'rgba(255,255,255,0.4)',
  t25: 'rgba(255,255,255,0.25)',
  t15: 'rgba(255,255,255,0.15)',
  t08: 'rgba(255,255,255,0.08)',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  font: "'DM Sans', sans-serif",
};

const STEPS = [
  { number: 1, key: 'brand_analysis', label: 'Brand Analysis' },
  { number: 2, key: 'audience_psychology', label: 'Audience Psychology' },
  { number: 3, key: 'differentiation', label: 'Differentiation' },
  { number: 4, key: 'competitor_analysis', label: 'Competitor Analysis' },
  { number: 5, key: 'content_pillars', label: 'Content Pillars' },
  { number: 6, key: 'platform_strategy', label: 'Platform Strategy' },
  { number: 7, key: 'monetization', label: 'Monetization Path' },
  { number: 8, key: 'content_plan', label: '30-Day Content Plan' },
  { number: 9, key: 'brand_lock', label: 'Brand Lock' },
];

const FORMATS = [
  {
    id: 'styled_pdf',
    label: 'Styled PDF',
    sublabel: 'Fully branded document',
    desc: 'A designed PDF with your brand colors, typography, and layout. Takes 15-30 seconds.',
    icon: '📄',
    recommended: true,
  },
  {
    id: 'basic_pdf',
    label: 'Basic PDF',
    sublabel: 'Clean, unstyled',
    desc: 'A clean text document with all your strategy data. Fast and reliable.',
    icon: '📋',
    recommended: false,
  },
  {
    id: 'print',
    label: 'Print / Browser PDF',
    sublabel: 'No server needed',
    desc: "Opens a print-ready page in a new tab. Use your browser's Save as PDF.",
    icon: '🖨',
    recommended: false,
  },
];

function resolveDownloadUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return `${API}${url}`;
}

function isStepComplete(completedSteps, step) {
  if (!completedSteps) return false;
  return !!(
    completedSteps[step.number] ||
    completedSteps[String(step.number)] ||
    completedSteps[step.key]
  );
}

function getCompletedCount(completedSteps) {
  return STEPS.filter((step) => isStepComplete(completedSteps, step)).length;
}

function ProgressBar({ pct = 0 }) {
  const progress = Math.min(100, Math.max(0, pct));
  return (
    <div style={{ height: 4, background: C.t08, borderRadius: 2, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: C.accent,
          borderRadius: 2,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

function StepCheckbox({ step, isSelected, isComplete, onChange }) {
  return (
    <button
      onClick={() => onChange(step.number, !isSelected)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        border: `1px solid ${isSelected ? C.borderA : C.border}`,
        background: isSelected ? 'rgba(224,78,53,0.07)' : C.t08,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: C.font,
        transition: 'all 0.12s',
        width: '100%',
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: `1px solid ${isSelected ? C.accent : C.t25}`,
          background: isSelected ? C.accent : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.12s',
        }}
      >
        {isSelected && (
          <svg width="9" height="9" fill="none" viewBox="0 0 12 12">
            <path d="M10 3L5 8.5 2 5.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: isSelected ? C.white : C.t60, margin: 0 }}>
          Step {step.number}: {step.label}
        </p>
      </div>

      {isComplete ? (
        <span
          style={{
            fontSize: 9.5,
            color: C.green,
            background: 'rgba(16,185,129,0.1)',
            padding: '1px 7px',
            borderRadius: 20,
            flexShrink: 0,
          }}
        >
          Done
        </span>
      ) : (
        <span
          style={{
            fontSize: 9.5,
            color: C.t25,
            background: C.t08,
            padding: '1px 7px',
            borderRadius: 20,
            flexShrink: 0,
          }}
        >
          In progress
        </span>
      )}
    </button>
  );
}

function FormatCard({ fmt, isSelected, onChange }) {
  return (
    <button
      onClick={() => onChange(fmt.id)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '11px 14px',
        borderRadius: 9,
        border: `1px solid ${isSelected ? C.borderA : C.border}`,
        background: isSelected ? 'rgba(224,78,53,0.07)' : C.t08,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: C.font,
        position: 'relative',
        width: '100%',
        transition: 'all 0.12s',
      }}
    >
      {fmt.recommended && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: 10,
            background: C.accent,
            color: C.white,
            fontSize: 8.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '1px 8px',
            borderRadius: 20,
          }}
        >
          Recommended
        </div>
      )}

      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `1px solid ${isSelected ? C.accent : C.t25}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent }} />}
      </div>

      <span style={{ fontSize: 18, flexShrink: 0 }}>{fmt.icon}</span>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: isSelected ? C.white : C.t60, margin: 0 }}>
            {fmt.label}
          </p>
          <span style={{ fontSize: 10, color: C.t25 }}>— {fmt.sublabel}</span>
        </div>
        <p style={{ fontSize: 10.5, color: C.t25, margin: 0, lineHeight: 1.5 }}>{fmt.desc}</p>
      </div>
    </button>
  );
}

function ExportResult({ status, progress = 0, error, downloadUrl, onReset, onTryPrint, onTryBasic }) {
  if (status === 'generating') {
    return (
      <div style={{ textAlign: 'center', padding: '28px 0' }}>
        <style>{`@keyframes cth-spin{to{transform:rotate(360deg)}}`}</style>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: `3px solid ${C.t15}`,
            borderTopColor: C.accent,
            animation: 'cth-spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ fontSize: 13, fontWeight: 600, color: C.white, margin: '0 0 5px', fontFamily: C.font }}>
          Generating your Strategic OS PDF
        </p>
        <p style={{ fontSize: 11, color: C.t25, margin: '0 0 16px', fontFamily: C.font }}>
          Building your brand strategy document...
        </p>
        <ProgressBar pct={progress} />
        <p style={{ fontSize: 10, color: C.t25, margin: '5px 0 0', fontFamily: C.font }}>{progress}%</p>
      </div>
    );
  }

  if (status === 'error') {
    const isPlaywright =
      error && (error.includes('Playwright') || error.includes('Executable') || error.includes('chromium'));

    return (
      <div
        style={{
          padding: '16px 18px',
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 10, marginBottom: isPlaywright ? 12 : 0 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#f87171', margin: '0 0 4px', fontFamily: C.font }}>
              Export failed
            </p>
            <p style={{ fontSize: 11.5, color: C.t40, margin: 0, lineHeight: 1.55, fontFamily: C.font }}>
              {isPlaywright
                ? 'The styled PDF generator needs Playwright installed.'
                : error || 'Something went wrong. Try a different format.'}
            </p>
          </div>
        </div>

        {isPlaywright && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid rgba(239,68,68,0.15)',
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              onClick={onTryPrint}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'none',
                color: C.t40,
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: C.font,
              }}
            >
              🖨 Use Print instead
            </button>
            <button
              onClick={onTryBasic}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'none',
                color: C.t40,
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: C.font,
              }}
            >
              📋 Use Basic PDF
            </button>
          </div>
        )}

        <button
          onClick={onReset}
          style={{
            marginTop: 8,
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'none',
            color: C.t25,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: C.font,
            display: 'block',
            width: '100%',
          }}
        >
          ← Back to export options
        </button>
      </div>
    );
  }

  if (status === 'ready' && downloadUrl) {
    return (
      <div
        style={{
          padding: '18px 20px',
          background: 'rgba(16,185,129,0.07)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={C.green} strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.green, margin: '0 0 1px', fontFamily: C.font }}>
              Your Strategic OS PDF is ready
            </p>
            <p style={{ fontSize: 11, color: C.t25, margin: 0, fontFamily: C.font }}>
              Download it and save to your brand documents
            </p>
          </div>
        </div>

        <a
          href={downloadUrl}
          download="CTH_Strategic_OS.pdf"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px',
            borderRadius: 9,
            border: 'none',
            background: C.accent,
            color: C.white,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: C.font,
            textDecoration: 'none',
            marginBottom: 8,
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Strategic OS PDF
        </a>

        <button
          onClick={onReset}
          style={{
            padding: '6px',
            borderRadius: 7,
            border: `1px solid ${C.border}`,
            background: 'none',
            color: C.t25,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: C.font,
            width: '100%',
          }}
        >
          Export again with different settings
        </button>
      </div>
    );
  }

  return null;
}

export default function StrategicOSExport({ onClose, completedSteps = {}, inline = false }) {
  const { currentWorkspace, activeWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || activeWorkspace?.id || '';

  const [selected, setSelected] = useState(STEPS.map((s) => s.number));
  const [format, setFormat] = useState('styled_pdf');
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dlUrl, setDlUrl] = useState(null);
  const [jobId, setJobId] = useState(null);

  const completedCount = useMemo(() => getCompletedCount(completedSteps), [completedSteps]);
  const allComplete = completedCount === STEPS.length;
  const canExport = selected.length > 0 && status !== 'generating';

  const reset = useCallback(() => {
    if (dlUrl && dlUrl.startsWith('blob:')) {
      URL.revokeObjectURL(dlUrl);
    }
    setStatus(null);
    setProgress(0);
    setError(null);
    setDlUrl(null);
    setJobId(null);
  }, [dlUrl]);

  useEffect(() => {
    return () => {
      if (dlUrl && dlUrl.startsWith('blob:')) {
        URL.revokeObjectURL(dlUrl);
      }
    };
  }, [dlUrl]);

  useEffect(() => {
    if (!jobId || status !== 'generating') return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API}/api/export/strategic-os/status?job_id=${jobId}`);
        setProgress(res.data.progress || 0);

        if (res.data.status === 'ready') {
          clearInterval(interval);
          setStatus('ready');
          setDlUrl(resolveDownloadUrl(res.data.download_url));
        } else if (res.data.status === 'error') {
          clearInterval(interval);
          setStatus('error');
          setError(res.data.error || 'Export failed');
        }
      } catch {
        clearInterval(interval);
        setStatus('error');
        setError('Connection lost. Try again.');
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId, status]);

  const handleToggleStep = (number, checked) => {
    setSelected((prev) =>
      checked ? [...prev, number].sort((a, b) => a - b) : prev.filter((n) => n !== number)
    );
  };

  const handleExport = async () => {
    if (selected.length === 0) return;

    setStatus('generating');
    setProgress(5);
    setError(null);
    if (dlUrl && dlUrl.startsWith('blob:')) {
      URL.revokeObjectURL(dlUrl);
    }
    setDlUrl(null);

    if (format === 'print') {
      const params = new URLSearchParams({
        steps: selected.join(','),
        workspace_id: workspaceId,
      });
      window.open(`${API}/api/export/strategic-os/print-preview?${params}`, '_blank');
      setStatus(null);
      return;
    }

    const endpoint =
      format === 'styled_pdf'
        ? '/api/export/strategic-os-styled'
        : '/api/export/strategic-os';

    const params = new URLSearchParams({
      steps: selected.join(','),
      workspace_id: workspaceId,
    });

    try {
      const res = await axios.get(`${API}${endpoint}?${params}`, {
        responseType: format === 'basic_pdf' ? 'blob' : 'json',
      });

      if (format === 'basic_pdf') {
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        setStatus('ready');
        setDlUrl(url);
        setProgress(100);
      } else {
        setJobId(res.data.job_id);
        setProgress(10);
      }
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.detail || 'Export failed. Try a different format.');
    }
  };

  const content = (
    <div style={{ fontFamily: C.font }}>
      {!inline && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: C.purple,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
              }}
            >
              ⚙️
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.white, margin: 0 }}>Export Strategic OS</h2>
              <p style={{ fontSize: 11, color: C.t40, margin: '2px 0 0' }}>
                {allComplete ? 'All 9 steps complete — ready to export' : `${completedCount} of 9 steps complete`}
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: C.t25,
                cursor: 'pointer',
                fontSize: 22,
                lineHeight: 1,
                padding: 4,
              }}
            >
              ×
            </button>
          )}
        </div>
      )}

      {status ? (
        <div style={{ marginBottom: 16 }}>
          <ExportResult
            status={status}
            progress={progress}
            error={error}
            downloadUrl={dlUrl}
            onReset={reset}
            onTryPrint={() => {
              reset();
              setFormat('print');
            }}
            onTryBasic={() => {
              reset();
              setFormat('basic_pdf');
            }}
          />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 18 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: C.t25,
                margin: '0 0 8px',
              }}
            >
              Export format
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FORMATS.map((fmt) => (
                <FormatCard key={fmt.id} fmt={fmt} isSelected={format === fmt.id} onChange={setFormat} />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: C.t25,
                  margin: 0,
                }}
              >
                Steps to include ({selected.length}/9)
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSelected(STEPS.map((s) => s.number))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10.5, color: C.t40, fontFamily: C.font, padding: 0 }}
                >
                  All
                </button>
                <span style={{ fontSize: 10, color: C.t15 }}>·</span>
                <button
                  onClick={() =>
                    setSelected(
                      STEPS.filter((step) => isStepComplete(completedSteps, step)).map((step) => step.number)
                    )
                  }
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10.5, color: C.t40, fontFamily: C.font, padding: 0 }}
                >
                  Completed only
                </button>
                <span style={{ fontSize: 10, color: C.t15 }}>·</span>
                <button
                  onClick={() => setSelected([])}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10.5, color: C.t40, fontFamily: C.font, padding: 0 }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {STEPS.map((step) => (
                <StepCheckbox
                  key={step.number}
                  step={step}
                  isSelected={selected.includes(step.number)}
                  isComplete={isStepComplete(completedSteps, step)}
                  onChange={handleToggleStep}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={!canExport}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 10,
              border: 'none',
              background: canExport ? C.accent : C.t08,
              color: canExport ? C.white : C.t25,
              fontSize: 13,
              fontWeight: 600,
              cursor: canExport ? 'pointer' : 'not-allowed',
              fontFamily: C.font,
              boxShadow: canExport ? '0 4px 16px rgba(224,78,53,0.3)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {format === 'print' ? '🖨 Open Print Preview' : '📄 Generate Strategic OS PDF'}
          </button>

          {selected.length === 0 && (
            <p style={{ fontSize: 11, color: C.t25, textAlign: 'center', margin: '8px 0 0', fontFamily: C.font }}>
              Select at least one step to export
            </p>
          )}
        </>
      )}
    </div>
  );

  if (inline) return content;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 24,
      }}
    >
      <div
        style={{
          background: C.card,
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 16,
          padding: '28px 32px',
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {content}
      </div>
    </div>
  );
}

export function StrategicOSExportButton({ completedSteps = {}, variant = 'secondary' }) {
  const [open, setOpen] = useState(false);
  const completedCount = getCompletedCount(completedSteps);

  const btnStyle =
    variant === 'primary'
      ? {
          padding: '8px 18px',
          borderRadius: 8,
          border: 'none',
          background: '#E04E35',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }
      : {
          padding: '7px 14px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.55)',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        };

  return (
    <>
      <button onClick={() => setOpen(true)} style={btnStyle} data-testid="strategic-os-export-btn">
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export PDF
        {completedCount > 0 && (
          <span
            style={{
              fontSize: 9.5,
              background: 'rgba(224,78,53,0.2)',
              color: '#E04E35',
              padding: '1px 6px',
              borderRadius: 20,
            }}
          >
            {completedCount}/9
          </span>
        )}
      </button>

      {open && <StrategicOSExport completedSteps={completedSteps} onClose={() => setOpen(false)} />}
    </>
  );
}
