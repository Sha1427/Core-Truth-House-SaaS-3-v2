import React from "react";
import { Link } from "react-router-dom";

const navItems = [
 { label: "The System", to: "/methodology" },
 { label: "Tiers", to: "/tiers" },
 { label: "Studios", to: "/store" },
 { label: "About", to: "/about" },
];

function isActive(item, active) {
 if (!active) return false;

 const normalized = active.toLowerCase();

 if (item.label === "Studios" && normalized === "store") return true;
 if (item.label === "About" && normalized === "about") return true;
 if (item.label === "The System" && normalized === "system") return true;
 if (item.label === "Tiers" && (normalized === "tiers" || normalized === "pricing")) return true;

 return item.label.toLowerCase() === normalized;
}

export default function PublicHeader({ active = "" }) {
 return (
 <header className="cth-public-header">
 <div className="cth-public-shell cth-public-header-inner">
 <Link to="/" className="cth-public-wordmark" aria-label="Core Truth House home">
 <img
 src="/brand-assets/logo/cth-logo-seal.png"
 alt=""
 aria-hidden="true"
 className="cth-public-logo-seal"
 />
 <span>Core Truth House</span>
 </Link>

 <nav className="cth-public-nav" aria-label="Public navigation">
 {navItems.map((item) =>
 item.to ? (
 <Link
 key={item.label}
 to={item.to}
 className={isActive(item, active) ? "active" : ""}
 >
 {item.label}
 </Link>
 ) : (
 <a
 key={item.label}
 href={item.href}
 className={isActive(item, active) ? "active" : ""}
 >
 {item.label}
 </a>
 )
 )}
 </nav>

 <div className="cth-public-actions">
 <a href="/tiers" className="cth-public-pricing-link">
 View Tiers
 </a>

 <a href="/brand-diagnostic/" className="cth-public-header-cta">
 Start the Brand Diagnostic
 </a>

 <Link to="/sign-in" className="cth-public-login-link">
 Login
 </Link>
 </div>
 </div>

 <style>{`
 .cth-public-header {
 position: sticky;
 top: 0;
 z-index: 100;
 background: rgba(248, 241, 236, 0.96);
 border-bottom: 1px solid var(--cth-border);
 backdrop-filter: blur(16px);
 }

 .cth-public-shell {
 width: min(1540px, calc(100vw - 96px));
 margin: 0 auto;
 position: relative;
 z-index: 2;
 }

 .cth-public-header-inner {
 min-height: 72px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 28px;
 }

 .cth-public-wordmark {
 display: inline-flex;
 align-items: center;
 gap: 12px;
 color: var(--cth-purple-deep);
 text-decoration: none;
 font-family: Georgia, serif;
 font-size: 20px;
 font-weight: 800;
 letter-spacing: -0.03em;
 white-space: nowrap;
 }

 .cth-public-logo-seal {
 width: 42px;
 height: 42px;
 object-fit: contain;
 display: block;
 }

 .cth-public-nav {
 display: flex;
 align-items: center;
 justify-content: center;
 gap: 30px;
 margin-left: auto;
 }

 .cth-public-nav a {
 color: var(--cth-ruby);
 text-decoration: none;
 font-size: 12px;
 font-weight: 850;
 letter-spacing: 0.045em;
 transition: color 180ms ease;
 white-space: nowrap;
 }

 .cth-public-nav a:hover,
 .cth-public-nav a.active {
 color: var(--cth-crimson);
 }

 .cth-public-actions {
 display: inline-flex;
 align-items: center;
 gap: 16px;
 margin-left: 6px;
 }

 .cth-public-header-cta {
 min-height: 44px;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 padding: 0 22px;
 border-radius: 6px;
 background: var(--cth-crimson);
 color: var(--cth-white);
 text-decoration: none;
 text-transform: uppercase;
 letter-spacing: 0.12em;
 font-size: 10.5px;
 font-weight: 950;
 box-shadow: 0 14px 28px rgba(175, 0, 36, 0.16);
 transition: background 180ms ease, transform 180ms ease;
 white-space: nowrap;
 }

 .cth-public-header-cta:hover {
 background: var(--cth-action-hover);
 transform: translateY(-1px);
 }

 .cth-public-login-link {
 color: var(--cth-ruby);
 text-decoration: none;
 font-size: 12px;
 font-weight: 850;
 letter-spacing: 0.045em;
 white-space: nowrap;
 transition: color 180ms ease;
 }

 .cth-public-login-link:hover {
 color: var(--cth-crimson);
 }

 @media (max-width: 1100px) {
 .cth-public-shell {
 width: min(100% - 34px, 1540px);
 }

 .cth-public-nav {
 display: none;
 }

 .cth-public-actions {
 margin-left: auto;
 }
 }

 @media (max-width: 640px) {
 .cth-public-header-inner {
 min-height: 68px;
 gap: 14px;
 }

 .cth-public-wordmark span {
 font-size: 17px;
 }

 .cth-public-logo-seal {
 width: 38px;
 height: 38px;
 }

 .cth-public-pricing-link {
 color: var(--cth-purple-deep);
 text-decoration: none;
 font-size: 11px;
 font-weight: 900;
 letter-spacing: 0.08em;
 text-transform: uppercase;
 white-space: nowrap;
 transition: color 180ms ease;
 }

 .cth-public-pricing-link:hover {
 color: var(--cth-crimson);
 }

 .cth-public-header-cta {
 min-height: 40px;
 padding: 0 13px;
 font-size: 9.5px;
 letter-spacing: 0.08em;
 }

 .cth-public-login-link {
 display: none;
 }
 }

 @media (max-width: 430px) {
 .cth-public-wordmark span {
 display: none;
 }
 }
 `}</style>
 </header>
 );
}
