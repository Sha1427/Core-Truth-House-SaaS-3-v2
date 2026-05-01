import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
 CalendarDays,
 ChevronLeft,
 ChevronRight,
 Clock,
 Loader2,
 MapPin,
 Plus,
 RefreshCw,
 Search,
 Trash2,
 Users,
 X,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const CTH_PAGE_COLORS = {
 darkest: "var(--cth-admin-bg)",
 darker: "var(--cth-admin-panel-alt)",
 cardBg: "var(--cth-admin-panel)",
 crimson: "var(--cth-command-crimson)",
 cinnabar: "var(--cth-command-crimson)",
 tuscany: "var(--cth-admin-tuscany)",
 ruby: "var(--cth-admin-ruby)",
 textPrimary: "var(--cth-admin-ink)",
 textSecondary: "var(--cth-admin-ruby)",
 textMuted: "var(--cth-admin-ink-soft, var(--cth-admin-muted))",
 border: "var(--cth-admin-border)",
 accent: "var(--cth-command-crimson)",
 sidebarStart: "var(--cth-admin-sidebar-start)",
 sidebarEnd: "var(--cth-admin-sidebar-end)",
 sidebarHover: "var(--cth-admin-sidebar-hover)",
 panel: "var(--cth-admin-panel)",
 appBg: "var(--cth-admin-bg)",
};

const CATEGORY_FALLBACKS = {
 general: { name: "General", color: "var(--cth-admin-muted)" },
 meeting: { name: "Meeting", color: "var(--cth-command-crimson)" },
 launch: { name: "Launch", color: "var(--cth-brand-primary)" },
 content: { name: "Content", color: "var(--cth-admin-ruby)" },
 deadline: { name: "Deadline", color: "var(--cth-status-danger)" },
 personal: { name: "Personal", color: "var(--cth-status-success-bright)" },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_EVENT = {
 title: "",
 description: "",
 start_time: "",
 end_time: "",
 all_day: false,
 location: "",
 color: "var(--cth-command-crimson)",
 category: "general",
 recurring: "",
 reminders: [],
 attendees: [],
};

function toLocalInputValue(isoString) {
 if (!isoString) return "";
 const date = new Date(isoString);
 if (Number.isNaN(date.getTime())) return "";
 const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
 return local.toISOString().slice(0, 16);
}

function fromLocalInputValue(value) {
 if (!value) return null;
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return null;
 return date.toISOString();
}

function formatEventTime(event) {
 if (!event?.start_time) return "No time set";

 const start = new Date(event.start_time);
 if (Number.isNaN(start.getTime())) return "Invalid time";

 if (event.all_day) {
 return "All day";
 }

 const startLabel = start.toLocaleTimeString([], {
 hour: "numeric",
 minute: "2-digit",
 });

 if (!event.end_time) {
 return startLabel;
 }

 const end = new Date(event.end_time);
 if (Number.isNaN(end.getTime())) {
 return startLabel;
 }

 const endLabel = end.toLocaleTimeString([], {
 hour: "numeric",
 minute: "2-digit",
 });

 return `${startLabel} to ${endLabel}`;
}

function getMonthMatrix(year, month) {
 const firstDay = new Date(year, month, 1);
 const startOffset = firstDay.getDay();
 const firstVisible = new Date(year, month, 1 - startOffset);

 const days = [];
 for (let i = 0; i < 42; i += 1) {
 const date = new Date(firstVisible);
 date.setDate(firstVisible.getDate() + i);
 days.push(date);
 }

 return days;
}

function sameDay(a, b) {
 return (
 a.getFullYear() === b.getFullYear() &&
 a.getMonth() === b.getMonth() &&
 a.getDate() === b.getDate()
 );
}

function isoDay(date) {
 return date.toISOString().slice(0, 10);
}

function chipStyle(categoryMeta) {
 const color = categoryMeta?.color || "var(--cth-admin-muted)";
 return {
 background: `${color}20`,
 border: `1px solid ${color}35`,
 color,
 };
}

function EventChip({ event, categoryMeta, onOpen }) {
 const attendeeCount = event?.attendees?.length || 0;

 return (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 onOpen(event);
 }}
 className="w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium"
 style={chipStyle(categoryMeta)}
 title={event.title}
 >
 <div className="flex items-center gap-1">
 <span className="truncate">{event.title}</span>
 {attendeeCount > 0 ? <span className="opacity-70">· {attendeeCount}</span> : null}
 </div>
 </button>
 );
}

