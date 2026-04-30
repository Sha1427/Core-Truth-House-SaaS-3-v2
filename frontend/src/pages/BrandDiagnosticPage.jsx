import React, { useMemo, useState } from "react";
import {
 ArrowRight,
 CheckCircle2,
 Lock,
 ShieldCheck,
 Sparkles,
 Target,
 X,
} from "lucide-react";

const A = {
 logo: "/brand-assets/logo/cth-logo-seal.png",
 heroFrame: "/brand-diagnostic-assets/cth-brand-diagnostic-hero-architectural-frame.png",
 ctaBuilding: "/brand-diagnostic-assets/cth-brand-diagnostic-cta-building-line-art.webp",
 positioning: "/brand-diagnostic-assets/cth-brand-diagnostic-positioning-icon.png",
 messaging: "/brand-diagnostic-assets/cth-brand-diagnostic-messaging-icon.png",
 offer: "/brand-diagnostic-assets/cth-brand-diagnostic-offer-clarity-icon.png",
 audience: "/brand-diagnostic-assets/cth-brand-diagnostic-audience-fit-icon.png",
 visual: "/brand-diagnostic-assets/cth-brand-diagnostic-visual-identity-icon.png",
 conversion: "/brand-diagnostic-assets/cth-brand-diagnostic-conversion-path-icon.png",
 content: "/brand-diagnostic-assets/cth-brand-diagnostic-content-consistency-icon.png",
 trust: "/brand-diagnostic-assets/cth-brand-diagnostic-brand-trust-icon.png",
 foundation: "/brand-diagnostic-assets/cth-brand-diagnostic-foundation-column-icon.png",
 strategic: "/brand-diagnostic-assets/cth-brand-diagnostic-strategic-os-compass-icon.png",
 structure: "/brand-diagnostic-assets/cth-brand-diagnostic-structure-temple-icon.png",
 execution: "/brand-diagnostic-assets/cth-brand-diagnostic-execution-rocket-icon.png",
};

const API_BASE = (
 import.meta.env.VITE_API_BASE_URL ||
 import.meta.env.VITE_API_URL ||
 "https://api.coretruthhouse.com"
).replace(/\/$/, "");

const initialLeadInfo = {
 first_name: "",
 last_name: "",
 email: "",
 business_name: "",
 years_in_business: "",
 revenue_band: "",
 current_challenge: "",
 consent: true,
};

const yearsOptions = ["Less than 1 year", "1 to 2 years", "3 to 5 years", "6 to 10 years", "10+ years"];
const revenueOptions = ["Pre-revenue", "Under $2k monthly", "$2k to $5k monthly", "$5k to $10k monthly", "$10k to $25k monthly", "$25k+ monthly"];
const challengeOptions = [
 "I am visible but not converting",
 "My messaging feels inconsistent",
 "My offer is not clear enough",
 "My content is not leading to sales",
 "My brand depends too much on me",
 "I need a stronger operating system",
];

const answerOptions = [
 { label: "Not yet", value: 1 },
 { label: "Somewhat", value: 2 },
 { label: "Mostly", value: 3 },
 { label: "Yes", value: 4 },
];

const questions = [
 ["core_truth_1", "Core Truth Clarity", "Core Truth Clarity", "When someone asks what you do, do you have one clean sentence that names the specific problem you solve and the specific person you solve it for?", A.foundation],
 ["core_truth_2", "Brand Independence", "Core Truth Clarity", "If someone saw your brand without your face, name, or personal story attached, would it still feel recognizable as yours?", A.trust],
 ["core_truth_3", "Brand Beliefs", "Core Truth Clarity", "Can you name the three core beliefs that separate you from every other person doing what you do?", A.positioning],
 ["messaging_1", "Message Consistency", "Messaging Coherence", "Across your website, most recent content, and a sales conversation, does your brand sound like the same person?", A.messaging],
 ["messaging_2", "Voice Framework", "Messaging Coherence", "When you create content, are you following a documented voice framework, or are you guessing based on mood?", A.content],
 ["messaging_3", "Delegatable Voice", "Messaging Coherence", "Could you hand your messaging guidelines to a contractor or assistant and have them create content that still sounds like your brand?", A.messaging],
 ["conversion_1", "Homepage Clarity", "Conversion Architecture", "When a stranger lands on your homepage, can they answer what this is, who it is for, and what to do next within five seconds?", A.conversion],
 ["conversion_2", "Buyer Path", "Conversion Architecture", "Is there a documented path from stranger to buyer, or does conversion depend on you personally showing up for every sale?", A.structure],
 ["conversion_3", "Lost Prospect Insight", "Conversion Architecture", "Do you know specifically why your last few prospects did not buy, or are you guessing?", A.conversion],
 ["audience_1", "Buyer Language", "Audience Resonance", "When you describe your ideal client's biggest frustration, do you use their words or your industry's words?", A.audience],
 ["audience_2", "Language Feedback Loop", "Audience Resonance", "When was the last time something a prospect or client said actually changed a piece of your messaging?", A.audience],
 ["audience_3", "Belief Shift", "Audience Resonance", "Do you know the specific belief your buyer has to shift before they say yes?", A.strategic],
 ["operations_1", "Brand Continuity", "Operational Discipline", "If you took 30 days off starting tomorrow, would your brand keep building authority and trust, or would it go quiet?", A.execution],
 ["operations_2", "Brand Operations System", "Operational Discipline", "Do you have a documented brand operations system, or do you rebuild your decisions every time you create content?", A.structure],
 ["operations_3", "Brand Health Metrics", "Operational Discipline", "Can you measure whether your brand is healthier this month than it was last month, or is it mostly a feeling?", A.trust],
];

const dimensions = [
 ["Positioning", 68, "Your position is unclear in the market.", A.positioning],
 ["Messaging", 64, "Core message lacks clarity and distinction.", A.messaging],
 ["Offer Clarity", 78, "Offer is strong but not clearly communicated.", A.offer],
 ["Audience Fit", 74, "You know your audience, but not their intent.", A.audience],
 ["Visual Identity", 81, "Visuals are cohesive but not fully differentiated.", A.visual],
 ["Conversion Path", 59, "Journey has friction and unclear next steps.", A.conversion],
 ["Content Consistency", 69, "Inconsistent across channels and touchpoints.", A.content],
 ["Brand Trust", 76, "Trust signals are present but under-leveraged.", A.trust],
];

