import React from "react";
import { Link } from "react-router-dom";

const palette = {
 bg: "#efe7e3",
 panel: "#f8f4f2",
 accent: "#e04e35",
 ink: "#2b1040",
 ruby: "#763b5b",
 border: "#d8c5c3",
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
 <p style={{ margin: 0, color: palette.accent, fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase" }}>
 Core Truth House
 </p>
 <h1 style={{ margin: "12px 0", color: palette.ink, fontFamily: "Georgia, serif", fontSize: "clamp(2.4rem, 5vw, 4.5rem)", lineHeight: 1, letterSpacing: "-0.055em" }}>
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
 `}</style>
 </main>
 );
}

export default function TermsOfService() {
 return (
 <PublicLegalLayout
 title="Terms of Service"
 subtitle="The basic terms for using Core Truth House and its brand operating system."
 >
 <p><strong>Last updated:</strong> April 2026</p>

 <h2>1. Acceptance of Terms</h2>
 <p>By accessing or using Core Truth House, you agree to these terms and any policies referenced here.</p>

 <h2>2. Use of the Platform</h2>
 <p>You agree to use the platform responsibly and only for lawful business, branding, content, strategy, and operational purposes.</p>

 <h2>3. Accounts and Security</h2>
 <p>You are responsible for maintaining the confidentiality of your account credentials and for activity under your account.</p>

 <h2>4. Subscriptions and Billing</h2>
 <p>Paid plans may be billed through a third-party payment provider. Plan details, pricing, and features may change over time.</p>

 <h2>5. User Content and Brand Data</h2>
 <p>You retain responsibility for the information, files, prompts, brand data, and content you enter into the platform.</p>

 <h2>6. AI Outputs</h2>
 <p>AI-generated outputs should be reviewed before use. You are responsible for final decisions, publication, and business implementation.</p>

 <h2>7. Limitation of Liability</h2>
 <p>Core Truth House is provided as a business and brand support platform. We do not guarantee specific revenue, legal, financial, or business outcomes.</p>

 <h2>8. Contact</h2>
 <p>For questions about these terms, contact us at <strong>support@coretruthhouse.com</strong>.</p>
 </PublicLegalLayout>
 );
}
