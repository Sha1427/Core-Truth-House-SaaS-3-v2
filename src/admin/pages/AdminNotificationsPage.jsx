import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "../../hooks/useAuth";
import { Bell, Mail, Send, ShieldAlert, RefreshCw, AlertTriangle, Check, Trash2, ArrowRight } from "lucide-react";

import apiClient from "../../lib/apiClient";

function PanelCard({ title, subtitle, children, actions = null }) {
  return (
    <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--cth-admin-border)] px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">{subtitle}</div> : null}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SmallButton({ onClick, children, disabled = false, icon: Icon = null }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] px-3 py-2 text-xs text-[var(--cth-admin-ruby)] transition hover:bg-[var(--cth-surface-elevated-soft)] disabled:opacity-50"
    >
      {Icon ? <Icon size={13} /> : null}
      {children}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, tone = "rose", hint = "" }) {
  const tones = {
    rose: "bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]",
    plum: "bg-[color-mix(in srgb, var(--cth-admin-ruby) 12%, var(--cth-admin-panel))] text-[var(--cth-admin-ruby)]",
    gold: "bg-[color-mix(in srgb, var(--cth-brand-secondary) 16%, var(--cth-admin-panel))] text-[var(--cth-warning-gold-deep)]",
    green: "bg-[var(--cth-surface-success-soft)] text-[var(--cth-status-success-deep)]",
  };

  return (
    <div className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone] || tones.rose}`}>
        <Icon size={20} />
      </div>
      <div className="mt-4 text-2xl font-semibold text-[var(--cth-admin-ink)]">{value}</div>
      <div className="mt-1 text-sm text-[var(--cth-admin-muted)]">{label}</div>
      {hint ? <div className="mt-2 text-xs text-[var(--cth-copy-muted)]">{hint}</div> : null}
    </div>
  );
}

function StatusPill({ label }) {
  const normalized = String(label || "").toLowerCase();

  let classes = "bg-[var(--cth-admin-panel-alt)] text-[var(--cth-admin-muted)]";
  if (["read", "resolved", "done"].includes(normalized)) {
    classes = "bg-[var(--cth-status-success-soft-bg)] text-[var(--cth-status-success-deep)]";
  } else if (["new", "unread", "open"].includes(normalized)) {
    classes = "bg-[var(--cth-status-warning-soft-bg)] text-[var(--cth-status-warning-deep)]";
  } else if (["urgent", "error"].includes(normalized)) {
    classes = "bg-[var(--cth-status-danger-soft-bg)] text-[var(--cth-status-danger-deep)]";
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${classes}`}>
      {label || "unknown"}
    </span>
  );
}

function normalizeNotification(item) {
  return {
    id: item.id || item._id,
    name: item.metadata?.sender_name || item.metadata?.name || "System",
    email: item.metadata?.sender_email || item.metadata?.email || "—",
    subject: item.title || "No subject",
    message: item.message || "",
    status: item.is_read ? "read" : "unread",
    created_at: item.created_at || item.updated_at || null,
    category: item.category || "general",
    type: item.type || "info",
    priority: item.priority || "normal",
    link: item.link || "",
    is_read: Boolean(item.is_read),
    raw: item,
  };
}

