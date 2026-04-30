import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

const pillars = [
 {
 title: "Clarity",
 body: "Discover who you are. Focus what matters most.",
 icon: "✦",
 asset: "/brand-assets/cards/clarity.png",
 },
 {
 title: "Structure",
 body: "Build your foundation. Turn chaos into alignment and stability.",
 icon: "◫",
 asset: "/brand-assets/cards/structure.png",
 },
 {
 title: "Execution",
 body: "Move with focus. Turn strategy into real momentum.",
 icon: "➚",
 asset: "/brand-assets/cards/execution.png",
 },
 {
 title: "Optimization",
 body: "Refine, elevate, and continuously achieve impact.",
 icon: "↗",
 asset: "/brand-assets/cards/optimization.png",
 },
];

const platformCards = [
 { title: "Demo Mode", body: "Preview how the House works.", icon: "◎", href: "/demo-mode", asset: "/brand-assets/cards/command-center.png" },
 { title: "Foundation", body: "Define your truth and positioning.", icon: "▥", href: "/brand-foundation", asset: "/brand-assets/cards/foundation.png" },
 { title: "Structure", body: "Build your brand system.", icon: "⌘", href: "/systems-builder", asset: "/brand-assets/cards/structure.png" },
 { title: "Execution", body: "Plan, create, and launch.", icon: "➤", href: "/content-studio", asset: "/brand-assets/cards/execution.png" },
 { title: "Insights", body: "Data-driven decisions.", icon: "◷", href: "/analytics", asset: "/brand-assets/cards/insights.png" },
 { title: "Library", body: "Resources and templates.", icon: "▤", href: "/documents", asset: "/brand-assets/cards/library.png" },
 { title: "Help", body: "Guidance and support.", icon: "☏", href: "/help" },
];

const pricingPlans = [
 {
 name: "Foundation",
 price: "$47/month",
 description: "Clarify the brand before building more content, offers, or campaigns.",
 features: [
 "Brand Foundation Builder",
 "Audience Clarity Tool",
 "Positioning Generator",
 "Content Studio Basics",
 ],
 cta: "Start Diagnostic",
 href: "/brand-diagnostic/",
 },
 {
 name: "Structure",
 price: "$97/month",
 description: "Turn clarity into a repeatable operating structure for offers, systems, and decisions.",
 features: [
 "Systems Builder and SOPs",
 "Offer Builder Guide",
 "Saved Brand Memory",
 "Decision Rules Framework",
 ],
 cta: "Start Diagnostic",
 href: "/brand-diagnostic/",
 featured: true,
 },
 {
 name: "House",
 price: "$197/month",
 description: "Package the brand identity, plan launches, and export stronger brand assets.",
 features: [
 "Identity Studio Guide",
 "Launch Planner",
 "Brand Kit Export",
 ],
 cta: "Start Diagnostic",
 href: "/brand-diagnostic/",
 },
 {
 name: "Estate",
 price: "$397/month",
 description: "Build a larger brand ecosystem with team access, client vaults, and white-label delivery.",
 features: [
 "Team Seats Setup",
 "Client Brand Vaults",
 "White-Label Exports",
 ],
 cta: "Start Diagnostic",
 href: "/brand-diagnostic/",
 },
];


const homepageArcCards = [
 {
 eyebrow: "The problem",
 title: "You are showing up, but the brand still feels harder to sell than it should.",
 body:
 "You have content, offers, experience, and visibility. The gap is not effort. The gap is structure: your positioning, message, offer path, content, and sales story are not operating from the same source of truth.",
 },
 {
 eyebrow: "The shift",
 title: "Core Truth House turns scattered decisions into one brand operating system.",
 body:
 "The system helps you diagnose what is missing, define the foundation, store your brand decisions, and use that structure across content, offers, sales pages, funnels, and execution.",
 },
 {
 eyebrow: "The outcome",
 title: "The brand becomes easier to explain, easier to build, and easier to sell.",
 body:
 "Instead of starting over every time you write, launch, or refine your offer, you operate from a connected brand structure that compounds over time.",
 },
];

