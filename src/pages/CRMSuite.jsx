import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
 BarChart3,
 DollarSign,
 Loader2,
 Plus,
 RefreshCw,
 Search,
 Trash2,
 Users,
 Activity,
 FileText,
 BriefcaseBusiness,
 TrendingUp,
 X,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const EMPTY_SUMMARY = {
 contacts: 0,
 deals: 0,
 open_deals: 0,
 open_pipeline_dollars: 0,
 won_revenue_dollars: 0,
};

const CONTACT_STATUS_OPTIONS = ["lead", "prospect", "customer", "inactive"];
const DEAL_STAGE_OPTIONS = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];
const DEAL_STATUS_OPTIONS = ["open", "active", "won", "closed_won", "lost", "closed_lost"];
const ACTIVITY_TYPE_OPTIONS = ["call", "email", "meeting", "task", "note"];
const ACTIVITY_STATUS_OPTIONS = ["planned", "completed", "cancelled"];

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

const SMALL_INPUT_STYLE = {
 ...INPUT_STYLE,
 padding: "8px 12px",
 fontSize: 13,
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
};

const DESTRUCTIVE_BUTTON_STYLE = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 gap: 8,
 padding: "10px 16px",
 borderRadius: 4,
 background: "var(--cth-command-crimson)",
 color: "var(--cth-command-ivory)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 border: "none",
 cursor: "pointer",
};

const DESTRUCTIVE_OUTLINE_STYLE = {
 ...SECONDARY_BUTTON_STYLE,
 color: "var(--cth-command-crimson)",
 border: "1px solid var(--cth-command-crimson)",
};

const EYEBROW_STYLE = {
 fontFamily: SANS,
 fontSize: 11,
 fontWeight: 600,
 letterSpacing: "0.18em",
 textTransform: "uppercase",
 color: "var(--cth-command-muted)",
};

