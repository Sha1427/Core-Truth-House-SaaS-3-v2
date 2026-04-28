import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useColors } from "../../context/ThemeContext";
import apiClient from "../../lib/apiClient";

const CORE_TRUTH_HOUSE_WORKSPACE_ID = "e285aa0b-83b3-495d-9ac0-52e92ab64b42";
const SELF_USER_ID = "user_3AtYAnxP5cAVnksOL7gxq1T2EaL";

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

function PrimaryButton({ onClick, children, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--cth-admin-accent)] bg-[var(--cth-admin-accent)] px-3 py-2 text-xs text-white transition hover:opacity-90 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function TextInput({ value, onChange, placeholder = "" }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-[var(--cth-admin-border)] bg-white px-3 py-2 text-sm text-[var(--cth-admin-ink)] outline-none"
    />
  );
}

function SelectInput({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-[var(--cth-admin-border)] bg-white px-3 py-2 text-sm text-[var(--cth-admin-ink)] outline-none"
    >
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        return (
          <option key={val} value={val}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

function StatusPill({ label }) {
  const normalized = String(label || "").toLowerCase();

  let classes = "bg-[var(--cth-admin-panel-alt)] text-[var(--cth-admin-muted)]";
  if (["active", "completed", "paid", "ready"].includes(normalized)) {
    classes = "bg-[var(--cth-status-success-soft-bg)] text-[var(--cth-status-success-deep)]";
  } else if (["pending", "trialing"].includes(normalized)) {
    classes = "bg-[var(--cth-status-warning-soft-bg)] text-[var(--cth-status-warning-deep)]";
  } else if (["inactive", "cancelled", "archived", "suspended", "error"].includes(normalized)) {
    classes = "bg-[var(--cth-status-danger-soft-bg)] text-[var(--cth-status-danger-deep)]";
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${classes}`}>
      {label}
    </span>
  );
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

function WorkspacesPanel() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status.trim()) params.status = status.trim();

      const res = await apiClient.get("/api/admin/workspaces", { params });
      setItems(res?.workspaces || []);
    } catch (err) {
      console.error("Failed to load workspaces:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  const loadDetail = useCallback(async (workspaceId) => {
    try {
      const res = await apiClient.get(`/api/admin/workspaces/${workspaceId}`);
      setDetail(res || null);
      setSelected(workspaceId);
    } catch (err) {
      console.error("Failed to load workspace detail:", err);
      setDetail(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (workspaceId, nextStatus) => {
    setSaving(true);
    try {
      await apiClient.put(`/api/admin/workspaces/${workspaceId}/status`, { status: nextStatus });
      await load();
      if (selected === workspaceId) await loadDetail(workspaceId);
    } catch (err) {
      console.error("Failed to update workspace status:", err);
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = async (workspaceId, nextPlan) => {
    setSaving(true);
    try {
      await apiClient.put(`/api/admin/workspaces/${workspaceId}/plan`, { plan_id: nextPlan });
      await load();
      if (selected === workspaceId) await loadDetail(workspaceId);
    } catch (err) {
      console.error("Failed to update workspace plan:", err);
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(
    () =>
      items.map((w) => ({
        id: w.id || w.workspace_id,
        workspace_id: w.id || w.workspace_id,
        name: w.name || "Untitled workspace",
        owner_email: w.owner_email || "—",
        status: w.status || "unknown",
        plan_id: w.plan_id || "—",
      })),
    [items]
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <PanelCard
        title="Workspaces"
        subtitle="Backend-confirmed workspace admin"
        actions={<SmallButton onClick={load} icon={RefreshCw}>Refresh</SmallButton>}
      >
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
          <TextInput value={search} onChange={setSearch} placeholder="Search workspace or owner email" />
          <SelectInput
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: "All statuses" },
              "active",
              "inactive",
              "suspended",
              "trialing",
              "cancelled",
              "archived",
            ]}
          />
        </div>

        {loading ? (
          <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
        ) : (
          <SimpleTable
            columns={[
              { key: "name", label: "Workspace" },
              { key: "owner_email", label: "Owner" },
              {
                key: "status",
                label: "Status",
                render: (row) => <StatusPill label={row.status} />,
              },
              { key: "plan_id", label: "Plan" },
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <SmallButton onClick={() => loadDetail(row.workspace_id)}>View</SmallButton>
                    <SmallButton
                      onClick={() =>
                        updateStatus(row.workspace_id, row.status === "active" ? "inactive" : "active")
                      }
                      disabled={saving}
                    >
                      Toggle Status
                    </SmallButton>
                  </div>
                ),
              },
            ]}
            rows={rows}
            emptyLabel="No workspaces found"
          />
        )}
      </PanelCard>

      <PanelCard title="Workspace Detail" subtitle="Select a workspace to inspect members and change plan">
        {!detail ? (
          <div className="text-sm text-[var(--cth-admin-muted)]">Select a workspace from the table.</div>
        ) : (
          <div className="grid gap-4">
            <div>
              <div className="text-base font-semibold text-[var(--cth-admin-ink)]">
                {detail.workspace?.name || "Untitled workspace"}
              </div>
              <div className="mt-1 text-xs text-[var(--cth-admin-muted)]">
                {detail.workspace?.id || detail.workspace?.workspace_id}
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]">Plan</div>
                <SelectInput
                  value={detail.workspace?.plan_id || "foundation"}
                  onChange={(val) => updatePlan(detail.workspace?.id || detail.workspace?.workspace_id, val)}
                  options={["free", "foundation", "structure", "house", "estate", "legacy"]}
                />
              </div>

              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]">Workspace Members</div>
                <div className="text-sm text-[var(--cth-admin-ink)]">
                  {(detail.workspace_members || []).length} workspace members · {(detail.team_members || []).length} team members
                </div>
              </div>
            </div>
          </div>
        )}
      </PanelCard>
    </div>
  );
}

function UsersPanel() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (role.trim()) params.role = role.trim();

      const res = await apiClient.get("/api/admin/users", { params });
      setItems(res?.users || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  useEffect(() => {
    load();
  }, [load]);

  const updateRole = async (userId, nextRole) => {
    setSaving(true);
    try {
      await apiClient.put(`/api/admin/users/${userId}/role`, { role: nextRole });
      await load();
    } catch (err) {
      console.error("Failed to update user role:", err);
      alert(err?.response?.data?.detail || "Failed to update user role");
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (userId) => {
    if (!window.confirm("Remove this user from admin access? This will mark the user inactive.")) return;
    setSaving(true);
    try {
      await apiClient.delete(`/api/admin/users/${userId}`);
      await load();
    } catch (err) {
      console.error("Failed to remove user:", err);
      alert(err?.response?.data?.detail || "Failed to remove user");
    } finally {
      setSaving(false);
    }
  };

  const rows = items.map((u) => ({
    id: u.id || u.clerk_user_id || u.clerk_id,
    name: u.name || "Unnamed user",
    email: u.email || "—",
    role: u.role || "user",
    status: u.status || "unknown",
  }));

  return (
    <PanelCard
      title="Users"
      subtitle="Global user admin"
      actions={<SmallButton onClick={load} icon={RefreshCw}>Refresh</SmallButton>}
    >
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
        <TextInput value={search} onChange={setSearch} placeholder="Search user or email" />
        <SelectInput
          value={role}
          onChange={setRole}
          options={[
            { value: "", label: "All roles" },
            "user",
            "admin",
            "super_admin",
          ]}
        />
      </div>

      {loading ? (
        <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
      ) : (
        <SimpleTable
          columns={[
            { key: "name", label: "User" },
            { key: "email", label: "Email" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusPill label={row.status} />,
            },
            { key: "role", label: "Role" },
            {
              key: "actions",
              label: "Actions",
              render: (row) => {
                const isSelf = row.id === SELF_USER_ID;
                const isReserved = row.id === "default";
                return (
                  <div className="flex flex-wrap gap-2">
                    <SmallButton onClick={() => updateRole(row.id, "user")} disabled={saving || isSelf || isReserved}>User</SmallButton>
                    <SmallButton onClick={() => updateRole(row.id, "admin")} disabled={saving || isSelf || isReserved}>Admin</SmallButton>
                    <SmallButton onClick={() => updateRole(row.id, "super_admin")} disabled={saving || isReserved}>Super</SmallButton>
                    <SmallButton onClick={() => removeUser(row.id)} disabled={saving || isSelf || isReserved}>Remove</SmallButton>
                    {isSelf ? <span className="text-xs text-[var(--cth-status-warning-deep)] self-center">Current admin account locked</span> : null}
                    {isReserved ? <span className="text-xs text-[var(--cth-admin-muted)] self-center">Reserved</span> : null}
                  </div>
                );
              },
            },
          ]}
          rows={rows}
          emptyLabel="No users found"
        />
      )}
    </PanelCard>
  );
}

function DocumentsPanel() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/documents");
      setItems(res?.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = items
    .filter((d) => {
      const workspaceId = d.workspace_id || d.content?.workspace_id || "";
      const isDeleted = Boolean(d.is_deleted) || Boolean(d.deleted_at);
      return workspaceId === CORE_TRUTH_HOUSE_WORKSPACE_ID && !isDeleted;
    })
    .map((d) => ({
      id: d.document_id || d.id,
      title: d.title || d.filename || "Untitled",
      category: d.category || d.doc_type || "general",
      workspace_id: d.workspace_id || d.content?.workspace_id || "—",
      updated_at: d.updated_at ? new Date(d.updated_at).toLocaleDateString() : "—",
    }));

  return (
    <PanelCard
      title="Documents"
      subtitle="Platform document visibility"
      actions={<SmallButton onClick={load} icon={RefreshCw}>Refresh</SmallButton>}
    >
      {loading ? (
        <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
      ) : (
        <SimpleTable
          columns={[
            { key: "title", label: "Title" },
            { key: "category", label: "Category" },
            { key: "workspace_id", label: "Workspace" },
            { key: "updated_at", label: "Updated" },
          ]}
          rows={rows}
          emptyLabel="No documents found"
        />
      )}
    </PanelCard>
  );
}

function WorkspaceAuditPanel() {
  const [workspaceId, setWorkspaceId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    if (!workspaceId.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/admin/audit/workspace-access/${workspaceId.trim()}`);
      setResult(res || null);
    } catch (err) {
      console.error("Failed to audit workspace access:", err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelCard
      title="Workspace Access Audit"
      subtitle="Inspect workspace_members and team_members"
      actions={
        <PrimaryButton onClick={runAudit} disabled={loading || !workspaceId.trim()}>
          {loading ? "Running..." : "Run Audit"}
        </PrimaryButton>
      }
    >
      <div className="grid gap-4">
        <TextInput value={workspaceId} onChange={setWorkspaceId} placeholder="Enter workspace id" />

        {!result ? (
          <div className="text-sm text-[var(--cth-admin-muted)]">
            Enter a workspace ID and run the access audit.
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-3">
              <StatusPill label={`workspace_members: ${result.workspace_member_count || 0}`} />
              <StatusPill label={`team_members: ${result.team_member_count || 0}`} />
            </div>

            <div className="text-sm text-[var(--cth-admin-ink)]">
              Workspace: {result.workspace?.name || result.workspace?.id || result.workspace?.workspace_id || "—"}
            </div>
          </div>
        )}
      </div>
    </PanelCard>
  );
}

export default function AdminAccountsUsersPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Manage</p>
        <h2 className="mt-2 text-3xl font-semibold text-[var(--cth-admin-ink)]">Accounts & Users</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--cth-admin-muted)]">
          Manage workspaces, users, documents, and workspace-level access from the separated admin shell.
        </p>
      </section>

      <WorkspacesPanel />
      <UsersPanel />
      <DocumentsPanel />
      <WorkspaceAuditPanel />
    </div>
  );
}