const brandMemoryDefinition =
 "Brand Memory is the persistent context layer that stores your strategy, voice, audience, offers, and visual identity, so every AI generation across the platform sounds like your brand and not generic GPT output.";

const homepageFaqs = [
 {
 question: "What is a brand operating system?",
 answer:
 "A brand operating system is the connected structure behind your brand. It organizes your positioning, message, audience, offers, content, sales pages, funnels, and decision rules so your brand does not depend on scattered notes or one-off prompts.",
 },
 {
 question: "Who is Core Truth House for?",
 answer:
 "Core Truth House is designed for solo service-based founders who already have content, offers, experience, and some visibility, but need stronger structure so the brand is clearer, more consistent, and easier to sell.",
 },
 {
 question: "How is Core Truth House different from Jasper, ChatGPT prompts, Canva, or StoryBrand?",
 answer:
 "Those tools can help you create individual pieces. Core Truth House is built to hold the structure behind the pieces. It connects your brand foundation, Brand Memory, content, offers, sales assets, and execution path so you are not rebuilding from scratch every time.",
 },
 {
 question: "What is Brand Memory?",
 answer:
 brandMemoryDefinition,
 },
 {
 question: "Why should I start with the Brand Diagnostic?",
 answer:
 "The Brand Diagnostic shows where the structural gaps are before you buy into the system. It helps you see whether the problem is positioning, messaging, offer clarity, audience fit, trust, content consistency, or conversion path.",
 },
 {
 question: "Does Core Truth House replace my strategy, or help me use it better?",
 answer:
 "It helps you use it better. The founder still brings the judgment, taste, proof, and point of view. Core Truth House gives those decisions a structured home so they can guide every asset and action.",
 },
];


function Crest({ compact = false, dark = false }) {
 return (
 <img
 src="/brand-assets/logo/cth-logo-seal.png"
 alt="Core Truth House"
 className={[
 "object-contain",
 compact ? "h-[74px] w-[74px]" : "h-[150px] w-[150px]",
 dark ? "drop-shadow-[0_10px_20px_rgba(51,3,60,0.10)]" : "drop-shadow-[0_18px_35px_rgba(0,0,0,0.18)]",
 ].join(" ")}
 />
 );
}

function HeroDraftMarks({ scrollOffset = 0 }) {
 return (
 <div
 className="pointer-events-none absolute inset-0 overflow-hidden"
 style={{ transform: `translate3d(0, ${scrollOffset * -0.08}px, 0)` }}
 >
 <div className="absolute left-[7%] top-[11%] h-[180px] w-[180px] rounded-full border border-[var(--cth-admin-tuscany)]/35" />
 <div className="absolute left-[11%] top-[16%] h-[110px] w-[110px] rounded-full border border-[var(--cth-admin-tuscany)]/25" />
 <div className="absolute left-[30%] top-[8%] h-px w-[190px] bg-[var(--cth-admin-tuscany)]/28" />
 <div className="absolute left-[5%] top-[44%] h-px w-[260px] bg-[var(--cth-admin-tuscany)]/22" />
 <div className="absolute left-[18%] top-[33%] h-[170px] w-px bg-[var(--cth-admin-tuscany)]/24" />
 <div className="absolute left-[40%] top-[20%] h-[115px] w-px bg-[var(--cth-admin-tuscany)]/18" />
 <div className="absolute left-[13%] top-[63%] h-[88px] w-[240px] border border-[var(--cth-admin-tuscany)]/14" />
 <div className="absolute left-[28%] top-[58%] h-[62px] w-[62px] rounded-full border border-[var(--cth-admin-tuscany)]/22" />
 <div className="absolute left-[36%] top-[46%] h-px w-[120px] bg-[var(--cth-crimson)]/12" />
 <div className="absolute left-[32%] top-[46%] h-[8px] w-[8px] rounded-full bg-[var(--cth-crimson)]/12" />
 <div className="absolute left-[8%] top-[76%] h-px w-[320px] bg-[var(--cth-admin-tuscany)]/18" />
 <div className="absolute left-[10%] top-[75%] h-[22px] w-[22px] rounded-full border border-[var(--cth-admin-tuscany)]/18" />
 </div>
 );
}

