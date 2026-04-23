/**
 * LandingPage.js — PREMIUM REBUILD
 * CTH OS — Core Truth House Landing Page
 *
 * Design philosophy: Dark luxury editorial meets motion-forward SaaS.
 * Inspired by Linear, Framer, Vercel — but distinctly CTH.
 * Every section has purposeful motion. Nothing is static.
 *
 * Sections:
 *   1. Nav — sticky with blur, live scroll indicator
 *   2. Hero — animated word reveal, floating orbs, product mockup fade
 *   3. Marquee — scrolling social proof / module names
 *   4. Features — horizontal tab showcase with animated transitions
 *   5. How it works — numbered steps with draw-on-scroll lines
 *   6. Stats — animated number counters
 *   7. Testimonials — auto-scroll carousel with glassmorphism cards
 *   8. Pricing — hover-lift cards, animated popular badge, comparison
 *   9. FAQ — smooth accordion
 *   10. Final CTA — pulsing gradient
 *   11. Footer
 */

import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// ─── Design Tokens ────────────────────────────────────────────
const C = {
  bg:      'var(--cth-brand-primary-deep)',
  bgLight: 'var(--cth-surface-night)',
  border:  'rgba(255,255,255,0.07)',
  accent:  'var(--cth-admin-accent)',
  crimson: 'var(--cth-brand-primary)',
  purple:  'var(--cth-brand-primary-soft)',
  ruby:    'var(--cth-admin-ruby)',
  tuscany: 'var(--cth-admin-muted)',
  gold:    'var(--cth-brand-secondary)',
  green:   'var(--cth-status-success-bright)',
  white:   'var(--cth-white)',
  t80:     'var(--cth-text-on-dark-soft)',
  t60:     'var(--cth-text-on-dark-muted)',
  t40:     'rgba(255,255,255,0.4)',
  t20:     'rgba(255,255,255,0.2)',
  t08:     'rgba(255,255,255,0.08)',
  t04:     'rgba(255,255,255,0.04)',
  serif:   '"Playfair Display", Georgia, serif',
  font:    '"DM Sans", system-ui, sans-serif',
  mono:    '"JetBrains Mono", monospace',
}

// ─── Global Styles ────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: var(--cth-brand-primary-deep); color: var(--cth-white); font-family: "DM Sans", system-ui, sans-serif; overflow-x: hidden; }
  ::selection { background: rgba(224,78,53,0.3); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(224,78,53,0.4); border-radius: 2px; }

  @keyframes float-slow { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(2deg); } }
  @keyframes float-mid  { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(-1.5deg); } }
  @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.4); opacity: 0; } }
  @keyframes marquee-l { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  @keyframes counter-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slide-in   { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes glow-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
  @keyframes spin-slow  { to { transform: rotate(360deg); } }
  @keyframes badge-float{ 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-6px) scale(1.02); } }

  .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: 0.1s !important; }
  .reveal-delay-2 { transition-delay: 0.2s !important; }
  .reveal-delay-3 { transition-delay: 0.3s !important; }
  .reveal-delay-4 { transition-delay: 0.4s !important; }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary));
    color: var(--cth-white); font-family: "DM Sans", sans-serif; font-size: 15px; font-weight: 700;
    cursor: pointer; text-decoration: none;
    box-shadow: 0 8px 32px rgba(224,78,53,0.35);
    transition: all 0.2s ease;
    position: relative; overflow: hidden;
  }
  .btn-primary::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
    opacity: 0; transition: opacity 0.2s;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(224,78,53,0.45); }
  .btn-primary:hover::after { opacity: 1; }

  .btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 26px; border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.04);
    color: var(--cth-text-on-dark-soft); font-family: "DM Sans", sans-serif;
    font-size: 15px; font-weight: 500; cursor: pointer; text-decoration: none;
    transition: all 0.2s ease; backdrop-filter: blur(8px);
  }
  .btn-ghost:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.08); color: var(--cth-white); }

  .feature-tab { transition: all 0.2s ease; }
  .feature-tab:hover { background: rgba(255,255,255,0.05) !important; }
  .feature-tab.active { background: rgba(224,78,53,0.08) !important; border-color: rgba(224,78,53,0.3) !important; }

  .pricing-card { transition: all 0.25s ease; }
  .pricing-card:hover { transform: translateY(-6px); }
  .pricing-card.featured { box-shadow: 0 0 0 1px rgba(224,78,53,0.4), 0 20px 60px rgba(224,78,53,0.15); }

  .faq-item summary { cursor: pointer; list-style: none; }
  .faq-item summary::-webkit-details-marker { display: none; }
