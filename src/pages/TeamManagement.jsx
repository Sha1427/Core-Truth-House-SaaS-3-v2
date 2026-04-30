import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
 ChevronDown,
 Loader2,
 RefreshCw,
 Trash2,
 UserPlus,
 X,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const ROLES = ["owner", "admin", "editor", "member", "viewer", "billing", "guest"];

const ROLE_COLORS = {
 owner: { color: "var(--cth-brand-secondary)", bg: "rgba(179,139,53,0.14)" },
 admin: { color: "var(--cth-admin-accent)", bg: "rgba(224,78,53,0.12)" },
 editor: { color: "var(--cth-status-info)", bg: "rgba(93,111,143,0.14)" },
 member: { color: "var(--cth-admin-ruby)", bg: "rgba(118,59,91,0.14)" },
 viewer: { color: "#6f5a74", bg: "rgba(111,90,116,0.14)" },
 billing: { color: "var(--cth-status-success)", bg: "rgba(63,122,95,0.14)" },
 guest: { color: "var(--cth-surface-sidebar-muted)", bg: "rgba(168,143,159,0.16)" },
};

function formatDate(iso) {
 if (!iso) return "Never";
 const date = new Date(iso);
 if (Number.isNaN(date.getTime())) return "Never";

 const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
 if (seconds < 60) return "Just now";
 if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
 if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
 if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

 return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name, email) {
 if (name) {
 const parts = name.trim().split(" ").filter(Boolean);
 if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
 return name.slice(0, 2).toUpperCase();
 }
 return email ? email.slice(0, 2).toUpperCase() : "??";
}

function avatarColor(seed) {
 const colors = [
 "var(--cth-admin-ink)",
 "var(--cth-admin-ruby)",
 "var(--cth-admin-accent)",
 "var(--cth-info)",
 "var(--cth-success)",
 "var(--cth-admin-tuscany)",
 ];

 let hash = 0;
 for (let i = 0; i < (seed || "").length; i += 1) {
 hash = seed.charCodeAt(i) + ((hash << 5) - hash);
 }

 return colors[Math.abs(hash) % colors.length];
}

function Avatar({ name, email, size = 36 }) {
 const initials = getInitials(name, email || "");
 const bg = avatarColor(email || name || "");

 return (
 <div
 className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
 style={{ width: size, height: size, background: bg, fontSize: size * 0.33 }}
 >
 {initials}
 </div>
 );
}

function RoleBadge({ role }) {
 const rc = ROLE_COLORS[role] || ROLE_COLORS.viewer;

 return (
 <span
 className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
 style={{ color: rc.color, background: rc.bg }}
 >
 {role}
 </span>
 );
}

function ActivityDot({ lastActive }) {
 if (!lastActive) {
 return <div className="h-2 w-2 rounded-full" style={{ background: "var(--cth-admin-border)" }} />;
 }

 const dt = new Date(lastActive);
 if (Number.isNaN(dt.getTime())) {
 return <div className="h-2 w-2 rounded-full" style={{ background: "var(--cth-admin-border)" }} />;
 }

 const diff = (Date.now() - dt.getTime()) / 1000;
 const color =
 diff < 3600 ? "var(--cth-success)" :
 diff < 86400 ? "var(--cth-warning)" :
 "var(--cth-admin-muted)";

 return <div className="h-2 w-2 rounded-full" style={{ background: color }} title={formatDate(lastActive)} />;
}

