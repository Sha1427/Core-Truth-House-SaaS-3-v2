import React, { useMemo, useState } from 'react';
import { buildUrl, normalizeBaseUrl } from '../../lib/apiClient';
import { AuditExportButton } from './AuditExportButton';

const C = {
  bg: 'var(--cth-command-blush)',
  card: 'var(--cth-command-panel)',
  panel: 'var(--cth-command-panel-soft)',
  border: 'var(--cth-command-border)',
  accent: 'var(--cth-command-crimson)',
  ink: 'var(--cth-command-ink)',
  inkSoft: 'var(--cth-command-ink)',
  muted: 'var(--cth-command-muted)',
  green: 'var(--cth-success)',
  amber: 'var(--cth-warning)',
  red: 'var(--cth-danger)',
  blue: 'var(--cth-info)',
  purple: 'var(--cth-command-purple)',
  font: "'DM Sans', sans-serif",
  serif: "'Playfair Display', serif",
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
        <strong key={i} style={{ color: C.ink, fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} style={{ color: C.inkSoft }}>
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
      <ul key={`ul-${key++}`} style={{ margin: '8px 0 14px 0', paddingLeft: 20 }}>
        {listBuf.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: 14,
              color: C.ink,
              lineHeight: 1.7,
              marginBottom: 6,
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
      const headId = `audit-heading-${slugify(headText)}`;
      output.push(
        <p
          key={`h-${key++}`}
          id={headId}
          style={{
            fontFamily: C.font,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: C.muted,
            margin: '22px 0 10px',
            scrollMarginTop: 16,
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
            fontFamily: C.serif,
            fontSize: 17,
            fontWeight: 600,
            color: C.ink,
            margin: '14px 0 6px',
            letterSpacing: '-0.005em',
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
          fontSize: 14,
          color: C.ink,
          lineHeight: 1.75,
          margin: '0 0 10px',
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

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractHeadings(text) {
  if (!text) return [];
  return String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^#{1,2}\s+/.test(line))
    .map((line) => {
      const headText = line.replace(/^#{1,2}\s+/, '');
      return { text: headText, id: `audit-heading-${slugify(headText)}` };
    });
}

export function AuditAnalysisText({ text = '' }) {
  const [expanded, setExpanded] = useState(false);
  const [activePill, setActivePill] = useState(null);
  const rendered = useMemo(() => renderMarkdown(text), [text]);
  const headings = useMemo(() => extractHeadings(text), [text]);
  const preview = rendered.slice(0, 8);

  const handlePillClick = (id) => {
    setActivePill(id);
    setExpanded(true);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  };

  return (
    <div>
      {headings.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 18,
          }}
        >
          {headings.map((h) => {
            const isActive = activePill === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => handlePillClick(h.id)}
                style={{
                  background: isActive ? 'var(--cth-command-purple)' : 'transparent',
                  color: isActive ? 'var(--cth-command-gold)' : C.muted,
                  border: `1px solid ${isActive ? 'var(--cth-command-purple)' : 'var(--cth-command-border)'}`,
                  borderRadius: 4,
                  padding: '6px 12px',
                  fontFamily: C.font,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
                }}
              >
                {h.text}
              </button>
            );
          })}
        </div>
      )}

      {expanded ? rendered : preview}
      {rendered.length > 8 && (
        <button
          onClick={() => setExpanded((p) => !p)}
          style={{
            marginTop: 14,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: C.accent,
            fontSize: 13,
            fontFamily: C.font,
            fontWeight: 600,
            letterSpacing: '0.04em',
            padding: 0,
          }}
        >
          {expanded ? 'Show less ↑' : 'Read full analysis ↓'}
        </button>
      )}
    </div>
  );
}

function normalizeScores(moduleScores = {}) {
  const score = (value) => Number(value || 0);

  return {
    brandFoundation: score(moduleScores.brand_foundation ?? moduleScores.brandFoundation),
    visualIdentity: score(moduleScores.visual_identity ?? moduleScores.visualIdentity),
    offerSuite: score(moduleScores.offer_suite ?? moduleScores.offerSuite),
    systemsAndSops: score(moduleScores.systems_and_sops ?? moduleScores.systemsAndSops ?? moduleScores.systems),
    contentLibrary: score(moduleScores.content_library ?? moduleScores.contentLibrary),
    launchReadiness: score(moduleScores.launch_readiness ?? moduleScores.launchReadiness),
  };
}

function buildJourney(score, moduleScores) {
  return [
    {
      order: 1,
      label: 'Brand Foundation',
      desc: 'Turn this audit into your mission, message, positioning, story, and core brand direction.',
      route: '/brand-foundation',
      cta: 'Open Brand Foundation',
      status: 'next',
      icon: '🏛️',
    },
  ];
}

const PATH_LABELS = {
  '/brand-foundation': 'Open Brand Foundation',
  '/strategic-os': 'Open Strategic OS',
  '/content-studio': 'Open Content Studio',
  '/identity-studio': 'Open Identity Studio',
  '/brand-intelligence': 'Open Brand Intelligence',
};

function pathToLabel(path) {
  return PATH_LABELS[path] || 'Open';
}

const PILL_BUTTON_STYLE = {
  background: 'var(--cth-command-purple)',
  color: 'var(--cth-command-gold)',
  border: 'none',
  borderRadius: 999,
  padding: '10px 18px',
  fontFamily: C.font,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
};

export function AuditNextSteps({ moves = [], score = 0, moduleScores = {}, onNavigate }) {
  const isDefaultOnly =
    moves.length === 1 && moves[0]?.title === 'Move into Strategic OS';
  const hasRecommendations = moves.length > 0 && !isDefaultOnly;

  if (!hasRecommendations) {
    return (
      <div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        style={{
          background: 'var(--cth-command-panel)',
          border: '1px solid var(--cth-command-border)',
          borderRadius: 4,
          padding: 24,
        }}
      >
        <div>
          <p
            style={{
              fontFamily: C.font,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: C.muted,
              margin: 0,
            }}
          >
            Next Step
          </p>
          <p
            style={{
              fontFamily: C.font,
              fontSize: 14,
              color: C.ink,
              lineHeight: 1.65,
              margin: '8px 0 0',
              maxWidth: 620,
            }}
          >
            Move into Brand Foundation and turn the audit findings into your mission, message, positioning, voice, values, and story.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate?.('/brand-foundation')}
          className="inline-flex shrink-0 items-center gap-2"
          style={PILL_BUTTON_STYLE}
        >
          Open Brand Foundation
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--cth-command-panel)',
        border: '1px solid var(--cth-command-border)',
        borderRadius: 4,
        padding: 24,
      }}
    >
      <p
        style={{
          fontFamily: C.font,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: C.muted,
          margin: 0,
        }}
      >
        Recommended Next Steps
      </p>
      <p
        style={{
          fontFamily: C.font,
          fontSize: 13,
          color: C.muted,
          lineHeight: 1.55,
          margin: '6px 0 18px',
          maxWidth: 620,
        }}
      >
        Based on your audit, here are up to three priority moves.
      </p>

      <div className="grid gap-3">
        {moves.slice(0, 3).map((move, index) => (
          <div
            key={move.path + index}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            style={{
              background: 'var(--cth-command-panel)',
              border: '1px solid var(--cth-command-border)',
              borderRadius: 4,
              padding: 16,
            }}
          >
            <div className="flex items-start gap-3">
              <span
                style={{
                  flexShrink: 0,
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  background: 'var(--cth-command-crimson)',
                  color: 'var(--cth-command-ivory)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: C.font,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </span>
              <div>
                <p
                  style={{
                    fontFamily: C.serif || "'Playfair Display', serif",
                    fontSize: 15,
                    fontWeight: 600,
                    color: C.ink,
                    margin: 0,
                    letterSpacing: '-0.005em',
                  }}
                >
                  {move.title}
                </p>
                <p
                  style={{
                    fontFamily: C.font,
                    fontSize: 13,
                    color: C.ink,
                    lineHeight: 1.6,
                    margin: '6px 0 0',
                    maxWidth: 540,
                  }}
                >
                  {move.text}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.(move.path)}
              className="shrink-0"
              style={PILL_BUTTON_STYLE}
            >
              {pathToLabel(move.path)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
