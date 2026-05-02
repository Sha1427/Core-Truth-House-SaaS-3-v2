import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
 Archive,
 CheckCircle2,
 Clock,
 Copy,
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
 Settings as SettingsIcon,
 Sparkles,
 Star,
 Users,
 X,
 AlertCircle,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import {
 Drawer,
 DrawerClose,
 DrawerContent,
 DrawerDescription,
 DrawerHeader,
 DrawerTitle,
} from "../components/ui/drawer";
import MailIntegrationsSettings from "../components/mail/MailIntegrationsSettings";
import apiClient from "../lib/apiClient";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const MAILBOXES = [
 { id: "inbox", label: "Inbox", icon: Inbox, helper: "New and active conversations" },
 { id: "sent", label: "Sent", icon: Send, helper: "Outbound communication" },
 { id: "drafts", label: "Drafts", icon: FileText, helper: "Messages in progress" },
 { id: "starred", label: "Starred", icon: Star, helper: "Important conversations" },
 { id: "archive", label: "Archive", icon: Archive, helper: "Closed or stored threads" },
];

const ALWAYS_VISIBLE_MAILBOXES = new Set(["inbox", "sent"]);

const VIEW_TABS = [
 { key: "messages", label: "Messages", icon: Mail },
 { key: "clicks", label: "Click Signals", icon: MousePointerClick },
];

const INITIAL_TRACKING_FORM = {
 label: "",
 target_url: "",
 campaign_id: "",
 automation_id: "",
};

const PAGE_STYLE = {
 background: "var(--cth-command-blush)",
 minHeight: "100%",
};

const PANEL_STYLE = {
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
};

const SOFT_PANEL_STYLE = {
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
};

const INPUT_STYLE = {
 width: "100%",
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 padding: "10px 12px",
 color: "var(--cth-command-ink)",
 fontFamily: SANS,
 fontSize: 14,
 outline: "none",
};

const PRIMARY_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "10px 16px",
 borderRadius: 4,
 background: "var(--cth-command-purple)",
 color: "var(--cth-command-gold)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 border: "none",
 cursor: "pointer",
};

const SECONDARY_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "8px 14px",
 borderRadius: 4,
 background: "transparent",
 border: "1px solid var(--cth-command-border)",
 color: "var(--cth-command-ink)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 500,
 cursor: "pointer",
 textDecoration: "none",
};

const EYEBROW_STYLE = {
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: "0.18em",
 textTransform: "uppercase",
 color: "var(--cth-command-muted)",
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
 if (!value) return "";
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return "";
 return date.toLocaleDateString("en-US", {
 month: "short",
 day: "numeric",
 year: "numeric",
 });
}

function mailboxCount(messages, mailbox) {
 return messages.filter((message) => message.mailbox === mailbox).length;
}

function getMessageTitle(message) {
 return message.subject || message.label || "Untitled message";
}

function getMessagePreview(message) {
 return message.preview || message.body || message.url || "No preview available.";
}

function getReplyAddress(message) {
 return (
 message.sender_email ||
 message.from_email ||
 message.reply_to ||
 message.sender ||
 ""
 );
}

function buildMailtoHref(message) {
 const to = String(getReplyAddress(message) || "").trim();
 const subject = message.subject ? `Re: ${message.subject}` : "";
 const params = new URLSearchParams();
 if (subject) params.set("subject", subject);
 const qs = params.toString();
 const path = to ? encodeURIComponent(to) : "";
 return `mailto:${path}${qs ? `?${qs}` : ""}`;
}

function Eyebrow({ children }) {
 return <div style={EYEBROW_STYLE}>{children}</div>;
}

function Chip({ children, tone = "muted" }) {
 const tones = {
 muted: { background: "var(--cth-command-panel-soft)", border: "1px solid var(--cth-command-border)", color: "var(--cth-command-muted)" },
 crimson: { background: "rgba(175,0,42,0.10)", border: "1px solid rgba(175,0,42,0.22)", color: "var(--cth-command-crimson)" },
 gold: { background: "rgba(196,169,91,0.18)", border: "1px solid rgba(196,169,91,0.40)", color: "var(--cth-command-purple)" },
 success: { background: "rgba(34,135,90,0.12)", border: "1px solid rgba(34,135,90,0.28)", color: "#15803d" },
 };
 const style = tones[tone] || tones.muted;
 return (
 <span
 style={{
 display: "inline-flex",
 alignItems: "center",
 borderRadius: 999,
 padding: "3px 10px",
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: "0.06em",
 textTransform: "uppercase",
 ...style,
 }}
 >
 {children}
 </span>
 );
}