`

// ─── Scroll Reveal Hook ────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

// ─── Counter Hook ─────────────────────────────────────────────
function useCounter(target, duration = 1800) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      let start = 0
      const step = () => {
        start += target / (duration / 16)
        if (start < target) { setCount(Math.floor(start)); requestAnimationFrame(step) }
        else setCount(target)
      }
      requestAnimationFrame(step)
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])
  return [count, ref]
}

// ─── Nav ──────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30)
      const doc = document.documentElement
      setProgress((window.scrollY / (doc.scrollHeight - doc.clientHeight)) * 100)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'all 0.3s ease',
      background: scrolled ? 'rgba(13,0,16,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
    }}>
      {/* Scroll progress */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, height: 1.5, width: progress + '%', background: C.accent, transition: 'width 0.1s' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/cth-logo.png" alt="CTH" style={{ height: 30 }} />
          <span style={{ fontFamily: C.serif, fontSize: 16, fontWeight: 700, color: C.white }}>
            Core Truth <span style={{ color: C.accent }}>House</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {['Features', 'Pricing', 'Blog', 'Store'].map(label => (
            <a key={label} href={label === 'Blog' ? '/blog' : label === 'Store' ? '/store' : `#${label.toLowerCase()}`}
              style={{ fontSize: 13.5, color: C.t60, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
              onMouseEnter={e => { e.target.style.color = C.white }}
              onMouseLeave={e => { e.target.style.color = C.t60 }}>
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/sign-in" className="btn-ghost" style={{ padding: '9px 20px', fontSize: 13.5 }}>Sign in</Link>
          <Link to="/sign-up" className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5 }}>
            Start free →
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────
function Hero() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])

  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 60px', overflow: 'hidden' }}>

      {/* Animated background orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '15%', left: '8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(175,0,36,0.12) 0%, transparent 70%)', animation: 'float-slow 14s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '30%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(51,3,60,0.25) 0%, transparent 70%)', animation: 'float-mid 10s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '30%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,78,53,0.07) 0%, transparent 70%)', animation: 'float-slow 18s ease-in-out infinite 4s' }} />

        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(224,78,53,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(224,78,53,0.03) 1px, transparent 1px)`, backgroundSize: '60px 60px', opacity: 0.6 }} />

        {/* Floating accent dots */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: [6,4,8,5,7,4][i], height: [6,4,8,5,7,4][i],
            borderRadius: '50%',
            background: C.accent,
            opacity: [0.4,0.2,0.3,0.15,0.25,0.2][i],
            top: ['20%','60%','40%','75%','15%','55%'][i],
            left: ['15%','25%','75%','65%','85%','45%'][i],
            animation: `float-mid ${8+i*2}s ease-in-out infinite ${i}s`,
          }} />
        ))}
      </div>

      <div style={{ maxWidth: 900, width: '100%', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        {/* Launch badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 30,
          border: '1px solid rgba(224,78,53,0.3)',
          background: 'rgba(224,78,53,0.08)',
          marginBottom: 32,
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(10px)',
          transition: 'all 0.6s ease',
        }}>
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ display: 'block', width: 7, height: 7, borderRadius: '50%', background: C.accent }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid ' + C.accent, animation: 'pulse-ring 2s ease-out infinite' }} />
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: C.accent, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: C.font }}>
            AI-Powered Brand Operating System
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: C.serif, fontWeight: 900, lineHeight: 1.05,
          fontSize: 'clamp(3rem, 7vw, 6rem)',
          marginBottom: 24,
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(20px)',
          transition: 'all 0.7s ease 0.1s',
        }}>
          Build the brand{' '}
          <em style={{ fontStyle: 'italic', color: C.accent, textShadow: '0 0 60px rgba(224,78,53,0.4)' }}>
            behind
          </em>
          <br />the business.
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: C.t60, lineHeight: 1.7, maxWidth: 600, margin: '0 auto 40px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(16px)',
          transition: 'all 0.7s ease 0.2s',
        }}>
          Strategy. Systems. Identity. Content. All connected. Built on Brand Memory so every AI generation sounds like you — not like a robot pretending to.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56,
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(12px)',
          transition: 'all 0.7s ease 0.3s',
        }}>
          <Link to="/sign-up" className="btn-primary" data-testid="hero-cta">
            Start free — no credit card
          </Link>
          <Link to="/sign-in" className="btn-ghost">
            See a demo ↗
          </Link>
        </div>

        {/* Trust bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap',
          opacity: visible ? 1 : 0, transition: 'all 0.7s ease 0.4s',
        }}>
          {[
            { icon: '🔐', label: 'SSL Secured' },
            { icon: '💳', label: 'Stripe Payments' },
            { icon: '🚀', label: 'Railway Hosted' },
            { icon: '🤖', label: 'Powered by Claude' },
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>{t.icon}</span>
              <span style={{ fontSize: 11.5, color: C.t40, fontWeight: 500, fontFamily: C.font }}>{t.label}</span>
            </div>
          ))}
        </div>

        {/* Product mockup */}
        <div style={{
          marginTop: 64,
          position: 'relative',
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(30px)',
          transition: 'all 0.9s ease 0.5s',
        }}>
          {/* Glow behind mockup */}
          <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '60%', background: 'radial-gradient(ellipse, rgba(224,78,53,0.2) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          <div style={{
            background: 'rgba(26,0,32,0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 18,
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(224,78,53,0.1) inset',
          }}>
            {/* Mock browser bar */}
            <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['var(--cth-ui-red)','var(--cth-ui-yellow)','var(--cth-ui-green)'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
              <div style={{ flex: 1, margin: '0 12px', height: 22, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                <span style={{ fontSize: 10, color: C.t30, fontFamily: C.mono }}>coretruthhouse.com/dashboard</span>
              </div>
            </div>

            {/* Mock dashboard content */}
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12, minHeight: 280 }}>
              {/* Sidebar mock */}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '14px 12px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.t30, letterSpacing: '0.15em', marginBottom: 10, fontFamily: C.font }}>BRAND FOUNDATION</div>
                {['Brand Audit', 'Brand Intelligence', 'Brand Health', 'Brand Scorecard'].map(item => (
                  <div key={item} style={{ padding: '6px 10px', borderRadius: 7, marginBottom: 4, fontSize: 11, color: item === 'Brand Audit' ? C.accent : C.t40, background: item === 'Brand Audit' ? 'rgba(224,78,53,0.1)' : 'none', fontFamily: C.font, fontWeight: item === 'Brand Audit' ? 600 : 400 }}>
                    {item}
                  </div>
                ))}
                <div style={{ fontSize: 9, fontWeight: 700, color: C.t30, letterSpacing: '0.15em', margin: '12px 0 8px', fontFamily: C.font }}>CONTENT TOOLS</div>
                {['Campaign Builder', 'Content Studio', 'Media Studio'].map(item => (
                  <div key={item} style={{ padding: '6px 10px', borderRadius: 7, marginBottom: 4, fontSize: 11, color: C.t40, fontFamily: C.font }}>
                    {item}
                  </div>
                ))}
              </div>

              {/* Main content mock */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, alignContent: 'start' }}>
                {[
                  { label: 'Brand Score', value: '82%', color: C.green, icon: '🔍' },
                  { label: 'AI Gens MTD', value: '147', color: C.accent, icon: '⚡' },
                  { label: 'Campaigns', value: '3', color: C.tuscany, icon: '📣' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, fontFamily: C.font }}>{stat.value}</div>
                    <div style={{ fontSize: 9.5, color: C.t40, fontFamily: C.font, marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
                <div style={{ gridColumn: 'span 3', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.white, fontFamily: C.font, marginBottom: 4 }}>Brand OS Journey</div>
                    <div style={{ height: 5, width: 200, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '66%', background: `linear-gradient(90deg, ${C.crimson}, ${C.accent})`, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 10, color: C.t40, fontFamily: C.font, marginTop: 4 }}>4 of 6 steps complete</div>
                  </div>
                  <div style={{ fontSize: 10.5, color: C.accent, fontWeight: 600, fontFamily: C.font, cursor: 'pointer' }}>Continue →</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Marquee ──────────────────────────────────────────────────
const MARQUEE_ITEMS = ['Brand Audit', 'Brand Memory', 'Strategic OS', 'Content Studio', 'Campaign Builder', 'Identity Studio', 'Offer Builder', 'Media Studio', 'Prompt Hub', 'Brand Kit Export', 'CRM Suite', 'Launch Planner']

function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div style={{ overflow: 'hidden', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '14px 0', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(90deg, ${C.bg}, transparent)`, zIndex: 1 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: `linear-gradient(270deg, ${C.bg}, transparent)`, zIndex: 1 }} />
      <div style={{ display: 'flex', animation: 'marquee-l 30s linear infinite', width: 'max-content' }}>
        {doubled.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 28px', flexShrink: 0, borderRight: `1px solid ${C.border}` }}>
            <span style={{ color: C.accent, fontSize: 14 }}>✦</span>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: C.t40, fontFamily: C.font, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Features ─────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'memory',
    label: 'Brand Memory',
    icon: '🧠',
    headline: 'The AI knows your brand. Every generation, every time.',
    body: 'Brand Memory stores your voice, audience, offers, and strategy. Every tool on the platform draws from it automatically. No more prompting from scratch. No more off-brand output.',
    tags: ['Voice & Tone', 'Audience Data', 'Offer Details', 'Visual Preferences'],
    color: 'var(--cth-admin-ruby)',
  },
  {
    id: 'audit',
    label: 'Brand Audit',
    icon: '🔍',
    headline: 'Your brand score in 4 minutes. Free.',
    body: 'Run a diagnostic across 6 brand dimensions and get a priority action plan. The audit seeds your Brand Memory and sets the foundation for everything else. No credit card required.',
    tags: ['Brand Foundation', 'Content Library', 'Offer Suite', 'Launch Readiness'],
    color: 'var(--cth-brand-primary)',
  },
  {
    id: 'os',
    label: 'Strategic OS',
    icon: '⚙️',
    headline: 'A 9-step strategy engine, not a template.',
    body: 'Move through Audience Psychology, Differentiation, Content Pillars, Platform Strategy, and Monetization — each step informed by your Brand Memory and carrying context forward.',
    tags: ['Sequential Steps', 'Context Lock', 'Brand-Aware AI', 'Export Ready'],
    color: 'var(--cth-admin-accent)',
  },
  {
    id: 'content',
    label: 'Content Studio',
    icon: '✍️',
    headline: 'Content that sounds like you — not like AI.',
    body: 'Every caption, email, sales page, and hook is generated using your Brand Memory. You get output that actually reflects your voice, your audience, and your transformation.',
    tags: ['Social Posts', 'Email Copy', 'Sales Pages', 'Campaign Hooks'],
    color: 'var(--cth-brand-secondary)',
  },
]

function Features() {
  const [active, setActive] = useState(0)
  const feature = FEATURES[active]

  return (
    <section id="features" style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
        <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: C.font }}>Platform Features</span>
        <h2 style={{ fontFamily: C.serif, fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 700, color: C.white, margin: '16px 0 0', lineHeight: 1.15 }}>
          Everything connects.<br />Nothing is a silo.
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Tab list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FEATURES.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setActive(i)}
              className={`feature-tab ${i === active ? 'active' : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 12, border: '1px solid ' + (i === active ? 'rgba(224,78,53,0.3)' : C.border),
                background: i === active ? 'rgba(224,78,53,0.08)' : C.t04,
                cursor: 'pointer', textAlign: 'left', fontFamily: C.font,
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
              <span style={{ fontSize: 13.5, fontWeight: i === active ? 700 : 500, color: i === active ? C.white : C.t60 }}>{f.label}</span>
              {i === active && <span style={{ marginLeft: 'auto', color: C.accent, fontSize: 16 }}>→</span>}
            </button>
          ))}
        </div>

        {/* Feature detail */}
        <div key={feature.id} style={{
          background: C.t04, border: `1px solid ${C.border}`, borderRadius: 18,
          padding: '36px 40px', position: 'relative', overflow: 'hidden',
          animation: 'slide-in 0.3s ease',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${feature.color}18 0%, transparent 70%)` }} />

          <div style={{ fontSize: 40, marginBottom: 20 }}>{feature.icon}</div>
          <h3 style={{ fontFamily: C.serif, fontSize: 28, fontWeight: 700, color: C.white, marginBottom: 16, lineHeight: 1.2 }}>
            {feature.headline}
          </h3>
          <p style={{ fontSize: 15, color: C.t60, lineHeight: 1.8, marginBottom: 28 }}>{feature.body}</p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {feature.tags.map(tag => (
              <span key={tag} style={{ fontSize: 11, fontWeight: 500, color: C.t60, background: C.t08, padding: '5px 12px', borderRadius: 20, fontFamily: C.font, border: '1px solid ' + C.border }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats ────────────────────────────────────────────────────
const STATS = [
  { label: 'Brand-building modules', value: 12, suffix: '+', sub: 'in one platform' },
  { label: 'Content types generated', value: 23, suffix: '+', sub: 'by Brand Memory' },
  { label: 'Personalized to your brand', value: 100, suffix: '%', sub: 'not generic AI copy' },
  { label: 'Minutes to seed Brand Memory', value: 5, suffix: '', sub: 'and unlock everything' },
]

function StatItem({ stat, delay }) {
  const [count, ref] = useCounter(stat.value)
  return (
    <div ref={ref} className={`reveal reveal-delay-${delay}`} style={{ textAlign: 'center' }}>
      <p style={{ fontFamily: C.serif, fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, color: C.accent, lineHeight: 1, marginBottom: 8 }}>
        {count}{stat.suffix}
      </p>
      <p style={{ fontSize: 13, fontWeight: 600, color: C.t70, fontFamily: C.font, marginBottom: 4 }}>{stat.label}</p>
      <p style={{ fontSize: 11, color: C.t40, fontFamily: C.font }}>{stat.sub}</p>
    </div>
  )
}

function StatsSection() {
  return (
    <section style={{ padding: '80px 24px', background: 'rgba(175,0,36,0.04)', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
        {STATS.map((stat, i) => (
          <StatItem key={stat.label} stat={stat} delay={i + 1} />
        ))}
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────
const STEPS = [
  { n: '01', title: 'Run your Brand Audit', body: 'Free diagnostic in 4 minutes. Scores your brand across 6 dimensions and seeds your Brand Memory with your first 8 data points.', icon: '🔍' },
  { n: '02', title: 'Build your Brand Memory', body: 'The AI\'s knowledge base for your brand. Voice, audience, offers, goals. Every generation on the platform draws from this.', icon: '🧠' },
  { n: '03', title: 'Run your Strategic OS', body: '9 sequential strategy steps from Audience Psychology through Monetization. Each step carries context forward.', icon: '⚙️' },
  { n: '04', title: 'Generate aligned content', body: 'Content Studio, Campaign Builder, Media Studio — every tool generates using Brand Memory. It sounds like you.', icon: '✍️' },
  { n: '05', title: 'Export and launch', body: 'Download your brand kit, campaigns, and strategic plan. Your Brand OS is now a running system, not a one-time project.', icon: '🚀' },
]

function HowItWorks() {
  return (
    <section style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: 70 }}>
        <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: C.font }}>How It Works</span>
        <h2 style={{ fontFamily: C.serif, fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, color: C.white, margin: '16px 0 0', lineHeight: 1.2 }}>
          From audit to activated<br />Brand OS in 6 steps.
        </h2>
      </div>

      <div style={{ position: 'relative' }}>
        {/* Vertical connector line */}
        <div style={{ position: 'absolute', left: 27, top: 40, bottom: 40, width: 1, background: `linear-gradient(to bottom, transparent, ${C.accent}40, ${C.accent}40, transparent)` }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((step, i) => (
            <div key={step.n} className={`reveal reveal-delay-${(i % 4) + 1}`} style={{ display: 'flex', gap: 32, alignItems: 'flex-start', padding: '24px 0' }}>
              {/* Number circle */}
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${C.crimson}, ${C.purple})`, border: '2px solid rgba(224,78,53,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, boxShadow: '0 4px 20px rgba(175,0,36,0.3)' }}>
                <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: C.tuscany }}>{step.n}</span>
              </div>

              {/* Content */}
              <div style={{ paddingTop: 12, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{step.icon}</span>
                  <h3 style={{ fontFamily: C.font, fontSize: 18, fontWeight: 700, color: C.white, margin: 0 }}>{step.title}</h3>
                </div>
                <p style={{ fontSize: 14, color: C.t50, lineHeight: 1.7, maxWidth: 560, margin: 0 }}>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────
const TESTIMONIALS = [
  { quote: "I have been piecing my brand together for two years. Core Truth House gave me the structure I did not know I was missing. The messaging finally makes sense.", name: 'Maya J.', title: 'Brand Strategist', tier: 'The Structure' },
  { quote: "The Brand Memory is unlike anything I have seen. Every piece of content it generates actually sounds like me. Not like a robot trying to sound like me.", name: 'David A.', title: 'Business Coach', tier: 'The House' },
  { quote: "My clients used to get a PDF strategy doc. Now I hand them an entire brand operating system. Core Truth House changed what I can deliver.", name: 'Sofia M.', title: 'Agency Owner', tier: 'The Estate' },
  { quote: "I went from no brand clarity to a fully documented Brand Foundation in one afternoon. The audit alone was worth more than the subscription.", name: 'Kiran T.', title: 'Consultant', tier: 'The Foundation' },
]

function Testimonials() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setIdx(p => (p + 1) % TESTIMONIALS.length), 4500)
    return () => clearInterval(timer)
  }, [])

  const t = TESTIMONIALS[idx]

  return (
    <section style={{ padding: '100px 24px', background: `linear-gradient(135deg, rgba(51,3,60,0.3) 0%, rgba(13,0,16,0.8) 100%)`, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div className="reveal" style={{ marginBottom: 56 }}>
          <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: C.font }}>What Founders Say</span>
        </div>

        <div key={idx} style={{ animation: 'slide-in 0.4s ease' }}>
          <div style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '48px 56px', backdropFilter: 'blur(10px)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ position: 'absolute', top: 28, left: 40, fontSize: 60, color: C.accent, opacity: 0.15, fontFamily: C.serif, lineHeight: 1 }}>"</div>

            <p style={{ fontFamily: C.serif, fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', fontStyle: 'italic', color: C.t80, lineHeight: 1.7, marginBottom: 32, position: 'relative', zIndex: 1 }}>
              "{t.quote}"
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${C.crimson}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.tuscany, fontFamily: C.font }}>{t.name[0]}</span>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.white, margin: 0, fontFamily: C.font }}>{t.name}</p>
                <p style={{ fontSize: 12, color: C.t50, margin: 0, fontFamily: C.font }}>{t.title} · <span style={{ color: C.accent }}>{t.tier}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 24 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', background: i === idx ? C.accent : 'rgba(255,255,255,0.2)', transition: 'all 0.3s', padding: 0 }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ─────────────────────────────────────────────────
