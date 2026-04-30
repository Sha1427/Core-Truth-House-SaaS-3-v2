import React from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

const values = [
 {
 icon: "✦",
 title: "Clarity",
 asset: "/brand-assets/cards/clarity.png",
 text: "We uncover the truth at the core of your brand so every decision, message, and move is aligned and intentional.",
 },
 {
 icon: "▯",
 title: "Structure",
 asset: "/brand-assets/cards/structure.png",
 text: "We build the foundation, frameworks, systems, and assets so your brand is strong, scalable, and future-ready.",
 },
 {
 icon: "↗",
 title: "Execution",
 asset: "/brand-assets/cards/execution.png",
 text: "We turn strategy into action with disciplined processes that drive momentum and market leadership.",
 },
 {
 icon: "↗",
 title: "Optimization",
 asset: "/brand-assets/cards/optimization.png",
 text: "We measure, learn, and refine continuously to compound your brand’s growth and long-term performance.",
 },
];

const philosophy = [
 ["◎", "Truth Before Tactics", "We start with truth because strategy without truth is just noise."],
 ["◇", "Brand is the Business", "Your brand isn’t a logo. It’s your leadership, your promise, and your proof."],
 ["⚙", "Systems Create Freedom", "The right systems don’t limit you, they free you to lead at the highest level."],
 ["ϟ", "Execution is Everything", "Ideas are easy. Execution is where legacy is built."],
 ["∞", "Compounding Over Time", "We build for long-term impact, not short-term impressions."],
];



function Crest({ small = false, dark = false }) {
 return (
 <img
 src="/brand-assets/logo/cth-logo-seal.png"
 alt="Core Truth House"
 className={`cth-logo-seal-img ${small ? "small" : ""} ${dark ? "dark" : ""}`}
 />
 );
}

function Eyebrow({ children, light = false }) {
 return <p className={`cth-eyebrow ${light ? "light" : ""}`}>{children}</p>;
}

function Hero() {
 return (
 <section className="cth-about-hero">
 <div className="cth-about-shell cth-about-hero-grid">
 <div className="cth-about-hero-copy">
 <Eyebrow>About Core Truth House</Eyebrow>
 <h1>
 Where Serious Brands
 <em>Find Their Structure.</em>
 </h1>
 <p>
 Core Truth House is a Brand Operating System for solo service-based founders who are visible, consistent, and ready to turn scattered brand decisions into one clear system.
 </p>

 <div className="cth-about-actions">
 <a href="/brand-diagnostic/" className="cth-btn cth-btn-primary">
 Start Diagnostic <span>→</span>
 </a>
 <Link to="/#platform" className="cth-btn cth-btn-secondary">
 Explore the Platform <span>→</span>
 </Link>
 </div>
 </div>

 <div className="cth-about-hero-image">
 <img
 src="/cth-frontpage-architecture.webp"
 alt="Core Truth House architectural headquarters"
 />
 </div>
 </div>
 </section>
 );
}

function Story() {
 return (
 <section className="cth-story-section">
 <img
 src="/about-assets/columns/cth-column-capital-schematic-overlay.png"
 alt=""
 aria-hidden="true"
 className="cth-story-column"
 />

 <div className="cth-about-shell cth-story-grid">
 <div className="cth-story-left">
 <Eyebrow>Our Story</Eyebrow>
 <h2>Why Core Truth House Exists</h2>
 <div className="cth-gold-line" />
 <p>
 We built Core Truth House for the founder who is doing the work, showing up, creating content, serving clients, and still wondering why the pipeline does not match the effort.
 </p>
 <p>Too many tools. Too many disconnected decisions. Not enough brand memory.</p>
 <p><strong>CTH was built to bring the brand back into one system.</strong></p>
 </div>

 <div className="cth-story-right">
 <p>
 Most founders do not have a brand problem because they lack ideas. They have a brand problem because their decisions live everywhere: notes, prompts, Canva files, sales pages, emails, and memory.
 </p>
 <p>
 We built Core Truth House to bring those decisions together. One system. One source of truth. One operating rhythm for messaging, offers, content, sales pages, and funnels.
 </p>
 <p>
 Today, Core Truth House helps serious founders replace scattered tactics with a structured brand operating system that compounds over time.
 </p>
 </div>
 </div>
 </section>
 );
}