function MetricTile({ label, value, helper, accent }) {
 return (
 <div style={{ ...PANEL_STYLE, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <span
 aria-hidden="true"
 style={{
 width: 8,
 height: 8,
 borderRadius: "50%",
 background: accent,
 display: "inline-block",
 }}
 />
 <span style={{ ...EYEBROW_STYLE, fontSize: 10, letterSpacing: "0.2em" }}>{label}</span>
 </div>
 <span
 style={{
 fontFamily: SERIF,
 fontSize: 32,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 lineHeight: 1,
 }}
 >
 {value}
 </span>
 {helper ? (
 <span style={{ fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)" }}>{helper}</span>
 ) : null}
 </div>
 );
}

function Panel({ eyebrow, title, subtitle, action, children, padding = 20 }) {
 const showHeader = Boolean(eyebrow || title || subtitle || action);
 return (
 <section style={{ ...PANEL_STYLE, padding }}>
 {showHeader ? (
 <div
 style={{
 display: "flex",
 flexWrap: "wrap",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 marginBottom: 16,
 }}
 >
 <div style={{ minWidth: 0 }}>
 {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
 {title ? (
 <h2
 style={{
 fontFamily: SERIF,
 fontSize: 20,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: eyebrow ? "6px 0 0" : 0,
 letterSpacing: "-0.005em",
 lineHeight: 1.2,
 }}
 >
 {title}
 </h2>
 ) : null}
 {subtitle ? (
 <p
 style={{
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-muted)",
 margin: "6px 0 0",
 lineHeight: 1.5,
 }}
 >
 {subtitle}
 </p>
 ) : null}
 </div>
 {action}
 </div>
 ) : null}
 {children}
 </section>
 );
}

function EmptyState({ icon: Icon, title, body }) {
 return (
 <div
 style={{
 padding: "32px 18px",
 textAlign: "center",
 background: "var(--cth-command-panel-soft)",
 border: "1px dashed var(--cth-command-border)",
 borderRadius: 4,
 }}
 >
 {Icon ? (
 <Icon
 size={28}
 style={{ color: "var(--cth-command-muted)", display: "block", margin: "0 auto 10px" }}
 />
 ) : null}
 <div
 style={{
 fontFamily: SERIF,
 fontSize: 16,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 marginBottom: 6,
 }}
 >
 {title}
 </div>
 <div style={{ fontFamily: SANS, fontSize: 13, color: "var(--cth-command-muted)" }}>{body}</div>
 </div>
 );
}

function TabBar({ value, onChange, tabs }) {
 return (
 <div
 style={{
 display: "inline-flex",
 gap: 4,
 padding: 4,
 borderRadius: 4,
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 }}
 >
 {tabs.map((tab) => {
 const Icon = tab.icon;
 const active = value === tab.key;
 return (
 <button
 key={tab.key}
 type="button"
 onClick={() => onChange(tab.key)}
 style={{
 display: "inline-flex",
 alignItems: "center",
 gap: 8,
 padding: "8px 14px",
 borderRadius: 4,
 background: active ? "var(--cth-command-purple)" : "transparent",
 color: active ? "var(--cth-command-gold)" : "var(--cth-command-ink)",
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 600,
 border: "none",
 cursor: "pointer",
 transition: "background 150ms ease, color 150ms ease",
 }}
 >
 <Icon size={14} /> {tab.label}
 </button>
 );
 })}
 </div>
 );
}

function MailboxButton({ item, active, count, onClick }) {
 const Icon = item.icon;
 return (
 <button
 type="button"
 onClick={onClick}
 style={{
 display: "flex",
 alignItems: "flex-start",
 justifyContent: "space-between",
 width: "100%",
 padding: "12px 14px",
 borderRadius: 4,
 background: active ? "rgba(175,0,42,0.06)" : "transparent",
 border: `1px solid ${active ? "rgba(175,0,42,0.28)" : "transparent"}`,
 color: active ? "var(--cth-command-ink)" : "var(--cth-command-muted)",
 cursor: "pointer",
 textAlign: "left",
 fontFamily: SANS,
 transition: "background 150ms ease, border-color 150ms ease",
 }}
 onMouseEnter={(e) => {
 if (!active) {
 e.currentTarget.style.background = "var(--cth-command-panel-soft)";
 e.currentTarget.style.borderColor = "var(--cth-command-border)";
 }
 }}
 onMouseLeave={(e) => {
 if (!active) {
 e.currentTarget.style.background = "transparent";
 e.currentTarget.style.borderColor = "transparent";
 }
 }}
 >
 <span style={{ display: "flex", gap: 12, minWidth: 0, alignItems: "flex-start" }}>
 <span style={{ flexShrink: 0, marginTop: 2 }}>
 <Icon size={16} />
 </span>
 <span style={{ minWidth: 0 }}>
 <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--cth-command-ink)" }}>
 {item.label}
 </span>
 <span style={{ display: "block", fontSize: 11, marginTop: 2, lineHeight: 1.4, opacity: 0.75 }}>
 {item.helper}
 </span>
 </span>
 </span>
 <span
 style={{
 marginLeft: 10,
 padding: "2px 8px",
 borderRadius: 999,
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: 600,
 color: "var(--cth-command-muted)",
 }}
 >
 {count}
 </span>
 </button>
 );
}

function MessageRow({ message, active, onClick }) {
 return (
 <button
 type="button"
 onClick={onClick}
 style={{
 width: "100%",
 padding: 14,
 borderRadius: 4,
 background: active ? "rgba(175,0,42,0.05)" : "var(--cth-command-panel)",
 border: `1px solid ${active ? "rgba(175,0,42,0.28)" : "var(--cth-command-border)"}`,
 textAlign: "left",
 cursor: "pointer",
 fontFamily: SANS,
 transition: "background 150ms ease, border-color 150ms ease",
 }}
 >
 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
 <div style={{ minWidth: 0 }}>
 <div
 style={{
 fontWeight: 600,
 fontSize: 14,
 color: "var(--cth-command-ink)",
 whiteSpace: "nowrap",
 overflow: "hidden",
 textOverflow: "ellipsis",
 }}
 >
 {getMessageTitle(message)}
 </div>
 <div
 style={{
 marginTop: 4,
 fontSize: 12,
 lineHeight: 1.5,
 color: "var(--cth-command-muted)",
 display: "-webkit-box",
 WebkitLineClamp: 2,
 WebkitBoxOrient: "vertical",
 overflow: "hidden",
 }}
 >
 {getMessagePreview(message)}
 </div>
 </div>
 <Chip>{message.status || message.mailbox || "draft"}</Chip>
 </div>
 </button>
 );
}

function MessageDetail({ message, activeMailbox }) {
 if (!message) {
 return (
 <EmptyState
 icon={MailCheck}
 title="Select a message"
 body="Choose a conversation from the list to read it."
 />
 );
 }

 const replyHref = buildMailtoHref(message);
 const replyAddress = getReplyAddress(message);

 return (
 <div style={{ ...PANEL_STYLE, padding: 20 }}>
 <div
 style={{
 display: "flex",
 flexWrap: "wrap",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 paddingBottom: 16,
 borderBottom: "1px solid var(--cth-command-border)",
 }}
 >
 <div style={{ minWidth: 0 }}>
 <Eyebrow>Conversation</Eyebrow>
 <h3
 style={{
 fontFamily: SERIF,
 fontSize: 20,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: "6px 0 0",
 letterSpacing: "-0.005em",
 lineHeight: 1.2,
 }}
 >
 {getMessageTitle(message)}
 </h3>
 <p
 style={{
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-muted)",
 margin: "6px 0 0",
 }}
 >
 {message.sender || message.provider || "Workspace signal"}
 {message.created_at || message.timestamp
 ? ` · ${formatDate(message.created_at || message.timestamp)}`
 : ""}
 </p>
 </div>
 <Chip>{message.status || message.mailbox || activeMailbox}</Chip>
 </div>

 <div style={{ padding: "18px 0" }}>
 <p
 style={{
 whiteSpace: "pre-wrap",
 fontFamily: SANS,
 fontSize: 14,
 lineHeight: 1.65,
 color: "var(--cth-command-ink)",
 margin: 0,
 }}
 >
 {message.body || message.preview || message.url || "No full message body is available yet."}
 </p>
 </div>

 <div
 style={{
 display: "grid",
 gap: 12,
 paddingTop: 16,
 borderTop: "1px solid var(--cth-command-border)",
 }}
 >
 <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
 <div style={{ ...SOFT_PANEL_STYLE, padding: 14 }}>
 <Eyebrow>Linked contact</Eyebrow>
 <div
 style={{
 marginTop: 6,
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 }}
 >
 {message.contact_name || message.sender || "Not linked"}
 </div>
 </div>
 <div style={{ ...SOFT_PANEL_STYLE, padding: 14 }}>
 <Eyebrow>Campaign</Eyebrow>
 <div
 style={{
 marginTop: 6,
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 }}
 >
 {message.campaign_id || "Not linked"}
 </div>
 </div>
 </div>

 <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
 <a
 href={replyHref}
 style={{
 ...PRIMARY_BUTTON_STYLE,
 textDecoration: "none",
 opacity: replyAddress ? 1 : 0.5,
 pointerEvents: replyAddress ? "auto" : "none",
 }}
 aria-disabled={!replyAddress}
 title={replyAddress ? `Reply to ${replyAddress}` : "No reply address available"}
 >
 <Send size={14} />
 Reply in mail app
 </a>
 {!replyAddress ? (
 <span style={{ alignSelf: "center", fontFamily: SANS, fontSize: 12, color: "var(--cth-command-muted)" }}>
 No reply address on this message.
 </span>
 ) : null}
 </div>
 </div>
 </div>
 );
}

function ClickSignalRow({ signal, active, onClick }) {
 return (
 <button
 type="button"
 onClick={onClick}
 style={{
 width: "100%",
 padding: 14,
 borderRadius: 4,
 background: active ? "rgba(175,0,42,0.05)" : "var(--cth-command-panel)",
 border: `1px solid ${active ? "rgba(175,0,42,0.28)" : "var(--cth-command-border)"}`,
 textAlign: "left",
 cursor: "pointer",
 fontFamily: SANS,
 transition: "background 150ms ease, border-color 150ms ease",
 }}
 >
 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
 <div style={{ minWidth: 0 }}>
 <div
 style={{
 fontWeight: 600,
 fontSize: 14,
 color: "var(--cth-command-ink)",
 whiteSpace: "nowrap",
 overflow: "hidden",
 textOverflow: "ellipsis",
 }}
 >
 {signal.label || signal.tracking_id || "Tracked click"}
 </div>
 <div
 style={{
 marginTop: 4,
 fontSize: 12,
 lineHeight: 1.5,
 color: "var(--cth-command-muted)",
 wordBreak: "break-all",
 display: "-webkit-box",
 WebkitLineClamp: 2,
 WebkitBoxOrient: "vertical",
 overflow: "hidden",
 }}
 >
 {signal.url || signal.target_url || "No URL stored."}
 </div>
 </div>
 <Chip>{signal.provider || "click"}</Chip>
 </div>
 {signal.timestamp || signal.created_at ? (
 <div
 style={{
 marginTop: 8,
 fontFamily: SANS,
 fontSize: 11,
 color: "var(--cth-command-muted)",
 }}
 >
 {formatDate(signal.timestamp || signal.created_at)}
 </div>
 ) : null}
 </button>
 );
}

function ClickSignalDetail({ signal }) {
 if (!signal) {
 return (
 <EmptyState
 icon={MousePointerClick}
 title="Select a click signal"
 body="Choose a tracked click from the list to inspect it."
 />
 );
 }

 const url = signal.url || signal.target_url || "";

 return (
 <div style={{ ...PANEL_STYLE, padding: 20 }}>
 <Eyebrow>Click Signal</Eyebrow>
 <h3
 style={{
 fontFamily: SERIF,
 fontSize: 20,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: "6px 0 0",
 letterSpacing: "-0.005em",
 lineHeight: 1.2,
 }}
 >
 {signal.label || signal.tracking_id || "Tracked click"}
 </h3>
 <p
 style={{
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-muted)",
 margin: "6px 0 0",
 }}
 >
 {signal.provider || "Workspace signal"}
 {signal.timestamp || signal.created_at
 ? ` · ${formatDate(signal.timestamp || signal.created_at)}`
 : ""}
 </p>

 <div
 style={{
 marginTop: 18,
 padding: 14,
 ...SOFT_PANEL_STYLE,
 wordBreak: "break-all",
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-ink)",
 }}
 >
 {url ? (
 <a
 href={url}
 target="_blank"
 rel="noreferrer"
 style={{ color: "var(--cth-command-crimson)", textDecoration: "none" }}
 >
 {url}
 </a>
 ) : (
 <span style={{ color: "var(--cth-command-muted)" }}>No URL stored.</span>
 )}
 </div>

 <div style={{ marginTop: 12, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
 {signal.campaign_id ? (
 <div style={{ ...SOFT_PANEL_STYLE, padding: 14 }}>
 <Eyebrow>Campaign</Eyebrow>
 <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "var(--cth-command-ink)" }}>
 {signal.campaign_id}
 </div>
 </div>
 ) : null}
 {signal.contact_id ? (
 <div style={{ ...SOFT_PANEL_STYLE, padding: 14 }}>
 <Eyebrow>Contact</Eyebrow>
 <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "var(--cth-command-ink)" }}>
 {signal.contact_id}
 </div>
 </div>
 ) : null}
 {signal.automation_id ? (
 <div style={{ ...SOFT_PANEL_STYLE, padding: 14 }}>
 <Eyebrow>Automation</Eyebrow>
 <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "var(--cth-command-ink)" }}>
 {signal.automation_id}
 </div>
 </div>
 ) : null}
 </div>

 {url ? (
 <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
 <a
 href={url}
 target="_blank"
 rel="noreferrer"
 style={{ ...SECONDARY_BUTTON_STYLE }}
 >
 <ExternalLink size={14} /> Open destination
 </a>
 </div>
 ) : null}
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
 <article style={{ ...PANEL_STYLE, padding: 20 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
 <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
 <div
 style={{
 width: 44,
 height: 44,
 flexShrink: 0,
 borderRadius: 4,
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 background: "rgba(196,169,91,0.12)",
 border: "1px solid rgba(196,169,91,0.32)",
 color: "var(--cth-command-crimson)",
 }}
 >
 <Icon size={20} />
 </div>
 <div>
 <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0, lineHeight: 1.25 }}>
 {template.name}
 </h3>
 {template.category ? (
 <p style={{ ...EYEBROW_STYLE, fontSize: 10, color: "var(--cth-command-crimson)", margin: "6px 0 0" }}>
 {template.category}
 </p>
 ) : null}
 </div>
 </div>
 {locked ? (
 <Chip tone="muted">
 <Lock size={11} style={{ marginRight: 4 }} /> House
 </Chip>
 ) : (
 <Chip tone="success">
 <CheckCircle2 size={11} style={{ marginRight: 4 }} /> Ready
 </Chip>
 )}
 </div>

 {template.description ? (
 <p style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.55, color: "var(--cth-command-muted)", margin: 0 }}>
 {template.description}
 </p>
 ) : null}

 {Array.isArray(template.steps) && template.steps.length ? (
 <div style={{ marginTop: 14, ...SOFT_PANEL_STYLE, padding: 14 }}>
 <Eyebrow>Flow steps</Eyebrow>
 <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
 {template.steps.slice(0, 4).map((step, index) => (
 <div
 key={`${template.id}-${index}`}
 style={{
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
 gap: 12,
 fontFamily: SANS,
 fontSize: 12,
 }}
 >
 <span style={{ fontWeight: 600, color: "var(--cth-command-ink)" }}>
 Day {step.day}: {step.subject}
 </span>
 <span style={{ color: "var(--cth-command-muted)" }}>{step.type}</span>
 </div>
 ))}
 </div>
 </div>
 ) : null}

 <button
 type="button"
 disabled={locked || creating}
 onClick={() => onCreate(template)}
 style={{
 marginTop: 16,
 width: "100%",
 ...(locked ? SECONDARY_BUTTON_STYLE : PRIMARY_BUTTON_STYLE),
 padding: "10px 14px",
 opacity: locked || creating ? 0.7 : 1,
 cursor: locked || creating ? "not-allowed" : "pointer",
 }}
 >
 {locked ? <Lock size={14} /> : <Sparkles size={14} />}
 {locked ? "Upgrade to House" : creating ? "Creating…" : "Use Template"}
 </button>
 </article>
 );
}

