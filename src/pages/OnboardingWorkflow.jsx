import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
 bg: "#efe7e3",
 panel: "#f8f4f2",
 panelAlt: "#f2e9e5",
 sidebarStart: "#140f2b",
 sidebarEnd: "#120717",
 sidebarHover: "#3a1838",
 accent: "#e04e35",
 ink: "#2b1040",
 ruby: "#763b5b",
 border: "#d8c5c3",
 borderDark: "#3b2740",
 muted: "#a88f9f",
 tuscany: "#c7a09d",
 success: "#2d6a4f",
};

const STEPS = [
 {
 id: "brand_audit",
 label: "Brand Audit",
 eyebrow: "Step 01",
 title: "Diagnose before you build.",
 sidebarTitle: "Start with the truth.",
 route: "/brand-audit",
 icon: "🔍",
 description:
 "Run the Brand Audit first so the system can show what is clear, what is missing, and what needs to be strengthened before you build more.",
 sidebarCopy:
 "This step gives the brand a diagnostic starting point instead of guessing what to fix next.",
 outcomes: [
 "Brand health snapshot",
 "Priority action list",
 "Clearer starting point",
 ],
 cta: "Run Brand Audit",
 },
 {
 id: "brand_foundation",
 label: "Brand Foundation",
 eyebrow: "Step 02",
 title: "Lock the strategic architecture.",
 sidebarTitle: "Build the foundation.",
 route: "/brand-foundation",
 icon: "🏛",
 description:
 "Define the mission, vision, values, audience, positioning, promise, and message direction that everything else will build from.",
 sidebarCopy:
 "This is where the brand stops floating and starts standing on something real.",
 outcomes: [
 "Mission and vision documented",
 "Positioning clarified",
 "Promise and audience direction set",
 ],
 cta: "Build Foundation",
 },
 {
 id: "identity_studio",
 label: "Identity Studio",
 eyebrow: "Step 03",
 title: "Shape the visual direction.",
 sidebarTitle: "Give the strategy a look.",
 route: "/identity-studio",
 icon: "🎨",
 description:
 "Move from strategy into identity so the brand begins to feel consistent, recognizable, and aligned with the foundation.",
 sidebarCopy:
 "Identity follows strategy here. The look should support the truth, not distract from it.",
 outcomes: [
 "Visual direction started",
 "Brand assets organized",
 "Style choices connected to strategy",
 ],
 cta: "Open Identity Studio",
 },
 {
 id: "strategic_os",
 label: "Strategic OS",
 eyebrow: "Step 04",
 title: "Turn clarity into a working plan.",
 sidebarTitle: "Build the operating system.",
 route: "/strategic-os",
 icon: "⚙️",
 description:
 "Use the Strategic OS to turn the foundation into audience psychology, differentiation, offers, messaging, and execution direction.",
 sidebarCopy:
 "This is where the brand becomes usable. The strategy turns into a system you can operate.",
 outcomes: [
 "Audience psychology mapped",
 "Differentiation articulated",
 "Execution direction clarified",
 ],
 cta: "Open Strategic OS",
 },
];

function ProgressBars({ activeIndex }) {
 return (
 <div>
 <div className="cth-onboarding-count">
 {activeIndex + 1} of {STEPS.length}
 </div>

 <div className="cth-onboarding-bars">
 {STEPS.map((step, index) => (
 <button
 key={step.id}
 type="button"
 className={[
 "cth-onboarding-bar",
 index < activeIndex ? "is-complete" : "",
 index === activeIndex ? "is-active" : "",
 ]
 .filter(Boolean)
 .join(" ")}
 aria-label={`Go to ${step.label}`}
 />
 ))}
 </div>
 </div>
 );
}

function SidebarStepDetail({ step }) {
 return (
 <div className="cth-sidebar-step-detail">
 <div className="cth-sidebar-icon">{step.icon}</div>
 <h3>{step.sidebarTitle}</h3>
 <p>{step.sidebarCopy}</p>

 <div className="cth-sidebar-mini-list">
 {step.outcomes.map((item) => (
 <div key={item} className="cth-sidebar-mini-item">
 <span />
 {item}
 </div>
 ))}
 </div>
 </div>
 );
}

