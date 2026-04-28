import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
 Archive,
 CheckCircle2,
 Clock,
 Copy,
 Crown,
 ExternalLink,
 FileText,
 Inbox,
 Link2,
 Lock,
 Mail,
 MailCheck,
 MousePointerClick,
 Plus,
 RefreshCw,
 Rocket,
 Search,
 Send,
 Sparkles,
 Star,
 Tags,
 Users,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import apiClient from "../lib/apiClient";

const MAILBOXES = [
 { id: "inbox", label: "Inbox", icon: Inbox },
 { id: "sent", label: "Sent", icon: Send },
 { id: "drafts", label: "Drafts", icon: FileText },
 { id: "starred", label: "Starred", icon: Star },
 { id: "archive", label: "Archive", icon: Archive },
 { id: "clicks", label: "Click Tracking", icon: MousePointerClick },
];

const INITIAL_TRACKING_FORM = {
 label: "",
 target_url: "",
 campaign_id: "",
 message_id: "",
 contact_id: "",
 automation_id: "",
};

function normalizeList(payload, key) {
 if (Array.isArray(payload)) return payload;
 if (Array.isArray(payload?.[key])) return payload[key];
 return [];
}

function formatPercent(value) {
 const number = Number(value || 0);
 if (!Number.isFinite(number)) return "0%";
 return `${Math.round(number)}%`;
}

function formatDate(value) {
 if (!value) return ", ";
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return ", ";
 return date.toLocaleDateString("en-US", {
 month: "short",
 day: "numeric",
 year: "numeric",
 });
}

function mailboxCount(messages, mailbox) {
 return messages.filter((message) => message.mailbox === mailbox).length;
}

function StatCard({ icon: Icon, label, value, helper }) {
 return (
 <article className="rounded-[26px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-5 shadow-[0_18px_44px_rgba(43,16,64,0.08)]">
 <div className="mb-4 flex items-start justify-between gap-4">
 <div>
 <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--cth-admin-muted)]">
 {label}
 </p>
 <div className="mt-2 font-serif text-[2rem] font-semibold leading-none text-[var(--cth-admin-ink)]">
 {value}
 </div>
 </div>
 <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(175,0,42,0.18)] bg-[rgba(175,0,42,0.07)] text-[var(--cth-admin-accent)]">
 <Icon size={20} />
 </div>
 </div>
 {helper ? <p className="m-0 text-sm leading-6 text-[var(--cth-admin-muted)]">{helper}</p> : null}
 </article>
 );
}

function Panel({ title, subtitle, action, children }) {
 return (
 <section className="rounded-[30px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-5 shadow-[0_22px_56px_rgba(43,16,64,0.08)]">
 <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
 <div>
 <h2 className="m-0 font-serif text-[1.45rem] font-semibold leading-tight text-[var(--cth-admin-ink)]">
 {title}
 </h2>
 {subtitle ? (
 <p className="mt-1 text-sm leading-6 text-[var(--cth-admin-muted)]">{subtitle}</p>
 ) : null}
 </div>
 {action}
 </div>
 {children}
 </section>
 );
}

function MailboxButton({ item, active, count, onClick }) {
 const Icon = item.icon;

 return (
 <button
 type="button"
 onClick={onClick}
 className={[
 "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
 active
 ? "border-[rgba(175,0,42,0.28)] bg-[rgba(175,0,42,0.08)] text-[var(--cth-admin-ink)]"
 : "border-transparent bg-transparent text-[var(--cth-admin-muted)] hover:border-[var(--cth-admin-border)] hover:bg-[rgba(255,255,255,0.38)]",
 ].join(" ")}
 >
 <span className="flex items-center gap-3 text-sm font-semibold">
 <Icon size={17} />
 {item.label}
 </span>
 <span className="text-xs font-semibold opacity-70">{count}</span>
 </button>
 );
}

