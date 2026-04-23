import React, { useMemo, useState } from 'react';
import { buildUrl, normalizeBaseUrl } from '../../lib/apiClient';
import { AuditExportButton } from './AuditExportButton';

const C = {
  bg: 'var(--cth-admin-bg)',
  card: 'var(--cth-admin-panel)',
  panel: 'var(--cth-admin-panel-alt)',
  border: 'var(--cth-admin-border)',
  accent: 'var(--cth-admin-accent)',
  ink: 'var(--cth-admin-ink)',
  inkSoft: 'var(--cth-admin-ink-soft)',
  muted: 'var(--cth-admin-muted)',
  green: 'var(--cth-success)',
  amber: 'var(--cth-warning)',
  red: 'var(--cth-danger)',
  blue: 'var(--cth-info)',
  purple: 'var(--cth-admin-ruby)',
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
      <ul key={`ul-${key++}`} style={{ margin: '8px 0 12px 0', paddingLeft: 20 }}>
        {listBuf.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: 13,
              color: C.inkSoft,
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
            color: C.ink,
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
            color: C.ink,
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
          color: C.inkSoft,
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

export function AuditNextSteps({ score = 0, moduleScores = {}, onNavigate }) {
  return (
    <div className="cth-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="cth-kicker m-0">Next step</p>
        <p className="m-0 mt-1 text-sm cth-muted">
          Move into Brand Foundation and turn the audit findings into your mission, message, positioning, voice, values, and story.
        </p>
      </div>
      <button
        type="button"
        onClick={() => onNavigate?.('/brand-foundation')}
        className="cth-button-primary inline-flex shrink-0 items-center gap-2"
      >
        Open Brand Foundation
      </button>
    </div>
  );
}