function RoleDropdown({ currentRole, disabled, onChange }) {
 const [open, setOpen] = useState(false);

 if (disabled) return <RoleBadge role={currentRole} />;

 return (
 <div className="relative">
 <button
 type="button"
 onClick={() => setOpen((value) => !value)}
 className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
 style={{
 color: ROLE_COLORS[currentRole]?.color || "var(--cth-admin-ink)",
 background: ROLE_COLORS[currentRole]?.bg || "var(--cth-admin-panel-alt)",
 }}
 >
 {currentRole}
 <ChevronDown size={12} />
 </button>

 {open ? (
 <div className="cth-card absolute right-0 z-20 mt-2 w-40 overflow-hidden shadow-xl">
 {ROLES.map((role) => (
 <button
 key={role}
 type="button"
 onClick={() => {
 setOpen(false);
 if (role !== currentRole) onChange(role);
 }}
 className="w-full px-3 py-2 text-left text-sm cth-body hover:opacity-80"
 style={{ background: "transparent" }}
 >
 {role}
 </button>
 ))}
 </div>
 ) : null}
 </div>
 );
}

function InviteModal({ open, loading, onClose, onSubmit }) {
 const [email, setEmail] = useState("");
 const [name, setName] = useState("");
 const [role, setRole] = useState("member");

 useEffect(() => {
 if (!open) {
 setEmail("");
 setName("");
 setRole("member");
 }
 }, [open]);

 if (!open) return null;

 return (
 <div
 className="fixed inset-0 z-30 flex items-center justify-center px-4"
 style={{ background: "rgba(43, 16, 64, 0.35)", backdropFilter: "blur(6px)" }}
 >
 <div className="cth-modal w-full max-w-md p-5">
 <div className="mb-4 flex items-center justify-between">
 <h3 className="m-0 text-lg font-semibold cth-heading">Invite a team member</h3>
 <button type="button" onClick={onClose} className="cth-muted">
 <X size={18} />
 </button>
 </div>

 <div className="grid gap-3">
 <input
 value={name}
 onChange={(event) => setName(event.target.value)}
 placeholder="Name"
 className="cth-input"
 />

 <input
 value={email}
 onChange={(event) => setEmail(event.target.value)}
 placeholder="Email"
 className="cth-input"
 />

 <select
 value={role}
 onChange={(event) => setRole(event.target.value)}
 className="cth-select"
 >
 {ROLES.filter((item) => item !== "owner").map((item) => (
 <option key={item} value={item}>
 {item}
 </option>
 ))}
 </select>
 </div>

 <button
 type="button"
 disabled={loading || !email.trim()}
 onClick={() => onSubmit({ email: email.trim(), name: name.trim(), role })}
 className="cth-button-primary mt-4 w-full"
 style={{ opacity: loading || !email.trim() ? 0.7 : 1 }}
 >
 {loading ? "Sending..." : "Send invite"}
 </button>
 </div>
 </div>
 );
}