function BlueprintArchitecture({ scrollOffset = 0 }) {
 const imageTranslate = Math.min(scrollOffset * 0.08, 40);
 const gridTranslate = Math.min(scrollOffset * 0.03, 18);

 return (
 <div className="relative min-h-[500px] w-full overflow-hidden lg:min-h-[760px]">
 <div
 className="absolute inset-0 bg-[radial-gradient(circle_at_68%_34%,rgba(196,169,91,0.16),transparent_22%),radial-gradient(circle_at_74%_52%,rgba(51,3,60,0.08),transparent_34%)]"
 style={{ transform: `translate3d(0, ${gridTranslate}px, 0)` }}
 />

 <div
 className="absolute inset-0 bg-[linear-gradient(rgba(51,3,60,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(51,3,60,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(circle_at_68%_46%,black_44%,transparent_82%)]"
 style={{ transform: `translate3d(0, ${gridTranslate}px, 0)` }}
 />

 <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[18%] bg-gradient-to-r from-[var(--cth-ivory)] via-[var(--cth-ivory)]/70 to-transparent" />

 <div className="pointer-events-none absolute inset-x-0 bottom-[6%] z-10 h-[28%] bg-[radial-gradient(ellipse_at_center,rgba(51,3,60,0.08),transparent_62%)]" />

 <div className="pointer-events-none absolute bottom-[10%] left-[0%] right-[0%] z-10 h-[140px]">
 <div className="cth-floor-plane h-full w-full" />
 </div>

 <div
 className="relative z-20 ml-auto flex h-full w-full max-w-[1020px] items-center justify-end"
 style={{ transform: `translate3d(0, ${imageTranslate}px, 0)` }}
 >
 <div className="cth-architecture-wrap relative w-full">
 <img
 src="/cth-frontpage-architecture.webp"
 alt="Core Truth House architectural blueprint headquarters"
 className="cth-architecture-image w-full object-contain"
 />
 <div className="cth-blueprint-sheen" />
 <div className="cth-blueprint-trace" />
 </div>
 </div>
 </div>
 );
}


function ProblemTransformationArc() {
 return (
 <section className="relative overflow-hidden border-y border-[var(--cth-border)] bg-[var(--cth-blush)] px-5 py-20 sm:px-8 lg:py-28 xl:px-12">
 <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
 <div>
 <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--cth-crimson)]">
 From effort to structure
 </p>
 <h2 className="mt-5 max-w-[680px] font-serif text-[clamp(2.5rem,5vw,5.2rem)] leading-[0.95] tracking-[-0.05em] text-[var(--cth-purple-deep)]">
 The problem is not that you need more content.
 </h2>
 <p className="mt-6 max-w-[650px] text-[18px] font-medium leading-9 text-[var(--cth-muted)]">
 It is that your brand decisions are living in too many places. Core Truth House names the gap, organizes the strategy, and gives the brand a structure that can support real conversion.
 </p>
 <a
 href="/brand-diagnostic/"
 className="mt-8 inline-flex items-center justify-center rounded-md bg-[var(--cth-crimson)] px-7 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_35px_rgba(175,0,36,0.18)] transition hover:bg-[var(--cth-action-hover)]"
 >
 Start the Brand Diagnostic
 </a>
 </div>

 <div className="grid gap-5">
 {homepageArcCards.map((card) => (
 <article
 key={card.title}
 className="rounded-[28px] border border-[var(--cth-border)] bg-[var(--cth-ivory)]/90 p-7 shadow-[0_24px_70px_rgba(51,3,60,0.06)]"
 >
 <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--cth-ruby)]">
 {card.eyebrow}
 </p>
 <h3 className="mt-3 font-serif text-[clamp(1.7rem,3vw,2.5rem)] leading-tight text-[var(--cth-purple-deep)]">
 {card.title}
 </h3>
 <p className="mt-4 text-[16px] leading-8 text-[var(--cth-muted)]">
 {card.body}
 </p>
 </article>
 ))}
 </div>
 </div>
 </section>
 );
}