function OnboardingSidebar({ activeIndex, setActiveIndex, step }) {
 const navigate = useNavigate();

 return (
 <aside className="cth-onboarding-sidebar">
 <div>
 <div className="cth-onboarding-brand">
 <div className="cth-onboarding-mark">CTH</div>
 <div>
 <strong>Core Truth House</strong>
 <span>Guided Setup</span>
 </div>
 </div>

 <h2>Setup your brand system</h2>

 <ProgressBars activeIndex={activeIndex} />

 <nav className="cth-onboarding-step-nav" aria-label="Onboarding steps">
 {STEPS.map((item, index) => (
 <button
 key={item.id}
 type="button"
 onClick={() => setActiveIndex(index)}
 className={[
 "cth-onboarding-step-link",
 index === activeIndex ? "is-active" : "",
 index < activeIndex ? "is-complete" : "",
 ]
 .filter(Boolean)
 .join(" ")}
 >
 <span className="cth-step-number">{String(index + 1).padStart(2, "0")}</span>
 <span>
 <strong>{item.label}</strong>
 <small>{item.eyebrow}</small>
 </span>
 </button>
 ))}
 </nav>

 <SidebarStepDetail step={step} />
 </div>

 <button
 type="button"
 className="cth-go-home"
 onClick={() => navigate("/")}
 >
 ← Go back to home
 </button>
 </aside>
 );
}

function StepContent({ step, activeIndex, setActiveIndex }) {
 const navigate = useNavigate();
 const isFirst = activeIndex === 0;
 const isLast = activeIndex === STEPS.length - 1;

 return (
 <section className="cth-onboarding-content">
 <div className="cth-content-topline">
 <span>{step.eyebrow}</span>
 <span>{step.label}</span>
 </div>

 <div className="cth-content-icon">{step.icon}</div>

 <h1>{step.title}</h1>
 <p className="cth-content-description">{step.description}</p>

 <div className="cth-outcome-grid">
 {step.outcomes.map((item) => (
 <article key={item}>
 <span>✓</span>
 <strong>{item}</strong>
 </article>
 ))}
 </div>

 <div className="cth-content-card">
 <p>Recommended next action</p>
 <h3>{step.cta}</h3>
 <span>
 This opens the correct Core Truth House workspace area for this setup step.
 </span>
 </div>

 <div className="cth-onboarding-actions">
 <button
 type="button"
 className="cth-secondary-action"
 disabled={isFirst}
 onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}
 >
 Back
 </button>

 <button
 type="button"
 className="cth-primary-action"
 onClick={() => {
 if (isLast) {
 navigate(step.route);
 return;
 }
 setActiveIndex((current) => Math.min(STEPS.length - 1, current + 1));
 }}
 >
 {isLast ? step.cta : "Continue"}
 </button>
 </div>
 </section>
 );
}