const afterScore = [
 ["Foundation", "Establish your truth, purpose, and strategic positioning.", A.foundation],
 ["Strategic OS", "Build the operating system that aligns your brand.", A.strategic],
 ["Structure", "Design the systems, offers, and experiences.", A.structure],
 ["Execution", "Launch with confidence and measure what matters.", A.execution],
];

const dimensionQuestionMap = [
 {
 name: "Positioning",
 ids: ["core_truth_1", "core_truth_2", "core_truth_3"],
 icon: A.positioning,
 strong: "Your position is distinct enough to build from.",
 weak: "Your position needs clearer ownership in the market.",
 },
 {
 name: "Messaging",
 ids: ["messaging_1", "messaging_2", "messaging_3"],
 icon: A.messaging,
 strong: "Your voice and message have real consistency.",
 weak: "Your message is shifting too much across touchpoints.",
 },
 {
 name: "Offer Clarity",
 ids: ["conversion_1", "conversion_2", "conversion_3"],
 icon: A.offer,
 strong: "Your offer path is clear enough to support action.",
 weak: "Your offer and next-step path need sharper structure.",
 },
 {
 name: "Audience Fit",
 ids: ["audience_1", "audience_2", "audience_3"],
 icon: A.audience,
 strong: "Your audience language is close to buyer reality.",
 weak: "Your message needs to mirror the buyer more directly.",
 },
 {
 name: "Visual Identity",
 ids: ["core_truth_2", "messaging_1", "operations_3"],
 icon: A.visual,
 strong: "Your brand signals feel cohesive and recognizable.",
 weak: "Your visual trust signals need stronger alignment.",
 },
 {
 name: "Conversion Path",
 ids: ["conversion_1", "conversion_2", "conversion_3"],
 icon: A.conversion,
 strong: "Your brand has a clearer route from attention to action.",
 weak: "Your buyer path has friction and unclear next steps.",
 },
 {
 name: "Content Consistency",
 ids: ["messaging_2", "messaging_3", "operations_2"],
 icon: A.content,
 strong: "Your content can be repeated without rebuilding the brand.",
 weak: "Your content system depends too much on guessing.",
 },
 {
 name: "Brand Trust",
 ids: ["operations_1", "operations_2", "operations_3"],
 icon: A.trust,
 strong: "Your brand has stronger operational trust signals.",
 weak: "Your trust signals are present but not systemized.",
 },
];

function buildLiveDimensions(answers) {
 const hasAnswers = Object.keys(answers || {}).length > 0;

 if (!hasAnswers) {
 return dimensions;
 }

 return dimensionQuestionMap.map((item) => {
 const total = item.ids.reduce((sum, id) => sum + Number(answers[id] || 0), 0);
 const score = Math.round((total / (item.ids.length * 4)) * 100);
 const text = score >= 75 ? item.strong : item.weak;
 return [item.name, score, text, item.icon];
 });
}

function getSeverity(score) {
 if (score < 50) return "Critical";
 if (score < 68) return "High";
 if (score < 78) return "Moderate";
 return "Low";
}

function getLiveDimensionScore(liveDimensions, targetName) {
 const found = (liveDimensions || []).find(([name]) => name === targetName);
 return Number(found?.[1] ?? 60);
}

function buildRadarPolygon(liveDimensions) {
 const centerX = 50;
 const centerY = 50;

 const axes = [
 ["Brand Trust", [50, 6]],
 ["Messaging", [90, 34]],
 ["Offer Clarity", [75, 86]],
 ["Audience Fit", [25, 86]],
 ["Content Consistency", [10, 34]],
 ];

 const points = axes.map(([name, [targetX, targetY]]) => {
 const score = Math.max(0, Math.min(100, getLiveDimensionScore(liveDimensions, name)));
 const factor = score / 100;

 const x = centerX + (targetX - centerX) * factor;
 const y = centerY + (targetY - centerY) * factor;

 return `${x.toFixed(1)}% ${y.toFixed(1)}%`;
 });

 return `polygon(${points.join(", ")})`;
}

function getRecommendation(score) {
 if (score <= 29) {
 return {
 tier: "Foundation",
 range: "15 to 29",
 cta: "Start Foundation",
 line: "Your brand needs documented core truth, buyer clarity, beliefs, and voice before more content can convert.",
 next: "/sign-up?redirect_url=%2Fbrand-foundation",
 };
 }

 if (score <= 42) {
 return {
 tier: "Structure",
 range: "30 to 42",
 cta: "Build My Structure",
 line: "You have pieces, but not architecture. The next move is structure across content, offers, and conversion.",
 next: "/sign-up?redirect_url=%2Fstructure",
 };
 }

 if (score <= 52) {
 return {
 tier: "House",
 range: "43 to 52",
 cta: "Enter the House",
 line: "You have a real brand. The next move is integration across identity, offers, content, and launch planning.",
 next: "/sign-up?redirect_url=%2Fidentity-studio",
 };
 }

 return {
 tier: "Estate",
 range: "53 to 60",
 cta: "Apply for Estate",
 line: "You are ready for refinement and scale. The risk is no longer clarity. The risk is dilution.",
 next: "/contact?interest=estate",
 };
}

function Header({ onStart }) {
 return (
 <header className="bdx-header">
 <div className="bdx-crumbs">
 <span>Brand Audit</span>
 <b>›</b>
 <strong>Brand Diagnostic</strong>
 </div>

 <div className="bdx-actions">
 <a className="bdx-brand-mini" href="/">
 <img src={A.logo} alt="" />
 Core Truth House
 </a>
 <a href="/demo-mode" className="bdx-mode">Diagnostic Mode</a>
 <button type="button" onClick={onStart} className="bdx-mode primary">Start</button>
 </div>
 </header>
 );
}

function ScoreRing({ score = 72, total = 100 }) {
 return (
 <div className="bdx-ring">
 <div>
 <strong>{score}</strong>
 <span>/{total}</span>
 </div>
 </div>
 );
}

