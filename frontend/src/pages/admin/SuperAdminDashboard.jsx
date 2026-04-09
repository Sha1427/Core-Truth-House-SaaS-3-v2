import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Shield,
  RefreshCw,
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Package,
  ShoppingCart,
  Search,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { DashboardLayout } from '../../components/Layout';
import { useColors } from '../../context/ThemeContext';
import apiClient from '../../lib/apiClient';
import { AdminStoreProducts, AdminStoreOrders } from './AdminStorePanel';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'workspaces', label: 'Workspaces', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'workspace_audit', label: 'Workspace Audit', icon: Search },
  { id: 'store_products', label: 'Store Products', icon: Package },
  { id: 'store_orders', label: 'Store Orders', icon: ShoppingCart },
];

function StatCard({ label, value, icon: Icon, color }) {
  const C = useColors();

  return (
    <div
      style={{
        background: `${C.tuscany}06`,
        border: `1px solid ${C.tuscany}12`,
        borderRadius: 12,
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function PanelCard({ title, subtitle, children, actions = null }) {
  const C = useColors();

  return (
    <div
      style={{
        background: `${C.tuscany}06`,
        border: `1px solid ${C.tuscany}12`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${C.tuscany}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{subtitle}</div>
          ) : null}
        </div>
        {actions}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function SmallButton({ onClick, children, disabled = false, icon: Icon = null }) {
  const C = useColors();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 12px',
        borderRadius: 8,
        border: `1px solid ${C.tuscany}12`,
        background: `${C.tuscany}06`,
        color: C.textMuted,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {Icon ? <Icon size={13} /> : null}
      {children}
    </button>
  );
}

function PrimaryButton({ onClick, children, disabled = false }) {
  const C = useColors();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 12px',
        borderRadius: 8,
        border: 'none',
        background: C.cinnabar,
        color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function TextInput({ value, onChange, placeholder = '' }) {
  const C = useColors();

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: `${C.tuscany}0A`,
        border: `1px solid ${C.tuscany}12`,
        borderRadius: 8,
        padding: '8px 10px',
        color: C.textPrimary,
        fontSize: 12,
        outline: 'none',
      }}
    />
  );
}

function SelectInput({ value, onChange, options }) {
  const C = useColors();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        background: `${C.tuscany}0A`,
        border: `1px solid ${C.tuscany}12`,
        borderRadius: 8,
        padding: '8px 10px',
        color: C.textPrimary,
        fontSize: 12,
        outline: 'none',
      }}
    >
      {options.map((o) => {
        const val = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        return (
          <option key={val} value={val} style={{ background: '#1A0020' }}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

function StatusPill({ label }) {
  const C = useColors();
  const normalized = String(label || '').toLowerCase();

  let color = C.textMuted;
  let bg = `${C.tuscany}0A`;

  if (['active', 'completed', 'paid', 'ready'].includes(normalized)) {
    color = '#22c55e';
    bg = 'rgba(34,197,94,0.12)';
  } else if (['pending', 'trialing'].includes(normalized)) {
    color = '#f59e0b';
    bg = 'rgba(245,158,11,0.12)';
  } else if (['inactive', 'cancelled', 'archived', 'suspended', 'error'].includes(normalized)) {
    color = '#ef4444';
    bg = 'rgba(239,68,68,0.12)';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 600,
        color,
        background: bg,
      }}
    >
      {label}
    </span>
  );
}

function SimpleTable({ columns, rows, emptyLabel = 'No records found' }) {
  const C = useColors();

  if (!rows.length) {
    return <div style={{ color: C.textMuted, fontSize: 12 }}>{emptyLabel}</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: 'left',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: C.textMuted,
                  padding: '0 0 10px 0',
                  borderBottom: `1px solid ${C.tuscany}10`,
                }}
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
                <td
                  key={col.key}
                  style={{
                    padding: '12px 0',
                    borderBottom: i < rows.length - 1 ? `1px solid ${C.tuscany}08` : 'none',
                    fontSize: 12,
                    color: C.textPrimary,
                    verticalAlign: 'top',
                  }}
                >
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OverviewPanel({ data, refresh }) {
  const workspaces = data?.workspaces || {};
  const users = data?.users || {};
  const store = data?.store || {};
  const billing = data?.billing || {};

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
        <StatCard label="Workspaces" value={workspaces.total || 0} icon={Building2} color="#3b82f6" />
        <StatCard label="Users" value={users.total || 0} icon={Users} color="#22c55e" />
        <StatCard label="Store Revenue" value={`$${store.revenue_dollars || 0}`} icon={DollarSign} color="#f59e0b" />
        <StatCard label="Billing Revenue" value={`$${billing.revenue_dollars || 0}`} icon={Activity} color="#e04e35" />
      </div>

      <PanelCard
        title="Admin Overview"
        subtitle="Live backend-confirmed admin summary"
        actions={<SmallButton onClick={refresh} icon={RefreshCw}>Refresh</SmallButton>}
      >
        <div style={{ display: 'grid', gap: 8, fontSize: 12 }}>
          <div>Active workspaces: {workspaces.active || 0}</div>
          <div>Active users: {users.active || 0}</div>
          <div>Completed store orders: {store.completed_orders || 0}</div>
          <div>Paid billing transactions: {billing.paid_transactions || 0}</div>
        </div>
      </PanelCard>
    </div>
  );
}

function WorkspacesPanel() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (status.trim()) params.status = status.trim();

      const res = await apiClient.get('/api/admin/workspaces', { params });
      setItems(res?.workspaces || []);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
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
      console.error('Failed to load workspace detail:', err);
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
      console.error('Failed to update workspace status:', err);
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
      console.error('Failed to update workspace plan:', err);
    } finally {
      setSaving(false);
    }
  };

  const rows = useMemo(() => items.map((w) => ({
    id: w.id || w.workspace_id,
    workspace_id: w.id || w.workspace_id,
    name: w.name || 'Untitled workspace',
    owner_email: w.owner_email || '—',
    status: w.status || 'unknown',
    plan_id: w.plan_id || '—',
  })), [items]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 16 }}>
      <PanelCard
        title="Workspaces"
        subtitle="Backend-confirmed workspace admin"
        actions={<SmallButton onClick={load} icon={RefreshCw}>Refresh</SmallButton>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10, marginBottom: 14 }}>
          <TextInput value={search} onChange={setSearch} placeholder="Search workspace or owner email" />
          <SelectInput
            value={status}
            onChange={setStatus}
            options={[
              { value: '', label: 'All statuses' },
              'active',
              'inactive',
              'suspended',
              'trialing',
              'cancelled',
              'archived',
            ]}
          />
        </div>

        {loading ? (
          <div style={{ fontSize: 12 }}>Loading...</div>
        ) : (
          <SimpleTable
            columns={[
              { key: 'name', label: 'Workspace' },
              { key: 'owner_email', label: 'Owner' },
              {
                key: 'status',
                label: 'Status',
                render: (row) => <StatusPill label={row.status} />,
              },
              { key: 'plan_id', label: 'Plan' },
              {
                key: 'actions',
                label: 'Actions',
                render: (row) => (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <SmallButton onClick={() => loadDetail(row.workspace_id)}>View</SmallButton>
                    <SmallButton
                      onClick={() => updateStatus(row.workspace_id, row.status === 'active' ? 'inactive' : 'active')}
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
          <div style={{ fontSize: 12, opacity: 0.7 }}>Select a workspace from the table.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{detail.workspace?.name || 'Untitled workspace'}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                {detail.workspace?.id || detail.workspace?.workspace_id}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>Plan</div>
                <SelectInput
                  value={detail.workspace?.plan_id || 'foundation'}
                  onChange={(val) => updatePlan(detail.workspace?.id || detail.workspace?.workspace_id, val)}
                  options={['free', 'foundation', 'structure', 'house', 'estate', 'legacy']}
                />
              </div>

              <div>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>Workspace Members</div>
                <div style={{ fontSize: 12 }}>
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
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (role.trim()) params.role = role.trim();

      const res = await apiClient.get('/api/admin/users', { params });
      setItems(res?.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
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
      console.error('Failed to update user role:', err);
    } finally {
      setSaving(false);
    }
  };

  const rows = items.map((u) => ({
    id: u.id || u.clerk_user_id || u.clerk_id,
    name: u.name || 'Unnamed user',
    email: u.email || '—',
    role: u.role || 'user',
    status: u.status || 'unknown',
  }));

  return (
    <PanelCard
      title="Users"
      subtitle="Global user admin"
      actions={<SmallButton onClick={load} icon={RefreshCw}>Refresh</SmallButton>}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10, marginBottom: 14 }}>
        <TextInput value={search} onChange={setSearch} placeholder="Search user or email" />
        <SelectInput
          value={role}
          onChange={setRole}
          options={[
            { value: '', label: 'All roles' },
            'user',
            'admin',
            'super_admin',
          ]}
        />
      </div>

      {loading ? (
        <div style={{ fontSize: 12 }}>Loading...</div>
      ) : (
        <SimpleTable
          columns={[
            { key: 'name', label: 'User' },
            { key: 'email', label: 'Email' },
            {
              key: 'status',
              label: 'Status',
              render: (row) => <StatusPill label={row.status} />,
            },
            { key: 'role', label: 'Role' },
            {
              key: 'actions',
              label: 'Actions',
              render: (row) => (
                <div style={{ display: 'flex', gap: 6 }}>
                  <SmallButton onClick={() => updateRole(row.id, 'user')} disabled={saving}>User</SmallButton>
                  <SmallButton onClick={() => updateRole(row.id, 'admin')} disabled={saving}>Admin</SmallButton>
                  <SmallButton onClick={() => updateRole(row.id, 'super_admin')} disabled={saving}>Super</SmallButton>
                </div>
              ),
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
      const res = await apiClient.get('/api/admin/documents');
      setItems(res?.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = items.map((d) => ({
    id: d.document_id,
    title: d.title || 'Untitled',
    category: d.category || 'general',
    workspace_id: d.workspace_id || '—',
    updated_at: d.updated_at ? new Date(d.updated_at).toLocaleDateString() : '—',
  }));

  return (
    <PanelCard
      title="Documents"
      subtitle="Platform document visibility"
      actions={<SmallButton onClick={load} icon={RefreshCw}>Refresh</SmallButton>}
    >
      {loading ? (
        <div style={{ fontSize: 12 }}>Loading...</div>
      ) : (
        <SimpleTable
          columns={[
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            { key: 'workspace_id', label: 'Workspace' },
            { key: 'updated_at', label: 'Updated' },
          ]}
          rows={rows}
          emptyLabel="No documents found"
        />
      )}
    </PanelCard>
  );
}

function WorkspaceAuditPanel() {
  const [workspaceId, setWorkspaceId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAudit = async () => {
    if (!workspaceId.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/admin/audit/workspace-access/${workspaceId.trim()}`);
      setResult(res || null);
    } catch (err) {
      console.error('Failed to audit workspace access:', err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelCard
      title="Workspace Access Audit"
      subtitle="Inspect workspace_members and team_members"
      actions={<PrimaryButton onClick={runAudit} disabled={loading || !workspaceId.trim()}>{loading ? 'Running...' : 'Run Audit'}</PrimaryButton>}
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <TextInput value={workspaceId} onChange={setWorkspaceId} placeholder="Enter workspace id" />

        {!result ? (
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Enter a workspace ID and run the access audit.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatusPill label={`workspace_members: ${result.workspace_member_count || 0}`} />
              <StatusPill label={`team_members: ${result.team_member_count || 0}`} />
            </div>

            <div style={{ fontSize: 12 }}>
              Workspace: {result.workspace?.name || result.workspace?.id || result.workspace?.workspace_id || '—'}
            </div>
          </div>
        )}
      </div>
    </PanelCard>
  );
}

export default function SuperAdminDashboard() {
  const C = useColors();
  const [active, setActive] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, overviewRes] = await Promise.all([
        apiClient.get('/api/admin/me'),
        apiClient.get('/api/admin/overview'),
      ]);
      setMe(meRes || null);
      setOverview(overviewRes || null);
    } catch (err) {
      console.error('Failed to load super admin dashboard:', err);
      setMe(null);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshOverview();
  }, [refreshOverview]);

  const ActiveIcon = NAV.find((n) => n.id === active)?.icon || Shield;

  return (
    <DashboardLayout>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: C.darkest,
        }}
      >
        <aside
          style={{
            width: 240,
            borderRight: `1px solid ${C.tuscany}12`,
            padding: 18,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${C.cinnabar}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={18} style={{ color: C.cinnabar }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>Super Admin</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                {me?.global_role || 'loading'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === active;

              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: isActive ? `${C.cinnabar}18` : 'transparent',
                    color: isActive ? C.textPrimary : C.textMuted,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Icon size={15} />
                  <span style={{ fontSize: 12 }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <main style={{ flex: 1, padding: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ActiveIcon size={18} style={{ color: C.cinnabar }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
                  {NAV.find((n) => n.id === active)?.label}
                </div>
                <div style={{ fontSize: 11, color: C.textMuted }}>
                  Backend-confirmed admin surface
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textMuted }}>
                  <AlertCircle size={14} />
                  Loading
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#22c55e' }}>
                  <CheckCircle2 size={14} />
                  Live
                </div>
              )}

              <SmallButton onClick={refreshOverview} icon={RefreshCw}>Refresh</SmallButton>
            </div>
          </div>

          {active === 'overview' && <OverviewPanel data={overview} refresh={refreshOverview} />}
          {active === 'workspaces' && <WorkspacesPanel />}
          {active === 'users' && <UsersPanel />}
          {active === 'documents' && <DocumentsPanel />}
          {active === 'workspace_audit' && <WorkspaceAuditPanel />}
          {active === 'store_products' && <AdminStoreProducts />}
          {active === 'store_orders' && <AdminStoreOrders />}
        </main>
      </div>
    </DashboardLayout>
  );
}
