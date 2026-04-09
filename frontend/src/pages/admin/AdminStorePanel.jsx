import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  DollarSign,
  Edit,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Upload,
} from "lucide-react";

import { useColors } from "../../context/ThemeContext";
import apiClient from "../../lib/apiClient";

const CATEGORIES = ["template", "toolkit", "course", "bundle", "other"];

function SectionLabel({ children }) {
  const C = useColors();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div
        style={{
          width: 3,
          height: 13,
          background: C.cinnabar,
          borderRadius: 2,
        }}
      />
      <p
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: C.textMuted,
          margin: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {children}
      </p>
    </div>
  );
}

function useToast() {
  const [state, setState] = useState({ msg: null, error: false });
  const timeoutRef = useRef(null);

  const show = useCallback((msg, error = false) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState({ msg, error });
    timeoutRef.current = setTimeout(() => {
      setState({ msg: null, error: false });
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { ...state, show };
}

function Toast({ msg, error }) {
  if (!msg) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 300,
        padding: "10px 18px",
        borderRadius: 9,
        background: error
          ? "rgba(239,68,68,0.15)"
          : "rgba(16,185,129,0.15)",
        border: `1px solid ${
          error ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"
        }`,
        color: error ? "#f87171" : "#10B981",
        fontSize: 12.5,
        fontWeight: 500,
      }}
    >
      {msg}
    </div>
  );
}

function Inp({ value, onChange, placeholder, type = "text", style: ext }) {
  const C = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      style={{
        width: "100%",
        background: `${C.tuscany}0A`,
        border: `1px solid ${
          focused ? `${C.cinnabar}45` : `${C.tuscany}12`
        }`,
        borderRadius: 8,
        padding: "8px 11px",
        fontSize: 12.5,
        color: C.textPrimary,
        fontFamily: "'DM Sans', sans-serif",
        outline: "none",
        boxSizing: "border-box",
        ...ext,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Txt({ value, onChange, placeholder, rows = 3 }) {
  const C = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        background: `${C.tuscany}0A`,
        border: `1px solid ${
          focused ? `${C.cinnabar}45` : `${C.tuscany}12`
        }`,
        borderRadius: 8,
        padding: "8px 11px",
        fontSize: 12.5,
        color: C.textPrimary,
        fontFamily: "'DM Sans', sans-serif",
        outline: "none",
        boxSizing: "border-box",
        resize: "vertical",
        lineHeight: 1.6,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Sel({ value, onChange, options }) {
  const C = useColors();

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: `${C.tuscany}0A`,
        border: `1px solid ${C.tuscany}12`,
        borderRadius: 8,
        padding: "8px 11px",
        fontSize: 12.5,
        color: C.textPrimary,
        fontFamily: "'DM Sans', sans-serif",
        outline: "none",
        cursor: "pointer",
      }}
    >
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;

        return (
          <option key={optionValue} value={optionValue} style={{ background: "#1A0020" }}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

function Btn({
  children,
  onClick,
  variant,
  disabled,
  icon: IconCmp,
  style: extraStyle,
  type = "button",
}) {
  const C = useColors();

  const base =
    variant === "ghost"
      ? {
          background: "none",
          border: `1px solid ${C.tuscany}12`,
          color: C.textMuted,
        }
      : variant === "danger"
      ? {
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.25)",
          color: "#f87171",
        }
      : variant === "green"
      ? {
          background: "rgba(16,185,129,0.12)",
          border: "1px solid rgba(16,185,129,0.3)",
          color: "#10B981",
        }
      : {
          background: C.cinnabar,
          border: "none",
          color: "#fff",
        };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 16px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'DM Sans', sans-serif",
        opacity: disabled ? 0.5 : 1,
        ...base,
        ...extraStyle,
      }}
    >
      {IconCmp && <IconCmp size={13} />}
      {children}
    </button>
  );
}

function parseError(err, fallback) {
  return err?.payload?.detail || err?.message || fallback;
}

async function uploadAuthenticatedFile(url, file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    headers: await apiClient.getAuthHeaders({ isFormData: true }),
    body: formData,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";
  let payload = null;

  if (contentType.includes("application/json")) {
    payload = await response.json().catch(() => null);
  }

  if (!response.ok) {
    throw new Error(payload?.detail || `Upload failed (${response.status})`);
  }

  return payload;
}