function ModalDiagnostic({ open, onClose, onComplete }) {
 const [step, setStep] = useState("lead");
 const [currentQuestion, setCurrentQuestion] = useState(0);
 const [leadInfo, setLeadInfo] = useState(initialLeadInfo);
 const [answers, setAnswers] = useState({});
 const [leadSubmitting, setLeadSubmitting] = useState(false);
 const [leadError, setLeadError] = useState("");
 const [resultSaved, setResultSaved] = useState(false);

 const answeredCount = Object.keys(answers).length;
 const isComplete = answeredCount === questions.length;

 const score = useMemo(() => {
 if (!isComplete) return null;
 return questions.reduce((total, [id]) => total + Number(answers[id] || 0), 0);
 }, [answers, isComplete]);

 const recommendation = score ? getRecommendation(score) : null;

 const topGaps = useMemo(() => {
 if (!isComplete) return [];
 return [...questions]
 .sort(([a], [b]) => Number(answers[a] || 0) - Number(answers[b] || 0))
 .slice(0, 3);
 }, [answers, isComplete]);

 const leadReady =
 leadInfo.first_name.trim() &&
 leadInfo.email.trim() &&
 leadInfo.years_in_business &&
 leadInfo.revenue_band &&
 leadInfo.current_challenge &&
 leadInfo.consent;

 if (!open) return null;

 function updateLead(field, value) {
 setLeadInfo((current) => ({ ...current, [field]: value }));
 }

 function buildPayload(status = "started") {
 return {
 first_name: leadInfo.first_name.trim(),
 last_name: leadInfo.last_name.trim(),
 email: leadInfo.email.trim(),
 business_name: leadInfo.business_name.trim(),
 years_in_business: leadInfo.years_in_business,
 revenue_band: leadInfo.revenue_band,
 current_challenge: leadInfo.current_challenge,
 score: score ?? undefined,
 score_range: recommendation?.range || "",
 recommended_tier: recommendation?.tier || "",
 top_gaps: topGaps.map((item) => item[2] || item[1]),
 answers,
 status,
 consent: Boolean(leadInfo.consent),
 source: "brand_diagnostic",
 };
 }

 async function submitLead(status = "started") {
 setLeadSubmitting(true);
 setLeadError("");

 try {
 const response = await fetch(`${API_BASE}/api/public/brand-diagnostic-leads`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(buildPayload(status)),
 });

 const data = await response.json().catch(() => ({}));
 if (!response.ok) throw new Error(data?.detail || data?.message || "Lead submission failed.");

 if (status === "completed") setResultSaved(true);
 return data;
 } catch (error) {
 setLeadError(error?.message || "Something went wrong. Please try again.");
 throw error;
 } finally {
 setLeadSubmitting(false);
 }
 }

 async function startQuiz(event) {
 event.preventDefault();
 if (!leadReady || leadSubmitting) return;
 await submitLead("started");
 setStep("quiz");
 }

 function answerCurrent(value) {
 const [id] = questions[currentQuestion];
 const updated = { ...answers, [id]: value };
 setAnswers(updated);

 if (currentQuestion < questions.length - 1) {
 setCurrentQuestion((current) => current + 1);
 } else {
 setStep("result");
 }
 }

 async function saveResult() {
 await submitLead("completed");
 onComplete?.({
 score,
 recommendation,
 topGaps,
 answers,
 });
 }

 const active = questions[currentQuestion];

 return (
 <div className="bdx-modal-wrap" role="dialog" aria-modal="true">
 <div className="bdx-modal-backdrop" onClick={onClose} />
 <section className="bdx-modal">
 <button type="button" className="bdx-modal-close" onClick={onClose} aria-label="Close diagnostic">
 <X size={18} />
 </button>

 {step === "lead" ? (
 <form onSubmit={startQuiz}>
 <p className="bdx-kicker">Core Truth Brand Diagnostic</p>
 <h2>Where should we send your result?</h2>
 <p className="bdx-modal-copy">
 Your context is captured before the diagnostic. If you do not convert today, this stays in the Core Truth House CRM, not a tenant workspace.
 </p>

 <div className="bdx-lead-grid">
 <label>First name *<input value={leadInfo.first_name} onChange={(e) => updateLead("first_name", e.target.value)} required /></label>
 <label>Last name<input value={leadInfo.last_name} onChange={(e) => updateLead("last_name", e.target.value)} /></label>
 <label>Email *<input type="email" value={leadInfo.email} onChange={(e) => updateLead("email", e.target.value)} required /></label>
 <label>Business name<input value={leadInfo.business_name} onChange={(e) => updateLead("business_name", e.target.value)} /></label>
 <label>Years in business *
 <select value={leadInfo.years_in_business} onChange={(e) => updateLead("years_in_business", e.target.value)} required>
 <option value="">Choose one</option>
 {yearsOptions.map((item) => <option value={item} key={item}>{item}</option>)}
 </select>
 </label>
 <label>Revenue band *
 <select value={leadInfo.revenue_band} onChange={(e) => updateLead("revenue_band", e.target.value)} required>
 <option value="">Choose one</option>
 {revenueOptions.map((item) => <option value={item} key={item}>{item}</option>)}
 </select>
 </label>
 <label className="full">Current challenge *
 <select value={leadInfo.current_challenge} onChange={(e) => updateLead("current_challenge", e.target.value)} required>
 <option value="">Choose one</option>
 {challengeOptions.map((item) => <option value={item} key={item}>{item}</option>)}
 </select>
 </label>
 </div>

 <label className="bdx-consent">
 <input type="checkbox" checked={leadInfo.consent} onChange={(e) => updateLead("consent", e.target.checked)} />
 I agree to receive my diagnostic result and follow-up guidance from Core Truth House.
 </label>

 {leadError ? <p className="bdx-error">{leadError}</p> : null}

 <button type="submit" className="bdx-primary-btn" disabled={!leadReady || leadSubmitting}>
 {leadSubmitting ? "Saving..." : "Start My Diagnostic"}
 <ArrowRight size={15} />
 </button>
 </form>
 ) : null}

 {step === "quiz" ? (
 <div>
 <p className="bdx-kicker">Question {currentQuestion + 1} of {questions.length}</p>
 <p className="bdx-assessment-note">Answer all 15 questions. Each response updates the final score.</p> <div className="bdx-modal-progress">
 <span style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
 </div>

 <article className="bdx-question-panel">
 <img src={active[4]} alt="" />
 <small>{active[2]}</small>
 <h2>{active[1]}</h2>
 <p>{active[3]}</p>
 </article>

 <div className="bdx-answer-grid">
 {answerOptions.map((option) => (
 <button type="button" key={option.label} onClick={() => answerCurrent(option.value)}>
 {option.label}
 </button>
 ))}
 </div>
 </div>
 ) : null}

 {step === "result" && recommendation ? (
 <div>
 <p className="bdx-kicker">Step 03 · Your Result</p>
 <div className="bdx-result-top">
 <ScoreRing score={score} total={60} />
 <div>
 <h2>{recommendation.tier}</h2>
 <p>{recommendation.line}</p>
 <small>Score range: {recommendation.range}</small>
 </div>
 </div>

 <div className="bdx-result-gaps">
 <p>Top gaps to address first</p>
 {topGaps.map(([id, label, category, , icon]) => (
 <span key={id}>
 <img src={icon} alt="" />
 {category || label}
 </span>
 ))}
 </div>

 {leadError ? <p className="bdx-error">{leadError}</p> : null}

 <div className="bdx-result-actions">
 <button type="button" onClick={saveResult} disabled={leadSubmitting || resultSaved}>
 {leadSubmitting ? "Saving answers..." : resultSaved ? "Answers Saved" : "Save My Answers"}
 <Lock size={15} />
 </button>

 {resultSaved ? (
 <a href={recommendation.next}>
 {recommendation.cta}
 <ArrowRight size={15} />
 </a>
 ) : (
 <p className="bdx-save-note">
 Save your answers to unlock the recommended next step.
 </p>
 )}

 <button type="button" className="light" onClick={() => { setStep("quiz"); setAnswers({}); setCurrentQuestion(0); setResultSaved(false); }}>
 Retake Diagnostic
 </button>
 </div>
 </div>
 ) : null}
 </section>
 </div>
 );
}