function TrackingLinkRow({ link, onCopy, copyingUrl }) {
 const trackingUrl = link.tracking_url || link.trackingUrl || `/api/mail/r/${link.tracking_id}`;
 const isCopying = copyingUrl === trackingUrl;

 return (
 <article style={{ ...PANEL_STYLE, padding: 16 }}>
 <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
 <div style={{ minWidth: 0, flex: "1 1 280px" }}>
 <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
 <h3 style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: "var(--cth-command-ink)", margin: 0 }}>
 {link.label || "Tracked link"}
 </h3>
 <Chip tone="crimson">{Number(link.click_count || 0)} clicks</Chip>
 </div>
 <p style={{ marginTop: 8, fontFamily: SANS, fontSize: 12, lineHeight: 1.5, color: "var(--cth-command-muted)", wordBreak: "break-all" }}>
 Target: {link.target_url}
 </p>
 <p style={{ marginTop: 4, fontFamily: SANS, fontSize: 12, lineHeight: 1.5, color: "var(--cth-command-muted)", wordBreak: "break-all" }}>
 Tracking: {trackingUrl}
 </p>
 <p style={{ marginTop: 8, fontFamily: SANS, fontSize: 11, color: "var(--cth-command-muted)" }}>
 Created {formatDate(link.created_at) || "—"}
 {link.last_clicked_at ? ` · Last click ${formatDate(link.last_clicked_at)}` : ""}
 </p>
 </div>

 <div style={{ display: "flex", flexShrink: 0, gap: 8, flexWrap: "wrap" }}>
 <button
 type="button"
 onClick={() => onCopy(trackingUrl)}
 disabled={isCopying}
 style={{ ...SECONDARY_BUTTON_STYLE, opacity: isCopying ? 0.7 : 1 }}
 >
 <Copy size={14} /> {isCopying ? "Copying…" : "Copy"}
 </button>
 <a
 href={trackingUrl}
 target="_blank"
 rel="noreferrer"
 style={SECONDARY_BUTTON_STYLE}
 >
 <ExternalLink size={14} /> Test
 </a>
 </div>
 </div>
 </article>
 );
}

