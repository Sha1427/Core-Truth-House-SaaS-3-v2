/**
 * SEOPrintReport.jsx
 * Core Truth House OS — SEO Intelligence Print Report
 *
 * Clean JSX. Zero TypeScript. Zero React Router.
 * Navigation via onClose prop only.
 *
 * USAGE:
 *   <SEOPrintReport data={seoData} workspace={workspace} onClose={() => {}} />
 *   User clicks Print — browser print dialog opens.
 *   Save as PDF from the print dialog.
 *
 * WHAT IT PRINTS:
 *   - Site Audit summary + issue list
 *   - Ranking Gaps (keyword opportunities)
 *   - Backlinks (acquired + opportunities)
 *   - Competitor analysis
 *   - Market Shifts
 *   - Priority action plan
 *
 * ROUTE (add to your app):
 *   /seo/print?workspaceId=...
 *   Renders this component with ?print=1 to strip toolbar
 *
 * PRINT BUTTON (add to SEO Intelligence page header):
 *   <button onClick={() => navigate('/seo/print')}>Print Report</button>
 */

import { useRef } from 'react'

// ─────────────────────────────────────────────────────────────
// MOCK DATA — replace with real Prisma / API data
// ─────────────────────────────────────────────────────────────

var MOCK_SEO = {
  workspaceName: 'Core Truth House',
  domain: 'coretruthhouse.com',
  generatedAt: new Date().toISOString(),
  overallScore: 68,

  siteAudit: {
    score: 72,
    pagesScanned: 14,
    issuesCritical: 3,
    issuesWarning: 7,
    issuesPassed: 48,
    coreWebVitals: {
      lcp: { value: '2.4s', status: 'good',   label: 'LCP' },
      fid: { value: '18ms', status: 'good',   label: 'FID' },
      cls: { value: '0.12', status: 'needs_improvement', label: 'CLS' },
    },
    issues: [
      { type: 'critical', title: 'Missing meta descriptions', count: 3, pages: ['/about', '/contact', '/blog'] },
      { type: 'critical', title: 'Images missing alt text', count: 8, pages: ['Homepage hero', 'Blog post thumbnails (x7)'] },
      { type: 'critical', title: 'Broken internal links', count: 2, pages: ['/features → /features/brand-os (404)', '/pricing → /plans (404)'] },
      { type: 'warning',  title: 'Pages with thin content (<300 words)', count: 4, pages: ['/contact', '/success', '/sign-in', '/sign-up'] },
      { type: 'warning',  title: 'Duplicate H1 tags', count: 2, pages: ['/blog/index and /blog/[slug]'] },
      { type: 'warning',  title: 'Slow page speed (mobile)', count: 3, pages: ['Homepage (3.8s)', '/features (4.1s)', '/pricing (3.9s)'] },
      { type: 'passed',   title: 'HTTPS enabled',              count: 14 },
      { type: 'passed',   title: 'XML sitemap present',        count: 1  },
      { type: 'passed',   title: 'Robots.txt configured',      count: 1  },
      { type: 'passed',   title: 'Mobile-friendly pages',      count: 14 },
    ],
  },

  rankingGaps: {
    opportunities: 24,
    avgPosition: 31.4,
    keywords: [
      { keyword: 'brand operating system',      volume: 1200, position: 18, difficulty: 42, opportunity: 'high'   },
      { keyword: 'brand strategy for founders', volume: 2800, position: 34, difficulty: 38, opportunity: 'high'   },
      { keyword: 'AI brand builder',            volume: 4400, position: null, difficulty: 55, opportunity: 'high' },
      { keyword: 'brand audit tool',            volume: 880,  position: 22, difficulty: 35, opportunity: 'medium' },
      { keyword: 'content strategy system',     volume: 1600, position: 41, difficulty: 44, opportunity: 'medium' },
      { keyword: 'brand messaging framework',   volume: 720,  position: 28, difficulty: 31, opportunity: 'medium' },
      { keyword: 'founder personal brand',      volume: 5900, position: null, difficulty: 62, opportunity: 'low'  },
      { keyword: 'brand positioning consultant',volume: 480,  position: 15, difficulty: 28, opportunity: 'high'  },
    ],
  },

  backlinks: {
    totalAcquired: 47,
    domainAuthority: 24,
    newThisMonth: 3,
    lostThisMonth: 1,
    topSources: [
      { domain: 'digitalmarketer.com',    da: 82, type: 'Dofollow', anchor: 'brand operating system' },
      { domain: 'foundr.com',             da: 74, type: 'Dofollow', anchor: 'Core Truth House'       },
      { domain: 'productivityist.com',    da: 61, type: 'Dofollow', anchor: 'brand strategy tool'    },
      { domain: 'thefemalefounder.co',    da: 48, type: 'Nofollow', anchor: 'brand OS for founders'  },
      { domain: 'brandingmag.com',        da: 71, type: 'Dofollow', anchor: 'coretruthhouse.com'     },
    ],
    opportunities: [
      { domain: 'entrepreneur.com',    da: 91, approach: 'Guest post — brand strategy for founders niche' },
      { domain: 'inc.com',             da: 93, approach: 'PR placement — AI tools for entrepreneurs'      },
      { domain: 'hubspot.com',         da: 93, approach: 'Resource page — brand strategy tools roundup'   },
      { domain: 'copyhackers.com',     da: 68, approach: 'Expert quote — brand voice and messaging'       },
    ],
    // Noscript SEO anchor links — update URLs below
    noscriptLinks: [
      { anchor: 'A compelling approach that captures your brand\'s essence',          url: 'https://coretruthhouse.com'       },
      { anchor: 'An alternative perspective emphasizing different strengths',          url: 'https://coretruthhouse.com/about' },
      { anchor: 'A fresh take balancing innovation with proven principles',            url: 'https://coretruthhouse.com/blog'  },
    ],
  },

  competitors: {
    analyzed: 5,
    yourDa: 24,
    competitors: [
      { name: 'Jasper AI',     domain: 'jasper.ai',       da: 78, keywordsOverlap: 142, sharedBacklinks: 8,  gap: 'Content generation breadth', advantage: 'Brand strategy depth'    },
      { name: 'Copy.ai',       domain: 'copy.ai',         da: 71, keywordsOverlap: 98,  sharedBacklinks: 5,  gap: 'Brand awareness + distribution', advantage: 'Integrated OS approach' },
      { name: 'Notion AI',     domain: 'notion.so',       da: 91, keywordsOverlap: 67,  sharedBacklinks: 14, gap: 'Platform authority + integrations', advantage: 'Brand-first methodology' },
      { name: 'Storybrand',    domain: 'storybrand.com',  da: 64, keywordsOverlap: 203, sharedBacklinks: 3,  gap: 'Methodology recognition', advantage: 'AI-powered execution'    },
      { name: 'Brand24',       domain: 'brand24.com',     da: 69, keywordsOverlap: 44,  sharedBacklinks: 2,  gap: 'Monitoring feature set',  advantage: 'Strategy + content build' },
    ],
    contentGaps: [
      '"How to build a brand operating system" — 0 results from competitors, high volume',
      '"Brand foundation checklist" — 2 low-quality results, your content is stronger',
      '"AI brand strategy tool" — emerging term, early mover advantage available',
      '"Brand audit for founders" — thin content from competitors, strong opportunity',
    ],
  },

  marketShifts: {
    trends: [
      { trend: 'AI-powered brand strategy tools', direction: 'up',   change: '+340% YoY search volume',  relevance: 'high',   action: 'Publish comparison and positioning content immediately' },
      { trend: 'Founder personal branding',       direction: 'up',   change: '+180% YoY search volume',  relevance: 'high',   action: 'Create founder-focused content series and landing page' },
      { trend: 'DIY brand templates',             direction: 'down', change: '-22% YoY search volume',   relevance: 'medium', action: 'Position CTH as the anti-template solution explicitly' },
      { trend: 'Brand consistency tools',         direction: 'up',   change: '+95% YoY search volume',   relevance: 'high',   action: 'Add brand consistency use case to homepage and blog'  },
      { trend: 'Brand voice AI tools',            direction: 'up',   change: '+210% YoY search volume',  relevance: 'medium', action: 'Publish brand voice guide + feature the Voice module'  },
    ],
    topicGaps: [
      'No published content on "brand operating system" concept — CTH owns this term',
      'Zero case studies or success stories — add 2-3 founder testimonial pages',
      'No "how it works" long-form content ranking for key queries',
    ],
  },

  priorityActions: [
    { rank: 1, area: 'Site Audit',     action: 'Write meta descriptions for /about, /contact, /blog',       impact: 'Direct ranking improvement for all 3 pages',    effort: 'Low',    timeframe: 'This week'  },
    { rank: 2, area: 'Site Audit',     action: 'Add alt text to 8 images across homepage and blog',         impact: 'Accessibility + image search indexing',          effort: 'Low',    timeframe: 'This week'  },
    { rank: 3, area: 'Ranking Gaps',   action: 'Publish "What is a brand operating system" cornerstone post',impact: 'Targets #1 keyword gap with no strong competitors',effort: 'Medium', timeframe: 'This month' },
    { rank: 4, area: 'Backlinks',      action: 'Pitch guest post to entrepreneur.com or inc.com',           impact: 'DA 91-93 backlink would boost DA significantly',  effort: 'High',   timeframe: 'This month' },
    { rank: 5, area: 'Market Shifts',  action: 'Update homepage copy to include "AI brand strategy" language',impact: 'Captures +340% growing search trend',          effort: 'Low',    timeframe: 'This week'  },
  ],
}

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function scoreColor(score) {
  if (score >= 80) return '#10b981'
  if (score >= 65) return '#3b82f6'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function oppColor(opp) {
  return { high: '#10b981', medium: '#f59e0b', low: '#6b7280' }[opp] || '#6b7280'
}

function oppBg(opp) {
  return { high: 'rgba(16,185,129,0.1)', medium: 'rgba(245,158,11,0.1)', low: 'rgba(107,114,128,0.1)' }[opp] || 'rgba(107,114,128,0.1)'
}

function trendIcon(dir) { return dir === 'up' ? '↑' : '↓' }
function trendColor(dir) { return dir === 'up' ? '#10b981' : '#ef4444' }

function issueColor(type) {
  return { critical: '#ef4444', warning: '#f59e0b', passed: '#10b981' }[type] || '#6b7280'
}

function issueBg(type) {
  return { critical: 'rgba(239,68,68,0.08)', warning: 'rgba(245,158,11,0.08)', passed: 'rgba(16,185,129,0.08)' }[type] || 'rgba(107,114,128,0.08)'
}

// Inline score ring — pure SVG, prints perfectly
function ScoreRing(props) {
  var size   = props.size || 72
  var score  = props.score || 0
  var sw     = props.sw || 6
  var r      = (size / 2) - sw
  var circ   = 2 * Math.PI * r
  var filled = (score / 100) * circ
  var color  = props.color || scoreColor(score)
  var cx     = size / 2

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={sw} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={filled + ' ' + circ} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.23, fontWeight: 800, color: '#1a0020', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.12, color: '#9c8fb0', lineHeight: 1, marginTop: 1 }}>/ 100</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// PRINT CSS
// ─────────────────────────────────────────────────────────────