export default function TeamManagement() {
 const { activeWorkspaceId } = useWorkspace();
 const { currentPlan } = usePlan();

 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [inviteOpen, setInviteOpen] = useState(false);
 const [inviteLoading, setInviteLoading] = useState(false);
 const [members, setMembers] = useState([]);
 const [pendingInvites, setPendingInvites] = useState([]);
 const [activitySummary, setActivitySummary] = useState(null);
 const [error, setError] = useState("");

 const canManageTeam = useMemo(() => {
 const planId = (currentPlan?.id || currentPlan?.plan_id || "").toLowerCase();
 return !["", "audit", "starter-free"].includes(planId);
 }, [currentPlan]);

 const loadTeamData = useCallback(async ({ silent = false } = {}) => {
 if (!activeWorkspaceId) {
 setError("No active workspace selected.");
 setLoading(false);
 return;
 }

 if (silent) setRefreshing(true);
 else setLoading(true);

 setError("");

 const results = await Promise.allSettled([
 apiClient.get(API_PATHS.teams.members(activeWorkspaceId)),
 apiClient.get(API_PATHS.teams.pendingInvites(activeWorkspaceId)),
 apiClient.get(API_PATHS.teams.activitySummary(activeWorkspaceId)),
 ]);

 const [membersResult, invitesResult, activityResult] = results;

 if (membersResult.status === "fulfilled") {
 setMembers(membersResult.value?.members || membersResult.value || []);
 }

 if (invitesResult.status === "fulfilled") {
 setPendingInvites(invitesResult.value?.pending_invites || invitesResult.value?.invites || []);
 }

 if (activityResult.status === "fulfilled") {
 setActivitySummary(activityResult.value || null);
 }

 if (results.every((item) => item.status === "rejected")) {
 setError("Unable to load team data right now.");
 }

 setLoading(false);
 setRefreshing(false);
 }, [activeWorkspaceId]);

 useEffect(() => {
 loadTeamData();
 }, [loadTeamData]);

 const handleInvite = async (payload) => {
 if (!activeWorkspaceId) return;

 setInviteLoading(true);
 try {
 await apiClient.post(API_PATHS.teams.invite(activeWorkspaceId), payload);
 setInviteOpen(false);
 await loadTeamData({ silent: true });
 } catch (err) {
 console.error("Failed to send invite", err);
 setError(err?.message || "Failed to send invite.");
 } finally {
 setInviteLoading(false);
 }
 };

 const handleRoleChange = async (memberId, nextRole) => {
 if (!activeWorkspaceId) return;

 try {
 await apiClient.put(API_PATHS.teams.memberRole(activeWorkspaceId, memberId), {
 role: nextRole,
 });
 await loadTeamData({ silent: true });
 } catch (err) {
 console.error("Failed to update member role", err);
 setError(err?.message || "Failed to update team role.");
 }
 };

 const handleDeleteMember = async (memberId) => {
 if (!activeWorkspaceId) return;
 const confirmed = window.confirm("Remove this team member?");
 if (!confirmed) return;

 try {
 await apiClient.delete(API_PATHS.teams.memberDelete(activeWorkspaceId, memberId));
 await loadTeamData({ silent: true });
 } catch (err) {
 console.error("Failed to remove member", err);
 setError(err?.message || "Failed to remove team member.");
 }
 };

 const handleResendInvite = async (inviteId) => {
 if (!activeWorkspaceId) return;

 try {
 await apiClient.post(API_PATHS.teams.resendInvite(activeWorkspaceId, inviteId), {});
 await loadTeamData({ silent: true });
 } catch (err) {
 console.error("Failed to resend invite", err);
 setError(err?.message || "Failed to resend invite.");
 }
 };

 const handleDeleteInvite = async (inviteId) => {
 if (!activeWorkspaceId) return;

 try {
 await apiClient.delete(API_PATHS.teams.deleteInvite(activeWorkspaceId, inviteId));
 await loadTeamData({ silent: true });
 } catch (err) {
 console.error("Failed to delete invite", err);
 setError(err?.message || "Failed to delete invite.");
 }
 };

 return (
 <DashboardLayout>
 <TopBar
 title="Team Management"
 subtitle="Invite, manage, and monitor your workspace team."
 />

 <div className="cth-page flex-1 overflow-auto px-4 py-5 md:px-7">
 <InviteModal
 open={inviteOpen}
 loading={inviteLoading}
 onClose={() => setInviteOpen(false)}
 onSubmit={handleInvite}
 />

 {error ? (
 <div
 className="cth-card mb-4 px-4 py-3 cth-text-danger"
 style={{
 background: "color-mix(in srgb, var(--cth-danger) 10%, var(--cth-admin-panel))",
 borderColor: "color-mix(in srgb, var(--cth-danger) 25%, var(--cth-admin-border))",
 }}
 >
 {error}
 </div>
 ) : null}

 {!canManageTeam ? (
 <div className="cth-card p-5">
 <h3 className="m-0 mb-2 text-lg font-semibold cth-heading">Upgrade required</h3>
 <p className="m-0 cth-muted">
 Team management is not available on your current plan.
 </p>
 </div>
 ) : loading ? (
 <div className="flex min-h-[260px] items-center justify-center">
 <Loader2 size={24} className="animate-spin cth-text-accent" />
 </div>
 ) : (
 <>
 <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
 <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
 <div className="cth-card px-4 py-3">
 <div className="text-xs uppercase tracking-wide cth-muted">Members</div>
 <div className="mt-1 text-xl font-bold cth-heading">{members.length}</div>
 </div>

 <div className="cth-card px-4 py-3">
 <div className="text-xs uppercase tracking-wide cth-muted">Pending Invites</div>
 <div className="mt-1 text-xl font-bold cth-heading">{pendingInvites.length}</div>
 </div>

 <div className="cth-card px-4 py-3">
 <div className="text-xs uppercase tracking-wide cth-muted">Recent Activity</div>
 <div className="mt-1 text-xl font-bold cth-heading">
 {activitySummary?.recent_activity_count ?? 0}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => loadTeamData({ silent: true })}
 className="cth-button-secondary inline-flex items-center gap-2"
 >
 {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
 Refresh
 </button>

 <button
 type="button"
 onClick={() => setInviteOpen(true)}
 className="cth-button-primary inline-flex items-center gap-2"
 >
 <UserPlus size={16} />
 Invite Member
 </button>
 </div>
 </div>

 <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
 <div className="cth-card p-4">
 <h3 className="mb-3 text-lg font-semibold cth-heading">Members</h3>

 <div className="grid gap-3">
 {members.length === 0 ? (
 <div className="cth-card-muted px-4 py-6 cth-muted">
 No members found yet.
 </div>
 ) : (
 members.map((member) => {
 const memberId = member.id || member.member_id || member.user_id;
 const isOwner = member.role === "owner";

 return (
 <div
 key={memberId}
 className="cth-card-muted flex items-center justify-between gap-3 px-4 py-3"
 >
 <div className="flex min-w-0 items-center gap-3">
 <Avatar name={member.name} email={member.email} />
 <div className="min-w-0">
 <div className="truncate font-medium cth-heading">
 {member.name || member.email}
 </div>
 <div className="truncate text-sm cth-muted">{member.email}</div>
 <div className="mt-1 flex items-center gap-2 text-xs cth-muted">
 <ActivityDot lastActive={member.last_active_at} />
 <span>{formatDate(member.last_active_at)}</span>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <RoleDropdown
 currentRole={member.role || "member"}
 disabled={isOwner}
 onChange={(nextRole) => handleRoleChange(memberId, nextRole)}
 />

 <button
 type="button"
 disabled={isOwner}
 onClick={() => handleDeleteMember(memberId)}
 className="cth-button-ghost inline-flex items-center justify-center !p-2"
 style={{
 opacity: isOwner ? 0.45 : 1,
 color: isOwner ? "var(--cth-admin-muted)" : "var(--cth-danger)",
 }}
 >
 <Trash2 size={15} />
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>

 <div className="cth-card p-4">
 <h3 className="mb-3 text-lg font-semibold cth-heading">Pending Invites</h3>

 <div className="grid gap-3">
 {pendingInvites.length === 0 ? (
 <div className="cth-card-muted px-4 py-6 cth-muted">
 No pending invites.
 </div>
 ) : (
 pendingInvites.map((invite) => {
 const inviteId = invite.id || invite.invite_id;

 return (
 <div key={inviteId} className="cth-card-muted px-4 py-3">
 <div className="mb-2 font-medium cth-heading">{invite.email}</div>
 <div className="mb-3 text-sm cth-muted">
 Role: {invite.role || "member"} · Sent {formatDate(invite.created_at)}
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => handleResendInvite(inviteId)}
 className="cth-button-secondary text-sm"
 >
 Resend
 </button>

 <button
 type="button"
 onClick={() => handleDeleteInvite(inviteId)}
 className="cth-button-ghost text-sm"
 style={{ color: "var(--cth-danger)" }}
 >
 Delete
 </button>
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 </div>
 </>
 )}
 </div>
 </DashboardLayout>
 );
}