function BrandMemorySection() {
 return (
 <section className="relative overflow-hidden bg-[var(--cth-ivory)] px-5 py-20 sm:px-8 lg:py-28 xl:px-12">
 <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
 <div>
 <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--cth-crimson)]">
 Brand Memory
 </p>
 <h2 className="mt-5 max-w-[760px] font-serif text-[clamp(2.5rem,5vw,5.25rem)] leading-[0.95] tracking-[-0.05em] text-[var(--cth-purple-deep)]">
 The system remembers what your brand is supposed to sound like.
 </h2>
 <p className="mt-6 max-w-[760px] text-[18px] font-medium leading-9 text-[var(--cth-muted)]">
 {brandMemoryDefinition}
 </p>
 </div>

 <div className="rounded-[32px] border border-[var(--cth-border)] bg-white/60 p-7 shadow-[0_30px_80px_rgba(51,3,60,0.08)]">
 <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--cth-ruby)]">
 What it holds
 </p>
 <ul className="mt-6 grid gap-4 text-[16px] leading-8 text-[var(--cth-muted)]">
 <li>Strategy, positioning, and brand promise</li>
 <li>Audience language, pain points, and buying triggers</li>
 <li>Voice, tone, messaging rules, and decision standards</li>
 <li>Offer structure, content direction, and visual identity</li>
 </ul>
 </div>
 </div>
 </section>
 );
}

function HomeFAQSection() {
 return (
 <section id="faq" className="relative overflow-hidden border-t border-[var(--cth-border)] bg-[var(--cth-blush)] px-5 py-20 sm:px-8 lg:py-28 xl:px-12">
 <div className="mx-auto max-w-[1180px]">
 <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--cth-crimson)]">
 Questions founders ask before they enter the House
 </p>
 <h2 className="mt-5 max-w-[850px] font-serif text-[clamp(2.5rem,5vw,5.2rem)] leading-[0.95] tracking-[-0.05em] text-[var(--cth-purple-deep)]">
 The brand does not need more noise. It needs clearer answers.
 </h2>

 <div className="mt-12 grid gap-5">
 {homepageFaqs.map((item) => (
 <details
 key={item.question}
 className="group rounded-[24px] border border-[var(--cth-border)] bg-[var(--cth-ivory)]/90 p-6 shadow-[0_18px_50px_rgba(51,3,60,0.05)]"
 >
 <summary className="cursor-pointer list-none font-serif text-[clamp(1.35rem,2vw,1.9rem)] leading-tight text-[var(--cth-purple-deep)]">
 {item.question}
 </summary>
 <p className="mt-4 max-w-[920px] text-[16px] leading-8 text-[var(--cth-muted)]">
 {item.answer}
 </p>
 </details>
 ))}
 </div>

 <div className="mt-12 rounded-[28px] border border-[var(--cth-gold)]/50 bg-white/65 p-7">
 <h3 className="font-serif text-3xl text-[var(--cth-purple-deep)]">
 Still unsure where the gap is?
 </h3>
 <p className="mt-3 max-w-[740px] text-[16px] leading-8 text-[var(--cth-muted)]">
 Start with the Brand Diagnostic. It is the bridge between the scattered feeling and the right Core Truth House system.
 </p>
 <a
 href="/brand-diagnostic/"
 className="mt-6 inline-flex items-center justify-center rounded-md bg-[var(--cth-crimson)] px-7 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_35px_rgba(175,0,36,0.18)] transition hover:bg-[var(--cth-action-hover)]"
 >
 Start the Brand Diagnostic
 </a>
 </div>
 </div>
 </section>
 );
}


