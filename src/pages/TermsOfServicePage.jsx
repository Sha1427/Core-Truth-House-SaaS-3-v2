import React from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

const termsSections = [
 {
 number: "01",
 title: "Acceptance of Terms",
 anchor: "acceptance-of-terms",
 body:
 "By accessing or using the Core Truth House website, platform, or related services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the Services.",
 },
 {
 number: "02",
 title: "Eligibility",
 anchor: "eligibility",
 body:
 "You must be at least 18 years old and legally capable of entering into a binding agreement to use the Services. By using the Services, you represent and warrant that you meet these requirements.",
 },
 {
 number: "03",
 title: "Account Responsibilities",
 anchor: "account-responsibilities",
 body:
 "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately if you suspect unauthorized access or misuse.",
 },
 {
 number: "04",
 title: "Subscriptions & Billing",
 anchor: "subscriptions-billing",
 body:
 "Some features require a paid subscription. By subscribing, you agree to our pricing, billing cycle, and renewal terms. Unless otherwise stated, subscriptions renew automatically until canceled before the next billing cycle.",
 },
 {
 number: "05",
 title: "Intellectual Property",
 anchor: "intellectual-property",
 body:
 "All content, trademarks, designs, platform materials, and branded assets on the Services are the property of Core Truth House or its licensors. You may not copy, reproduce, republish, or distribute platform content without written permission.",
 },
 {
 number: "06",
 title: "Acceptable Use",
 anchor: "acceptable-use",
 body:
 "You agree to use the Services only for lawful purposes and in a way that does not infringe on the rights of others or interfere with the security and operation of the Services. Prohibited conduct includes abuse, scraping, hacking, spam, and harmful content submission.",
 },
 {
 number: "07",
 title: "User Content",
 anchor: "user-content",
 body:
 "You retain ownership of the content you submit, but you grant us a non-exclusive, worldwide, royalty-free license to host, process, and display that content as necessary to operate, maintain, and improve the Services.",
 },
 {
 number: "08",
 title: "Third-Party Services",
 anchor: "third-party-services",
 body:
 "Our Services may integrate with third-party tools, payment processors, analytics providers, or service providers. We are not responsible for the content, policies, or practices of third-party services.",
 },
 {
 number: "09",
 title: "Disclaimers",
 anchor: "disclaimers",
 body:
 'The Services are provided "as is" and "as available" without warranties of any kind, whether express or implied. We do not guarantee uninterrupted access, error-free performance, or specific business outcomes.',
 },
 {
 number: "10",
 title: "Limitation of Liability",
 anchor: "limitation-of-liability",
 body:
 "To the maximum extent permitted by law, Core Truth House shall not be liable for any indirect, incidental, consequential, special, or punitive damages arising out of or related to your use of the Services.",
 },
 {
 number: "11",
 title: "Indemnification",
 anchor: "indemnification",
 body:
 "You agree to indemnify and hold harmless Core Truth House, its affiliates, and their respective officers, employees, and agents from claims, liabilities, damages, and expenses arising from your use of the Services or violation of these Terms.",
 },
 {
 number: "12",
 title: "Termination",
 anchor: "termination",
 body:
 "We may suspend or terminate your access to the Services at any time for violation of these Terms or for conduct that may harm the platform, other users, or our business operations.",
 },
 {
 number: "13",
 title: "Governing Law",
 anchor: "governing-law",
 body:
 "These Terms are governed by and construed in accordance with the laws of the State of Alabama, without regard to conflict of law principles.",
 },
 {
 number: "14",
 title: "Changes to Terms",
 anchor: "changes-to-terms",
 body:
 "We may update these Terms from time to time. When material changes are made, we will post the revised Terms on this page and update the effective date. Continued use of the Services constitutes acceptance of the revised Terms.",
 },
 {
 number: "15",
 title: "Contact Information",
 anchor: "contact-information",
 body:
 "If you have questions about these Terms, contact us at legal@coretruthhouse.com or use the contact page for support and follow-up.",
 },
];

