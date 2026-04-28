import React from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

const contactStats = [
 {
 icon: "✉",
 label: "Email",
 value: "hello@coretruthhouse.com",
 },
 {
 icon: "☎",
 label: "Phone",
 value: "(205) 555-0196",
 },
 {
 icon: "⌖",
 label: "Location",
 value: "Birmingham, AL",
 },
 {
 icon: "◷",
 label: "Response Time",
 value: "Within 1-2 business days",
 },
];

const sideCards = [
 {
 icon: "▣",
 title: "Start With the Diagnostic",
 text: "Get a clear read on your brand gaps before deciding what support or system you need next.",
 action: "Start Diagnostic",
 },
 {
 icon: "☏",
 title: "Customer Support",
 text: "Need help with your account or platform? Our support team is here to assist you promptly and personally.",
 action: "Get Support",
 },
 {
 icon: "◎",
 title: "Partnerships & Press",
 text: "We’re always open to meaningful partnerships and press inquiries that align with our mission and values.",
 action: "Reach Out",
 },
];

const helpCards = [
 {
 icon: "▥",
 title: "Brand Strategy",
 text: "Build a timeless brand foundation with clarity, conviction, and strategic precision.",
 action: "Learn More",
 },
 {
 icon: "▤",
 title: "Brand Diagnostic",
 text: "Start with a focused assessment that shows your Brand Score and the structure your business needs next.",
 action: "Start Diagnostic",
 },
 {
 icon: "◇",
 title: "Technical Support",
 text: "Get help with your account, integrations, and platform technical questions.",
 action: "Get Support",
 },
 {
 icon: "∞",
 title: "Partnerships",
 text: "Explore partnership opportunities that create impact and drive mutual growth.",
 action: "Explore Partnerships",
 },
];

const faqItems = [
 "How quickly will we hear back?",
 "Do you offer demos?",
 "Where is Core Truth House based?",
 "Can I contact support directly?",
];

const logos = [
 "Veritas Ventures",
 "Northstar Capital",
 "Elevate Partners",
 "Clarion Capital",
 "Summit Partners",
 "Pioneer Labs",
];

