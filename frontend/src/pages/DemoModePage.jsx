import React, { useState } from "react";
import {
 ArrowRight,
 CheckCircle2,
 Eye,
 FileText,
 Layers,
 Lock,
 PlayCircle,
 Sparkles,
 ShieldCheck,
 Target,
} from "lucide-react";
import DEMO_SEED_DATA from "../data/demoSeedData";
import { useDemoMode } from "../context/DemoModeContext";

const journey = [
 {
 title: "Diagnose",
 label: "Brand Audit",
 text: "See how the House identifies clarity gaps, weak positioning, and missing conversion structure.",
 route: "/brand-audit",
 previewTitle: "Sample Brand Audit",
 previewAction:
 "In a real workspace, this would run a brand diagnostic, calculate a Brand Score, identify structural gaps, and recommend the next best module.",
 previewResult:
 "Demo result: Apex Creative Co. shows strong visibility, but its offer structure and conversion clarity need refinement.",
 icon: Target,
 },
 {
 title: "Define",
 label: "Foundation",
 text: "Preview the source-of-truth layer that holds mission, promise, audience, positioning, and belief.",
 route: "/brand-foundation",
 previewTitle: "Sample Brand Foundation",
 previewAction:
 "In a real workspace, this would save the founder's core brand truth, positioning, promise, audience, belief, and signature language into Brand Memory.",
 previewResult:
 "Demo result: Apex Creative Co. has a strategy-first position and an 88% sample foundation completion.",
 icon: Layers,
 },
 {
 title: "Structure",
 label: "Systems Builder",
 text: "See how strategy becomes offers, SOPs, decision rules, and operating assets.",
 route: "/systems-builder",
 previewTitle: "Sample Structure Blueprint",
 previewAction:
 "In a real workspace, this would turn brand strategy into repeatable systems, offer architecture, SOPs, and decision rules.",
 previewResult:
 "Demo result: Apex Creative Co. would receive a suggested offer workflow, onboarding system, and client delivery structure.",
 icon: FileText,
 },
 {
 title: "Execute",
 label: "Content + Campaigns",
 text: "Preview how aligned content, email, campaigns, and tracking connect back to the brand.",
 route: "/content-studio",
 previewTitle: "Sample Execution Flow",
 previewAction:
 "In a real workspace, this would generate brand-aligned content, campaigns, email assets, and tracked links using the saved foundation.",
 previewResult:
 "Demo result: Apex Creative Co. shows three sample campaigns connected to its strategy-first message.",
 icon: Sparkles,
 },
];

const sampleCards = [
 {
 label: "Demo Brand",
 value: DEMO_SEED_DATA["brand-memory"]?.brand_name || "Apex Creative Co.",
 helper: "Seeded workspace only",
 },
 {
 label: "Foundation",
 value: `${DEMO_SEED_DATA["brand-foundation"]?.completion_pct || 88}%`,
 helper: "Sample completion",
 },
 {
 label: "Brand Score",
 value: `${DEMO_SEED_DATA["analytics-overview"]?.brandScore || 82}`,
 helper: "Preview score",
 },
 {
 label: "Campaigns",
 value: `${DEMO_SEED_DATA["analytics-overview"]?.campaignCount || 3}`,
 helper: "Sample activity",
 },
];

function DemoStat({ label, value, helper }) {
 return (
 <article className="cth-card rounded-[26px] p-5">
 <p className="cth-kicker m-0">{label}</p>
 <div className="mt-3 font-serif text-[2.4rem] font-semibold leading-none cth-heading">
 {value}
 </div>
 <p className="mt-2 text-sm cth-muted">{helper}</p>
 </article>
 );
}

