import React, { useState } from 'react';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import { useUser } from '../hooks/useAuth';
import axios from 'axios';
import {
  Search, Globe, Link2, TrendingUp, Users, BarChart3,
  Loader2, AlertTriangle, CheckCircle, Info, ChevronDown,
  ChevronUp, Target, Zap, Shield, ArrowRight, Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const TABS = [
  { id: 'site-audit', label: 'Site Audit', icon: Globe },
  { id: 'ranking-gaps', label: 'Ranking Gaps', icon: BarChart3 },
  { id: 'backlinks', label: 'Backlinks', icon: Link2 },
  { id: 'competitors', label: 'Competitors', icon: Users },
  { id: 'market-shifts', label: 'Market Shifts', icon: TrendingUp },
];

function SectionCard({ title, icon: Icon, children, style: cardStyle, colors }) {
  return (
    <div style={{ background: colors.cardBg, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 20, ...cardStyle }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          {Icon && <Icon size={16} style={{ color: colors.cinnabar }} />}
          <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, margin: 0 }}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 12, background: `${color}20`, color, textTransform: 'capitalize' }}>
      {text}
    </span>
  );
}

function IssueIcon({ type }) {
  if (type === 'critical') return <AlertTriangle size={14} style={{ color: 'var(--cth-status-danger)' }} />;
  if (type === 'warning') return <AlertTriangle size={14} style={{ color: 'var(--cth-status-warning)' }} />;
  return <Info size={14} style={{ color: 'var(--cth-status-info)' }} />;
}