var PRINT_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', -apple-system, Arial, sans-serif;
    background: #fff;
    color: #1a0020;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .seo-report {
    max-width: 880px;
    margin: 0 auto;
    padding: 40px 48px;
  }

  @media print {
    @page { size: A4; margin: 12mm 15mm; }
    html, body { background: #fff !important; }
    .no-print { display: none !important; }
    .seo-report { padding: 0; max-width: 100%; }
    .page-break { page-break-before: always; }
    .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    table { page-break-inside: avoid; }
  }

  @media screen {
    body { background: #f5f0f8; }
    .seo-report { box-shadow: 0 4px 40px rgba(0,0,0,0.12); margin: 32px auto; border-radius: 12px; background: #fff; }
  }

  h2.section-title {
    font-size: 16px;
    font-weight: 700;
    color: #1a0020;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e8e0ef;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`

// ─────────────────────────────────────────────────────────────
// SECTION: SITE AUDIT
// ─────────────────────────────────────────────────────────────

function SectionSiteAudit(props) {
  var d = props.data
  var sc = scoreColor(d.score)

  return (
    <div className="avoid-break" style={{ marginBottom: 32 }}>
      <h2 className="section-title">🌐 Site Audit</h2>

      {/* Score + vitals row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <ScoreRing score={d.score} size={64} sw={5} />
        {[
          { l: 'Pages Scanned', v: d.pagesScanned },
          { l: 'Critical Issues', v: d.issuesCritical, vc: '#ef4444' },
          { l: 'Warnings',       v: d.issuesWarning,  vc: '#f59e0b' },
          { l: 'Passed Checks',  v: d.issuesPassed,   vc: '#10b981' },
        ].map(function(s) {
          return (
            <div key={s.l} style={{ padding: '10px 12px', background: '#faf7fd', borderRadius: 8, border: '1px solid #e8e0ef', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: s.vc || '#1a0020', margin: 0 }}>{s.v}</p>
              <p style={{ fontSize: 9.5, color: '#9c8fb0', margin: '2px 0 0' }}>{s.l}</p>
            </div>
          )
        })}
      </div>

      {/* Core Web Vitals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {Object.values(d.coreWebVitals).map(function(v) {
          var c = v.status === 'good' ? '#10b981' : v.status === 'needs_improvement' ? '#f59e0b' : '#ef4444'
          return (
            <div key={v.label} style={{ padding: '8px 12px', background: v.status === 'good' ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid', borderColor: v.status === 'good' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#4a3050', margin: 0 }}>Core Web Vital: {v.label}</p>
                <p style={{ fontSize: 9.5, color: '#9c8fb0', margin: '1px 0 0', textTransform: 'capitalize' }}>{v.status.replace(/_/g, ' ')}</p>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: c, margin: 0 }}>{v.value}</p>
            </div>
          )
        })}
      </div>

      {/* Issues list */}
      <div style={{ background: '#faf7fd', borderRadius: 8, border: '1px solid #e8e0ef', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', background: '#33033C', padding: '7px 14px' }}>
          {['Severity', 'Issue', 'Count'].map(function(h) {
            return <p key={h} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{h}</p>
          })}
        </div>
        {d.issues.map(function(issue, i) {
          var ic = issueColor(issue.type)
          var ib = issueBg(issue.type)
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', padding: '9px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#faf7fd', alignItems: 'start' }}>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '2px 7px', borderRadius: 20, color: ic, background: ib, display: 'inline-block' }}>{issue.type}</span>
              <div>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#2d1840', margin: '0 0 2px' }}>{issue.title}</p>
                {issue.pages && issue.pages.length > 0 && (
                  <p style={{ fontSize: 9.5, color: '#7b6f8a', margin: 0 }}>{issue.pages.join(' · ')}</p>
                )}
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: ic, margin: 0, textAlign: 'right' }}>{issue.count}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SECTION: RANKING GAPS
// ─────────────────────────────────────────────────────────────

function SectionRankingGaps(props) {
  var d = props.data

  return (
    <div className="avoid-break" style={{ marginBottom: 32 }}>
      <h2 className="section-title">📊 Ranking Gaps — Keyword Opportunities</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[
          { l: 'Keyword Opportunities', v: d.opportunities, c: '#AF0024' },
          { l: 'Avg. Current Position',  v: d.avgPosition,  c: '#f59e0b' },
          { l: 'Target Position',        v: '< 10',          c: '#10b981' },
        ].map(function(s) {
          return (
            <div key={s.l} style={{ padding: '12px 14px', background: '#faf7fd', borderRadius: 8, border: '1px solid #e8e0ef', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.c, margin: 0 }}>{s.v}</p>
              <p style={{ fontSize: 9.5, color: '#9c8fb0', margin: '2px 0 0' }}>{s.l}</p>
            </div>
          )
        })}
      </div>

      <div style={{ background: '#faf7fd', borderRadius: 8, border: '1px solid #e8e0ef', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 90px', background: '#33033C', padding: '7px 14px' }}>
          {['Keyword', 'Volume', 'Position', 'Difficulty', 'Opportunity'].map(function(h) {
            return <p key={h} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{h}</p>
          })}
        </div>
        {d.keywords.map(function(kw, i) {
          var oc = oppColor(kw.opportunity)
          var ob = oppBg(kw.opportunity)
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 90px', padding: '9px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#faf7fd', alignItems: 'center' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#2d1840', margin: 0 }}>{kw.keyword}</p>
              <p style={{ fontSize: 11, color: '#4a3050', margin: 0 }}>{kw.volume ? kw.volume.toLocaleString() : '—'}</p>
              <p style={{ fontSize: 11, fontWeight: kw.position ? 600 : 400, color: kw.position ? (kw.position <= 10 ? '#10b981' : '#f59e0b') : '#9c8fb0', margin: 0 }}>{kw.position || 'Not ranked'}</p>
              <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: kw.difficulty >= 50 ? '#ef4444' : kw.difficulty >= 35 ? '#f59e0b' : '#10b981', width: kw.difficulty + '%', borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '2px 8px', borderRadius: 20, color: oc, background: ob }}>{kw.opportunity}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SECTION: BACKLINKS
// ─────────────────────────────────────────────────────────────

function SectionBacklinks(props) {
  var d = props.data

  return (
    <div className="avoid-break" style={{ marginBottom: 32 }}>
      <h2 className="section-title">🔗 Backlinks</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[
          { l: 'Total Backlinks',    v: d.totalAcquired,  c: '#33033C' },
          { l: 'Domain Authority',   v: d.domainAuthority,c: '#AF0024' },
          { l: 'New This Month',     v: '+' + d.newThisMonth, c: '#10b981' },
          { l: 'Lost This Month',    v: '-' + d.lostThisMonth, c: '#ef4444' },
        ].map(function(s) {
          return (
            <div key={s.l} style={{ padding: '10px 12px', background: '#faf7fd', borderRadius: 8, border: '1px solid #e8e0ef', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: s.c, margin: 0 }}>{s.v}</p>
              <p style={{ fontSize: 9.5, color: '#9c8fb0', margin: '2px 0 0' }}>{s.l}</p>
            </div>
          )
        })}
      </div>

      {/* Top sources */}
      <p style={{ fontSize: 11, fontWeight: 700, color: '#4a3050', marginBottom: 7 }}>Top Acquired Backlinks</p>
      <div style={{ background: '#faf7fd', borderRadius: 8, border: '1px solid #e8e0ef', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 1fr', background: '#33033C', padding: '7px 14px' }}>
          {['Domain', 'DA', 'Type', 'Anchor Text'].map(function(h) {
            return <p key={h} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{h}</p>
          })}
        </div>
        {d.topSources.map(function(bl, i) {
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 1fr', padding: '8px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#faf7fd', alignItems: 'center' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#2d1840', margin: 0 }}>{bl.domain}</p>
              <p style={{ fontSize: 12, fontWeight: 700, color: bl.da >= 70 ? '#10b981' : '#f59e0b', margin: 0 }}>{bl.da}</p>
              <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, color: bl.type === 'Dofollow' ? '#10b981' : '#9c8fb0', background: bl.type === 'Dofollow' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.08)' }}>{bl.type}</span>
              <p style={{ fontSize: 11, color: '#7b6f8a', margin: 0, fontStyle: 'italic' }}>"{bl.anchor}"</p>
            </div>
          )
        })}
      </div>

      {/* Opportunities */}
      <p style={{ fontSize: 11, fontWeight: 700, color: '#4a3050', marginBottom: 7 }}>Backlink Opportunities</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {d.opportunities.map(function(opp, i) {
          return (
            <div key={i} style={{ padding: '9px 12px', background: '#faf7fd', borderRadius: 7, border: '1px solid #e8e0ef' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#AF0024', margin: 0 }}>DA {opp.da}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#2d1840', margin: 0 }}>{opp.domain}</p>
              </div>
              <p style={{ fontSize: 10, color: '#7b6f8a', margin: 0 }}>{opp.approach}</p>
            </div>
          )
        })}
      </div>

      {/* Noscript links reference */}
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(175,0,36,0.04)', borderRadius: 8, border: '1px solid rgba(175,0,36,0.12)' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#AF0024', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Noscript SEO Links — Configured URLs</p>
        {d.noscriptLinks.map(function(link, i) {
          return (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#AF0024', minWidth: 14 }}>{i + 1}.</span>
              <div>
                <p style={{ fontSize: 10, color: '#4a3050', margin: 0 }}>{link.anchor}</p>
                <p style={{ fontSize: 9.5, color: '#9c8fb0', margin: 0 }}>{link.url}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SECTION: COMPETITORS
// ─────────────────────────────────────────────────────────────

function SectionCompetitors(props) {
  var d = props.data

  return (
    <div className="avoid-break" style={{ marginBottom: 32 }}>
      <h2 className="section-title">🎯 Competitor Analysis</h2>

      <div style={{ background: '#faf7fd', borderRadius: 8, border: '1px solid #e8e0ef', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 100px 90px 1fr 1fr', background: '#33033C', padding: '7px 14px' }}>
          {['Competitor', 'DA', 'KW Overlap', 'Backlinks', 'Their Advantage', 'Your Edge'].map(function(h) {
            return <p key={h} style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{h}</p>
          })}
        </div>
        {d.competitors.map(function(c, i) {
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 100px 90px 1fr 1fr', padding: '9px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#faf7fd', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#2d1840', margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 9.5, color: '#9c8fb0', margin: 0 }}>{c.domain}</p>
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: c.da >= 70 ? '#ef4444' : '#f59e0b', margin: 0 }}>{c.da}</p>
              <p style={{ fontSize: 11, color: '#4a3050', margin: 0 }}>{c.keywordsOverlap}</p>
              <p style={{ fontSize: 11, color: '#4a3050', margin: 0 }}>{c.sharedBacklinks}</p>
              <p style={{ fontSize: 10, color: '#7b6f8a', margin: 0 }}>{c.gap}</p>
              <p style={{ fontSize: 10, fontWeight: 500, color: '#10b981', margin: 0 }}>{c.advantage}</p>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: '#4a3050', marginBottom: 7 }}>Content Gaps You Can Win</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {d.contentGaps.map(function(gap, i) {
          return (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: '#faf7fd', borderRadius: 7, border: '1px solid #e8e0ef' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>✓</span>
              </div>
              <p style={{ fontSize: 11, color: '#4a3050', margin: 0, lineHeight: 1.5 }}>{gap}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SECTION: MARKET SHIFTS
// ─────────────────────────────────────────────────────────────

function SectionMarketShifts(props) {
  var d = props.data

  return (
    <div className="avoid-break" style={{ marginBottom: 32 }}>
      <h2 className="section-title">📈 Market Shifts</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 7, marginBottom: 16 }}>
        {d.trends.map(function(t, i) {
          var tc = trendColor(t.direction)
          var rel = { high: '#10b981', medium: '#f59e0b', low: '#9c8fb0' }[t.relevance]
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 140px 120px', gap: 10, padding: '10px 14px', background: '#faf7fd', borderRadius: 8, border: '1px solid #e8e0ef', alignItems: 'start' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: tc }}>{trendIcon(t.direction)}</span>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#2d1840', margin: '0 0 2px' }}>{t.trend}</p>
                <p style={{ fontSize: 10, color: tc, fontWeight: 500, margin: 0 }}>{t.change}</p>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '2px 8px', borderRadius: 20, color: rel, background: rel + '18', alignSelf: 'center' }}>
                {t.relevance} relevance
              </span>
              <p style={{ fontSize: 10, color: '#7b6f8a', margin: 0, lineHeight: 1.45 }}>{t.action}</p>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: '#4a3050', marginBottom: 7 }}>Topic Gaps to Address</p>
      {d.topicGaps.map(function(g, i) {
        return (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 12px', background: 'rgba(175,0,36,0.04)', borderRadius: 7, border: '1px solid rgba(175,0,36,0.1)', marginBottom: 5 }}>
            <span style={{ color: '#AF0024', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>!</span>
            <p style={{ fontSize: 11, color: '#4a3050', margin: 0, lineHeight: 1.5 }}>{g}</p>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SECTION: PRIORITY ACTIONS
// ─────────────────────────────────────────────────────────────

function SectionPriorities(props) {
  var d = props.data

  var effortColor = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' }
  var timeframeColor = { 'This week': '#AF0024', 'This month': '#f59e0b' }

  return (
    <div className="avoid-break" style={{ marginBottom: 24 }}>
      <h2 className="section-title">🎯 Priority Action Plan</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {d.map(function(item) {
          var rc = item.rank <= 2 ? '#AF0024' : item.rank <= 4 ? '#f59e0b' : '#3b82f6'
          return (
            <div key={item.rank} style={{ display: 'grid', gridTemplateColumns: '28px 70px 1fr 100px 80px', gap: 10, padding: '11px 14px', background: '#faf7fd', borderRadius: 8, border: '1px solid #e8e0ef', alignItems: 'start' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: rc, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{item.rank}</span>
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 600, padding: '3px 7px', borderRadius: 20, background: 'rgba(51,3,60,0.08)', color: '#33033C', alignSelf: 'center' }}>{item.area}</span>
              <div>
                <p style={{ fontSize: 11.5, fontWeight: 600, color: '#2d1840', margin: '0 0 3px' }}>{item.action}</p>
                <p style={{ fontSize: 10, color: '#7b6f8a', margin: 0 }}>{item.impact}</p>
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: effortColor[item.effort] || '#9c8fb0', background: (effortColor[item.effort] || '#9c8fb0') + '15', alignSelf: 'center' }}>
                {item.effort} effort
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: timeframeColor[item.timeframe] || '#9c8fb0', background: (timeframeColor[item.timeframe] || '#9c8fb0') + '15', alignSelf: 'center' }}>
                {item.timeframe}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

/**
 * Props:
 *   data       — full SEO data object (matches MOCK_SEO structure above)
 *   workspace  — { name, domain }
 *   onClose    — function() — back button handler
 */
export default function SEOPrintReport(props) {
  var data      = props.data      || MOCK_SEO
  var workspace = props.workspace || { name: data.workspaceName, domain: data.domain }
  var onClose   = props.onClose

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Screen toolbar */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: '#1a0020', borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}>
              ← Back to SEO
            </button>
          )}
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif" }}>
            SEO Intelligence Report — {workspace.domain}
          </span>
        </div>
        <button
          onClick={function() { window.print() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 18px', borderRadius: 8,
            border: 'none', background: '#E04E35', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
          </svg>
          Print / Save PDF
        </button>
      </div>

      {/* Report */}
      <div className="seo-report" style={{ paddingTop: 68 }}>

        {/* ── COVER ──────────────────────────────────────── */}
        <div style={{ marginBottom: 28, paddingBottom: 22, borderBottom: '2px solid #33033C' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              {/* Brand mark */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#33033C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#E04E35', fontWeight: 800, fontSize: 15 }}>C</span>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#33033C', margin: 0 }}>Core Truth House OS</p>
                  <p style={{ fontSize: 10, color: '#9c8fb0', margin: 0 }}>SEO Intelligence Report</p>
                </div>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a0020', margin: '0 0 4px', lineHeight: 1.1 }}>SEO Intelligence</h1>
              <p style={{ fontSize: 14, color: '#AF0024', fontWeight: 600, margin: '0 0 3px' }}>{workspace.domain}</p>
              <p style={{ fontSize: 11, color: '#9c8fb0', margin: 0 }}>Generated {formatDate(data.generatedAt)}</p>
            </div>

            {/* Overall score */}
            <div style={{ textAlign: 'center', padding: '18px 24px', background: '#faf7fd', borderRadius: 12, border: '2px solid #e8e0ef' }}>
              <ScoreRing score={data.overallScore} size={88} sw={7} />
              <p style={{ fontSize: 11, color: '#9c8fb0', margin: '8px 0 0' }}>Overall SEO Score</p>
            </div>
          </div>

          {/* Score snapshot */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 8, marginTop: 20 }}>
            {[
              { l: 'Site Audit',     v: data.siteAudit.score,          icon: '🌐' },
              { l: 'Ranking Gaps',   v: data.rankingGaps.opportunities, icon: '📊', suffix: ' gaps' },
              { l: 'Backlinks',      v: data.backlinks.totalAcquired,   icon: '🔗' },
              { l: 'Competitors',    v: data.competitors.analyzed,      icon: '🎯', suffix: ' tracked' },
              { l: 'Market Trends',  v: data.marketShifts.trends.length,icon: '📈', suffix: ' shifts' },
            ].map(function(s) {
              return (
                <div key={s.l} style={{ textAlign: 'center', padding: '10px 6px', background: '#faf7fd', borderRadius: 8, border: '1px solid #e8e0ef' }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#33033C', margin: '3px 0 2px' }}>{s.v}{s.suffix || ''}</p>
                  <p style={{ fontSize: 9.5, color: '#9c8fb0', margin: 0 }}>{s.l}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── PRIORITY ACTIONS (page 1 - high visibility) ── */}
        <SectionPriorities data={data.priorityActions} />

        {/* ── SITE AUDIT ────────────────────────────────── */}
        <div className="page-break">
          <SectionSiteAudit data={data.siteAudit} />
        </div>

        {/* ── RANKING GAPS ──────────────────────────────── */}
        <SectionRankingGaps data={data.rankingGaps} />

        {/* ── BACKLINKS ─────────────────────────────────── */}
        <div className="page-break">
          <SectionBacklinks data={data.backlinks} />
        </div>

        {/* ── COMPETITORS ───────────────────────────────── */}
        <SectionCompetitors data={data.competitors} />

        {/* ── MARKET SHIFTS ─────────────────────────────── */}
        <div className="page-break">
          <SectionMarketShifts data={data.marketShifts} />
        </div>

        {/* ── FOOTER ────────────────────────────────────── */}
        <div style={{ paddingTop: 18, borderTop: '1px solid #e8e0ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#33033C', margin: 0 }}>Core Truth House OS</p>
            <p style={{ fontSize: 10, color: '#9c8fb0', margin: '2px 0 0' }}>coretruthhouse.com · Where serious brands are built.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: '#9c8fb0', margin: 0 }}>Generated {formatDate(data.generatedAt)}</p>
            <p style={{ fontSize: 10, color: '#9c8fb0', margin: '2px 0 0' }}>Powered by Ahrefs + Brand Foundation data</p>
          </div>
        </div>
      </div>
    </>
  )
}