export function AdminStoreProducts() {
  const C = useColors();
  const toast = useToast();
  const uploadInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price_cents: 0,
    category: "template",
    is_published: false,
    tags: "",
  });

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/store/admin/products");
      setProducts(response?.products || []);
    } catch (err) {
      console.error("Failed to load products:", err);
      toast.show(parseError(err, "Failed to load products"), true);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function openNew() {
    setForm({
      name: "",
      description: "",
      price_cents: 0,
      category: "template",
      is_published: false,
      tags: "",
    });
    setEditing("new");
  }

  function openEdit(product) {
    setForm({
      name: product.name || "",
      description: product.description || "",
      price_cents: product.price_cents || 0,
      category: product.category || "template",
      is_published: !!product.is_published,
      tags: (product.tags || []).join(", "),
    });
    setEditing(product.product_id);
  }

  async function saveProduct() {
    setSaving(true);

    const payload = {
      ...form,
      price_cents: parseInt(form.price_cents, 10) || 0,
      tags: String(form.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      const isNew = editing === "new";

      if (isNew) {
        await apiClient.post("/api/store/admin/products", payload);
      } else {
        await apiClient.put(`/api/store/admin/products/${editing}`, payload);
      }

      await loadProducts();
      setEditing(null);
      toast.show(isNew ? "Product created" : "Product updated");
    } catch (err) {
      console.error("Failed to save product:", err);
      toast.show(parseError(err, "Save failed"), true);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(productId) {
    if (!window.confirm("Delete this product?")) return;

    try {
      await apiClient.delete(`/api/store/admin/products/${productId}`);
      await loadProducts();
      toast.show("Deleted");
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast.show(parseError(err, "Delete failed"), true);
    }
  }

  async function togglePublish(product) {
    try {
      await apiClient.put(`/api/store/admin/products/${product.product_id}`, {
        is_published: !product.is_published,
      });
      await loadProducts();
      toast.show(product.is_published ? "Unpublished" : "Published to store");
    } catch (err) {
      console.error("Failed to toggle publish:", err);
      toast.show(parseError(err, "Failed"), true);
    }
  }

  async function uploadFile(productId, file) {
    if (!file) return;

    setUploading(productId);

    try {
      await uploadAuthenticatedFile(
        apiClient.buildApiUrl(`/api/store/admin/products/${productId}/upload`),
        file
      );
      await loadProducts();
      toast.show("File uploaded");
    } catch (err) {
      console.error("Failed to upload file:", err);
      toast.show(parseError(err, "Upload failed"), true);
    } finally {
      setUploading(null);
    }
  }

  return (
    <div data-testid="store-products-panel">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <SectionLabel>Digital Products</SectionLabel>
        <Btn onClick={openNew} icon={Plus}>
          Add Product
        </Btn>
      </div>

      <div
        style={{
          background: "rgba(59,130,246,0.06)",
          border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 9,
          padding: "9px 14px",
          marginBottom: 14,
          fontSize: 11.5,
          color: C.textMuted,
          fontFamily: "'DM Sans', sans-serif",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Package size={14} style={{ color: "#3B82F6" }} />
        Published products appear in the public store at{" "}
        <strong style={{ color: C.textPrimary }}>/store</strong>. Customers pay
        via Stripe and receive an instant download link.
      </div>

      {editing && (
        <div
          style={{
            background: `${C.tuscany}06`,
            border: `1px solid ${C.tuscany}12`,
            borderRadius: 11,
            padding: "16px 18px",
            marginBottom: 14,
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: C.textMuted,
              margin: "0 0 12px",
            }}
          >
            {editing === "new" ? "New Product" : "Edit Product"}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <label style={labelStyle(C)}>Product Name *</label>
              <Inp
                value={form.name}
                onChange={(value) => setField("name", value)}
                placeholder="e.g. Brand Foundation Toolkit"
              />
            </div>

            <div>
              <label style={labelStyle(C)}>Category</label>
              <Sel
                value={form.category}
                onChange={(value) => setField("category", value)}
                options={CATEGORIES}
              />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle(C)}>Description *</label>
            <Txt
              value={form.description}
              onChange={(value) => setField("description", value)}
              placeholder="What does this product help founders do?"
              rows={3}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div>
              <label style={labelStyle(C)}>Price (cents — $47 = 4700)</label>
              <Inp
                value={form.price_cents}
                onChange={(value) => setField("price_cents", value)}
                type="number"
                placeholder="4700"
              />
            </div>

            <div>
              <label style={labelStyle(C)}>Tags (comma separated)</label>
              <Inp
                value={form.tags}
                onChange={(value) => setField("tags", value)}
                placeholder="brand, strategy, template"
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <button
              onClick={() => setField("is_published", !form.is_published)}
              style={{
                padding: "5px 14px",
                borderRadius: 7,
                border: `1px solid ${
                  form.is_published
                    ? "rgba(16,185,129,0.35)"
                    : `${C.tuscany}12`
                }`,
                background: form.is_published
                  ? "rgba(16,185,129,0.1)"
                  : `${C.tuscany}0A`,
                cursor: "pointer",
                fontSize: 12,
                color: form.is_published ? "#10B981" : C.textMuted,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {form.is_published ? "Publish to store" : "Save as draft"}
            </button>

            <span style={{ fontSize: 11, color: C.textMuted }}>
              You can upload the product file after saving.
            </span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              onClick={saveProduct}
              disabled={saving || !form.name || !form.description}
            >
              {saving
                ? "Saving..."
                : editing === "new"
                ? "Create Product"
                : "Save Changes"}
            </Btn>

            <Btn variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Btn>
          </div>
        </div>
      )}

      {loading ? (
        <p style={loadingStyle(C)}>Loading...</p>
      ) : products.length === 0 ? (
        <div style={emptyStateStyle(C)}>
          <Package size={32} style={{ color: C.textMuted, marginBottom: 10 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: C.textMuted, margin: "10px 0 4px" }}>
            No products yet
          </p>
          <p style={{ fontSize: 12, color: C.textMuted, margin: "0 0 16px" }}>
            Add your first digital product to start selling in the store
          </p>
          <Btn onClick={openNew}>+ Add first product</Btn>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {products.map((product) => (
            <div key={product.product_id} style={cardStyle(C)}>
              <div style={iconBoxStyle(C)}>
                <Package size={18} style={{ color: C.cinnabar }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.textPrimary,
                      margin: 0,
                    }}
                  >
                    {product.name}
                  </p>

                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 8px",
                      borderRadius: 20,
                      background: product.is_published
                        ? "rgba(16,185,129,0.12)"
                        : `${C.tuscany}0A`,
                      color: product.is_published ? "#10B981" : C.textMuted,
                    }}
                  >
                    {product.is_published ? "Live" : "Draft"}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: "#C9A84C",
                      fontWeight: 700,
                    }}
                  >
                    ${((product.price_cents || 0) / 100).toFixed(0)}
                  </span>
                </div>

                <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>
                  {product.purchase_count || 0} purchases · $
                  {((product.revenue_cents || 0) / 100).toFixed(0)} revenue
                  {product.file_url ? " · File attached" : " · No file"}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexShrink: 0,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <input
                  ref={uploadTarget === product.product_id ? uploadInputRef : null}
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      uploadFile(product.product_id, e.target.files[0]);
                    }
                    e.target.value = "";
                  }}
                />

                <button
                  onClick={() => {
                    setUploadTarget(product.product_id);
                    setTimeout(() => uploadInputRef.current?.click(), 50);
                  }}
                  disabled={uploading === product.product_id}
                  style={smallButtonStyle(C)}
                >
                  <Upload size={10} />
                  {uploading === product.product_id ? "Uploading..." : "File"}
                </button>

                <button
                  onClick={() => togglePublish(product)}
                  style={{
                    ...smallButtonStyle(C),
                    background: product.is_published
                      ? "rgba(16,185,129,0.08)"
                      : `${C.tuscany}0A`,
                    border: `1px solid ${
                      product.is_published
                        ? "rgba(16,185,129,0.25)"
                        : `${C.tuscany}12`
                    }`,
                    color: product.is_published ? "#10B981" : C.textMuted,
                  }}
                >
                  {product.is_published ? "Unpublish" : "Publish"}
                </button>

                <button
                  onClick={() => openEdit(product)}
                  style={smallButtonStyle(C)}
                >
                  <Edit size={10} />
                  Edit
                </button>

                <button
                  onClick={() => deleteProduct(product.product_id)}
                  style={{
                    ...smallButtonStyle(C),
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                  }}
                >
                  <Trash2 size={10} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast msg={toast.msg} error={toast.error} />
    </div>
  );
}

export function AdminStoreOrders() {
  const C = useColors();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, count: 0 });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/store/admin/orders");
      const purchases = response?.purchases || [];
      const totalRevenue = response?.total_revenue_dollars || 0;
      const orderCount = response?.order_count || 0;

      setOrders(purchases);
      setStats({
        total: totalRevenue,
        count: orderCount,
      });
    } catch (err) {
      console.error("Failed to load store orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div data-testid="store-orders-panel">
      <SectionLabel>Store Orders</SectionLabel>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[
          {
            label: "Total Revenue",
            value: `$${(stats.total || 0).toFixed(2)}`,
            color: "#10B981",
            Icon: DollarSign,
          },
          {
            label: "Total Orders",
            value: stats.count || 0,
            color: "#C9A84C",
            Icon: ShoppingCart,
          },
          {
            label: "Avg Order",
            value: stats.count
              ? `$${((stats.total || 0) / stats.count).toFixed(2)}`
              : "$0",
            color: "#3B82F6",
            Icon: DollarSign,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: `${C.tuscany}06`,
              border: `1px solid ${C.tuscany}12`,
              borderRadius: 11,
              padding: "13px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
              }}
            >
              <stat.Icon size={14} style={{ color: stat.color }} />
            </div>

            <p
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: stat.color,
                margin: "0 0 2px",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {stat.value}
            </p>

            <p
              style={{
                fontSize: 10,
                color: C.textMuted,
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          background: `${C.tuscany}06`,
          border: `1px solid ${C.tuscany}12`,
          borderRadius: 11,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <p style={loadingStyle(C)}>Loading...</p>
        ) : orders.length === 0 ? (
          <p
            style={{
              padding: "32px",
              textAlign: "center",
              color: C.textMuted,
              fontSize: 12,
            }}
          >
            No orders yet. Products will appear here when customers purchase.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.tuscany}12` }}>
                {["Customer", "Product", "Amount", "Date"].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "9px 14px",
                      textAlign: "left",
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: C.textMuted,
                      background: `${C.tuscany}04`,
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {orders.map((order, index) => (
                <tr
                  key={order.purchase_id || index}
                  style={{
                    borderBottom:
                      index < orders.length - 1
                        ? `1px solid ${C.tuscany}08`
                        : "none",
                  }}
                >
                  <td
                    style={{
                      padding: "9px 14px",
                      fontSize: 12,
                      color: C.textMuted,
                    }}
                  >
                    {order.user_id}
                  </td>
                  <td
                    style={{
                      padding: "9px 14px",
                      fontSize: 12,
                      fontWeight: 500,
                      color: C.textPrimary,
                    }}
                  >
                    {order.product_name}
                  </td>
                  <td
                    style={{
                      padding: "9px 14px",
                      fontSize: 12,
                      color: "#C9A84C",
                      fontWeight: 700,
                    }}
                  >
                    ${((order.amount_cents || 0) / 100).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "9px 14px",
                      fontSize: 11,
                      color: C.textMuted,
                    }}
                  >
                    {order.completed_at
                      ? new Date(order.completed_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function labelStyle(C) {
  return {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: C.textMuted,
    marginBottom: 5,
  };
}

function loadingStyle(C) {
  return {
    textAlign: "center",
    padding: "24px",
    color: C.textMuted,
    fontSize: 12,
  };
}

function emptyStateStyle(C) {
  return {
    background: `${C.tuscany}06`,
    border: `1px solid ${C.tuscany}12`,
    borderRadius: 11,
    padding: "40px 20px",
    textAlign: "center",
  };
}

function cardStyle(C) {
  return {
    background: `${C.tuscany}06`,
    border: `1px solid ${C.tuscany}12`,
    borderRadius: 11,
    padding: "13px 16px",
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
  };
}

function iconBoxStyle(C) {
  return {
    width: 38,
    height: 38,
    borderRadius: 9,
    background: `${C.cinnabar}15`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };
}

function smallButtonStyle(C) {
  return {
    background: `${C.tuscany}0A`,
    border: `1px solid ${C.tuscany}12`,
    borderRadius: 6,
    padding: "4px 10px",
    fontSize: 11,
    color: C.textMuted,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 4,
  };
}