function EmptyMailbox({ activeBox }) {
 return (
 <div className="grid min-h-[310px] place-items-center rounded-[24px] border border-dashed border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.52)] p-8 text-center">
 <div className="max-w-md">
 <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(196,169,91,0.35)] bg-[rgba(196,169,91,0.10)] text-[var(--cth-admin-accent)]">
 <Mail size={26} />
 </div>
 <h3 className="m-0 font-serif text-2xl font-semibold text-[var(--cth-admin-ink)]">
 No {activeBox === "clicks" ? "click data" : "messages"} yet
 </h3>
 <p className="mt-2 text-sm leading-6 text-[var(--cth-admin-muted)]">
 Create a tracked link, connect messages to campaigns, or launch a House-level flow to begin collecting mail signals.
 </p>
 </div>
 </div>
 );
}

function AutomationTemplateCard({ template, onCreate, creating }) {
 const locked = Boolean(template.locked);
 const Icon =
 template.id === "offer_launch_flow"
 ? Rocket
 : template.id === "brand_welcome_flow"
 ? MailCheck
 : template.id === "weekly_founder_notes"
 ? FileText
 : Users;

 return (
 <article
 className={[
 "rounded-2xl border p-5",
 locked
 ? "border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.48)] opacity-75"
 : "border-[rgba(175,0,42,0.22)] bg-[rgba(255,250,247,0.72)]",
 ].join(" ")}
 >
 <div className="mb-4 flex items-start justify-between gap-3">
 <div className="flex items-start gap-3">
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[rgba(196,169,91,0.35)] bg-[rgba(196,169,91,0.10)] text-[var(--cth-admin-accent)]">
 <Icon size={22} />
 </div>
 <div>
 <h3 className="m-0 font-serif text-xl font-semibold text-[var(--cth-admin-ink)]">
 {template.name}
 </h3>
 <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-accent)]">
 {template.category}
 </p>
 </div>
 </div>

 {locked ? (
 <span className="inline-flex items-center gap-1 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--cth-admin-muted)]">
 <Lock size={12} />
 House
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-green-700">
 <CheckCircle2 size={12} />
 Ready
 </span>
 )}
 </div>

 <p className="min-h-[52px] text-sm leading-6 text-[var(--cth-admin-muted)]">
 {template.description}
 </p>

 <div className="mt-4 rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.58)] p-4">
 <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">
 Flow steps
 </div>
 <div className="grid gap-2">
 {(template.steps || []).slice(0, 4).map((step, index) => (
 <div key={`${template.id}-${index}`} className="flex items-center justify-between gap-3 text-xs">
 <span className="font-semibold text-[var(--cth-admin-ink)]">
 Day {step.day}: {step.subject}
 </span>
 <span className="text-[var(--cth-admin-muted)]">{step.type}</span>
 </div>
 ))}
 </div>
 </div>

 <button
 type="button"
 disabled={locked || creating}
 onClick={() => onCreate(template)}
 className={[
 "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition",
 locked
 ? "cursor-not-allowed border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] text-[var(--cth-admin-muted)]"
 : "border border-[rgba(175,0,42,0.25)] bg-[var(--cth-admin-accent)] text-white hover:brightness-105",
 ].join(" ")}
 >
 {locked ? <Lock size={15} /> : <Sparkles size={15} />}
 {locked ? "Upgrade to House" : creating ? "Creating..." : "Use Template"}
 </button>
 </article>
 );
}

function MessageRow({ message }) {
 return (
 <article className="rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.64)] p-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <div className="font-semibold text-[var(--cth-admin-ink)]">
 {message.subject || "Untitled message"}
 </div>
 <div className="mt-1 text-sm text-[var(--cth-admin-muted)]">
 {message.preview || message.body || "No preview available."}
 </div>
 </div>
 <span className="rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-muted)]">
 {message.status || message.mailbox || "draft"}
 </span>
 </div>
 </article>
 );
}