function SimpleTable({ columns, rows, emptyLabel = "No records found" }) {
  if (!rows.length) {
    return <div className="text-sm text-[var(--cth-admin-muted)]">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="border-b border-[var(--cth-admin-border)] pb-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((col) => (
                <td key={col.key} className="border-b border-[var(--cth-surface-elevated-soft)] py-3 pr-4 align-top text-sm text-[var(--cth-admin-ink)]">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InsightCard({ title, body, tone = "neutral" }) {
  const tones = {
    neutral: "border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)]",
    success: "border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.06)]",
    warning: "border-[rgba(245,158,11,0.25)] bg-[rgba(245,158,11,0.06)]",
    danger: "border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)]",
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.neutral}`}>
      <div className="text-sm font-semibold text-[var(--cth-admin-ink)]">{title}</div>
      <div className="mt-2 text-sm text-[var(--cth-admin-muted)]">{body}</div>
    </div>
  );
}

export default function AdminNotificationsPage() {
  const { user } = useUser();
  const adminId = user?.id || "default";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);

  const load = useCallback(async () => {
    if (!adminId) return;

    setLoading(true);
    try {
      const res = await apiClient.get("/api/notifications", {
        params: {
          user_id: adminId,
          limit: 100,
        },
        workspace: false,
      });
      setMessages((res?.notifications || []).map(normalizeNotification));
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await apiClient.put(`/api/notifications/${notificationId}/read`, null, {
        params: { user_id: adminId },
        workspace: false,
      });
      setMessages((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, status: "read", is_read: true } : item
        )
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await apiClient.delete(`/api/notifications/${notificationId}`, {
        workspace: false,
      });
      setMessages((prev) => prev.filter((item) => item.id !== notificationId));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put("/api/notifications/mark-all-read", null, {
        params: { user_id: adminId },
        workspace: false,
      });
      setMessages((prev) =>
        prev.map((item) => ({ ...item, status: "read", is_read: true }))
      );
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const unread = useMemo(
    () => messages.filter((m) => String(m.status).toLowerCase() !== "read"),
    [messages]
  );

  const read = useMemo(
    () => messages.filter((m) => String(m.status).toLowerCase() === "read"),
    [messages]
  );

  const recent = useMemo(() => {
    return [...messages]
      .sort((a, b) => {
        const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bd - ad;
      })
      .slice(0, 10);
  }, [messages]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Manage</p>
              <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-admin-ink)]">Notifications</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SmallButton onClick={handleMarkAllRead} disabled={loading || !unread.length} icon={Check}>
              Mark all read
            </SmallButton>
            <SmallButton onClick={handleRefresh} disabled={refreshing || loading} icon={RefreshCw}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </SmallButton>
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-sm text-[var(--cth-admin-muted)]">
          This page now reads from the live notifications system so admins can monitor unread, recent, and resolved notification activity.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Bell} label="Open Signals" value={unread.length} tone="gold" hint="Unread or unresolved items" />
        <StatCard icon={Mail} label="Total Messages" value={messages.length} tone="rose" hint="All currently loaded admin messages" />
        <StatCard icon={Send} label="Recent Activity" value={recent.length} tone="plum" hint="Latest activity window" />
        <StatCard icon={ShieldAlert} label="Resolved Signals" value={read.length} tone="green" hint="Read or closed items" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <PanelCard
          title="Operational Signals"
          subtitle="Message-derived notification view"
        >
          {loading ? (
            <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
          ) : (
            <div className="grid gap-4">
              <InsightCard
                title="Notifications are now API-backed"
                body="This page now reads from the live notifications backend instead of the older admin messages fallback."
                tone="warning"
              />
              <InsightCard
                title="Open items need attention"
                body={`There are currently ${unread.length} open signal(s) that can be treated as follow-up candidates.`}
                tone={unread.length ? "danger" : "success"}
              />
              <InsightCard
                title="Use this page as triage, not broadcast"
                body="This is for surfacing what needs attention. Platform-wide outbound announcements should come later when a dedicated notifications contract exists."
                tone="neutral"
              />
            </div>
          )}
        </PanelCard>

        <PanelCard
          title="Recent Signals"
          subtitle="Latest notification activity"
        >
          {loading ? (
            <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
          ) : (
            <SimpleTable
              columns={[
                { key: "subject", label: "Subject" },
                {
                  key: "status",
                  label: "Status",
                  render: (row) => <StatusPill label={row.status} />,
                },
                {
                  key: "created_at",
                  label: "Received",
                  render: (row) =>
                    row.created_at ? new Date(row.created_at).toLocaleDateString() : "—",
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="flex flex-wrap items-center gap-2">
                      {row.link ? (
                        <a
                          href={row.link}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--cth-admin-border)] bg-white px-3 py-1.5 text-xs text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                        >
                          Open
                        </a>
                      ) : null}

                      {!row.is_read ? (
                        <button
                          onClick={() => handleMarkRead(row.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--cth-admin-border)] bg-white px-3 py-1.5 text-xs text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                        >
                          Mark read
                        </button>
                      ) : null}

                      <button
                        onClick={() => handleDelete(row.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[rgba(239,68,68,0.25)] bg-white px-3 py-1.5 text-xs text-[var(--cth-status-danger-deep)] hover:bg-[rgba(239,68,68,0.06)]"
                      >
                        Delete
                      </button>
                    </div>
                  ),
                },
              ]}
              rows={recent}
              emptyLabel="No recent notifications found"
            />
          )}
        </PanelCard>
      </div>

      <PanelCard
        title="Open Follow-Up Queue"
        subtitle="Unread and unresolved items"
      >
        {loading ? (
          <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
        ) : (
          <SimpleTable
            columns={[
              { key: "name", label: "From" },
              { key: "subject", label: "Subject" },
              {
                key: "status",
                label: "Status",
                render: (row) => <StatusPill label={row.status} />,
              },
              {
                key: "created_at",
                label: "Received",
                render: (row) =>
                  row.created_at ? new Date(row.created_at).toLocaleString() : "—",
              },
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  <div className="flex flex-wrap items-center gap-2">
                    {!row.is_read ? (
                      <button
                        onClick={() => handleMarkRead(row.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--cth-admin-border)] bg-white px-3 py-1.5 text-xs text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                      >
                        <Check size={13} />
                        Mark read
                      </button>
                    ) : null}

                    {row.link ? (
                      <a
                        href={row.link}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--cth-admin-border)] bg-white px-3 py-1.5 text-xs text-[var(--cth-admin-muted)] hover:bg-[var(--cth-admin-panel)]"
                      >
                        <ArrowRight size={13} />
                        Open
                      </a>
                    ) : null}

                    <button
                      onClick={() => handleDelete(row.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[rgba(239,68,68,0.25)] bg-white px-3 py-1.5 text-xs text-[var(--cth-status-danger-deep)] hover:bg-[rgba(239,68,68,0.06)]"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
            rows={unread}
            emptyLabel="No open follow-up items"
          />
        )}
      </PanelCard>
    </div>
  );
}
