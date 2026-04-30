import React from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

const policySections = [
 {
 id: "information-we-collect",
 number: "01",
 title: "Information We Collect",
 summary:
 "We collect information you provide directly to us, information automatically collected through our platform, and information from third parties.",
 body: [
 "We may collect personal information such as your name, email address, billing details, company details, and any information you submit through forms, contact requests, or account creation.",
 "We may also collect platform usage information such as browser type, device information, IP address, referral data, session activity, and analytics data that help us improve performance and user experience.",
 "If you interact with us through integrations, forms, or customer support, we may collect any information necessary to fulfill those requests and operate the service effectively.",
 ],
 icon: "◎",
 },
 {
 id: "how-we-use-information",
 number: "02",
 title: "How We Use Information",
 summary:
 "We use information to provide, operate, and improve our services, communicate with you, ensure security, and comply with legal obligations.",
 body: [
 "We use your information to deliver the Core Truth House platform, manage your account, respond to inquiries, provide support, process transactions, and personalize your experience.",
 "We also use collected information for security, fraud prevention, product development, analytics, compliance, and internal business operations.",
 "From time to time, we may use your information to send important service updates, policy notices, or relevant communications related to our services.",
 ],
 icon: "◌",
 },
 {
 id: "cookies",
 number: "03",
 title: "Cookies & Tracking Technologies",
 summary:
 "We use cookies and similar technologies to enhance your experience, analyze site usage, and support our marketing efforts.",
 body: [
 "Cookies help us remember preferences, understand how users interact with the website, and improve functionality and performance.",
 "Some cookies are necessary for the platform to function properly, while others help us analyze traffic, measure engagement, and improve site performance.",
 "You can modify browser settings to manage cookies, although some portions of the site may not function as intended if cookies are disabled.",
 ],
 icon: "◔",
 },
 {
 id: "sharing",
 number: "04",
 title: "Sharing of Information",
 summary:
 "We do not sell your personal information. We may share information with trusted service providers, partners, and as required by law.",
 body: [
 "We may share information with vendors and service providers who support hosting, analytics, email delivery, payment processing, customer service, or platform functionality.",
 "We may also share information if required to comply with legal obligations, protect our rights, investigate fraud, or enforce our terms.",
 "If Core Truth House is involved in a merger, acquisition, or transfer of business assets, information may be transferred as part of that transaction, subject to appropriate safeguards.",
 ],
 icon: "◍",
 },
 {
 id: "retention",
 number: "05",
 title: "Data Retention",
 summary:
 "We retain your information only as long as necessary to fulfill the purposes outlined in this policy unless a longer retention period is required by law.",
 body: [
 "Retention periods vary depending on the nature of the information, the services provided, legal obligations, and legitimate business needs.",
 "We retain account and transaction records for as long as needed to operate the platform, maintain compliance, resolve disputes, and support legitimate business operations.",
 "When information is no longer required, we take reasonable steps to securely delete, anonymize, or de-identify it.",
 ],
 icon: "◷",
 },
 {
 id: "security",
 number: "06",
 title: "Security",
 summary:
 "We implement industry-standard safeguards to protect your information from unauthorized access, alteration, disclosure, or destruction.",
 body: [
 "We use administrative, technical, and organizational safeguards designed to protect your information and reduce the risk of misuse or unauthorized access.",
 "No platform or transmission method is completely secure, but we work continuously to maintain strong data protection practices and responsible security controls.",
 "Users are also responsible for safeguarding their credentials and using the platform responsibly.",
 ],
 icon: "◇",
 },
 {
 id: "rights",
 number: "07",
 title: "Your Rights & Choices",
 summary:
 "You may have rights regarding your personal information, including access, correction, deletion, and opting out of certain uses.",
 body: [
 "Depending on your location, you may have the right to request access to your information, correct inaccurate information, request deletion, or object to certain processing.",
 "You may also opt out of marketing communications at any time by using unsubscribe links or contacting us directly.",
 "We will review and respond to verified privacy requests in accordance with applicable law.",
 ],
 icon: "◠",
 },
 {
 id: "transfers",
 number: "08",
 title: "International Transfers",
 summary:
 "Your information may be transferred to and processed in countries outside your own. We ensure appropriate safeguards are in place.",
 body: [
 "If you access the platform from outside the country where our systems or vendors operate, your information may be transferred internationally.",
 "Where required, we use appropriate contractual, organizational, and technical safeguards to protect personal information transferred across borders.",
 "By using our services, you understand that your data may be processed in jurisdictions where privacy laws may differ from those in your country.",
 ],
 icon: "⊕",
 },
 {
 id: "children",
 number: "09",
 title: "Children’s Privacy",
 summary:
 "Our services are not directed to children under 13. We do not knowingly collect personal information from children.",
 body: [
 "Core Truth House is intended for founders, businesses, and adult professionals. We do not knowingly solicit or collect personal information from children under 13.",
 "If we become aware that personal information has been collected from a child without proper authorization, we will take reasonable steps to delete that information.",
 "Parents or guardians who believe that a child has provided us with information may contact us directly.",
 ],
 icon: "◒",
 },
 {
 id: "third-party-links",
 number: "10",
 title: "Third-Party Links",
 summary:
 "Our platform may contain links to third-party websites. We are not responsible for their privacy practices.",
 body: [
 "Our site may include links to tools, resources, or websites operated by third parties. Those sites are governed by their own terms and privacy practices.",
 "We encourage users to review the privacy policies of any third-party sites they access through external links.",
 "Core Truth House is not responsible for the privacy, content, or practices of third-party services.",
 ],
 icon: "↗",
 },
 {
 id: "changes",
 number: "11",
 title: "Changes to This Policy",
 summary:
 "We may update this policy from time to time. We will notify you of material changes by posting the new policy on this page.",
 body: [
 "We may revise this Privacy Policy as our products, services, legal obligations, or data practices evolve.",
 "When updates are made, the revised version will be posted on this page with an updated effective date.",
 "Your continued use of the platform after changes are posted constitutes acknowledgment of the updated policy where permitted by law.",
 ],
 icon: "✎",
 },
 {
 id: "contact-information",
 number: "12",
 title: "Contact Information",
 summary:
 "If you have questions or concerns about this Privacy Policy or our data practices, please contact us.",
 body: [
 "If you have questions about this Privacy Policy, data handling practices, or privacy-related concerns, please contact Core Truth House.",
 "Email: hello@coretruthhouse.com",
 "Phone: (205) 555-0178",
 "Location: Birmingham, AL",
 ],
 icon: "✉",
 },
];



