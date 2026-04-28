import React from "react";
import { Link } from "react-router-dom";

const footerGroups = [
 {
 heading: "The House",
 links: [
 { label: "The System", to: "/methodology" },
 { label: "Tiers", href: "/tiers" },
 { label: "The Diagnostic", href: "/brand-diagnostic/" },
 { label: "About", to: "/about" },
 { label: "Case Studies", to: "/blog" },
 { label: "FAQ", to: "/contact" },
 ],
 },
 {
 heading: "Studios",
 links: [
 { label: "The Presence Studio", to: "/store" },
 { label: "Studio 2", to: "/store", muted: true },
 { label: "Studio 3", to: "/store", muted: true },
 { label: "All Studios", to: "/store" },
 ],
 },
 {
 heading: "Resources",
 links: [
 { label: "Field Notes", to: "/blog" },
 { label: "Brand Glossary", to: "/blog" },
 ],
 newsletter: true,
 },
 {
 heading: "Connect",
 links: [
 { label: "Contact", to: "/contact" },
 { label: "Member Login", to: "/sign-in" },
 { label: "Support / Help", to: "/contact" },
 { label: "Affiliate Program", to: "/contact" },
 ],
 social: true,
 },
];

const socialLinks = [
 { label: "Instagram", icon: "/brand-assets/social-icons/instagram.png", href: "#" },
 { label: "Facebook", icon: "/brand-assets/social-icons/facebook.png", href: "#" },
 { label: "TikTok", icon: "/brand-assets/social-icons/tiktok.png", href: "#" },
 { label: "Email", icon: "/brand-assets/social-icons/email.png", href: "mailto:hello@coretruthhouse.com" },
];

function FooterLink({ link }) {
 const className = link.muted ? "muted" : "";

 if (link.to) {
 return (
 <Link to={link.to} className={className}>
 {link.label}
 </Link>
 );
 }

 return (
 <a href={link.href} className={className}>
 {link.label}
 </a>
 );
}

function NewsletterSignup() {
 return (
 <form className="cth-public-footer-newsletter">
 <label htmlFor="footer-newsletter-email">Newsletter</label>
 <div>
 <input
 id="footer-newsletter-email"
 type="email"
 placeholder="Email address"
 aria-label="Email address"
 />
 <button type="button">Join</button>
 </div>
 <small>Quiet strategy notes for serious founders.</small>
 </form>
 );
}

function SocialHandles() {
 return (
 <div className="cth-public-footer-social-block">
 <span>Social handles</span>
 <div className="cth-public-footer-socials" aria-label="Social links">
 {socialLinks.map((social) => (
 <a key={social.label} href={social.href} aria-label={social.label}>
 <img src={social.icon} alt="" aria-hidden="true" />
 </a>
 ))}
 </div>
 </div>
 );
}