function EventModal({
 open,
 mode,
 draft,
 categories,
 saving,
 deleting,
 error,
 onClose,
 onChange,
 onSave,
 onDelete,
}) {
 if (!open) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
 <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
 <div
 className="relative z-10 w-full max-w-2xl rounded-2xl p-5"
 style={{
 background: "var(--cth-admin-panel)",
 border: "1px solid var(--cth-admin-border)",
 }}
 >
 <div className="mb-4 flex items-center justify-between">
 <div>
 <h3 className="m-0 text-lg font-semibold cth-heading">
 {mode === "create" ? "Create event" : "Edit event"}
 </h3>
 <p className="mt-1 mb-0 text-sm cth-muted">
 Save calendar events inside the active workspace.
 </p>
 </div>

 <button type="button" onClick={onClose} className="cth-muted">
 <X size={18} />
 </button>
 </div>

 {error ? (
 <div
 className="mb-4 rounded-xl px-4 py-3 text-sm"
 style={{
 background: "rgba(224,78,53,0.10)",
 border: "1px solid rgba(224,78,53,0.25)",
 color: "var(--cth-command-crimson)",
 }}
 >
 {error}
 </div>
 ) : null}

 <div className="grid gap-4 md:grid-cols-2">
 <div className="md:col-span-2">
 <label className="mb-2 block text-sm cth-muted">Title</label>
 <input
 value={draft.title}
 onChange={(e) => onChange("title", e.target.value)}
 className="cth-input w-full rounded-xl px-3 py-3"
 style={{
 background: "var(--cth-admin-panel-alt)",
 border: "1px solid var(--cth-admin-border)",
 color: "var(--cth-admin-ink)",
 }}
 />
 </div>

 <div>
 <label className="mb-2 block text-sm cth-muted">Category</label>
 <select
 value={draft.category}
 onChange={(e) => {
 const selectedId = e.target.value;
 const selectedCategory = categories.find((item) => item.id === selectedId);
 onChange("category", selectedId);
 if (selectedCategory?.color) {
 onChange("color", selectedCategory.color);
 }
 }}
 className="cth-select w-full rounded-xl px-3 py-3"
 style={{
 background: "var(--cth-admin-panel-alt)",
 border: "1px solid var(--cth-admin-border)",
 color: "var(--cth-admin-ink)",
 }}
 >
 {categories.map((item) => (
 <option key={item.id} value={item.id}>
 {item.name}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="mb-2 block text-sm cth-muted">Color</label>
 <div className="flex items-center gap-3">
 <input
 type="color"
 value={draft.color || "var(--cth-command-crimson)"}
 onChange={(e) => onChange("color", e.target.value)}
 className="h-11 w-14 rounded-lg border-0 bg-transparent"
 />
 <span className="text-sm cth-muted">{draft.color || "var(--cth-command-crimson)"}</span>
 </div>
 </div>

 <div>
 <label className="mb-2 block text-sm cth-muted">Start</label>
 <input
 type="datetime-local"
 value={toLocalInputValue(draft.start_time)}
 onChange={(e) => onChange("start_time", fromLocalInputValue(e.target.value))}
 className="cth-input w-full rounded-xl px-3 py-3"
 style={{
 background: "var(--cth-admin-panel-alt)",
 border: "1px solid var(--cth-admin-border)",
 color: "var(--cth-admin-ink)",
 colorScheme: "light",
 }}
 />
 </div>

 <div>
 <label className="mb-2 block text-sm cth-muted">End</label>
 <input
 type="datetime-local"
 value={toLocalInputValue(draft.end_time)}
 onChange={(e) => onChange("end_time", fromLocalInputValue(e.target.value))}
 className="w-full rounded-xl px-3 py-3 cth-heading"
 style={{
 background: "var(--cth-admin-panel-alt)",
 border: "1px solid var(--cth-admin-border)",
 colorScheme: "dark",
 }}
 />
 </div>

 <div>
 <label className="mb-2 block text-sm cth-muted">Location</label>
 <input
 value={draft.location || ""}
 onChange={(e) => onChange("location", e.target.value)}
 className="w-full rounded-xl px-3 py-3 cth-heading"
 style={{
 background: "var(--cth-admin-panel-alt)",
 border: "1px solid var(--cth-admin-border)",
 }}
 />
 </div>

 <div>
 <label className="mb-2 block text-sm cth-muted">Recurring</label>
 <select
 value={draft.recurring || ""}
 onChange={(e) => onChange("recurring", e.target.value)}
 className="w-full rounded-xl px-3 py-3 cth-heading"
 style={{
 background: "var(--cth-admin-panel-alt)",
 border: "1px solid var(--cth-admin-border)",
 }}
 >
 <option value="">None</option>
 <option value="daily">Daily</option>
 <option value="weekly">Weekly</option>
 <option value="monthly">Monthly</option>
 <option value="yearly">Yearly</option>
 </select>
 </div>

 <div className="md:col-span-2">
 <label className="mb-2 block text-sm cth-muted">Description</label>
 <textarea
 rows={5}
 value={draft.description || ""}
 onChange={(e) => onChange("description", e.target.value)}
 className="w-full rounded-xl px-3 py-3 cth-heading"
 style={{
 background: "var(--cth-admin-panel-alt)",
 border: "1px solid var(--cth-admin-border)",
 }}
 />
 </div>
 </div>

 <div className="mt-5 flex items-center justify-between gap-3">
 <div>
 {mode === "edit" ? (
 <button
 type="button"
 disabled={deleting}
 onClick={onDelete}
 className="inline-flex items-center gap-2 rounded-xl px-4 py-2"
 style={{
 background: "rgba(180,67,67,0.10)",
 border: "1px solid rgba(180,67,67,0.24)",
 color: "var(--cth-danger)",
 opacity: deleting ? 0.7 : 1,
 }}
 >
 {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
 Delete
 </button>
 ) : null}
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={onClose}
 className="cth-button-secondary rounded-xl px-4 py-2" 
 >
 Cancel
 </button>
 <button
 type="button"
 disabled={saving}
 onClick={onSave}
 className="cth-button-primary rounded-xl px-4 py-2 font-semibold"
 style={{ opacity: saving ? 0.7 : 1 }}
 >
 {saving ? "Saving..." : mode === "create" ? "Create Event" : "Save Changes"}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}

function EventListCard({ title, icon: Icon, events, categories, emptyText, onOpen }) {
 return (
 <div
 className="rounded-2xl p-4 cth-card"
 style={{
 background: "var(--cth-admin-panel)",
 border: "1px solid var(--cth-admin-border)",
 }}
 >
 <div className="mb-3 flex items-center gap-2">
 <Icon size={16} className="cth-text-accent" />
 <h3 className="m-0 text-base font-semibold cth-heading">{title}</h3>
 </div>

 {events.length === 0 ? (
 <div className="rounded-xl px-4 py-5 text-sm cth-muted" style={{ background: "var(--cth-admin-panel-alt)" }}>
 {emptyText}
 </div>
 ) : (
 <div className="grid gap-3">
 {events.map((event) => {
 const categoryMeta =
 categories.find((item) => item.id === event.category) ||
 CATEGORY_FALLBACKS[event.category] ||
 CATEGORY_FALLBACKS.general;

 return (
 <button
 key={event.id}
 type="button"
 onClick={() => onOpen(event)}
 className="rounded-xl px-4 py-3 text-left cth-card-muted"
 style={{ background: "var(--cth-admin-panel-alt)" }}
 >
 <div className="mb-1 flex items-center justify-between gap-2">
 <div className="truncate text-sm font-semibold cth-heading">{event.title}</div>
 <span
 className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
 style={chipStyle(categoryMeta)}
 >
 {categoryMeta.name}
 </span>
 </div>

 <div className="mb-1 flex items-center gap-2 text-xs cth-muted">
 <Clock size={12} />
 <span>{formatEventTime(event)}</span>
 </div>

 {event.location ? (
 <div className="mb-1 flex items-center gap-2 text-xs cth-muted">
 <MapPin size={12} />
 <span className="truncate">{event.location}</span>
 </div>
 ) : null}

 {(event.attendees || []).length > 0 ? (
 <div className="flex items-center gap-2 text-xs cth-muted">
 <Users size={12} />
 <span>{event.attendees.length} attendees</span>
 </div>
 ) : null}
 </button>
 );
 })}
 </div>
 )}
 </div>
 );
}

export default function Calendar() {
 const { activeWorkspaceId } = useWorkspace();
 const colors = CTH_PAGE_COLORS;

 const today = new Date();
 const [viewDate, setViewDate] = useState(
 new Date(today.getFullYear(), today.getMonth(), 1)
 );

 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);

 const [categories, setCategories] = useState(
 Object.entries(CATEGORY_FALLBACKS).map(([id, value]) => ({
 id,
 name: value.name,
 color: value.color,
 }))
 );
 const [events, setEvents] = useState([]);
 const [eventsByDay, setEventsByDay] = useState({});
 const [todayEvents, setTodayEvents] = useState([]);
 const [upcomingEvents, setUpcomingEvents] = useState([]);
 const [analytics, setAnalytics] = useState(null);

 const [search, setSearch] = useState("");
 const [selectedEvent, setSelectedEvent] = useState(null);
 const [modalMode, setModalMode] = useState("create");
 const [draft, setDraft] = useState(DEFAULT_EVENT);
 const [modalOpen, setModalOpen] = useState(false);
 const [saveBusy, setSaveBusy] = useState(false);
 const [deleteBusy, setDeleteBusy] = useState(false);
 const [pageError, setPageError] = useState("");
 const [modalError, setModalError] = useState("");

 const monthLabel = viewDate.toLocaleDateString([], {
 month: "long",
 year: "numeric",
 });

 const days = useMemo(
 () => getMonthMatrix(viewDate.getFullYear(), viewDate.getMonth()),
 [viewDate, activeWorkspaceId]
 );

 const filteredEventsByDay = useMemo(() => {
 if (!search.trim()) return eventsByDay;
 const q = search.trim().toLowerCase();

 const filtered = {};
 Object.entries(eventsByDay).forEach(([day, items]) => {
 filtered[day] = (items || []).filter((event) => {
 return (
 event.title?.toLowerCase().includes(q) ||
 event.description?.toLowerCase().includes(q) ||
 event.location?.toLowerCase().includes(q)
 );
 });
 });
 return filtered;
 }, [eventsByDay, search]);

 const loadCalendar = useCallback(
 async ({ silent = false } = {}) => {
 if (silent) setRefreshing(true);
 else setLoading(true);

 setPageError("");

 try {
 const year = viewDate.getFullYear();
 const month = viewDate.getMonth() + 1;

 const requestOptions = {
 params: {
 workspace_id: activeWorkspaceId,
 },
 };

 const [monthRes, todayRes, upcomingRes, analyticsRes, categoriesRes] =
 await Promise.all([
 apiClient.get(API_PATHS.calendar.eventsMonth(year, month), requestOptions),
 apiClient.get(API_PATHS.calendar.eventsToday, requestOptions),
 apiClient.get(API_PATHS.calendar.upcoming, requestOptions),
 apiClient.get(API_PATHS.calendar.analytics, requestOptions),
 apiClient.get(API_PATHS.calendar.categories, requestOptions).catch(() => null),
 ]);

 setEvents(monthRes?.events || []);
 setEventsByDay(monthRes?.events_by_day || {});
 setTodayEvents(todayRes?.events || []);
 setUpcomingEvents(upcomingRes?.events || []);
 setAnalytics(analyticsRes || null);

 if (categoriesRes?.categories?.length) {
 setCategories(categoriesRes.categories);
 }
 } catch (error) {
 console.error("Failed to load calendar", error);
 setPageError(error?.message || "Failed to load calendar.");
 } finally {
 setLoading(false);
 setRefreshing(false);
 }
 },
 [viewDate]
 );

 useEffect(() => {
 loadCalendar();
 }, [loadCalendar]);

 const openCreateForDate = (date) => {
 const start = new Date(date);
 start.setHours(9, 0, 0, 0);

 const end = new Date(date);
 end.setHours(10, 0, 0, 0);

 setModalMode("create");
 setSelectedEvent(null);
 setDraft({
 ...DEFAULT_EVENT,
 start_time: start.toISOString(),
 end_time: end.toISOString(),
 });
 setModalError("");
 setModalOpen(true);
 };

 const openEdit = (event) => {
 setModalMode("edit");
 setSelectedEvent(event);
 setDraft({
 ...DEFAULT_EVENT,
 ...event,
 recurring: event?.recurring || "",
 reminders: event?.reminders || [],
 attendees: event?.attendees || [],
 });
 setModalError("");
 setModalOpen(true);
 };

 const closeModal = () => {
 setModalOpen(false);
 setSelectedEvent(null);
 setDraft(DEFAULT_EVENT);
 setModalError("");
 };

 const updateDraft = (key, value) => {
 setDraft((current) => ({
 ...current,
 [key]: value,
 }));
 };

 const validateDraft = () => {
 if (!String(draft.title || "").trim()) {
 throw new Error("Event title is required.");
 }
 if (!draft.start_time) {
 throw new Error("Start time is required.");
 }
 if (draft.end_time && new Date(draft.end_time) < new Date(draft.start_time)) {
 throw new Error("End time must be after start time.");
 }
 };

 const handleSave = async () => {
 setModalError("");

 try {
 validateDraft();
 setSaveBusy(true);

 const payload = {
 title: draft.title.trim(),
 description: draft.description?.trim() || null,
 start_time: draft.start_time,
 end_time: draft.end_time || null,
 all_day: Boolean(draft.all_day),
 location: draft.location?.trim() || null,
 color: draft.color || "var(--cth-command-crimson)",
 category: draft.category || "general",
 recurring: draft.recurring || null,
 reminders: Array.isArray(draft.reminders) ? draft.reminders : [],
 attendees: Array.isArray(draft.attendees) ? draft.attendees : [],
 };

 if (modalMode === "create") {
 await apiClient.post(API_PATHS.calendar.events, payload);
 } else if (selectedEvent?.id) {
 await apiClient.put(API_PATHS.calendar.eventById(selectedEvent.id), payload);
 }

 closeModal();
 await loadCalendar({ silent: true });
 } catch (error) {
 console.error("Failed to save calendar event", error);
 setModalError(error?.message || "Failed to save event.");
 } finally {
 setSaveBusy(false);
 }
 };

 const handleDelete = async () => {
 if (!selectedEvent?.id) return;

 const confirmed = window.confirm("Delete this event?");
 if (!confirmed) return;

 setModalError("");

 try {
 setDeleteBusy(true);
 await apiClient.delete(API_PATHS.calendar.eventById(selectedEvent.id));
 closeModal();
 await loadCalendar({ silent: true });
 } catch (error) {
 console.error("Failed to delete event", error);
 setModalError(error?.message || "Failed to delete event.");
 } finally {
 setDeleteBusy(false);
 }
 };

 return (
 <DashboardLayout>
 <TopBar
 title="Calendar"
 subtitle="Plan your launches, meetings, content, and deadlines."
 />

 <EventModal
 open={modalOpen}
 mode={modalMode}
 draft={draft}
 categories={categories}
 saving={saveBusy}
 deleting={deleteBusy}
 error={modalError}
 onClose={closeModal}
 onChange={updateDraft}
 onSave={handleSave}
 onDelete={handleDelete}
 />

 <div className="px-4 py-5 md:px-7">
 {pageError ? (
 <div
 className="mb-4 rounded-xl px-4 py-3 text-sm"
 style={{
 background: "rgba(224,78,53,0.10)",
 border: "1px solid rgba(224,78,53,0.25)",
 color: "var(--cth-command-crimson)",
 }}
 >
 {pageError}
 </div>
 ) : null}

 <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_340px]">
 <div
 className="rounded-2xl p-4"
 style={{
 background: colors.cardBg,
 border: `1px solid ${colors.tuscany}15`,
 }}
 >
 <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() =>
 setViewDate(
 new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
 )
 }
 className="rounded-xl p-2 cth-heading"
 style={{ background: "var(--cth-admin-panel-alt)" }}
 >
 <ChevronLeft size={16} />
 </button>

 <div className="min-w-[180px] text-center text-lg font-semibold cth-heading">
 {monthLabel}
 </div>

 <button
 type="button"
 onClick={() =>
 setViewDate(
 new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
 )
 }
 className="rounded-xl p-2 cth-heading"
 style={{ background: "var(--cth-admin-panel-alt)" }}
 >
 <ChevronRight size={16} />
 </button>
 </div>

 <div className="flex items-center gap-2">
 <div className="relative">
 <Search
 size={14}
 className="absolute left-3 top-1/2 -translate-y-1/2 cth-heading/40"
 />
 <input
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search events"
 className="rounded-xl py-2 pl-9 pr-3 text-sm cth-heading"
 style={{
 background: "var(--cth-admin-panel-alt)",
 border: "1px solid var(--cth-admin-border)",
 }}
 />
 </div>

 <button
 type="button"
 onClick={() => loadCalendar({ silent: true })}
 className="inline-flex items-center gap-2 rounded-xl px-3 py-2 cth-heading"
 style={{ background: "var(--cth-admin-panel-alt)" }}
 >
 {refreshing ? (
 <Loader2 size={15} className="animate-spin" />
 ) : (
 <RefreshCw size={15} />
 )}
 </button>

 <button
 type="button"
 onClick={() => openCreateForDate(new Date())}
 className="inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold cth-heading"
 className="cth-button-primary rounded-xl px-4 py-2 font-semibold"
 >
 <Plus size={15} />
 New Event
 </button>
 </div>
 </div>

 {loading ? (
 <div className="flex min-h-[420px] items-center justify-center">
 <Loader2 size={24} className="animate-spin cth-text-accent" />
 </div>
 ) : (
 <div>
 <div className="mb-2 grid grid-cols-7 gap-2">
 {DAY_NAMES.map((day) => (
 <div
 key={day}
 className="rounded-lg px-2 py-2 text-center text-xs font-bold uppercase tracking-wide cth-muted"
 >
 {day}
 </div>
 ))}
 </div>

 <div className="grid grid-cols-7 gap-2">
 {days.map((date) => {
 const dayKey = isoDay(date);
 const dayEvents = filteredEventsByDay[dayKey] || [];
 const inMonth = date.getMonth() === viewDate.getMonth();
 const isToday = sameDay(date, new Date());

 return (
 <button
 key={dayKey}
 type="button"
 onClick={() => openCreateForDate(date)}
 className="min-h-[120px] rounded-xl p-2 text-left align-top"
 style={{
 background: inMonth ? "var(--cth-admin-panel-alt)" : "rgba(43,16,64,0.04)",
 border: isToday
 ? "1px solid rgba(224,78,53,0.45)"
 : "1px solid var(--cth-admin-panel-alt)",
 }}
 >
 <div
 className="mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
 style={{
 background: isToday ? "var(--cth-command-crimson)" : "transparent",
 color: isToday ? "var(--cth-white)" : inMonth ? "var(--cth-admin-ink)" : "var(--cth-admin-muted)",
 }}
 >
 {date.getDate()}
 </div>

 <div className="grid gap-1">
 {dayEvents.slice(0, 4).map((event) => {
 const categoryMeta =
 categories.find((item) => item.id === event.category) ||
 CATEGORY_FALLBACKS[event.category] ||
 CATEGORY_FALLBACKS.general;

 return (
 <EventChip
 key={event.id}
 event={event}
 categoryMeta={categoryMeta}
 onOpen={openEdit}
 />
 );
 })}

 {dayEvents.length > 4 ? (
 <div className="px-1 text-[11px] cth-heading/45">
 +{dayEvents.length - 4} more
 </div>
 ) : null}
 </div>
 </button>
 );
 })}
 </div>
 </div>
 )}
 </div>

 <div className="grid gap-4">
 <div
 className="rounded-2xl p-4"
 style={{
 background: colors.cardBg,
 border: `1px solid ${colors.tuscany}15`,
 }}
 >
 <div className="mb-3 flex items-center gap-2">
 <CalendarDays size={16} className="cth-text-accent" />
 <h3 className="m-0 text-base font-semibold cth-heading">Calendar Snapshot</h3>
 </div>

 <div className="grid gap-3">
 <div className="rounded-xl px-4 py-3" style={{ background: "var(--cth-admin-panel-alt)" }}>
 <div className="text-xs uppercase tracking-wide cth-heading/50">Total Events</div>
 <div className="mt-1 text-xl font-bold cth-heading">
 {analytics?.total_events ?? events.length}
 </div>
 </div>

 <div className="rounded-xl px-4 py-3" style={{ background: "var(--cth-admin-panel-alt)" }}>
 <div className="text-xs uppercase tracking-wide cth-heading/50">This Month</div>
 <div className="mt-1 text-xl font-bold cth-heading">
 {analytics?.events_this_month ?? 0}
 </div>
 </div>

 <div className="rounded-xl px-4 py-3" style={{ background: "var(--cth-admin-panel-alt)" }}>
 <div className="text-xs uppercase tracking-wide cth-heading/50">Next 7 Days</div>
 <div className="mt-1 text-xl font-bold cth-heading">
 {analytics?.upcoming_7_days ?? upcomingEvents.length}
 </div>
 </div>
 </div>
 </div>

 <EventListCard
 title="Today"
 icon={Clock}
 events={todayEvents}
 categories={categories}
 emptyText="No events scheduled for today."
 onOpen={openEdit}
 />

 <EventListCard
 title="Upcoming"
 icon={CalendarDays}
 events={upcomingEvents}
 categories={categories}
 emptyText="No upcoming events yet."
 onOpen={openEdit}
 />
 </div>
 </div>
 </div>
 </DashboardLayout>
 );
}
