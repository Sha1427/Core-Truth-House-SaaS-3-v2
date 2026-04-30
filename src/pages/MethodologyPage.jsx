import React from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

const assets = {
  column: "/methodology-assets/cth-methodology-column-full.png",
  columnPartial: "/methodology-assets/cth-methodology-hero-column-left.png",
  architecture: "/methodology-assets/cth-methodology-house-architecture.png",
  door: "/methodology-assets/cth-methodology-door-entrance.webp",
  floorPlan: "/about-assets/floor-plans/cth-floor-plan-wide-detailed.png",
  seal: "/brand-assets/logo/cth-logo-seal.png",
};

const layers = [
 {
 number: "01",
 title: "Clarity",
 subtitle: "Find the truth.",
 body: "We uncover your core truth, positioning, and promise so every decision starts from the right place.",
 icon: "✧",
 },
 {
 number: "02",
 title: "Structure",
 subtitle: "Build the system.",
 body: "We architect your brand system, messaging, offer, identity, and strategy so everything fits and scales.",
 icon: "▥",
 },
 {
 number: "03",
 title: "Execution",
 subtitle: "Make it real.",
 body: "We translate strategy into assets, tools, and guidelines your team can actually use with confidence.",
 icon: "✓",
 },
 {
 number: "04",
 title: "Optimization",
 subtitle: "Refine as you grow.",
 body: "We measure, learn, and evolve, keeping your brand relevant, resilient, and ahead of the market.",
 icon: "◎",
 },
];

const tiers = [
  { title: "Brand Audit", body: "A strategic assessment to identify gaps and opportunities.", cta: "Clarity starts here", icon: "⌕", featured: false },
  { title: "Foundation", body: "Establish your core truth, positioning, and brand promise.", cta: "Build on truth", icon: "▥", featured: false },
  { title: "Structure", body: "Build the complete brand system that aligns and scales.", cta: "Systems that scale", icon: "▦", featured: true },
  { title: "House", body: "Embed the brand across every touchpoint and team.", cta: "Live the brand", icon: "⌂", featured: false },
  { title: "Estate", body: "Evolve, expand, and optimize for long-term market leadership.", cta: "Legacy in motion", icon: "▧", featured: false },
];

function MethodIcon({ children }) {
 return <span className="method-icon">{children}</span>;
}


