import React from 'react';
import { Link } from 'react-router-dom';

// OFFICIAL BRAND FOUNDATION — LOCKED March 13, 2026
const BRAND_FOUNDATION = {
  vision: "A world where every serious founder stops guessing and starts building on a foundation of truth where strategy comes before aesthetics, systems come before scale, and the brands that last are not the ones with the biggest budgets. They are the ones built the deepest.",
  mission: "We help founders build the brand behind the business the strategy, systems, and clarity that make everything they create compound over time.",
  heroHeadline: "Build the brand behind the business before you build the brand the world sees.",
  valueProp: "Build the strategy, systems, and content behind a brand that actually grows.",
  brandVoice: "Authoritative. Calm. Precise. Warm sophistication. Never academic. Never loud. Always specific.",
};

// Core Principles
const PRINCIPLES = [
  {
    number: "01",
    title: "Strategy before aesthetics.",
    body: "A logo without a strategy is decoration. Every visual decision we help you make is rooted in who you are, who you serve, and what you stand for not what looks good this season.",
  },
  {
    number: "02",
    title: "Systems before scale.",
    body: "You cannot scale what is not stable. Before we help you grow your reach, we help you build the systems, offers, and operations that make growth sustainable instead of chaotic.",
  },
  {
    number: "03",
    title: "Foundation before visibility.",
    body: "Most marketing fails because the message has not been built yet. When your messaging is clear, consistent, and anchored in truth, marketing becomes amplification not guesswork.",
  },
  {
    number: "04",
    title: "Truth before trend.",
    body: "Content without a content system creates burnout, not brands. We build the production architecture first so every piece you create is strategic, reusable, and aligned to an offer.",
  },
  {
    number: "05",
    title: "Depth before reach.",
    body: "Chasing followers without a foundation is vanity. We build the substance first — the offers, the systems, the messaging so that when you grow, you grow something worth following.",
  },
  {
    number: "06",
    title: "Clarity before complexity.",
    body: "The brands that last are not the ones with the most features. They are the ones with the clearest point of view. We strip away the noise until what remains is undeniably you.",
  },
];