const navLinks = [
 ["Home", "/"],
 ["Platform", "/#platform"],
 ["About", "/about"],
 ["Resources", "/blog"],
 ["Store", "/store"],
 ["Contact", "/contact"],
];

const footerColumns = {
 Platform: [
 ["Command Center", "/command-center"],
 ["Brand Foundation", "/brand-foundation"],
 ["Strategic OS", "/strategic-os"],
 ["Content Studio", "/content-studio"],
 ],
 Company: [
 ["About", "/about"],
 ["Contact", "/contact"],
 ["Store", "/store"],
 ["Blog", "/blog"],
 ],
 Legal: [
 ["Privacy Policy", "/privacy"],
 ["Terms of Service", "/terms"],
 ],
};

function Hero() {
 return (
 <section className="cth-tos-hero">
 <div className="cth-tos-shell cth-tos-hero-grid">
 <div className="cth-tos-hero-copy">
 <p className="cth-tos-eyebrow">Legal</p>
 <h1>Terms of Service</h1>
 <p>
 These Terms of Service govern your access to and use of the Core Truth House platform,
 website, and related services. Read them carefully so the foundation stays clear.
 </p>

 <div className="cth-tos-hero-actions">
 <Link to="/contact" className="cth-tos-btn cth-tos-btn-primary">
 Contact Support
 </Link>
 <Link to="/privacy" className="cth-tos-btn cth-tos-btn-secondary">
 View Privacy Policy
 </Link>
 </div>
 </div>

 <div className="cth-tos-hero-art">
 <div className="cth-tos-hero-gridlines" aria-hidden="true" />
 <img
 src="/cth-frontpage-architecture.webp"
 alt="Core Truth House architectural headquarters"
 className="cth-tos-hero-house"
 />
 </div>
 </div>
 </section>
 );
}

function MetaCards() {
 return (
 <section className="cth-tos-shell">
 <div className="cth-tos-meta-grid">
 <article>
 <span>01</span>
 <div>
 <strong>Effective Date</strong>
 <p>May 26, 2025</p>
 </div>
 </article>

 <article>
 <span>02</span>
 <div>
 <strong>Last Updated</strong>
 <p>May 26, 2025</p>
 </div>
 </article>

 <article>
 <span>03</span>
 <div>
 <strong>Important Notice</strong>
 <p>These terms create a legally binding agreement between you and Core Truth House.</p>
 </div>
 </article>
 </div>
 </section>
 );
}

function Body() {
 return (
 <section className="cth-tos-body-section">
 <img
 src="/about-assets/columns/cth-column-left-rail-full-drafting.png"
 alt=""
 aria-hidden="true"
 className="cth-tos-body-column cth-tos-body-column-left"
 />

 <img
 src="/about-assets/columns/cth-column-full-corinthian-blueprint.png"
 alt=""
 aria-hidden="true"
 className="cth-tos-body-column cth-tos-body-column-right"
 />

 <div className="cth-tos-shell cth-tos-body-grid">
 <aside className="cth-tos-sidebar">
 <div className="cth-tos-sidebar-card">
 <p>On This Page</p>
 <nav aria-label="Terms sections">
 {termsSections.map((section) => (
 <a key={section.anchor} href={`#${section.anchor}`}>
 <span>{section.number}.</span>
 {section.title}
 </a>
 ))}
 </nav>

 <div className="cth-tos-sidebar-note">
 <img src="/about-assets/floor-plans/cth-floor-plan-wide-detailed.png" alt="" aria-hidden="true" />
 <strong>Built on clarity.</strong>
 <small>Designed for impact. Guided by strategy.</small>
 </div>
 </div>
 </aside>

 <main className="cth-tos-terms-list" aria-label="Terms of Service content">
 {termsSections.map((section) => (
 <article key={section.anchor} id={section.anchor} className="cth-tos-term-row">
 <div className="cth-tos-term-number">{section.number}.</div>
 <div className="cth-tos-term-line" />
 <div className="cth-tos-term-copy">
 <h2>{section.title}</h2>
 <p>{section.body}</p>
 </div>
 </article>
 ))}
 </main>
 </div>
 </section>
 );
}