export default function MethodologyPage() {
 return (
 <main className="method-page">
 <PublicHeader active="methodology" />

 <section className="method-hero">
 <img className="method-hero-column" src={assets.columnPartial} alt="" aria-hidden="true" />

 <div className="method-shell method-hero-grid">
 <div className="method-hero-copy">
 <p className="method-eyebrow">The Core Truth Method™</p>
 <h1>
 Your brand does not need more noise.
 <em>It needs a system.</em>
 </h1>
 <p>
 The Core Truth Method™ turns scattered brand decisions into a clear, credible,
 and executable business system that scales with you.
 </p>

 <div className="method-actions">
 <a href="/brand-diagnostic/" className="method-btn primary">
 Start the Brand Diagnostic <span>→</span>
 </a>
 <a href="#how-it-works" className="method-btn secondary">
 See How It Works <span>→</span>
 </a>
 </div>
 </div>

 <div className="method-hero-stack">
 <img className="method-house-sketch" src={assets.architecture} alt="" aria-hidden="true" />
 </div>
 </div>
 </section>

 <section className="method-problem">
 <div className="method-shell method-problem-grid">
 <div className="method-problem-statement">
 <h2>
 Most brands are not unclear because the founder lacks vision.
 <em>They are unclear because the vision has nowhere to live.</em>
 </h2>
 </div>

 <div className="method-problem-card">
 <p className="method-eyebrow">The Real Problem</p>
 <ul>
 <li>The message changes from week to week.</li>
 <li>The offer feels disconnected from the brand.</li>
 <li>The visuals look good but do not build trust.</li>
 <li>The team is busy, but the brand is not growing.</li>
 <li>Decisions are made reactively, not strategically.</li>
 </ul>
 </div>
 </div>
 </section>

 <section id="how-it-works" className="method-layers">
 <div className="method-shell">
 <div className="method-section-heading center">
 <p className="method-eyebrow">The Methodology</p>
 <h2>Four connected layers. One operating system.</h2>
 </div>

 <div className="method-layer-stack method-layer-stack-lifted" aria-label="Core Truth Method layers">
 {layers.slice().reverse().map((layer) => (
 <div className={`method-stack-step step-${layer.number}`} key={layer.number}>
 <span>{layer.number}</span>
 <MethodIcon>{layer.icon}</MethodIcon>
 <div>
 <strong>{layer.title}</strong>
 <small>{layer.subtitle}</small>
 <p>{layer.body}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>

 <section className="method-scale">
 <div className="method-shell method-scale-grid">
 <div>
 <h2>A system that scales with you.</h2>
 </div>

 <div className="method-start-card">
 <p className="method-eyebrow">Where It Starts</p>
 <h3>The Brand Diagnostic identifies which layer needs attention first.</h3>
 <p>
 No guesswork. No fluff. Just a clear assessment so you can invest in the right next step.
 </p>
 <ul>
 <li>Understand what is working and what is not.</li>
 <li>See the exact layer causing the most friction.</li>
 <li>Get a prioritized roadmap for what to do next.</li>
 </ul>
 <a href="/brand-diagnostic/" className="method-btn primary full">
 Start the Brand Diagnostic <span>→</span>
 </a>
 </div>
 </div>
 </section>

 <section className="method-tiers">
 <div className="method-shell">
 <div className="method-section-heading center light">
 <p className="method-eyebrow">The Alignment</p>
 <h2>Each tier supports a different level of brand maturity.</h2>
 <p className="method-tier-lede">Where the Brand Diagnostic places you determines the right entry point. Most founders start at Foundation or Structure and grow from there.</p>
 </div>

 <div className="method-tier-grid">
 {tiers.map((tier, index) => (
 <article className={tier.featured ? "featured" : ""} key={tier.title}>
 {tier.featured && <span className="method-popular">Recommended Entry Point</span>}
 <MethodIcon>{tier.icon}</MethodIcon>
 <h3>{tier.title}</h3>
 <p>{tier.body}</p>
 <strong>{tier.cta}</strong>
 <span className="tier-number">{String(index + 1).padStart(2, "0")}</span>
 </article>
 ))}
 </div>
 </div>
 </section>

 <section className="method-why">
 <img className="method-door-sketch" src={assets.floorPlan} alt="" aria-hidden="true" />

 <div className="method-shell method-why-grid">
 <div>
 <p className="method-eyebrow">Why This Works</p>
 <h2>A brand lives in every decision your business makes.</h2>
 </div>

 <div className="method-why-copy">
 <p>
 When your brand is built on truth and structured with intention, it becomes easier
 to lead, easier to market, and impossible to ignore.
 </p>

 <div className="method-proof-grid">
 <div><MethodIcon>✧</MethodIcon><span>Clarity removes confusion.</span></div>
 <div><MethodIcon>▥</MethodIcon><span>Structure creates alignment.</span></div>
 <div><MethodIcon>✓</MethodIcon><span>Execution builds momentum.</span></div>
 <div><MethodIcon>◎</MethodIcon><span>Optimization drives compounding growth.</span></div>
 </div>
 </div>
 </div>
 </section>

 <section className="method-final">
 <div className="method-shell method-final-card">
 <img src={assets.seal} alt="" aria-hidden="true" />
 <div>
 <h2>
 You do not need to rebuild your brand from scratch.
 <em>You need to understand what layer is missing.</em>
 </h2>
 <a href="/brand-diagnostic/" className="method-btn red">
 Start the Brand Diagnostic <span>→</span>
 </a>
 </div>
 </div>
 </section>

 <PublicFooter />
 <MethodologyStyles />
 </main>
 );
}

function MethodologyStyles() {
 return (
 <style>{`
 .method-page {
 min-height: 100vh;
 background: #fbf7f1;
 color: #2b1040;
 overflow-x: hidden;
 font-family: 'DM Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
 }

 .method-shell {
 width: min(1240px, calc(100vw - 96px));
 margin: 0 auto;
 position: relative;
 z-index: 2;
 }

 .method-eyebrow {
 margin: 0 0 14px;
 color: #a71932;
 font-size: 12px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .18em;
 }

 .method-hero {
 position: relative;
 min-height: 820px;
 padding: 72px 0 76px;
 display: flex;
 align-items: center;
 background:
 radial-gradient(circle at 86% 24%, rgba(224, 78, 53, .12), transparent 34%),
 linear-gradient(135deg, #fbf7f1 0%, #f7eee7 52%, #efe0d8 100%);
 border-bottom: 1px solid rgba(120, 55, 90, .14);
 }

 .method-hero-column {
 position: absolute;
 left: -54px;
 bottom: -150px;
 top: auto;
 width: min(380px, 28vw);
 max-height: 820px;
 opacity: .34;
 pointer-events: none;
 z-index: 1;
 }

 .method-hero-grid {
 display: grid;
 grid-template-columns: minmax(0, .82fr) minmax(560px, 1.18fr);
 gap: 34px;
 align-items: center;
 }

 .method-hero h1,
 .method-problem h2,
 .method-section-heading h2,
 .method-scale h2,
 .method-why h2,
 .method-final h2 {
 font-family: 'Playfair Display', Georgia, "Times New Roman", serif;
 letter-spacing: -.055em;
 color: #2b1040;
 }

 .method-hero h1 {
 margin: 0;
 max-width: 620px;
 font-size: clamp(46px, 5.5vw, 78px);
 line-height: .96;
 }

 .method-hero h1 em,
 .method-problem h2 em,
 .method-final h2 em {
 display: block;
 color: #a83a4d;
 font-style: italic;
 font-weight: 400;
 }

 .method-hero-copy > p {
 max-width: 560px;
 color: #5e5364;
 font-size: 16px;
 line-height: 1.78;
 }

 .method-actions {
 display: flex;
 flex-wrap: wrap;
 gap: 18px;
 margin-top: 34px;
 }

 .method-btn {
 min-height: 50px;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 gap: 12px;
 border-radius: 4px;
 padding: 0 26px;
 text-decoration: none;
 font-size: 12px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .08em;
 }

 .method-btn.primary {
 color: #fff;
 background: #2b1040;
 box-shadow: 0 18px 38px rgba(43, 16, 64, .16);
 }

 .method-btn.secondary {
 color: #9b2438;
 background: rgba(255, 255, 255, .38);
 border: 1px solid rgba(155, 36, 56, .34);
 }

 .method-btn.red {
 color: #fff;
 background: linear-gradient(135deg, #d1452c, #a71932);
 }

 .method-btn.full {
 width: 100%;
 }

 .method-hero-stack {
 min-height: 560px;
 position: relative;
 display: grid;
 place-items: center;
 }

 .method-house-sketch {
 position: absolute;
 right: 0;
 bottom: 0;
 width: min(620px, 52vw);
 opacity: .82;
 filter: sepia(.18);
 z-index: 0;
 }

 .method-layer-stack {
 width: min(620px, 100%);
 display: grid;
 gap: 0;
 perspective: 1000px;
 position: relative;
 z-index: 2;
 }

 .method-layer-stack-lifted {
 width: min(960px, 100%);
 margin: 0 auto;
 perspective: 1400px;
 }

 .method-stack-step {
 min-height: 96px;
 display: grid;
 grid-template-columns: 42px 70px 1fr;
 align-items: center;
 gap: 18px;
 padding: 0 32px;
 color: #fff;
 clip-path: polygon(8% 0, 100% 0, 92% 100%, 0 100%);
 box-shadow: 0 22px 34px rgba(43, 16, 64, .18);
 transform: translateX(var(--shift));
 transition: transform 240ms ease, box-shadow 240ms ease;
 }

 .method-layer-stack-lifted .method-stack-step {
 min-height: 132px;
 grid-template-columns: 64px 84px 1fr;
 gap: 28px;
 padding: 22px 44px;
 box-shadow: 0 28px 48px rgba(43, 16, 64, .22);
 }

 .method-layer-stack-lifted .method-stack-step:hover {
 transform: translateX(calc(var(--shift) - 4px));
 box-shadow: 0 32px 58px rgba(43, 16, 64, .28);
 }

 .method-layer-stack-lifted .method-stack-step strong {
 font-size: 20px;
 letter-spacing: .04em;
 }

 .method-layer-stack-lifted .method-stack-step small {
 display: block;
 margin-top: 4px;
 font-size: 14px;
 opacity: .82;
 }

 .method-layer-stack-lifted .method-stack-step p {
 display: block;
 margin: 8px 0 0;
 font-size: 14px;
 line-height: 1.55;
 opacity: .82;
 max-width: 540px;
 }

 .method-layer-stack-lifted .method-stack-step.step-04 p,
 .method-layer-stack-lifted .method-stack-step.step-03 p {
 opacity: 1;
 color: rgba(74, 36, 60, .9);
 }

 .method-layer-stack-lifted .method-stack-step.step-04 small,
 .method-layer-stack-lifted .method-stack-step.step-03 small {
 opacity: 1;
 color: rgba(74, 36, 60, .82);
 }

 .method-layer-stack-lifted .method-stack-step > span {
 font-size: 22px;
 }

 .method-stack-step.step-04 {
 --shift: 34px;
 background: linear-gradient(135deg, #e8c9c9, #c79ba4);
 color: #5a314b;
 }

 .method-stack-step.step-03 {
 --shift: 12px;
 background: linear-gradient(135deg, #a44b6d, #763b5b);
 }

 .method-stack-step.step-02 {
 --shift: -10px;
 background: linear-gradient(135deg, #3a123e, #2b1040);
 }

 .method-stack-step.step-01 {
 --shift: -32px;
 background: linear-gradient(135deg, #e04e35, #a71932);
 }

 .method-stack-step > span {
 font-weight: 900;
 opacity: .88;
 }

 .method-stack-step strong {
 display: block;
 text-transform: uppercase;
 letter-spacing: .08em;
 font-size: 13px;
 }

 .method-stack-step small {
 color: inherit;
 opacity: .82;
 }

 .method-icon {
 width: 48px;
 height: 48px;
 display: inline-grid;
 place-items: center;
 color: #d0a24b;
 font-size: 30px;
 line-height: 1;
 }

 .method-problem {
 padding: 96px 0;
 border-bottom: 1px solid rgba(120, 55, 90, .14);
 background: rgba(255, 255, 255, .24);
 }

 .method-problem-grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 64px;
 align-items: center;
 }

 .method-problem h2 {
 margin: 0;
 font-size: clamp(34px, 4vw, 56px);
 line-height: 1.05;
 }



 .method-problem-card,
 .method-start-card,
 .method-final-card {
 background: rgba(255, 255, 255, .52);
 border: 1px solid rgba(155, 36, 56, .22);
 box-shadow: 0 18px 42px rgba(43, 16, 64, .06);
 }

 .method-problem-card {
 padding: 34px 42px;
 }

 .method-problem-card ul,
 .method-start-card ul {
 margin: 0;
 padding-left: 18px;
 color: #5e5364;
 line-height: 1.8;
 font-size: 14px;
 }

 .method-layers {
 padding: 96px 0 104px;
 }

 .method-section-heading.center {
 text-align: center;
 margin-bottom: 34px;
 }

 .method-section-heading h2 {
 margin: 0;
 font-size: clamp(34px, 4.2vw, 58px);
 line-height: 1.05;
 }



 .method-scale {
 padding: 96px 0;
 border-top: 1px solid rgba(120, 55, 90, .14);
 border-bottom: 1px solid rgba(120, 55, 90, .14);
 background:
 linear-gradient(90deg, rgba(255,255,255,.35), rgba(255,255,255,.08)),
 #fbf7f1;
 }

 .method-scale-grid {
 display: grid;
 grid-template-columns: minmax(0, 1.1fr) minmax(360px, .9fr);
 gap: 58px;
 align-items: center;
 }

 .method-scale h2 {
 margin: 0 0 28px;
 font-size: clamp(34px, 4vw, 54px);
 }



 .method-start-card {
 padding: 44px;
 }

 .method-start-card h3 {
 margin: 0 0 18px;
 color: #2b1040;
 font-family: 'Playfair Display', Georgia, "Times New Roman", serif;
 font-size: 34px;
 line-height: 1.08;
 }

 .method-start-card > p {
 color: #5e5364;
 line-height: 1.7;
 }

 .method-start-card ul {
 margin-bottom: 26px;
 }

 .method-start-card li::marker {
 color: #a71932;
 }

 .method-tiers {
 padding: 96px 0 104px;
 background:
 radial-gradient(circle at 18% 30%, rgba(224,78,53,.16), transparent 36%),
 linear-gradient(135deg, #2b1040, #140717);
 color: #fff;
 }

 .method-section-heading.light h2,
 .method-section-heading.light .method-eyebrow {
 color: #fff;
 }

 .method-section-heading.light .method-eyebrow {
 opacity: .68;
 }

 .method-tier-lede {
 max-width: 620px;
 margin: 18px auto 0;
 color: rgba(255, 255, 255, .76);
 font-size: 16px;
 line-height: 1.7;
 text-align: center;
 }

 .method-tier-grid {
 display: grid;
 grid-template-columns: repeat(5, 1fr);
 gap: 18px;
 margin-top: 36px;
 }

 .method-tier-grid article {
 position: relative;
 min-height: 236px;
 padding: 28px 20px;
 text-align: center;
 background: #fbf7f1;
 color: #2b1040;
 border-radius: 6px;
 border: 1px solid rgba(255,255,255,.18);
 }

 .method-tier-grid article.featured {
 transform: translateY(-12px);
 box-shadow: 0 28px 60px rgba(0,0,0,.28);
 }

 .method-popular {
 position: absolute;
 left: 50%;
 top: -14px;
 transform: translateX(-50%);
 background: #a71932;
 color: #fff;
 border-radius: 999px;
 padding: 6px 14px;
 font-size: 10px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: .12em;
 }

 .method-tier-grid h3 {
 margin: 10px 0;
 font-size: 15px;
 text-transform: uppercase;
 letter-spacing: .12em;
 }

 .method-tier-grid p {
 color: #5e5364;
 font-size: 13px;
 line-height: 1.55;
 }

 .method-tier-grid strong {
 display: block;
 margin-top: 18px;
 color: #a71932;
 font-size: 11px;
 text-transform: uppercase;
 letter-spacing: .1em;
 }

 .tier-number {
 position: absolute;
 bottom: 12px;
 left: 0;
 right: 0;
 color: rgba(167, 25, 50, .34);
 font-size: 11px;
 font-weight: 900;
 }

 .method-why {
 position: relative;
 padding: 96px 0;
 overflow: hidden;
 }

 .method-door-sketch {
 position: absolute;
 left: -40px;
 bottom: -40px;
 width: min(520px, 38vw);
 opacity: .42;
 z-index: 0;
 pointer-events: none;
 }

 .method-why-grid {
 display: grid;
 grid-template-columns: .95fr 1.05fr;
 gap: 70px;
 align-items: start;
 }

 .method-why h2 {
 margin: 0;
 font-size: clamp(36px, 4.4vw, 64px);
 line-height: 1.03;
 }

 .method-why-copy > p {
 color: #5e5364;
 line-height: 1.75;
 max-width: 560px;
 }

 .method-proof-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 18px;
 margin-top: 34px;
 }

 .method-proof-grid div {
 text-align: center;
 }

 .method-proof-grid span:last-child {
 display: block;
 color: #5e5364;
 font-size: 13px;
 line-height: 1.45;
 }

 .method-final {
 padding: 88px 0 96px;
 }

 .method-final-card {
 display: grid;
 grid-template-columns: 130px 1fr;
 gap: 32px;
 align-items: center;
 padding: 34px 44px;
 }

 .method-final-card img {
 width: 96px;
 height: 96px;
 object-fit: contain;
 }

 .method-final h2 {
 margin: 0 0 24px;
 font-size: clamp(36px, 4.4vw, 64px);
 line-height: 1.05;
 }

 @media (max-width: 1100px) {
 .method-shell {
 width: min(100% - 42px, 920px);
 }

 .method-hero-grid,
 .method-problem-grid,
 .method-scale-grid,
 .method-why-grid,
 .method-final-card {
 grid-template-columns: 1fr;
 }

 .method-hero-stack {
 min-height: 520px;
 }

 .method-house-sketch {
 width: min(640px, 88vw);
 right: -80px;
 bottom: -80px;
 }

 .method-hero-column {
 width: 220px;
 left: -80px;
 bottom: -120px;
 opacity: .18;
 }

 .method-proof-grid {
 grid-template-columns: repeat(2, 1fr);
 }

 .method-tier-grid {
 grid-template-columns: repeat(2, 1fr);
 }




 }

 @media (max-width: 680px) {
 .method-shell {
 width: min(100% - 28px, 560px);
 }

 .method-hero {
 padding-top: 58px;
 }

 .method-hero h1 {
 font-size: 42px;
 }

 .method-hero {
 min-height: auto;
 padding-top: 58px;
 }

 .method-hero-stack {
 min-height: 360px;
 }

 .method-house-sketch {
 width: 520px;
 right: -140px;
 bottom: -90px;
 opacity: .22;
 }

 .method-hero-column {
 width: 150px;
 left: -70px;
 bottom: -90px;
 opacity: .14;
 }

 .method-actions {
 display: grid;
 }

 .method-tier-grid,
 .method-proof-grid {
 grid-template-columns: 1fr;
 }

 .method-stack-step {
 grid-template-columns: 34px 48px 1fr;
 padding: 0 20px;
 min-height: 84px;
 transform: none;
 clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%);
 }



 .method-start-card,
 .method-problem-card,
 .method-final-card {
 padding: 28px;
 }
 }
 `}</style>
 );
}