function TrackingLinkRow({ link, onCopy }) {
 const trackingUrl = link.tracking_url || link.trackingUrl || `/api/mail/r/${link.tracking_id}`;

 return (
 <article className="rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.62)] p-4">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <h3 className="m-0 text-sm font-semibold text-[var(--cth-admin-ink)]">
 {link.label || "Tracked link"}
 </h3>
 <span className="rounded-full border border-[rgba(175,0,42,0.18)] bg-[rgba(175,0,42,0.06)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--cth-admin-accent)]">
 {Number(link.click_count || 0)} clicks
 </span>
 </div>

 <p className="mt-2 break-all text-xs leading-5 text-[var(--cth-admin-muted)]">
 Target: {link.target_url}
 </p>
 <p className="mt-1 break-all text-xs leading-5 text-[var(--cth-admin-muted)]">
 Tracking: {trackingUrl}
 </p>
 <p className="mt-2 text-xs text-[var(--cth-admin-muted)]">
 Created {formatDate(link.created_at)} · Last click {formatDate(link.last_clicked_at)}
 </p>
 </div>

 <div className="flex shrink-0 flex-wrap gap-2">
 <button
 type="button"
 onClick={() => onCopy(trackingUrl)}
 className="inline-flex items-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-2 text-xs font-semibold text-[var(--cth-admin-ink)]"
 >
 <Copy size={14} />
 Copy
 </button>
 <a
 href={trackingUrl}
 target="_blank"
 rel="noreferrer"
 className="inline-flex items-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-2 text-xs font-semibold text-[var(--cth-admin-ink)]"
 >
 <ExternalLink size={14} />
 Test
 </a>
 </div>
 </div>
 </article>
 );
}