const PLANS = [
  { name: 'The Foundation', price: '$47', sub: '/month', tag: null, desc: 'For founders who need clarity before complexity.', features: ['Brand Foundation Builder', 'Audience clarity tools', 'Positioning generator', 'Basic Content Studio', '30 AI generations/mo', '1 workspace'], cta: 'Start with Foundation', featured: false },
  { name: 'The Structure', price: '$97', sub: '/month', tag: 'Most Popular', desc: 'For founders building a working brand system.', features: ['Everything in Foundation', 'Systems Builder + SOPs', 'Offer Builder', 'Advanced Content Studio', 'Saved Brand Memory', '150 AI generations/mo', '3 workspaces'], cta: 'Choose The Structure', featured: true },
  { name: 'The House', price: '$197', sub: '/month', tag: null, desc: 'For founders building a full brand ecosystem.', features: ['Everything in Structure', 'Identity Studio', 'Launch Planner', 'Full Brand Kit Export', 'Custom Domain', '400 AI generations/mo', '5 workspaces'], cta: 'Enter The House', featured: false },
  { name: 'The Estate', price: '$397', sub: '/month', tag: null, desc: 'For agencies, teams, and multi-brand builders.', features: ['Everything in The House', '10 brand workspaces', 'Team seats', 'Client brand vaults', 'White-label exports', 'Unlimited generations', 'Priority support'], cta: 'Upgrade to Estate', featured: false },
]

