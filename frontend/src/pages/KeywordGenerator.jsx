import React, { useState } from 'react';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import { useUser } from '../hooks/useAuth';
import axios from 'axios';
import {
  Search, Loader2, Copy, Download, Sparkles, TrendingUp,
  Target, BarChart3, ChevronDown, ChevronUp, Filter, Zap
} from 'lucide-react';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const INTENT_OPTIONS = [
  { value: 'mixed', label: 'All Intents' },
  { value: 'informational', label: 'Informational' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'navigational', label: 'Navigational' },
];

const INTENT_COLORS = {
  informational: 'var(--cth-status-info)',
  transactional: 'var(--cth-status-success-bright)',
  commercial: 'var(--cth-status-warning)',
  navigational: 'var(--cth-status-focus)',
};

const DIFFICULTY_COLORS = {
  low: 'var(--cth-status-success-bright)',
  medium: 'var(--cth-status-warning)',
  high: 'var(--cth-status-danger)',
};

export default function KeywordGenerator() {
  const colors = useColors();
  const { user } = useUser();
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [intent, setIntent] = useState('mixed');
  const [count, setCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filterIntent, setFilterIntent] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setKeywords([]);
    try {
      const res = await axios.post(`${API}/seo/keywords/generate`, {
        topic: topic.trim(),
        niche: niche.trim(),
        intent,
        count,
      });
      setKeywords(res.data.keywords || []);
    } catch (err) {
      console.error('Keyword generation failed:', err);
    }
    setLoading(false);
  };

  const copyKeywords = () => {
    const text = filtered.map(k => k.keyword).join('\n');
    navigator.clipboard.writeText(text);
  };

  const exportCSV = () => {
    const header = 'Keyword,Intent,Difficulty,Volume,Content Angle\n';
    const rows = filtered.map(k =>
      `"${k.keyword}","${k.search_intent}","${k.difficulty}","${k.volume_estimate}","${(k.content_angle || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${topic.replace(/\s+/g, '-')}.csv`;
    a.click();
  };

  const filtered = keywords.filter(k => {
    if (filterIntent !== 'all' && k.search_intent !== filterIntent) return false;
    if (filterDifficulty !== 'all' && k.difficulty !== filterDifficulty) return false;
    return true;
  });

  const cardStyle = {
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 20,
  };

  return (
    <DashboardLayout>
      <TopBar title="Keyword Generator" subtitle="AI-powered keyword research for your brand" />
      <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6" data-testid="keyword-generator-page">

        {/* Input Section */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Sparkles size={18} style={{ color: colors.cinnabar }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>Generate Keywords</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Topic / Seed Keyword *
              </label>
              <input
                data-testid="keyword-topic-input"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., brand strategy, organic skincare, fitness coaching"
                onKeyDown={e => e.key === 'Enter' && generate()}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: colors.darkest, border: `1px solid ${colors.border}`,
                  color: colors.textPrimary, fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Niche / Industry (optional)
              </label>
              <input
                data-testid="keyword-niche-input"
                value={niche}
                onChange={e => setNiche(e.target.value)}
                placeholder="e.g., SaaS, health & wellness, e-commerce"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: colors.darkest, border: `1px solid ${colors.border}`,
                  color: colors.textPrimary, fontSize: 14,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Search Intent
              </label>
              <select
                value={intent} onChange={e => setIntent(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: colors.darkest, border: `1px solid ${colors.border}`,
                  color: colors.textPrimary, fontSize: 14,
                }}
              >
                {INTENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ width: 120 }}>
              <label style={{ fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Count
              </label>
              <select
                value={count} onChange={e => setCount(Number(e.target.value))}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: colors.darkest, border: `1px solid ${colors.border}`,
                  color: colors.textPrimary, fontSize: 14,
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </div>
            <button
              data-testid="generate-keywords-btn"
              onClick={generate}
              disabled={loading || !topic.trim()}
              style={{
                padding: '10px 24px', borderRadius: 10,
                background: loading || !topic.trim() ? `${colors.cinnabar}44` : `linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))`,
                color: 'var(--cth-on-dark)', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Results */}
        {keywords.length > 0 && (
          <>
            {/* Stats Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ ...cardStyle, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={14} style={{ color: colors.cinnabar }} />
                  <span style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600 }}>{filtered.length}</span>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>keywords</span>
                </div>
                {/* Intent filter */}
                <select
                  value={filterIntent} onChange={e => setFilterIntent(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 10, background: colors.darkest, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: 12 }}
                >
                  <option value="all">All Intents</option>
                  <option value="informational">Informational</option>
                  <option value="transactional">Transactional</option>
                  <option value="commercial">Commercial</option>
                  <option value="navigational">Navigational</option>
                </select>
                {/* Difficulty filter */}
                <select
                  value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 10, background: colors.darkest, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: 12 }}
                >
                  <option value="all">All Difficulty</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={copyKeywords} data-testid="copy-keywords-btn"
                  style={{ padding: '8px 14px', borderRadius: 8, background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Copy size={12} /> Copy All
                </button>
                <button onClick={exportCSV} data-testid="export-keywords-btn"
                  style={{ padding: '8px 14px', borderRadius: 8, background: colors.cardBg, border: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={12} /> Export CSV
                </button>
              </div>
            </div>

            {/* Keywords Table */}
            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Keyword</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intent</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Difficulty</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volume</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Content Angle</th>
                    <th style={{ padding: '12px 16px', width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((kw, i) => (
                    <React.Fragment key={i}>
                      <tr
                        data-testid={`keyword-row-${i}`}
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                        style={{ borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = `${colors.darkest}`}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{kw.keyword}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 12,
                            background: `${INTENT_COLORS[kw.search_intent] || 'var(--cth-neutral-500)'}20`,
                            color: INTENT_COLORS[kw.search_intent] || 'var(--cth-neutral-500)',
                            textTransform: 'capitalize',
                          }}>{kw.search_intent}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 12,
                            background: `${DIFFICULTY_COLORS[kw.difficulty] || 'var(--cth-neutral-500)'}20`,
                            color: DIFFICULTY_COLORS[kw.difficulty] || 'var(--cth-neutral-500)',
                            textTransform: 'capitalize',
                          }}>{kw.difficulty}</span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ fontSize: 11, color: colors.textMuted, textTransform: 'capitalize' }}>{(kw.volume_estimate || '').replace('_', ' ')}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 12, color: colors.textMuted, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{kw.content_angle}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {expandedRow === i ? <ChevronUp size={14} style={{ color: colors.textMuted }} /> : <ChevronDown size={14} style={{ color: colors.textMuted }} />}
                        </td>
                      </tr>
                      {expandedRow === i && kw.long_tail_variations?.length > 0 && (
                        <tr>
                          <td colSpan={6} style={{ padding: '0 16px 12px', background: colors.darkest }}>
                            <div style={{ padding: '12px 16px', borderRadius: 10, background: colors.cardBg, border: `1px solid ${colors.border}` }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: colors.cinnabar, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Long-tail Variations</div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {kw.long_tail_variations.map((v, j) => (
                                  <span key={j} style={{
                                    fontSize: 12, padding: '5px 10px', borderRadius: 8,
                                    background: `${colors.cinnabar}10`, border: `1px solid ${colors.cinnabar}22`,
                                    color: colors.textPrimary,
                                  }}>{v}</span>
                                ))}
                              </div>
                              {kw.content_angle && (
                                <div style={{ marginTop: 10, fontSize: 12, color: colors.textMuted }}>
                                  <Zap size={12} style={{ display: 'inline', color: colors.cinnabar, marginRight: 4 }} />
                                  <strong style={{ color: colors.textPrimary }}>Content Angle:</strong> {kw.content_angle}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && keywords.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: `${colors.cinnabar}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Search size={28} style={{ color: colors.cinnabar }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.textPrimary, marginBottom: 8 }}>Discover High-Value Keywords</h3>
            <p style={{ fontSize: 13, color: colors.textMuted, maxWidth: 400, margin: '0 auto' }}>
              Enter a topic above to generate AI-powered keyword ideas with search intent, difficulty estimates, and content angle suggestions.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

