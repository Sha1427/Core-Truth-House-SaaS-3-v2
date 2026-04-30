import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";
import {
 AlertCircle,
 ArrowLeft,
 Bell,
 CalendarDays,
 CheckCircle2,
 Clock,
 FileText,
 ImagePlus,
 Lock,
 MessageCircle,
 Pin,
 Plus,
 RefreshCw,
 Search,
 Send,
 ShieldCheck,
 UserRound,
 Users,
 X,
} from "lucide-react";

const FALLBACK_CHANNELS = [
 {
 id: "orientation",
 name: "Welcome + Orientation",
 description: "Start here. Introduce yourself, your offer, and the brand gap you want to close first.",
 unread: 0,
 accent: "var(--cth-admin-accent)",
 },
 {
 id: "wins",
 name: "Weekly Wins",
 description: "Share proof of movement: clearer copy, stronger offers, finished assets, booked calls, and better decisions.",
 unread: 0,
 accent: "var(--cth-admin-ruby)",
 },
 {
 id: "ask",
 name: "Ask The House",
 description: "Focused questions for brand structure, content, offers, diagnostics, and implementation.",
 unread: 0,
 accent: "var(--cth-admin-ink)",
 },
 {
 id: "office-hours",
 name: "Office Hour Recaps",
 description: "Pinned summaries, replay links, action steps, and decisions made during live cohort sessions.",
 unread: 0,
 accent: "var(--cth-admin-accent)",
 },
 {
 id: "resources",
 name: "Resource Library",
 description: "Templates, replay links, worksheets, prompts, swipe files, and cohort-only references.",
 unread: 0,
 accent: "var(--cth-admin-ruby)",
 },
];

const FALLBACK_MEMBERS = [
 {
 id: "placeholder-founder",
 user_id: "placeholder-founder",
 name: "New Cohort Member",
 initials: "CM",
 role: "Founder",
 cohort: "Upcoming Cohort",
 location: "Workspace",
 timezone: "Local",
 score: 0,
 focus: "Member Access + Profiles will appear here after SuperAdmin adds cohort profile details.",
 offer: "Not added yet.",
 needs: "Not added yet.",
 tags: ["Cohort"],
 status: "Profile pending",
 profile_image_url: "",
 },
];

const FALLBACK_RESOURCES = [
 {
 id: "orientation-guide",
 title: "Cohort orientation guide",
 description: "Pinned resources will appear here after SuperAdmin adds them.",
 resource_type: "guide",
 url: "",
 },
];

const COMMUNITY_TABS = [
 {
 id: "threads",
 label: "Threads",
 description: "Questions, wins, and focused cohort discussion.",
 },
 {
 id: "members",
 label: "Members",
 description: "Founder profiles and cohort accountability.",
 },
 {
 id: "resources",
 label: "Resources",
 description: "Templates, replays, worksheets, and pinned links.",
 },
];

function classNames(...items) {
 return items.filter(Boolean).join(" ");
}

function getInitials(name, fallback = "CM") {
 const clean = String(name || "").trim();
 if (!clean) return fallback;
 const parts = clean.split(/\s+/).filter(Boolean);
 if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
 return clean.slice(0, 2).toUpperCase();
}