export default function MailSuite() {
 const [activeBox, setActiveBox] = useState("inbox");
 const [query, setQuery] = useState("");
 const [loading, setLoading] = useState(true);
 const [creatingTemplateId, setCreatingTemplateId] = useState("");
 const [creatingLink, setCreatingLink] = useState(false);
 const [copiedUrl, setCopiedUrl] = useState("");
 const [error, setError] = useState("");
 const [notice, setNotice] = useState("");

 const [messages, setMessages] = useState([]);
 const [clicks, setClicks] = useState([]);
 const [trackingLinks, setTrackingLinks] = useState([]);
 const [templates, setTemplates] = useState([]);
 const [automations, setAutomations] = useState([]);
 const [trackingForm, setTrackingForm] = useState(INITIAL_TRACKING_FORM);

 const loadMailSuite = useCallback(async () => {
 setLoading(true);
 setError("");

 try {
 const [templatesData, automationsData, messagesData, clicksData, trackingLinksData] =
 await Promise.allSettled([
 apiClient.get("/api/mail/automations/templates"),
 apiClient.get("/api/mail/automations"),
 apiClient.get("/api/mail/messages"),
 apiClient.get("/api/mail/clicks"),
 apiClient.get("/api/mail/tracking-links"),
 ]);

 if (templatesData.status === "fulfilled") {
 setTemplates(normalizeList(templatesData.value, "templates"));
 }

 if (automationsData.status === "fulfilled") {
 setAutomations(normalizeList(automationsData.value, "automations"));
 }

 if (messagesData.status === "fulfilled") {
 setMessages(normalizeList(messagesData.value, "messages"));
 }

 if (clicksData.status === "fulfilled") {
 setClicks(normalizeList(clicksData.value, "clicks"));
 }

 if (trackingLinksData.status === "fulfilled") {
 setTrackingLinks(normalizeList(trackingLinksData.value, "tracking_links"));
 }
 } catch (err) {
 setError(err?.response?.data?.detail || err?.message || "Unable to load Mail Suite data.");
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 loadMailSuite();
 }, [loadMailSuite]);

 const stats = useMemo(() => {
 const sent = mailboxCount(messages, "sent");
 const drafts = mailboxCount(messages, "drafts");
 const inbox = mailboxCount(messages, "inbox");

 return {
 inbox,
 sent,
 drafts,
 tracking_links: trackingLinks.length,
 tracked_clicks: clicks.length,
 click_rate: sent ? Math.round((clicks.length / sent) * 100) : 0,
 };
 }, [messages, clicks, trackingLinks]);

 const filteredMessages = useMemo(() => {
 const source = activeBox === "clicks"
 ? clicks.map((click) => ({
 id: click.id,
 subject: click.label || "Tracked click",
 preview: click.url || "No URL stored.",
 status: click.provider || "click",
 mailbox: "clicks",
 }))
 : messages.filter((message) => (message.mailbox || "inbox") === activeBox);

 const term = query.trim().toLowerCase();
 if (!term) return source;

 return source.filter((message) =>
 [message.subject, message.sender, message.preview, message.body, message.url]
 .filter(Boolean)
 .some((value) => String(value).toLowerCase().includes(term))
 );
 }, [messages, clicks, activeBox, query]);

 const mailboxCounts = useMemo(() => {
 return {
 inbox: stats.inbox,
 sent: stats.sent,
 drafts: stats.drafts,
 starred: mailboxCount(messages, "starred"),
 archive: mailboxCount(messages, "archive"),
 clicks: clicks.length,
 };
 }, [messages, clicks, stats]);

 const filteredTrackingLinks = useMemo(() => {
 const term = query.trim().toLowerCase();
 if (!term) return trackingLinks;

 return trackingLinks.filter((link) =>
 [link.label, link.target_url, link.tracking_id, link.tracking_url]
 .filter(Boolean)
 .some((value) => String(value).toLowerCase().includes(term))
 );
 }, [trackingLinks, query]);

 const handleCreateAutomation = async (template) => {
 setCreatingTemplateId(template.id);
 setError("");
 setNotice("");

 try {
 await apiClient.post("/api/mail/automations", {
 template_id: template.id,
 name: template.name,
 status: "draft",
 });
 setNotice(`${template.name} automation created as a draft.`);
 await loadMailSuite();
 } catch (err) {
 setError(err?.response?.data?.detail || err?.message || "Unable to create automation. This may require The House plan.");
 } finally {
 setCreatingTemplateId("");
 }
 };

 const handleTrackingFormChange = (event) => {
 const { name, value } = event.target;
 setTrackingForm((current) => ({ ...current, [name]: value }));
 };

 const handleCreateTrackingLink = async (event) => {
 event.preventDefault();
 setError("");
 setNotice("");

 const targetUrl = trackingForm.target_url.trim();
 if (!targetUrl) {
 setError("Add a destination URL before creating a tracked link.");
 return;
 }

 setCreatingLink(true);

 try {
 const data = await apiClient.post("/api/mail/tracking-links", {
 ...trackingForm,
 target_url: targetUrl,
 label: trackingForm.label.trim() || "Tracked link",
 provider: "core_truth_house",
 });

 const created = data?.tracking_link;
 setTrackingForm(INITIAL_TRACKING_FORM);
 setNotice("Tracked link created. Copy it into your email, automation, or campaign.");
 await loadMailSuite();

 if (created?.tracking_url) {
 try {
 await navigator.clipboard.writeText(created.tracking_url);
 setCopiedUrl(created.tracking_url);
 setNotice("Tracked link created and copied to clipboard.");
 } catch {
 // Clipboard can fail on some browsers. The link still exists.
 }
 }
 } catch (err) {
 setError(err?.response?.data?.detail || err?.message || "Unable to create tracking link.");
 } finally {
 setCreatingLink(false);
 }
 };

 const handleCopy = async (value) => {
 setError("");
 setNotice("");

 try {
 await navigator.clipboard.writeText(value);
 setCopiedUrl(value);
 setNotice("Tracking link copied to clipboard.");
 } catch {
 setError("Unable to copy link automatically. You can still select and copy it manually.");
 }
 };

 return (
 <DashboardLayout>
 <TopBar
 title="Mail Suite"
 subtitle="Email, follow-up, automation, and click-tracking workspace for brand-aligned communication."
 />

 <div className="space-y-7 px-4 pb-10 pt-4 md:px-7">
 <section className="overflow-hidden rounded-[34px] border border-[var(--cth-admin-border)] bg-[linear-gradient(135deg,#33033C_0%,#140016_62%,#AF002A_160%)] p-6 text-white shadow-[0_28px_70px_rgba(43,16,64,0.22)] md:p-8">
 <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
 <div>
 <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
 Built for Strategic Messaging
 </p>
 <h1 className="m-0 max-w-3xl font-serif text-[2.5rem] font-semibold leading-[0.98] tracking-[-0.04em] md:text-[4.25rem]">
 Align every email with your brand, your offer, and your voice.
 </h1>
 <p className="mt-5 max-w-2xl text-base leading-7 text-white/72">
 Mail Suite connects messages, tracked links, click signals, and House-level automations
 so communication becomes part of the brand operating system.
 </p>
 </div>

 <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/8 p-5">
 <div className="flex items-center gap-3">
 <Crown className="text-[#C4A95B]" size={22} />
 <div>
 <div className="text-sm font-semibold">House automation layer</div>
 <div className="text-xs text-white/55">Offer launches, welcomes, notes, and nurture loops</div>
 </div>
 </div>
 <div className="h-px bg-white/10" />
 <div className="grid grid-cols-3 gap-3 text-center">
 <div>
 <div className="font-serif text-2xl font-semibold">{trackingLinks.length}</div>
 <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Links</div>
 </div>
 <div>
 <div className="font-serif text-2xl font-semibold">{automations.length}</div>
 <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Flows</div>
 </div>
 <div>
 <div className="font-serif text-2xl font-semibold">{stats.tracked_clicks}</div>
 <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">Clicks</div>
 </div>
 </div>
 </div>
 </div>
 </section>

 {notice ? (
 <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
 {notice}
 </div>
 ) : null}

 {error ? (
 <div className="rounded-2xl border border-[rgba(175,0,42,0.22)] bg-[rgba(175,0,42,0.06)] px-4 py-3 text-sm font-semibold text-[var(--cth-admin-accent)]">
 {error}
 </div>
 ) : null}

 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
 <StatCard icon={Inbox} label="Inbox" value={stats.inbox} helper="Messages received" />
 <StatCard icon={Send} label="Sent" value={stats.sent} helper="Outbound communication" />
 <StatCard icon={FileText} label="Drafts" value={stats.drafts} helper="Messages in progress" />
 <StatCard icon={Link2} label="Tracked Links" value={stats.tracking_links} helper="Links created" />
 <StatCard icon={MousePointerClick} label="Tracked Clicks" value={stats.tracked_clicks} helper={`Click rate ${formatPercent(stats.click_rate)}`} />
 </div>

 <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
 <Panel
 title="Create Tracked Link"
 subtitle="Create a public link you can place inside an email, launch flow, campaign, or follow-up."
 action={
 <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(175,0,42,0.24)] bg-[rgba(175,0,42,0.08)] px-4 py-2 text-sm font-semibold text-[var(--cth-admin-ink)]">
 <Link2 size={15} />
 Structure+
 </span>
 }
 >
 <form className="grid gap-4" onSubmit={handleCreateTrackingLink}>
 <div>
 <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">
 Link Label
 </label>
 <input
 name="label"
 value={trackingForm.label}
 onChange={handleTrackingFormChange}
 placeholder="Example: Book the diagnostic"
 className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
 />
 </div>

 <div>
 <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cth-admin-muted)]">
 Destination URL
 </label>
 <input
 name="target_url"
 value={trackingForm.target_url}
 onChange={handleTrackingFormChange}
 placeholder="https://coretruthhouse.com/brand-diagnostic"
 className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
 />
 </div>

 <div className="grid gap-3 md:grid-cols-2">
 <input
 name="campaign_id"
 value={trackingForm.campaign_id}
 onChange={handleTrackingFormChange}
 placeholder="Campaign ID optional"
 className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
 />
 <input
 name="automation_id"
 value={trackingForm.automation_id}
 onChange={handleTrackingFormChange}
 placeholder="Automation ID optional"
 className="w-full rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] px-4 py-3 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
 />
 </div>

 <button
 type="submit"
 disabled={creatingLink}
 className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(175,0,42,0.24)] bg-[var(--cth-admin-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
 >
 <Plus size={16} />
 {creatingLink ? "Creating..." : "Create Tracked Link"}
 </button>

 {copiedUrl ? (
 <p className="m-0 break-all rounded-2xl border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700">
 Copied: {copiedUrl}
 </p>
 ) : null}
 </form>
 </Panel>

 <Panel
 title="Tracking Link Activity"
 subtitle="Links created for emails, automations, campaigns, and follow-up sequences."
 action={
 <button
 type="button"
 onClick={loadMailSuite}
 className="inline-flex items-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-2 text-sm font-semibold text-[var(--cth-admin-ink)]"
 >
 <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
 Refresh
 </button>
 }
 >
 {filteredTrackingLinks.length ? (
 <div className="grid gap-3">
 {filteredTrackingLinks.map((link) => (
 <TrackingLinkRow
 key={link.id || link.tracking_id}
 link={link}
 onCopy={handleCopy}
 />
 ))}
 </div>
 ) : (
 <div className="rounded-2xl border border-dashed border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.52)] p-6 text-sm leading-6 text-[var(--cth-admin-muted)]">
 No tracked links yet. Create one on the left, then place it in an email, launch flow, or campaign.
 </div>
 )}
 </Panel>
 </div>

 <Panel
 title="Proven Flows & Templates"
 subtitle="House-level automations for launches, welcomes, founder notes, and client nurture."
 action={
 <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(196,169,91,0.32)] bg-[rgba(196,169,91,0.12)] px-4 py-2 text-sm font-semibold text-[var(--cth-admin-ink)]">
 <Crown size={15} />
 House and above
 </span>
 }
 >
 <div className="grid gap-4 xl:grid-cols-4">
 {templates.length ? (
 templates.map((template) => (
 <AutomationTemplateCard
 key={template.id}
 template={template}
 creating={creatingTemplateId === template.id}
 onCreate={handleCreateAutomation}
 />
 ))
 ) : (
 <div className="col-span-full rounded-2xl border border-dashed border-[var(--cth-admin-border)] p-6 text-sm text-[var(--cth-admin-muted)]">
 {loading ? "Loading automation templates..." : "No automation templates returned yet."}
 </div>
 )}
 </div>
 </Panel>

 <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
 <Panel
 title="Mailboxes"
 subtitle="Organize email signals by communication stage."
 action={
 <button
 type="button"
 className="inline-flex items-center gap-2 rounded-full border border-[rgba(175,0,42,0.24)] bg-[rgba(175,0,42,0.08)] px-4 py-2 text-sm font-semibold text-[var(--cth-admin-ink)]"
 >
 <Plus size={15} />
 Compose
 </button>
 }
 >
 <div className="grid gap-1">
 {MAILBOXES.map((item) => (
 <MailboxButton
 key={item.id}
 item={item}
 active={activeBox === item.id}
 count={mailboxCounts[item.id] || 0}
 onClick={() => setActiveBox(item.id)}
 />
 ))}
 </div>

 <div className="mt-6 rounded-2xl border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.56)] p-4">
 <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--cth-admin-ink)]">
 <Tags size={16} className="text-[var(--cth-admin-accent)]" />
 Planned labels
 </div>
 <div className="flex flex-wrap gap-2">
 {["Lead", "Client", "Campaign", "Follow-up"].map((label) => (
 <span
 key={label}
 className="rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-1 text-xs font-semibold text-[var(--cth-admin-muted)]"
 >
 {label}
 </span>
 ))}
 </div>
 </div>
 </Panel>

 <Panel
 title="Message Center"
 subtitle="Search, review, and track workspace communication."
 action={
 <button
 type="button"
 onClick={loadMailSuite}
 className="inline-flex items-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-2 text-sm font-semibold text-[var(--cth-admin-ink)]"
 >
 <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
 Refresh
 </button>
 }
 >
 <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div className="relative w-full md:max-w-md">
 <Search
 size={16}
 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--cth-admin-muted)]"
 />
 <input
 value={query}
 onChange={(event) => setQuery(event.target.value)}
 placeholder="Search messages, links, or clicks"
 className="w-full rounded-full border border-[var(--cth-admin-border)] bg-[rgba(255,250,247,0.74)] py-3 pl-11 pr-4 text-sm text-[var(--cth-admin-ink)] outline-none placeholder:text-[var(--cth-admin-muted)]"
 />
 </div>

 <div className="flex items-center gap-2 text-sm text-[var(--cth-admin-muted)]">
 <Clock size={15} />
 {loading ? "Loading..." : `${filteredMessages.length} visible`}
 </div>
 </div>

 {filteredMessages.length ? (
 <div className="grid gap-3">
 {filteredMessages.map((message) => (
 <MessageRow key={message.id || `${message.subject}-${message.preview}`} message={message} />
 ))}
 </div>
 ) : (
 <EmptyMailbox activeBox={activeBox} />
 )}
 </Panel>
 </div>
 </div>
 </DashboardLayout>
 );
}