function Hero({ scrollOffset = 0 }) {
 return (
 <section className="relative overflow-hidden border-b border-[var(--cth-border)] bg-[var(--cth-ivory)]">
 <HeroDraftMarks scrollOffset={scrollOffset} />

 <div className="mx-auto grid max-w-[1760px] items-center gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.84fr_1.16fr] lg:py-16 xl:px-12">
 <div className="relative z-10 max-w-[760px]">
 <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--cth-crimson)]">
 Where serious brands are built
 </p>

 <h1 className="mt-5 font-serif text-[clamp(3.1rem,6.4vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.065em] text-[var(--cth-purple-deep)]">
 <span className="block">Build the brand behind the business</span>
 <span className="block italic font-normal">before you build the brand the world sees.</span>
 </h1>

 <p className="mt-6 max-w-[640px] text-[19px] font-medium leading-9 text-[var(--cth-muted)]">
 Core Truth House gives solo service-based founders one connected system for brand decisions, messaging, offers, content, sales pages, and funnels. So the work you are already doing can finally move the pipeline.
 </p>

 <p className="mt-3 max-w-[620px] rounded-2xl border border-[var(--cth-gold)]/50 bg-[var(--cth-ivory)]/80 px-5 py-4 text-[14px] font-semibold leading-7 text-[var(--cth-ruby)] shadow-[0_18px_45px_rgba(51,3,60,0.05)]">
 Designed for solo service-based founders who have content, offers, and visibility, but need structure that makes the brand easier to sell.
 </p>



 <div className="mt-8 flex flex-wrap items-center gap-4">
 <a href="/brand-diagnostic/"
 className="inline-flex items-center justify-center rounded-md bg-[var(--cth-crimson)] px-7 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_35px_rgba(175,0,36,0.18)] transition hover:bg-[var(--cth-action-hover)]"
 >
 Start the Brand Diagnostic
 </a>

 <a
 href="/demo-mode"
 className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--cth-gold)] bg-white/55 px-7 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--cth-ruby)] transition hover:bg-white"
 >
 <span>▷</span>
 <span>See the System</span>
 </a>
 </div>
 </div>

 <BlueprintArchitecture scrollOffset={scrollOffset} />
 </div>
 </section>
 );
}

function Pillars() {
 return (
 <section id="solutions" className="border-b border-[var(--cth-border)] bg-[var(--cth-ivory-soft)]">
 <div className="mx-auto max-w-[1760px] px-5 sm:px-8 xl:px-12">
 <div className="grid md:grid-cols-2 xl:grid-cols-4">
 {pillars.map((pillar, index) => (
 <article
 key={pillar.title}
 className={[
 "flex gap-4 border-[var(--cth-border)] px-4 py-8 sm:px-6 xl:px-8",
 index !== pillars.length - 1 ? "xl:border-r" : "",
 index < 2 ? "md:border-b xl:border-b-0" : "",
 ].join(" ")}
 >
 <div className="cth-home-card-asset-frame flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[16px] border border-[var(--cth-border-gold)] bg-[var(--cth-panel-soft)] p-2 text-xl text-[var(--cth-crimson)]">
 {pillar.asset ? (
 <img
 src={pillar.asset}
 alt=""
 aria-hidden="true"
 className="cth-home-card-asset h-full w-full object-contain"
 />
 ) : (
 pillar.icon
 )}
 </div>

 <div>
 <h3 className="text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--cth-ruby)]">
 {pillar.title}
 </h3>
 <p className="mt-3 text-sm leading-7 text-[var(--cth-ink-soft)]">
 {pillar.body}
 </p>
 </div>
 </article>
 ))}
 </div>
 </div>
 </section>
 );
}

function Platform() {
 return (
 <section id="platform" className="border-b border-[var(--cth-border)] bg-[var(--cth-ivory-soft)]">
 <div className="mx-auto max-w-[1760px] px-5 py-12 sm:px-8 xl:px-12">
 <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--cth-crimson)]">
 Everything you need. In one powerful platform.
 </p>

 <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
 {platformCards.map((card) => (
 <Link
 key={card.title}
 to={card.href}
 className="group flex min-h-[142px] flex-col rounded-2xl border border-[var(--cth-border)] bg-white/60 p-5 transition hover:-translate-y-1 hover:border-[var(--cth-gold)] hover:shadow-[0_16px_28px_rgba(51,3,60,0.08)]"
 >
 <div className="cth-home-card-asset-frame flex h-11 w-11 items-center justify-center rounded-[14px] border border-[var(--cth-border-gold)] bg-[var(--cth-panel-soft)] p-1.5 text-lg text-[var(--cth-crimson)]">
 {card.asset ? (
 <img
 src={card.asset}
 alt=""
 aria-hidden="true"
 className="cth-home-card-asset h-full w-full object-contain"
 />
 ) : (
 card.icon
 )}
 </div>
 <h3 className="mt-4 text-[12px] font-bold uppercase tracking-[0.16em] text-[var(--cth-ruby)]">
 {card.title}
 </h3>
 <p className="mt-2 text-sm leading-6 text-[var(--cth-ink-soft)]">
 {card.body}
 </p>
 <div className="mt-auto pt-4 text-sm font-bold text-[var(--cth-crimson)] transition group-hover:translate-x-1">
 →
 </div>
 </Link>
 ))}
 </div>
 </div>
 </section>
 );
}