function MailDrawer({ open, onOpenChange, eyebrow, title, description, children }) {
 return (
 <Drawer open={open} onOpenChange={onOpenChange}>
 <DrawerContent
 className="mx-auto max-h-[88vh] max-w-5xl overflow-hidden"
 style={{
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderTopLeftRadius: 4,
 borderTopRightRadius: 4,
 }}
 >
 <DrawerHeader
 className="text-left"
 style={{
 padding: "20px 24px 16px",
 borderBottom: "1px solid var(--cth-command-border)",
 }}
 >
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
 <div>
 {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
 <DrawerTitle
 style={{
 fontFamily: SERIF,
 fontSize: 24,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: eyebrow ? "6px 0 0" : 0,
 letterSpacing: "-0.005em",
 lineHeight: 1.2,
 }}
 >
 {title}
 </DrawerTitle>
 {description ? (
 <DrawerDescription
 style={{
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-muted)",
 margin: "8px 0 0",
 lineHeight: 1.5,
 }}
 >
 {description}
 </DrawerDescription>
 ) : null}
 </div>
 <DrawerClose asChild>
 <button
 type="button"
 aria-label="Close drawer"
 style={{
 width: 32,
 height: 32,
 borderRadius: 4,
 background: "transparent",
 border: "1px solid var(--cth-command-border)",
 color: "var(--cth-command-ink)",
 cursor: "pointer",
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 }}
 >
 <X size={16} />
 </button>
 </DrawerClose>
 </div>
 </DrawerHeader>
 <div style={{ overflowY: "auto", padding: "20px 24px 24px" }}>{children}</div>
 </DrawerContent>
 </Drawer>
 );
}