const METHODOLOGY_STEPS = [
  {
    label: "The Truth Layer",
    description: "Start with what is real. Your mission, your values, your story, your audience, your positioning. This is the brand beneath the brand.",
  },
  {
    label: "The Structure Layer",
    description: "Build the systems that support consistent delivery. Client journeys, workflows, SOPs, offer architecture. The invisible infrastructure every high-performing brand runs on.",
  },
  {
    label: "The Identity Layer",
    description: "Define your visual and verbal language from the inside out. Voice settings, aesthetic direction, color strategy all derived from your foundation, not chosen from a trend board.",
  },
  {
    label: "The Content Layer",
    description: "Generate strategic content across every channel using Brand Memory AI that knows your brand, sounds like you, and serves your specific offers and audience.",
  },
  {
    label: "The Launch Layer",
    description: "Execute with precision. Launch plans, go-live checklists, KPI trackers, and post-launch optimization — built around your specific offer and readiness level.",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-[var(--cth-surface-deep)] min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[var(--cth-surface-deep)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/cth-logo.png" alt="Core Truth House" className="h-10 w-auto object-contain" />
            <div className="leading-none">
              <span className="font-display text-sm font-bold text-white">Core Truth </span>
              <span className="font-display text-sm font-bold text-[var(--cth-admin-accent)]">House</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-[var(--cth-admin-muted)] hover:text-white transition-colors">Home</Link>
            <Link to="/#pricing" className="text-sm text-[var(--cth-admin-muted)] hover:text-white transition-colors">Pricing</Link>
            <Link
              to="/sign-up"
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))", boxShadow: "0 4px 16px rgba(224,78,53,0.35)" }}
            >
              Start Building
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-[0.08]" style={{ background: "radial-gradient(circle, var(--cth-brand-primary-soft) 0%, transparent 70%)" }} />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, var(--cth-admin-accent) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(224,78,53,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(224,78,53,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(224,78,53,0.3)] bg-[rgba(224,78,53,0.06)] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cth-admin-accent)] animate-pulse" />
            <span className="text-xs text-[var(--cth-admin-accent)] font-medium tracking-wider uppercase">About Core Truth House</span>
          </div>

          <h1 className="font-display font-bold text-white leading-[1.1] mb-8" style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)" }}>
            {BRAND_FOUNDATION.heroHeadline.split(' before ')[0]}
            <br />
            <span style={{ color: "var(--cth-admin-accent)", textShadow: "0 0 40px rgba(224,78,53,0.3)" }}>
              before you build the brand the world sees.
            </span>
          </h1>

          <p className="text-[var(--cth-admin-muted)] leading-relaxed max-w-2xl mx-auto mb-8" style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)" }}>
            {BRAND_FOUNDATION.valueProp}
          </p>
          
          <p className="text-[var(--cth-admin-ruby)] text-sm italic max-w-xl mx-auto">
            {BRAND_FOUNDATION.brandVoice}
          </p>
        </div>
      </section>

      {/* Vision & Mission — Official Source of Truth */}
      <section className="py-20 bg-[var(--cth-brand-primary-deep)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Vision */}
            <div className="p-8 rounded-2xl border border-[rgba(224,78,53,0.2)] bg-[rgba(51,3,60,0.3)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--cth-admin-accent)]" />
                <span className="text-xs text-[var(--cth-admin-accent)] uppercase tracking-widest font-semibold">Vision</span>
              </div>
              <p className="font-display text-white leading-relaxed text-lg">
                "{BRAND_FOUNDATION.vision}"
              </p>
            </div>
            
            {/* Mission */}
            <div className="p-8 rounded-2xl border border-[rgba(118,59,91,0.3)] bg-[rgba(118,59,91,0.1)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[var(--cth-admin-ruby)]" />
                <span className="text-xs text-[var(--cth-admin-ruby)] uppercase tracking-widest font-semibold">Mission</span>
              </div>
              <p className="font-display text-white leading-relaxed text-lg">
                "{BRAND_FOUNDATION.mission}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Origin */}
      <section className="py-24 bg-[var(--cth-surface-midnight)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs text-[var(--cth-admin-accent)] uppercase tracking-widest font-medium mb-4">Why Core Truth House Exists</p>
              <h2 className="font-display font-bold text-white leading-tight mb-6" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
                The problem was never creativity.
                <br />
                <span className="text-[var(--cth-admin-ruby)]">It was always infrastructure.</span>
              </h2>
              <p className="text-[var(--cth-admin-muted)] leading-relaxed mb-5">
                Talented entrepreneurs were failing to build recognizable, profitable brands
                not because they lacked ideas — but because they had no system
                for translating those ideas into strategy, structure, and consistent execution.
              </p>
              <p className="text-[var(--cth-admin-muted)] leading-relaxed mb-5">
                They had content calendars without positioning. Offers without architecture.
                Visuals without voice. Marketing without messaging. Every layer existed
                in isolation, disconnected from a coherent brand foundation.
              </p>
              <p className="text-[var(--cth-admin-muted)] leading-relaxed">
                Core Truth House was built to solve exactly that. Not another branding tool.
                A complete Brand Operating System — designed to build every layer of your brand
                in the right sequence, connected by an intelligence layer that makes sure
                everything you create sounds, feels, and performs like one unified brand.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: "What most brands do", items: ["Logo first", "Colors next", "Post some content", "Run ads", "Wonder why nothing converts"], bad: true },
                { label: "What Core Truth House builds", items: ["Foundation first", "Systems next", "Offers with architecture", "Content from strategy", "Launch with a plan"], bad: false },
              ].map((col, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border"
                  style={{
                    background: col.bad ? "rgba(139,0,0,0.06)" : "rgba(224,78,53,0.07)",
                    borderColor: col.bad ? "rgba(139,0,0,0.2)" : "rgba(224,78,53,0.25)",
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: col.bad ? "var(--cth-brand-primary)" : "var(--cth-admin-accent)" }}>
                    {col.label}
                  </p>
                  <div className="space-y-2">
                    {col.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-3 text-sm">
                        <span style={{ color: col.bad ? "var(--cth-brand-primary)" : "var(--cth-admin-accent)", fontSize: "10px" }}>
                          {col.bad ? "✕" : "✓"}
                        </span>
                        <span style={{ color: col.bad ? "var(--cth-admin-ruby)" : "var(--cth-admin-muted)" }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-28 bg-[var(--cth-surface-deep)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs text-[var(--cth-admin-accent)] uppercase tracking-widest font-medium mb-4">The Operating Philosophy</p>
            <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
              Six principles that govern everything we build.
            </h2>
            <p className="text-[var(--cth-admin-muted)] max-w-xl mx-auto">
              These are not preferences. They are the structural beliefs behind
              every module, every generator, every framework on this platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRINCIPLES.map((p) => (
              <div
                key={p.number}
                className="relative p-7 rounded-2xl border border-white/5 bg-[var(--cth-admin-ink)] group hover:border-[rgba(224,78,53,0.3)] transition-all duration-300"
              >
                <div className="absolute top-5 right-5 font-display font-bold leading-none select-none" style={{ fontSize: "3.5rem", color: "rgba(224,78,53,0.06)" }}>
                  {p.number}
                </div>
                <div className="text-sm font-bold mb-1" style={{ color: "var(--cth-admin-accent)", fontFamily: "monospace" }}>
                  {p.number}
                </div>
                <h3 className="font-display font-semibold text-white text-base mb-3 leading-snug">{p.title}</h3>
                <p className="text-sm text-[var(--cth-admin-muted)] leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-28 bg-[var(--cth-surface-midnight)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="md:sticky md:top-24">
              <p className="text-xs text-[var(--cth-admin-accent)] uppercase tracking-widest font-medium mb-4">The Methodology</p>
              <h2 className="font-display font-bold text-white leading-tight mb-6" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
                The Brand Operating System.
                <br />
                <span className="text-[var(--cth-admin-ruby)]">Five layers. One connected system.</span>
              </h2>
              <p className="text-[var(--cth-admin-muted)] leading-relaxed mb-6">
                The Core Truth House methodology is not a checklist. It is a layered
                build process where each stage creates the foundation for the next.
                You cannot skip layers. You can only build them in sequence.
              </p>
              <p className="text-[var(--cth-admin-muted)] leading-relaxed mb-8">
                What makes it different from every other branding framework is
                Brand Memory — a persistent intelligence layer that stores everything
                your brand is, and injects that context into every AI generation
                on the platform. The further you build, the more intelligent
                every output becomes.
              </p>

              <div className="p-5 rounded-2xl border" style={{ background: "rgba(224,78,53,0.06)", borderColor: "rgba(224,78,53,0.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[var(--cth-admin-accent)] text-sm">◐</span>
                  <span className="text-xs text-[var(--cth-admin-accent)] uppercase tracking-widest font-medium">Powered by Brand Memory</span>
                </div>
                <p className="text-sm text-[var(--cth-admin-muted)] leading-relaxed">
                  Every module feeds Brand Memory. Every generation draws from it.
                  The platform gets smarter the more you build — and every output
                  reflects your exact brand, not a generic AI response.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {METHODOLOGY_STEPS.map((step, i) => (
                <div key={i} className="flex gap-5 p-6 rounded-2xl border border-white/5 bg-[var(--cth-admin-ink)]">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))" }}>
                      {i + 1}
                    </div>
                    {i < METHODOLOGY_STEPS.length - 1 && (
                      <div className="w-px flex-1 mt-2 min-h-[24px]" style={{ background: "rgba(224,78,53,0.2)" }} />
                    )}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-display font-semibold text-white text-base mb-2">{step.label}</h3>
                    <p className="text-sm text-[var(--cth-admin-muted)] leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Mission */}
      <section className="py-28 bg-[var(--cth-surface-deep)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(51,3,60,0.4) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs text-[var(--cth-admin-accent)] uppercase tracking-widest font-medium mb-6">The Mission</p>
          <blockquote className="font-display font-bold text-white leading-tight mb-8" style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)" }}>
            "To give every ambitious entrepreneur the brand infrastructure
            that was once only accessible to businesses with{" "}
            <em className="not-italic" style={{ color: "var(--cth-admin-accent)" }}>agencies and big budgets.</em>"
          </blockquote>
          <p className="text-[var(--cth-admin-muted)] leading-relaxed max-w-2xl mx-auto text-lg mb-6">
            Brand strategy, systems architecture, offer development, visual identity,
            content production, and launch infrastructure — all in one platform,
            powered by AI that knows your brand.
          </p>
          <p className="text-[var(--cth-admin-ruby)] leading-relaxed max-w-xl mx-auto">
            Not for everyone. Built for the founders who are done guessing,
            done starting over, and ready to build something that holds.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 bg-[var(--cth-surface-midnight)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at bottom center, rgba(224,78,53,0.08) 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="w-14 h-14 mx-auto mb-8 rounded-2xl flex items-center justify-center text-xl" style={{ background: "linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))", boxShadow: "0 0 32px rgba(224,78,53,0.35)" }}>
            ⌂
          </div>

          <h2 className="font-display font-bold text-white mb-5 leading-tight" style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)" }}>
            The brand you have been trying to build
            <br />
            <span style={{ color: "var(--cth-admin-accent)" }}>has always been inside the business.</span>
          </h2>

          <p className="text-[var(--cth-admin-muted)] mb-10 leading-relaxed text-lg max-w-xl mx-auto">
            Core Truth House helps you find it, structure it, and build it
            into a system that works without you constantly reinventing it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/sign-up"
              className="px-10 py-4 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))", boxShadow: "0 8px 32px rgba(224,78,53,0.4)" }}
            >
              Start Building Your Brand
            </Link>
            <a
              href="/#pricing"
              className="px-10 py-4 rounded-2xl text-[var(--cth-admin-muted)] font-medium text-base border border-white/10 hover:border-[rgba(224,78,53,0.4)] hover:text-white transition-all"
            >
              View Pricing
            </a>
          </div>

          <p className="text-xs text-[var(--cth-admin-muted)]">
            Free audit available. Paid plans start at $47/month. No contracts.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[var(--cth-surface-deep)] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs" style={{ background: "linear-gradient(135deg, var(--cth-admin-accent), var(--cth-brand-primary))" }}>
              ⌂
            </div>
            <span className="font-display text-sm font-bold text-[var(--cth-admin-ruby)]">Core Truth House</span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Home", href: "/" },
              { label: "Pricing", href: "/#pricing" },
              { label: "Contact", href: "/contact" },
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ].map((item) => (
              <Link key={item.label} to={item.href} className="text-xs text-[var(--cth-admin-muted)] hover:text-[var(--cth-admin-muted)] transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-[var(--cth-admin-muted)]">
            © {new Date().getFullYear()} Core Truth House. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