function Crest({ small = false }) {
 return (
 <div className={`cth-crest ${small ? "small" : ""}`}>
 <span className="cth-crest-roof">⌂</span>
 <span className="cth-crest-text">CTH</span>
 </div>
 );
}

function Eyebrow({ children, light = false }) {
 return <p className={`cth-eyebrow ${light ? "light" : ""}`}>{children}</p>;
}

function Hero() {
 return (
 <section className="cth-privacy-hero">
 <img
 src="/about-assets/floor-plans/cth-floor-plan-vertical-stair-rooms.png"
 alt=""
 aria-hidden="true"
 className="cth-privacy-hero-floorplan"
 />

 <div className="cth-privacy-shell cth-privacy-hero-grid">
 <div className="cth-privacy-hero-copy">
 <Eyebrow>Legal</Eyebrow>
 <h1>Privacy Policy</h1>
 <p>
 At Core Truth House, your privacy is fundamental to our foundation.
 This Privacy Policy explains how we collect, use, protect, and share
 information when you use our platform and services.
 </p>

 <div className="cth-privacy-hero-actions">
 <Link to="/contact" className="cth-btn cth-btn-primary">
 Book a Demo <span>→</span>
 </Link>
 </div>
 </div>

 <div className="cth-privacy-hero-house">
 <img
 src="/cth-frontpage-architecture.webp"
 alt="Core Truth House architectural headquarters"
 />
 </div>
 </div>
 </section>
 );
}

function TrustStrip() {
 return (
 <section className="cth-privacy-trust-strip">
 <div className="cth-privacy-shell cth-privacy-trust-grid">
 <article>
 <div className="cth-trust-icon">⌚</div>
 <div>
 <h3>Effective Date</h3>
 <p>May 15, 2025</p>
 </div>
 </article>

 <article>
 <div className="cth-trust-icon">◷</div>
 <div>
 <h3>Last Updated</h3>
 <p>May 15, 2025</p>
 </div>
 </article>

 <article>
 <div className="cth-trust-icon">◇</div>
 <div>
 <h3>Your Trust Matters</h3>
 <p>We are committed to transparency, security, and your privacy.</p>
 </div>
 </article>
 </div>
 </section>
 );
}