function MissionVision() {
 return (
 <section className="cth-mission-band">

 <div className="cth-about-shell cth-mission-grid">
 <article>
 <div className="cth-gold-circle">♛</div>
 <div>
 <Eyebrow light>Our Mission</Eyebrow>
 <p>
 To give serious founders the clarity, structure, and execution system they need to make stronger brand decisions and convert with more consistency.
 </p>
 </div>
 </article>

 <div className="cth-band-divider" />

 <article>
 <div className="cth-gold-circle">▯</div>
 <div>
 <Eyebrow light>Our Vision</Eyebrow>
 <p>
 A world where founders stop rebuilding their brand from scratch and start operating from a connected source of truth.
 </p>
 </div>
 </article>
 </div>
 </section>
 );
}

function Values() {
 return (
 <section className="cth-values-section">
 <div className="cth-about-shell">
 <div className="cth-section-title">
 <Eyebrow>Our Core Values</Eyebrow>
 <h2>The Four Pillars of Our House</h2>
 </div>

 <div className="cth-values-grid">
 {values.map((value) => (
 <article key={value.title}>
 <div className="cth-values-asset-frame">
 {value.asset ? (
 <img
 src={value.asset}
 alt=""
 aria-hidden="true"
 className="cth-values-asset"
 />
 ) : (
 <div className="cth-red-icon">{value.icon}</div>
 )}
 </div>
 <div>
 <h3>{value.title}</h3>
 <p>{value.text}</p>
 </div>
 </article>
 ))}
 </div>
 </div>
 </section>
 );
}

function Founder() {
 return (
 <section className="cth-founder-section">
 <div className="cth-about-shell cth-founder-grid">
 <div className="cth-founder-image">
 <img
 src="/cth-founder-portrait.webp"
 alt="Sha B., Founder and CEO of Core Truth House"
 onError={(event) => {
 event.currentTarget.style.opacity = "0";
 }}
 />
 <span>CTH</span>
 </div>

 <div className="cth-founder-bio">
 <Eyebrow>Founder & CEO</Eyebrow>
 <h2>Sha B.</h2>
 <p className="cth-founder-role">Founder & CEO, Core Truth House</p>
 <p>
 Sha B. is a brand strategist, operator, and builder helping founders turn scattered ideas into structured brand systems.
 </p>
 <p>
 She built Core Truth House to be the operating system she wished existed when brand strategy, content, offers, and execution were all living in separate places.
 </p>
 </div>

 <div className="cth-founder-quote">
 <div>“</div>
 <blockquote>
 A serious brand cannot live in scattered files and memory. It needs a house, a system, and a rhythm that helps every decision stay aligned.
 </blockquote>
 <p>Sha B.</p>
 </div>
 </div>
 </section>
 );
}

function Philosophy() {
 return (
 <section className="cth-philosophy-band">
 <img
 src="/about-assets/floor-plans/cth-floor-plan-wide-detailed.png"
 alt=""
 aria-hidden="true"
 className="cth-philosophy-floor-right"
 />

 <div className="cth-about-shell">
 <div className="cth-section-title light">
 <Eyebrow light>Our Philosophy</Eyebrow>
 <h2>How We Think</h2>
 </div>

 <div className="cth-philosophy-grid">
 {philosophy.map(([icon, title, text]) => (
 <article key={title}>
 <div>{icon}</div>
 <h3>{title}</h3>
 <p>{text}</p>
 </article>
 ))}
 </div>
 </div>
 </section>
 );
}