export default function PublicFooter() {
 return (
 <footer className="cth-public-footer">
 <div className="cth-public-footer-shell">
 <div className="cth-public-footer-brand-row">
 <Link to="/" className="cth-public-footer-wordmark">
 <img
 src="/brand-assets/logo/cth-logo-seal.png"
 alt=""
 aria-hidden="true"
 className="cth-public-footer-logo"
 />
 <span>Core Truth House</span>
 </Link>

 <p>Where serious brands are built.</p>
 </div>

 <div className="cth-public-footer-grid">
 {footerGroups.map((group) => (
 <div key={group.heading} className="cth-public-footer-col">
 <h4>{group.heading}</h4>

 <div className="cth-public-footer-links">
 {group.links.map((link) => (
 <FooterLink key={link.label} link={link} />
 ))}
 </div>

 {group.newsletter ? <NewsletterSignup /> : null}
 {group.social ? <SocialHandles /> : null}
 </div>
 ))}
 </div>

 <div className="cth-public-footer-bottom">
 <span>© 2026 Core Truth House. All rights reserved.</span>
 <div>
 <Link to="/terms">Terms of Service</Link>
 <Link to="/privacy">Privacy Policy</Link>
 <Link to="/privacy#cookies">Cookie Policy</Link>
 </div>
 </div>
 </div>

 <style>{`
 .cth-public-footer {
 background:
 radial-gradient(circle at 18% 0%, rgba(175, 0, 36, 0.22), transparent 32%),
 radial-gradient(circle at 82% 100%, rgba(196, 169, 91, 0.12), transparent 34%),
 var(--cth-purple-deep);
 color: var(--cth-white);
 border-top: 1px solid rgba(196, 169, 91, 0.24);
 overflow: hidden;
 }

 .cth-public-footer-shell {
 width: min(1540px, calc(100vw - 96px));
 margin: 0 auto;
 position: relative;
 z-index: 2;
 }

 .cth-public-footer-brand-row {
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 28px;
 padding: 48px 0 34px;
 border-bottom: 1px solid rgba(196, 169, 91, 0.18);
 }

 .cth-public-footer-wordmark {
 display: inline-flex;
 align-items: center;
 gap: 12px;
 color: var(--cth-white);
 text-decoration: none;
 font-family: Georgia, serif;
 font-size: 25px;
 font-weight: 850;
 letter-spacing: -0.04em;
 white-space: nowrap;
 }

 .cth-public-footer-logo {
 width: 52px;
 height: 52px;
 object-fit: contain;
 display: block;
 }

 .cth-public-footer-brand-row p {
 margin: 0;
 color: rgba(248, 241, 236, 0.74);
 font-family: Georgia, serif;
 font-size: clamp(1.25rem, 2vw, 1.85rem);
 font-style: italic;
 line-height: 1.2;
 text-align: right;
 }

 .cth-public-footer-grid {
 display: grid;
 grid-template-columns: repeat(4, minmax(0, 1fr));
 gap: 44px;
 padding: 44px 0 46px;
 }

 .cth-public-footer-col h4 {
 margin: 0 0 18px;
 color: var(--cth-gold);
 text-transform: uppercase;
 letter-spacing: 0.16em;
 font-size: 11px;
 font-weight: 950;
 }

 .cth-public-footer-links {
 display: grid;
 gap: 12px;
 }

 .cth-public-footer-links a {
 width: fit-content;
 color: rgba(248, 241, 236, 0.80);
 text-decoration: none;
 font-size: 14px;
 font-weight: 650;
 line-height: 1.35;
 transition: color 180ms ease, transform 180ms ease;
 }

 .cth-public-footer-links a:hover {
 color: var(--cth-white);
 transform: translateX(2px);
 }

 .cth-public-footer-links a.muted {
 color: rgba(248, 241, 236, 0.44);
 }

 .cth-public-footer-newsletter {
 margin-top: 24px;
 padding-top: 20px;
 border-top: 1px solid rgba(196, 169, 91, 0.16);
 }

 .cth-public-footer-newsletter label,
 .cth-public-footer-social-block span {
 display: block;
 margin-bottom: 10px;
 color: rgba(248, 241, 236, 0.62);
 text-transform: uppercase;
 letter-spacing: 0.14em;
 font-size: 10px;
 font-weight: 900;
 }

 .cth-public-footer-newsletter div {
 display: flex;
 align-items: stretch;
 gap: 8px;
 }

 .cth-public-footer-newsletter input {
 min-width: 0;
 flex: 1;
 height: 42px;
 border: 1px solid rgba(196, 169, 91, 0.22);
 border-radius: 6px;
 background: rgba(248, 241, 236, 0.08);
 color: var(--cth-white);
 padding: 0 12px;
 outline: none;
 font-size: 13px;
 }

 .cth-public-footer-newsletter input::placeholder {
 color: rgba(248, 241, 236, 0.42);
 }

 .cth-public-footer-newsletter button {
 height: 42px;
 border: 0;
 border-radius: 6px;
 background: var(--cth-crimson);
 color: var(--cth-white);
 padding: 0 14px;
 text-transform: uppercase;
 letter-spacing: 0.12em;
 font-size: 10px;
 font-weight: 950;
 cursor: pointer;
 }

 .cth-public-footer-newsletter small {
 display: block;
 margin-top: 9px;
 color: rgba(248, 241, 236, 0.48);
 line-height: 1.5;
 font-size: 12px;
 }

 .cth-public-footer-social-block {
 margin-top: 24px;
 padding-top: 20px;
 border-top: 1px solid rgba(196, 169, 91, 0.16);
 }

 .cth-public-footer-socials {
 display: flex;
 align-items: center;
 gap: 10px;
 }

 .cth-public-footer-socials a {
 width: 34px;
 height: 34px;
 display: grid;
 place-items: center;
 border-radius: 999px;
 background: rgba(248, 241, 236, 0.08);
 border: 1px solid rgba(196, 169, 91, 0.22);
 transition: transform 180ms ease, background 180ms ease;
 }

 .cth-public-footer-socials a:hover {
 transform: translateY(-1px);
 background: rgba(248, 241, 236, 0.14);
 }

 .cth-public-footer-socials img {
 width: 18px;
 height: 18px;
 object-fit: contain;
 display: block;
 }

 .cth-public-footer-bottom {
 min-height: 66px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 24px;
 border-top: 1px solid rgba(196, 169, 91, 0.18);
 color: rgba(248, 241, 236, 0.62);
 font-size: 13px;
 }

 .cth-public-footer-bottom div {
 display: flex;
 align-items: center;
 gap: 18px;
 flex-wrap: wrap;
 }

 .cth-public-footer-bottom a {
 color: rgba(248, 241, 236, 0.72);
 text-decoration: none;
 }

 .cth-public-footer-bottom a:hover {
 color: var(--cth-white);
 }

 @media (max-width: 1100px) {
 .cth-public-footer-shell {
 width: min(100% - 34px, 1540px);
 }

 .cth-public-footer-brand-row {
 align-items: flex-start;
 flex-direction: column;
 }

 .cth-public-footer-brand-row p {
 text-align: left;
 }

 .cth-public-footer-grid {
 grid-template-columns: repeat(2, minmax(0, 1fr));
 }
 }

 @media (max-width: 700px) {
 .cth-public-footer-grid {
 grid-template-columns: 1fr;
 padding-top: 36px;
 }

 .cth-public-footer-bottom {
 flex-direction: column;
 align-items: flex-start;
 justify-content: center;
 padding: 20px 0;
 }

 .cth-public-footer-bottom div {
 gap: 12px 16px;
 }
 }
 `}</style>
 </footer>
 );
}