function OnThisPage() {
 return (
 <aside className="cth-privacy-sidebar">
 <div className="cth-privacy-sidebar-card">
 <Eyebrow>On This Page</Eyebrow>
 <nav className="cth-privacy-toc">
 {policySections.map((section) => (
 <a key={section.id} href={`#${section.id}`}>
 <span>{section.number}</span>
 <span>{section.title}</span>
 </a>
 ))}
 </nav>

 <div className="cth-privacy-values-card">
 <div className="cth-values-icon">♛</div>
 <p>Your privacy is not just a policy. It’s our promise.</p>
 <Link to="/about">Our Core Values →</Link>
 </div>
 </div>
 </aside>
 );
}

function PolicyContent() {
 return (
 <section className="cth-privacy-content-wrap">
 <img
 src="/about-assets/columns/cth-column-left-rail-full-drafting.png"
 alt=""
 aria-hidden="true"
 className="cth-privacy-content-column"
 />

 <div className="cth-privacy-shell cth-privacy-content-grid">
 <OnThisPage />

 <div className="cth-privacy-main">
 <img
 src="/about-assets/columns/cth-column-left-rail-full-drafting.png"
 alt=""
 aria-hidden="true"
 className="cth-privacy-lower-column"
 />
 {policySections.map((section) => (
 <article key={section.id} id={section.id} className="cth-policy-block">
 <div className="cth-policy-head">
 <div className="cth-policy-number">{section.number}</div>
 <div className="cth-policy-head-text">
 <h2>{section.title}</h2>
 <p>{section.summary}</p>
 </div>
 <div className="cth-policy-icon">{section.icon}</div>
 </div>

 <div className="cth-policy-body">
 {section.body.map((paragraph, idx) => (
 <p key={idx}>{paragraph}</p>
 ))}
 </div>
 </article>
 ))}
 </div>
 </div>
 </section>
 );
}

function HelpStrip() {
 return (
 <section className="cth-privacy-help-strip">
 <div className="cth-privacy-shell cth-privacy-help-inner">
 <div>
 <Eyebrow light>Questions About Your Privacy?</Eyebrow>
 <h2>We’re Here to Help</h2>
 <p>
 Our team is committed to protecting your privacy and addressing your concerns.
 Reach out anytime. We’re here for you.
 </p>
 </div>

 <Link to="/contact" className="cth-btn cth-btn-outline-light">
 Contact Our Team <span>→</span>
 </Link>
 </div>
 </section>
 );
}