function Pricing() {
 return (
 <section id="pricing" className="border-b border-[var(--cth-border)] bg-[var(--cth-ivory)]">
 <div className="mx-auto max-w-[1760px] px-5 py-14 sm:px-8 xl:px-12">
 <div className="max-w-[760px]">
 <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[var(--cth-crimson)]">
 Core Tiers built for how serious brands grow
 </p>
 <h2 className="mt-4 font-serif text-[clamp(2.2rem,4vw,3.8rem)] font-semibold leading-tight tracking-[-0.04em] text-[var(--cth-purple-deep)]">
 Start with foundation. Scale into structure, house, and estate.
 </h2>
 <p className="mt-4 text-base leading-8 text-[var(--cth-muted)]">
 Choose the tier that matches your current brand gap, then grow into the complete Core Truth House operating system.
 </p>
 </div>

 <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
 {pricingPlans.map((plan) => (
 <article
 key={plan.name}
 className={[
 "flex min-h-[360px] flex-col rounded-[1.75rem] border p-6 shadow-sm",
 plan.featured
 ? "border-[var(--cth-gold)]/40 bg-[var(--cth-purple-deep)] text-white shadow-[0_20px_35px_rgba(51,3,60,0.18)]"
 : "border-[var(--cth-border)] bg-white/70 text-[var(--cth-purple-deep)]",
 ].join(" ")}
 >
 <p
 className={[
 "text-[11px] font-bold uppercase tracking-[0.18em]",
 plan.featured ? "text-[var(--cth-gold)]" : "text-[var(--cth-crimson)]",
 ].join(" ")}
 >
 {plan.name}
 </p>

 <div className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em]">
 {plan.price}
 </div>

 <p className={plan.featured ? "mt-3 text-sm leading-7 text-white/75" : "mt-3 text-sm leading-7 text-[var(--cth-muted)]"}>
 {plan.description}
 </p>

 <ul className="mt-6 space-y-3">
 {plan.features.map((feature) => (
 <li
 key={feature}
 className={plan.featured ? "flex items-start gap-2 text-sm text-white/90" : "flex items-start gap-2 text-sm text-[var(--cth-ink-soft)]"}
 >
 <span className={plan.featured ? "text-[var(--cth-gold)]" : "text-[var(--cth-crimson)]"}>•</span>
 <span>{feature}</span>
 </li>
 ))}
 </ul>

 <Link
 to={plan.href}
 className={plan.featured
 ? "mt-auto inline-flex items-center justify-center rounded-md bg-[var(--cth-gold)] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--cth-purple-deep)] transition hover:bg-[var(--cth-action-secondary-hover)]"
 : "mt-auto inline-flex items-center justify-center rounded-md bg-[var(--cth-crimson)] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[var(--cth-action-hover)]"
 }
 >
 {plan.cta}
 </Link>
 </article>
 ))}
 </div>
 </div>
 </section>
 );
}