function Pricing() {
  return (
    <section id="pricing" style={{ padding: '100px 24px' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
        <span style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: C.font }}>Pricing</span>
        <h2 style={{ fontFamily: C.serif, fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 700, color: C.white, margin: '16px 0 12px', lineHeight: 1.2 }}>
          One platform. Four tiers.
        </h2>
        <p style={{ fontSize: 15, color: C.t50, fontFamily: C.font }}>Start free with the Brand Audit. Upgrade when you're ready to build.</p>
      </div>

      <div style={{ maxWidth: 1150, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {PLANS.map((plan, i) => (
          <div
            key={plan.name}
            className={`reveal reveal-delay-${i + 1} pricing-card${plan.featured ? ' featured' : ''}`}
            style={{
              background: plan.featured ? 'rgba(224,78,53,0.06)' : C.t04,
              border: plan.featured ? '1px solid rgba(224,78,53,0.3)' : `1px solid ${C.border}`,
              borderRadius: 18,
              padding: '28px 24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {plan.tag && (
              <div style={{ position: 'absolute', top: 0, right: 0, background: `linear-gradient(135deg, ${C.crimson}, ${C.accent})`, color: C.white, fontSize: 10, fontWeight: 700, padding: '4px 14px', borderRadius: '0 18px 0 12px', fontFamily: C.font, letterSpacing: '0.06em' }}>
                {plan.tag}
              </div>
            )}

            {plan.featured && <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,78,53,0.15) 0%, transparent 70%)' }} />}

            <h3 style={{ fontFamily: C.serif, fontSize: 18, fontWeight: 700, color: C.white, marginBottom: 6 }}>{plan.name}</h3>
            <p style={{ fontSize: 11, color: C.t40, fontFamily: C.font, marginBottom: 20 }}>{plan.desc}</p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 24 }}>
              <span style={{ fontFamily: C.serif, fontSize: 38, fontWeight: 900, color: plan.featured ? C.accent : C.white }}>{plan.price}</span>
              <span style={{ fontSize: 12, color: C.t40, fontFamily: C.font }}>{plan.sub}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: plan.featured ? C.accent : C.green, fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 12, color: C.t60, fontFamily: C.font, lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>

            <Link to="/sign-up" style={{
              display: 'block', textAlign: 'center', textDecoration: 'none',
              padding: '11px', borderRadius: 10, fontFamily: C.font,
              fontSize: 13, fontWeight: 700,
              background: plan.featured ? `linear-gradient(135deg, ${C.accent}, ${C.crimson})` : 'rgba(255,255,255,0.06)',
              color: plan.featured ? C.white : C.t70,
              border: plan.featured ? 'none' : `1px solid ${C.border}`,
              boxShadow: plan.featured ? '0 4px 20px rgba(224,78,53,0.3)' : 'none',
            }}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────
const FAQS = [
  { q: "What makes Core Truth House different?", a: "Most tools help you create a look. CTH OS builds a structured brand ecosystem — foundation before visuals, strategy before content. The Brand Memory engine ensures every AI generation is personalized to your specific brand, not generic output." },
  { q: "What is Brand Memory?", a: "Brand Memory is the intelligence layer at the core of the platform. It stores your niche, audience, tone, offers, and messaging pillars. Every AI generation automatically draws from Brand Memory — so outputs always sound like your brand." },
  { q: "Do I need to be tech-savvy?", a: "Not at all. The platform walks you through a guided Brand Audit and intake on day one. After that, every module is step-by-step. If you can answer questions about your business, you can build your brand here." },
  { q: "Can I use this for client work?", a: "Yes. The Structure tier and above support multiple workspaces. The Estate tier includes team seats, client brand vaults, collaboration tools, and white-label exports — built for agencies serving multiple clients." },
  { q: "Will the AI content sound like me?", a: "That is the core premise. When Brand Memory is 80%+ complete, every generation draws from your specific voice, audience, and transformation. It doesn't sound like generic AI — it sounds like you." },
]

function FAQ() {
  const [open, setOpen] = useState(null)
  return (
    <section style={{ padding: '80px 24px', maxWidth: 780, margin: '0 auto' }}>
      <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{ fontFamily: C.serif, fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 700, color: C.white }}>Frequently asked</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className="reveal"
            style={{ background: C.t04, border: `1px solid ${open === i ? 'rgba(224,78,53,0.25)' : C.border}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 600, color: C.white, fontFamily: C.font }}>{faq.q}</span>
              <span style={{ color: C.accent, fontSize: 20, transition: 'transform 0.2s', transform: open === i ? 'rotate(45deg)' : 'none', flexShrink: 0, marginLeft: 16 }}>+</span>
            </button>
            {open === i && (
              <div style={{ padding: '0 22px 18px', animation: 'slide-in 0.2s ease' }}>
                <p style={{ fontSize: 13.5, color: C.t60, lineHeight: 1.75, fontFamily: C.font, margin: 0 }}>{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(175,0,36,0.12), rgba(51,3,60,0.2), rgba(13,0,16,0.9))` }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(224,78,53,0.15) 0%, transparent 70%)', animation: 'glow-pulse 4s ease-in-out infinite' }} />

      <div className="reveal" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontFamily: C.serif, fontSize: 'clamp(2rem, 5vw, 3.8rem)', fontWeight: 900, color: C.white, lineHeight: 1.1, marginBottom: 20 }}>
          Your brand deserves<br />
          <em style={{ color: C.accent, fontStyle: 'italic' }}>infrastructure.</em>
        </h2>
        <p style={{ fontSize: 16, color: C.t60, fontFamily: C.font, lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
          Start with a free Brand Audit. No credit card. No setup. Just a diagnostic that shows you exactly what your brand needs.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/sign-up" className="btn-primary" style={{ fontSize: 16, padding: '16px 36px' }}>
            Run your free Brand Audit →
          </Link>
        </div>
        <p style={{ fontSize: 12, color: C.t30, fontFamily: C.font, marginTop: 20 }}>Free forever · No credit card · Takes 4 minutes</p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, padding: '48px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 16 }}>
            <img src="/cth-logo.png" alt="CTH" style={{ height: 26 }} />
            <span style={{ fontFamily: C.serif, fontSize: 14, color: C.white, fontWeight: 700 }}>Core Truth House</span>
          </Link>
          <p style={{ fontSize: 12, color: C.t40, lineHeight: 1.7, fontFamily: C.font }}>The AI-powered brand operating system for serious founders.</p>
        </div>
        {[
          { heading: 'Platform', links: [['Brand Audit', '/brand-audit'], ['Brand Intelligence', '/brand-intelligence'], ['Strategic OS', '/strategic-os'], ['Content Studio', '/content-studio']] },
          { heading: 'Resources', links: [['Blog', '/blog'], ['Store', '/store'], ['Training Videos', '/training-videos'], ['Help Center', '/help']] },
          { heading: 'Company', links: [['About', '/about'], ['Terms of Service', '/terms'], ['Privacy Policy', '/privacy'], ['Contact', '/contact']] },
        ].map(col => (
          <div key={col.heading}>
            <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.t30, marginBottom: 14, fontFamily: C.font }}>{col.heading}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.links.map(([label, href]) => (
                <Link key={label} to={href} style={{ fontSize: 13, color: C.t50, textDecoration: 'none', fontFamily: C.font, transition: 'color 0.2s' }}
                  onMouseEnter={e => { e.target.style.color = C.white }}
                  onMouseLeave={e => { e.target.style.color = C.t50 }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 1200, margin: '40px auto 0', paddingTop: 24, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, color: C.t30, fontFamily: C.font }}>© 2026 Core Truth House Ltd. All rights reserved.</p>
        <p style={{ fontSize: 12, color: C.t30, fontFamily: C.font }}>Wyoming, United States · support@coretruthhouse.com</p>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function LandingPage() {
  useReveal()

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div style={{ background: C.bg, minHeight: '100vh' }}>
        <Nav />
        <Hero />
        <Marquee />
        <Features />
        <StatsSection />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </>
  )
}