export default function PrivacyPolicyPage() {
 return (
 <main className="cth-privacy-page">
 <PublicHeader />
 <Hero />
 <TrustStrip />
 <PolicyContent />
 <HelpStrip />
 <PublicFooter />

 <style>{`
 .cth-privacy-page {
 min-height: 100vh;
 background: #F8F1EC;
 color: #33033C;
 overflow-x: hidden;
 font-family: 'DM Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
 }

 .cth-privacy-shell {
 width: min(1560px, calc(100vw - 96px));
 margin: 0 auto;
 position: relative;
 z-index: 2;
 }

 .cth-eyebrow {
 margin: 0;
 color: #AF0024;
 font-size: 11px;
 font-weight: 900;
 letter-spacing: 0.22em;
 text-transform: uppercase;
 }

 .cth-eyebrow.light {
 color: #C4A95B;
 }

 .cth-btn {
 min-height: 46px;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 gap: 14px;
 padding: 0 28px;
 border-radius: 4px;
 text-decoration: none;
 text-transform: uppercase;
 letter-spacing: 0.14em;
 font-size: 11px;
 font-weight: 900;
 border: 1px solid transparent;
 }

 .cth-btn-small {
 min-height: 40px;
 padding: 0 22px;
 font-size: 10px;
 }

 .cth-btn-primary {
 background: #AF0024;
 color: #fff;
 box-shadow: 0 14px 28px rgba(175,0,36,0.16);
 }

 .cth-btn-outline-light {
 background: transparent;
 color: #fff;
 border-color: rgba(196,169,91,0.52);
 }

 .cth-crest {
 position: relative;
 display: grid;
 place-items: center;
 width: 72px;
 height: 72px;
 border: 1px solid rgba(196,169,91,0.58);
 color: #F8F1EC;
 background: radial-gradient(circle, #6F062A, #33033C);
 }

 .cth-crest.small {
 width: 38px;
 height: 38px;
 color: #AF0024;
 background: rgba(255,255,255,0.7);
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
 color: #C4A95B;
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

 .cth-wordmark {
 display: flex;
 align-items: center;
 gap: 12px;
 color: #763B5B;
 text-decoration: none;
 font-family: Georgia, serif;
 font-size: 20px;
 font-weight: 700;
 white-space: nowrap;
 }

 .cth-privacy-header {
 position: sticky;
 top: 0;
 z-index: 80;
 border-bottom: 1px solid #DCCFC9;
 background: rgba(248,241,236,0.95);
 backdrop-filter: blur(16px);
 }

 .cth-privacy-header-inner {
 min-height: 72px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 28px;
 }

 .cth-privacy-nav {
 display: flex;
 align-items: center;
 gap: 28px;
 }

 .cth-privacy-nav a {
 position: relative;
 color: #3D2D3E;
 text-decoration: none;
 font-size: 10px;
 font-weight: 850;
 text-transform: uppercase;
 letter-spacing: 0.15em;
 }

 .cth-privacy-nav a.active {
 color: #AF0024;
 }

 .cth-privacy-nav a.active::after {
 content: "";
 position: absolute;
 left: 0;
 right: 0;
 bottom: -12px;
 height: 2px;
 background: #C4A95B;
 }

 .cth-privacy-hero {
 position: relative;
 overflow: hidden;
 border-bottom: 1px solid #DCCFC9;
 padding: 56px 0 32px;
 background: linear-gradient(180deg, #FCF8F5, #F8F1EC);
 }

 .cth-privacy-hero-floorplan {
 position: absolute;
 left: -40px;
 top: 8px;
 width: 290px;
 opacity: 0.14;
 pointer-events: none;
 user-select: none;
 }

 .cth-privacy-hero-grid {
 display: grid;
 grid-template-columns: 0.92fr 1.08fr;
 gap: 48px;
 align-items: center;
 }

 .cth-privacy-hero-copy h1 {
 margin: 18px 0 18px;
 color: #33033C;
 font-family: Georgia, serif;
 font-size: clamp(4rem, 6vw, 6.2rem);
 line-height: 0.95;
 letter-spacing: -0.06em;
 font-weight: 500;
 }

 .cth-privacy-hero-copy p {
 max-width: 580px;
 color: #564556;
 font-size: 16px;
 line-height: 1.8;
 font-weight: 650;
 }

 .cth-privacy-hero-actions {
 margin-top: 28px;
 }

 .cth-privacy-hero-house {
 min-height: 360px;
 display: grid;
 place-items: center;
 }

 .cth-privacy-hero-house img {
 width: min(760px, 100%);
 display: block;
 object-fit: contain;
 filter: drop-shadow(0 18px 28px rgba(51,3,60,0.08));
 }

 .cth-privacy-trust-strip {
 background: #33033C;
 color: #fff;
 padding: 24px 0;
 }

 .cth-privacy-trust-grid {
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 gap: 40px;
 }

 .cth-privacy-trust-grid article {
 display: flex;
 align-items: center;
 gap: 18px;
 padding: 8px 10px;
 border-right: 1px solid rgba(196,169,91,0.26);
 }

 .cth-privacy-trust-grid article:last-child {
 border-right: 0;
 }

 .cth-trust-icon {
 width: 52px;
 height: 52px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 border: 1px solid rgba(196,169,91,0.45);
 color: #C4A95B;
 font-size: 22px;
 flex: 0 0 auto;
 }

 .cth-privacy-trust-grid h3 {
 margin: 0 0 4px;
 color: #FFF5EE;
 font-family: Georgia, serif;
 font-size: 28px;
 line-height: 1;
 font-weight: 500;
 }

 .cth-privacy-trust-grid p {
 margin: 0;
 color: rgba(255,255,255,0.78);
 font-size: 14px;
 line-height: 1.5;
 }

 .cth-privacy-content-wrap {
 position: relative;
 background: #FCF8F5;
 padding: 34px 0 42px;
 }


 .cth-privacy-content-column {
 position: absolute;
 left: -76px;
 bottom: 24px;
 width: 300px;
 max-width: 22vw;
 opacity: 0.13;
 pointer-events: none;
 user-select: none;
 z-index: 1;
 }

 .cth-privacy-content-grid {
 display: grid;
 grid-template-columns: 270px minmax(0, 1fr);
 gap: 48px;
 align-items: start;
 }

 .cth-privacy-sidebar {
 position: sticky;
 top: 104px;
 }

 .cth-privacy-sidebar-card {
 border-right: 1px solid #E5D7D1;
 padding-right: 28px;
 }

 .cth-privacy-toc {
 margin-top: 18px;
 display: flex;
 flex-direction: column;
 gap: 14px;
 }

 .cth-privacy-toc a {
 display: grid;
 grid-template-columns: 28px 1fr;
 gap: 10px;
 color: #5F4E5D;
 text-decoration: none;
 font-size: 12px;
 font-weight: 700;
 line-height: 1.5;
 }

 .cth-privacy-toc a span:first-child {
 color: #C4A95B;
 font-weight: 900;
 }

 .cth-privacy-values-card {
 margin-top: 26px;
 padding: 24px 18px;
 border: 1px solid #D9C9C2;
 border-radius: 12px;
 background: rgba(255,255,255,0.62);
 text-align: center;
 }

 .cth-values-icon {
 width: 54px;
 height: 54px;
 margin: 0 auto 14px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 border: 1px solid rgba(196,169,91,0.52);
 color: #C4A95B;
 font-size: 24px;
 }

 .cth-privacy-values-card p {
 margin: 0 0 14px;
 color: #5B475B;
 font-family: Georgia, serif;
 font-size: 20px;
 line-height: 1.4;
 }

 .cth-privacy-values-card a {
 color: #AF0024;
 text-decoration: none;
 text-transform: uppercase;
 letter-spacing: 0.14em;
 font-size: 11px;
 font-weight: 900;
 }

 .cth-privacy-main {
 display: flex;
 flex-direction: column;
 gap: 0;
 }


 .cth-privacy-main {
 position: relative;
 }

 .cth-privacy-lower-column {
 position: absolute;
 right: -128px;
 top: 68%;
 width: 380px;
 max-width: 28vw;
 opacity: 0.22;
 transform: translateY(-50%);
 pointer-events: none;
 user-select: none;
 z-index: 1;
 filter: saturate(1.02) contrast(1.03);
 }

 .cth-policy-block {
 position: relative;
 z-index: 2;
 }

 .cth-policy-block {
 border-top: 1px solid #E4D6CF;
 padding: 26px 0;
 }

 .cth-policy-block:last-child {
 border-bottom: 1px solid #E4D6CF;
 }

 .cth-policy-head {
 display: grid;
 grid-template-columns: 54px minmax(0, 1fr) 54px;
 gap: 22px;
 align-items: start;
 }

 .cth-policy-number {
 color: #AF0024;
 font-family: Georgia, serif;
 font-size: 28px;
 line-height: 1;
 }

 .cth-policy-head-text h2 {
 margin: 0 0 8px;
 color: #33033C;
 font-family: Georgia, serif;
 font-size: 36px;
 line-height: 1.05;
 letter-spacing: -0.04em;
 font-weight: 500;
 }

 .cth-policy-head-text p {
 margin: 0;
 color: #6A5868;
 font-size: 14px;
 line-height: 1.6;
 font-weight: 650;
 }

 .cth-policy-icon {
 width: 48px;
 height: 48px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 border: 1px solid rgba(196,169,91,0.42);
 color: #C4A95B;
 font-size: 22px;
 justify-self: end;
 }

 .cth-policy-body {
 margin: 18px 0 0 76px;
 max-width: 980px;
 }

 .cth-policy-body p {
 margin: 0 0 14px;
 color: #4F3F50;
 font-size: 14px;
 line-height: 1.8;
 font-weight: 650;
 }

 .cth-privacy-help-strip {
 position: relative;
 overflow: hidden;
 background: #33033C;
 color: #fff;
 padding: 28px 0;
 }

 .cth-privacy-help-inner {
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 40px;
 }

 .cth-privacy-help-inner h2 {
 margin: 10px 0 8px;
 color: #FFF7F2;
 font-family: Georgia, serif;
 font-size: clamp(2.2rem, 3vw, 3.6rem);
 line-height: 0.96;
 font-weight: 500;
 letter-spacing: -0.05em;
 }

 .cth-privacy-help-inner p {
 margin: 0;
 color: rgba(255,255,255,0.78);
 font-size: 14px;
 line-height: 1.7;
 max-width: 640px;
 }

 .cth-privacy-logo-strip {
 background: #F8F1EC;
 padding: 22px 0;
 border-bottom: 1px solid #DDCFC9;
 }

 .cth-privacy-logo-row {
 margin-top: 16px;
 display: grid;
 grid-template-columns: repeat(6, 1fr);
 gap: 14px;
 }

 .cth-privacy-logo-row span {
 color: #4E3E50;
 text-align: center;
 text-transform: uppercase;
 letter-spacing: 0.16em;
 font-size: 12px;
 font-weight: 900;
 }

 .cth-privacy-footer {
 background: #260128;
 color: #fff;
 padding: 30px 0 16px;
 }

 .cth-privacy-footer-grid {
 display: grid;
 grid-template-columns: 1.25fr repeat(5, 1fr);
 gap: 34px;
 align-items: start;
 }

 .cth-privacy-footer-brand h3 {
 margin: 12px 0 4px;
 color: #C4A95B;
 font-family: Georgia, serif;
 font-size: 24px;
 font-weight: 500;
 }

 .cth-privacy-footer-brand p {
 color: rgba(255,255,255,0.68);
 font-size: 13px;
 line-height: 1.5;
 margin: 0;
 }

 .cth-privacy-socials {
 display: flex;
 gap: 10px;
 margin-top: 18px;
 }

 .cth-privacy-socials span {
 width: 28px;
 height: 28px;
 display: grid;
 place-items: center;
 border: 1px solid rgba(196,169,91,0.38);
 border-radius: 999px;
 color: #C4A95B;
 font-size: 10px;
 }

 .cth-privacy-footer-col h4 {
 margin: 0 0 12px;
 color: #C4A95B;
 text-transform: uppercase;
 letter-spacing: 0.16em;
 font-size: 11px;
 }

 .cth-privacy-footer-col a,
 .cth-privacy-footer-col span {
 display: block;
 margin-bottom: 8px;
 color: rgba(255,255,255,0.7);
 text-decoration: none;
 font-size: 12px;
 }

 .cth-privacy-footer-bottom {
 margin-top: 24px;
 padding-top: 14px;
 border-top: 1px solid rgba(255,255,255,0.12);
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 20px;
 color: rgba(255,255,255,0.56);
 font-size: 11px;
 }

 .cth-privacy-footer-bottom div {
 display: flex;
 gap: 24px;
 }

 .cth-privacy-footer-bottom a {
 color: rgba(255,255,255,0.68);
 text-decoration: none;
 }

 @media (max-width: 1280px) {
 .cth-privacy-shell {
 width: min(100% - 40px, 1560px);
 }

 .cth-privacy-nav {
 display: none;
 }

 .cth-privacy-hero-grid,
 .cth-privacy-content-grid,
 .cth-privacy-footer-grid {
 grid-template-columns: 1fr;
 }

 .cth-privacy-sidebar {
 position: relative;
 top: auto;
 }

 .cth-privacy-sidebar-card {
 border-right: 0;
 padding-right: 0;
 }

 .cth-privacy-trust-grid {
 grid-template-columns: 1fr;
 }

 .cth-privacy-trust-grid article {
 border-right: 0;
 border-bottom: 1px solid rgba(196,169,91,0.18);
 }

 .cth-privacy-trust-grid article:last-child {
 border-bottom: 0;
 }

 .cth-privacy-logo-row {
 grid-template-columns: repeat(3, 1fr);
 }

 .cth-privacy-help-inner {
 flex-direction: column;
 align-items: flex-start;
 }
 }

 @media (max-width: 860px) {
 .cth-privacy-hero-floorplan,
 .cth-privacy-content-column,
 .cth-privacy-lower-column {
 display: none;
 }

 .cth-policy-head {
 grid-template-columns: 46px 1fr;
 }

 .cth-policy-icon {
 display: none;
 }

 .cth-policy-body {
 margin-left: 0;
 }

 .cth-privacy-logo-row {
 grid-template-columns: repeat(2, 1fr);
 }

 .cth-privacy-footer-bottom {
 flex-direction: column;
 align-items: flex-start;
 }
 }

 @media (max-width: 640px) {
 .cth-privacy-hero-copy h1 {
 font-size: 3.5rem;
 }

 .cth-privacy-logo-row {
 grid-template-columns: 1fr;
 }

 .cth-privacy-footer-grid {
 grid-template-columns: 1fr;
 }

 .cth-privacy-footer-bottom div {
 flex-wrap: wrap;
 gap: 12px;
 }
 }
 `}</style>
 </main>
 );
}