function formatDate(value) {
 if (!value) return "Recently";
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return "Recently";

 const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
 if (seconds < 60) return "Just now";
 if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
 if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
 if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

 return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function responseItems(response, key, fallback = []) {
 if (Array.isArray(response)) return response;
 if (Array.isArray(response?.[key])) return response[key];
 if (Array.isArray(response?.data?.[key])) return response.data[key];
 return fallback;
}

function resolveAssetUrl(path) {
 if (!path) return "";
 if (/^https?:\/\//i.test(path)) return path;
 if (typeof apiClient.buildApiUrl === "function") return apiClient.buildApiUrl(path);
 return path;
}

function normalizeChannel(channel, index) {
 const accents = ["var(--cth-admin-accent)", "var(--cth-admin-ruby)", "var(--cth-admin-ink)"];
 return {
 id: channel.id || channel.channel_id || `channel-${index}`,
 name: channel.name || channel.title || "Cohort Room",
 description: channel.description || "A guided room for cohort progress.",
 unread: Number(channel.unread || channel.unread_count || 0),
 accent: channel.accent || accents[index % accents.length],
 locked: Boolean(channel.locked),
 status: channel.status || "active",
 };
}

function normalizeThread(thread) {
 return {
 id: thread.id,
 channel_id: thread.channel_id || "orientation",
 channel: thread.channel_name || thread.channel || thread.channel_id || "Cohort Room",
 author: thread.author_name || thread.author || thread.author_user_id || "Cohort Member",
 author_user_id: thread.author_user_id || "",
 title: thread.title || "Untitled thread",
 body: thread.body || "",
 replies: Number(thread.reply_count || thread.replies || 0),
 time: formatDate(thread.updated_at || thread.created_at),
 pinned: Boolean(thread.pinned),
 featured: Boolean(thread.featured),
 hidden: Boolean(thread.hidden),
 tags: Array.isArray(thread.tags) ? thread.tags : [],
 updated_at: thread.updated_at,
 created_at: thread.created_at,
 };
}

function normalizeMessage(message) {
 return {
 id: message.id,
 body: message.body || "",
 author: message.author_name || message.author || message.author_user_id || "Cohort Member",
 author_user_id: message.author_user_id || "",
 time: formatDate(message.created_at || message.updated_at),
 created_at: message.created_at,
 };
}

function normalizeMember(member) {
 const displayName =
 member.display_name ||
 member.name ||
 member.full_name ||
 member.user_name ||
 member.email ||
 member.user_id ||
 "Cohort Member";

 return {
 id: member.id || member.user_id || displayName,
 user_id: member.user_id || member.id || displayName,
 name: displayName,
 initials: member.initials || getInitials(displayName),
 role: member.role || "Founder",
 cohort: member.cohort_stage || member.cohort || "Cohort Member",
 location: member.location || "Workspace",
 timezone: member.timezone || "Local",
 score: Number(member.score || member.brand_score || 0),
 focus: member.focus || "Focus has not been added yet.",
 offer: member.offer || "Offer has not been added yet.",
 needs: member.needs_support_with || member.needs || "Support need has not been added yet.",
 tags: Array.isArray(member.tags) && member.tags.length ? member.tags : ["Cohort"],
 status: member.status || (member.updated_at ? `Updated ${formatDate(member.updated_at)}` : "Active"),
 profile_image_url: member.profile_image_url || "",
 };
}

function normalizeResource(resource, index) {
 return {
 id: resource.id || `resource-${index}`,
 title: resource.title || resource.name || "Cohort resource",
 description: resource.description || "",
 url: resource.url || "",
 resource_type: resource.resource_type || "link",
 pinned: resource.pinned !== false,
 };
}

function StatCard({ label, value, note }) {
 return (
 <article className="cth-card rounded-[28px] border border-[var(--cth-admin-border)] p-5 shadow-[0_18px_44px_rgba(43,16,64,0.08)]">
 <p className="text-[10px] font-bold uppercase tracking-[0.22em] cth-muted">{label}</p>
 <p className="mt-3 font-serif text-4xl font-semibold cth-heading">{value}</p>
 <p className="mt-2 text-sm leading-6 cth-muted">{note}</p>
 </article>
 );
}

function Avatar({ member, size = 56 }) {
 const imageUrl = resolveAssetUrl(member?.profile_image_url);

 if (imageUrl) {
 return (
 <img
 src={imageUrl}
 alt={member?.name || "Cohort member"}
 className="shrink-0 rounded-full object-cover"
 style={{ width: size, height: size }}
 />
 );
 }

 return (
 <div
 className="grid shrink-0 place-items-center rounded-full bg-[var(--cth-admin-ink)] font-serif font-semibold text-white"
 style={{ width: size, height: size, fontSize: Math.max(14, size * 0.33) }}
 >
 {member?.initials || "CM"}
 </div>
 );
}

function MemberProfileCard({ member, active, onSelect }) {
 return (
 <button
 type="button"
 onClick={() => onSelect(member)}
 className={classNames(
 "w-full rounded-[28px] border p-5 text-left transition-all",
 active
 ? "border-[var(--cth-admin-accent)] bg-[#fffaf7] shadow-[0_18px_44px_rgba(43,16,64,0.10)]"
 : "border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] hover:border-[var(--cth-admin-accent)]/45"
 )}
 >
 <div className="flex items-start gap-4">
 <Avatar member={member} size={56} />
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-3">
 <div>
 <h3 className="font-serif text-xl font-semibold leading-tight cth-heading">{member.name}</h3>
 <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">
 {member.role}
 </p>
 </div>
 <span className="rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-1 text-[10px] font-bold cth-muted">
 {member.score || "New"}
 </span>
 </div>
 <p className="mt-3 text-sm leading-6 cth-muted">{member.focus}</p>
 </div>
 </div>

 <div className="mt-5 flex flex-wrap gap-2">
 {member.tags.map((tag) => (
 <span
 key={tag}
 className="rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-3 py-1 text-[11px] font-semibold text-[var(--cth-admin-ruby)]"
 >
 {tag}
 </span>
 ))}
 </div>
 </button>
 );
}

function ChannelCard({ channel, active, onSelect }) {
 return (
 <button
 type="button"
 onClick={() => onSelect(channel.id)}
 className={classNames(
 "w-full rounded-[24px] border p-4 text-left transition-all",
 active
 ? "border-[var(--cth-admin-accent)] bg-[#fffaf7] shadow-[0_14px_34px_rgba(43,16,64,0.08)]"
 : "border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] hover:border-[var(--cth-admin-accent)]/45"
 )}
 >
 <div className="flex items-start gap-3">
 <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: channel.accent }} />
 <div className="min-w-0 flex-1">
 <div className="flex items-center justify-between gap-3">
 <h3 className="font-serif text-lg font-semibold cth-heading">{channel.name}</h3>
 {channel.locked ? <Lock size={14} className="cth-muted" /> : null}
 </div>
 <p className="mt-2 text-sm leading-6 cth-muted">{channel.description}</p>
 </div>
 </div>
 </button>
 );
}