export default function BrandDiagnosticPage() {
 const [diagnosticOpen, setDiagnosticOpen] = useState(false);
 const [resultSnapshot, setResultSnapshot] = useState(null);

 const liveDimensions = useMemo(
 () => buildLiveDimensions(resultSnapshot?.answers || {}),
 [resultSnapshot]
 );

 const displayScore = resultSnapshot?.score ?? 72;
 const displayTotal = resultSnapshot?.score ? 60 : 100;
 const displayTier = resultSnapshot?.recommendation?.tier || "Brand Readiness";
 const displaySummary =
 resultSnapshot?.recommendation?.line ||
 "Your brand has strong potential, but structure and message clarity are reducing conversion.";

 const severityRows = useMemo(() => {
 return [...liveDimensions]
 .sort((a, b) => a[1] - b[1])
 .slice(0, 6)
 .map(([name, score]) => [name, getSeverity(score)]);
 }, [liveDimensions]);

 const overallAverage = Math.round(
 liveDimensions.reduce((sum, item) => sum + Number(item[1] || 0), 0) / liveDimensions.length
 );

 const radarPolygon = useMemo(
 () => buildRadarPolygon(liveDimensions),
 [liveDimensions]
 );

 const pathwaySteps = resultSnapshot
 ? [
 ["✓", "Discover", "complete"],
 ["✓", "Diagnose", "complete"],
 ["✓", "Score", "complete"],
 ["✓", resultSnapshot.recommendation?.tier || "Recommend", "complete"],
 ["→", "Build", "active"],
 ]
 : [
 ["1", "Discover", ""],
 ["2", "Diagnose", ""],
 ["3", "Score", "active"],
 ["4", "Recommend", ""],
 ["5", "Build", ""],
 ];

 return (
 <main className="bdx-page">
 <Header onStart={() => setDiagnosticOpen(true)} />

 <section className="bdx-wrap">
 <div className="bdx-hero">
 <div className="bdx-title">
 <h1>Brand Diagnostic</h1>
 <p>Find the disconnect. Name the truth. Clarify the next move.</p>

 <div className="bdx-hero-buttons">
 <button type="button" onClick={() => setDiagnosticOpen(true)} className="bdx-primary-btn">
 Start the Brand Diagnostic
 <ArrowRight size={16} />
 </button>
 <button
 type="button"
 onClick={() => {
 const target = document.getElementById("score-explainer");
 if (target) {
 target.scrollIntoView({ behavior: "smooth", block: "center" });
 }
 }}
 className="bdx-secondary-btn"
 >
 How the Score Works
 </button>
 </div>
 </div>

 <div className="bdx-score-panel">
 <div>
 <p className="bdx-kicker">Brand Readiness Score</p>
 <ScoreRing score={displayScore} total={displayTotal} />
 </div>

 <div>
 <h2>{displaySummary}</h2>
 <button type="button" onClick={() => setDiagnosticOpen(true)}>Take the full diagnostic <ArrowRight size={13} /></button>
 </div>

 <div className="bdx-pathway">
 {pathwaySteps.map(([n, label, state]) => (
 <article className={state} key={`${n}-${label}`}>
 <span>{n}</span>
 <strong>{label}</strong>
 </article>
 ))}
 </div>

 <img src={A.heroFrame} alt="" className="bdx-score-art" />
 </div>
 </div>

 <div className="bdx-grid">
 <section className="bdx-card bdx-dimensions">
 <div className="bdx-card-head">
 <h2>Diagnostic Dimensions</h2>
 <p>Overall Average <strong>{overallAverage}/{resultSnapshot?.score ? "100" : "100"}</strong></p>
 </div>
 <div className="bdx-dim-grid">
 {liveDimensions.map(([name, score, text, icon]) => (
 <article key={name}>
 <img src={icon} alt="" />
 <h3>{name}</h3>
 <strong>{score}<span>/100</span></strong>
 <i><b style={{ width: `${score}%` }} /></i>
 <p>{text}</p>
 </article>
 ))}
 </div>
 </section>

 <section className="bdx-card bdx-gap" id="score-explainer">
 <div className="bdx-card-head">
 <h2>Structural Gap Map</h2>
 <p>{resultSnapshot ? "Live Result" : "Preview Mode"}</p>
 </div>

 <div className="bdx-score-explainer">
 <div>
 <p className="bdx-kicker">How the score works</p>
 <h3>{displayTier}</h3>
 <span>
 The diagnostic scores 15 questions across five categories. Lower scores reveal the areas creating the most friction in trust, clarity, and conversion.
 </span>
 </div>
 <strong>{resultSnapshot ? `${resultSnapshot.score}/60` : "72/100"}</strong>
 </div>

 <div className="bdx-radar-shell">
 <div className="bdx-radar">
 <span style={{ clipPath: radarPolygon }} />
 <em>Trust</em>
 <em>Message</em>
 <em>Offer</em>
 <em>Audience</em>
 <em>Content</em>
 </div>
 <div className="bdx-severity">
 {severityRows.map(([name, level]) => (
 <p key={name} className={level.toLowerCase()}><i />{name}<strong>{level}</strong></p>
 ))}
 </div>
 </div>
 </section>

 <aside className="bdx-card bdx-next">
 <div className="bdx-next-head">
 <Sparkles size={22} />
 <h2>Next Best Move</h2>
 </div>

 {[
 ["Clarify Positioning", "Define a distinct, ownable position in your market.", A.positioning],
 ["Strengthen Offer Hierarchy", "Lead with your core offer.", A.structure],
 ["Align Messaging", "Speak to what your audience actually cares about.", A.audience],
 ].map(([title, text, icon], index) => (
 <article key={title}>
 <span>{index + 1}</span>
 <img src={icon} alt="" />
 <div>
 <h3>{title}</h3>
 <p>{text}</p>
 </div>
 </article>
 ))}

 <button type="button" onClick={() => setDiagnosticOpen(true)} className="bdx-outline-btn">
 View Full Recommendation
 <ArrowRight size={14} />
 </button>
 </aside>
 </div>

 <div className="bdx-bottom">
 <section className="bdx-card bdx-after">
 <p>What Happens After the Score</p>
 <div>
 {afterScore.map(([title, text, icon], index) => (
 <article key={title}>
 <span>{index + 1}</span>
 <img src={icon} alt="" />
 <h3>{title}</h3>
 <small>{text}</small>
 </article>
 ))}
 </div>
 </section>

 <section className="bdx-impact">
 <img src={A.ctaBuilding} alt="" />
 <p>Your Next Step</p>
 <h2>Turn Insight Into Impact</h2>
 <span>You’ve identified the gaps. Now let’s close them with a clear plan and expert guidance.</span>
 <button type="button" onClick={() => setDiagnosticOpen(true)}>Start the Diagnostic <ArrowRight size={14} /></button>

 <small><ShieldCheck size={14} /> Trusted by founders and teams worldwide.</small>
 </section>
 </div>
 </section>

 <footer className="bdx-footer">
 <span>© 2026 Core Truth House. All rights reserved.</span>
 <img src={A.logo} alt="" />
 <div>
 <a href="/privacy">Privacy Policy</a>
 <a href="/terms">Terms of Service</a>
 </div>
 </footer>

 <ModalDiagnostic
 open={diagnosticOpen}
 onClose={() => setDiagnosticOpen(false)}
 onComplete={(snapshot) => {
 setResultSnapshot(snapshot);
 setDiagnosticOpen(false);
 }}
 />

 <style>{`
 .bdx-page {
 min-height: 100vh;
 background: linear-gradient(180deg, #fffaf6 0%, #f4ece6 100%);
 color: #2b1040;
 font-family: 'DM Sans', system-ui, sans-serif;
 }

 .bdx-page * { box-sizing: border-box; }

 .bdx-header {
 min-height: 64px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 gap: 18px;
 padding: 0 34px;
 border-bottom: 1px solid rgba(119,67,72,.2);
 background: rgba(255,249,244,.82);
 position: sticky;
 top: 0;
 z-index: 30;
 }

 .bdx-crumbs,
 .bdx-actions {
 display: flex;
 align-items: center;
 gap: 12px;
 }

 .bdx-crumbs {
 text-transform: uppercase;
 letter-spacing: .16em;
 color: rgba(43,16,64,.56);
 font-size: 11px;
 font-weight: 900;
 }

 .bdx-brand-mini {
 display: inline-flex;
 align-items: center;
 gap: 8px;
 color: #af0024;
 font-family: Georgia, serif;
 font-weight: 800;
 text-decoration: none;
 }

 .bdx-brand-mini img {
 width: 28px;
 height: 28px;
 }

 .bdx-mode {
 min-height: 36px;
 display: inline-flex;
 align-items: center;
 border: 1px solid rgba(119,67,72,.2);
 border-radius: 7px;
 background: rgba(255,255,255,.62);
 color: #2b1040;
 text-decoration: none;
 font-size: 12px;
 font-weight: 850;
 padding: 0 14px;
 }

 .bdx-mode.primary {
 border: 0;
 background: #d6a158;
 cursor: pointer;
 }

 .bdx-wrap {
 width: min(100% - 56px, 1620px);
 margin: 0 auto;
 padding: 30px 0 14px;
 }

 .bdx-hero {
 display: grid;
 grid-template-columns: 420px minmax(0, 1fr);
 gap: 34px;
 align-items: center;
 margin-bottom: 18px;
 }

 .bdx-title h1 {
 margin: 0;
 font-family: Georgia, serif;
 font-size: clamp(3.1rem, 5vw, 5.6rem);
 line-height: .9;
 letter-spacing: -.07em;
 }

 .bdx-title p {
 margin: 16px 0 0;
 font-family: Georgia, serif;
 font-size: 17px;
 color: rgba(43,16,64,.75);
 }

 .bdx-hero-buttons {
 display: flex;
 gap: 12px;
 flex-wrap: wrap;
 margin-top: 24px;
 }

 .bdx-primary-btn,
 .bdx-secondary-btn,
 .bdx-outline-btn,
 .bdx-result-actions a,
 .bdx-result-actions button,
 .bdx-impact button,
 .bdx-impact a {
 min-height: 42px;
 display: inline-flex;
 align-items: center;
 justify-content: center;
 gap: 9px;
 border-radius: 7px;
 padding: 0 18px;
 border: 0;
 cursor: pointer;
 text-decoration: none;
 font-size: 13px;
 font-weight: 900;
 }

 .bdx-primary-btn,
 .bdx-result-actions a,
 .bdx-result-actions button,
 .bdx-impact button {
 background: linear-gradient(135deg, #af0024, #e04e35);
 color: white;
 }

 .bdx-secondary-btn,
 .bdx-outline-btn,
 .bdx-result-actions .light {
 background: rgba(255,255,255,.68);
 border: 1px solid rgba(119,67,72,.24);
 color: #2b1040;
 }

 .bdx-score-panel,
 .bdx-card {
 border: 1px solid rgba(119,67,72,.26);
 border-radius: 10px;
 background: rgba(255,255,255,.56);
 box-shadow: 0 20px 50px rgba(43,16,64,.055);
 }

 .bdx-score-panel {
 position: relative;
 min-height: 230px;
 display: grid;
 grid-template-columns: 190px 330px minmax(350px, 1fr);
 align-items: center;
 gap: 26px;
 padding: 22px 26px;
 overflow: hidden;
 }

 .bdx-score-panel h2 {
 margin: 0;
 font-family: Georgia, serif;
 font-size: 26px;
 line-height: 1.12;
 letter-spacing: -.04em;
 }

 .bdx-score-panel button {
 margin-top: 16px;
 border: 0;
 background: transparent;
 color: #af0024;
 font-weight: 900;
 cursor: pointer;
 }

 .bdx-score-art {
 position: absolute;
 right: 8px;
 bottom: -8px;
 width: 175px;
 opacity: .18;
 }

 .bdx-kicker {
 margin: 0 0 10px;
 color: rgba(43,16,64,.70);
 text-transform: uppercase;
 letter-spacing: .16em;
 font-size: 10px;
 font-weight: 950;
 }

 .bdx-ring {
 position: relative;
 width: 150px;
 height: 150px;
 border-radius: 50%;
 display: grid;
 place-items: center;
 background:
 radial-gradient(circle, #fffaf6 0 54%, transparent 56%),
 conic-gradient(#af0024 0 72%, #c4a95b 72% 86%, rgba(119,67,72,.14) 86% 100%);
 }

 .bdx-ring div {
 width: 116px;
 height: 116px;
 border-radius: 50%;
 display: grid;
 place-content: center;
 text-align: center;
 background: #fffaf6;
 }

 .bdx-ring strong {
 font-family: Georgia, serif;
 font-size: 48px;
 line-height: .9;
 font-weight: 500;
 }

 .bdx-ring span {
 color: rgba(43,16,64,.58);
 font-size: 14px;
 }

 .bdx-pathway {
 display: flex;
 justify-content: center;
 gap: 12px;
 position: relative;
 z-index: 2;
 }

 .bdx-pathway article {
 width: 65px;
 display: grid;
 justify-items: center;
 gap: 6px;
 text-align: center;
 }

 .bdx-pathway span {
 width: 38px;
 height: 38px;
 display: grid;
 place-items: center;
 border-radius: 50%;
 border: 1px solid rgba(119,67,72,.3);
 background: white;
 font-family: Georgia, serif;
 }

 .bdx-pathway .active span {
 background: #d7a04b;
 color: white;
 border-color: #d7a04b;
 }

 .bdx-pathway .complete span {
 background: #af0024;
 color: white;
 border-color: #af0024;
 }

 .bdx-pathway .complete strong {
 color: #af0024;
 }

 .bdx-pathway strong {
 font-family: Georgia, serif;
 font-size: 12px;
 }

 .bdx-grid {
 display: grid;
 grid-template-columns: minmax(520px, .42fr) minmax(520px, .38fr) minmax(310px, .20fr);
 gap: 16px;
 }

 .bdx-card-head {
 min-height: 54px;
 display: flex;
 align-items: center;
 justify-content: space-between;
 padding: 16px 16px 4px;
 }

 .bdx-card-head h2,
 .bdx-next-head h2 {
 margin: 0;
 color: rgba(43,16,64,.70);
 text-transform: uppercase;
 letter-spacing: .15em;
 font-size: 11px;
 font-weight: 950;
 }

 .bdx-card-head p {
 margin: 0;
 font-family: Georgia, serif;
 font-size: 12px;
 color: rgba(43,16,64,.62);
 }

 .bdx-card-head strong {
 border: 1px solid rgba(196,169,91,.55);
 border-radius: 999px;
 color: #af0024;
 padding: 4px 9px;
 margin-left: 7px;
 }

 .bdx-dim-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 8px;
 padding: 10px 14px 16px;
 }

 .bdx-dim-grid article {
 min-height: 154px;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 8px;
 background: rgba(255,249,244,.64);
 padding: 14px;
 }

 .bdx-dim-grid img {
 width: 26px;
 height: 26px;
 object-fit: contain;
 margin-bottom: 9px;
 }

 .bdx-dim-grid h3 {
 display: inline;
 margin: 0;
 font-family: Georgia, serif;
 font-size: 14px;
 }

 .bdx-dim-grid strong {
 float: right;
 font-family: Georgia, serif;
 font-size: 18px;
 font-weight: 500;
 }

 .bdx-dim-grid span {
 font-size: 10px;
 color: rgba(43,16,64,.55);
 }

 .bdx-dim-grid i {
 clear: both;
 display: block;
 height: 5px;
 border-radius: 999px;
 background: rgba(119,67,72,.13);
 overflow: hidden;
 margin: 16px 0 10px;
 }

 .bdx-dim-grid b {
 display: block;
 height: 100%;
 background: linear-gradient(90deg, #af0024, #c4a95b);
 }

 .bdx-dim-grid p {
 margin: 0;
 text-align: center;
 color: rgba(43,16,64,.64);
 font-size: 11px;
 line-height: 1.35;
 }

 .bdx-score-explainer {
 display: grid;
 grid-template-columns: 1fr auto;
 gap: 18px;
 align-items: center;
 margin: 10px 16px 0;
 padding: 14px;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 10px;
 background: rgba(255,249,244,.62);
 }

 .bdx-score-explainer h3 {
 margin: 6px 0 6px;
 font-family: Georgia, serif;
 font-size: 24px;
 line-height: 1;
 }

 .bdx-score-explainer span {
 display: block;
 color: rgba(43,16,64,.66);
 font-size: 12px;
 line-height: 1.45;
 }

 .bdx-score-explainer strong {
 font-family: Georgia, serif;
 color: #af0024;
 font-size: 34px;
 font-weight: 500;
 white-space: nowrap;
 }

 .bdx-radar-shell {
 display: grid;
 grid-template-columns: minmax(270px, 1fr) 220px;
 gap: 12px;
 padding: 16px;
 }

 .bdx-radar {
 position: relative;
 height: 260px;
 display: grid;
 place-items: center;
 border-radius: 50%;
 background:
 radial-gradient(circle, rgba(175,0,36,.16) 0 34%, transparent 35%),
 repeating-conic-gradient(from 0deg, rgba(43,16,64,.12) 0 1deg, transparent 1deg 45deg),
 radial-gradient(circle, transparent 0 30%, rgba(119,67,72,.18) 31% 32%, transparent 33% 55%, rgba(119,67,72,.15) 56% 57%, transparent 58%);
 }

 .bdx-radar span {
 width: 150px;
 height: 150px;
 clip-path: polygon(50% 6%, 90% 34%, 75% 86%, 25% 86%, 10% 34%);
 background: rgba(175,0,36,.24);
 border: 2px solid #af0024;
 transition: clip-path .35s ease, transform .35s ease;
 }

 .bdx-radar em {
 position: absolute;
 font-style: normal;
 font-family: Georgia, serif;
 color: rgba(43,16,64,.72);
 font-size: 11px;
 }

 .bdx-radar em:nth-of-type(1) { top: 16px; left: 50%; transform: translateX(-50%); }
 .bdx-radar em:nth-of-type(2) { top: 72px; right: 14px; }
 .bdx-radar em:nth-of-type(3) { bottom: 34px; right: 38px; }
 .bdx-radar em:nth-of-type(4) { bottom: 34px; left: 34px; }
 .bdx-radar em:nth-of-type(5) { top: 72px; left: 14px; }

 .bdx-severity p {
 display: grid;
 grid-template-columns: 10px 1fr auto;
 gap: 8px;
 align-items: center;
 margin: 0;
 padding: 6px 0;
 font-family: Georgia, serif;
 font-size: 12px;
 color: rgba(43,16,64,.66);
 }

 .bdx-severity i {
 width: 7px;
 height: 7px;
 border-radius: 50%;
 background: #af0024;
 }

 .bdx-severity strong {
 color: #af0024;
 }

 .bdx-severity .critical strong { color: #9e0021; }
 .bdx-severity .high strong { color: #e04e35; }
 .bdx-severity .moderate strong { color: #c8872e; }
 .bdx-severity .low strong { color: #4f9466; }
 .bdx-severity .critical i { background: #9e0021; }
 .bdx-severity .high i { background: #e04e35; }
 .bdx-severity .moderate i { background: #c8872e; }
 .bdx-severity .low i { background: #4f9466; }

 .bdx-next {
 padding: 18px;
 }

 .bdx-next-head {
 display: flex;
 align-items: center;
 gap: 10px;
 margin-bottom: 16px;
 color: #d59a54;
 }

 .bdx-next article {
 min-height: 82px;
 display: grid;
 grid-template-columns: 30px 38px 1fr;
 align-items: center;
 gap: 10px;
 padding: 12px;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 8px;
 background: rgba(255,249,244,.64);
 margin-bottom: 10px;
 }

 .bdx-next article > span {
 width: 27px;
 height: 27px;
 display: grid;
 place-items: center;
 border: 1px solid rgba(196,169,91,.58);
 border-radius: 50%;
 color: #b5793f;
 font-family: Georgia, serif;
 }

 .bdx-next img {
 width: 30px;
 height: 30px;
 object-fit: contain;
 }

 .bdx-next h3 {
 margin: 0 0 4px;
 font-family: Georgia, serif;
 font-size: 15px;
 }

 .bdx-next p {
 margin: 0;
 color: rgba(43,16,64,.62);
 font-size: 11px;
 line-height: 1.35;
 }

 .bdx-outline-btn {
 width: 100%;
 margin-top: 2px;
 }

 .bdx-bottom {
 margin-top: 16px;
 display: grid;
 grid-template-columns: minmax(760px, .64fr) minmax(430px, .36fr);
 gap: 16px;
 }

 .bdx-after {
 padding: 14px 18px;
 }

 .bdx-after > p {
 margin: 0 0 12px;
 text-align: center;
 text-transform: uppercase;
 letter-spacing: .16em;
 color: rgba(43,16,64,.62);
 font-weight: 950;
 font-size: 11px;
 }

 .bdx-after > div {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 10px;
 }

 .bdx-after article {
 min-height: 138px;
 text-align: center;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 8px;
 background: rgba(255,249,244,.64);
 padding: 14px;
 }

 .bdx-after article > span {
 color: #b5793f;
 font-family: Georgia, serif;
 }

 .bdx-after img {
 width: 40px;
 height: 40px;
 object-fit: contain;
 margin: 6px auto;
 }

 .bdx-after h3 {
 margin: 0 0 5px;
 font-family: Georgia, serif;
 font-size: 15px;
 }

 .bdx-after small {
 color: rgba(43,16,64,.62);
 line-height: 1.35;
 }

 .bdx-impact {
 position: relative;
 min-height: 238px;
 overflow: hidden;
 border-radius: 9px;
 padding: 26px 30px;
 background: linear-gradient(135deg, #33033c, #0d0010);
 color: white;
 }

 .bdx-impact > img {
 position: absolute;
 right: -18px;
 bottom: -72px;
 width: 320px;
 opacity: .28;
 }

 .bdx-impact > *:not(img) {
 position: relative;
 z-index: 1;
 }

 .bdx-impact p {
 margin: 0;
 color: #d7a158;
 text-transform: uppercase;
 letter-spacing: .16em;
 font-size: 11px;
 font-weight: 950;
 }

 .bdx-impact h2 {
 margin: 10px 0 8px;
 font-family: Georgia, serif;
 font-size: 34px;
 line-height: .98;
 letter-spacing: -.05em;
 }

 .bdx-impact span {
 display: block;
 max-width: 420px;
 color: rgba(255,255,255,.74);
 font-size: 13px;
 line-height: 1.55;
 }

 .bdx-impact button,
 .bdx-impact a {
 width: min(100%, 330px);
 margin-top: 14px;
 }

 .bdx-impact a {
 color: #f6eee8;
 border: 1px solid rgba(196,169,91,.36);
 background: transparent;
 }

 .bdx-impact small {
 display: flex;
 align-items: center;
 gap: 8px;
 margin-top: 12px;
 color: rgba(255,255,255,.70);
 }

 .bdx-footer {
 min-height: 54px;
 width: min(100% - 56px, 1620px);
 margin: 0 auto;
 display: grid;
 grid-template-columns: 1fr auto 1fr;
 align-items: center;
 border-top: 1px solid rgba(119,67,72,.2);
 color: rgba(43,16,64,.58);
 font-size: 11px;
 }

 .bdx-footer img {
 width: 32px;
 opacity: .58;
 }

 .bdx-footer div {
 justify-self: end;
 display: flex;
 gap: 30px;
 }

 .bdx-footer a {
 color: rgba(43,16,64,.62);
 text-decoration: none;
 }

 .bdx-modal-wrap {
 position: fixed;
 inset: 0;
 z-index: 100;
 display: grid;
 place-items: center;
 padding: 22px;
 }

 .bdx-modal-backdrop {
 position: absolute;
 inset: 0;
 background: rgba(13,0,16,.54);
 backdrop-filter: blur(8px);
 }

 .bdx-modal {
 position: relative;
 z-index: 2;
 width: min(100%, 760px);
 max-height: min(88vh, 820px);
 overflow: auto;
 border: 1px solid rgba(216,197,195,.42);
 border-radius: 26px;
 background: #fffaf6;
 box-shadow: 0 40px 110px rgba(13,0,16,.34);
 padding: 28px;
 }

 .bdx-modal-close {
 position: absolute;
 right: 18px;
 top: 18px;
 width: 36px;
 height: 36px;
 display: grid;
 place-items: center;
 border-radius: 50%;
 border: 1px solid rgba(119,67,72,.2);
 background: rgba(255,255,255,.72);
 color: #2b1040;
 cursor: pointer;
 }

 .bdx-modal h2 {
 margin: 10px 0 0;
 font-family: Georgia, serif;
 font-size: clamp(2rem, 4vw, 3.4rem);
 line-height: .96;
 letter-spacing: -.05em;
 }

 .bdx-modal-copy {
 color: rgba(43,16,64,.68);
 line-height: 1.6;
 }

 .bdx-lead-grid {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 12px;
 margin-top: 20px;
 }

 .bdx-lead-grid label {
 display: grid;
 gap: 6px;
 color: rgba(43,16,64,.72);
 font-size: 12px;
 font-weight: 900;
 }

 .bdx-lead-grid .full {
 grid-column: 1 / -1;
 }

 .bdx-lead-grid input,
 .bdx-lead-grid select {
 min-height: 42px;
 border: 1px solid rgba(119,67,72,.22);
 border-radius: 10px;
 background: rgba(255,255,255,.75);
 padding: 0 12px;
 color: #2b1040;
 font: inherit;
 }

 .bdx-consent {
 display: flex;
 align-items: flex-start;
 gap: 9px;
 margin-top: 14px;
 color: rgba(43,16,64,.66);
 font-size: 13px;
 line-height: 1.4;
 }

 .bdx-primary-btn:disabled,
 .bdx-result-actions button:disabled {
 opacity: .55;
 cursor: not-allowed;
 }

 .bdx-error {
 margin: 14px 0 0;
 color: #af0024;
 background: rgba(175,0,36,.07);
 border: 1px solid rgba(175,0,36,.22);
 border-radius: 12px;
 padding: 10px;
 font-size: 13px;
 font-weight: 800;
 }

 .bdx-assessment-note {
 margin: 12px 0 0;
 color: rgba(43,16,64,.68);
 font-size: 13px;
 line-height: 1.45;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 12px;
 background: rgba(255,249,244,.66);
 padding: 10px 12px;
 }

 .bdx-modal-progress {
 height: 7px;
 border-radius: 999px;
 overflow: hidden;
 background: rgba(119,67,72,.14);
 margin: 18px 0;
 }

 .bdx-modal-progress span {
 display: block;
 height: 100%;
 background: linear-gradient(90deg, #af0024, #c4a95b);
 }

 .bdx-question-panel {
 border: 1px solid rgba(119,67,72,.22);
 border-radius: 22px;
 background: rgba(255,249,244,.62);
 padding: 22px;
 }

 .bdx-question-panel img {
 width: 46px;
 height: 46px;
 object-fit: contain;
 }

 .bdx-question-panel small {
 display: block;
 margin-top: 12px;
 color: #af0024;
 text-transform: uppercase;
 letter-spacing: .13em;
 font-weight: 950;
 }

 .bdx-question-panel p {
 color: rgba(43,16,64,.72);
 line-height: 1.6;
 }

 .bdx-answer-grid {
 display: grid;
 grid-template-columns: repeat(4, 1fr);
 gap: 10px;
 margin-top: 14px;
 }

 .bdx-answer-grid button {
 min-height: 42px;
 border: 1px solid rgba(119,67,72,.22);
 border-radius: 999px;
 background: rgba(255,255,255,.76);
 color: #2b1040;
 font-weight: 900;
 cursor: pointer;
 }

 .bdx-result-top {
 display: grid;
 grid-template-columns: 170px 1fr;
 gap: 24px;
 align-items: center;
 margin-top: 20px;
 }

 .bdx-result-top p {
 color: rgba(43,16,64,.68);
 line-height: 1.55;
 }

 .bdx-result-top small {
 color: rgba(43,16,64,.58);
 font-weight: 800;
 }

 .bdx-result-gaps {
 display: grid;
 gap: 8px;
 margin-top: 20px;
 }

 .bdx-result-gaps p {
 margin: 0;
 color: #af0024;
 text-transform: uppercase;
 letter-spacing: .13em;
 font-size: 11px;
 font-weight: 950;
 }

 .bdx-result-gaps span {
 display: flex;
 align-items: center;
 gap: 9px;
 border: 1px solid rgba(119,67,72,.2);
 border-radius: 12px;
 background: rgba(255,249,244,.64);
 padding: 9px 11px;
 font-weight: 850;
 }

 .bdx-result-gaps img {
 width: 26px;
 height: 26px;
 }

 .bdx-save-note {
 margin: 0;
 color: rgba(43,16,64,.66);
 font-size: 13px;
 line-height: 1.45;
 text-align: center;
 border: 1px solid rgba(119,67,72,.18);
 border-radius: 12px;
 padding: 10px 12px;
 background: rgba(255,249,244,.66);
 }

 .bdx-result-actions {
 display: grid;
 gap: 10px;
 margin-top: 20px;
 }

 .bdx-result-actions .light {
 background: rgba(255,255,255,.72);
 border: 1px solid rgba(119,67,72,.22);
 color: #2b1040;
 }

 @media (max-width: 1300px) {
 .bdx-hero,
 .bdx-grid,
 .bdx-bottom {
 grid-template-columns: 1fr;
 }

 .bdx-score-panel {
 grid-template-columns: 190px 1fr;
 }

 .bdx-pathway {
 grid-column: 1 / -1;
 }
 }

 @media (max-width: 720px) {
 .bdx-wrap,
 .bdx-footer {
 width: min(100% - 28px, 720px);
 }

 .bdx-header {
 align-items: flex-start;
 flex-direction: column;
 padding: 16px 20px;
 }

 .bdx-score-panel,
 .bdx-radar-shell,
 .bdx-result-top,
 .bdx-lead-grid {
 grid-template-columns: 1fr;
 }

 .bdx-dim-grid,
 .bdx-after > div,
 .bdx-answer-grid {
 grid-template-columns: 1fr 1fr;
 }

 .bdx-title h1 {
 font-size: 3.2rem;
 }
 }
 `}</style>
 </main>
 );
}
