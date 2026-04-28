import React from "react";
import { Link } from "react-router-dom";

export const publicPalette = {
 bg: "var(--cth-blush)",
 panel: "var(--cth-admin-panel)",
 panelAlt: "var(--cth-admin-panel-alt)",
 sidebarStart: "var(--cth-surface-midnight)",
 sidebarEnd: "var(--cth-surface-night)",
 accent: "var(--cth-cinnabar)",
 ink: "var(--cth-admin-ink)",
 ruby: "var(--cth-ruby)",
 border: "var(--cth-admin-border)",
 darkBorder: "var(--cth-admin-border-dark)",
 muted: "var(--cth-admin-muted)",
 tuscany: "var(--cth-admin-tuscany)",
};

function PublicHeader() {
 const p = publicPalette;

 return (
 <header
 style={{
 position: "sticky",
 top: 0,
 zIndex: 50,
 background: "rgba(239,231,227,0.9)",
 backdropFilter: "blur(18px)",
 borderBottom: `1px solid ${p.border}`,
 }}
 >
 <div
 style={{
 width: "min(1180px, calc(100% - 32px))",
 margin: "0 auto",
 minHeight: 72,
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 gap: 22,
 }}
 >
 <Link
 to="/"
 style={{
 display: "flex",
 alignItems: "center",
 gap: 12,
 color: p.ink,
 textDecoration: "none",
 fontWeight: 900,
 }}
 >
 <img src="/brand-assets/logo/cth-logo-seal.png" alt="Core Truth House" style={{ width: 70, height: 70, objectFit: "contain" }} />
 <span style={{ fontFamily: "Georgia, serif", fontSize: 18 }}>Core Truth House</span>
 </Link>

 <nav
 className="public-nav-links"
 style={{
 display: "flex",
 alignItems: "center",
 gap: 20,
 color: p.ruby,
 fontSize: 14,
 fontWeight: 800,
 }}
 >
 <Link to="/#features" style={{ color: "inherit", textDecoration: "none" }}>Features</Link>
 <Link to="/tiers" style={{ color: "inherit", textDecoration: "none" }}>Tiers</Link>
 <Link to="/about" style={{ color: "inherit", textDecoration: "none" }}>About</Link>
 <Link to="/methodology" style={{ color: "inherit", textDecoration: "none" }}>Methodology</Link>
 <Link to="/contact" style={{ color: "inherit", textDecoration: "none" }}>Contact</Link>
 <Link to="/blog" style={{ color: "inherit", textDecoration: "none" }}>Blog</Link>
 </nav>

 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
 <Link to="/sign-in" style={{ color: p.ink, textDecoration: "none", fontWeight: 900, fontSize: 14 }}>
 Sign in
 </Link>
 <Link
 to="/sign-up"
 style={{
 background: p.accent,
 color: "var(--cth-white)",
 textDecoration: "none",
 padding: "10px 18px",
 borderRadius: 999,
 fontWeight: 900,
 boxShadow: "0 14px 32px rgba(224,78,53,0.2)",
 }}
 >
 Start free
 </Link>
 </div>
 </div>
 </header>
 );
}

function FooterColumn({ title, links }) {
 return (
 <div>
 <p
 style={{
 margin: "0 0 12px",
 color: "var(--cth-white)",
 fontSize: 12,
 fontWeight: 900,
 letterSpacing: "0.14em",
 textTransform: "uppercase",
 }}
 >
 {title}
 </p>
 <div style={{ display: "grid", gap: 9 }}>
 {links.map((link) => (
 <Link
 key={link.label}
 to={link.to}
 style={{
 color: "rgba(248,244,242,0.68)",
 textDecoration: "none",
 fontSize: 14,
 fontWeight: 650,
 }}
 >
 {link.label}
 </Link>
 ))}
 </div>
 </div>
 );
}