function currency(value) {
 const amount = Number(value || 0);
 return amount.toLocaleString("en-US", {
 style: "currency",
 currency: "USD",
 maximumFractionDigits: 0,
 });
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

function toInputDate(value) {
 if (!value) return "";
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return "";
 return date.toISOString().slice(0, 10);
}

function fromInputDate(value) {
 if (!value) return null;
 const date = new Date(`${value}T12:00:00`);
 if (Number.isNaN(date.getTime())) return null;
 return date.toISOString();
}

function dealStageAccent(stage) {
 const s = String(stage || "").toLowerCase();
 if (s === "qualified") return "var(--cth-command-gold)";
 if (s === "proposal" || s === "negotiation") return "var(--cth-command-purple)";
 if (s === "won" || s === "lost") return "var(--cth-command-crimson)";
 return "var(--cth-command-muted)";
}

function EmptyValue({ label = "Not set" }) {
 return (
 <span style={{ fontStyle: "italic", color: "var(--cth-command-muted)" }}>{label}</span>
 );
}

function MetricTile({ icon: Icon, label, value, accent }) {
 return (
 <div
 style={{
 ...PANEL_STYLE,
 padding: "20px 22px",
 display: "flex",
 flexDirection: "column",
 gap: 14,
 }}
 >
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
 <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
 <span
 style={{
 fontFamily: SERIF,
 fontSize: 36,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 lineHeight: 1,
 }}
 >
 {value}
 </span>
 {Icon ? <Icon size={18} style={{ color: "var(--cth-command-muted)" }} /> : null}
 </div>
 </div>
 );
}

function Panel({ eyebrow, title, subtitle, action, children, padding = 24 }) {
 return (
 <section style={{ ...PANEL_STYLE, padding }}>
 <div
 style={{
 display: "flex",
 flexWrap: "wrap",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 marginBottom: 20,
 }}
 >
 <div>
 {eyebrow ? <div style={EYEBROW_STYLE}>{eyebrow}</div> : null}
 <h2
 style={{
 fontFamily: SERIF,
 fontSize: 22,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: eyebrow ? "6px 0 0" : 0,
 letterSpacing: "-0.005em",
 lineHeight: 1.2,
 }}
 >
 {title}
 </h2>
 {subtitle ? (
 <p
 style={{
 fontFamily: SANS,
 fontSize: 14,
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
 {children}
 </section>
 );
}

function EmptyState({ text }) {
 return (
 <div
 style={{
 background: "var(--cth-command-panel-soft)",
 border: "1px dashed var(--cth-command-border)",
 borderRadius: 4,
 padding: "18px 16px",
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-muted)",
 }}
 >
 {text}
 </div>
 );
}

function Chip({ children, tone = "default" }) {
 const tones = {
 default: {
 background: "rgba(175,0,42,0.10)",
 border: "1px solid rgba(175,0,42,0.22)",
 color: "var(--cth-command-crimson)",
 },
 muted: {
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 color: "var(--cth-command-muted)",
 },
 success: {
 background: "rgba(34,135,90,0.12)",
 border: "1px solid rgba(34,135,90,0.28)",
 color: "#15803d",
 },
 gold: {
 background: "rgba(196,169,91,0.18)",
 border: "1px solid rgba(196,169,91,0.40)",
 color: "var(--cth-command-purple)",
 },
 };
 const style = tones[tone] || tones.default;
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

function FieldLabel({ children }) {
 return (
 <label style={{ ...EYEBROW_STYLE, display: "block", fontSize: 11, marginBottom: 6 }}>
 {children}
 </label>
 );
}

function LabeledInput({ label, value, onChange, placeholder, type = "text" }) {
 return (
 <div>
 {label ? <FieldLabel>{label}</FieldLabel> : null}
 <input
 type={type}
 value={value}
 onChange={onChange}
 placeholder={placeholder}
 style={INPUT_STYLE}
 />
 </div>
 );
}

function LabeledSelect({ label, value, onChange, options }) {
 return (
 <div>
 {label ? <FieldLabel>{label}</FieldLabel> : null}
 <select value={value} onChange={onChange} style={INPUT_STYLE}>
 {options.map((option) => (
 <option key={option} value={option}>
 {option}
 </option>
 ))}
 </select>
 </div>
 );
}

function IconButton({ onClick, label, tone = "muted", children }) {
 const [hover, setHover] = useState(false);
 const baseColor = tone === "muted" ? "var(--cth-command-muted)" : "var(--cth-command-crimson)";
 const hoverColor = tone === "muted" ? "var(--cth-command-crimson)" : "var(--cth-command-crimson)";
 return (
 <button
 type="button"
 aria-label={label}
 onClick={onClick}
 onMouseEnter={() => setHover(true)}
 onMouseLeave={() => setHover(false)}
 style={{
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 width: 32,
 height: 32,
 borderRadius: 4,
 background: "transparent",
 border: `1px solid ${hover ? "var(--cth-command-border)" : "transparent"}`,
 color: hover ? hoverColor : baseColor,
 cursor: "pointer",
 transition: "color 150ms ease, border-color 150ms ease",
 }}
 >
 {children}
 </button>
 );
}

function DealCard({ deal, onOpen, onDelete }) {
 const [hover, setHover] = useState(false);
 const accent = dealStageAccent(deal.stage);
 return (
 <div
 role="button"
 tabIndex={0}
 onClick={() => onOpen(deal)}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === " ") {
 e.preventDefault();
 onOpen(deal);
 }
 }}
 onMouseEnter={() => setHover(true)}
 onMouseLeave={() => setHover(false)}
 style={{
 background: "var(--cth-command-panel)",
 border: `1px solid ${hover ? "var(--cth-command-crimson)" : "var(--cth-command-border)"}`,
 borderLeft: `3px solid ${accent}`,
 borderRadius: 4,
 padding: "14px 16px",
 cursor: "pointer",
 transition: "border-color 150ms ease",
 }}
 >
 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
 <div style={{ minWidth: 0 }}>
 <div
 style={{
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 whiteSpace: "nowrap",
 overflow: "hidden",
 textOverflow: "ellipsis",
 }}
 >
 {deal.title || "Untitled deal"}
 </div>
 <div
 style={{
 fontFamily: SANS,
 fontSize: 12,
 color: "var(--cth-command-muted)",
 marginTop: 4,
 whiteSpace: "nowrap",
 overflow: "hidden",
 textOverflow: "ellipsis",
 }}
 >
 {deal.company || "No company"}
 </div>
 </div>
 <span onClick={(e) => e.stopPropagation()}>
 <IconButton
 label="Delete deal"
 onClick={(e) => {
 e.stopPropagation();
 onDelete(deal);
 }}
 >
 <Trash2 size={14} />
 </IconButton>
 </span>
 </div>

 <div
 style={{
 fontFamily: SERIF,
 fontSize: 22,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 marginBottom: 10,
 lineHeight: 1.1,
 }}
 >
 {currency(deal.value || 0)}
 </div>

 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {deal.stage ? <Chip>{deal.stage}</Chip> : null}
 {deal.close_date ? <Chip tone="muted">{formatDate(deal.close_date)}</Chip> : null}
 </div>
 </div>
 );
}

function QuickAddCard({ title, icon: Icon, eyebrow, children }) {
 return (
 <div style={{ ...PANEL_STYLE, padding: 20 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
 <div
 style={{
 width: 32,
 height: 32,
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 background: "var(--cth-command-panel-soft)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 color: "var(--cth-command-crimson)",
 }}
 >
 <Icon size={15} />
 </div>
 <div>
 {eyebrow ? <div style={{ ...EYEBROW_STYLE, fontSize: 10, letterSpacing: "0.2em" }}>{eyebrow}</div> : null}
 <div
 style={{
 fontFamily: SERIF,
 fontSize: 16,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 marginTop: eyebrow ? 2 : 0,
 }}
 >
 {title}
 </div>
 </div>
 </div>
 {children}
 </div>
 );
}

function ConfirmDeleteModal({ confirm, busy, onCancel, onConfirm }) {
 if (!confirm) return null;
 const { type, name } = confirm;
 const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Record";
 return (
 <div
 role="presentation"
 onClick={onCancel}
 style={{
 position: "fixed",
 inset: 0,
 zIndex: 60,
 background: "rgba(13, 0, 16, 0.6)",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 padding: 16,
 }}
 >
 <div
 role="dialog"
 aria-modal="true"
 onClick={(e) => e.stopPropagation()}
 style={{
 width: "100%",
 maxWidth: 480,
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 padding: 28,
 boxShadow: "0 30px 60px rgba(13,0,16,0.25)",
 }}
 >
 <h3
 style={{
 fontFamily: SERIF,
 fontSize: 22,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: 0,
 letterSpacing: "-0.005em",
 }}
 >
 Delete {typeLabel}
 </h3>
 <p
 style={{
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-muted)",
 margin: "12px 0 24px",
 lineHeight: 1.55,
 }}
 >
 This will permanently delete{" "}
 <strong style={{ color: "var(--cth-command-ink)", fontWeight: 600 }}>
 {name || `this ${type}`}
 </strong>
 . This cannot be undone.
 </p>
 <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
 <button type="button" onClick={onCancel} disabled={busy} style={{ ...SECONDARY_BUTTON_STYLE, opacity: busy ? 0.6 : 1 }}>
 Cancel
 </button>
 <button
 type="button"
 onClick={onConfirm}
 disabled={busy}
 style={{ ...DESTRUCTIVE_BUTTON_STYLE, opacity: busy ? 0.7 : 1 }}
 >
 {busy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
 Delete
 </button>
 </div>
 </div>
 </div>
 );
}

function DetailField({ label, children }) {
 return (
 <div style={{ marginBottom: 18 }}>
 <div style={{ ...EYEBROW_STYLE, marginBottom: 6 }}>{label}</div>
 <div style={{ fontFamily: SANS, fontSize: 14, color: "var(--cth-command-ink)", lineHeight: 1.5 }}>
 {children}
 </div>
 </div>
 );
}

function DetailDrawer({ drawer, onClose, onRequestDelete }) {
 const open = Boolean(drawer);
 const record = drawer?.record;
 const type = drawer?.type;

 const typeLabel = type === "deal" ? "Deal" : type === "contact" ? "Contact" : "";
 const heading = !record
 ? ""
 : type === "deal"
 ? record.title || "Untitled deal"
 : record.name || "Untitled contact";

 return (
 <>
 <div
 onClick={onClose}
 style={{
 position: "fixed",
 inset: 0,
 zIndex: 50,
 background: "rgba(13,0,16,0.4)",
 opacity: open ? 1 : 0,
 pointerEvents: open ? "auto" : "none",
 transition: "opacity 300ms ease",
 }}
 />
 <aside
 aria-hidden={!open}
 style={{
 position: "fixed",
 top: 0,
 right: 0,
 height: "100vh",
 width: "100%",
 maxWidth: 480,
 zIndex: 51,
 background: "var(--cth-command-panel)",
 borderLeft: "1px solid var(--cth-command-border)",
 boxShadow: "-30px 0 60px rgba(13,0,16,0.20)",
 transform: open ? "translateX(0)" : "translateX(100%)",
 transition: "transform 300ms ease",
 display: "flex",
 flexDirection: "column",
 }}
 >
 {record ? (
 <>
 <header
 style={{
 display: "flex",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 padding: "24px 28px",
 borderBottom: "1px solid var(--cth-command-border)",
 }}
 >
 <div style={{ minWidth: 0 }}>
 <div style={EYEBROW_STYLE}>{typeLabel}</div>
 <h3
 style={{
 fontFamily: SERIF,
 fontSize: 24,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 margin: "6px 0 0",
 letterSpacing: "-0.005em",
 lineHeight: 1.2,
 wordBreak: "break-word",
 }}
 >
 {heading}
 </h3>
 </div>
 <IconButton label="Close drawer" onClick={onClose}>
 <X size={16} />
 </IconButton>
 </header>

 <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
 {type === "deal" ? (
 <>
 <DetailField label="Name">{record.title || <EmptyValue />}</DetailField>
 <DetailField label="Value">
 {record.value != null && record.value !== "" ? currency(record.value) : <EmptyValue />}
 </DetailField>
 <DetailField label="Stage">
 {record.stage ? <Chip>{record.stage}</Chip> : <EmptyValue />}
 </DetailField>
 <DetailField label="Status">
 {record.status ? <Chip tone="muted">{record.status}</Chip> : <EmptyValue />}
 </DetailField>
 <DetailField label="Company">{record.company || <EmptyValue />}</DetailField>
 <DetailField label="Contact">
 {record.contact_name || record.contact || <EmptyValue />}
 </DetailField>
 <DetailField label="Close date">
 {record.close_date ? formatDate(record.close_date) : <EmptyValue />}
 </DetailField>
 <DetailField label="Created">
 {record.created_at ? formatDate(record.created_at) : <EmptyValue />}
 </DetailField>
 </>
 ) : (
 <>
 <DetailField label="Name">{record.name || <EmptyValue />}</DetailField>
 <DetailField label="Email">{record.email || <EmptyValue />}</DetailField>
 <DetailField label="Phone">{record.phone || <EmptyValue />}</DetailField>
 <DetailField label="Company">{record.company || <EmptyValue />}</DetailField>
 <DetailField label="Status">
 {record.status ? <Chip>{record.status}</Chip> : <EmptyValue />}
 </DetailField>
 <DetailField label="Created">
 {record.created_at ? formatDate(record.created_at) : <EmptyValue />}
 </DetailField>
 </>
 )}
 </div>

 <footer
 style={{
 padding: "20px 28px",
 borderTop: "1px solid var(--cth-command-border)",
 display: "flex",
 justifyContent: "flex-end",
 }}
 >
 <button
 type="button"
 onClick={() => onRequestDelete(type, record)}
 style={DESTRUCTIVE_OUTLINE_STYLE}
 >
 <Trash2 size={14} />
 Delete {typeLabel.toLowerCase()}
 </button>
 </footer>
 </>
 ) : null}
 </aside>
 </>
 );
}

function Toast({ toast }) {
 if (!toast) return null;
 return (
 <div
 role="status"
 aria-live="polite"
 style={{
 position: "fixed",
 bottom: 24,
 right: 24,
 zIndex: 70,
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-gold)",
 borderRadius: 4,
 padding: "12px 18px",
 boxShadow: "0 20px 40px rgba(13,0,16,0.18)",
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 500,
 color: "var(--cth-command-ink)",
 }}
 >
 {toast.message}
 </div>
 );
}

export default function CRMSuite() {
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [pageError, setPageError] = useState("");

 const [summary, setSummary] = useState(EMPTY_SUMMARY);
 const [contacts, setContacts] = useState([]);
 const [deals, setDeals] = useState([]);
 const [activities, setActivities] = useState([]);
 const [notes, setNotes] = useState([]);

 const [contactQuery, setContactQuery] = useState("");
 const [dealQuery, setDealQuery] = useState("");
 const [contactSortOrder, setContactSortOrder] = useState("newest");
 const [dealSortOrder, setDealSortOrder] = useState("newest");

 const [contactBusy, setContactBusy] = useState(false);
 const [dealBusy, setDealBusy] = useState(false);
 const [activityBusy, setActivityBusy] = useState(false);
 const [noteBusy, setNoteBusy] = useState(false);

 const [contactDraft, setContactDraft] = useState({
 name: "",
 email: "",
 company: "",
 status: "lead",
 });

 const [dealDraft, setDealDraft] = useState({
 title: "",
 company: "",
 value: "",
 stage: "lead",
 status: "open",
 close_date: "",
 });

 const [activityDraft, setActivityDraft] = useState({
 type: "call",
 title: "",
 status: "planned",
 due_date: "",
 });

 const [noteDraft, setNoteDraft] = useState({
 title: "",
 body: "",
 });

 const [deleteConfirm, setDeleteConfirm] = useState(null);
 const [deleteBusy, setDeleteBusy] = useState(false);
 const [drawer, setDrawer] = useState(null);
 const [toast, setToast] = useState(null);

 const loadCRM = useCallback(async ({ silent = false } = {}) => {
 if (silent) setRefreshing(true);
 else setLoading(true);

 setPageError("");

 try {
 const [summaryRes, contactsRes, dealsRes, activitiesRes, notesRes] = await Promise.all([
 apiClient.get(API_PATHS.crm.dashboard),
 apiClient.get(API_PATHS.crm.contacts),
 apiClient.get(API_PATHS.crm.deals),
 apiClient.get(API_PATHS.crm.activities),
 apiClient.get(API_PATHS.crm.notes),
 ]);

 setSummary(summaryRes || EMPTY_SUMMARY);
 setContacts(contactsRes?.contacts || []);
 setDeals(dealsRes?.deals || []);
 setActivities(activitiesRes?.activities || []);
 setNotes(notesRes?.notes || []);
 } catch (error) {
 console.error("Failed to load CRM", error);
 setPageError(error?.message || "Failed to load CRM.");
 } finally {
 setLoading(false);
 setRefreshing(false);
 }
 }, []);

 useEffect(() => {
 loadCRM();
 }, [loadCRM]);

 useEffect(() => {
 if (!toast) return undefined;
 const id = setTimeout(() => setToast(null), 2000);
 return () => clearTimeout(id);
 }, [toast]);

 const filteredContacts = useMemo(() => {
 const q = contactQuery.trim().toLowerCase();
 const base = q
 ? contacts.filter((item) =>
 [item.name, item.email, item.company, item.status]
 .filter(Boolean)
 .some((value) => String(value).toLowerCase().includes(q))
 )
 : contacts;

 const sorted = [...base];
 switch (contactSortOrder) {
 case "oldest":
 sorted.sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
 break;
 case "name-asc":
 sorted.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
 break;
 case "name-desc":
 sorted.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")));
 break;
 case "newest":
 default:
 sorted.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
 break;
 }
 return sorted;
 }, [contacts, contactQuery, contactSortOrder]);

 const filteredDeals = useMemo(() => {
 const q = dealQuery.trim().toLowerCase();
 const base = q
 ? deals.filter((item) =>
 [item.title, item.company, item.stage, item.status]
 .filter(Boolean)
 .some((value) => String(value).toLowerCase().includes(q))
 )
 : deals;

 const sorted = [...base];
 switch (dealSortOrder) {
 case "oldest":
 sorted.sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
 break;
 case "name-asc":
 sorted.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
 break;
 case "name-desc":
 sorted.sort((a, b) => String(b.title || "").localeCompare(String(a.title || "")));
 break;
 case "newest":
 default:
 sorted.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
 break;
 }
 return sorted;
 }, [deals, dealQuery, dealSortOrder]);

 const dealsByStage = useMemo(() => {
 const buckets = {
 lead: [],
 qualified: [],
 proposal: [],
 won: [],
 };

 filteredDeals.forEach((deal) => {
 const stage = String(deal.stage || "").toLowerCase();
 if (stage === "qualified") buckets.qualified.push(deal);
 else if (stage === "proposal" || stage === "negotiation") buckets.proposal.push(deal);
 else if (stage === "won" || stage === "lost") buckets.won.push(deal);
 else buckets.lead.push(deal);
 });

 return buckets;
 }, [filteredDeals]);

 const handleCreateContact = async (e) => {
 e.preventDefault();
 setPageError("");

 try {
 if (!contactDraft.name.trim()) {
 throw new Error("Contact name is required.");
 }

 setContactBusy(true);

 await apiClient.post(API_PATHS.crm.contacts, {
 name: contactDraft.name.trim(),
 email: contactDraft.email.trim() || null,
 company: contactDraft.company.trim() || null,
 status: contactDraft.status || "lead",
 });

 setContactDraft({
 name: "",
 email: "",
 company: "",
 status: "lead",
 });

 setContactQuery("");
 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to create contact", error);
 setPageError(error?.message || "Failed to create contact.");
 } finally {
 setContactBusy(false);
 }
 };

 const handleCreateDeal = async (e) => {
 e.preventDefault();
 setPageError("");

 try {
 if (!dealDraft.title.trim()) {
 throw new Error("Deal title is required.");
 }

 setDealBusy(true);

 await apiClient.post(API_PATHS.crm.deals, {
 title: dealDraft.title.trim(),
 company: dealDraft.company.trim() || null,
 value: Number(dealDraft.value || 0),
 stage: dealDraft.stage || "lead",
 status: dealDraft.status || "open",
 close_date: fromInputDate(dealDraft.close_date),
 });

 setDealDraft({
 title: "",
 company: "",
 value: "",
 stage: "lead",
 status: "open",
 close_date: "",
 });
 setDealQuery("");

 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to create deal", error);
 setPageError(error?.message || "Failed to create deal.");
 } finally {
 setDealBusy(false);
 }
 };

 const handleCreateActivity = async (e) => {
 e.preventDefault();
 setPageError("");

 try {
 if (!activityDraft.title.trim()) {
 throw new Error("Activity title is required.");
 }

 setActivityBusy(true);

 await apiClient.post(API_PATHS.crm.activities, {
 type: activityDraft.type || "call",
 subject: activityDraft.title.trim(),
 status: activityDraft.status || "planned",
 occurred_at: fromInputDate(activityDraft.due_date),
 details: "",
 });

 setActivityDraft({
 type: "call",
 title: "",
 status: "planned",
 due_date: "",
 });

 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to create activity", error);
 setPageError(error?.message || "Failed to create activity.");
 } finally {
 setActivityBusy(false);
 }
 };

 const handleCreateNote = async (e) => {
 e.preventDefault();
 setPageError("");

 try {
 if (!noteDraft.title.trim() && !noteDraft.body.trim()) {
 throw new Error("Add a title or note body.");
 }

 setNoteBusy(true);

 await apiClient.post(API_PATHS.crm.notes, {
 title: noteDraft.title.trim() || "Quick note",
 body: noteDraft.body.trim() || "",
 });

 setNoteDraft({
 title: "",
 body: "",
 });

 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to create note", error);
 setPageError(error?.message || "Failed to create note.");
 } finally {
 setNoteBusy(false);
 }
 };

 const requestDelete = (type, record) => {
 if (!record || !record.id) return;
 const name =
 type === "deal"
 ? record.title
 : type === "contact"
 ? record.name
 : type === "note"
 ? record.title
 : record.subject || record.title;
 setDeleteConfirm({ type, id: record.id, name: name || `this ${type}` });
 };

 const cancelDelete = () => {
 if (deleteBusy) return;
 setDeleteConfirm(null);
 };

 const confirmDelete = async () => {
 if (!deleteConfirm) return;
 const { type, id } = deleteConfirm;
 setDeleteBusy(true);
 setPageError("");
 try {
 if (type === "contact") {
 await apiClient.delete(API_PATHS.crm.contactById(id));
 } else if (type === "deal") {
 await apiClient.delete(API_PATHS.crm.dealById(id));
 } else if (type === "activity") {
 await apiClient.delete(API_PATHS.crm.activityById(id));
 } else if (type === "note") {
 await apiClient.delete(API_PATHS.crm.noteById(id));
 }
 if (drawer && drawer.record?.id === id) setDrawer(null);
 setDeleteConfirm(null);
 await loadCRM({ silent: true });
 } catch (error) {
 console.error(`Failed to delete ${type}`, error);
 setPageError(error?.message || `Failed to delete ${type}.`);
 setDeleteConfirm(null);
 } finally {
 setDeleteBusy(false);
 }
 };

 const openDealDrawer = (deal) => setDrawer({ type: "deal", record: deal });
 const openContactDrawer = (contact) => setDrawer({ type: "contact", record: contact });
 const closeDrawer = () => setDrawer(null);

 const handleManualRefresh = async () => {
 await loadCRM({ silent: true });
 setToast({ message: "CRM data refreshed" });
 };

 return (
 <DashboardLayout>
 <TopBar title="CRM" subtitle="Workspace-scoped pipeline, contacts, activity, and notes." />

 <div style={PAGE_STYLE} className="px-4 py-6 md:px-7 md:py-8">
 {pageError ? (
 <div
 style={{
 marginBottom: 16,
 padding: "12px 16px",
 borderRadius: 4,
 background: "color-mix(in srgb, var(--cth-command-crimson) 10%, var(--cth-command-panel))",
 border: "1px solid var(--cth-command-crimson)",
 color: "var(--cth-command-crimson)",
 fontFamily: SANS,
 fontSize: 14,
 }}
 >
 {pageError}
 </div>
 ) : null}

 <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
 <div>
 <div style={EYEBROW_STYLE}>Customer Relationship Manager</div>
 <p
 style={{
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-muted)",
 margin: "8px 0 0",
 }}
 >
 {loading
 ? "Loading CRM..."
 : "Built once for every workspace. Simple first, scalable later."}
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <div className="relative">
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
 value={dealQuery}
 onChange={(e) => setDealQuery(e.target.value)}
 placeholder="Search deals"
 style={{ ...SMALL_INPUT_STYLE, paddingLeft: 32, width: 200 }}
 />
 </div>

 <select
 value={dealSortOrder}
 onChange={(e) => setDealSortOrder(e.target.value)}
 style={SMALL_INPUT_STYLE}
 >
 <option value="newest">Newest First</option>
 <option value="oldest">Oldest First</option>
 <option value="name-asc">Name A-Z</option>
 <option value="name-desc">Name Z-A</option>
 </select>

 <button
 type="button"
 onClick={handleManualRefresh}
 disabled={refreshing}
 style={{ ...SECONDARY_BUTTON_STYLE, opacity: refreshing ? 0.7 : 1 }}
 >
 {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
 Refresh
 </button>
 </div>
 </div>

 <div className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
 <MetricTile icon={Users} label="Contacts" value={summary.contacts || 0} accent="var(--cth-command-purple)" />
 <MetricTile icon={BriefcaseBusiness} label="Deals" value={summary.deals || 0} accent="var(--cth-command-crimson)" />
 <MetricTile icon={BarChart3} label="Open Deals" value={summary.open_deals || 0} accent="var(--cth-command-gold)" />
 <MetricTile icon={DollarSign} label="Open Pipeline" value={currency(summary.open_pipeline_dollars || 0)} accent="var(--cth-command-purple-mid)" />
 <MetricTile icon={TrendingUp} label="Won Revenue" value={currency(summary.won_revenue_dollars || 0)} accent="var(--cth-command-crimson)" />
 </div>

 <div className="grid gap-5 xl:grid-cols-12">
 <div className="grid gap-5 xl:col-span-8">
 <Panel
 eyebrow="Pipeline"
 title="Deals Pipeline"
 subtitle="A scalable board view built from your current CRM stages."
 >
 <div className="grid gap-5 lg:grid-cols-4">
 {[
 { key: "lead", title: "Lead", accent: "var(--cth-command-muted)" },
 { key: "qualified", title: "Qualified", accent: "var(--cth-command-gold)" },
 { key: "proposal", title: "Proposal", accent: "var(--cth-command-purple)" },
 { key: "won", title: "Won / Lost", accent: "var(--cth-command-crimson)" },
 ].map((column) => (
 <div
 key={column.key}
 style={{
 ...SOFT_PANEL_STYLE,
 padding: 14,
 display: "flex",
 flexDirection: "column",
 gap: 12,
 }}
 >
 <div
 style={{
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 padding: "10px 12px",
 background: "var(--cth-command-panel)",
 border: "1px solid var(--cth-command-border)",
 borderRadius: 4,
 }}
 >
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <span
 aria-hidden="true"
 style={{
 width: 8,
 height: 8,
 borderRadius: "50%",
 background: column.accent,
 display: "inline-block",
 }}
 />
 <div>
 <div style={{ ...EYEBROW_STYLE, fontSize: 10, letterSpacing: "0.2em" }}>Stage</div>
 <div
 style={{
 fontFamily: SANS,
 fontSize: 13,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 marginTop: 2,
 }}
 >
 {column.title}
 </div>
 </div>
 </div>
 <Chip tone="muted">{dealsByStage[column.key].length}</Chip>
 </div>

 {dealsByStage[column.key].length === 0 ? (
 <EmptyState text="No deals here." />
 ) : (
 dealsByStage[column.key].map((deal) => (
 <DealCard
 key={deal.id}
 deal={deal}
 onOpen={openDealDrawer}
 onDelete={(rec) => requestDelete("deal", rec)}
 />
 ))
 )}
 </div>
 ))}
 </div>
 </Panel>

 <Panel
 eyebrow="Directory"
 title="Contacts"
 subtitle="Search and manage workspace contacts."
 action={
 <div className="flex flex-wrap items-center gap-2">
 <div className="relative">
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
 value={contactQuery}
 onChange={(e) => setContactQuery(e.target.value)}
 placeholder="Search contacts"
 style={{ ...SMALL_INPUT_STYLE, paddingLeft: 32, width: 200 }}
 />
 </div>
 <select
 value={contactSortOrder}
 onChange={(e) => setContactSortOrder(e.target.value)}
 style={SMALL_INPUT_STYLE}
 >
 <option value="newest">Newest First</option>
 <option value="oldest">Oldest First</option>
 <option value="name-asc">Name A-Z</option>
 <option value="name-desc">Name Z-A</option>
 </select>
 </div>
 }
 >
 {filteredContacts.length === 0 ? (
 <EmptyState
 text={
 contactQuery.trim()
 ? `No contacts matching "${contactQuery.trim()}"`
 : "No contacts yet."
 }
 />
 ) : (
 <div style={{ overflowX: "auto" }}>
 <table
 style={{
 minWidth: "100%",
 borderCollapse: "collapse",
 fontFamily: SANS,
 fontSize: 14,
 color: "var(--cth-command-ink)",
 textAlign: "left",
 }}
 >
 <thead>
 <tr>
 {["Name", "Email", "Company", "Status", ""].map((header, idx) => (
 <th
 key={idx}
 style={{
 ...EYEBROW_STYLE,
 padding: "10px 12px",
 borderBottom: "1px solid var(--cth-command-border)",
 fontWeight: 600,
 textAlign: idx === 4 ? "right" : "left",
 }}
 >
 {header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {filteredContacts.map((contact) => (
 <tr
 key={contact.id}
 onClick={() => openContactDrawer(contact)}
 onKeyDown={(e) => {
 if (e.key === "Enter" || e.key === " ") {
 e.preventDefault();
 openContactDrawer(contact);
 }
 }}
 tabIndex={0}
 style={{
 borderTop: "1px solid var(--cth-command-border)",
 cursor: "pointer",
 transition: "background 150ms ease",
 }}
 onMouseEnter={(e) => {
 e.currentTarget.style.background = "var(--cth-command-panel-soft)";
 }}
 onMouseLeave={(e) => {
 e.currentTarget.style.background = "transparent";
 }}
 >
 <td style={{ padding: "12px", fontWeight: 600, color: "var(--cth-command-ink)" }}>
 {contact.name || "Untitled contact"}
 </td>
 <td style={{ padding: "12px", color: "var(--cth-command-muted)" }}>
 {contact.email || <EmptyValue />}
 </td>
 <td style={{ padding: "12px", color: "var(--cth-command-muted)" }}>
 {contact.company || <EmptyValue />}
 </td>
 <td style={{ padding: "12px" }}>
 {contact.status ? <Chip>{contact.status}</Chip> : <EmptyValue />}
 </td>
 <td style={{ padding: "12px", textAlign: "right" }}>
 <span onClick={(e) => e.stopPropagation()}>
 <IconButton
 label="Delete contact"
 onClick={(e) => {
 e.stopPropagation();
 requestDelete("contact", contact);
 }}
 >
 <Trash2 size={14} />
 </IconButton>
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </Panel>
 </div>

 <div className="grid gap-5 xl:col-span-4">
 <QuickAddCard title="Contact" eyebrow="Quick Add" icon={Users}>
 <form onSubmit={handleCreateContact} style={{ display: "grid", gap: 12 }}>
 <LabeledInput
 label="Name"
 value={contactDraft.name}
 onChange={(e) => setContactDraft((s) => ({ ...s, name: e.target.value }))}
 placeholder="Contact name"
 />
 <LabeledInput
 label="Email"
 value={contactDraft.email}
 onChange={(e) => setContactDraft((s) => ({ ...s, email: e.target.value }))}
 placeholder="name@example.com"
 />
 <LabeledInput
 label="Company"
 value={contactDraft.company}
 onChange={(e) => setContactDraft((s) => ({ ...s, company: e.target.value }))}
 placeholder="Company"
 />
 <LabeledSelect
 label="Status"
 value={contactDraft.status}
 onChange={(e) => setContactDraft((s) => ({ ...s, status: e.target.value }))}
 options={CONTACT_STATUS_OPTIONS}
 />
 <button
 type="submit"
 disabled={contactBusy}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: contactBusy ? 0.7 : 1 }}
 >
 {contactBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
 Add Contact
 </button>
 </form>
 </QuickAddCard>

 <QuickAddCard title="Deal" eyebrow="Quick Add" icon={BriefcaseBusiness}>
 <form onSubmit={handleCreateDeal} style={{ display: "grid", gap: 12 }}>
 <LabeledInput
 label="Title"
 value={dealDraft.title}
 onChange={(e) => setDealDraft((s) => ({ ...s, title: e.target.value }))}
 placeholder="Deal title"
 />
 <LabeledInput
 label="Company"
 value={dealDraft.company}
 onChange={(e) => setDealDraft((s) => ({ ...s, company: e.target.value }))}
 placeholder="Company"
 />
 <LabeledInput
 label="Value (USD)"
 value={dealDraft.value}
 onChange={(e) => setDealDraft((s) => ({ ...s, value: e.target.value }))}
 placeholder="0"
 />
 <LabeledInput
 label="Close date"
 type="date"
 value={dealDraft.close_date}
 onChange={(e) => setDealDraft((s) => ({ ...s, close_date: e.target.value }))}
 />
 <LabeledSelect
 label="Stage"
 value={dealDraft.stage}
 onChange={(e) => setDealDraft((s) => ({ ...s, stage: e.target.value }))}
 options={DEAL_STAGE_OPTIONS}
 />
 <LabeledSelect
 label="Status"
 value={dealDraft.status}
 onChange={(e) => setDealDraft((s) => ({ ...s, status: e.target.value }))}
 options={DEAL_STATUS_OPTIONS}
 />
 <button
 type="submit"
 disabled={dealBusy}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: dealBusy ? 0.7 : 1 }}
 >
 {dealBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
 Add Deal
 </button>
 </form>
 </QuickAddCard>

 <QuickAddCard title="Activity" eyebrow="Quick Add" icon={Activity}>
 <form onSubmit={handleCreateActivity} style={{ display: "grid", gap: 12 }}>
 <LabeledSelect
 label="Type"
 value={activityDraft.type}
 onChange={(e) => setActivityDraft((s) => ({ ...s, type: e.target.value }))}
 options={ACTIVITY_TYPE_OPTIONS}
 />
 <LabeledSelect
 label="Status"
 value={activityDraft.status}
 onChange={(e) => setActivityDraft((s) => ({ ...s, status: e.target.value }))}
 options={ACTIVITY_STATUS_OPTIONS}
 />
 <LabeledInput
 label="Title"
 value={activityDraft.title}
 onChange={(e) => setActivityDraft((s) => ({ ...s, title: e.target.value }))}
 placeholder="Activity title"
 />
 <LabeledInput
 label="Due date"
 type="date"
 value={activityDraft.due_date}
 onChange={(e) => setActivityDraft((s) => ({ ...s, due_date: e.target.value }))}
 />
 <button
 type="submit"
 disabled={activityBusy}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: activityBusy ? 0.7 : 1 }}
 >
 {activityBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
 Add Activity
 </button>
 </form>
 </QuickAddCard>

 <QuickAddCard title="Note" eyebrow="Quick Add" icon={FileText}>
 <form onSubmit={handleCreateNote} style={{ display: "grid", gap: 12 }}>
 <LabeledInput
 label="Title"
 value={noteDraft.title}
 onChange={(e) => setNoteDraft((s) => ({ ...s, title: e.target.value }))}
 placeholder="Note title"
 />
 <div>
 <FieldLabel>Body</FieldLabel>
 <textarea
 rows={4}
 value={noteDraft.body}
 onChange={(e) => setNoteDraft((s) => ({ ...s, body: e.target.value }))}
 placeholder="Write a quick note"
 style={{ ...INPUT_STYLE, resize: "vertical" }}
 />
 </div>
 <button
 type="submit"
 disabled={noteBusy}
 style={{ ...PRIMARY_BUTTON_STYLE, opacity: noteBusy ? 0.7 : 1 }}
 >
 {noteBusy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
 Save Note
 </button>
 </form>
 </QuickAddCard>

 <Panel eyebrow="Activity" title="Recent Activity" subtitle="Latest workspace touchpoints and actions.">
 {activities.length === 0 ? (
 <EmptyState text="No activity yet." />
 ) : (
 <div style={{ display: "grid", gap: 10 }}>
 {activities.map((item) => (
 <div
 key={item.id}
 style={{ ...SOFT_PANEL_STYLE, padding: "12px 14px" }}
 >
 <div
 style={{
 display: "flex",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 marginBottom: 8,
 }}
 >
 <div
 style={{
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 }}
 >
 {item.subject || item.title || "Untitled activity"}
 </div>
 <IconButton
 label="Delete activity"
 onClick={() => requestDelete("activity", item)}
 >
 <Trash2 size={14} />
 </IconButton>
 </div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
 {item.type ? <Chip>{item.type}</Chip> : null}
 {item.status ? (
 <Chip tone={item.status === "completed" ? "success" : "muted"}>
 {item.status}
 </Chip>
 ) : null}
 {(item.occurred_at || item.due_date) && formatDate(item.occurred_at || item.due_date) ? (
 <span
 style={{
 fontFamily: SANS,
 fontSize: 11,
 color: "var(--cth-command-muted)",
 }}
 >
 {formatDate(item.occurred_at || item.due_date)}
 </span>
 ) : null}
 </div>
 </div>
 ))}
 </div>
 )}
 </Panel>

 <Panel eyebrow="Notes" title="Notes Feed" subtitle="Quick CRM notes for this workspace.">
 {notes.length === 0 ? (
 <EmptyState text="No notes yet." />
 ) : (
 <div style={{ display: "grid", gap: 10 }}>
 {notes.map((note) => (
 <div
 key={note.id}
 style={{ ...SOFT_PANEL_STYLE, padding: "12px 14px" }}
 >
 <div
 style={{
 display: "flex",
 alignItems: "flex-start",
 justifyContent: "space-between",
 gap: 12,
 marginBottom: 6,
 }}
 >
 <div
 style={{
 fontFamily: SANS,
 fontSize: 14,
 fontWeight: 600,
 color: "var(--cth-command-ink)",
 }}
 >
 {note.title || "Untitled note"}
 </div>
 <IconButton
 label="Delete note"
 onClick={() => requestDelete("note", note)}
 >
 <Trash2 size={14} />
 </IconButton>
 </div>
 <div
 style={{
 fontFamily: SANS,
 fontSize: 13,
 color: "var(--cth-command-muted)",
 whiteSpace: "pre-wrap",
 lineHeight: 1.55,
 }}
 >
 {note.body ? note.body : <EmptyValue label="No body" />}
 </div>
 {note.created_at && formatDate(note.created_at) ? (
 <div
 style={{
 marginTop: 8,
 fontFamily: SANS,
 fontSize: 11,
 color: "var(--cth-command-muted)",
 }}
 >
 {formatDate(note.created_at)}
 </div>
 ) : null}
 </div>
 ))}
 </div>
 )}
 </Panel>
 </div>
 </div>
 </div>

 <DetailDrawer drawer={drawer} onClose={closeDrawer} onRequestDelete={requestDelete} />
 <ConfirmDeleteModal
 confirm={deleteConfirm}
 busy={deleteBusy}
 onCancel={cancelDelete}
 onConfirm={confirmDelete}
 />
 <Toast toast={toast} />
 </DashboardLayout>
 );
}
