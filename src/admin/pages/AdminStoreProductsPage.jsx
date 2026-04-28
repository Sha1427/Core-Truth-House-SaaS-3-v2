import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Package } from "lucide-react";
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

function StatusPill({ published }) {
  const label = published ? "published" : "draft";
  const classes = published
    ? "bg-[var(--cth-status-success-soft-bg)] text-[var(--cth-status-success-deep)]"
    : "bg-[var(--cth-status-warning-soft-bg)] text-[var(--cth-status-warning-deep)]";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold ${classes}`}>
      {label}
    </span>
  );
}

function SimpleTable({ columns, rows, onRowClick = null, emptyLabel = "No records found", selectedRowId = null }) {
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
          {rows.map((row, i) => {
            const isSelected = selectedRowId === row.id;
            return (
              <tr
                key={row.id || i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? "cursor-pointer" : ""}
                style={isSelected ? { background: "rgba(224,78,53,0.06)" } : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className="border-b border-[var(--cth-surface-elevated-soft)] py-3 pr-4 align-top text-sm text-[var(--cth-admin-ink)]">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatMoneyFromCents(cents) {
  const value = Number(cents || 0) / 100;
  return `$${value.toFixed(2)}`;
}

export default function AdminStoreProductsPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/admin/store/products");
      const products = res?.products || [];
      setItems(products);
      setSelected((prev) => {
        if (!products.length) return null;
        if (!prev) return products[0];
        return products.find((p) => (p.product_id || p.id) === (prev.product_id || prev.id)) || products[0];
      });
    } catch (err) {
      console.error("Failed to load store products:", err);
      setItems([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    return items
      .filter((item) => {
        const haystack = JSON.stringify(item).toLowerCase();
        const matchesSearch = !search.trim() || haystack.includes(search.trim().toLowerCase());
        const matchesStatus =
          !status.trim() ||
          (status === "published" && item.is_published === true) ||
          (status === "draft" && item.is_published === false);
        return matchesSearch && matchesStatus;
      })
      .map((item) => ({
        id: item.product_id || item.id || item.name,
        raw: item,
        title: item.name || "Untitled product",
        category: item.category || "—",
        published: Boolean(item.is_published),
        price: formatMoneyFromCents(item.price_cents),
        purchases: Number(item.purchase_count || 0),
        revenue: formatMoneyFromCents(item.revenue_cents),
        updated_at: item.updated_at ? new Date(item.updated_at).toLocaleDateString() : "—",
      }));
  }, [items, search, status]);

  const selectedId = selected?.product_id || selected?.id || null;
  const selectedRow = rows.find((row) => row.id === selectedId) || rows[0] || null;
  const selectedProduct = selectedRow?.raw || null;

  useEffect(() => {
    if (!selectedProduct && rows.length) {
      setSelected(rows[0].raw);
    }
  }, [rows, selectedProduct]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--cth-admin-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color-mix(in srgb, var(--cth-admin-accent) 14%, var(--cth-admin-panel))] text-[var(--cth-admin-accent)]">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--cth-admin-ruby)]">Commerce</p>
            <h2 className="mt-1 text-3xl font-semibold text-[var(--cth-admin-ink)]">Store Products</h2>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-[var(--cth-admin-muted)]">
          Review products in the Core Truth House store from the new separated admin shell.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <PanelCard
          title="Products"
          subtitle="Read-only store product list"
          actions={<SmallButton onClick={load} icon={RefreshCw}>Refresh</SmallButton>}
        >
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
            <TextInput value={search} onChange={setSearch} placeholder="Search products" />
            <SelectInput
              value={status}
              onChange={setStatus}
              options={[
                { value: "", label: "All statuses" },
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
              ]}
            />
          </div>

          {loading ? (
            <div className="text-sm text-[var(--cth-admin-muted)]">Loading...</div>
          ) : (
            <SimpleTable
              columns={[
                { key: "title", label: "Product" },
                { key: "category", label: "Category" },
                {
                  key: "published",
                  label: "Status",
                  render: (row) => <StatusPill published={row.published} />,
                },
                { key: "price", label: "Price" },
                { key: "purchases", label: "Purchases" },
                { key: "revenue", label: "Revenue" },
              ]}
              rows={rows}
              selectedRowId={selectedRow?.id || null}
              onRowClick={(row) => setSelected(row.raw)}
              emptyLabel="No products found"
            />
          )}
        </PanelCard>

        <PanelCard title="Product Detail" subtitle="Select a product to inspect details">
          {!selectedProduct ? (
            <div className="text-sm text-[var(--cth-admin-muted)]">Select a product from the table.</div>
          ) : (
            <div className="grid gap-4">
              <div>
                <div className="text-lg font-semibold text-[var(--cth-admin-ink)]">
                  {selectedProduct.name || "Untitled product"}
                </div>
                <div className="mt-1">
                  <StatusPill published={Boolean(selectedProduct.is_published)} />
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]">Description</div>
                <div className="text-sm text-[var(--cth-admin-ink)]">
                  {selectedProduct.description || "No description provided."}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]">Price</div>
                  <div className="text-sm text-[var(--cth-admin-ink)]">{formatMoneyFromCents(selectedProduct.price_cents)}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]">Category</div>
                  <div className="text-sm text-[var(--cth-admin-ink)]">{selectedProduct.category || "—"}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]">Purchases</div>
                  <div className="text-sm text-[var(--cth-admin-ink)]">{selectedProduct.purchase_count || 0}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]">Revenue</div>
                  <div className="text-sm text-[var(--cth-admin-ink)]">{formatMoneyFromCents(selectedProduct.revenue_cents)}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]">Created</div>
                  <div className="text-sm text-[var(--cth-admin-ink)]">
                    {selectedProduct.created_at ? new Date(selectedProduct.created_at).toLocaleString() : "—"}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-xs uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]">Updated</div>
                  <div className="text-sm text-[var(--cth-admin-ink)]">
                    {selectedProduct.updated_at ? new Date(selectedProduct.updated_at).toLocaleString() : "—"}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs uppercase tracking-[0.08em] text-[var(--cth-admin-muted)]">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {(selectedProduct.tags || []).length ? (
                    selectedProduct.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-[var(--cth-admin-panel-alt)] px-2 py-1 text-[10px] font-semibold text-[var(--cth-admin-ruby)]"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-[var(--cth-admin-muted)]">No tags</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