function PublicFooter() {
 const p = publicPalette;

 return (
 <footer
 style={{
 background: `linear-gradient(145deg, ${p.sidebarStart}, ${p.sidebarEnd})`,
 color: "rgba(248,244,242,0.72)",
 padding: "58px 0 30px",
 borderTop: `1px solid ${p.darkBorder}`,
 }}
 >
 <div style={{ width: "min(1180px, calc(100% - 32px))", margin: "0 auto" }}>
 <div
 className="public-footer-grid"
 style={{
 display: "grid",
 gridTemplateColumns: "1.4fr repeat(4, minmax(130px, 1fr))",
 gap: 34,
 alignItems: "start",
 }}
 >
 <div>
 <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
 <img src="/brand-assets/logo/cth-logo-seal.png" alt="Core Truth House" style={{ width: 70, height: 70, objectFit: "contain" }} />
 <div style={{ color: "var(--cth-white)", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 18 }}>
 Core Truth House
 </div>
 </div>
 <p style={{ margin: "14px 0 0", maxWidth: 360, lineHeight: 1.7 }}>
 The brand operating system for founders building from strategy, structure, and truth.
 </p>
 <p style={{ margin: "18px 0 0", color: p.tuscany, fontSize: 13, fontWeight: 800 }}>
 Build from the core. Operate with clarity.
 </p>
 </div>

 <FooterColumn
 title="Platform"
 links={[
 { label: "Features", to: "/#features" },
 { label: "Tiers", to: "/tiers" },
 { label: "Free Brand Audit", to: "/sign-up" },
 { label: "Start Free", to: "/sign-up" },
 ]}
 />

 <FooterColumn
 title="Company"
 links={[
 { label: "About Us", to: "/about" },
 { label: "Contact Us", to: "/contact" },
 { label: "Blog", to: "/blog" },
 { label: "Methodology", to: "/methodology" },
 { label: "Store", to: "/store" },
 ]}
 />

 <FooterColumn
 title="Resources"
 links={[
 { label: "Help Center", to: "/help" },
 { label: "Sign In", to: "/sign-in" },
 { label: "Create Account", to: "/sign-up" },
 ]}
 />

 <FooterColumn
 title="Legal"
 links={[
 { label: "Privacy Policy", to: "/privacy" },
 { label: "Terms of Service", to: "/terms" },
 ]}
 />
 </div>

 <div
 style={{
 marginTop: 42,
 paddingTop: 22,
 borderTop: "1px solid rgba(248,244,242,0.1)",
 display: "flex",
 justifyContent: "space-between",
 gap: 16,
 flexWrap: "wrap",
 color: "rgba(248,244,242,0.48)",
 fontSize: 13,
 }}
 >
 <span>© {new Date().getFullYear()} Core Truth House. All rights reserved.</span>
 <span>Built for founders who want clarity, structure, and a brand that can hold the vision.</span>
 </div>
 </div>
 </footer>
 );
}

export default function PublicSiteLayout({ children }) {
 const p = publicPalette;

 return (
 <main
 style={{
 minHeight: "100vh",
 background: p.bg,
 color: p.ink,
 fontFamily: '"DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
 }}
 >
 <PublicHeader />
 {children}
 <PublicFooter />

 <style>{`
 body {
 background: ${p.bg} !important;
 color: ${p.ink} !important;
 }

 a {
 transition: color 180ms ease, background 180ms ease, transform 180ms ease, border-color 180ms ease;
 }

 a:hover {
 color: ${p.accent} !important;
 }

 article {
 transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
 }

 article:hover {
 transform: translateY(-4px);
 box-shadow: 0 24px 64px rgba(20,15,43,0.12), 0 1px 0 rgba(255,255,255,0.7) inset !important;
 }

 footer a:hover {
 color: var(--cth-white)fff !important;
 transform: translateX(2px);
 }

 @media (max-width: 920px) {
 .public-nav-links {
 display: none !important;
 }

 .public-footer-grid {
 grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
 }
 }

 @media (max-width: 680px) {
 .public-footer-grid {
 grid-template-columns: 1fr !important;
 }
 }
 `}</style>
 </main>
 );
}
