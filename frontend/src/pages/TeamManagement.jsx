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
import { useColors } from "../context/ThemeContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePlan } from "../context/PlanContext";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const ROLES = ["owner", "admin", "editor", "member", "viewer", "billing", "guest"];

const ROLE_COLORS = {
  owner: { color: "#C9A84C", bg: "rgba(201,168,76,0.12)" },
  admin: { color: "#E04E35", bg: "rgba(224,78,53,0.12)" },
  editor: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  member: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  viewer: { color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
  billing: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  guest: { color: "#9c8fb0", bg: "rgba(156,143,176,0.12)" },
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
  const colors = ["#33033C", "#AF0024", "#763B5B", "#5D0012", "#1e3a5f", "#065f46"];
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
      className="flex items-center justify-center rounded-full text-white font-bold shrink-0"
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
      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ color: rc.color, background: rc.bg }}
    >
      {role}
    </span>
  );
}

function ActivityDot({ lastActive }) {
  if (!lastActive) return <div className="w-2 h-2 rounded-full bg-white/10" />;

  const dt = new Date(lastActive);
  if (Number.isNaN(dt.getTime())) return <div className="w-2 h-2 rounded-full bg-white/10" />;

  const diff = (Date.now() - dt.getTime()) / 1000;
  const color =
    diff < 3600 ? "#10b981" :
    diff < 86400 ? "#f59e0b" :
    "rgba(255,255,255,0.2)";

  return <div className="w-2 h-2 rounded-full" style={{ background: color }} title={formatDate(lastActive)} />;
}

function RoleDropdown({ currentRole, disabled, onChange }) {
  const [open, setOpen] = useState(false);

  if (disabled) {
    return <RoleBadge role={currentRole} />;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
        style={{
          color: ROLE_COLORS[currentRole]?.color || "#fff",
          background: ROLE_COLORS[currentRole]?.bg || "rgba(255,255,255,0.1)",
        }}
      >
        {currentRole}
        <ChevronDown size={12} />
      </button>

      {open ? (
        <div
          className="absolute right-0 mt-2 w-40 rounded-xl shadow-xl z-20"
          style={{
            background: "#1b0d21",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                setOpen(false);
                if (role !== currentRole) onChange(role);
              }}
              className="w-full text-left px-3 py-2 text-sm"
              style={{
                color: "white",
                background: "transparent",
              }}
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
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5"
        style={{
          background: "#130915",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="m-0 text-white text-lg font-semibold">Invite a team member</h3>
          <button type="button" onClick={onClose} className="text-white/70">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            className="w-full rounded-lg px-3 py-2 text-white"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-lg px-3 py-2 text-white"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full rounded-lg px-3 py-2 text-white"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
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
          className="mt-4 w-full rounded-lg px-4 py-2 font-semibold text-white"
          style={{ background: "#E04E35", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Sending..." : "Send invite"}
        </button>
      </div>
    </div>
  );
}

export default function TeamManagement() {
  const colors = useColors();
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

      <div className="px-4 py-5 md:px-7">
        <InviteModal
          open={inviteOpen}
          loading={inviteLoading}
          onClose={() => setInviteOpen(false)}
          onSubmit={handleInvite}
        />

        {error ? (
          <div
            className="mb-4 rounded-xl px-4 py-3"
            style={{
              background: "rgba(224,78,53,0.10)",
              border: "1px solid rgba(224,78,53,0.25)",
              color: "#E04E35",
            }}
          >
            {error}
          </div>
        ) : null}

        {!canManageTeam ? (
          <div
            className="rounded-2xl p-5"
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.tuscany}15`,
            }}
          >
            <h3 className="m-0 mb-2 text-white text-lg font-semibold">Upgrade required</h3>
            <p className="m-0 text-white/70">
              Team management is not available on your current plan.
            </p>
          </div>
        ) : loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <Loader2 size={24} className="animate-spin" style={{ color: colors.cinnabar }} />
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: colors.cardBg, border: `1px solid ${colors.tuscany}15` }}
                >
                  <div className="text-xs uppercase tracking-wide text-white/50">Members</div>
                  <div className="mt-1 text-xl font-bold text-white">{members.length}</div>
                </div>
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: colors.cardBg, border: `1px solid ${colors.tuscany}15` }}
                >
                  <div className="text-xs uppercase tracking-wide text-white/50">Pending Invites</div>
                  <div className="mt-1 text-xl font-bold text-white">{pendingInvites.length}</div>
                </div>
                <div
                  className="rounded-xl px-4 py-3"
                  style={{ background: colors.cardBg, border: `1px solid ${colors.tuscany}15` }}
                >
                  <div className="text-xs uppercase tracking-wide text-white/50">Recent Activity</div>
                  <div className="mt-1 text-xl font-bold text-white">
                    {activitySummary?.recent_activity_count ?? 0}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadTeamData({ silent: true })}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-white"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-white font-semibold"
                  style={{ background: "#E04E35" }}
                >
                  <UserPlus size={16} />
                  Invite Member
                </button>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <div
                className="rounded-2xl p-4"
                style={{ background: colors.cardBg, border: `1px solid ${colors.tuscany}15` }}
              >
                <h3 className="mb-3 text-lg font-semibold text-white">Members</h3>

                <div className="grid gap-3">
                  {members.length === 0 ? (
                    <div className="rounded-xl px-4 py-6 text-white/60" style={{ background: "rgba(255,255,255,0.03)" }}>
                      No members found yet.
                    </div>
                  ) : (
                    members.map((member) => {
                      const memberId = member.id || member.member_id || member.user_id;
                      const isOwner = member.role === "owner";

                      return (
                        <div
                          key={memberId}
                          className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                          style={{ background: "rgba(255,255,255,0.03)" }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={member.name} email={member.email} />
                            <div className="min-w-0">
                              <div className="truncate text-white font-medium">
                                {member.name || member.email}
                              </div>
                              <div className="truncate text-sm text-white/55">{member.email}</div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-white/45">
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
                              className="inline-flex items-center justify-center rounded-lg p-2 text-white/70"
                              style={{ background: isOwner ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)" }}
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

              <div
                className="rounded-2xl p-4"
                style={{ background: colors.cardBg, border: `1px solid ${colors.tuscany}15` }}
              >
                <h3 className="mb-3 text-lg font-semibold text-white">Pending Invites</h3>

                <div className="grid gap-3">
                  {pendingInvites.length === 0 ? (
                    <div className="rounded-xl px-4 py-6 text-white/60" style={{ background: "rgba(255,255,255,0.03)" }}>
                      No pending invites.
                    </div>
                  ) : (
                    pendingInvites.map((invite) => {
                      const inviteId = invite.id || invite.invite_id;

                      return (
                        <div
                          key={inviteId}
                          className="rounded-xl px-4 py-3"
                          style={{ background: "rgba(255,255,255,0.03)" }}
                        >
                          <div className="mb-2 text-white font-medium">{invite.email}</div>
                          <div className="mb-3 text-sm text-white/55">
                            Role: {invite.role || "member"} · Sent {formatDate(invite.created_at)}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleResendInvite(inviteId)}
                              className="rounded-lg px-3 py-2 text-sm text-white"
                              style={{ background: "rgba(255,255,255,0.08)" }}
                            >
                              Resend
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteInvite(inviteId)}
                              className="rounded-lg px-3 py-2 text-sm text-white"
                              style={{ background: "rgba(224,78,53,0.15)" }}
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
