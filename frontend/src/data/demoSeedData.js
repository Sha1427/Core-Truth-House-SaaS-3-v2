/**
 * demoSeedData.js
 * CTH OS — Static demo data for Demo Mode
 *
 * Keys match the normalized persist endpoint paths.
 * All values are realistic but clearly demo-branded.
 *
 * Edit these values to change what demo users see.
 */

const DEMO_SEED_DATA = {

  // ── Brand Memory ─────────────────────────────────────────────
  'brand-memory': {
    brand_name:        'Apex Creative Co.',
    primary_offer:     'Brand Strategy Intensive — 90-day 1:1 program for service-based founders',
    secondary_offers:  'Brand Audit Solo, Monthly Strategy Retainer',
    unique_mechanism:  'The Foundation-First Framework™ — we build the strategy before touching any visuals',
    audience_problem:  'They have a polished brand that looks great but doesn\'t convert. The strategy was never built.',
    audience_desire:   'A brand that consistently attracts ideal clients and converts without constant manual effort',
    brand_strengths:   '8 years of brand strategy, former creative director at Fortune 500, built 3 successful brand systems for 7-figure businesses',
    founder_background:'Creative director turned strategist. Built brand systems for Nike, Mailchimp, and 40+ independent founders.',
    competitor_1:      'Brand New',
    competitor_2:      'Superside',
    competitor_3:      'Perennial',
    platforms:         ['instagram', 'linkedin'],
    growth_goal:       '$20K MRR within 12 months through a hybrid coaching + digital product model',
    revenue_goal:      '$20,000',
    voice:             'Direct, warm, and specific. The trusted strategist in the room — never the loudest.',
    tagline:           'Strategy first. Always.',
    completion_pct:    82,
  },

  // ── Brand Foundation ──────────────────────────────────────────
  'brand-foundation': {
    mission:           'We help service-based founders build brand systems that attract, convert, and retain — without relying on constant content output.',
    vision:            'A world where every talented founder stops hiding behind beautiful but hollow branding and starts building on a foundation of real strategy.',
    values:            '1. Strategy before aesthetics\n2. Specificity over reach\n3. Systems over sprints\n4. Truth before trend',
    tagline:           'Strategy first. Always.',
    positioning:       'For service-based founders tired of rebranding without results — Apex is the brand strategy partner that builds the system underneath the brand.',
    brand_promise:     'You will leave with a brand that works as hard as you do.',
    target_audience:   'Female founders in the coaching, consulting, and creative services space. 3-7 years in business. Revenue between $80K-$300K. Frustrated by low conversions despite consistent content.',
    unique_differentiator: 'The Foundation-First Framework™ — a proprietary 12-week system that builds brand architecture before any visual or content decisions are made.',
    story:             'I spent six years helping brands look good while they quietly struggled. The logos were beautiful. The content was consistent. And nothing was working.\n\nBecause we kept starting at the surface.\n\nApex exists because the tool I needed — one that started at the foundation — didn\'t exist. So I built it.',
    completion_pct:    88,
    is_complete:       true,
  },

  // ── Strategic OS Steps ────────────────────────────────────────
  'strategic-os/steps': {
    step_number:   1,
    is_complete:   true,
    niche:         'Brand strategy for service-based founders in the coaching and consulting space',
    sub_niche:     'Female founders, $80K-$300K revenue, struggling with low conversion despite consistent content output',
    market_size:   'Large and growing — 4.4M+ women-owned businesses in the US alone, with the coaching industry at $15B globally',
    updated_at:    new Date().toISOString(),
  },

  // ── Analytics (used by Analytics.js) ─────────────────────────
  'analytics-overview': {
    contentGenerated:  147,
    aiCreditsUsed:     312,
    campaignCount:     3,
    brandScore:        82,
    workspaceCount:    1,
  },

}

export default DEMO_SEED_DATA