export default function OnboardingWorkflow() {
 const [activeIndex, setActiveIndex] = useState(0);

 const activeStep = useMemo(() => STEPS[activeIndex] || STEPS[0], [activeIndex]);

 return (
 <main className="cth-onboarding3-page">
 <div className="cth-onboarding3-shell">
 <OnboardingSidebar
 activeIndex={activeIndex}
 setActiveIndex={setActiveIndex}
 step={activeStep}
 />

 <StepContent
 step={activeStep}
 activeIndex={activeIndex}
 setActiveIndex={setActiveIndex}
 />
 </div>

 <style>{`
 body {
 background: ${C.bg} !important;
 color: ${C.ink} !important;
 }

 .cth-onboarding3-page {
 min-height: 100%;
 width: 100%;
 display: flex;
 align-items: flex-start;
 justify-content: center;
 padding: 28px;
 background: transparent;
 font-family: "DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
 }

 .cth-onboarding3-shell {
 position: relative;
 z-index: 1;
 width: min(1120px, calc(100vw - 40px));
 min-height: min(720px, calc(100vh - 56px));
 max-height: calc(100vh - 56px);
 display: grid;
 grid-template-columns: 330px minmax(0, 1fr);
 border-radius: 34px;
 padding: 6px;
 background: linear-gradient(145deg, ${C.sidebarStart}, ${C.sidebarEnd});
 box-shadow: 0 28px 80px rgba(20,15,43,0.18), 0 1px 0 rgba(255,255,255,0.18) inset;
 overflow: hidden;
 }

 .cth-onboarding-sidebar {
 min-width: 0;
 display: flex;
 flex-direction: column;
 justify-content: space-between;
 padding: 28px 30px;
 color: #fff;
 }

 .cth-onboarding-brand {
 display: flex;
 align-items: center;
 gap: 12px;
 margin-bottom: 30px;
 }

 .cth-onboarding-mark {
 width: 42px;
 height: 42px;
 border-radius: 16px;
 display: grid;
 place-items: center;
 background: rgba(248,244,242,0.10);
 border: 1px solid rgba(248,244,242,0.16);
 color: #fff;
 font-size: 12px;
 font-weight: 950;
 letter-spacing: 0.08em;
 }

 .cth-onboarding-brand strong {
 display: block;
 color: #fff;
 font-family: Georgia, serif;
 font-size: 16px;
 line-height: 1.1;
 }

 .cth-onboarding-brand span {
 display: block;
 margin-top: 3px;
 color: rgba(248,244,242,0.56);
 font-size: 12px;
 font-weight: 750;
 }

 .cth-onboarding-sidebar h2 {
 margin: 0 0 18px;
 color: #fff;
 font-family: Georgia, serif;
 font-size: 29px;
 line-height: 1.05;
 letter-spacing: -0.045em;
 }

 .cth-onboarding-count {
 color: rgba(248,244,242,0.68);
 font-size: 13px;
 font-weight: 850;
 margin-bottom: 9px;
 }

 .cth-onboarding-bars {
 display: flex;
 gap: 8px;
 margin-bottom: 26px;
 }

 .cth-onboarding-bar {
 width: 34px;
 height: 5px;
 border: none;
 border-radius: 999px;
 background: rgba(248,244,242,0.22);
 padding: 0;
 }

 .cth-onboarding-bar.is-active {
 background: ${C.accent};
 }

 .cth-onboarding-bar.is-complete {
 background: ${C.tuscany};
 }

 .cth-onboarding-step-nav {
 display: grid;
 gap: 9px;
 margin-bottom: 26px;
 }

 .cth-onboarding-step-link {
 width: 100%;
 display: grid;
 grid-template-columns: 34px 1fr;
 gap: 10px;
 align-items: center;
 text-align: left;
 border: 1px solid transparent;
 border-radius: 18px;
 background: transparent;
 color: rgba(248,244,242,0.68);
 padding: 11px 12px;
 cursor: pointer;
 transition: background 180ms ease, border-color 180ms ease, transform 180ms ease;
 }

 .cth-onboarding-step-link:hover,
 .cth-onboarding-step-link.is-active {
 background: rgba(224,78,53,0.16);
 border-color: rgba(224,78,53,0.28);
 transform: translateX(2px);
 }

 .cth-onboarding-step-link.is-complete {
 color: rgba(248,244,242,0.86);
 }

 .cth-step-number {
 width: 30px;
 height: 30px;
 border-radius: 12px;
 display: grid;
 place-items: center;
 background: rgba(248,244,242,0.08);
 color: rgba(248,244,242,0.78);
 font-size: 11px;
 font-weight: 950;
 }

 .cth-onboarding-step-link.is-active .cth-step-number {
 background: ${C.accent};
 color: #fff;
 }

 .cth-onboarding-step-link strong {
 display: block;
 color: inherit;
 font-size: 13px;
 line-height: 1.1;
 }

 .cth-onboarding-step-link small {
 display: block;
 margin-top: 3px;
 color: rgba(248,244,242,0.42);
 font-size: 11px;
 font-weight: 750;
 }

 .cth-sidebar-step-detail {
 border-top: 1px solid rgba(248,244,242,0.12);
 padding-top: 22px;
 }

 .cth-sidebar-icon {
 width: 50px;
 height: 50px;
 border-radius: 18px;
 display: grid;
 place-items: center;
 background: rgba(248,244,242,0.08);
 border: 1px solid rgba(248,244,242,0.12);
 font-size: 24px;
 margin-bottom: 16px;
 }

 .cth-sidebar-step-detail h3 {
 margin: 0 0 8px;
 color: #fff;
 font-size: 17px;
 font-weight: 950;
 }

 .cth-sidebar-step-detail p {
 margin: 0;
 color: rgba(248,244,242,0.62);
 font-size: 13px;
 line-height: 1.6;
 font-weight: 650;
 }

 .cth-sidebar-mini-list {
 display: grid;
 gap: 8px;
 margin-top: 16px;
 }

 .cth-sidebar-mini-item {
 display: flex;
 align-items: center;
 gap: 9px;
 color: rgba(248,244,242,0.72);
 font-size: 12px;
 font-weight: 750;
 }

 .cth-sidebar-mini-item span {
 width: 7px;
 height: 7px;
 border-radius: 999px;
 background: ${C.accent};
 }

 .cth-go-home {
 align-self: flex-start;
 border: none;
 background: transparent;
 color: ${C.tuscany};
 font-size: 14px;
 font-weight: 850;
 cursor: pointer;
 padding: 0;
 }

 .cth-onboarding-content {
 background: linear-gradient(180deg, #f8f4f2, #ffffff);
 border-radius: 29px;
 min-width: 0;
 padding: 46px 54px;
 overflow: auto;
 color: ${C.ink};
 }

 .cth-content-topline {
 display: flex;
 justify-content: space-between;
 gap: 12px;
 color: ${C.accent};
 font-size: 12px;
 font-weight: 950;
 letter-spacing: 0.15em;
 text-transform: uppercase;
 margin-bottom: 30px;
 }

 .cth-content-icon {
 width: 74px;
 height: 74px;
 display: grid;
 place-items: center;
 border-radius: 26px;
 background: rgba(224,78,53,0.11);
 border: 1px solid rgba(224,78,53,0.18);
 font-size: 34px;
 box-shadow: 0 18px 42px rgba(224,78,53,0.10);
 margin-bottom: 26px;
 }

 .cth-onboarding-content h1 {
 margin: 0;
 color: ${C.ink};
 font-family: Georgia, serif;
 font-size: clamp(2.3rem, 4.6vw, 4.7rem);
 line-height: 0.96;
 letter-spacing: -0.065em;
 max-width: 760px;
 }

 .cth-content-description {
 margin: 22px 0 0;
 max-width: 720px;
 color: ${C.ruby};
 font-size: 18px;
 line-height: 1.75;
 font-weight: 650;
 }

 .cth-outcome-grid {
 display: grid;
 grid-template-columns: repeat(3, minmax(0, 1fr));
 gap: 14px;
 margin-top: 34px;
 }

 .cth-outcome-grid article {
 border-radius: 22px;
 border: 1px solid ${C.border};
 background: #f2e9e5;
 padding: 18px;
 box-shadow: 0 12px 30px rgba(20,15,43,0.05);
 }

 .cth-outcome-grid article span {
 color: ${C.accent};
 font-weight: 950;
 display: block;
 margin-bottom: 10px;
 }

 .cth-outcome-grid article strong {
 color: ${C.ink};
 font-size: 14px;
 line-height: 1.35;
 }

 .cth-content-card {
 margin-top: 28px;
 border-radius: 24px;
 border: 1px solid ${C.border};
 background: #ffffff;
 padding: 22px;
 box-shadow: 0 16px 42px rgba(20,15,43,0.06);
 }

 .cth-content-card p {
 margin: 0 0 7px;
 color: ${C.accent};
 font-size: 12px;
 font-weight: 950;
 letter-spacing: 0.14em;
 text-transform: uppercase;
 }

 .cth-content-card h3 {
 margin: 0;
 color: ${C.ink};
 font-size: 22px;
 font-weight: 950;
 }

 .cth-content-card span {
 display: block;
 margin-top: 8px;
 color: ${C.ruby};
 line-height: 1.55;
 font-weight: 650;
 }

 .cth-onboarding-actions {
 display: flex;
 flex-wrap: wrap;
 gap: 12px;
 align-items: center;
 margin-top: 30px;
 }

 .cth-onboarding-actions button {
 min-height: 48px;
 border-radius: 999px;
 padding: 0 22px;
 font-weight: 950;
 cursor: pointer;
 transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
 }

 .cth-onboarding-actions button:hover:not(:disabled) {
 transform: translateY(-2px);
 }

 .cth-primary-action {
 border: none;
 background: ${C.accent};
 color: #fff;
 box-shadow: 0 18px 40px rgba(224,78,53,0.22);
 }

 .cth-secondary-action {
 border: 1px solid ${C.border};
 background: ${C.panel};
 color: ${C.ink};
 }

 .cth-secondary-action:disabled {
 opacity: 0.45;
 cursor: not-allowed;
 }

 @media (max-width: 980px) {
 .cth-onboarding3-page {
 align-items: flex-start;
 padding: 14px;
 }

 .cth-onboarding3-shell {
 width: 100%;
 min-height: auto;
 max-height: none;
 grid-template-columns: 1fr;
 border-radius: 26px;
 }

 .cth-onboarding-sidebar {
 padding: 24px;
 }

 .cth-onboarding-content {
 padding: 34px 24px;
 }

 .cth-outcome-grid {
 grid-template-columns: 1fr;
 }
 }
 `}</style>
 </main>
 );
}
