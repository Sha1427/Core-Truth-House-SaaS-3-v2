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
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

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

function currency(value) {
 const amount = Number(value || 0);
 return amount.toLocaleString("en-US", {
 style: "currency",
 currency: "USD",
 maximumFractionDigits: 0,
 });
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

function StatCard({ icon: Icon, label, value, help }) {
 return (
 <div
 className="rounded-[26px] px-5 py-4"
 style={{
 background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
 border: "1px solid rgba(255,255,255,0.10)",
 boxShadow: "0 20px 40px rgba(43,16,64,0.08)",
 }}
 >
 <div className="mb-4 flex items-center justify-between gap-3">
 <div>
 <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</div>
 <div className="mt-2 text-[1.85rem] font-semibold leading-none text-white">{value}</div>
 </div>
 <div
 className="flex h-11 w-11 items-center justify-center rounded-2xl"
 style={{
 background: "linear-gradient(180deg, rgba(224,78,53,0.20) 0%, rgba(224,78,53,0.10) 100%)",
 border: "1px solid rgba(224,78,53,0.18)",
 }}
 >
 <Icon size={18} className="text-[var(--cth-admin-accent)]" />
 </div>
 </div>
 {help ? <div className="text-xs text-white/45">{help}</div> : null}
 </div>
 );
}

function Panel({ title, subtitle, action, children }) {
 return (
 <section
 className="rounded-[28px] px-5 py-5"
 style={{
 background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)",
 border: "1px solid rgba(255,255,255,0.10)",
 boxShadow: "0 24px 50px rgba(43,16,64,0.08)",
 }}
 >
 <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
 <div>
 <h2 className="m-0 text-[1.05rem] font-semibold tracking-[-0.01em] text-white">{title}</h2>
 {subtitle ? <p className="mt-1 text-sm leading-6 text-white/48">{subtitle}</p> : null}
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
 className="rounded-xl px-4 py-5 text-sm text-white/55"
 style={{ background: "rgba(255,255,255,0.03)" }}
 >
 {text}
 </div>
 );
}

function Chip({ children, tone = "default" }) {
 const tones = {
 default: {
 background: "rgba(224,78,53,0.12)",
 border: "1px solid rgba(224,78,53,0.22)",
 color: "color-mix(in srgb, var(--cth-admin-accent) 45%, white)",
 },
 muted: {
 background: "rgba(255,255,255,0.06)",
 border: "1px solid rgba(255,255,255,0.08)",
 color: "rgba(255,255,255,0.7)",
 },
 success: {
 background: "var(--cth-status-success-soft-bg)",
 border: "1px solid rgba(34,197,94,0.2)",
 color: "color-mix(in srgb, var(--cth-status-success-bright) 55%, white)",
 },
 };

 const style = tones[tone] || tones.default;

 return (
 <span
 className="inline-flex rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide"
 style={style}
 >
 {children}
 </span>
 );
}

function LabeledInput({ value, onChange, placeholder, type = "text" }) {
 return (
 <input
 type={type}
 value={value}
 onChange={onChange}
 placeholder={placeholder}
 className="w-full rounded-xl px-3 py-3 text-white"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: "1px solid rgba(255,255,255,0.08)",
 colorScheme: "dark",
 }}
 />
 );
}

function LabeledSelect({ value, onChange, options }) {
 return (
 <select
 value={value}
 onChange={onChange}
 className="w-full rounded-xl px-3 py-3 text-white"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: "1px solid rgba(255,255,255,0.08)",
 }}
 >
 {options.map((option) => (
 <option key={option} value={option}>
 {option}
 </option>
 ))}
 </select>
 );
}