function SuperAdminCommunityPanel({
 onRefresh,
 onCreateChannel,
 onCreateResource,
 onSaveMember,
 onAvatarUpload,
 selectedMember,
 creating,
}) {
 const [channelForm, setChannelForm] = useState({
 name: "",
 description: "",
 order: 100,
 locked: false,
 });

 const [resourceForm, setResourceForm] = useState({
 title: "",
 description: "",
 url: "",
 resource_type: "link",
 order: 100,
 });

 const [memberForm, setMemberForm] = useState({
 user_id: selectedMember?.user_id || "",
 display_name: selectedMember?.name || "",
 role: selectedMember?.role || "",
 cohort_stage: selectedMember?.cohort || "",
 location: selectedMember?.location || "",
 timezone: selectedMember?.timezone || "",
 focus: selectedMember?.focus || "",
 offer: selectedMember?.offer || "",
 needs_support_with: selectedMember?.needs || "",
 tags: selectedMember?.tags?.join(", ") || "",
 });

 const avatarInputRef = useRef(null);

 useEffect(() => {
 setMemberForm({
 user_id: selectedMember?.user_id || "",
 display_name: selectedMember?.name || "",
 role: selectedMember?.role || "",
 cohort_stage: selectedMember?.cohort || "",
 location: selectedMember?.location || "",
 timezone: selectedMember?.timezone || "",
 focus: selectedMember?.focus || "",
 offer: selectedMember?.offer || "",
 needs_support_with: selectedMember?.needs || "",
 tags: selectedMember?.tags?.join(", ") || "",
 });
 }, [selectedMember]);

 return (
 <section className="mb-7 rounded-[34px] border border-[rgba(224,78,53,0.28)] bg-[linear-gradient(135deg,rgba(224,78,53,0.12),rgba(248,244,242,0.92))] p-5 shadow-[0_24px_70px_rgba(43,16,64,0.08)] md:p-6">
 <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
 <div className="max-w-2xl">
 <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--cth-admin-accent)]">
 SuperAdmin Administration
 </p>
 <h2 className="mt-2 font-serif text-3xl font-semibold cth-heading">
 Control the cohort without exposing admin tools to tenants.
 </h2>
 <p className="mt-3 text-sm leading-6 cth-muted">
 Purchased slots can enroll members automatically. SuperAdmin can still add manual, comped, internal, or testing access here without exposing admin tools to tenants.
 </p>
 <div className="mt-4 rounded-[20px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-4 text-sm leading-6 cth-muted">
 <strong className="cth-heading">Access model:</strong> Purchased slot equals automatic member access. SuperAdmin manual add equals override, comp, internal access, or testing.
 </div>
 </div>

 <button
 type="button"
 onClick={onRefresh}
 className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(224,78,53,0.24)] bg-[rgba(224,78,53,0.10)] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--cth-admin-accent)]"
 >
 <RefreshCw size={14} /> Refresh data
 </button>
 </div>

 <div className="mt-6 grid gap-4 xl:grid-cols-3">
 <article className="rounded-[26px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-5">
 <h3 className="font-serif text-xl font-semibold cth-heading">Create cohort room</h3>
 <div className="mt-4 space-y-3">
 <input className="cth-input w-full" placeholder="Room name" value={channelForm.name} onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })} />
 <textarea className="cth-input min-h-[90px] w-full" placeholder="Room description" value={channelForm.description} onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })} />
 <label className="flex items-center gap-2 text-sm cth-muted">
 <input type="checkbox" checked={channelForm.locked} onChange={(e) => setChannelForm({ ...channelForm, locked: e.target.checked })} />
 Lock room
 </label>
 <button
 type="button"
 disabled={!channelForm.name.trim() || creating}
 onClick={() => onCreateChannel(channelForm, () => setChannelForm({ name: "", description: "", order: 100, locked: false }))}
 className="rounded-full bg-[var(--cth-admin-accent)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
 >
 Add room
 </button>
 </div>
 </article>

 <article className="rounded-[26px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-5">
 <h3 className="font-serif text-xl font-semibold cth-heading">Pin resource</h3>
 <div className="mt-4 space-y-3">
 <input className="cth-input w-full" placeholder="Resource title" value={resourceForm.title} onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })} />
 <input className="cth-input w-full" placeholder="Resource URL" value={resourceForm.url} onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })} />
 <textarea className="cth-input min-h-[90px] w-full" placeholder="Description" value={resourceForm.description} onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })} />
 <button
 type="button"
 disabled={!resourceForm.title.trim() || creating}
 onClick={() => onCreateResource(resourceForm, () => setResourceForm({ title: "", description: "", url: "", resource_type: "link", order: 100 }))}
 className="rounded-full bg-[var(--cth-admin-accent)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
 >
 Pin resource
 </button>
 </div>
 </article>

 <article className="rounded-[26px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-5">
 <h3 className="font-serif text-xl font-semibold cth-heading">Member Access + Profile</h3>
 <div className="mt-4 space-y-3">
 <input className="cth-input w-full" placeholder="User ID for manual or purchased-slot member" value={memberForm.user_id} onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })} />
 <p className="text-xs leading-5 cth-muted">
 Use this for SuperAdmin manual adds, comped seats, internal access, or testing. Purchased cohort slots can be enrolled automatically later and edited here after access exists.
 </p>
 <input className="cth-input w-full" placeholder="Display name" value={memberForm.display_name} onChange={(e) => setMemberForm({ ...memberForm, display_name: e.target.value })} />
 <input className="cth-input w-full" placeholder="Role" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })} />
 <input className="cth-input w-full" placeholder="Cohort stage" value={memberForm.cohort_stage} onChange={(e) => setMemberForm({ ...memberForm, cohort_stage: e.target.value })} />
 <input className="cth-input w-full" placeholder="Location" value={memberForm.location} onChange={(e) => setMemberForm({ ...memberForm, location: e.target.value })} />
 <input className="cth-input w-full" placeholder="Timezone" value={memberForm.timezone} onChange={(e) => setMemberForm({ ...memberForm, timezone: e.target.value })} />
 <textarea className="cth-input min-h-[80px] w-full" placeholder="Focus" value={memberForm.focus} onChange={(e) => setMemberForm({ ...memberForm, focus: e.target.value })} />
 <textarea className="cth-input min-h-[80px] w-full" placeholder="Offer" value={memberForm.offer} onChange={(e) => setMemberForm({ ...memberForm, offer: e.target.value })} />
 <textarea className="cth-input min-h-[80px] w-full" placeholder="Needs support with" value={memberForm.needs_support_with} onChange={(e) => setMemberForm({ ...memberForm, needs_support_with: e.target.value })} />
 <input className="cth-input w-full" placeholder="Tags, comma separated" value={memberForm.tags} onChange={(e) => setMemberForm({ ...memberForm, tags: e.target.value })} />

 <input
 ref={avatarInputRef}
 type="file"
 accept="image/png,image/jpeg,image/webp,image/gif"
 className="hidden"
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (file && memberForm.user_id) onAvatarUpload(memberForm.user_id, file);
 e.target.value = "";
 }}
 />

 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 disabled={!memberForm.user_id.trim() || creating}
 onClick={() => onSaveMember(memberForm)}
 className="rounded-full bg-[var(--cth-admin-accent)] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
 >
 Save member access
 </button>
 <button
 type="button"
 disabled={!memberForm.user_id.trim() || creating}
 onClick={() => avatarInputRef.current?.click()}
 className="inline-flex items-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-2 text-xs font-bold cth-heading disabled:opacity-50"
 >
 <ImagePlus size={14} /> Upload image
 </button>
 </div>
 </div>
 </article>
 </div>
 </section>
 );
}