function TiersStrip() {
  return (
    <section id="tiers" className="border-b border-[var(--cth-border)] bg-[var(--cth-ivory)]">
      <div className="mx-auto max-w-[1500px] px-5 py-16 sm:px-8 lg:py-20 xl:px-12">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[760px]">
            <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[var(--cth-crimson)]">
              Built for how serious brands grow
            </p>
            <h2 className="mt-4 font-serif text-[clamp(2rem,3.6vw,3.4rem)] font-semibold leading-tight tracking-[-0.04em] text-[var(--cth-purple-deep)]">
              Foundation. Structure. House. Estate.
            </h2>
            <p className="mt-4 max-w-[640px] text-[16px] leading-8 text-[var(--cth-muted)]">
              Every tier matches a real brand stage. Start where the gap is. Grow into the full operating system as the structure holds more weight.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              to="/tiers"
              className="inline-flex items-center justify-center rounded-md bg-[var(--cth-crimson)] px-7 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_18px_35px_rgba(175,0,36,0.18)] transition hover:bg-[var(--cth-action-hover)]"
            >
              See Tiers
            </Link>
            <Link
              to="/brand-diagnostic/"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[var(--cth-gold)] bg-white/55 px-7 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-[var(--cth-ruby)] transition hover:bg-white"
            >
              Start the Brand Diagnostic
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
 const [scrollOffset, setScrollOffset] = useState(0);

 useEffect(() => {
 let ticking = false;

 const onScroll = () => {
 if (!ticking) {
 window.requestAnimationFrame(() => {
 setScrollOffset(window.scrollY || 0);
 ticking = false;
 });
 ticking = true;
 }
 };

 onScroll();
 window.addEventListener("scroll", onScroll, { passive: true });

 return () => {
 window.removeEventListener("scroll", onScroll);
 };
 }, []);

 return (
 <main className="min-h-screen bg-[var(--cth-ivory)] text-[var(--cth-purple-deep)]">
 <style>{`
 .cth-nav-link {
 font-size: 11px;
 font-weight: 800;
 text-transform: uppercase;
 letter-spacing: 0.18em;
 color: var(--cth-ruby);
 transition: color 160ms ease;
 }

 .cth-nav-link:hover {
 color: var(--cth-crimson);
 }

 .cth-footer-heading {
 font-size: 11px;
 font-weight: 800;
 text-transform: uppercase;
 letter-spacing: 0.18em;
 color: var(--cth-white);
 }

 .cth-footer-links {
 margin-top: 1rem;
 display: grid;
 gap: 0.75rem;
 color: rgba(255,255,255,0.68);
 font-size: 0.875rem;
 }

 .cth-footer-links a:hover {
 color: var(--cth-white);
 }

 .cth-floor-plane {
 background:
 linear-gradient(to right, rgba(51,3,60,0.08), rgba(51,3,60,0.02) 42%, transparent 76%),
 repeating-linear-gradient(
 to right,
 rgba(199,160,157,0.28) 0,
 rgba(199,160,157,0.28) 1px,
 transparent 1px,
 transparent 54px
 ),
 repeating-linear-gradient(
 to bottom,
 rgba(199,160,157,0.24) 0,
 rgba(199,160,157,0.24) 1px,
 transparent 1px,
 transparent 26px
 );
 clip-path: polygon(0 100%, 100% 100%, 80% 0, 14% 0);
 opacity: 0.62;
 }

 .cth-architecture-wrap {
 transform: translateX(2%);
 }

 .cth-architecture-wrap::before {
 content: "";
 position: absolute;
 inset: 10% 8% 12% 10%;
 z-index: 1;
 border-radius: 999px;
 background: radial-gradient(circle at center, rgba(196,169,91,0.14), rgba(196,169,91,0.03) 52%, transparent 74%);
 transform: scale(1.06);
 }

 .cth-architecture-wrap::after {
 content: "";
 position: absolute;
 left: 14%;
 right: 10%;
 bottom: 6%;
 height: 16%;
 z-index: 0;
 background: radial-gradient(ellipse at center, rgba(51,3,60,0.10), transparent 68%);
 filter: blur(12px);
 }

 .cth-architecture-image {
 position: relative;
 z-index: 2;
 display: block;
 width: 100%;
 opacity: 0;
 clip-path: inset(0 100% 0 0);
 filter: contrast(1.03) saturate(0.96) drop-shadow(0 18px 28px rgba(51,3,60,0.08));
 -webkit-mask-image:
 linear-gradient(
 to right,
 transparent 0%,
 rgba(0,0,0,0.20) 7%,
 rgba(0,0,0,0.62) 16%,
 rgba(0,0,0,0.92) 28%,
 #000 38%,
 #000 100%
 ),
 linear-gradient(
 to bottom,
 rgba(0,0,0,0.95) 0%,
 #000 82%,
 rgba(0,0,0,0.20) 100%
 );
 mask-image:
 linear-gradient(
 to right,
 transparent 0%,
 rgba(0,0,0,0.20) 7%,
 rgba(0,0,0,0.62) 16%,
 rgba(0,0,0,0.92) 28%,
 #000 38%,
 #000 100%
 ),
 linear-gradient(
 to bottom,
 rgba(0,0,0,0.95) 0%,
 #000 82%,
 rgba(0,0,0,0.20) 100%
 );
 -webkit-mask-composite: source-in;
 mask-composite: intersect;
 animation: cthBlueprintReveal 4.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
 }

 .cth-blueprint-sheen {
 position: absolute;
 top: 4%;
 bottom: 6%;
 left: -12%;
 width: 18%;
 z-index: 3;
 opacity: 0;
 background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
 transform: skewX(-18deg) translateX(0);
 mix-blend-mode: screen;
 animation: cthBlueprintScan 5.2s ease-out 0.5s forwards;
 }

 .cth-blueprint-trace {
 position: absolute;
 top: 6%;
 bottom: 8%;
 left: 0;
 width: 2px;
 z-index: 4;
 opacity: 0;
 background: linear-gradient(
 to bottom,
 transparent,
 rgba(196,169,91,0.24),
 rgba(196,169,91,0.94),
 rgba(175,0,36,0.78),
 transparent
 );
 box-shadow: 0 0 18px rgba(175,0,36,0.16);
 animation: cthBlueprintTrace 4.8s ease-out forwards;
 }

 @keyframes cthBlueprintReveal {
 0% {
 opacity: 0;
 clip-path: inset(0 100% 0 0);
 }
 10% {
 opacity: 0.45;
 }
 100% {
 opacity: 1;
 clip-path: inset(0 0 0 0);
 }
 }

 @keyframes cthBlueprintScan {
 0% {
 opacity: 0;
 transform: skewX(-18deg) translateX(0);
 }
 12% {
 opacity: 0.72;
 }
 100% {
 opacity: 0;
 transform: skewX(-18deg) translateX(690%);
 }
 }

 @keyframes cthBlueprintTrace {
 0% {
 opacity: 0;
 transform: translateX(0);
 }
 12% {
 opacity: 0.92;
 }
 86% {
 opacity: 0.70;
 }
 100% {
 opacity: 0;
 transform: translateX(900px);
 }
 }

 @media (max-width: 1023px) {
 .cth-architecture-wrap {
 transform: none;
 }
 }

 @media (min-width: 1024px) {

 .cth-site-footer .cth-footer-rail-mark {
 display: grid;
 }
 }

 .cth-footer-rail-mark::before {
 content: "";
 position: absolute;
 inset: 8px;
 border: 1px solid rgba(196,169,91,0.24);
 }

 .cth-footer-rail-mark span {
 position: relative;
 z-index: 1;
 font-size: 28px;
 }

 @media (prefers-reduced-motion: reduce) {
 .cth-architecture-image,
 .cth-blueprint-sheen,
 .cth-blueprint-trace {
 animation: none !important;
 }

 .cth-architecture-image {
 opacity: 1 !important;
 clip-path: inset(0 0 0 0) !important;
 }

 .cth-blueprint-sheen,
 .cth-blueprint-trace {
 opacity: 0 !important;
 }
 }
 `}</style>

 <div className="w-full">
 
 <div className="min-w-0">
 <PublicHeader active="home" />
 <Hero scrollOffset={scrollOffset} />
 <ProblemTransformationArc />
 <BrandMemorySection />
 <Pillars />
 <TiersStrip />
 <HomeFAQSection />
 <PublicFooter />
 </div>
 </div>
 </main>
 );
}
