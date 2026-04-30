import React from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

const products = [
 ["Workbook", "Brand Clarity Workbook", "Define your positioning, promise, audience, and voice.", "$29.00", "Brand Clarity"],
 ["Template Bundle", "Strategic OS Template Bundle", "The core planning system every founder needs to scale.", "$79.00", "Strategic OS"],
 ["Prompt Pack", "Founder Messaging Prompt Pack", "Plug-and-play prompts for clear brand messaging.", "$19.00", "Prompt Pack"],
 ["Toolkit", "Content Planning Toolkit", "Plan, organize, and execute content that drives growth.", "$29.00", "Content Plan"],
 ["Playbook", "Offer Architecture Playbook", "Build irresistible offers that sell with clarity.", "$39.00", "Offer System"],
 ["Audit Kit", "Brand Audit Starter Kit", "Assess your brand and uncover high-impact improvements.", "$19.00", "Brand Audit"],
 ["Bundle", "Launch Planner Bundle", "Plan and launch with structure, confidence, and momentum.", "$49.00", "Launch Plan"],
 ["Template Pack", "AI Workflow Templates", "Save time and scale faster with founder-ready AI workflows.", "$29.00", "AI Workflow"],
];

const categories = [
 "All Products",
 "Templates",
 "Workbooks",
 "Prompt Packs",
 "Courses",
 "Brand Kits",
 "Swipe Files",
 "Playbooks",
];

const footerColumns = {
 Platform: ["Overview", "How It Works", "Features", "Pricing"],
 Solutions: ["For Founders", "For Teams", "For Agencies", "Use Cases"],
 Resources: ["Blog", "Guides", "Templates", "Free Tools"],
 Company: ["About Us", "Our Story", "Careers", "Press"],
};

function Crest({ small = false }) {
 return (
 <img
 src="/brand-assets/logo/cth-logo-seal.png"
 alt="Core Truth House"
 className={`cth-logo-seal-img ${small ? "small" : ""}`}
 />
 );
}

function Eyebrow({ children }) {
 return <p className="cth-store-eyebrow">{children}</p>;
}

function ProductMockup({ title = "Brand Systems", small = false }) {
 return (
 <div className={`cth-product-mockup ${small ? "small" : ""}`}>
 <div className="cth-product-grid" />
 <span className="cth-product-mini-crest">CTH</span>
 <strong>{title}</strong>
 <em>Build. Align. Scale.</em>
 </div>
 );
}

function Hero() {
 return (
 <section className="cth-store-hero">
 <img
 src="/about-assets/columns/cth-column-full-corinthian-blueprint.png"
 alt=""
 aria-hidden="true"
 className="cth-store-hero-column"
 />

 <div className="cth-store-shell cth-store-hero-grid">
 <div>
 <Eyebrow>Digital Products Store</Eyebrow>
 <h1>Digital resources for founders building with structure, not guesswork.</h1>
 <p>
 Shop focused templates, playbooks, and prompt systems built to help service-based founders clarify the brand, align the message, and move with more discipline.
 </p>

 <div className="cth-store-actions">
 <a href="#products" className="cth-store-btn cth-store-btn-primary">
 Shop Digital Products <span>→</span>
 </a>
 <a href="/brand-diagnostic/" className="cth-store-btn cth-store-btn-secondary">
 Start Brand Diagnostic
 </a>
 </div>

 <div className="cth-store-proof">
 <article><strong>⇩</strong><span>Instant Access</span></article>
 </div>
 </div>

 <div className="cth-store-scene">
 <img src="/cth-frontpage-architecture.webp" alt="" aria-hidden="true" className="cth-store-scene-house" />
 <div className="cth-monitor"><ProductMockup title="Brand Systems Template Suite" /></div>
 <div className="cth-laptop"><ProductMockup title="Founder OS Dashboard" small /></div>
 <div className="cth-tablet"><ProductMockup title="Brand Clarity Workbook" small /></div>
 <div className="cth-phone"><ProductMockup title="Prompt Pack" small /></div>
 <div className="cth-badge"><span>Digital Only</span><strong>Instant Access</strong><em>☁</em></div>
 </div>
 </div>
 </section>
 );
}