function ThreadDrawer({ thread, messages, loading, reply, setReply, posting, onPostReply, onClose }) {
 if (!thread) return null;

 return (
 <div className="fixed inset-0 z-[1100] flex justify-end bg-[rgba(13,0,16,0.50)] p-3 backdrop-blur-md md:p-5">
 <section className="flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-[32px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] shadow-[0_30px_90px_rgba(43,16,64,0.30)]">
 <header className="border-b border-[var(--cth-admin-border)] bg-[linear-gradient(135deg,#fffaf7_0%,#f8f4f2_58%,rgba(224,78,53,0.10)_130%)] p-5 md:p-6">
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0">
 <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--cth-admin-ruby)]">
 Cohort Thread
 </p>
 <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight cth-heading md:text-3xl">
 {thread.title}
 </h2>
 <p className="mt-3 max-w-2xl text-sm leading-6 cth-muted">{thread.body}</p>

 <div className="mt-4 flex flex-wrap items-center gap-3 text-xs cth-muted">
 <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-1">
 <UserRound size={13} /> {thread.author}
 </span>
 <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-1">
 <MessageCircle size={13} /> {messages.length || thread.replies || 0} replies
 </span>
 <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-1">
 <Clock size={13} /> {thread.time}
 </span>
 </div>
 </div>

 <button
 type="button"
 onClick={onClose}
 className="shrink-0 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-2 text-[var(--cth-admin-ink)] transition hover:border-[var(--cth-admin-accent)]/45"
 aria-label="Close thread"
 >
 <X size={18} />
 </button>
 </div>
 </header>

 <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">
 {loading ? (
 <div className="rounded-[24px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-5 text-sm cth-muted">
 Loading replies...
 </div>
 ) : messages.length ? (
 <div className="space-y-3">
 {messages.map((message) => (
 <article
 key={message.id}
 className="rounded-[24px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-4 shadow-[0_10px_28px_rgba(43,16,64,0.04)]"
 >
 <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs cth-muted">
 <span className="inline-flex items-center gap-2 font-semibold cth-heading">
 <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--cth-admin-ink)] font-serif text-[11px] text-white">
 {String(message.author || "CM").slice(0, 2).toUpperCase()}
 </span>
 {message.author}
 </span>
 <span>{message.time}</span>
 </div>
 <p className="whitespace-pre-wrap text-sm leading-6 cth-heading">{message.body}</p>
 </article>
 ))}
 </div>
 ) : (
 <div className="rounded-[26px] border border-dashed border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-6 text-center">
 <p className="font-serif text-2xl font-semibold cth-heading">No replies yet.</p>
 <p className="mx-auto mt-2 max-w-md text-sm leading-6 cth-muted">
 Start the thread with one clear next step, answer, or question.
 </p>
 </div>
 )}
 </div>

 <footer className="border-t border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-4 md:p-5">
 <label className="cth-label">Add a focused reply</label>
 <textarea
 value={reply}
 onChange={(event) => setReply(event.target.value)}
 className="cth-input mt-2 min-h-[96px] w-full resize-y rounded-[22px]"
 placeholder="Share a helpful answer, next step, resource, or clarification..."
 />
 <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <p className="text-xs leading-5 cth-muted">
 Keep replies useful, calm, and tied to the cohort outcome.
 </p>
 <button
 type="button"
 onClick={onPostReply}
 disabled={!reply.trim() || posting}
 className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--cth-admin-accent)] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(224,78,53,0.18)] disabled:opacity-50"
 >
 {posting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
 {posting ? "Posting..." : "Post Reply"}
 </button>
 </div>
 </footer>
 </section>
 </div>
 );
}