const footerColumns = {
 Platform: ["Overview", "Features", "How It Works", "Integrations", "Pricing"],
 Solutions: ["For Founders", "For Teams", "For Investors", "Industries", "Use Cases"],
 Resources: ["Blog", "Guides", "Templates", "Case Studies", "Webinars"],
 Company: ["About Us", "Our Story", "Values", "Careers", "Press"],
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

function Eyebrow({ children, light = false }) {
 return <p className={`cth-contact-eyebrow ${light ? "light" : ""}`}>{children}</p>;
}

function Hero() {
 return (
 <section className="cth-contact-hero">
 <img
 src="/about-assets/columns/cth-column-full-corinthian-blueprint.png"
 alt=""
 aria-hidden="true"
 className="cth-contact-hero-column"
 />

 <div className="cth-contact-shell cth-contact-hero-grid">
 <div className="cth-contact-hero-copy">
 <Eyebrow>Contact</Eyebrow>
 <h1>Ask the question. Start with structure.</h1>
 <p>
 Reach out for support, partnerships, or account questions. If you are trying to understand why your brand feels scattered, start with the Brand Diagnostic first.
 </p>
 </div>

 <div className="cth-contact-hero-house">
 <img src="/cth-frontpage-architecture.webp" alt="Core Truth House architectural headquarters" />
 </div>
 </div>
 </section>
 );
}

function ContactStats() {
 return (
 <section className="cth-contact-stats-wrap">
 <div className="cth-contact-shell cth-contact-stats">
 {contactStats.map((item) => (
 <article key={item.label}>
 <div>{item.icon}</div>
 <span>{item.label}</span>
 <p>{item.value}</p>
 </article>
 ))}
 </div>
 </section>
 );
}

function ContactForm() {
 return (
 <section className="cth-contact-form-section">
 <img
 src="/about-assets/columns/cth-column-partial-right-sketch.png"
 alt=""
 aria-hidden="true"
 className="cth-contact-mid-column"
 />

 <div className="cth-contact-shell cth-contact-form-grid">
 <form className="cth-contact-form">
 <h2>Send Us a Message</h2>
 <p>We’ll get back to you within 1-2 business days.</p>

 <div className="cth-contact-field-grid">
 <input type="text" placeholder="First Name *" aria-label="First Name" />
 <input type="text" placeholder="Last Name *" aria-label="Last Name" />
 <input type="email" placeholder="Email Address *" aria-label="Email Address" />
 <input type="text" placeholder="Company" aria-label="Company" />
 </div>

 <select aria-label="Reason for Inquiry" defaultValue="">
 <option value="" disabled>Reason for Inquiry *</option>
 <option>Brand Diagnostic question</option>
 <option>Platform or pricing question</option>
 <option>Customer support</option>
 <option>Partnerships and press</option>
 </select>

 <textarea
 placeholder="Message *&#10;Tell us what you are trying to clarify, fix, or understand."
 aria-label="Message"
 />

 <button type="button">
 Send Message <span>→</span>
 </button>

 <small>🔒 Your information is secure and will never be shared.</small>
 </form>

 <aside className="cth-contact-side-cards">
 {sideCards.map((card) => (
 <article key={card.title}>
 <div className="cth-contact-side-icon">{card.icon}</div>
 <div>
 <h3>{card.title}</h3>
 <p>{card.text}</p>
 {card.action === "Start Diagnostic" ? (<a href="/brand-diagnostic/">{card.action} <span>→</span></a>) : (<Link to="/contact">{card.action} <span>→</span></Link>)}
 </div>
 </article>
 ))}
 </aside>
 </div>
 </section>
 );
}

function HelpCards() {
 return (
 <section className="cth-contact-help-section">
 <div className="cth-contact-shell">
 <div className="cth-contact-centered-heading">
 <div className="cth-contact-heading-rule" />
 <Eyebrow>Ways We Can Help</Eyebrow>
 <h2>What Can We Help You With?</h2>
 </div>

 <div className="cth-contact-help-grid">
 {helpCards.map((card) => (
 <article key={card.title}>
 <div>{card.icon}</div>
 <h3>{card.title}</h3>
 <p>{card.text}</p>
 {card.action === "Start Diagnostic" ? (<a href="/brand-diagnostic/">{card.action} <span>→</span></a>) : (<Link to="/contact">{card.action} <span>→</span></Link>)}
 </article>
 ))}
 </div>
 </div>
 </section>
 );
}

function FAQ() {
 return (
 <section className="cth-contact-faq-section">
 <div className="cth-contact-shell cth-contact-faq-shell">
 <div className="cth-contact-centered-heading">
 <div className="cth-contact-heading-rule" />
 <Eyebrow>Quick Answers</Eyebrow>
 <h2>Frequently Asked Questions</h2>
 </div>

 <div className="cth-contact-faq-list">
 {faqItems.map((item) => (
 <button type="button" key={item}>
 <span>{item}</span>
 <strong>+</strong>
 </button>
 ))}
 </div>
 </div>
 </section>
 );
}

function CTA() {
 return (
 <section className="cth-contact-cta">
 <img
 src="/about-assets/floor-plans/cth-floor-plan-wide-detailed.png"
 alt=""
 aria-hidden="true"
 className="cth-contact-cta-plan-left"
 />
 <img
 src="/about-assets/columns/cth-column-capital-schematic-overlay.png"
 alt=""
 aria-hidden="true"
 className="cth-contact-cta-column-right"
 />

 <div className="cth-contact-shell cth-contact-cta-grid">
 <div className="cth-contact-cta-crest">
 <Crest />
 </div>

 <div>
 <h2>Not sure what your brand needs next?</h2>
 <p>Start with the Brand Diagnostic. It will show your top structural gaps and point you toward the right next step.</p>
 </div>

 <a href="/brand-diagnostic/" className="cth-contact-btn cth-contact-btn-gold">
 Start Diagnostic <span>→</span>
 </a>
 </div>
 </section>
 );
}

function LogoStrip() {
 return (
 <section className="cth-contact-logo-strip">
 <div className="cth-contact-shell">
 <Eyebrow>Trusted by Founders & Teams Worldwide</Eyebrow>
 <div className="cth-contact-logo-row">
 {logos.map((logo) => (
 <span key={logo}>{logo}</span>
 ))}
 </div>
 </div>
 </section>
 );
}

export default function ContactPage() {
 return (
 <main className="cth-contact-page">
 <PublicHeader active="contact" />
 <Hero />
 <ContactStats />
 <ContactForm />
 <HelpCards />
 <FAQ />
 <CTA />
 <LogoStrip />
 <PublicFooter />

 <style>{`
 .cth-contact-page {
 min-height: 100vh;
 background: var(--cth-ivory);
 color: var(--cth-purple-deep);
 overflow-x: hidden;
 font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
 }

 .cth-contact-shell {
 width: min(1540px, calc(100vw - 96px));
 margin: 0 auto;
 position: relative;
 z-index: 2;
 }

 .cth-contact-header {
 position: sticky;
 top: 0;
 z-index: 90;
 background: rgba(248,241,236,0.96);
 border-bottom: 1px solid var(--cth-border);
 backdrop-filter: blur(16px);
 }

 .cth-contact-header-inner {
 min-height: 72px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 28px;
 }

 .cth-contact-wordmark {
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

 .cth-contact-nav {
 display: flex;
 align-items: center;
 gap: 28px;
 }

 .cth-contact-nav a {
 position: relative;
 color: var(--cth-ink-soft);
 text-decoration: none;
 font-size: 10px;
 font-weight: 850;
 text-transform: uppercase;
 letter-spacing: 0.15em;
 }

 .cth-contact-nav a.active {
 color: var(--cth-crimson);
 }

 .cth-contact-nav a.active::after {
 content: "";
 position: absolute;
 left: 0;
 right: 0;
 bottom: -12px;
 height: 2px;
 background: var(--cth-gold);
 }

 .cth-contact-crest {
 position: relative;
 display: grid;
 place-items: center;
 width: 76px;
 height: 76px;
 color: var(--cth-ivory);
 background: radial-gradient(circle, var(--cth-crimson), var(--cth-purple-deep));
 border: 1px solid rgba(196,169,91,0.58);
 }

 .cth-contact-crest.small {
 width: 38px;
 height: 38px;
 color: var(--cth-crimson);
 background: rgba(255,255,255,0.72);
 border-color: rgba(175,0,36,0.25);
 }

 .cth-contact-crest::before {
 content: "";
 position: absolute;
 inset: 7px;
 border: 1px solid rgba(196,169,91,0.32);
 }

 .cth-contact-crest-roof {
 position: absolute;
 top: 9px;
 color: var(--cth-gold);
 font-size: 11px;
 }

 .cth-contact-crest.small .cth-contact-crest-roof {
 top: 4px;
 font-size: 7px;
 }

 .cth-contact-crest-text {
 position: relative;
 font-family: Georgia, serif;
 font-size: 30px;
 font-weight: 800;
 letter-spacing: -0.08em;
 }

 .cth-contact-crest.small .cth-contact-crest-text {
 font-size: 13px;
 }

 .cth-contact-eyebrow {
 margin: 0;
 color: var(--cth-crimson);
 font-size: 11px;
 font-weight: 900;
 letter-spacing: 0.22em;
 text-transform: uppercase;
 }

 .cth-contact-eyebrow.light {
 color: var(--cth-gold);
 }

 .cth-contact-btn {
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

 .cth-contact-btn-small {
 min-height: 40px;
 padding: 0 22px;
 font-size: 10px;
 }

 .cth-contact-btn-primary {
 background: var(--cth-crimson);
 color: var(--cth-white);
 box-shadow: 0 14px 28px rgba(175,0,36,0.16);
 }

 .cth-contact-btn-gold {
 background: var(--cth-gold);
 color: var(--cth-purple-deep);
 }

 .cth-contact-hero {
 position: relative;
 overflow: hidden;
 padding: 62px 0 38px;
 border-bottom: 1px solid var(--cth-border);
 background: var(--cth-ivory);
 }

 .cth-contact-hero-column {
 position: absolute;
 left: -88px;
 top: 24px;
 width: 290px;
 opacity: 0.15;
 pointer-events: none;
 user-select: none;
 }

 .cth-contact-hero-grid {
 display: grid;
 grid-template-columns: 0.92fr 1.08fr;
 gap: 72px;
 align-items: center;
 }

 .cth-contact-hero h1 {
 margin: 20px 0 22px;
 max-width: 640px;
 font-family: Georgia, serif;
 color: var(--cth-purple-deep);
 font-size: clamp(4rem, 5.7vw, 6.4rem);
 line-height: 0.92;
 letter-spacing: -0.06em;
 font-weight: 500;
 }

 .cth-contact-hero p {
 max-width: 660px;
 color: var(--cth-ink-soft);
 font-size: 16px;
 line-height: 1.75;
 font-weight: 650;
 }

 .cth-contact-hero-house {
 min-height: 420px;
 display: grid;
 place-items: center;
 }

 .cth-contact-hero-house img {
 width: min(760px, 100%);
 display: block;
 object-fit: contain;
 filter: drop-shadow(0 18px 28px rgba(51,3,60,0.08));
 }

 .cth-contact-stats-wrap {
 background: var(--cth-ivory);
 padding: 24px 0;
 }

 .cth-contact-stats {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 border: 1px solid var(--cth-border);
 border-radius: 10px;
 background: rgba(255,255,255,0.42);
 overflow: hidden;
 }

 .cth-contact-stats article {
 display: grid;
 grid-template-columns: 54px 1fr;
 column-gap: 14px;
 align-items: center;
 padding: 22px 28px;
 border-right: 1px solid var(--cth-border);
 }

 .cth-contact-stats article:last-child {
 border-right: 0;
 }

 .cth-contact-stats article div {
 grid-row: span 2;
 width: 46px;
 height: 46px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 border: 1px solid rgba(196,169,91,0.6);
 color: var(--cth-crimson);
 font-size: 22px;
 }

 .cth-contact-stats span {
 color: var(--cth-crimson);
 text-transform: uppercase;
 letter-spacing: 0.14em;
 font-size: 10px;
 font-weight: 900;
 }

 .cth-contact-stats p {
 margin: 4px 0 0;
 color: var(--cth-ink-soft);
 font-size: 13px;
 font-weight: 750;
 }

 .cth-contact-form-section {
 position: relative;
 padding: 10px 0 50px;
 }

 .cth-contact-mid-column {
 position: absolute;
 right: -48px;
 top: 36px;
 width: 300px;
 opacity: 0.13;
 pointer-events: none;
 user-select: none;
 }

 .cth-contact-form-grid {
 display: grid;
 grid-template-columns: minmax(0, 1.14fr) minmax(330px, 0.86fr);
 gap: 28px;
 align-items: stretch;
 }

 .cth-contact-form,
 .cth-contact-side-cards article {
 border: 1px solid var(--cth-border);
 background: rgba(255,255,255,0.48);
 border-radius: 10px;
 box-shadow: 0 18px 42px rgba(20,15,43,0.045);
 }

 .cth-contact-form {
 padding: 40px;
 }

 .cth-contact-form h2,
 .cth-contact-side-cards h3,
 .cth-contact-help-grid h3 {
 margin: 0;
 color: var(--cth-purple-deep);
 font-family: Georgia, serif;
 font-size: 38px;
 line-height: 1.05;
 letter-spacing: -0.045em;
 font-weight: 500;
 }

 .cth-contact-form > p {
 color: var(--cth-muted);
 font-size: 14px;
 font-weight: 650;
 margin: 10px 0 28px;
 }

 .cth-contact-field-grid {
 display: grid;
 grid-template-columns: repeat(2, 1fr);
 gap: 22px;
 }

 .cth-contact-form input,
 .cth-contact-form select,
 .cth-contact-form textarea {
 width: 100%;
 min-height: 56px;
 border: 1px solid var(--cth-border);
 border-radius: 6px;
 background: rgba(255,255,255,0.52);
 padding: 0 18px;
 color: var(--cth-ink-soft);
 font-size: 13px;
 outline: none;
 }

 .cth-contact-form select {
 margin-top: 22px;
 }

 .cth-contact-form textarea {
 margin-top: 22px;
 min-height: 170px;
 resize: vertical;
 padding-top: 18px;
 }

 .cth-contact-form button {
 margin-top: 22px;
 width: 100%;
 min-height: 56px;
 border: 0;
 border-radius: 6px;
 background: var(--cth-crimson);
 color: var(--cth-white);
 text-transform: uppercase;
 letter-spacing: 0.14em;
 font-size: 11px;
 font-weight: 900;
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 16px;
 }

 .cth-contact-form small {
 display: block;
 margin-top: 14px;
 text-align: center;
 color: var(--cth-muted-soft);
 font-size: 11px;
 }

 .cth-contact-side-cards {
 display: grid;
 gap: 18px;
 }

 .cth-contact-side-cards article {
 display: grid;
 grid-template-columns: 82px 1fr;
 gap: 20px;
 padding: 34px;
 }

 .cth-contact-side-icon {
 width: 62px;
 height: 62px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 border: 1px solid rgba(196,169,91,0.6);
 color: var(--cth-gold);
 font-size: 26px;
 }

 .cth-contact-side-cards h3 {
 font-size: 34px;
 }

 .cth-contact-side-cards p {
 margin: 10px 0 20px;
 color: var(--cth-muted);
 font-size: 14px;
 line-height: 1.6;
 font-weight: 650;
 }

 .cth-contact-side-cards a,
 .cth-contact-help-grid a {
 color: var(--cth-crimson);
 text-decoration: none;
 text-transform: uppercase;
 letter-spacing: 0.14em;
 font-size: 11px;
 font-weight: 900;
 }

 .cth-contact-help-section {
 padding: 24px 0 42px;
 }

 .cth-contact-centered-heading {
 text-align: center;
 margin-bottom: 28px;
 }

 .cth-contact-heading-rule {
 width: 280px;
 height: 1px;
 background: linear-gradient(90deg, transparent, var(--cth-gold), transparent);
 margin: 0 auto 14px;
 }

 .cth-contact-centered-heading h2 {
 margin: 10px 0 0;
 color: var(--cth-purple-deep);
 font-family: Georgia, serif;
 font-size: clamp(2.4rem, 3.4vw, 4rem);
 line-height: 1.05;
 letter-spacing: -0.045em;
 font-weight: 500;
 }

 .cth-contact-help-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 22px;
 }

 .cth-contact-help-grid article {
 border: 1px solid var(--cth-border);
 border-radius: 8px;
 background: rgba(255,255,255,0.44);
 padding: 32px 28px;
 }

 .cth-contact-help-grid article > div {
 color: var(--cth-gold);
 font-size: 42px;
 margin-bottom: 18px;
 }

 .cth-contact-help-grid h3 {
 font-size: 27px;
 }

 .cth-contact-help-grid p {
 min-height: 74px;
 color: var(--cth-muted);
 font-size: 13px;
 line-height: 1.6;
 font-weight: 650;
 }

 .cth-contact-faq-section {
 padding: 16px 0 42px;
 }

 .cth-contact-faq-shell {
 max-width: 1180px;
 }

 .cth-contact-faq-list {
 border: 1px solid var(--cth-border);
 border-radius: 8px;
 overflow: hidden;
 background: rgba(255,255,255,0.45);
 }

 .cth-contact-faq-list button {
 width: 100%;
 min-height: 46px;
 border: 0;
 border-bottom: 1px solid var(--cth-border);
 background: transparent;
 color: var(--cth-ink-soft);
 display: flex;
 align-items: center;
 justify-content: space-between;
 padding: 0 24px;
 font-size: 13px;
 font-weight: 750;
 }

 .cth-contact-faq-list button:last-child {
 border-bottom: 0;
 }

 .cth-contact-faq-list strong {
 color: var(--cth-crimson);
 font-size: 20px;
 }

 .cth-contact-cta {
 position: relative;
 overflow: hidden;
 background: var(--cth-purple-deep);
 color: var(--cth-white);
 padding: 38px 0;
 }

 .cth-contact-cta-plan-left {
 position: absolute;
 left: -70px;
 top: -60px;
 width: 420px;
 opacity: 0.10;
 mix-blend-mode: screen;
 }

 .cth-contact-cta-column-right {
 position: absolute;
 right: -44px;
 bottom: -70px;
 width: 330px;
 opacity: 0.12;
 mix-blend-mode: screen;
 }

 .cth-contact-cta-grid {
 display: grid;
 grid-template-columns: 160px 1fr auto;
 gap: 54px;
 align-items: center;
 }

 .cth-contact-cta h2 {
 margin: 0 0 8px;
 max-width: 760px;
 font-family: Georgia, serif;
 color: var(--cth-on-dark);
 font-size: clamp(2rem, 3.4vw, 4.1rem);
 line-height: 1.02;
 letter-spacing: -0.05em;
 font-weight: 500;
 }

 .cth-contact-cta p {
 margin: 0;
 color: rgba(255,255,255,0.72);
 font-size: 14px;
 }

 .cth-contact-logo-strip {
 padding: 22px 0;
 background: var(--cth-ivory);
 border-bottom: 1px solid var(--cth-border);
 }

 .cth-contact-logo-strip .cth-contact-eyebrow {
 text-align: center;
 }

 .cth-contact-logo-row {
 margin-top: 18px;
 display: grid;
 grid-template-columns: repeat(6, 1fr);
 gap: 18px;
 }

 .cth-contact-logo-row span {
 text-align: center;
 color: var(--cth-ink-soft);
 text-transform: uppercase;
 letter-spacing: 0.16em;
 font-size: 12px;
 font-weight: 900;
 }

 .cth-contact-footer {
 background: var(--cth-dark);
 color: white;
 padding: 34px 0 14px;
 }

 .cth-contact-footer-grid {
 display: grid;
 grid-template-columns: 1.2fr repeat(5, 1fr);
 gap: 44px;
 }

 .cth-contact-footer-brand h3 {
 margin: 12px 0 2px;
 color: var(--cth-gold);
 font-family: Georgia, serif;
 font-size: 22px;
 font-weight: 500;
 }

 .cth-contact-footer-brand p {
 color: rgba(255,255,255,0.64);
 font-size: 12px;
 line-height: 1.5;
 }

 .cth-contact-socials {
 display: flex;
 gap: 10px;
 margin-top: 18px;
 }

 .cth-contact-socials span {
 width: 28px;
 height: 28px;
 display: grid;
 place-items: center;
 border: 1px solid rgba(196,169,91,0.36);
 border-radius: 999px;
 color: var(--cth-gold);
 font-size: 10px;
 }

 .cth-contact-footer-col h4 {
 margin: 0 0 14px;
 color: var(--cth-gold);
 text-transform: uppercase;
 letter-spacing: 0.16em;
 font-size: 11px;
 }

 .cth-contact-footer-col a,
 .cth-contact-footer-col span {
 display: block;
 margin-bottom: 8px;
 color: rgba(255,255,255,0.68);
 text-decoration: none;
 font-size: 12px;
 }

 .cth-contact-footer-bottom {
 margin-top: 28px;
 padding-top: 14px;
 border-top: 1px solid rgba(255,255,255,0.12);
 display: flex;
 justify-content: space-between;
 color: rgba(255,255,255,0.55);
 font-size: 11px;
 }

 .cth-contact-footer-bottom div {
 display: flex;
 gap: 24px;
 }

 .cth-contact-footer-bottom a {
 color: rgba(255,255,255,0.65);
 text-decoration: none;
 }

 @media (max-width: 1200px) {
 .cth-contact-shell {
 width: min(100% - 40px, 1540px);
 }

 .cth-contact-nav {
 display: none;
 }

 .cth-contact-hero-grid,
 .cth-contact-form-grid,
 .cth-contact-cta-grid {
 grid-template-columns: 1fr;
 }

 .cth-contact-stats,
 .cth-contact-help-grid,
 .cth-contact-logo-row,
 .cth-contact-footer-grid {
 grid-template-columns: repeat(2, 1fr);
 }

 .cth-contact-stats article {
 border-right: 0;
 border-bottom: 1px solid var(--cth-border);
 }

 .cth-contact-mid-column,
 .cth-contact-hero-column,
 .cth-contact-cta-plan-left,
 .cth-contact-cta-column-right {
 display: none;
 }
 }

 @media (max-width: 680px) {
 .cth-contact-hero h1 {
 font-size: 4rem;
 }

 .cth-contact-stats,
 .cth-contact-field-grid,
 .cth-contact-help-grid,
 .cth-contact-logo-row,
 .cth-contact-footer-grid {
 grid-template-columns: 1fr;
 }

 .cth-contact-side-cards article {
 grid-template-columns: 1fr;
 }

 .cth-contact-cta-grid {
 gap: 26px;
 }

 .cth-contact-footer-bottom {
 flex-direction: column;
 gap: 14px;
 }
 }
 `}</style>
 </main>
 );
}
