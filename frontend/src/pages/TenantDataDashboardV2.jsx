/**
 * TenantDataDashboard.jsx
 * Core Truth House OS — Workspace Library
 *
 * Real workspace library page with:
 * - upload
 * - search
 * - filter
 * - download
 * - delete
 * - lightweight overview stats
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Download,
  RefreshCw,
  Search,
  Trash2,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Database,
  Layers,
  ChevronRight,
} from "lucide-react";

import { DashboardLayout, TopBar } from "../components/Layout";
import { useWorkspace } from "../context/WorkspaceContext";
import { useUser } from "../hooks/useAuth";
import apiClient from "../lib/apiClient";
import API_PATHS from "../lib/apiPaths";

const CTH_PAGE_COLORS = {
  darkest: "var(--cth-admin-bg)",
  darker: "var(--cth-admin-panel-alt)",
  cardBg: "var(--cth-admin-panel)",
  crimson: "var(--cth-admin-accent)",
  cinnabar: "var(--cth-admin-accent)",
  tuscany: "var(--cth-admin-tuscany)",
  ruby: "var(--cth-admin-ruby)",
  textPrimary: "var(--cth-admin-ink)",
  textSecondary: "var(--cth-admin-ruby)",
  textMuted: "var(--cth-admin-ink-soft, var(--cth-admin-muted))",
  border: "var(--cth-admin-border)",
  accent: "var(--cth-admin-accent)",
  sidebarStart: "var(--cth-admin-sidebar-start)",
  sidebarEnd: "var(--cth-admin-sidebar-end)",
  sidebarHover: "var(--cth-admin-sidebar-hover)",
  panel: "var(--cth-admin-panel)",
  appBg: "var(--cth-admin-bg)",
};

const API = import.meta.env.VITE_BACKEND_URL || "";
const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.webp";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "brand", label: "Brand Data" },
  { value: "content", label: "Content" },
  { value: "media", label: "Media" },
  { value: "document", label: "Documents" },
];

function formatBytes(bytes) {
  if (!bytes || Number.isNaN(Number(bytes))) return "0 B";
  const value = Number(bytes);
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

  function normalizeDocument(doc = {}) {
    const displayName =
      doc.filename ||
      doc.original_filename ||
      doc.title ||
      doc.name ||
      doc.stored_filename ||
      "Untitled Document";

    return {
      id: doc.document_id || doc.id || "",
      title: doc.title || displayName,
      filename: displayName,
      stored_filename: doc.stored_filename || "",
      description: doc.description || "",
      category: doc.category || "general",
      source: doc.source || "",
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      file_url: doc.file_url || "",
      content_type: doc.content_type || doc.mime_type || "",
      mime_type: doc.mime_type || doc.content_type || "",
      file_size: doc.size_bytes || doc.file_size || 0,
      created_at: doc.created_at || "",
      updated_at: doc.updated_at || doc.created_at || "",
      is_public: !!doc.is_public,
      is_archived: !!doc.is_archived,
    };
  }

function inferCategoryFromFile(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();

  if (type.startsWith("image/")) return "media";
  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp")) return "media";
  if (name.endsWith(".txt") || name.endsWith(".csv")) return "content";
  if (name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx")) return "document";
  return "general";
}

function inferTypeLabel(doc) {
  const type = String(doc.content_type || "").toLowerCase();
  const name = String(doc.filename || "").toLowerCase();

  if (type.startsWith("image/")) return "Media";
  if (name.endsWith(".pdf")) return "PDF";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "DOC";
  if (name.endsWith(".csv")) return "CSV";
  if (name.endsWith(".txt")) return "TXT";
  if (doc.category === "brand") return "Brand Data";
  if (doc.category === "content") return "Content";
  return "File";
}

function UploadDropzone({ onFilesSelected, uploading, colors }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length > 0) onFilesSelected(files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? colors.cinnabar : `${colors.tuscany}33`}`,
        background: dragging ? `${colors.cinnabar}08` : colors.cardBg,
        borderRadius: 14,
        padding: "28px 24px",
        cursor: uploading ? "wait" : "pointer",
        transition: "all 0.2s ease",
        marginBottom: 18,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_FILE_TYPES}
        style={{ display: "none" }}
        disabled={uploading}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "color-mix(in srgb, var(--cth-admin-accent) 12%, var(--cth-admin-panel))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Upload size={20} style={{ color: colors.cinnabar }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ color: colors.textPrimary, fontWeight: 700, fontSize: 15 }}>
            Drop files here
          </div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
            Upload documents, media, and workspace files
          </div>
          <div style={{ color: colors.tuscany, fontSize: 11, marginTop: 4 }}>
            PDF, DOCX, TXT, CSV, PNG, JPG, WEBP
          </div>
        </div>

        <button
          type="button"
          disabled={uploading}
          style={{
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            background: "var(--cth-admin-accent)",
            color: "var(--cth-on-dark)",
            fontWeight: 700,
            cursor: uploading ? "wait" : "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Choose Files"}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, colors }) {
  return (
    <div
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.tuscany}15`,
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <p
        style={{
          fontSize: 10,
          color: colors.tuscany,
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 24,
          fontWeight: 700,
          color,
          margin: "4px 0 2px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 11,
          color: colors.textMuted,
          margin: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {sub}
      </p>
    </div>
  );
}

export default function TenantDataDashboard() {
  const navigate = useNavigate();
  const colors = CTH_PAGE_COLORS;
  const { activeWorkspace } = useWorkspace();
  const { user } = useUser();

  const workspaceId = activeWorkspace?.id || activeWorkspace?.workspace_id || "";
  const userId = user?.id || "default";

  const [summary, setSummary] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [uploadCategory, setUploadCategory] = useState("auto");
  const [sortBy, setSortBy] = useState("newest");
  const [message, setMessage] = useState(null);

  const showMessage = useCallback((text, isError = false) => {
    setMessage({ text, isError });
    window.setTimeout(() => setMessage(null), 3000);
  }, []);

  const loadSummary = useCallback(async () => {
    if (!workspaceId || !userId || userId === "default") {
      setSummary(null);
      setLoadingSummary(false);
      return;
    }

    setLoadingSummary(true);
    try {
      const res = await apiClient.get("/api/tenant-data/summary", {
        params: { workspace_id: workspaceId, user_id: userId },
      });
      setSummary(res);
    } catch (err) {
      console.error("Failed to load tenant data summary:", err);
      setSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, [workspaceId, userId]);

  const loadDocuments = useCallback(async () => {
    if (!workspaceId || !userId || userId === "default") {
      setDocuments([]);
      setLoadingDocuments(false);
      return;
    }

    setLoadingDocuments(true);
    try {
      const res = await apiClient.get(API_PATHS.documents.list({}));
      const docs = (res?.documents || []).map(normalizeDocument);
      setDocuments(docs);
    } catch (error) {
      console.error("Failed to load workspace library:", error);
      setDocuments([]);
      showMessage(error?.message || "Failed to load workspace library.", true);
    } finally {
      setLoadingDocuments(false);
    }
  }, [workspaceId, userId, category, uploadCategory, showMessage]);

  const loadMediaAssets = useCallback(async () => {
    if (!workspaceId || !userId || userId === "default") {
      setMediaAssets([]);
      return;
    }

    try {
      const res = await apiClient.get("/api/tenant-data/collections/media_assets", {
        params: { workspace_id: workspaceId, user_id: userId, limit: 200 },
      });
      const validMedia = (res?.data || []).filter((asset) => {
        return asset?.preview_url && asset?.status !== "deleted";
      });
      setMediaAssets(validMedia);
    } catch (error) {
      console.error("Failed to load media assets:", error);
      setMediaAssets([]);
    }
  }, [workspaceId, userId]);

  useEffect(() => {
    loadSummary();
    loadDocuments();
    loadMediaAssets();
  }, [loadSummary, loadDocuments, loadMediaAssets]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await apiClient.get("/api/tenant-data/full-export", {
        params: { workspace_id: workspaceId, user_id: userId },
      });

      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workspace-library-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      showMessage("Export failed.", true);
    } finally {
      setExporting(false);
    }
  };

  const uploadBinaryToDocument = async (documentId, file) => {
    const form = new FormData();
    form.append("file", file);

    const headers =
      typeof apiClient.getAuthHeaders === "function"
        ? await apiClient.getAuthHeaders({ isFormData: true })
        : {};

    const response = await fetch(`${API}/api/documents/${documentId}/upload`, {
      method: "POST",
      headers,
      body: form,
      credentials: "include",
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : null;

    if (!response.ok) {
      throw new Error(payload?.detail || `Upload failed (${response.status})`);
    }

    return payload;
  };

  const handleFilesSelected = async (files) => {
    if (!workspaceId || !userId || userId === "default") {
      showMessage("Workspace or user context is missing.", true);
      return;
    }

    setUploading(true);
    let uploadedCount = 0;

    for (const file of files) {
      try {
        const resolvedCategory =
          uploadCategory === "auto" ? inferCategoryFromFile(file) : uploadCategory;

        const meta = await apiClient.post(API_PATHS.documents.create, {
          title: file.name,
          description: "",
          category: resolvedCategory,
          tags: [],
          is_public: false,
        });

        const documentId = meta?.document_id || meta?.id;
        if (!documentId) {
          throw new Error("Document record created without an id.");
        }

        await uploadBinaryToDocument(documentId, file);
        uploadedCount += 1;
      } catch (error) {
        console.error("Workspace Library upload failed:", error);
        showMessage(error?.message || `Upload failed for ${file.name}`, true);
      }
    }

    setUploading(false);

    if (uploadedCount > 0) {
      showMessage(`${uploadedCount} file${uploadedCount > 1 ? "s" : ""} uploaded`);
      await Promise.all([loadDocuments(), loadSummary()]);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm("Delete this file permanently?")) return;

    try {
      if (doc?.isMediaAsset) {
        await apiClient.delete(`/api/media-upload/assets/${doc.id}`);
        setMediaAssets((current) => current.filter((item) => (item.asset_id || item.id) !== doc.id));
      } else {
        await apiClient.delete(API_PATHS.documents.delete(doc.id));
        setDocuments((current) => current.filter((item) => item.id !== doc.id));
      }

      await loadSummary();
      showMessage("File deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      showMessage(error?.message || "Delete failed.", true);
    }
  };

  const handleDownload = async (doc) => {
    try {
      if (doc.isMediaAsset && doc.preview_url) {
        window.open(`${API}${doc.preview_url}`, "_blank", "noopener,noreferrer");
        return;
      }

      const targetUrl = doc.file_url
        ? (doc.file_url.startsWith("http") ? doc.file_url : `${API}${doc.file_url}`)
        : `${API}${API_PATHS.documents.download(doc.id)}`;

      const headers =
        typeof apiClient.getAuthHeaders === "function"
          ? await apiClient.getAuthHeaders()
          : {};

      const response = await fetch(targetUrl, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename || doc.title || "download";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      showMessage(error?.message || "Download failed.", true);
    }
  };

  const handleOpen = async (doc) => {
    try {
      if (doc.isMediaAsset && doc.preview_url) {
        window.open(`${API}${doc.preview_url}`, "_blank", "noopener,noreferrer");
        return;
      }

      const headers =
        typeof apiClient.getAuthHeaders === "function"
          ? await apiClient.getAuthHeaders()
          : {};

      if (doc.file_url) {
        const openUrl = doc.file_url.startsWith("http") ? doc.file_url : `${API}${doc.file_url}`;
        const response = await fetch(openUrl, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Open failed (${response.status})`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(url), 10000);
        return;
      }

      const response = await fetch(`${API}${API_PATHS.documents.download(doc.id)}`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Open failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error("Open failed:", error);
      showMessage(error?.message || "Open failed.", true);
    }
  };

  const filteredDocuments = useMemo(() => {
    const normalizedMedia = mediaAssets.map((asset) => ({
      id: asset.asset_id || asset.id || "",
      title: asset.label || asset.filename || "Untitled Media",
      filename: asset.filename || asset.stored_filename || "media",
      description: asset.context || "",
      category: asset.category || "media",
      content_type: asset.file_type || "",
      file_size: asset.file_size || 0,
      created_at: asset.created_at || "",
      updated_at: asset.updated_at || asset.created_at || "",
      isMediaAsset: true,
      preview_url: asset.preview_url || "",
      stored_filename: asset.stored_filename || "",
    }));

    let items = [...documents, ...normalizedMedia];

    if (category !== "all") {
      items = items.filter((doc) => String(doc.category || "general").toLowerCase() === category);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((doc) => {
        return (
          String(doc.title || "").toLowerCase().includes(q) ||
          String(doc.filename || "").toLowerCase().includes(q) ||
          String(doc.description || "").toLowerCase().includes(q) ||
          String(doc.category || "").toLowerCase().includes(q)
        );
      });
    }

    items.sort((a, b) => {
      if (sortBy === "name-asc") {
        return String(a.title || "").localeCompare(String(b.title || ""));
      }
      if (sortBy === "name-desc") {
        return String(b.title || "").localeCompare(String(a.title || ""));
      }
      if (sortBy === "oldest") {
        return new Date(a.updated_at || a.created_at || 0) - new Date(b.updated_at || b.created_at || 0);
      }
      return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    });

    return items;
  }, [documents, mediaAssets, category, search, sortBy]);

  const collections = summary?.collections || {};
  const totalFiles = (collections.documents?.count || 0) + (collections.media_assets?.count || 0);

  return (
    <DashboardLayout>
      <TopBar
        title="Workspace Library"
        subtitle="Your saved files, brand records, content, assets, and documents in one place"
      />

      <div style={{ padding: "24px 32px", maxWidth: 1240, margin: "0 auto", width: "100%" }}>
        {message ? (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 10,
              background: message.isError ? "rgba(175,0,36,0.12)" : "rgba(16,185,129,0.12)",
              border: message.isError ? "1px solid rgba(175,0,36,0.3)" : "1px solid rgba(16,185,129,0.3)",
              color: message.isError ? "color-mix(in srgb, var(--cth-status-danger) 35%, white)" : "color-mix(in srgb, var(--cth-status-success-bright) 40%, white)",
            }}
          >
            {message.text}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, flex: 1, minWidth: 720 }}>
            <StatCard
              label="Total Files"
              value={loadingSummary ? "…" : totalFiles}
              sub="docs & media"
              color={colors.cinnabar}
              colors={colors}
            />
            <StatCard
              label="Documents"
              value={loadingSummary ? "…" : collections.documents?.count || 0}
              sub="uploaded files"
              color={colors.tuscany}
              colors={colors}
            />
            <StatCard
              label="Media Assets"
              value={loadingSummary ? "…" : collections.media_assets?.count || 0}
              sub="images & media"
              color="var(--cth-admin-accent)"
              colors={colors}
            />
            <StatCard
              label="Content Items"
              value={loadingSummary ? "…" : collections.content_assets?.count || 0}
              sub="saved content"
              color="var(--cth-admin-accent)"
              colors={colors}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <button
              onClick={loadDocuments}
              style={{
                background: "transparent",
                border: `1px solid ${colors.tuscany}30`,
                borderRadius: 10,
                padding: "10px 14px",
                color: colors.textMuted,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>

            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                background: "color-mix(in srgb, var(--cth-admin-accent) 12%, var(--cth-admin-panel))",
                color: colors.cinnabar,
                fontWeight: 700,
                cursor: exporting ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Download size={14} />
              {exporting ? "Exporting..." : "Export Workspace Data"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px minmax(0, 1fr)",
            gap: 20,
            alignItems: "start",
          }}
        >
          <aside
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.tuscany}15`,
              borderRadius: 18,
              padding: 16,
              position: "sticky",
              top: 24,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: colors.tuscany, marginBottom: 14 }}>
              Library
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {CATEGORY_OPTIONS.map((option) => {
                const active = category === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      width: "100%",
                      border: `1px solid ${active ? `${colors.cinnabar}30` : `${colors.tuscany}14`}`,
                      background: active
                        ? "color-mix(in srgb, var(--cth-admin-accent) 10%, var(--cth-admin-panel))"
                        : "transparent",
                      color: active ? colors.cinnabar : colors.textPrimary,
                      borderRadius: 12,
                      padding: "10px 12px",
                      cursor: "pointer",
                      fontWeight: active ? 700 : 500,
                      textAlign: "left",
                    }}
                  >
                    <span>{option.label}</span>
                    <ChevronRight size={14} />
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 18,
                paddingTop: 18,
                borderTop: `1px solid ${colors.tuscany}15`,
              }}
            >
              <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: colors.tuscany, marginBottom: 8 }}>
                Storage
              </div>
              <div style={{ color: colors.textPrimary, fontWeight: 700, fontSize: 22 }}>
                {loadingSummary ? "…" : totalFiles}
              </div>
              <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                total items in this workspace library
              </div>
            </div>
          </aside>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: colors.tuscany, marginBottom: 6 }}>
                  Upload destination
                </div>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  style={{
                    minWidth: 220,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: `1px solid ${colors.tuscany}20`,
                    background: "var(--cth-admin-panel-alt)",
                    color: colors.textPrimary,
                  }}
                >
                  <option value="auto" style={{ color: "var(--cth-surface-midnight)" }}>Auto detect</option>
                  <option value="general" style={{ color: "var(--cth-surface-midnight)" }}>General</option>
                  <option value="brand" style={{ color: "var(--cth-surface-midnight)" }}>Brand Data</option>
                  <option value="content" style={{ color: "var(--cth-surface-midnight)" }}>Content</option>
                  <option value="media" style={{ color: "var(--cth-surface-midnight)" }}>Media</option>
                  <option value="document" style={{ color: "var(--cth-surface-midnight)" }}>Documents</option>
                </select>
              </div>

              <div style={{ color: colors.textMuted, fontSize: 12 }}>
                Auto detect sorts by file type. Pick a destination to override it.
              </div>
            </div>

            <UploadDropzone onFilesSelected={handleFilesSelected} uploading={uploading} colors={colors} />

            <div
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.tuscany}15`,
                borderRadius: 18,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 280 }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: colors.textMuted,
                    }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search files, documents, assets, or content..."
                    style={{
                      width: "100%",
                      padding: "11px 12px 11px 38px",
                      borderRadius: 12,
                      border: `1px solid ${colors.tuscany}20`,
                      background: "var(--cth-admin-panel-alt)",
                      color: colors.textPrimary,
                      outline: "none",
                    }}
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    minWidth: 160,
                    padding: "11px 12px",
                    borderRadius: 12,
                    border: `1px solid ${colors.tuscany}20`,
                    background: "var(--cth-admin-panel-alt)",
                    color: colors.textPrimary,
                  }}
                >
                  <option value="newest" style={{ color: "var(--cth-surface-midnight)" }}>Newest</option>
                  <option value="oldest" style={{ color: "var(--cth-surface-midnight)" }}>Oldest</option>
                  <option value="name-asc" style={{ color: "var(--cth-surface-midnight)" }}>Name A-Z</option>
                  <option value="name-desc" style={{ color: "var(--cth-surface-midnight)" }}>Name Z-A</option>
                </select>
              </div>

          {loadingDocuments ? (
            <div style={{ padding: "32px 12px", textAlign: "center", color: colors.textMuted }}>
              Loading workspace library...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: colors.textMuted,
                border: `1px dashed ${colors.tuscany}25`,
                borderRadius: 12,
              }}
            >
              <FolderOpen size={28} style={{ marginBottom: 10, color: colors.tuscany }} />
              <div style={{ fontWeight: 700, color: colors.textPrimary, marginBottom: 6 }}>
                Your workspace library is empty
              </div>
              <div style={{ fontSize: 13 }}>
                Upload documents, media, and saved workspace files to start building your library.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: `1px solid ${colors.tuscany}15` }}>
                    <th style={{ padding: "12px 10px", color: colors.tuscany, fontSize: 11, textTransform: "uppercase" }}>Name</th>
                    <th style={{ padding: "12px 10px", color: colors.tuscany, fontSize: 11, textTransform: "uppercase" }}>Type</th>
                    <th style={{ padding: "12px 10px", color: colors.tuscany, fontSize: 11, textTransform: "uppercase" }}>Source</th>
                    <th style={{ padding: "12px 10px", color: colors.tuscany, fontSize: 11, textTransform: "uppercase" }}>Updated</th>
                    <th style={{ padding: "12px 10px", color: colors.tuscany, fontSize: 11, textTransform: "uppercase" }}>Size</th>
                    <th style={{ padding: "12px 10px", color: colors.tuscany, fontSize: 11, textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => {
                    const isImage = String(doc.content_type || "").startsWith("image/");
                    const TypeIcon = isImage ? ImageIcon : FileText;
                    const previewSrc =
                      doc.isMediaAsset && doc.preview_url
                        ? (doc.preview_url.startsWith("http") ? doc.preview_url : `${API}${doc.preview_url}`)
                        : "";

                    return (
                      <tr key={doc.id} style={{ borderBottom: `1px solid ${colors.tuscany}10` }}>
                        <td style={{ padding: "14px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                background: `${colors.cinnabar}15`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                overflow: "hidden",
                              }}
                            >
                              {previewSrc ? (
                                <img
                                  src={previewSrc}
                                  alt={doc.title || doc.filename || "Media preview"}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <TypeIcon size={16} style={{ color: colors.cinnabar }} />
                              )}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleOpen(doc)}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  padding: 0,
                                  margin: 0,
                                  color: colors.textPrimary,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                              >
                                {doc.title}
                              </button>
                              <div style={{ color: colors.textMuted, fontSize: 12 }}>
                                {doc.filename}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "14px 10px", color: colors.textMuted, fontSize: 13 }}>
                          {inferTypeLabel(doc)}
                        </td>

                        <td style={{ padding: "14px 10px", color: colors.textMuted, fontSize: 13 }}>
                          {doc.category || "general"}
                        </td>

                        <td style={{ padding: "14px 10px", color: colors.textMuted, fontSize: 13 }}>
                          {formatDate(doc.updated_at || doc.created_at)}
                        </td>

                        <td style={{ padding: "14px 10px", color: colors.textMuted, fontSize: 13 }}>
                          {formatBytes(doc.file_size)}
                        </td>

                        <td style={{ padding: "14px 10px" }}>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button
                              onClick={() => handleDownload(doc)}
                              style={{
                                border: `1px solid ${colors.cinnabar}25`,
                                background: "color-mix(in srgb, var(--cth-admin-accent) 8%, var(--cth-admin-panel))",
                                color: colors.cinnabar,
                                borderRadius: 8,
                                padding: "7px 10px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Download size={14} />
                              Download
                            </button>

                            <button
                              onClick={() => handleDelete(doc)}
                              style={{
                                border: `1px solid rgba(175,0,36,0.28)`,
                                background: "rgba(175,0,36,0.10)",
                                color: "var(--cth-danger)",
                                borderRadius: 8,
                                padding: "7px 10px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
