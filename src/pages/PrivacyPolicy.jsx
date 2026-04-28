import React from "react";
import { Link } from "react-router-dom";

const palette = {
 bg: "#efe7e3",
 panel: "#f8f4f2",
 panelAlt: "#f2e9e5",
 accent: "#e04e35",
 ink: "#2b1040",
 ruby: "#763b5b",
 border: "#d8c5c3",
 muted: "#a88f9f",
};

function PublicLegalLayout({ title, subtitle, children }) {
 return (
 <main
 style={{
 minHeight: "100vh",
 background: palette.bg,
 color: palette.ink,
 fontFamily: '"DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
 }}
 >
 <nav
 style={{
 position: "sticky",
 top: 0,
 zIndex: 20,
 background: "rgba(239,231,227,0.9)",
 backdropFilter: "blur(16px)",
 borderBottom: `1px solid ${palette.border}`,
 }}
 >
 <div
 style={{
 width: "min(980px, calc(100% - 32px))",
 margin: "0 auto",
 minHeight: 72,
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 gap: 20,
 }}
 >
 <Link to="/" style={{ color: palette.ink, textDecoration: "none", fontWeight: 900, fontFamily: "Georgia, serif" }}>
 Core Truth House
 </Link>
 <Link to="/" style={{ color: palette.ruby, textDecoration: "none", fontWeight: 800 }}>
 Back to Home
 </Link>
 </div>
 </nav>

 <section style={{ padding: "72px 0" }}>
 <div style={{ width: "min(880px, calc(100% - 32px))", margin: "0 auto" }}>
 <div
 style={{
 background: palette.panel,
 border: `1px solid ${palette.border}`,
 borderRadius: 32,
 padding: "42px",
 boxShadow: "0 20px 60px rgba(20,15,43,0.08)",
 }}
 >
 <p
 style={{
 margin: 0,
 color: palette.accent,
 fontSize: 12,
 fontWeight: 900,
 letterSpacing: "0.16em",
 textTransform: "uppercase",
 }}
 >
 Core Truth House
 </p>
 <h1
 style={{
 margin: "12px 0",
 color: palette.ink,
 fontFamily: "Georgia, serif",
 fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
 lineHeight: 1,
 letterSpacing: "-0.055em",
 }}
 >
 {title}
 </h1>
 <p style={{ color: palette.ruby, fontSize: 18, lineHeight: 1.7, fontWeight: 600, marginBottom: 34 }}>
 {subtitle}
 </p>

 <div className="legal-copy">{children}</div>
 </div>
 </div>
 </section>

 <style>{`
 body {
 background: ${palette.bg} !important;
 color: ${palette.ink} !important;
 }

 .legal-copy {
 color: ${palette.ruby};
 font-size: 16px;
 line-height: 1.78;
 }

 .legal-copy h2 {
 color: ${palette.ink};
 font-family: Georgia, serif;
 font-size: 1.55rem;
 margin: 2rem 0 0.7rem;
 letter-spacing: -0.02em;
 }

 .legal-copy h3 {
 color: ${palette.ink};
 font-size: 1.05rem;
 margin: 1.35rem 0 0.4rem;
 }

 .legal-copy p,
 .legal-copy li {
 color: ${palette.ruby};
 }

 .legal-copy strong {
 color: ${palette.ink};
 }

 .legal-copy ul {
 padding-left: 1.25rem;
 }

 .legal-copy a {
 color: ${palette.accent};
 font-weight: 800;
 }
 `}</style>
 </main>
 );
}

export default function PrivacyPolicy() {
 return (
 <PublicLegalLayout
 title="Privacy Policy"
 subtitle="How Core Truth House handles your information, brand data, and account details."
 >
 <p><strong>Last updated:</strong> April 2026</p>

 <h2>1. Information We Collect</h2>
 <p>We collect information you provide when creating an account, using the platform, completing forms, purchasing a plan, or contacting us.</p>

 <h3>Information you provide</h3>
 <ul>
 <li>Name, email address, and account details</li>
 <li>Brand data entered into Core Truth House tools</li>
 <li>Files, notes, prompts, documents, and workspace content you choose to upload</li>
 <li>Billing and subscription information handled through payment providers</li>
 </ul>

 <h3>Information collected automatically</h3>
 <p>We may collect device, browser, usage, log, and analytics information to improve performance, security, and product experience.</p>

 <h2>2. How We Use Your Information</h2>
 <p>We use your information to operate the platform, personalize your workspace, support AI-powered features, process payments, provide support, improve security, and communicate important account updates.</p>

 <h2>3. Brand Memory and AI Data</h2>
 <p>Core Truth House may use the information you enter into your workspace to generate brand-specific outputs inside your account. Your Brand Memory is used to make your experience more relevant and consistent.</p>

 <h2>4. Data Storage and Security</h2>
 <p>We use reasonable safeguards to protect your information. No system is perfect, so you are responsible for keeping your login credentials secure.</p>

 <h2>5. Third-Party Services</h2>
 <p>We may use trusted third-party services for authentication, payment processing, hosting, analytics, email delivery, and AI generation.</p>

 <h2>6. Your Choices</h2>
 <p>You may update account information, manage subscription settings, or contact us about privacy questions.</p>

 <h2>7. Contact</h2>
 <p>For privacy questions, contact us through the Contact page or at <strong>support@coretruthhouse.com</strong>.</p>
 </PublicLegalLayout>
 );
}