function FinalCTA() {
 return (
 <section className="cth-final-cta">
 <img
 src="/cth-frontpage-architecture.webp"
 alt=""
 aria-hidden="true"
 className="cth-cta-house"
 />

 <div className="cth-about-shell cth-final-cta-grid">
 <div className="cth-cta-crest">
 <Crest />
 </div>

 <div>
 <Eyebrow>Start With Structure</Eyebrow>
 <h2>
 See Where Your Brand
 <em>Is Leaking Conversion.</em>
 </h2>
 <p>
 Start the Brand Diagnostic and get a clear read on the structural gaps holding your messaging, offers, content, or funnel back.
 </p>
 </div>

 <div className="cth-cta-actions">
 <a href="/brand-diagnostic/" className="cth-btn cth-btn-primary">
 Start Diagnostic <span>→</span>
 </a>
 <Link to="/#platform" className="cth-btn cth-btn-secondary">
 Explore the Platform <span>→</span>
 </Link>
 </div>
 </div>
 </section>
 );
}

export default function AboutPage() {
 return (
 <main className="cth-about-page">
 <PublicHeader active="about" />
 <Hero />
 <Story />
 <MissionVision />
 <Values />
 <Founder />
 <Philosophy />
 <FinalCTA />
 <PublicFooter />

 <style>{`
 .cth-about-page {
 min-height: 100vh;
 background: var(--cth-ivory);
 color: var(--cth-purple-deep);
 overflow-x: hidden;
 font-family: 'DM Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
 }

 .cth-about-shell {
 width: min(1540px, calc(100vw - 96px));
 margin: 0 auto;
 position: relative;
 z-index: 2;
 }

 .cth-about-header {
 position: sticky;
 top: 0;
 z-index: 80;
 border-bottom: 1px solid var(--cth-border);
 background: rgba(248,241,236,0.95);
 backdrop-filter: blur(16px);
 }

 .cth-about-header-inner {
 height: 72px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 28px;
 }

 .cth-wordmark {
 display: flex;
 align-items: center;
 gap: 12px;
 color: var(--cth-ruby);
 text-decoration: none;
 font-family: Georgia, serif;
 font-size: 20px;
 font-weight: 700;
 white-space: nowrap;
 }

 .cth-about-nav {
 display: flex;
 align-items: center;
 gap: 30px;
 }

 .cth-about-nav a {
 position: relative;
 color: var(--cth-ink-soft);
 text-decoration: none;
 font-size: 10px;
 font-weight: 850;
 text-transform: uppercase;
 letter-spacing: 0.15em;
 }

 .cth-about-nav a.active {
 color: var(--cth-crimson);
 }

 .cth-about-nav a.active::after {
 content: "";
 position: absolute;
 left: 0;
 right: 0;
 bottom: -12px;
 height: 2px;
 background: var(--cth-gold);
 }

 .cth-crest {
 position: relative;
 display: grid;
 place-items: center;
 width: 72px;
 height: 72px;
 border: 1px solid rgba(196,169,91,0.58);
 color: var(--cth-ivory);
 background: radial-gradient(circle, var(--cth-crimson), var(--cth-purple-deep));
 }

 .cth-crest.small {
 width: 38px;
 height: 38px;
 color: var(--cth-crimson);
 background: rgba(255,255,255,0.65);
 border-color: rgba(175,0,36,0.25);
 }

 .cth-crest::before {
 content: "";
 position: absolute;
 inset: 7px;
 border: 1px solid rgba(196,169,91,0.32);
 }

 .cth-crest-roof {
 position: absolute;
 top: 9px;
 color: var(--cth-gold);
 font-size: 11px;
 }

 .cth-crest.small .cth-crest-roof {
 top: 4px;
 font-size: 7px;
 }

 .cth-crest-text {
 position: relative;
 font-family: Georgia, serif;
 font-size: 28px;
 font-weight: 800;
 letter-spacing: -0.08em;
 }

 .cth-crest.small .cth-crest-text {
 font-size: 13px;
 }

 .cth-eyebrow {
 margin: 0;
 color: var(--cth-crimson);
 font-size: 11px;
 font-weight: 900;
 letter-spacing: 0.22em;
 text-transform: uppercase;
 }

 .cth-eyebrow.light {
 color: var(--cth-gold);
 }

 .cth-btn {
 min-height: 44px;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 gap: 16px;
 padding: 0 28px;
 border-radius: 4px;
 text-decoration: none;
 text-transform: uppercase;
 letter-spacing: 0.14em;
 font-size: 11px;
 font-weight: 900;
 border: 1px solid transparent;
 }

 .cth-btn-primary {
 background: var(--cth-crimson);
 color: white;
 box-shadow: 0 14px 28px rgba(175,0,36,0.16);
 }

 .cth-btn-secondary {
 background: rgba(255,255,255,0.52);
 color: var(--cth-ruby);
 border-color: rgba(196,169,91,0.72);
 }

 .cth-btn-small {
 min-height: 40px;
 padding: 0 22px;
 font-size: 10px;
 }

 .cth-about-hero {
 position: relative;
 overflow: hidden;
 border-bottom: 1px solid var(--cth-border);
 background: var(--cth-ivory);
 padding: 70px 0 48px;
 }

 .cth-about-hero-grid {
 display: grid;
 grid-template-columns: 0.9fr 1.1fr;
 gap: 64px;
 align-items: center;
 }

 .cth-about-hero h1 {
 margin: 22px 0 22px;
 font-family: Georgia, serif;
 color: var(--cth-purple-deep);
 font-size: clamp(4rem, 6vw, 6.6rem);
 line-height: 0.9;
 letter-spacing: -0.065em;
 font-weight: 600;
 }

 .cth-about-hero h1 em {
 display: block;
 font-style: italic;
 font-weight: 400;
 }

 .cth-about-hero p {
 max-width: 640px;
 color: var(--cth-ink-soft);
 font-size: 16px;
 line-height: 1.75;
 font-weight: 650;
 }

 .cth-about-actions {
 margin-top: 28px;
 display: flex;
 flex-wrap: wrap;
 gap: 24px;
 }

 .cth-about-hero-image {
 position: relative;
 min-height: 430px;
 display: grid;
 place-items: center;
 }

 .cth-about-hero-image img {
 width: min(780px, 100%);
 display: block;
 object-fit: contain;
 filter: drop-shadow(0 18px 28px rgba(51,3,60,0.08));
 }

 .cth-story-section {
 position: relative;
 overflow: hidden;
 background: var(--cth-ivory-soft);
 border-bottom: 1px solid var(--cth-border);
 padding: 48px 0 54px;
 }

 .cth-story-column {
 position: absolute;
 right: 50px;
 top: 28px;
 width: 340px;
 max-width: 28vw;
 opacity: 0.32;
 pointer-events: none;
 user-select: none;
 }

 .cth-story-grid {
 display: grid;
 grid-template-columns: 0.82fr 1.18fr;
 gap: 86px;
 }

 .cth-story-section h2,
 .cth-section-title h2 {
 margin: 16px 0 0;
 font-family: Georgia, serif;
 color: var(--cth-purple-deep);
 font-size: clamp(2.3rem, 3.4vw, 4rem);
 line-height: 0.98;
 letter-spacing: -0.055em;
 font-weight: 500;
 }

 .cth-gold-line {
 width: 56px;
 height: 2px;
 background: var(--cth-gold);
 margin: 20px 0 22px;
 }

 .cth-story-section p {
 margin: 0 0 18px;
 color: var(--cth-ink-soft);
 font-size: 14px;
 line-height: 1.7;
 font-weight: 650;
 }

 .cth-mission-band {
 position: relative;
 overflow: hidden;
 background: var(--cth-purple-deep);
 color: white;
 padding: 42px 0;
 }


 .cth-mission-floor-left {
 position: absolute;
 left: -70px;
 top: 50%;
 width: 360px;
 max-width: 28vw;
 opacity: 0.12;
 transform: translateY(-50%) rotate(-2deg);
 mix-blend-mode: screen;
 pointer-events: none;
 user-select: none;
 z-index: 1;
 }

 .cth-philosophy-floor-right {
 position: absolute;
 right: -90px;
 top: 50%;
 width: 500px;
 max-width: 34vw;
 opacity: 0.10;
 transform: translateY(-50%) rotate(1deg);
 mix-blend-mode: screen;
 pointer-events: none;
 user-select: none;
 z-index: 1;
 }


 .cth-mission-band .cth-about-shell,
 .cth-philosophy-band .cth-about-shell {
 position: relative;
 z-index: 2;
 }

 .cth-mission-grid {
 display: grid;
 grid-template-columns: 1fr 1px 1fr;
 gap: 72px;
 align-items: center;
 }

 .cth-mission-grid article {
 display: grid;
 grid-template-columns: 96px 1fr;
 gap: 34px;
 align-items: center;
 }

 .cth-gold-circle {
 width: 82px;
 height: 82px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 border: 2px solid rgba(196,169,91,0.72);
 color: var(--cth-gold);
 font-size: 30px;
 background: rgba(255,255,255,0.025);
 }

 .cth-mission-grid p {
 max-width: 560px;
 margin: 10px 0 0;
 color: var(--cth-on-dark);
 font-family: Georgia, serif;
 font-size: clamp(1.35rem, 1.85vw, 2rem);
 line-height: 1.18;
 }

 .cth-band-divider {
 height: 92px;
 background: rgba(196,169,91,0.35);
 }

 .cth-values-section {
 background: var(--cth-ivory);
 border-bottom: 1px solid var(--cth-border);
 padding: 36px 0 42px;
 }

 .cth-section-title {
 text-align: center;
 }

 .cth-section-title.light h2 {
 color: white;
 }

 .cth-values-grid {
 margin-top: 34px;
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 }

 .cth-values-grid article {
 display: grid;
 grid-template-columns: 64px 1fr;
 gap: 18px;
 padding: 0 28px;
 border-right: 1px solid var(--cth-border);
 }

 .cth-values-grid article:last-child {
 border-right: 0;
 }

 .cth-red-icon {
 width: 54px;
 height: 54px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 border: 1px solid rgba(175,0,36,0.26);
 color: var(--cth-crimson);
 font-size: 25px;
 }

 .cth-values-grid h3 {
 margin: 0 0 8px;
 color: var(--cth-ruby);
 font-size: 13px;
 font-weight: 900;
 }

 .cth-values-grid p {
 margin: 0;
 color: var(--cth-ink-soft);
 font-size: 12px;
 line-height: 1.55;
 font-weight: 650;
 }

 .cth-founder-section {
 background: var(--cth-ivory-soft);
 border-bottom: 1px solid var(--cth-border);
 padding: 36px 0 40px;
 }

 .cth-founder-grid {
 display: grid;
 grid-template-columns: 300px 1fr 0.95fr;
 gap: 50px;
 align-items: center;
 }

 .cth-founder-image {
 position: relative;
 overflow: hidden;
 height: 250px;
 border: 1px solid var(--cth-border);
 background: linear-gradient(135deg, var(--cth-purple-deep), var(--cth-purple-black));
 }

 .cth-founder-image img {
 position: relative;
 z-index: 2;
 width: 100%;
 height: 100%;
 object-fit: cover;
 object-position: center top;
 }

 .cth-founder-image span {
 position: absolute;
 inset: 0;
 display: grid;
 place-items: center;
 font-family: Georgia, serif;
 color: rgba(196,169,91,0.12);
 font-size: 72px;
 font-weight: 800;
 }

 .cth-founder-bio h2 {
 margin: 10px 0 2px;
 color: var(--cth-purple-deep);
 font-family: Georgia, serif;
 font-size: 42px;
 line-height: 1;
 letter-spacing: -0.04em;
 font-weight: 500;
 }

 .cth-founder-role {
 color: var(--cth-ruby) !important;
 font-weight: 850 !important;
 }

 .cth-founder-bio p {
 margin: 10px 0;
 color: var(--cth-ink-soft);
 font-size: 13px;
 line-height: 1.7;
 font-weight: 650;
 }

 .cth-founder-quote {
 border-left: 1px solid var(--cth-border);
 padding-left: 48px;
 }

 .cth-founder-quote div {
 color: var(--cth-gold);
 font-family: Georgia, serif;
 font-size: 48px;
 line-height: 1;
 }

 .cth-founder-quote blockquote {
 margin: 0;
 color: var(--cth-purple-deep);
 font-family: Georgia, serif;
 font-size: clamp(1.45rem, 1.95vw, 2.15rem);
 line-height: 1.15;
 font-style: italic;
 }

 .cth-founder-quote p {
 margin: 28px 0 0;
 color: var(--cth-gold);
 font-family: Georgia, serif;
 font-size: 26px;
 font-style: italic;
 }

 .cth-philosophy-band {
 position: relative;
 overflow: hidden;
 background: var(--cth-purple-deep);
 color: white;
 padding: 36px 0 44px;
 }

 .cth-philosophy-grid {
 margin-top: 34px;
 display: grid;
 grid-template-columns: repeat(5, 1fr);
 }

 .cth-philosophy-grid article {
 text-align: center;
 padding: 0 28px;
 border-right: 1px solid rgba(196,169,91,0.22);
 }

 .cth-philosophy-grid article:last-child {
 border-right: 0;
 }

 .cth-philosophy-grid article > div {
 margin: 0 auto 18px;
 width: 58px;
 height: 58px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 border: 1px solid rgba(196,169,91,0.55);
 color: var(--cth-gold);
 font-size: 26px;
 }

 .cth-philosophy-grid h3 {
 margin: 0 0 8px;
 color: var(--cth-on-dark);
 font-family: Georgia, serif;
 font-size: 18px;
 font-weight: 500;
 letter-spacing: -0.03em;
 }

 .cth-philosophy-grid p {
 margin: 0;
 color: rgba(255,255,255,0.68);
 font-size: 12px;
 line-height: 1.55;
 font-weight: 650;
 }

 .cth-proof-section {
 background: var(--cth-ivory);
 border-bottom: 1px solid var(--cth-border);
 padding: 28px 0;
 }

 .cth-proof-row {
 margin-top: 18px;
 display: grid;
 grid-template-columns: 42px 1.55fr 1fr 42px;
 gap: 24px;
 align-items: center;
 }

 .cth-proof-row button {
 width: 38px;
 height: 38px;
 border: 1px solid var(--cth-border);
 border-radius: 8px;
 background: white;
 color: var(--cth-crimson);
 font-size: 28px;
 }

 .cth-logo-row {
 display: grid;
 grid-template-columns: repeat(6, 1fr);
 gap: 16px;
 align-items: center;
 }

 .cth-logo-row span {
 color: var(--cth-ink-soft);
 text-align: center;
 text-transform: uppercase;
 letter-spacing: 0.14em;
 font-size: 11px;
 font-weight: 900;
 }

 .cth-proof-quotes {
 display: grid;
 grid-template-columns: repeat(2, 1fr);
 gap: 18px;
 border-left: 1px solid var(--cth-border);
 padding-left: 22px;
 }

 .cth-proof-quotes p {
 margin: 0;
 color: var(--cth-muted);
 font-size: 12px;
 line-height: 1.5;
 font-weight: 650;
 }

 .cth-final-cta {
 position: relative;
 overflow: hidden;
 background: var(--cth-ivory-soft);
 border-bottom: 1px solid var(--cth-border);
 padding: 34px 0;
 }

 .cth-cta-house {
 position: absolute;
 right: -10px;
 bottom: -10px;
 width: 360px;
 opacity: 0.13;
 pointer-events: none;
 user-select: none;
 }

 .cth-final-cta-grid {
 display: grid;
 grid-template-columns: 150px 1fr auto;
 gap: 50px;
 align-items: center;
 }

 .cth-cta-crest .cth-crest {
 width: 120px;
 height: 120px;
 margin: 0 auto;
 }

 .cth-final-cta h2 {
 margin: 10px 0 8px;
 color: var(--cth-purple-deep);
 font-family: Georgia, serif;
 font-size: clamp(2.1rem, 3vw, 3.8rem);
 line-height: 0.95;
 letter-spacing: -0.055em;
 font-weight: 500;
 }

 .cth-final-cta h2 em {
 font-style: italic;
 }

 .cth-final-cta p {
 margin: 0;
 color: var(--cth-muted);
 font-size: 14px;
 font-weight: 650;
 }

 .cth-cta-actions {
 display: flex;
 flex-wrap: wrap;
 gap: 18px;
 justify-content: flex-end;
 }

 .cth-about-footer {
 position: relative;
 overflow: hidden;
 background: var(--cth-dark);
 color: white;
 padding: 34px 0 14px;
 }

 .cth-footer-grid {
 display: grid;
 grid-template-columns: 1.2fr repeat(5, 1fr);
 gap: 44px;
 }

 .cth-footer-brand h3 {
 margin: 12px 0 2px;
 color: var(--cth-gold);
 font-family: Georgia, serif;
 font-size: 22px;
 font-weight: 500;
 }

 .cth-footer-brand p {
 color: rgba(255,255,255,0.64);
 font-size: 12px;
 line-height: 1.5;
 }

 .cth-socials {
 display: flex;
 gap: 10px;
 margin-top: 18px;
 }

 .cth-socials span {
 width: 28px;
 height: 28px;
 display: grid;
 place-items: center;
 border: 1px solid rgba(196,169,91,0.36);
 border-radius: 999px;
 color: var(--cth-gold);
 font-size: 10px;
 }

 .cth-footer-column h4 {
 margin: 0 0 14px;
 color: var(--cth-gold);
 text-transform: uppercase;
 letter-spacing: 0.16em;
 font-size: 11px;
 }

 .cth-footer-column a,
 .cth-footer-column span {
 display: block;
 margin-bottom: 8px;
 color: rgba(255,255,255,0.68);
 text-decoration: none;
 font-size: 12px;
 }

 .cth-footer-bottom {
 margin-top: 28px;
 padding-top: 14px;
 border-top: 1px solid rgba(255,255,255,0.12);
 display: flex;
 justify-content: space-between;
 color: rgba(255,255,255,0.55);
 font-size: 11px;
 }

 .cth-footer-bottom div {
 display: flex;
 gap: 24px;
 }

 .cth-footer-bottom a {
 color: rgba(255,255,255,0.65);
 text-decoration: none;
 }

 @media (max-width: 1200px) {
 .cth-about-shell {
 width: min(100% - 40px, 1540px);
 }

 .cth-about-nav {
 display: none;
 }

 .cth-about-hero-grid,
 .cth-story-grid,
 .cth-founder-grid,
 .cth-final-cta-grid {
 grid-template-columns: 1fr;
 }

 .cth-mission-grid {
 grid-template-columns: 1fr;
 gap: 36px;
 }

 .cth-band-divider {
 display: none;
 }

 .cth-values-grid,
 .cth-philosophy-grid {
 grid-template-columns: repeat(2, 1fr);
 gap: 28px;
 }

 .cth-values-grid article,
 .cth-philosophy-grid article {
 border-right: 0;
 }

 .cth-proof-row {
 grid-template-columns: 1fr;
 }

 .cth-proof-row button {
 display: none;
 }

 .cth-logo-row,
 .cth-proof-quotes,
 .cth-footer-grid {
 grid-template-columns: repeat(2, 1fr);
 }

 .cth-story-column,
 .cth-cta-house,
 .cth-mission-floor-left,
 .cth-philosophy-floor-right {
 display: none;
 }
 }

 @media (max-width: 680px) {
 .cth-about-hero h1 {
 font-size: 4rem;
 }

 .cth-values-grid,
 .cth-philosophy-grid,
 .cth-logo-row,
 .cth-proof-quotes,
 .cth-footer-grid {
 grid-template-columns: 1fr;
 }

 .cth-mission-grid article {
 grid-template-columns: 1fr;
 }

 .cth-founder-quote {
 border-left: 0;
 padding-left: 0;
 }

 .cth-final-cta-grid {
 gap: 26px;
 }

 .cth-cta-actions {
 justify-content: flex-start;
 }

 .cth-footer-bottom {
 flex-direction: column;
 gap: 14px;
 }
 }
 `}</style>
 </main>
 );
}