export default function CommunityPage() {
 const navigate = useNavigate();
 const { isSuperAdmin } = usePlan();

 const [channels, setChannels] = useState(FALLBACK_CHANNELS);
 const [threads, setThreads] = useState([]);
 const [members, setMembers] = useState(FALLBACK_MEMBERS);
 const [resources, setResources] = useState(FALLBACK_RESOURCES);

 const [activeChannel, setActiveChannel] = useState("orientation");
 const [activeCommunityTab, setActiveCommunityTab] = useState("threads");
 const [selectedMember, setSelectedMember] = useState(FALLBACK_MEMBERS[0]);
 const [selectedThread, setSelectedThread] = useState(null);
 const [messages, setMessages] = useState([]);

 const [threadTitle, setThreadTitle] = useState("");
 const [draft, setDraft] = useState("");
 const [replyDraft, setReplyDraft] = useState("");

 const [loading, setLoading] = useState(true);
 const [messagesLoading, setMessagesLoading] = useState(false);
 const [posting, setPosting] = useState(false);
 const [creating, setCreating] = useState(false);
 const [showSuperAdminTools, setShowSuperAdminTools] = useState(false);
 const [error, setError] = useState("");
 const [lastSyncedAt, setLastSyncedAt] = useState(null);

 const activeChannelName = useMemo(() => {
 return channels.find((channel) => channel.id === activeChannel)?.name || "Cohort Room";
 }, [activeChannel, channels]);

 const visibleThreads = useMemo(() => {
 return threads.filter((thread) => !activeChannel || thread.channel_id === activeChannel);
 }, [threads, activeChannel]);

 const loadCommunityData = useCallback(async ({ silent = false } = {}) => {
 if (!silent) setLoading(true);
 setError("");

 try {
 const [channelsRes, threadsRes, resourcesRes, membersRes] = await Promise.all([
 apiClient.get("/api/community/channels"),
 apiClient.get("/api/community/threads"),
 apiClient.get("/api/community/resources"),
 apiClient.get("/api/community/members"),
 ]);

 const nextChannels = responseItems(channelsRes, "channels", FALLBACK_CHANNELS).map(normalizeChannel);
 const nextThreads = responseItems(threadsRes, "threads", []).map(normalizeThread);
 const nextResources = responseItems(resourcesRes, "resources", FALLBACK_RESOURCES).map(normalizeResource);
 const nextMembers = responseItems(membersRes, "members", FALLBACK_MEMBERS).map(normalizeMember);

 setChannels(nextChannels.length ? nextChannels : FALLBACK_CHANNELS);
 setThreads(nextThreads);
 setResources(nextResources.length ? nextResources : FALLBACK_RESOURCES);
 setMembers(nextMembers.length ? nextMembers : FALLBACK_MEMBERS);
 setLastSyncedAt(new Date());

 if (nextChannels.length && !nextChannels.some((channel) => channel.id === activeChannel)) {
 setActiveChannel(nextChannels[0].id);
 }

 if (nextMembers.length) {
 setSelectedMember((current) => {
 return nextMembers.find((member) => member.id === current?.id || member.user_id === current?.user_id) || nextMembers[0];
 });
 }
 } catch (err) {
 console.error("Failed to load community data", err);
 setError(err?.message || "Community data could not be loaded yet.");
 setChannels(FALLBACK_CHANNELS);
 setResources(FALLBACK_RESOURCES);
 setMembers(FALLBACK_MEMBERS);
 } finally {
 if (!silent) setLoading(false);
 }
 }, [activeChannel]);

 const loadThreadMessages = useCallback(async (thread, { silent = false } = {}) => {
 if (!thread?.id) return;
 if (!silent) setMessagesLoading(true);

 try {
 const response = await apiClient.get(`/api/community/threads/${thread.id}/messages`);
 const nextMessages = responseItems(response, "messages", []).map(normalizeMessage);
 setMessages(nextMessages);
 } catch (err) {
 console.error("Failed to load thread messages", err);
 setError(err?.message || "Thread replies could not be loaded yet.");
 } finally {
 if (!silent) setMessagesLoading(false);
 }
 }, []);

 useEffect(() => {
 loadCommunityData();
 }, [loadCommunityData]);

 useEffect(() => {
 const timer = window.setInterval(() => {
 loadCommunityData({ silent: true });
 if (selectedThread) {
 loadThreadMessages(selectedThread, { silent: true });
 }
 }, 7000);

 return () => window.clearInterval(timer);
 }, [loadCommunityData, loadThreadMessages, selectedThread]);

 useEffect(() => {
 const onFocus = () => {
 loadCommunityData({ silent: true });
 if (selectedThread) loadThreadMessages(selectedThread, { silent: true });
 };

 window.addEventListener("focus", onFocus);
 return () => window.removeEventListener("focus", onFocus);
 }, [loadCommunityData, loadThreadMessages, selectedThread]);

 async function handleCreateThread() {
 const body = draft.trim();
 if (!body || posting) return;

 const title =
 threadTitle.trim() ||
 body
 .split("\n")
 .find(Boolean)
 ?.slice(0, 120) ||
 "Cohort update";

 setPosting(true);
 setError("");

 try {
 await apiClient.post("/api/community/threads", {
 channel_id: activeChannel,
 title,
 body,
 tags: [],
 });

 setThreadTitle("");
 setDraft("");
 await loadCommunityData();
 } catch (err) {
 console.error("Failed to create community thread", err);
 setError(err?.message || "Could not post this update yet.");
 } finally {
 setPosting(false);
 }
 }

 async function openThread(thread) {
 setSelectedThread(thread);
 setReplyDraft("");
 await loadThreadMessages(thread);
 }

 async function handlePostReply() {
 const body = replyDraft.trim();
 if (!body || !selectedThread || posting) return;

 setPosting(true);
 setError("");

 try {
 await apiClient.post(`/api/community/threads/${selectedThread.id}/messages`, { body });
 setReplyDraft("");
 await loadThreadMessages(selectedThread);
 await loadCommunityData({ silent: true });
 } catch (err) {
 console.error("Failed to post reply", err);
 setError(err?.message || "Could not post this reply yet.");
 } finally {
 setPosting(false);
 }
 }

 async function handleCreateChannel(form, reset) {
 setCreating(true);
 setError("");

 try {
 await apiClient.post("/api/community/channels", {
 name: form.name,
 description: form.description,
 order: Number(form.order || 100),
 locked: Boolean(form.locked),
 status: "active",
 });
 reset?.();
 await loadCommunityData();
 } catch (err) {
 setError(err?.message || "Could not create this room.");
 } finally {
 setCreating(false);
 }
 }

 async function handleCreateResource(form, reset) {
 setCreating(true);
 setError("");

 try {
 await apiClient.post("/api/community/resources", {
 title: form.title,
 description: form.description,
 url: form.url,
 resource_type: form.resource_type || "link",
 order: Number(form.order || 100),
 pinned: true,
 });
 reset?.();
 await loadCommunityData();
 } catch (err) {
 setError(err?.message || "Could not pin this resource.");
 } finally {
 setCreating(false);
 }
 }

 async function handleSaveMember(form) {
 const userId = String(form.user_id || "").trim();
 if (!userId) return;

 setCreating(true);
 setError("");

 try {
 await apiClient.patch(`/api/community/members/${encodeURIComponent(userId)}`, {
 display_name: form.display_name,
 role: form.role,
 cohort_stage: form.cohort_stage,
 location: form.location,
 timezone: form.timezone,
 focus: form.focus,
 offer: form.offer,
 needs_support_with: form.needs_support_with,
 tags: String(form.tags || "")
 .split(",")
 .map((tag) => tag.trim())
 .filter(Boolean),
 visible: true,
 });
 await loadCommunityData();
 } catch (err) {
 setError(err?.message || "Could not save this member profile.");
 } finally {
 setCreating(false);
 }
 }

 async function handleAvatarUpload(userId, file) {
 if (!userId || !file) return;

 setCreating(true);
 setError("");

 try {
 const formData = new FormData();
 formData.append("file", file);

 const url =
 typeof apiClient.buildApiUrl === "function"
 ? apiClient.buildApiUrl(`/api/community/members/${encodeURIComponent(userId)}/avatar`)
 : `/api/community/members/${encodeURIComponent(userId)}/avatar`;

 const headers =
 typeof apiClient.getAuthHeaders === "function"
 ? await apiClient.getAuthHeaders({ isFormData: true })
 : {};

 const response = await fetch(url, {
 method: "POST",
 headers,
 credentials: "include",
 body: formData,
 });

 if (!response.ok) {
 const text = await response.text();
 throw new Error(text || "Avatar upload failed.");
 }

 await loadCommunityData();
 } catch (err) {
 setError(err?.message || "Could not upload this profile image.");
 } finally {
 setCreating(false);
 }
 }

 return (
 <main className="min-h-screen bg-[var(--cth-app-bg)] text-[var(--cth-app-ink)]">
 <section className="px-4 py-6 md:px-7 md:py-8">
 <div className="mb-5 overflow-hidden rounded-[30px] border border-[var(--cth-admin-border)] bg-[linear-gradient(135deg,#33033C_0%,#140016_58%,#AF002A_150%)] p-5 text-white shadow-[0_22px_56px_rgba(43,16,64,0.18)] md:p-6">
 <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
 <div className="max-w-3xl">
 <div className="mb-4 flex flex-wrap items-center gap-3">
 <button
 type="button"
 onClick={() => navigate("/command-center")}
 className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80 transition hover:bg-white/15"
 >
 <ArrowLeft size={14} /> Back to SaaS
 </button>
 <p className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
 Upcoming Cohort
 </p>
 </div>
 <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
 A private room for founders building inside the House.
 </h1>
 <p className="mt-4 max-w-2xl text-sm leading-6 text-white/76">
 The community is built for progress, not noise. Members can ask focused questions, share wins,
 review cohort resources, and connect their weekly work back to the Core Truth House system.
 </p>
 </div>

 <div className="grid gap-3 rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm md:min-w-[320px]">
 <div className="flex items-center justify-between gap-4">
 <span className="text-sm text-white/70">Current room</span>
 <span className="font-semibold">{activeChannelName}</span>
 </div>
 <div className="h-px bg-white/10" />
 <div className="flex items-center justify-between gap-4">
 <span className="text-sm text-white/70">Members visible</span>
 <span className="font-semibold">{members.length} profiles</span>
 </div>
 <div className="h-px bg-white/10" />
 <div className="flex items-center justify-between gap-4">
 <span className="text-sm text-white/70">Live sync</span>
 <span className="font-semibold">{lastSyncedAt ? formatDate(lastSyncedAt) : "Starting"}</span>
 </div>
 </div>
 </div>
 </div>

 {error ? (
 <div className="mb-7 rounded-[24px] border border-[rgba(224,78,53,0.28)] bg-[rgba(224,78,53,0.08)] p-4">
 <div className="flex gap-3">
 <AlertCircle size={18} className="mt-0.5 shrink-0 text-[var(--cth-admin-accent)]" />
 <div>
 <p className="font-semibold cth-heading">Community notice</p>
 <p className="mt-1 text-sm leading-6 cth-muted">{error}</p>
 </div>
 </div>
 </div>
 ) : null}

 <div className="mb-7 grid gap-5 md:grid-cols-3">
 <StatCard label="Cohort rooms" value={channels.length} note="Guided spaces for orientation, wins, questions, resources, and recaps." />
 <StatCard label="Open threads" value={threads.length} note="Database-backed discussions connected to the cohort workspace." />
 <StatCard label="Pinned resources" value={resources.length} note="Templates, replay links, worksheets, and cohort references." />
 </div>

 {isSuperAdmin ? (
 <div className="mb-7 rounded-[28px] border border-[rgba(224,78,53,0.24)] bg-[var(--cth-admin-panel)] p-4 shadow-[0_18px_44px_rgba(43,16,64,0.08)]">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--cth-admin-accent)]">
 SuperAdmin Tools
 </p>
 <h2 className="mt-1 font-serif text-2xl font-semibold cth-heading">
 Manage community setup in a focused panel.
 </h2>
 <p className="mt-2 text-sm leading-6 cth-muted">
 Rooms, resources, member profiles, and profile images are tucked away so the cohort page stays clean.
 </p>
 </div>

 <button
 type="button"
 onClick={() => setShowSuperAdminTools(true)}
 className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--cth-admin-accent)] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_38px_rgba(224,78,53,0.20)]"
 >
 <ShieldCheck size={16} /> Open Admin Panel
 </button>
 </div>
 </div>
 ) : null}

 {isSuperAdmin && showSuperAdminTools ? (
 <div className="fixed inset-0 z-[1200] flex justify-end bg-[rgba(13,0,16,0.58)] backdrop-blur-sm">
 <section className="h-full w-full max-w-6xl overflow-y-auto border-l border-[var(--cth-admin-border)] bg-[var(--cth-admin-bg)] p-4 shadow-[0_30px_90px_rgba(43,16,64,0.34)] md:p-7">
 <div className="mb-5 flex flex-col gap-4 rounded-[28px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-5 md:flex-row md:items-start md:justify-between">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--cth-admin-accent)]">
 SuperAdmin Administration
 </p>
 <h2 className="mt-2 font-serif text-3xl font-semibold cth-heading">
 Cohort Community Admin Panel
 </h2>
 <p className="mt-2 max-w-3xl text-sm leading-6 cth-muted">
 Create rooms, pin resources, manage purchased-slot members, add manual access overrides, and upload profile images without cluttering the member-facing community.
 </p>
 </div>

 <div className="flex flex-wrap gap-2">
 <button
 type="button"
 onClick={() => navigate("/command-center")}
 className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-2 text-xs font-bold cth-heading"
 >
 <ArrowLeft size={16} /> Back to Command Center
 </button>
 <button
 type="button"
 onClick={() => setShowSuperAdminTools(false)}
 className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-2 text-xs font-bold cth-heading"
 >
 <X size={16} /> Close
 </button>
 </div>
 </div>

 <SuperAdminCommunityPanel
 onRefresh={loadCommunityData}
 onCreateChannel={handleCreateChannel}
 onCreateResource={handleCreateResource}
 onSaveMember={handleSaveMember}
 onAvatarUpload={handleAvatarUpload}
 selectedMember={selectedMember}
 creating={creating}
 />
 </section>
 </div>
 ) : null}

 <div className="mb-5 rounded-[28px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-3 shadow-[0_14px_34px_rgba(43,16,64,0.06)]">
 <div className="grid gap-3 md:grid-cols-3">
 {COMMUNITY_TABS.map((tab) => {
 const active = activeCommunityTab === tab.id;
 return (
 <button
 key={tab.id}
 type="button"
 onClick={() => setActiveCommunityTab(tab.id)}
 className={classNames(
 "rounded-[22px] border p-4 text-left transition-all",
 active
 ? "border-[var(--cth-admin-accent)] bg-[#fffaf7] shadow-[0_12px_28px_rgba(43,16,64,0.08)]"
 : "border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] hover:border-[var(--cth-admin-accent)]/45"
 )}
 >
 <p className="font-serif text-xl font-semibold cth-heading">{tab.label}</p>
 <p className="mt-1 text-xs leading-5 cth-muted">{tab.description}</p>
 </button>
 );
 })}
 </div>
 </div>