function JourneyCard({ item, index, onPreview, isActive }) {
 const Icon = item.icon;

 return (
 <article
 className={`cth-card rounded-[28px] p-5 transition-all ${
 isActive ? "ring-2 ring-[rgba(196,169,91,0.42)]" : ""
 }`}
 >
 <div className="mb-5 flex items-start justify-between gap-4">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(196,169,91,0.34)] bg-[rgba(196,169,91,0.12)] text-[var(--cc-cinnabar)]">
 <Icon size={20} />
 </div>
 <span className="rounded-full border border-[rgba(196,169,91,0.32)] bg-[rgba(248,244,242,0.72)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] cth-muted">
 Step {index + 1}
 </span>
 </div>

 <p className="cth-kicker m-0">{item.title}</p>
 <h3 className="mt-2 text-xl font-semibold cth-heading">{item.label}</h3>
 <p className="mt-3 text-sm leading-6 cth-muted">{item.text}</p>

 <button
 type="button"
 onClick={() => onPreview(item)}
 className="cth-button-secondary mt-5 inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
 >
 Show preview behavior
 <ArrowRight size={15} />
 </button>
 </article>
 );
}

export default function DemoModePage() {
 const { isDemoMode } = useDemoMode();
 const [selectedPreview, setSelectedPreview] = useState(journey[0]);

 return (
 <main className="cth-page cth-module-page min-h-full px-4 py-5 md:px-7" data-testid="demo-mode-page">
 <section className="overflow-hidden rounded-[34px] border border-[rgba(196,169,91,0.30)] bg-[radial-gradient(circle_at_top_right,rgba(196,169,91,0.22),transparent_34%),linear-gradient(135deg,var(--cc-purple)_0%,var(--cc-night)_58%,var(--cc-crimson)_150%)] p-6 text-white shadow-[0_28px_70px_rgba(13,0,16,0.24)] md:p-8">
 <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
 <div>
 <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
 Preview-only workspace
 </p>
 <h1 className="m-0 max-w-4xl font-serif text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.045em] md:text-[4.5rem]">
 See how the House works before building your real workspace.
 </h1>
 <p className="mt-5 max-w-2xl text-base leading-7 text-white/72">
 Walk through a seeded Core Truth House workspace with sample brand data, guided modules, and preview-only actions. Nothing here changes your account, workspace, AI credits, or saved data.
 </p>

 <div className="mt-7 flex flex-wrap gap-3">
 <button
 type="button"
 onClick={() => setSelectedPreview(journey[0])}
 className="cth-button-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
 >
 Show sample audit behavior
 <ArrowRight size={16} />
 </button>
 <a href="/brand-diagnostic/" className="cth-button-secondary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
 Start the Brand Diagnostic
 </a>
 </div>
 </div>

 <div className="rounded-[28px] border border-white/10 bg-white/8 p-5">
 <div className="flex items-center gap-3">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
 <ShieldCheck size={22} className="text-[var(--cc-gold)]" />
 </div>
 <div>
 <div className="text-sm font-semibold">Demo safety rules</div>
 <div className="text-xs text-white/55">A sealed showroom for guided exploration</div>
 </div>
 </div>

 <div className="mt-5 grid gap-3">
 {[
 "No real saves",
 "No AI calls",
 "No account changes",
 "No workspace changes",
 ].map((rule) => (
 <div key={rule} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/72">
 <CheckCircle2 size={16} className="text-[var(--cc-gold)]" />
 {rule}
 </div>
 ))}
 </div>

 <div className="mt-5 rounded-2xl border border-white/10 bg-black/18 p-4 text-xs leading-6 text-white/58">
 Status: {isDemoMode ? "Environment demo mode is active." : "This page is a preview page. Environment demo mode is not globally forced."}
 </div>
 </div>
 </div>
 </section>

 <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 {sampleCards.map((card) => (
 <DemoStat key={card.label} {...card} />
 ))}
 </section>

 <section className="mt-6 rounded-[32px] border border-[rgba(196,169,91,0.30)] bg-[rgba(248,244,242,0.74)] p-5 md:p-6">
 <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
 <div>
 <p className="cth-kicker m-0">Guided path</p>
 <h2 className="mt-2 font-serif text-3xl font-semibold cth-heading md:text-4xl">
 Diagnose → Define → Structure → Execute
 </h2>
 <p className="mt-3 max-w-2xl text-sm leading-6 cth-muted">
 This demo follows the same logic as a real Core Truth House workspace, but every module uses sample data and preview-only actions.
 </p>
 </div>

 <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(196,169,91,0.32)] bg-[rgba(196,169,91,0.12)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] cth-muted">
 <Eye size={14} />
 Preview only
 </div>
 </div>

 <div className="grid gap-4 lg:grid-cols-4">
 {journey.map((item, index) => (
 <JourneyCard
 key={item.title}
 item={item}
 index={index}
 onPreview={setSelectedPreview}
 isActive={selectedPreview?.title === item.title}
 />
 ))}
 </div>

 <div className="mt-5 rounded-[28px] border border-[rgba(196,169,91,0.30)] bg-[rgba(255,255,255,0.68)] p-5 shadow-[0_18px_46px_rgba(13,0,16,0.08)]">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="max-w-3xl">
 <p className="cth-kicker m-0">Preview behavior</p>
 <h3 className="mt-2 text-2xl font-semibold cth-heading">{selectedPreview.previewTitle}</h3>
 <p className="mt-3 text-sm leading-6 cth-muted">{selectedPreview.previewAction}</p>
 <div className="mt-4 rounded-2xl border border-[rgba(196,169,91,0.30)] bg-[rgba(196,169,91,0.10)] p-4 text-sm leading-6 cth-body">
 {selectedPreview.previewResult}
 </div>
 </div>

 <div className="w-full rounded-2xl border border-[rgba(175,0,42,0.18)] bg-[rgba(175,0,42,0.07)] p-4 lg:max-w-xs">
 <div className="flex items-center gap-2 text-sm font-semibold cth-heading">
 <Lock size={16} className="text-[var(--cc-cinnabar)]" />
 Preview only
 </div>
 <p className="mt-2 text-xs leading-5 cth-muted">
 This does not open the live module, call AI, save records, consume credits, or change workspace data.
 </p>
 <a
 href={`/sign-in?redirect_url=${encodeURIComponent(selectedPreview.route)}`}
 className="cth-button-secondary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
 >
 Sign in to use this module
 <ArrowRight size={15} />
 </a>
 </div>
 </div>
 </div>
 </section>

 <section className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
 <article className="cth-card rounded-[30px] p-6">
 <div className="flex items-start gap-4">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(175,0,42,0.18)] bg-[rgba(175,0,42,0.08)] text-[var(--cc-cinnabar)]">
 <Lock size={20} />
 </div>
 <div>
 <p className="cth-kicker m-0">Locked behavior</p>
 <h2 className="mt-2 text-2xl font-semibold cth-heading">Every action explains what would happen.</h2>
 <p className="mt-3 text-sm leading-6 cth-muted">
 In a real workspace, actions save to Brand Memory, generate reports, build assets, or update the library. In Demo Mode, the experience explains the outcome without writing to live data.
 </p>
 </div>
 </div>
 </article>

 <article className="cth-card rounded-[30px] p-6">
 <div className="flex items-start gap-4">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(196,169,91,0.30)] bg-[rgba(196,169,91,0.12)] text-[var(--cc-gold)]">
 <PlayCircle size={20} />
 </div>
 <div>
 <p className="cth-kicker m-0">Next best move</p>
 <h2 className="mt-2 text-2xl font-semibold cth-heading">Start with the diagnostic when you are ready.</h2>
 <p className="mt-3 text-sm leading-6 cth-muted">
 The live path begins with the Brand Diagnostic so the system can recommend the right tier and show the structural gaps inside the brand.
 </p>
 <a href="/brand-diagnostic/" className="cth-button-primary mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold">
 Start the Brand Diagnostic
 <ArrowRight size={16} />
 </a>
 </div>
 </div>
 </article>
 </section>
 </main>
 );
}