function Toast({ toast }) {
 if (!toast) return null;
 const isError = toast.tone === "error";
 return (
 <div
 role="status"
 aria-live="polite"
 style={{
 position: "fixed",
 bottom: 24,
 right: 24,
 zIndex: 80,
 background: "var(--cth-command-panel)",
 border: `1px solid ${isError ? "var(--cth-command-crimson)" : "var(--cth-command-gold)"}`,
 borderRadius: 4,
 padding: "12px 18px",
 boxShadow: "0 20px 40px rgba(13,0,16,0.18)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 500,
 color: "var(--cth-command-ink)",
 display: "flex",
 alignItems: "center",
 gap: 10,
 maxWidth: 420,
 }}
 >
 {isError ? <AlertCircle size={16} style={{ color: "var(--cth-command-crimson)", flexShrink: 0 }} /> : null}
 <span>{toast.message}</span>
 </div>
 );
}

export default function MailSuite() {
 const [activeView, setActiveView] = useState("messages");
 const [activeBox, setActiveBox] = useState("inbox");
 const [query, setQuery] = useState("");
 const [trackingQuery, setTrackingQuery] = useState("");
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [creatingTemplateId, setCreatingTemplateId] = useState("");
 const [creatingLink, setCreatingLink] = useState(false);
 const [copyingUrl, setCopyingUrl] = useState("");
 const [activeDrawer, setActiveDrawer] = useState("");
 const [selectedMessageId, setSelectedMessageId] = useState("");
 const [selectedClickId, setSelectedClickId] = useState("");
 const [toast, setToast] = useState(null);

 const [messages, setMessages] = useState([]);
 const [clicks, setClicks] = useState([]);
 const [trackingLinks, setTrackingLinks] = useState([]);
 const [templates, setTemplates] = useState([]);
 const [automations, setAutomations] = useState([]);
 const [trackingForm, setTrackingForm] = useState(INITIAL_TRACKING_FORM);

 const showToast = (message, tone = "success") => setToast({ message, tone });

 useEffect(() => {
 if (!toast) return undefined;
 const id = setTimeout(() => setToast(null), 2500);
 return () => clearTimeout(id);
 }, [toast]);

 const loadMailSuite = useCallback(async (opts = {}) => {
 const { silent = false } = opts;
 if (silent) setRefreshing(true);
 else setLoading(true);

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
 const message = err?.response?.data?.detail || err?.message || "Unable to load Mail Suite data.";
 showToast(message, "error");
 } finally {
 setLoading(false);
 setRefreshing(false);
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
 automations: automations.length,
 click_rate: sent ? Math.round((clicks.length / sent) * 100) : 0,
 };
 }, [messages, clicks, trackingLinks, automations]);

 const mailboxCounts = useMemo(() => {
 return {
 inbox: stats.inbox,
 sent: stats.sent,
 drafts: stats.drafts,
 starred: mailboxCount(messages, "starred"),
 archive: mailboxCount(messages, "archive"),
 };
 }, [messages, stats]);

 const visibleMailboxes = useMemo(() => {
 return MAILBOXES.filter((box) =>
 ALWAYS_VISIBLE_MAILBOXES.has(box.id) || (mailboxCounts[box.id] || 0) > 0
 );
 }, [mailboxCounts]);

 useEffect(() => {
 if (!visibleMailboxes.find((b) => b.id === activeBox)) {
 setActiveBox(visibleMailboxes[0]?.id || "inbox");
 }
 }, [visibleMailboxes, activeBox]);

 const filteredMessages = useMemo(() => {
 const source = messages.filter((message) => (message.mailbox || "inbox") === activeBox);
 const term = query.trim().toLowerCase();
 if (!term) return source;
 return source.filter((message) =>
 [message.subject, message.sender, message.preview, message.body, message.label]
 .filter(Boolean)
 .some((value) => String(value).toLowerCase().includes(term))
 );
 }, [messages, activeBox, query]);

 const selectedMessage = useMemo(() => {
 if (!filteredMessages.length) return null;
 return (
 filteredMessages.find(
 (message) => String(message.id || message.subject) === String(selectedMessageId)
 ) || filteredMessages[0]
 );
 }, [filteredMessages, selectedMessageId]);

 useEffect(() => {
 if (!filteredMessages.length) {
 setSelectedMessageId("");
 return;
 }
 const stillExists = filteredMessages.some(
 (message) => String(message.id || message.subject) === String(selectedMessageId)
 );
 if (!stillExists) {
 const first = filteredMessages[0];
 setSelectedMessageId(String(first.id || first.subject || ""));
 }
 }, [filteredMessages, selectedMessageId]);

 const filteredClicks = useMemo(() => {
 const term = query.trim().toLowerCase();
 const base = clicks.map((click) => ({
 id: click.id || click.click_id || `${click.label}-${click.url}`,
 ...click,
 }));
 if (!term) return base;
 return base.filter((click) =>
 [click.label, click.url, click.target_url, click.tracking_id, click.provider]
 .filter(Boolean)
 .some((value) => String(value).toLowerCase().includes(term))
 );
 }, [clicks, query]);

 const selectedClick = useMemo(() => {
 if (!filteredClicks.length) return null;
 return (
 filteredClicks.find((c) => String(c.id) === String(selectedClickId)) ||
 filteredClicks[0]
 );
 }, [filteredClicks, selectedClickId]);

 useEffect(() => {
 if (!filteredClicks.length) {
 setSelectedClickId("");
 return;
 }
 const stillExists = filteredClicks.some((c) => String(c.id) === String(selectedClickId));
 if (!stillExists) {
 setSelectedClickId(String(filteredClicks[0].id));
 }
 }, [filteredClicks, selectedClickId]);

 const filteredTrackingLinks = useMemo(() => {
 const term = trackingQuery.trim().toLowerCase();
 if (!term) return trackingLinks;
 return trackingLinks.filter((link) =>
 [link.label, link.target_url, link.tracking_id, link.tracking_url]
 .filter(Boolean)
 .some((value) => String(value).toLowerCase().includes(term))
 );
 }, [trackingLinks, trackingQuery]);

 const handleCreateAutomation = async (template) => {
 setCreatingTemplateId(template.id);

 try {
 await apiClient.post("/api/mail/automations", {
 template_id: template.id,
 name: template.name,
 status: "draft",
 });
 showToast(`${template.name} automation created as a draft.`);
 await loadMailSuite({ silent: true });
 } catch (err) {
 const message =
 err?.response?.data?.detail ||
 err?.message ||
 "Unable to create automation. This may require The House plan.";
 showToast(message, "error");
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

 const targetUrl = trackingForm.target_url.trim();
 if (!targetUrl) {
 showToast("Add a destination URL before creating a tracked link.", "error");
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
 await loadMailSuite({ silent: true });

 if (created?.tracking_url) {
 try {
 await navigator.clipboard.writeText(created.tracking_url);
 showToast("Tracked link created and copied to clipboard.");
 } catch {
 showToast("Tracked link created. Copy it from the activity list.");
 }
 } else {
 showToast("Tracked link created.");
 }
 } catch (err) {
 const message =
 err?.response?.data?.detail || err?.message || "Unable to create tracking link.";
 showToast(message, "error");
 } finally {
 setCreatingLink(false);
 }
 };

 const handleCopy = async (value) => {
 setCopyingUrl(value);
 try {
 await navigator.clipboard.writeText(value);
 showToast("Tracking link copied.");
 } catch {
 showToast("Unable to copy automatically. Select and copy manually.", "error");
 } finally {
 setCopyingUrl("");
 }
 };

 const messagesEmpty = !filteredMessages.length;
 const clicksEmpty = !filteredClicks.length;

 return (
 <DashboardLayout>
 <TopBar
 title="Mail Suite"
 subtitle="Inbound mail, click signals, tracking links, and automation templates."
 />

 <div style={PAGE_STYLE} className="px-4 py-6 md:px-7 md:py-8">
 <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
 <div style={{ minWidth: 0 }}>
 <Eyebrow>Mail Suite</Eyebrow>
 <h1
 style={{
 fontFamily: SERIF,
 fontSize: 28,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: "8px 0 0",
 lineHeight: 1.2,
 letterSpacing: "-0.01em",
 }}
 >
 Communication Hub
 </h1>
 <p style={{ fontFamily: SANS, fontSize: 14, color: "var(--cth-command-muted)", margin: "8px 0 0", maxWidth: 640, lineHeight: 1.55 }}>
 Read inbound mail, monitor click signals, manage tracking links, and ship automations from one place.
 </p>
 </div>

 <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
 <button type="button" onClick={() => setActiveDrawer("templates")} style={SECONDARY_BUTTON_STYLE}>
 <Sparkles size={14} /> Templates
 </button>
 <button type="button" onClick={() => setActiveDrawer("tracking")} style={SECONDARY_BUTTON_STYLE}>
 <Link2 size={14} /> Tracking
 </button>
 <button type="button" onClick={() => setActiveDrawer("settings")} style={SECONDARY_BUTTON_STYLE}>
 <SettingsIcon size={14} /> Settings
 </button>
 <button
 type="button"
 onClick={() => loadMailSuite({ silent: true })}
 disabled={refreshing || loading}
 style={{ ...SECONDARY_BUTTON_STYLE, opacity: refreshing || loading ? 0.7 : 1 }}
 >
 <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
 Refresh
 </button>
 </div>
 </div>

 <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <MetricTile
 label="Inbox"
 value={stats.inbox}
 helper={`${stats.sent} sent`}
 accent="var(--cth-command-purple)"
 />
 <MetricTile
 label="Tracked Links"
 value={stats.tracking_links}
 helper="Across automations + campaigns"
 accent="var(--cth-command-gold)"
 />
 <MetricTile
 label="Click Signals"
 value={stats.tracked_clicks}
 helper={`Click rate ${formatPercent(stats.click_rate)}`}
 accent="var(--cth-command-crimson)"
 />
 <MetricTile
 label="Automations"
 value={stats.automations}
 helper={`${templates.length} templates`}
 accent="#15803d"
 />
 </div>

 <div style={{ marginBottom: 18, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
 <TabBar value={activeView} onChange={setActiveView} tabs={VIEW_TABS} />
 <div style={{ position: "relative", flex: "1 1 280px", maxWidth: 360 }}>
 <Search
 size={14}
 style={{
 position: "absolute",
 left: 12,
 top: "50%",
 transform: "translateY(-50%)",
 color: "var(--cth-command-muted)",
 pointerEvents: "none",
 }}
 />
 <input
 value={query}
 onChange={(event) => setQuery(event.target.value)}
 placeholder={activeView === "clicks" ? "Search click signals" : "Search messages"}
 style={{ ...INPUT_STYLE, paddingLeft: 32, padding: "10px 12px 10px 32px" }}
 />
 </div>
 </div>

 {loading ? (
 <Panel padding={28}>
 <p style={{ fontFamily: SANS, fontSize: 14, color: "var(--cth-command-muted)", margin: 0, textAlign: "center" }}>
 Loading Mail Suite…
 </p>
 </Panel>
 ) : activeView === "messages" ? (
 <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(260px, 0.7fr) minmax(280px, 1fr) minmax(360px, 1.3fr)" }}>
 <Panel
 eyebrow="Mailboxes"
 title="Where to look"
 padding={18}
 >
 <div style={{ display: "grid", gap: 4 }}>
 {visibleMailboxes.map((item) => (
 <MailboxButton
 key={item.id}
 item={item}
 active={activeBox === item.id}
 count={mailboxCounts[item.id] || 0}
 onClick={() => setActiveBox(item.id)}
 />
 ))}
 </div>
 </Panel>

 <Panel
 eyebrow="Message List"
 title={MAILBOXES.find((m) => m.id === activeBox)?.label || "Messages"}
 subtitle={`${filteredMessages.length} ${filteredMessages.length === 1 ? "result" : "results"}`}
 padding={18}
 >
 {messagesEmpty ? (
 <EmptyState
 icon={Mail}
 title={query.trim() ? "No matching messages" : "No messages yet"}
 body={
 query.trim()
 ? "Try a different search term."
 : "Connect a mailbox or send a campaign to begin collecting messages."
 }
 />
 ) : (
 <div style={{ display: "grid", gap: 8, maxHeight: 620, overflowY: "auto", paddingRight: 4 }}>
 {filteredMessages.map((message) => {
 const id = String(message.id || message.subject || message.preview);
 return (
 <MessageRow
 key={id}
 message={message}
 active={
 String(
 selectedMessage?.id || selectedMessage?.subject || selectedMessage?.preview
 ) === id
 }
 onClick={() => setSelectedMessageId(id)}
 />
 );
 })}
 </div>
 )}
 </Panel>

 {messagesEmpty ? (
 <div />
 ) : (
 <MessageDetail message={selectedMessage} activeMailbox={activeBox} />
 )}
 </div>
 ) : (
 <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(280px, 1fr) minmax(360px, 1.3fr)" }}>
 <Panel
 eyebrow="Click Signals"
 title="Tracked clicks"
 subtitle={`${filteredClicks.length} ${filteredClicks.length === 1 ? "result" : "results"}`}
 padding={18}
 >
 {clicksEmpty ? (
 <EmptyState
 icon={MousePointerClick}
 title={query.trim() ? "No matching click signals" : "No click signals yet"}
 body={
 query.trim()
 ? "Try a different search term."
 : "Drop a tracked link into an email or post to start collecting clicks."
 }
 />
 ) : (
 <div style={{ display: "grid", gap: 8, maxHeight: 620, overflowY: "auto", paddingRight: 4 }}>
 {filteredClicks.map((signal) => (
 <ClickSignalRow
 key={signal.id}
 signal={signal}
 active={String(selectedClick?.id) === String(signal.id)}
 onClick={() => setSelectedClickId(String(signal.id))}
 />
 ))}
 </div>
 )}
 </Panel>

 {clicksEmpty ? <div /> : <ClickSignalDetail signal={selectedClick} />}
 </div>
 )}
 </div>

 <MailDrawer
 open={activeDrawer === "templates"}
 onOpenChange={(open) => setActiveDrawer(open ? "templates" : "")}
 eyebrow="Library"
 title="Templates and Automations"
 description="Use proven flows without crowding the main mailbox."
 >
 <div style={{ display: "grid", gap: 14 }} className="xl:grid-cols-2">
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
 <EmptyState
 icon={Sparkles}
 title="No templates loaded"
 body={loading ? "Loading automation templates…" : "Templates will appear here once published."}
 />
 )}
 </div>
 </MailDrawer>

 <MailDrawer
 open={activeDrawer === "tracking"}
 onOpenChange={(open) => setActiveDrawer(open ? "tracking" : "")}
 eyebrow="Links"
 title="Tracking Links"
 description="Create and manage links used in emails, campaigns, and follow-up sequences."
 >
 <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(280px, 0.85fr) minmax(320px, 1.15fr)" }}>
 <Panel eyebrow="New" title="Create tracked link" subtitle="Make a link measurable before placing it." padding={18}>
 <form onSubmit={handleCreateTrackingLink} style={{ display: "grid", gap: 12 }}>
 <input
 name="label"
 value={trackingForm.label}
 onChange={handleTrackingFormChange}
 placeholder="Example: Book the diagnostic"
 style={INPUT_STYLE}
 />
 <input
 name="target_url"
 value={trackingForm.target_url}
 onChange={handleTrackingFormChange}
 placeholder="https://coretruthhouse.com/brand-diagnostic"
 style={INPUT_STYLE}
 />
 <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
 <input
 name="campaign_id"
 value={trackingForm.campaign_id}
 onChange={handleTrackingFormChange}
 placeholder="Campaign ID (optional)"
 style={INPUT_STYLE}
 />
 <input
 name="automation_id"
 value={trackingForm.automation_id}
 onChange={handleTrackingFormChange}
 placeholder="Automation ID (optional)"
 style={INPUT_STYLE}
 />
 </div>
 <button
 type="submit"
 disabled={creatingLink}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: creatingLink ? 0.7 : 1 }}
 >
 <Plus size={14} /> {creatingLink ? "Creating…" : "Create Tracked Link"}
 </button>
 </form>
 </Panel>

 <Panel
 eyebrow="Activity"
 title="Tracking links"
 subtitle="Created links across emails, automations, and campaigns."
 padding={18}
 action={
 <button
 type="button"
 onClick={() => loadMailSuite({ silent: true })}
 disabled={refreshing}
 style={{ ...SECONDARY_BUTTON_STYLE, opacity: refreshing ? 0.7 : 1 }}
 >
 <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
 Refresh
 </button>
 }
 >
 <div style={{ marginBottom: 12, position: "relative" }}>
 <Search
 size={14}
 style={{
 position: "absolute",
 left: 12,
 top: "50%",
 transform: "translateY(-50%)",
 color: "var(--cth-command-muted)",
 pointerEvents: "none",
 }}
 />
 <input
 value={trackingQuery}
 onChange={(e) => setTrackingQuery(e.target.value)}
 placeholder="Search tracking links"
 style={{ ...INPUT_STYLE, paddingLeft: 32 }}
 />
 </div>

 {filteredTrackingLinks.length ? (
 <div style={{ display: "grid", gap: 10 }}>
 {filteredTrackingLinks.map((link) => (
 <TrackingLinkRow
 key={link.id || link.tracking_id}
 link={link}
 onCopy={handleCopy}
 copyingUrl={copyingUrl}
 />
 ))}
 </div>
 ) : (
 <EmptyState
 icon={Link2}
 title={trackingQuery.trim() ? "No matching links" : "No tracked links yet"}
 body={
 trackingQuery.trim()
 ? "Try a different search term."
 : "Create one, then place it in an email, launch flow, or campaign."
 }
 />
 )}
 </Panel>
 </div>
 </MailDrawer>

 <MailDrawer
 open={activeDrawer === "settings"}
 onOpenChange={(open) => setActiveDrawer(open ? "settings" : "")}
 eyebrow="Connections"
 title="Mail Settings"
 description="Connect providers and manage the communication layer."
 >
 <MailIntegrationsSettings />
 </MailDrawer>

 <Toast toast={toast} />
 </DashboardLayout>
 );
}