<div
 className={
 activeCommunityTab === "threads"
 ? "grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]"
 : "grid gap-6"
 }
 >
 <aside className={classNames("space-y-4", activeCommunityTab === "threads" ? "" : "hidden")}>
 <div className="cth-card rounded-[30px] border border-[var(--cth-admin-border)] p-5">
 <div className="mb-4 flex items-center justify-between gap-3">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-[0.22em] cth-muted">Rooms</p>
 <h2 className="mt-1 font-serif text-2xl font-semibold cth-heading">Cohort Channels</h2>
 </div>
 <MessageCircle size={20} className="text-[var(--cth-admin-accent)]" />
 </div>

 <div className="space-y-3">
 {channels.map((channel) => (
 <ChannelCard
 key={channel.id}
 channel={channel}
 active={activeChannel === channel.id}
 onSelect={setActiveChannel}
 />
 ))}
 </div>
 </div>

 <div className="cth-card rounded-[30px] border border-[var(--cth-admin-border)] p-5">
 <div className="mb-4 flex items-center gap-2">
 <Pin size={16} className="text-[var(--cth-admin-accent)]" />
 <h2 className="font-serif text-xl font-semibold cth-heading">Pinned Resources</h2>
 </div>

 <div className="space-y-2">
 {resources.map((resource) => {
 const content = (
 <>
 <FileText size={16} className="text-[var(--cth-admin-ruby)]" />
 <span>{resource.title}</span>
 </>
 );

 if (resource.url) {
 return (
 <a
 key={resource.id}
 href={resource.url}
 target="_blank"
 rel="noreferrer"
 className="flex w-full items-center gap-3 rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-3 text-left text-sm cth-heading transition hover:border-[var(--cth-admin-accent)]/45"
 >
 {content}
 </a>
 );
 }

 return (
 <button
 key={resource.id}
 type="button"
 className="flex w-full items-center gap-3 rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-3 text-left text-sm cth-heading transition hover:border-[var(--cth-admin-accent)]/45"
 >
 {content}
 </button>
 );
 })}
 </div>
 </div>
 </aside>

 <section className={classNames("cth-card rounded-[30px] border border-[var(--cth-admin-border)] p-5 shadow-[0_18px_44px_rgba(43,16,64,0.07)] md:p-6", activeCommunityTab === "threads" ? "" : "hidden")}>
 <div className="mb-5 flex flex-col gap-4 border-b border-[var(--cth-admin-border)] pb-5 md:flex-row md:items-center md:justify-between">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--cth-admin-ruby)]">
 {activeChannelName}
 </p>
 <h2 className="mt-1 font-serif text-3xl font-semibold cth-heading">Community Threads</h2>
 <p className="mt-2 text-sm leading-6 cth-muted">
 Guided conversation tied to the cohort journey. No public feed. No popularity contest.
 </p>
 </div>

 <button
 type="button"
 onClick={() => document.getElementById("community-thread-composer")?.focus()}
 className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--cth-admin-accent)] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_38px_rgba(224,78,53,0.20)]"
 >
 <Plus size={16} /> New Thread
 </button>
 </div>

 <div className="mb-5 flex items-center gap-3 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-3">
 <Search size={16} className="cth-muted" />
 <input
 className="w-full bg-transparent text-sm cth-heading outline-none placeholder:cth-muted"
 placeholder="Search cohort threads, members, or resources..."
 />
 </div>

 <div className="space-y-4">
 {loading ? (
 <div className="rounded-[28px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-6 text-sm cth-muted">
 Loading community threads...
 </div>
 ) : visibleThreads.length ? (
 visibleThreads.map((thread) => (
 <article
 key={thread.id}
 className="rounded-[28px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-5 transition hover:border-[var(--cth-admin-accent)]/45"
 >
 <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
 <div className="min-w-0">
 <div className="mb-3 flex flex-wrap items-center gap-2">
 {thread.pinned ? (
 <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(224,78,53,0.22)] bg-[rgba(224,78,53,0.10)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--cth-admin-accent)]">
 <Pin size={11} /> Pinned
 </span>
 ) : null}
 <span className="rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] cth-muted">
 {thread.channel}
 </span>
 </div>

 <h3 className="font-serif text-2xl font-semibold cth-heading">{thread.title}</h3>
 <p className="mt-3 text-sm leading-6 cth-muted">{thread.body}</p>

 <div className="mt-4 flex flex-wrap items-center gap-4 text-xs cth-muted">
 <span className="inline-flex items-center gap-1.5">
 <UserRound size={14} /> {thread.author}
 </span>
 <span className="inline-flex items-center gap-1.5">
 <MessageCircle size={14} /> {thread.replies} replies
 </span>
 <span className="inline-flex items-center gap-1.5">
 <Clock size={14} /> {thread.time}
 </span>
 </div>
 </div>

 <button
 type="button"
 onClick={() => openThread(thread)}
 className="rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-4 py-2 text-xs font-bold cth-heading"
 >
 Open
 </button>
 </div>
 </article>
 ))
 ) : (
 <div className="rounded-[28px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-6">
 <p className="font-serif text-2xl font-semibold cth-heading">No threads in this room yet.</p>
 <p className="mt-2 text-sm leading-6 cth-muted">
 Start the first focused conversation for this cohort room.
 </p>
 </div>
 )}
 </div>

 <div className="mt-6 rounded-[26px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-4 shadow-[0_12px_30px_rgba(43,16,64,0.05)]">
 <label className="cth-label">Thread title</label>
 <input
 value={threadTitle}
 onChange={(event) => setThreadTitle(event.target.value)}
 className="cth-input mt-2 w-full"
 placeholder="Example: How do I connect my diagnostic result to my sales page CTA?"
 />

 <label className="cth-label mt-4 block">Post a cohort update</label>
 <textarea
 id="community-thread-composer"
 value={draft}
 onChange={(event) => setDraft(event.target.value)}
 className="cth-input mt-2 min-h-[96px] w-full resize-y rounded-[22px]"
 placeholder="Share a win, ask one focused question, or document what moved forward this week..."
 />
 <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <p className="text-xs cth-muted">
 Keep posts tied to progress: clarity, offers, content, systems, or implementation.
 </p>
 <button
 type="button"
 onClick={handleCreateThread}
 className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--cth-admin-accent)] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
 disabled={!draft.trim() || posting}
 >
 {posting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
 {posting ? "Posting..." : "Post Update"}
 </button>
 </div>
 </div>
 </section>

 <aside className={classNames("space-y-5", activeCommunityTab === "members" ? "" : "hidden")}>
 <div className="cth-card rounded-[30px] border border-[var(--cth-admin-border)] p-5">
 <div className="mb-5 flex items-center justify-between gap-3">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-[0.22em] cth-muted">Profiles</p>
 <h2 className="mt-1 font-serif text-2xl font-semibold cth-heading">Cohort Members</h2>
 </div>
 <Users size={20} className="text-[var(--cth-admin-accent)]" />
 </div>

 <div className="space-y-4">
 {members.map((member) => (
 <MemberProfileCard
 key={member.id}
 member={member}
 active={selectedMember?.id === member.id}
 onSelect={setSelectedMember}
 />
 ))}
 </div>
 </div>

 <div className="cth-card rounded-[30px] border border-[var(--cth-admin-border)] p-5">
 <div className="flex items-start gap-4">
 <Avatar member={selectedMember} size={64} />
 <div>
 <h2 className="font-serif text-2xl font-semibold cth-heading">{selectedMember?.name || "Cohort Member"}</h2>
 <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">
 {selectedMember?.cohort || "Cohort"}
 </p>
 <p className="mt-2 text-sm cth-muted">{selectedMember?.status || "Active"}</p>
 </div>
 </div>

 <div className="mt-6 grid grid-cols-3 gap-2 text-center">
 <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-3">
 <strong className="block font-serif text-2xl cth-heading">{selectedMember?.score || "New"}</strong>
 <span className="text-[10px] font-bold uppercase tracking-[0.14em] cth-muted">Score</span>
 </div>
 <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-3">
 <strong className="block text-sm cth-heading">{selectedMember?.timezone || "Local"}</strong>
 <span className="text-[10px] font-bold uppercase tracking-[0.14em] cth-muted">Zone</span>
 </div>
 <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-3">
 <strong className="block text-sm cth-heading">{String(selectedMember?.location || "Workspace").split(",")[0]}</strong>
 <span className="text-[10px] font-bold uppercase tracking-[0.14em] cth-muted">Base</span>
 </div>
 </div>

 <div className="mt-6 space-y-4">
 <div>
 <p className="cth-label">Current Focus</p>
 <p className="mt-2 text-sm leading-6 cth-muted">{selectedMember?.focus || "Not added yet."}</p>
 </div>
 <div>
 <p className="cth-label">Offer</p>
 <p className="mt-2 text-sm leading-6 cth-muted">{selectedMember?.offer || "Not added yet."}</p>
 </div>
 <div>
 <p className="cth-label">Needs Support With</p>
 <p className="mt-2 text-sm leading-6 cth-muted">{selectedMember?.needs || "Not added yet."}</p>
 </div>
 </div>

 <div className="mt-6 rounded-[24px] border border-[rgba(224,78,53,0.22)] bg-[rgba(224,78,53,0.08)] p-4">
 <div className="flex gap-3">
 <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--cth-admin-accent)]" />
 <p className="text-sm leading-6 cth-heading">
 Profile data should support accountability and relevant connection, not popularity.
 </p>
 </div>
 </div>
 </div>

 <div className="cth-card rounded-[30px] border border-[var(--cth-admin-border)] p-5">
 <div className="mb-4 flex items-center gap-2">
 <CalendarDays size={17} className="text-[var(--cth-admin-accent)]" />
 <h2 className="font-serif text-xl font-semibold cth-heading">Upcoming</h2>
 </div>
 <div className="space-y-3">
 {["Cohort orientation", "Office hours", "Brand Score review"].map((event, index) => (
 <div
 key={event}
 className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-3"
 >
 <span className="text-sm cth-heading">{event}</span>
 <span className="text-xs cth-muted">Week {index + 1}</span>
 </div>
 ))}
 </div>
 </div>
 </aside>
 </div>

 <section className={classNames("cth-card rounded-[30px] border border-[var(--cth-admin-border)] p-5 shadow-[0_18px_44px_rgba(43,16,64,0.07)] md:p-6", activeCommunityTab === "resources" ? "" : "hidden")}>
 <div className="mb-6 flex flex-col gap-4 border-b border-[var(--cth-admin-border)] pb-5 md:flex-row md:items-center md:justify-between">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--cth-admin-ruby)]">
 Resource Library
 </p>
 <h2 className="mt-1 font-serif text-3xl font-semibold cth-heading">Pinned Cohort Resources</h2>
 <p className="mt-2 max-w-2xl text-sm leading-6 cth-muted">
 Templates, replay links, worksheets, office-hour recaps, and references for the cohort.
 </p>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
 {resources.map((resource) => {
 const card = (
 <article className="h-full rounded-[24px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] p-5 transition hover:border-[var(--cth-admin-accent)]/45">
 <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--cth-admin-panel)] text-[var(--cth-admin-ruby)]">
 <FileText size={18} />
 </div>
 <h3 className="font-serif text-2xl font-semibold cth-heading">{resource.title}</h3>
 {resource.description ? (
 <p className="mt-2 text-sm leading-6 cth-muted">{resource.description}</p>
 ) : null}
 <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] cth-muted">
 {resource.resource_type || "resource"}
 </p>
 </article>
 );

 if (resource.url) {
 return (
 <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer">
 {card}
 </a>
 );
 }

 return <div key={resource.id}>{card}</div>;
 })}
 </div>
 </section>

 <div className="mt-7 rounded-[30px] border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] p-5 shadow-[0_18px_44px_rgba(43,16,64,0.08)]">
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div className="flex items-start gap-3">
 <Bell size={20} className="mt-1 shrink-0 text-[var(--cth-admin-accent)]" />
 <div>
 <h2 className="font-serif text-2xl font-semibold cth-heading">Community backend connected</h2>
 <p className="mt-2 max-w-3xl text-sm leading-6 cth-muted">
 This page now supports persistent rooms, threads, replies, pinned resources, member profiles,
 SuperAdmin setup controls, profile image upload, reply notifications, and near-real-time refresh.
 </p>
 </div>
 </div>
 <span className="inline-flex items-center gap-2 rounded-full border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel-alt)] px-4 py-2 text-xs font-bold cth-muted">
 <CheckCircle2 size={14} /> Live community
 </span>
 </div>
 </div>

 <ThreadDrawer
 thread={selectedThread}
 messages={messages}
 loading={messagesLoading}
 reply={replyDraft}
 setReply={setReplyDraft}
 posting={posting}
 onPostReply={handlePostReply}
 onClose={() => {
 setSelectedThread(null);
 setMessages([]);
 setReplyDraft("");
 }}
 />
 </section>
 </main>
 );
}