function Benefits() {
 const items = [
 ["☁", "Instant Downloads", "Access your files immediately."],
 ["▣", "Lifetime Access", "Yours to keep. Use forever."],
 ["▤", "Digital Templates", "Edit, customize, and implement."],
 ["♛", "Founder-Focused", "Built by founders, for founders."],
 ["🛒", "Secure Checkout", "Safe, simple, and fast."],
 ];

 return (
 <section className="cth-store-benefits-wrap">
 <div className="cth-store-shell cth-store-benefits">
 {items.map(([icon, title, text]) => (
 <article key={title}>
 <div>{icon}</div>
 <span>{title}</span>
 <p>{text}</p>
 </article>
 ))}
 </div>
 </section>
 );
}

function CategoryTabs() {
 return (
 <section className="cth-store-tabs-wrap">
 <div className="cth-store-shell">
 <div className="cth-store-tabs">
 {categories.map((category, index) => (
 <button key={category} className={index === 0 ? "active" : ""}>
 {category}
 </button>
 ))}
 </div>
 </div>
 </section>
 );
}

function FeaturedCollection() {
 return (
 <section id="collections" className="cth-store-featured">
 <img
 src="/about-assets/columns/cth-column-capital-schematic-overlay.png"
 alt=""
 aria-hidden="true"
 className="cth-featured-column"
 />

 <div className="cth-store-shell cth-featured-grid">
 <div className="cth-featured-products">
 <ProductMockup title="Brand Systems Collection" />
 <ProductMockup title="Messaging Framework Template" small />
 <ProductMockup title="Brand Audit Checklist" small />
 <ProductMockup title="Visual Identity Guide" small />
 </div>

 <div className="cth-featured-copy">
 <Eyebrow>Featured Collection</Eyebrow>
 <h2>Brand Systems Collection</h2>
 <p>Everything you need to build a cohesive, scalable brand that stands out and drives results.</p>
 <ul>
 <li>Brand Strategy Templates</li>
 <li>Messaging Frameworks</li>
 <li>Visual Identity Guides</li>
 <li>Brand Audit Tools</li>
 <li>And more...</li>
 </ul>
 <a href="#products" className="cth-store-btn cth-store-btn-primary">
 Explore Collection <span>→</span>
 </a>
 </div>
 </div>
 </section>
 );
}

function ProductCard({ product }) {
 const [type, title, text, price, mockup] = product;

 return (
 <article className="cth-product-card">
 <div className="cth-product-card-image">
 <ProductMockup title={mockup} small />
 </div>
 <div className="cth-product-card-body">
 <p>{type}</p>
 <h3>{title}</h3>
 <span>{text}</span>
 <strong>{price}</strong>
 <button type="button" aria-label={`View ${title}`}>View Resource ⇩</button>
 </div>
 </article>
 );
}

function SubscribeCard() {
 return (
 <aside className="cth-store-subscribe">
 <div className="cth-subscribe-icon">✉</div>
 <h2>Founder Resource Drops</h2>
 <p>Get new digital resources, templates, and founder tools delivered straight to your inbox.</p>
 <ul>
 <li>Exclusive Templates</li>
 <li>Strategic Playbooks</li>
 <li>Prompt Packs</li>
 <li>Early Access</li>
 <li>Founder Tips</li>
 </ul>
 <form>
 <input type="email" placeholder="Enter your email" aria-label="Email address" />
 <button type="button">Subscribe <span>→</span></button>
 </form>
 <small>🔒 No spam. Unsubscribe anytime.</small>
 </aside>
 );
}

function BestSellers() {
 return (
 <section id="products" className="cth-store-products-section">
 <div className="cth-store-shell cth-store-products-layout">
 <div>
 <div className="cth-store-section-title">
 <Eyebrow>Best Sellers</Eyebrow>
 <span />
 </div>

 <div className="cth-products-grid">
 {products.map((product) => (
 <ProductCard key={product[1]} product={product} />
 ))}
 </div>
 </div>

 <SubscribeCard />
 </div>
 </section>
 );
}

function CTA() {
 return (
 <section className="cth-store-cta">
 <img
 src="/about-assets/floor-plans/cth-floor-plan-wide-detailed.png"
 alt=""
 aria-hidden="true"
 className="cth-store-cta-plan"
 />
 <img
 src="/about-assets/columns/cth-column-partial-right-sketch.png"
 alt=""
 aria-hidden="true"
 className="cth-store-cta-column"
 />

 <div className="cth-store-shell cth-store-cta-grid">
 <Crest />
 <div>
 <h2>Not sure which resource fits the season your brand is in?</h2>
 <p>Start with the Brand Diagnostic. It will show your top structural gaps and point you toward the right next step.</p>
 </div>
 <a href="/brand-diagnostic/" className="cth-store-btn cth-store-btn-gold">
 Start Diagnostic <span>→</span>
 </a>
 </div>
 </section>
 );
}