function HelpBand() {
 return (
 <section className="cth-tos-shell">
 <div className="cth-tos-help-band">
 <div className="cth-tos-help-icon">✉</div>
 <div>
 <p>Questions About These Terms?</p>
 <h2>We are here to help you get clarity before you move forward.</h2>
 </div>
 <Link to="/contact">Contact Our Team</Link>
 </div>
 </section>
 );
}

export default function TermsOfServicePage() {
 return (
 <div className="cth-tos-page">
 <PublicHeader />
 <Hero />
 <MetaCards />
 <Body />
 <HelpBand />
 <PublicFooter />

 <style>{`
 .cth-tos-page {
 min-height: 100vh;
 background: var(--cth-ivory);
 color: var(--cth-purple-deep);
 font-family: var(--cth-sans);
 overflow-x: hidden;
 }

 .cth-tos-shell {
 width: min(1720px, calc(100% - 72px));
 margin: 0 auto;
 }

 .cth-tos-header {
 position: sticky;
 top: 0;
 z-index: 90;
 background: rgba(248, 241, 236, 0.96);
 border-bottom: 1px solid var(--cth-border);
 backdrop-filter: blur(18px);
 }

 .cth-tos-header-inner {
 min-height: 72px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 28px;
 }

 .cth-tos-logo {
 display: inline-flex;
 align-items: center;
 text-decoration: none;
 }

 .cth-tos-logo img {
 width: 226px;
 height: auto;
 display: block;
 object-fit: contain;
 }

 .cth-tos-nav {
 flex: 1;
 display: flex;
 align-items: center;
 justify-content: center;
 gap: clamp(18px, 2.8vw, 44px);
 }

 .cth-tos-nav a {
 color: var(--cth-ruby);
 text-decoration: none;
 font-size: 11px;
 font-weight: 950;
 letter-spacing: 0.15em;
 text-transform: uppercase;
 transition: color 0.18s ease;
 }

 .cth-tos-nav a:hover {
 color: var(--cth-crimson);
 }

 .cth-tos-header-cta,
 .cth-tos-btn,
 .cth-tos-help-band a {
 display: inline-flex;
 align-items: center;
 justify-content: center;
 min-height: 46px;
 padding: 0 22px;
 border-radius: 4px;
 text-decoration: none;
 text-transform: uppercase;
 letter-spacing: 0.13em;
 font-size: 11px;
 font-weight: 950;
 white-space: nowrap;
 }

 .cth-tos-header-cta,
 .cth-tos-btn-primary {
 background: var(--cth-crimson);
 color: var(--cth-white);
 box-shadow: 0 16px 30px rgba(175, 0, 36, 0.18);
 }

 .cth-tos-btn-secondary {
 border: 1px solid var(--cth-gold);
 color: var(--cth-ruby);
 background: rgba(255, 255, 255, 0.52);
 }

 .cth-tos-hero {
 position: relative;
 padding: 72px 0 50px;
 border-bottom: 1px solid var(--cth-border);
 background:
 radial-gradient(circle at 8% 10%, rgba(196, 169, 91, 0.12), transparent 30%),
 linear-gradient(180deg, var(--cth-ivory) 0%, var(--cth-ivory-soft) 100%);
 }

 .cth-tos-hero-grid {
 display: grid;
 grid-template-columns: minmax(0, 0.94fr) minmax(460px, 0.9fr);
 gap: clamp(42px, 7vw, 132px);
 align-items: center;
 }

 .cth-tos-eyebrow {
 margin: 0 0 18px;
 color: var(--cth-crimson);
 font-size: 12px;
 font-weight: 950;
 letter-spacing: 0.22em;
 text-transform: uppercase;
 }

 .cth-tos-hero h1 {
 margin: 0;
 color: var(--cth-purple-deep);
 font-family: var(--cth-serif);
 font-size: clamp(68px, 7vw, 116px);
 line-height: 0.9;
 letter-spacing: -0.075em;
 }

 .cth-tos-hero p:not(.cth-tos-eyebrow) {
 max-width: 760px;
 margin: 32px 0 0;
 color: var(--cth-ruby);
 font-size: 20px;
 line-height: 1.72;
 font-weight: 700;
 }

 .cth-tos-hero-actions {
 margin-top: 34px;
 display: flex;
 flex-wrap: wrap;
 gap: 14px;
 }

 .cth-tos-hero-art {
 min-height: 460px;
 position: relative;
 display: grid;
 place-items: center;
 }

 .cth-tos-hero-gridlines {
 position: absolute;
 inset: 2% 0;
 background:
 linear-gradient(rgba(196, 169, 91, 0.14) 1px, transparent 1px),
 linear-gradient(90deg, rgba(196, 169, 91, 0.11) 1px, transparent 1px);
 background-size: 80px 80px;
 opacity: 0.62;
 mask-image: radial-gradient(circle at 50% 48%, black 45%, transparent 78%);
 }

 .cth-tos-hero-gridlines::before,
 .cth-tos-hero-gridlines::after {
 content: "";
 position: absolute;
 border-radius: 999px;
 border: 1px solid rgba(196, 169, 91, 0.30);
 }

 .cth-tos-hero-gridlines::before {
 width: 360px;
 height: 360px;
 right: 92px;
 top: 18px;
 }

 .cth-tos-hero-gridlines::after {
 width: 520px;
 height: 520px;
 right: 14px;
 top: -50px;
 }

 .cth-tos-hero-house {
 position: relative;
 z-index: 2;
 width: min(760px, 100%);
 max-height: 460px;
 object-fit: contain;
 opacity: 0.78;
 mix-blend-mode: multiply;
 filter: saturate(0.72) contrast(1.04) sepia(0.10) drop-shadow(0 28px 60px rgba(13, 0, 16, 0.08));
 }

 .cth-tos-meta-grid {
 display: grid;
 grid-template-columns: 1fr 1fr 1.6fr;
 border: 1px solid var(--cth-border);
 background: rgba(255, 255, 255, 0.48);
 box-shadow: 0 18px 44px rgba(51, 3, 60, 0.06);
 margin-top: 34px;
 }

 .cth-tos-meta-grid article {
 display: flex;
 gap: 22px;
 align-items: center;
 padding: 30px 34px;
 border-right: 1px solid var(--cth-border);
 }

 .cth-tos-meta-grid article:last-child {
 border-right: 0;
 }

 .cth-tos-meta-grid span {
 width: 58px;
 height: 58px;
 flex: 0 0 58px;
 border-radius: 999px;
 display: grid;
 place-items: center;
 border: 1px solid var(--cth-gold);
 color: var(--cth-crimson);
 font-family: var(--cth-serif);
 font-weight: 900;
 }

 .cth-tos-meta-grid strong {
 display: block;
 margin-bottom: 6px;
 color: var(--cth-crimson);
 font-size: 12px;
 font-weight: 950;
 letter-spacing: 0.16em;
 text-transform: uppercase;
 }

 .cth-tos-meta-grid p {
 margin: 0;
 color: var(--cth-ruby);
 font-weight: 800;
 line-height: 1.5;
 }

 .cth-tos-body-section {
 position: relative;
 overflow: hidden;
 }

 .cth-tos-body-column {
 position: absolute;
 z-index: 0;
 pointer-events: none;
 object-fit: contain;
 opacity: 0.13;
 filter: sepia(1) saturate(0.8) hue-rotate(310deg);
 mix-blend-mode: multiply;
 }

 .cth-tos-body-column-left {
 left: -74px;
 top: 86px;
 width: 210px;
 }

 .cth-tos-body-column-right {
 right: -86px;
 top: 210px;
 width: 230px;
 opacity: 0.12;
 }

 .cth-tos-body-grid {
 position: relative;
 z-index: 1;
 display: grid;
 grid-template-columns: 290px minmax(0, 1fr);
 gap: 48px;
 padding: 58px 0 48px;
 }

 .cth-tos-sidebar {
 position: sticky;
 top: 104px;
 align-self: start;
 }

 .cth-tos-sidebar-card {
 border: 1px solid var(--cth-border);
 background: rgba(255, 255, 255, 0.48);
 padding: 32px 28px;
 box-shadow: 0 18px 44px rgba(51, 3, 60, 0.06);
 }

 .cth-tos-sidebar-card > p {
 margin: 0 0 22px;
 color: var(--cth-crimson);
 font-size: 12px;
 font-weight: 950;
 letter-spacing: 0.16em;
 text-transform: uppercase;
 }

 .cth-tos-sidebar-card nav {
 display: grid;
 gap: 14px;
 }

 .cth-tos-sidebar-card a {
 display: flex;
 gap: 12px;
 align-items: center;
 color: var(--cth-ruby);
 text-decoration: none;
 font-size: 12px;
 font-weight: 800;
 line-height: 1.4;
 }

 .cth-tos-sidebar-card a::before {
 content: "";
 width: 6px;
 height: 6px;
 border-radius: 999px;
 background: var(--cth-gold);
 flex: 0 0 6px;
 }

 .cth-tos-sidebar-card a span {
 min-width: 26px;
 color: var(--cth-purple-deep);
 font-family: var(--cth-serif);
 }

 .cth-tos-sidebar-note {
 position: relative;
 margin-top: 36px;
 padding: 92px 12px 12px;
 min-height: 230px;
 border-top: 1px solid var(--cth-border);
 text-align: center;
 overflow: hidden;
 }

 .cth-tos-sidebar-note img {
 position: absolute;
 left: 50%;
 top: 20px;
 width: 250px;
 transform: translateX(-50%);
 opacity: 0.12;
 mix-blend-mode: multiply;
 }

 .cth-tos-sidebar-note strong {
 position: relative;
 display: block;
 color: var(--cth-purple-deep);
 font-family: var(--cth-serif);
 font-size: 20px;
 line-height: 1.1;
 }

 .cth-tos-sidebar-note small {
 position: relative;
 display: block;
 margin-top: 8px;
 color: var(--cth-ruby);
 line-height: 1.45;
 font-weight: 700;
 }

 .cth-tos-terms-list {
 padding-right: 68px;
 }

 .cth-tos-term-row {
 display: grid;
 grid-template-columns: 62px 54px minmax(0, 1fr);
 gap: 22px;
 padding: 0 0 26px;
 margin-bottom: 26px;
 border-bottom: 1px solid rgba(196, 169, 91, 0.38);
 }

 .cth-tos-term-number {
 color: var(--cth-gold);
 font-family: var(--cth-serif);
 font-size: 32px;
 line-height: 1;
 }

 .cth-tos-term-line {
 width: 54px;
 height: 1px;
 background: var(--cth-gold);
 margin-top: 16px;
 }

 .cth-tos-term-copy h2 {
 margin: 0 0 10px;
 color: var(--cth-purple-deep);
 font-family: var(--cth-serif);
 font-size: clamp(28px, 2.1vw, 36px);
 line-height: 1;
 letter-spacing: -0.035em;
 }

 .cth-tos-term-copy p {
 margin: 0;
 max-width: 980px;
 color: var(--cth-ruby);
 font-size: 15px;
 line-height: 1.7;
 font-weight: 700;
 }

 .cth-tos-help-band {
 margin: 18px 0 48px;
 padding: 34px 42px;
 display: grid;
 grid-template-columns: auto minmax(0, 1fr) auto;
 gap: 30px;
 align-items: center;
 background: var(--cth-purple-deep);
 color: var(--cth-white);
 overflow: hidden;
 }

 .cth-tos-help-icon {
 width: 84px;
 height: 84px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 border: 1px solid rgba(196, 169, 91, 0.52);
 color: var(--cth-gold);
 font-size: 38px;
 }

 .cth-tos-help-band p {
 margin: 0 0 8px;
 color: var(--cth-gold);
 font-size: 12px;
 font-weight: 950;
 letter-spacing: 0.16em;
 text-transform: uppercase;
 }

 .cth-tos-help-band h2 {
 margin: 0;
 color: var(--cth-white);
 font-family: var(--cth-serif);
 font-size: clamp(28px, 3vw, 44px);
 letter-spacing: -0.04em;
 line-height: 1.05;
 }

 .cth-tos-help-band a {
 border: 1px solid rgba(196, 169, 91, 0.56);
 color: var(--cth-white);
 background: var(--cth-crimson);
 }

 .cth-tos-footer {
 background: var(--cth-purple-deep);
 color: var(--cth-white);
 padding: 58px 0 24px;
 }

 .cth-tos-footer-grid {
 display: grid;
 grid-template-columns: 1.4fr repeat(3, 0.8fr);
 gap: 44px;
 }

 .cth-tos-footer-brand img {
 width: 104px;
 height: 104px;
 object-fit: contain;
 }

 .cth-tos-footer-brand h3 {
 margin: 14px 0 8px;
 color: var(--cth-white);
 font-family: var(--cth-serif);
 font-size: 30px;
 }

 .cth-tos-footer-brand p {
 max-width: 360px;
 margin: 0 0 12px;
 color: var(--cth-on-dark-soft);
 line-height: 1.65;
 }

 .cth-tos-footer-col h4 {
 margin: 0 0 18px;
 color: var(--cth-gold);
 font-size: 12px;
 font-weight: 950;
 letter-spacing: 0.16em;
 text-transform: uppercase;
 }

 .cth-tos-footer-col a {
 display: block;
 color: var(--cth-on-dark-soft);
 text-decoration: none;
 line-height: 2.1;
 font-size: 14px;
 font-weight: 700;
 }

 .cth-tos-footer-bottom {
 margin-top: 44px;
 padding-top: 22px;
 border-top: 1px solid rgba(196, 169, 91, 0.26);
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 24px;
 color: var(--cth-on-dark-soft);
 font-size: 13px;
 }

 .cth-tos-footer-bottom div {
 display: flex;
 gap: 28px;
 }

 .cth-tos-footer-bottom a {
 color: var(--cth-on-dark-soft);
 text-decoration: none;
 }

 @media (max-width: 1120px) {
 .cth-tos-nav {
 display: none;
 }

 .cth-tos-hero-grid,
 .cth-tos-body-grid,
 .cth-tos-help-band,
 .cth-tos-footer-grid {
 grid-template-columns: 1fr;
 }

 .cth-tos-sidebar {
 position: relative;
 top: 0;
 }

 .cth-tos-terms-list {
 padding-right: 0;
 }

 .cth-tos-meta-grid {
 grid-template-columns: 1fr;
 }

 .cth-tos-meta-grid article {
 border-right: 0;
 border-bottom: 1px solid var(--cth-border);
 }

 .cth-tos-meta-grid article:last-child {
 border-bottom: 0;
 }

 .cth-tos-body-column {
 display: none;
 }
 }

 @media (max-width: 720px) {
 .cth-tos-shell {
 width: min(100% - 28px, 1720px);
 }

 .cth-tos-header-inner {
 min-height: 66px;
 }

 .cth-tos-logo img {
 width: 190px;
 }

 .cth-tos-header-cta {
 display: none;
 }

 .cth-tos-hero {
 padding: 44px 0 30px;
 }

 .cth-tos-hero h1 {
 font-size: clamp(48px, 15vw, 74px);
 }

 .cth-tos-hero p:not(.cth-tos-eyebrow) {
 font-size: 16px;
 }

 .cth-tos-hero-art {
 min-height: 300px;
 }

 .cth-tos-term-row {
 grid-template-columns: 54px 1fr;
 }

 .cth-tos-term-line {
 display: none;
 }

 .cth-tos-help-band {
 padding: 28px;
 }

 .cth-tos-footer-bottom {
 align-items: flex-start;
 flex-direction: column;
 }
 }
 `}</style>
 </div>
 );
}