function DealCard({ deal, onDelete }) {
 return (
 <div
 className="rounded-2xl px-4 py-3"
 style={{
 background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.025) 100%)",
 border: "1px solid rgba(255,255,255,0.08)",
 boxShadow: "0 12px 28px rgba(43,16,64,0.05)",
 }}
 >
 <div className="mb-3 flex items-start justify-between gap-3">
 <div className="min-w-0">
 <div className="truncate text-sm font-semibold text-white">{deal.title || "Untitled deal"}</div>
 <div className="mt-1 truncate text-xs text-white/50">{deal.company || "No company"}</div>
 </div>
 <button
 type="button"
 onClick={() => onDelete(deal.id)}
 className="rounded-xl p-2 text-white/70"
 style={{ background: "rgba(255,255,255,0.05)" }}
 >
 <Trash2 size={14} />
 </button>
 </div>

 <div className="mb-3 text-base font-semibold text-white">{currency(deal.value || 0)}</div>

 <div className="flex flex-wrap items-center gap-2">
 {deal.status ? <Chip>{deal.status}</Chip> : null}
 {deal.close_date ? <Chip tone="muted">{formatDate(deal.close_date)}</Chip> : null}
 </div>
 </div>
 );
}

function QuickAddCard({ title, icon: Icon, children }) {
 return (
 <div
 className="rounded-[24px] px-4 py-4"
 style={{
 background: "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.025) 100%)",
 border: "1px solid rgba(255,255,255,0.09)",
 boxShadow: "0 16px 34px rgba(43,16,64,0.06)",
 }}
 >
 <div className="mb-4 flex items-center gap-3">
 <div
 className="flex h-10 w-10 items-center justify-center rounded-2xl"
 style={{
 background: "rgba(224,78,53,0.14)",
 border: "1px solid rgba(224,78,53,0.16)",
 }}
 >
 <Icon size={15} className="text-[var(--cth-admin-accent)]" />
 </div>
 <div className="text-sm font-semibold tracking-[-0.01em] text-white">{title}</div>
 </div>
 {children}
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

 const handleDeleteContact = async (contactId) => {
 const confirmed = window.confirm("Delete this contact?");
 if (!confirmed) return;

 try {
 await apiClient.delete(API_PATHS.crm.contactById(contactId));
 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to delete contact", error);
 setPageError(error?.message || "Failed to delete contact.");
 }
 };

 const handleDeleteDeal = async (dealId) => {
 const confirmed = window.confirm("Delete this deal?");
 if (!confirmed) return;

 try {
 await apiClient.delete(API_PATHS.crm.dealById(dealId));
 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to delete deal", error);
 setPageError(error?.message || "Failed to delete deal.");
 }
 };

 const handleDeleteActivity = async (activityId) => {
 const confirmed = window.confirm("Delete this activity?");
 if (!confirmed) return;

 try {
 await apiClient.delete(API_PATHS.crm.activityById(activityId));
 await loadCRM({ silent: true });
 } catch (error) {
 console.error("Failed to delete activity", error);
 setPageError(error?.message || "Failed to delete activity.");
 }
 };

 return (
 <DashboardLayout>
 <TopBar title="CRM" subtitle="Workspace-scoped pipeline, contacts, activity, and notes." />

 <div className="px-4 py-5 md:px-7">
 {pageError ? (
 <div
 className="mb-4 rounded-xl px-4 py-3 text-sm"
 style={{
 background: "rgba(224,78,53,0.10)",
 border: "1px solid rgba(224,78,53,0.25)",
 color: "var(--cth-admin-accent)",
 }}
 >
 {pageError}
 </div>
 ) : null}

 <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
 <div>
 <div className="text-sm text-white/55">
 {loading ? "Loading CRM..." : "Built once for every workspace, simple first and scalable later."}
 </div>
 </div>

 <div className="flex items-center gap-2">
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
 <input
 value={dealQuery}
 onChange={(e) => setDealQuery(e.target.value)}
 placeholder="Search deals"
 className="rounded-xl py-2 pl-9 pr-3 text-sm text-white"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: "1px solid rgba(255,255,255,0.08)",
 }}
 />
 </div>

 <select
 value={dealSortOrder}
 onChange={(e) => setDealSortOrder(e.target.value)}
 className="rounded-xl px-3 py-2 text-sm text-white"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: "1px solid rgba(255,255,255,0.08)",
 }}
 >
 <option value="newest" style={{ background: "#14021a" }}>Newest First</option>
 <option value="oldest" style={{ background: "#14021a" }}>Oldest First</option>
 <option value="name-asc" style={{ background: "#14021a" }}>Name A-Z</option>
 <option value="name-desc" style={{ background: "#14021a" }}>Name Z-A</option>
 </select>

 <button
 type="button"
 onClick={() => loadCRM({ silent: true })}
 className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
 style={{ background: "rgba(255,255,255,0.06)" }}
 >
 {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
 Refresh
 </button>
 </div>
 </div>

 <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
 <StatCard icon={Users} label="Contacts" value={summary.contacts || 0} />
 <StatCard icon={BriefcaseBusiness} label="Deals" value={summary.deals || 0} />
 <StatCard icon={BarChart3} label="Open Deals" value={summary.open_deals || 0} />
 <StatCard icon={DollarSign} label="Open Pipeline" value={currency(summary.open_pipeline_dollars || 0)} />
 <StatCard icon={DollarSign} label="Won Revenue" value={currency(summary.won_revenue_dollars || 0)} />
 </div>

 <div className="grid gap-5 xl:grid-cols-12">
 <div className="grid gap-5 xl:col-span-8">
 <Panel title="Deals Pipeline" subtitle="A scalable board view built from your current CRM stages.">
 <div className="grid gap-5 lg:grid-cols-4">
 {[
 { key: "lead", title: "Lead" },
 { key: "qualified", title: "Qualified" },
 { key: "proposal", title: "Proposal" },
 { key: "won", title: "Won / Lost" },
 ].map((column) => (
 <div
 key={column.key}
 className="space-y-4 rounded-[24px] p-4"
 style={{
 background: "linear-gradient(180deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)",
 border: "1px solid rgba(255,255,255,0.10)",
 boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
 }}
 >
 <div
 className="flex items-center justify-between rounded-2xl px-3 py-3"
 style={{
 background: "rgba(255,255,255,0.05)",
 border: "1px solid rgba(255,255,255,0.08)",
 }}
 >
 <div>
 <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
 Stage
 </div>
 <div className="mt-1 text-sm font-semibold text-white">{column.title}</div>
 </div>
 <Chip>{dealsByStage[column.key].length}</Chip>
 </div>

 {dealsByStage[column.key].length === 0 ? (
 <EmptyState text="No deals here." />
 ) : (
 dealsByStage[column.key].map((deal) => (
 <DealCard key={deal.id} deal={deal} onDelete={handleDeleteDeal} />
 ))
 )}
 </div>
 ))}
 </div>
 </Panel>

 <Panel
 title="Contacts"
 subtitle="Search and manage workspace contacts."
 action={
 <div className="flex items-center gap-2">
 <div className="relative">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
 <input
 value={contactQuery}
 onChange={(e) => setContactQuery(e.target.value)}
 placeholder="Search contacts"
 className="rounded-xl py-2 pl-9 pr-3 text-sm text-white"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: "1px solid rgba(255,255,255,0.08)",
 }}
 />
 </div>
 <select
 value={contactSortOrder}
 onChange={(e) => setContactSortOrder(e.target.value)}
 className="rounded-xl px-3 py-2 text-sm text-white"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: "1px solid rgba(255,255,255,0.08)",
 }}
 >
 <option value="newest" style={{ background: "#14021a" }}>Newest First</option>
 <option value="oldest" style={{ background: "#14021a" }}>Oldest First</option>
 <option value="name-asc" style={{ background: "#14021a" }}>Name A-Z</option>
 <option value="name-desc" style={{ background: "#14021a" }}>Name Z-A</option>
 </select>
 </div>
 }
 >
 {filteredContacts.length === 0 ? (
 <EmptyState text={contactQuery.trim() ? `No contacts matching "${contactQuery.trim()}"` : "No contacts yet."} />
 ) : (
 <div className="overflow-x-auto">
 <table className="min-w-full text-left text-sm text-white/80">
 <thead className="text-white/45">
 <tr>
 <th className="px-3 py-3 font-medium">Name</th>
 <th className="px-3 py-3 font-medium">Email</th>
 <th className="px-3 py-3 font-medium">Company</th>
 <th className="px-3 py-3 font-medium">Status</th>
 <th className="px-3 py-3 font-medium"></th>
 </tr>
 </thead>
 <tbody>
 {filteredContacts.map((contact) => (
 <tr key={contact.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
 <td className="px-3 py-3 font-medium text-white">{contact.name || "Untitled contact"}</td>
 <td className="px-3 py-3 text-white/65">{contact.email || ", "}</td>
 <td className="px-3 py-3 text-white/65">{contact.company || ", "}</td>
 <td className="px-3 py-3">{contact.status ? <Chip>{contact.status}</Chip> : ", "}</td>
 <td className="px-3 py-3 text-right">
 <button
 type="button"
 onClick={() => handleDeleteContact(contact.id)}
 className="rounded-lg p-2 text-white/70"
 style={{ background: "rgba(255,255,255,0.04)" }}
 >
 <Trash2 size={14} />
 </button>
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
 <QuickAddCard title="Contact" icon={Users}>
 <form onSubmit={handleCreateContact} className="grid gap-3">
 <LabeledInput
 value={contactDraft.name}
 onChange={(e) => setContactDraft((s) => ({ ...s, name: e.target.value }))}
 placeholder="Contact name"
 />
 <LabeledInput
 value={contactDraft.email}
 onChange={(e) => setContactDraft((s) => ({ ...s, email: e.target.value }))}
 placeholder="Email"
 />
 <LabeledInput
 value={contactDraft.company}
 onChange={(e) => setContactDraft((s) => ({ ...s, company: e.target.value }))}
 placeholder="Company"
 />
 <LabeledSelect
 value={contactDraft.status}
 onChange={(e) => setContactDraft((s) => ({ ...s, status: e.target.value }))}
 options={CONTACT_STATUS_OPTIONS}
 />
 <button
 type="submit"
 disabled={contactBusy}
 className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white"
 style={{ background: "var(--cth-admin-accent)", opacity: contactBusy ? 0.7 : 1 }}
 >
 {contactBusy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
 Add Contact
 </button>
 </form>
 </QuickAddCard>

 <QuickAddCard title="Deal" icon={BriefcaseBusiness}>
 <form onSubmit={handleCreateDeal} className="grid gap-3">
 <LabeledInput
 value={dealDraft.title}
 onChange={(e) => setDealDraft((s) => ({ ...s, title: e.target.value }))}
 placeholder="Deal title"
 />
 <LabeledInput
 value={dealDraft.company}
 onChange={(e) => setDealDraft((s) => ({ ...s, company: e.target.value }))}
 placeholder="Company"
 />
 <LabeledInput
 value={dealDraft.value}
 onChange={(e) => setDealDraft((s) => ({ ...s, value: e.target.value }))}
 placeholder="Value"
 />
 <LabeledInput
 type="date"
 value={dealDraft.close_date}
 onChange={(e) => setDealDraft((s) => ({ ...s, close_date: e.target.value }))}
 />
 <LabeledSelect
 value={dealDraft.stage}
 onChange={(e) => setDealDraft((s) => ({ ...s, stage: e.target.value }))}
 options={DEAL_STAGE_OPTIONS}
 />
 <LabeledSelect
 value={dealDraft.status}
 onChange={(e) => setDealDraft((s) => ({ ...s, status: e.target.value }))}
 options={DEAL_STATUS_OPTIONS}
 />
 <button
 type="submit"
 disabled={dealBusy}
 className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white"
 style={{ background: "var(--cth-admin-accent)", opacity: dealBusy ? 0.7 : 1 }}
 >
 {dealBusy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
 Add Deal
 </button>
 </form>
 </QuickAddCard>

 <QuickAddCard title="Activity" icon={Activity}>
 <form onSubmit={handleCreateActivity} className="grid gap-3">
 <LabeledSelect
 value={activityDraft.type}
 onChange={(e) => setActivityDraft((s) => ({ ...s, type: e.target.value }))}
 options={ACTIVITY_TYPE_OPTIONS}
 />
 <LabeledSelect
 value={activityDraft.status}
 onChange={(e) => setActivityDraft((s) => ({ ...s, status: e.target.value }))}
 options={ACTIVITY_STATUS_OPTIONS}
 />
 <LabeledInput
 value={activityDraft.title}
 onChange={(e) => setActivityDraft((s) => ({ ...s, title: e.target.value }))}
 placeholder="Activity title"
 />
 <LabeledInput
 type="date"
 value={activityDraft.due_date}
 onChange={(e) => setActivityDraft((s) => ({ ...s, due_date: e.target.value }))}
 />
 <button
 type="submit"
 disabled={activityBusy}
 className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white"
 style={{ background: "var(--cth-admin-accent)", opacity: activityBusy ? 0.7 : 1 }}
 >
 {activityBusy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
 Add Activity
 </button>
 </form>
 </QuickAddCard>

 <QuickAddCard title="Note" icon={FileText}>
 <form onSubmit={handleCreateNote} className="grid gap-3">
 <LabeledInput
 value={noteDraft.title}
 onChange={(e) => setNoteDraft((s) => ({ ...s, title: e.target.value }))}
 placeholder="Note title"
 />
 <textarea
 rows={4}
 value={noteDraft.body}
 onChange={(e) => setNoteDraft((s) => ({ ...s, body: e.target.value }))}
 placeholder="Write a quick note"
 className="w-full rounded-xl px-3 py-3 text-white"
 style={{
 background: "rgba(255,255,255,0.04)",
 border: "1px solid rgba(255,255,255,0.08)",
 }}
 />
 <button
 type="submit"
 disabled={noteBusy}
 className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white"
 style={{ background: "var(--cth-admin-accent)", opacity: noteBusy ? 0.7 : 1 }}
 >
 {noteBusy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
 Save Note
 </button>
 </form>
 </QuickAddCard>

 <Panel title="Recent Activity" subtitle="Latest workspace touchpoints and actions.">
 {activities.length === 0 ? (
 <EmptyState text="No activity yet." />
 ) : (
 <div className="grid gap-3">
 {activities.map((item) => (
 <div
 key={item.id}
 className="rounded-xl px-4 py-3"
 style={{ background: "rgba(255,255,255,0.03)" }}
 >
 <div className="mb-2 flex items-start justify-between gap-3">
 <div className="text-sm font-semibold text-white">
 {item.subject || item.title || "Untitled activity"}
 </div>
 <button
 type="button"
 onClick={() => handleDeleteActivity(item.id)}
 className="rounded-lg p-2 text-white/70"
 style={{ background: "rgba(255,255,255,0.04)" }}
 >
 <Trash2 size={14} />
 </button>
 </div>
 <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
 {item.type ? <Chip>{item.type}</Chip> : null}
 {item.status ? (
 <Chip tone={item.status === "completed" ? "success" : "default"}>{item.status}</Chip>
 ) : null}
 {(item.occurred_at || item.due_date) ? (
 <Chip>{formatDate(item.occurred_at || item.due_date)}</Chip>
 ) : null}
 </div>
 </div>
 ))}
 </div>
 )}
 </Panel>

 <Panel title="Notes Feed" subtitle="Quick CRM notes for this workspace.">
 {notes.length === 0 ? (
 <EmptyState text="No notes yet." />
 ) : (
 <div className="grid gap-3">
 {notes.map((note) => (
 <div
 key={note.id}
 className="rounded-xl px-4 py-3"
 style={{ background: "rgba(255,255,255,0.03)" }}
 >
 <div className="mb-1 text-sm font-semibold text-white">{note.title || "Untitled note"}</div>
 <div className="whitespace-pre-wrap text-sm text-white/70">{note.body || ", "}</div>
 </div>
 ))}
 </div>
 )}
 </Panel>
 </div>
 </div>
 </div>
 </DashboardLayout>
 );
}