// ==================
// SITE AUDIT TAB
// ==================
function SiteAuditTab({ colors }) {
  const { user } = useUser();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const runAudit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/seo/site-audit`, { url: url.trim(), user_id: user?.id || 'default' });
      setResult(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const scoreColor = (score) => score >= 80 ? 'var(--cth-status-success-bright)' : score >= 50 ? 'var(--cth-status-warning)' : 'var(--cth-status-danger)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="site-audit-tab">
      <div style={{ display: 'flex', gap: 12 }}>
        <input data-testid="audit-url-input" value={url} onChange={e => setUrl(e.target.value)}
          placeholder="Enter your website URL (e.g., coretruthhouse.com)"
          onKeyDown={e => e.key === 'Enter' && runAudit()}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: colors.darkest, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: 14 }} />
        <button data-testid="run-audit-btn" onClick={runAudit} disabled={loading || !url.trim()}
          style={{ padding: '10px 24px', borderRadius: 10, background: loading ? `${colors.cinnabar}44` : 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))', color: 'var(--cth-on-dark)', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
          {loading ? 'Auditing...' : 'Run Audit'}
        </button>
      </div>
      {result && (
        <>
          {/* Score */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <SectionCard colors={colors} style={{ flex: '0 0 200px', textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor(result.audit?.score || 0) }}>{result.audit?.score || 0}</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>SEO Score / 100</div>
              {result.analysis?.overall_grade && <Badge text={`Grade: ${result.analysis.overall_grade}`} color={scoreColor(result.audit?.score || 0)} />}
            </SectionCard>
            <SectionCard title="Overview" icon={Shield} colors={colors} style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>{result.analysis?.summary}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                {[
                  { label: 'Title', ok: !!result.audit?.title },
                  { label: 'Meta Desc', ok: !!result.audit?.meta_description },
                  { label: 'H1 Tag', ok: result.audit?.h1_tags?.length === 1 },
                  { label: 'Viewport', ok: result.audit?.has_viewport },
                  { label: 'Canonical', ok: result.audit?.has_canonical },
                  { label: 'OG Tags', ok: result.audit?.has_og_tags },
                  { label: 'Schema', ok: result.audit?.has_structured_data },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: item.ok ? 'var(--cth-status-success-bright)' : 'var(--cth-status-danger)' }}>
                    {item.ok ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                    {item.label}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
          {/* Issues */}
          {result.audit?.issues?.length > 0 && (
            <SectionCard title={`Issues (${result.audit.issues.length})`} icon={AlertTriangle} colors={colors}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.audit.issues.map((issue, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: colors.darkest }}>
                    <IssueIcon type={issue.type} />
                    <span style={{ fontSize: 12, color: colors.textPrimary }}>{issue.message}</span>
                    <Badge text={issue.type} color={issue.type === 'critical' ? 'var(--cth-status-danger)' : issue.type === 'warning' ? 'var(--cth-status-warning)' : 'var(--cth-status-info)'} />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
          {/* AI Recommendations */}
          {result.analysis?.quick_wins?.length > 0 && (
            <SectionCard title="Quick Wins" icon={Zap} colors={colors}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.analysis.quick_wins.map((win, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', borderRadius: 8, background: colors.darkest }}>
                    <ArrowRight size={12} style={{ color: colors.cinnabar, marginTop: 3, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: colors.textPrimary }}>{win}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}

// ==================
// RANKING GAPS TAB
// ==================
function RankingGapsTab({ colors }) {
  const { user } = useUser();
  const [domain, setDomain] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/seo/ranking-gaps`, { user_id: user?.id || 'default', domain, niche });
      setResult(res.data.analysis);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="ranking-gaps-tab">
      <div style={{ display: 'flex', gap: 12 }}>
        <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="Your domain (optional)"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: colors.darkest, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: 14 }} />
        <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Your niche (optional)"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: colors.darkest, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: 14 }} />
        <button data-testid="analyze-gaps-btn" onClick={analyze} disabled={loading}
          style={{ padding: '10px 24px', borderRadius: 10, background: loading ? `${colors.cinnabar}44` : 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))', color: 'var(--cth-on-dark)', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
          {loading ? 'Analyzing...' : 'Find Gaps'}
        </button>
      </div>
      {result && (
        <>
          <SectionCard colors={colors}><p style={{ fontSize: 13, color: colors.textMuted }}>{result.summary}</p></SectionCard>
          {result.high_value_gaps?.length > 0 && (
            <SectionCard title="High-Value Keyword Gaps" icon={Target} colors={colors}>
              {result.high_value_gaps.map((gap, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: colors.darkest, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{gap.keyword}</span>
                    <Badge text={gap.estimated_difficulty} color={gap.estimated_difficulty === 'low' ? 'var(--cth-status-success-bright)' : gap.estimated_difficulty === 'medium' ? 'var(--cth-status-warning)' : 'var(--cth-status-danger)'} />
                    <Badge text={`Priority: ${gap.priority}`} color={gap.priority === 'high' ? 'var(--cth-admin-accent)' : 'var(--cth-neutral-500)'} />
                  </div>
                  <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>{gap.content_suggestion}</p>
                </div>
              ))}
            </SectionCard>
          )}
          {result.quick_wins?.length > 0 && (
            <SectionCard title="Quick Wins" icon={Zap} colors={colors}>
              {result.quick_wins.map((w, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: colors.darkest, marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Zap size={14} style={{ color: 'var(--cth-status-success-bright)', marginTop: 2, flexShrink: 0 }} />
                  <div><span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{w.keyword}</span><p style={{ fontSize: 11, color: colors.textMuted, margin: '2px 0 0' }}>{w.action}</p></div>
                </div>
              ))}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}

// ==================
// BACKLINKS TAB
// ==================
function BacklinksTab({ colors }) {
  const { user } = useUser();
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/seo/backlink-opportunities`, { user_id: user?.id || 'default', niche });
      setResult(res.data.analysis);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="backlinks-tab">
      <div style={{ display: 'flex', gap: 12 }}>
        <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Your niche (optional — we'll use your brand data)"
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: colors.darkest, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: 14 }} />
        <button data-testid="find-backlinks-btn" onClick={analyze} disabled={loading}
          style={{ padding: '10px 24px', borderRadius: 10, background: loading ? `${colors.cinnabar}44` : 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))', color: 'var(--cth-on-dark)', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
          {loading ? 'Finding...' : 'Find Opportunities'}
        </button>
      </div>
      {result && (
        <>
          <SectionCard colors={colors}><p style={{ fontSize: 13, color: colors.textMuted }}>{result.summary}</p></SectionCard>
          {result.strategies?.length > 0 && (
            <SectionCard title="Link Building Strategies" icon={Link2} colors={colors}>
              {result.strategies.map((s, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: 10, background: colors.darkest, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{s.strategy}</span>
                    <Badge text={`Effort: ${s.difficulty}`} color={s.difficulty === 'easy' ? 'var(--cth-status-success-bright)' : s.difficulty === 'medium' ? 'var(--cth-status-warning)' : 'var(--cth-status-danger)'} />
                    <Badge text={`Impact: ${s.impact}`} color={s.impact === 'high' ? 'var(--cth-admin-accent)' : 'var(--cth-neutral-500)'} />
                  </div>
                  <p style={{ fontSize: 12, color: colors.textMuted, margin: '4px 0' }}>{s.description}</p>
                  {s.examples?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {s.examples.map((ex, j) => <span key={j} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: `${colors.cinnabar}10`, color: colors.cinnabar }}>{ex}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </SectionCard>
          )}
          {result.quick_wins?.length > 0 && (
            <SectionCard title="Quick Wins" icon={Zap} colors={colors}>
              {result.quick_wins.map((w, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: colors.darkest, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{w.opportunity}</span>
                  <p style={{ fontSize: 11, color: colors.textMuted, margin: '2px 0 0' }}>{w.action}</p>
                </div>
              ))}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}

// ==================
// COMPETITORS TAB
// ==================
function CompetitorsTab({ colors }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/seo/competitor-analysis`, { user_id: user?.id || 'default' });
      setResult(res.data.analysis);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="competitors-tab">
      <SectionCard colors={colors}>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 12px' }}>
          Competitor analysis uses your Brand Foundation data to automatically identify and analyze competitors in your space.
        </p>
        <button data-testid="analyze-competitors-btn" onClick={analyze} disabled={loading}
          style={{ padding: '10px 24px', borderRadius: 10, background: loading ? `${colors.cinnabar}44` : 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))', color: 'var(--cth-on-dark)', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
          {loading ? 'Analyzing...' : 'Analyze Competitors'}
        </button>
      </SectionCard>
      {result && (
        <>
          <SectionCard colors={colors}><p style={{ fontSize: 13, color: colors.textMuted }}>{result.summary}</p></SectionCard>
          {result.competitors?.length > 0 && (
            <SectionCard title="Identified Competitors" icon={Users} colors={colors}>
              <div style={{ display: 'grid', gap: 12 }}>
                {result.competitors.map((c, i) => (
                  <div key={i} style={{ padding: '14px', borderRadius: 12, background: colors.darkest, border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{c.name}</span>
                      <Badge text={c.type} color={c.type === 'direct' ? 'var(--cth-admin-accent)' : c.type === 'indirect' ? 'var(--cth-status-warning)' : 'var(--cth-status-info)'} />
                      <Badge text={`Threat: ${c.threat_level}`} color={c.threat_level === 'high' ? 'var(--cth-status-danger)' : c.threat_level === 'medium' ? 'var(--cth-status-warning)' : 'var(--cth-status-success-bright)'} />
                    </div>
                    <p style={{ fontSize: 12, color: colors.textMuted, margin: '4px 0 8px' }}>{c.positioning}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--cth-status-success-bright)', fontWeight: 600, marginBottom: 4 }}>STRENGTHS</div>
                        {c.strengths?.map((s, j) => <div key={j} style={{ fontSize: 11, color: colors.textMuted, paddingLeft: 8, borderLeft: `2px solid var(--cth-status-success-bright)33` }}>{s}</div>)}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--cth-status-danger)', fontWeight: 600, marginBottom: 4 }}>WEAKNESSES</div>
                        {c.weaknesses?.map((w, j) => <div key={j} style={{ fontSize: 11, color: colors.textMuted, paddingLeft: 8, borderLeft: `2px solid var(--cth-status-danger)33` }}>{w}</div>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
          {result.your_advantages?.length > 0 && (
            <SectionCard title="Your Advantages" icon={Shield} colors={colors}>
              {result.your_advantages.map((a, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: colors.darkest, marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CheckCircle size={14} style={{ color: 'var(--cth-status-success-bright)', marginTop: 2, flexShrink: 0 }} />
                  <div><span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{a.advantage}</span><p style={{ fontSize: 11, color: colors.textMuted, margin: '2px 0 0' }}>{a.how_to_leverage}</p></div>
                </div>
              ))}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}

// ==================
// MARKET SHIFTS TAB
// ==================
function MarketShiftsTab({ colors }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/seo/market-shifts`, { user_id: user?.id || 'default' });
      setResult(res.data.analysis);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const timelineColor = (t) => t === 'now' ? 'var(--cth-status-danger)' : t === '3-6 months' ? 'var(--cth-status-warning)' : 'var(--cth-status-success-bright)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="market-shifts-tab">
      <SectionCard colors={colors}>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 12px' }}>
          Monitor shifts in your market based on your brand's niche and industry. Powered by your Brand Foundation data.
        </p>
        <button data-testid="monitor-shifts-btn" onClick={analyze} disabled={loading}
          style={{ padding: '10px 24px', borderRadius: 10, background: loading ? `${colors.cinnabar}44` : 'linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))', color: 'var(--cth-on-dark)', fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
          {loading ? 'Monitoring...' : 'Monitor Market'}
        </button>
      </SectionCard>
      {result && (
        <>
          <SectionCard colors={colors}><p style={{ fontSize: 13, color: colors.textMuted }}>{result.summary}</p></SectionCard>
          {result.trends?.length > 0 && (
            <SectionCard title="Active Trends" icon={TrendingUp} colors={colors}>
              {result.trends.map((t, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: 10, background: colors.darkest, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{t.trend}</span>
                    <Badge text={`Impact: ${t.impact}`} color={t.impact === 'high' ? 'var(--cth-admin-accent)' : 'var(--cth-neutral-500)'} />
                    <Badge text={t.timeline} color={timelineColor(t.timeline)} />
                  </div>
                  <p style={{ fontSize: 12, color: colors.textMuted, margin: '4px 0' }}>{t.description}</p>
                  {t.action_items?.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      {t.action_items.map((a, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.cinnabar }}>
                          <ArrowRight size={10} /> {a}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </SectionCard>
          )}
          {result.emerging_keywords?.length > 0 && (
            <SectionCard title="Emerging Keywords" icon={Search} colors={colors}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.emerging_keywords.map((k, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: 10, background: colors.darkest, border: `1px solid ${colors.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: colors.textPrimary }}>{k.keyword}</div>
                    <div style={{ fontSize: 10, color: colors.textMuted }}>{k.content_angle}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
          {result.strategic_recommendations?.length > 0 && (
            <SectionCard title="Strategic Recommendations" icon={Target} colors={colors}>
              {result.strategic_recommendations.map((r, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: colors.darkest, marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Zap size={14} style={{ color: r.priority === 'high' ? 'var(--cth-admin-accent)' : 'var(--cth-status-warning)', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{r.recommendation}</span>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <Badge text={`Priority: ${r.priority}`} color={r.priority === 'high' ? 'var(--cth-admin-accent)' : 'var(--cth-neutral-500)'} />
                      <Badge text={`Effort: ${r.effort}`} color={r.effort === 'low' ? 'var(--cth-status-success-bright)' : r.effort === 'medium' ? 'var(--cth-status-warning)' : 'var(--cth-status-danger)'} />
                    </div>
                  </div>
                </div>
              ))}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}

// ==================
// MAIN PAGE
// ==================
function SEOIntelligenceContent() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState('site-audit');
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <TopBar title="SEO Intelligence" subtitle="Identify gaps, surface opportunities, and back every decision with real data"
        action={<button onClick={() => navigate('/seo/print')} data-testid="seo-print-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(224,78,53,0.25)', background: 'rgba(224,78,53,0.08)', color: 'var(--cth-admin-accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><Printer size={14} /> Print Report</button>} />
      <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6" data-testid="seo-intelligence-page">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${colors.border}`, marginBottom: 20, overflowX: 'auto' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                borderBottom: activeTab === tab.id ? '2px solid var(--cth-admin-accent)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--cth-admin-accent)' : colors.textMuted,
                fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                background: activeTab === tab.id ? `${colors.cardBg}` : 'transparent',
                borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'site-audit' && <SiteAuditTab colors={colors} />}
        {activeTab === 'ranking-gaps' && <RankingGapsTab colors={colors} />}
        {activeTab === 'backlinks' && <BacklinksTab colors={colors} />}
        {activeTab === 'competitors' && <CompetitorsTab colors={colors} />}
        {activeTab === 'market-shifts' && <MarketShiftsTab colors={colors} />}
      </div>
    </DashboardLayout>
  );
}


// Export with plan gate wrapper
export default function SEOIntelligence() {
  return (
      <SEOIntelligenceContent />
  );
}