export default function StorefrontPage() {
 return (
 <main className="cth-store-page">
 <PublicHeader active="store" />
 <Hero />
 <Benefits />
 <CategoryTabs />
 <FeaturedCollection />
 <BestSellers />
 <CTA />
 <PublicFooter />

 <style>{`
 .cth-store-page {
 min-height: 100vh;
 background: var(--cth-ivory);
 color: var(--cth-purple-deep);
 overflow-x: hidden;
 font-family: 'DM Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
 }

 .cth-store-shell {
 width: min(1540px, calc(100vw - 96px));
 margin: 0 auto;
 position: relative;
 z-index: 2;
 }

 .cth-store-header {
 position: sticky;
 top: 0;
 z-index: 90;
 background: rgba(248,241,236,0.96);
 border-bottom: 1px solid var(--cth-border);
 backdrop-filter: blur(16px);
 }

 .cth-store-header-inner {
 min-height: 72px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 28px;
 }

 .cth-store-wordmark {
 display: flex;
 align-items: center;
 gap: 12px;
 color: var(--cth-ruby);
 text-decoration: none;
 font-family: Georgia, serif;
 font-size: 21px;
 font-weight: 700;
 white-space: nowrap;
 }

 .cth-store-nav {
 display: flex;
 align-items: center;
 gap: 28px;
 }

 .cth-store-nav a {
 position: relative;
 color: var(--cth-purple-deep);
 text-decoration: none;
 font-size: 10px;
 font-weight: 850;
 text-transform: uppercase;
 letter-spacing: 0.15em;
 }

 .cth-store-nav a.active {
 color: var(--cth-crimson);
 }

 .cth-store-nav a.active::after {
 content: "";
 position: absolute;
 left: 0;
 right: 0;
 bottom: -12px;
 height: 2px;
 background: var(--cth-gold);
 }

 .cth-store-crest {
 position: relative;
 display: grid;
 place-items: center;
 width: 76px;
 height: 76px;
 color: var(--cth-ivory);
 background: radial-gradient(circle, var(--cth-crimson), var(--cth-purple-deep));
 border: 1px solid rgba(196,169,91,0.58);
 }

 .cth-store-crest.small {
 width: 38px;
 height: 38px;
 color: var(--cth-crimson);
 background: rgba(255,255,255,0.72);
 border-color: rgba(175,0,36,0.25);
 }

 .cth-store-crest::before {
 content: "";
 position: absolute;
 inset: 7px;
 border: 1px solid rgba(196,169,91,0.32);
 }

 .cth-store-crest-roof {
 position: absolute;
 top: 9px;
 color: var(--cth-gold);
 font-size: 11px;
 }

 .cth-store-crest.small .cth-store-crest-roof {
 top: 4px;
 font-size: 7px;
 }

 .cth-store-crest-text {
 position: relative;
 font-family: Georgia, serif;
 font-size: 30px;
 font-weight: 800;
 letter-spacing: -0.08em;
 }

 .cth-store-crest.small .cth-store-crest-text {
 font-size: 13px;
 }

 .cth-store-eyebrow {
 margin: 0;
 color: var(--cth-crimson);
 font-size: 11px;
 font-weight: 900;
 letter-spacing: 0.22em;
 text-transform: uppercase;
 }

 .cth-store-btn {
 min-height: 46px;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 gap: 14px;
 padding: 0 28px;
 border-radius: 4px;
 border: 1px solid transparent;
 text-decoration: none;
 text-transform: uppercase;
 letter-spacing: 0.14em;
 font-size: 11px;
 font-weight: 900;
 }

 .cth-store-btn-small {
 min-height: 40px;
 padding: 0 22px;
 font-size: 10px;
 }

 .cth-store-btn-primary {
 background: var(--cth-crimson);
 color: var(--cth-white);
 box-shadow: 0 14px 28px rgba(175,0,36,0.16);
 }

 .cth-store-btn-secondary {
 color: var(--cth-ruby);
 background: rgba(255,255,255,0.52);
 border-color: rgba(196,169,91,0.72);
 }

 .cth-store-btn-gold {
 background: var(--cth-gold);
 color: var(--cth-purple-deep);
 }

 .cth-store-hero {
 position: relative;
 overflow: hidden;
 padding: 62px 0 34px;
 border-bottom: 1px solid var(--cth-border);
 background: var(--cth-ivory);
 }

 .cth-store-hero-column {
 position: absolute;
 left: -90px;
 top: 26px;
 width: 300px;
 opacity: 0.14;
 pointer-events: none;
 }

 .cth-store-hero-grid {
 display: grid;
 grid-template-columns: 0.98fr 1.02fr;
 gap: 58px;
 align-items: center;
 }

 .cth-store-hero h1 {
 margin: 20px 0 22px;
 max-width: 740px;
 font-family: Georgia, serif;
 color: var(--cth-purple-deep);
 font-size: clamp(3.8rem, 5.2vw, 6rem);
 line-height: 0.96;
 letter-spacing: -0.06em;
 font-weight: 500;
 }

 .cth-store-hero p {
 max-width: 680px;
 color: var(--cth-ink-soft);
 font-size: 16px;
 line-height: 1.75;
 font-weight: 650;
 }

 .cth-store-actions {
 margin-top: 28px;
 display: flex;
 flex-wrap: wrap;
 gap: 22px;
 }

 .cth-store-proof {
 margin-top: 34px;
 display: grid;
 grid-template-columns: repeat(3, minmax(0, 1fr));
 gap: 22px;
 max-width: 760px;
 }

 .cth-store-proof article {
 min-height: 72px;
 display: flex;
 align-items: center;
 gap: 14px;
 border-right: 1px solid var(--cth-border);
 padding-right: 20px;
 }

 .cth-store-proof article:last-child {
 border-right: 0;
 }

 .cth-store-proof strong {
 color: var(--cth-gold);
 font-size: 26px;
 font-family: Georgia, serif;
 line-height: 1;
 }

 .cth-store-proof span {
 color: var(--cth-ink-soft);
 font-size: 12px;
 font-weight: 750;
 line-height: 1.35;
 }

 .cth-store-scene {
 position: relative;
 min-height: 500px;
 }

 .cth-store-scene-house {
 position: absolute;
 inset: 0 auto auto 6%;
 width: 92%;
 opacity: 0.25;
 pointer-events: none;
 }

 .cth-monitor {
 position: absolute;
 right: 72px;
 top: 98px;
 width: 420px;
 padding: 14px;
 border-radius: 14px;
 background: var(--cth-purple-black);
 box-shadow: 0 30px 70px rgba(13,0,16,0.22);
 }

 .cth-laptop {
 position: absolute;
 left: 24px;
 bottom: 52px;
 width: 310px;
 padding: 10px;
 border-radius: 12px;
 background: var(--cth-purple-black);
 box-shadow: 0 24px 54px rgba(13,0,16,0.18);
 }

 .cth-tablet {
 position: absolute;
 right: 42px;
 bottom: 66px;
 width: 170px;
 padding: 8px;
 border-radius: 14px;
 background: var(--cth-purple-black);
 box-shadow: 0 24px 54px rgba(13,0,16,0.16);
 }

 .cth-phone {
 position: absolute;
 right: 0;
 bottom: 42px;
 width: 88px;
 padding: 6px;
 border-radius: 13px;
 background: var(--cth-purple-black);
 box-shadow: 0 24px 54px rgba(13,0,16,0.16);
 }

 .cth-badge {
 position: absolute;
 right: 12px;
 top: 62px;
 width: 116px;
 height: 116px;
 border-radius: 999px;
 display: grid;
 place-items: center;
 text-align: center;
 background: var(--cth-purple-deep);
 border: 3px solid var(--cth-gold);
 color: var(--cth-white);
 box-shadow: 0 20px 44px rgba(13,0,16,0.22);
 }

 .cth-badge span,
 .cth-badge strong {
 display: block;
 text-transform: uppercase;
 font-size: 10px;
 letter-spacing: 0.12em;
 }

 .cth-badge em {
 color: var(--cth-gold);
 font-style: normal;
 font-size: 20px;
 }

 .cth-product-mockup {
 position: relative;
 overflow: hidden;
 min-height: 210px;
 display: grid;
 place-items: center;
 text-align: center;
 background: linear-gradient(135deg, rgba(51,3,60,0.96), rgba(13,0,16,0.92));
 border: 1px solid rgba(196,169,91,0.22);
 color: var(--cth-white);
 }

 .cth-product-mockup.small {
 min-height: 140px;
 }

 .cth-product-grid {
 position: absolute;
 inset: 0;
 background-image:
 linear-gradient(rgba(196,169,91,0.12) 1px, transparent 1px),
 linear-gradient(90deg, rgba(196,169,91,0.10) 1px, transparent 1px);
 background-size: 32px 32px;
 opacity: 0.7;
 }

 .cth-product-mini-crest {
 position: absolute;
 top: 18px;
 left: 50%;
 transform: translateX(-50%);
 color: var(--cth-gold);
 font-family: Georgia, serif;
 font-size: 17px;
 font-weight: 800;
 }

 .cth-product-mockup strong {
 position: relative;
 z-index: 2;
 max-width: 85%;
 margin-top: 16px;
 font-family: Georgia, serif;
 font-size: 31px;
 line-height: 1.1;
 letter-spacing: -0.035em;
 font-weight: 500;
 }

 .cth-product-mockup.small strong {
 font-size: 22px;
 }

 .cth-product-mockup em {
 position: relative;
 z-index: 2;
 margin-top: 8px;
 color: var(--cth-gold);
 font-size: 11px;
 letter-spacing: 0.12em;
 text-transform: uppercase;
 font-style: normal;
 }

 .cth-store-benefits-wrap {
 padding: 22px 0 18px;
 background: var(--cth-ivory);
 }

 .cth-store-benefits {
 display: grid;
 grid-template-columns: repeat(5, 1fr);
 border: 1px solid var(--cth-border);
 border-radius: 10px;
 overflow: hidden;
 background: rgba(255,255,255,0.44);
 }

 .cth-store-benefits article {
 display: grid;
 grid-template-columns: 58px 1fr;
 column-gap: 14px;
 align-items: center;
 padding: 22px 24px;
 border-right: 1px solid var(--cth-border);
 }

 .cth-store-benefits article:last-child {
 border-right: 0;
 }

 .cth-store-benefits div {
 grid-row: span 2;
 color: var(--cth-gold);
 font-size: 38px;
 }

 .cth-store-benefits span {
 color: var(--cth-ruby);
 font-family: Georgia, serif;
 font-size: 19px;
 line-height: 1.1;
 }

 .cth-store-benefits p {
 margin: 4px 0 0;
 color: var(--cth-ink-soft);
 font-size: 12px;
 line-height: 1.35;
 font-weight: 650;
 }

 .cth-store-tabs-wrap {
 padding: 18px 0 22px;
 background: var(--cth-ivory);
 }

 .cth-store-tabs {
 display: grid;
 grid-template-columns: 1.05fr repeat(7, 1fr);
 border: 1px solid var(--cth-border);
 border-radius: 8px;
 overflow: hidden;
 background: rgba(255,255,255,0.42);
 }

 .cth-store-tabs button {
 min-height: 56px;
 border: 0;
 border-right: 1px solid var(--cth-border);
 background: transparent;
 color: var(--cth-ink-soft);
 text-transform: uppercase;
 letter-spacing: 0.13em;
 font-size: 11px;
 font-weight: 900;
 }

 .cth-store-tabs button.active {
 background: var(--cth-crimson);
 color: var(--cth-white);
 border-radius: 999px;
 margin: 10px 16px;
 min-height: 36px;
 }

 .cth-store-featured {
 position: relative;
 padding: 18px 0 42px;
 }

 .cth-featured-column {
 position: absolute;
 right: 54px;
 top: 54px;
 width: 330px;
 opacity: 0.17;
 pointer-events: none;
 }

 .cth-featured-grid {
 display: grid;
 grid-template-columns: 1.08fr 0.92fr;
 gap: 54px;
 align-items: center;
 }

 .cth-featured-products {
 position: relative;
 min-height: 410px;
 overflow: hidden;
 border-radius: 8px;
 background: var(--cth-purple-deep);
 border: 1px solid rgba(196,169,91,0.22);
 box-shadow: 0 20px 48px rgba(13,0,16,0.12);
 }

 .cth-featured-products > .cth-product-mockup:first-child {
 position: absolute;
 left: 29%;
 top: 74px;
 width: 390px;
 z-index: 3;
 box-shadow: 0 22px 46px rgba(0,0,0,0.22);
 }

 .cth-featured-products > .cth-product-mockup:nth-child(2) {
 position: absolute;
 left: 46px;
 top: 92px;
 width: 190px;
 transform: rotate(-7deg);
 }

 .cth-featured-products > .cth-product-mockup:nth-child(3) {
 position: absolute;
 right: 54px;
 top: 44px;
 width: 170px;
 }

 .cth-featured-products > .cth-product-mockup:nth-child(4) {
 position: absolute;
 right: 42px;
 bottom: 42px;
 width: 150px;
 }

 .cth-featured-copy h2 {
 margin: 16px 0 18px;
 font-family: Georgia, serif;
 color: var(--cth-purple-deep);
 font-size: clamp(3rem, 4vw, 5rem);
 line-height: 0.96;
 letter-spacing: -0.06em;
 font-weight: 500;
 }

 .cth-featured-copy p {
 max-width: 560px;
 color: var(--cth-ink-soft);
 font-size: 16px;
 line-height: 1.7;
 font-weight: 650;
 }

 .cth-featured-copy ul {
 list-style: none;
 padding: 0;
 margin: 22px 0 28px;
 display: grid;
 gap: 9px;
 }

 .cth-featured-copy li {
 color: var(--cth-ink-soft);
 font-size: 14px;
 font-weight: 700;
 }

 .cth-featured-copy li::before {
 content: "✓";
 color: var(--cth-gold);
 margin-right: 10px;
 }

 .cth-store-products-section {
 padding: 0 0 42px;
 }

 .cth-store-products-layout {
 display: grid;
 grid-template-columns: minmax(0, 1fr) 310px;
 gap: 36px;
 align-items: start;
 }

 .cth-store-section-title {
 display: flex;
 align-items: center;
 gap: 22px;
 margin-bottom: 22px;
 }

 .cth-store-section-title span {
 height: 1px;
 flex: 1;
 background: var(--cth-border);
 }

 .cth-products-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 22px;
 }

 .cth-product-card {
 overflow: hidden;
 border: 1px solid var(--cth-border);
 border-radius: 8px;
 background: rgba(255,255,255,0.68);
 box-shadow: 0 18px 42px rgba(20,15,43,0.05);
 }

 .cth-product-card-image {
 padding: 12px;
 background: var(--cth-ivory-soft);
 }

 .cth-product-card-body {
 padding: 16px;
 }

 .cth-product-card-body p {
 margin: 0 0 6px;
 color: var(--cth-crimson);
 text-transform: uppercase;
 letter-spacing: 0.14em;
 font-size: 9px;
 font-weight: 900;
 }

 .cth-product-card-body h3 {
 margin: 0 0 8px;
 color: var(--cth-purple-deep);
 font-family: Georgia, serif;
 font-size: 22px;
 line-height: 1.06;
 letter-spacing: -0.035em;
 font-weight: 500;
 }

 .cth-product-card-body span {
 display: block;
 color: var(--cth-ink-soft);
 font-size: 12px;
 line-height: 1.45;
 font-weight: 650;
 min-height: 50px;
 }

 .cth-product-card-body strong {
 display: block;
 margin: 12px 0;
 color: var(--cth-purple-deep);
 font-size: 15px;
 }

 .cth-product-card-body button {
 width: 100%;
 min-height: 34px;
 border-radius: 4px;
 border: 1px solid rgba(196,169,91,0.55);
 background: rgba(255,255,255,0.52);
 color: var(--cth-ruby);
 text-transform: uppercase;
 letter-spacing: 0.12em;
 font-size: 9px;
 font-weight: 900;
 }

 .cth-store-subscribe {
 position: sticky;
 top: 104px;
 overflow: hidden;
 padding: 44px 32px 32px;
 border-radius: 8px;
 background: var(--cth-purple-deep);
 color: var(--cth-white);
 box-shadow: 0 26px 54px rgba(13,0,16,0.16);
 }

 .cth-subscribe-icon {
 width: 78px;
 height: 78px;
 display: grid;
 place-items: center;
 margin: 0 auto 26px;
 border: 1px solid rgba(196,169,91,0.56);
 color: var(--cth-gold);
 font-size: 34px;
 }

 .cth-store-subscribe h2 {
 margin: 0;
 color: var(--cth-on-dark);
 text-align: center;
 font-family: Georgia, serif;
 font-size: 38px;
 line-height: 1.05;
 letter-spacing: -0.05em;
 font-weight: 500;
 }

 .cth-store-subscribe p {
 color: rgba(255,255,255,0.72);
 font-size: 14px;
 line-height: 1.7;
 text-align: center;
 }

 .cth-store-subscribe ul {
 list-style: none;
 padding: 0;
 margin: 26px 0;
 display: grid;
 gap: 12px;
 }

 .cth-store-subscribe li {
 color: rgba(255,255,255,0.78);
 font-size: 13px;
 }

 .cth-store-subscribe li::before {
 content: "✓";
 color: var(--cth-gold);
 margin-right: 10px;
 }

 .cth-store-subscribe form {
 display: grid;
 gap: 14px;
 }

 .cth-store-subscribe input {
 width: 100%;
 min-height: 48px;
 padding: 0 14px;
 border-radius: 4px;
 border: 1px solid rgba(196,169,91,0.36);
 background: rgba(255,255,255,0.05);
 color: var(--cth-white);
 }

 .cth-store-subscribe button {
 min-height: 48px;
 border: 0;
 border-radius: 4px;
 background: var(--cth-crimson);
 color: var(--cth-white);
 text-transform: uppercase;
 letter-spacing: 0.13em;
 font-size: 11px;
 font-weight: 900;
 }

 .cth-store-subscribe small {
 display: block;
 margin-top: 18px;
 color: rgba(255,255,255,0.58);
 font-size: 11px;
 }

 .cth-store-cta {
 position: relative;
 overflow: hidden;
 background: var(--cth-purple-deep);
 color: var(--cth-white);
 padding: 38px 0;
 }

 .cth-store-cta-plan {
 position: absolute;
 left: -70px;
 top: -60px;
 width: 420px;
 opacity: 0.10;
 mix-blend-mode: screen;
 }

 .cth-store-cta-column {
 position: absolute;
 right: -40px;
 bottom: -60px;
 width: 320px;
 opacity: 0.12;
 mix-blend-mode: screen;
 }

 .cth-store-cta-grid {
 display: grid;
 grid-template-columns: 160px 1fr auto;
 gap: 54px;
 align-items: center;
 }

 .cth-store-cta h2 {
 margin: 0 0 8px;
 max-width: 800px;
 font-family: Georgia, serif;
 color: var(--cth-on-dark);
 font-size: clamp(2rem, 3.1vw, 3.6rem);
 line-height: 1.02;
 letter-spacing: -0.05em;
 font-weight: 500;
 }

 .cth-store-cta p {
 margin: 0;
 color: rgba(255,255,255,0.72);
 font-size: 14px;
 }

 .cth-store-proof-strip {
 padding: 24px 0;
 background: var(--cth-ivory-soft);
 border-bottom: 1px solid var(--cth-border);
 }

 .cth-store-proof-grid {
 display: grid;
 grid-template-columns: 1.1fr repeat(3, 1fr);
 gap: 28px;
 align-items: center;
 }

 .cth-store-proof-grid article,
 .cth-store-proof-grid blockquote {
 margin: 0;
 padding-right: 24px;
 border-right: 1px solid var(--cth-border);
 color: var(--cth-ink-soft);
 font-size: 14px;
 line-height: 1.55;
 }

 .cth-store-proof-grid blockquote:last-child {
 border-right: 0;
 }

 .cth-store-proof-grid h3 {
 margin: 0 0 8px;
 color: var(--cth-purple-deep);
 font-family: Georgia, serif;
 font-size: 24px;
 line-height: 1.1;
 text-transform: uppercase;
 letter-spacing: 0.04em;
 font-weight: 500;
 }

 .cth-store-proof-grid article p {
 margin: 0 0 4px;
 color: var(--cth-gold);
 font-size: 20px;
 }

 .cth-store-proof-grid strong {
 display: block;
 margin-top: 8px;
 color: var(--cth-purple-deep);
 }

 .cth-store-logo-strip {
 padding: 22px 0;
 background: var(--cth-ivory);
 border-bottom: 1px solid var(--cth-border);
 }

 .cth-store-logo-strip .cth-store-eyebrow {
 text-align: center;
 }

 .cth-store-logo-row {
 margin-top: 18px;
 display: grid;
 grid-template-columns: repeat(6, 1fr);
 gap: 18px;
 }

 .cth-store-logo-row span {
 text-align: center;
 color: var(--cth-purple-deep);
 text-transform: uppercase;
 letter-spacing: 0.16em;
 font-size: 12px;
 font-weight: 900;
 }

 .cth-store-footer {
 background: var(--cth-dark);
 color: white;
 padding: 34px 0 14px;
 }

 .cth-store-footer-grid {
 display: grid;
 grid-template-columns: 1.2fr repeat(5, 1fr);
 gap: 44px;
 }

 .cth-store-footer-brand h3 {
 margin: 12px 0 2px;
 color: var(--cth-gold);
 font-family: Georgia, serif;
 font-size: 22px;
 font-weight: 500;
 }

 .cth-store-footer-brand p {
 color: rgba(255,255,255,0.64);
 font-size: 12px;
 line-height: 1.5;
 }

 .cth-store-socials {
 display: flex;
 gap: 10px;
 margin-top: 18px;
 }

 .cth-store-socials span {
 width: 28px;
 height: 28px;
 display: grid;
 place-items: center;
 border: 1px solid rgba(196,169,91,0.36);
 border-radius: 999px;
 color: var(--cth-gold);
 font-size: 10px;
 }

 .cth-store-footer-col h4 {
 margin: 0 0 14px;
 color: var(--cth-gold);
 text-transform: uppercase;
 letter-spacing: 0.16em;
 font-size: 11px;
 }

 .cth-store-footer-col a,
 .cth-store-footer-col span {
 display: block;
 margin-bottom: 8px;
 color: rgba(255,255,255,0.68);
 text-decoration: none;
 font-size: 12px;
 }

 .cth-store-footer-bottom {
 margin-top: 28px;
 padding-top: 14px;
 border-top: 1px solid rgba(255,255,255,0.12);
 display: flex;
 justify-content: space-between;
 color: rgba(255,255,255,0.55);
 font-size: 11px;
 }

 .cth-store-footer-bottom div {
 display: flex;
 gap: 24px;
 }

 .cth-store-footer-bottom a {
 color: rgba(255,255,255,0.65);
 text-decoration: none;
 }

 @media (max-width: 1280px) {
 .cth-store-shell {
 width: min(100% - 40px, 1540px);
 }

 .cth-store-nav {
 display: none;
 }

 .cth-store-hero-grid,
 .cth-featured-grid,
 .cth-store-products-layout,
 .cth-store-cta-grid {
 grid-template-columns: 1fr;
 }

 .cth-store-benefits,
 .cth-store-tabs,
 .cth-products-grid,
 .cth-store-proof-grid,
 .cth-store-logo-row,
 .cth-store-footer-grid {
 grid-template-columns: repeat(2, 1fr);
 }

 .cth-store-subscribe {
 position: relative;
 top: auto;
 }

 .cth-store-hero-column,
 .cth-featured-column,
 .cth-store-cta-plan,
 .cth-store-cta-column {
 display: none;
 }

 .cth-store-scene {
 min-height: 560px;
 }
 }

 @media (max-width: 760px) {
 .cth-store-hero h1 {
 font-size: 3.8rem;
 }

 .cth-store-benefits,
 .cth-store-tabs,
 .cth-products-grid,
 .cth-store-proof-grid,
 .cth-store-logo-row,
 .cth-store-footer-grid,
 .cth-store-proof {
 grid-template-columns: 1fr;
 }

 .cth-store-proof article {
 border-right: 0;
 border-bottom: 1px solid var(--cth-border);
 padding-bottom: 14px;
 }

 .cth-store-scene {
 min-height: 460px;
 }

 .cth-monitor {
 right: 0;
 left: 0;
 margin: auto;
 width: 78%;
 }

 .cth-laptop,
 .cth-tablet,
 .cth-phone,
 .cth-badge {
 display: none;
 }

 .cth-featured-products {
 min-height: 340px;
 }

 .cth-featured-products > .cth-product-mockup:first-child {
 left: 8%;
 width: 84%;
 }

 .cth-featured-products > .cth-product-mockup:not(:first-child) {
 display: none;
 }

 .cth-store-cta-grid {
 gap: 26px;
 }

 .cth-store-footer-bottom {
 flex-direction: column;
 gap: 14px;
 }
 }
 `}</style>
 </main>
 );
}
