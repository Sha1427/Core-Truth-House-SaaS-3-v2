/**
 * IdentityStudioAssets.jsx
 * Parent-controlled asset manager for Identity Studio
 *
 * Props:
 * - workspaceId: string
 * - assets: array
 * - onAssetsChange: function(updatedAssets)
 * - onDeleteAsset: function(assetId)
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import apiClient from "../../lib/apiClient";

const API = import.meta.env.VITE_BACKEND_URL;

const C = {
  bg: 'var(--cth-brand-primary-deep)',
  card: 'var(--cth-admin-panel-alt)',
  panel: 'var(--cth-surface-night)',
  border: 'var(--cth-admin-border)',
  accent: 'var(--cth-admin-accent)',
  white: 'var(--cth-white)',
  t80: 'var(--cth-admin-ink)',
  t70: 'var(--cth-admin-ink-soft)',
  t60: 'var(--cth-admin-ink-soft)',
  t50: 'var(--cth-admin-muted)',
  t40: 'var(--cth-admin-muted)',
  t30: 'var(--cth-admin-muted)',
  t25: 'var(--cth-admin-muted)',
  t20: 'var(--cth-admin-muted)',
  t10: 'var(--cth-admin-border)',
  t08: 'var(--cth-admin-border)',
  green: 'var(--cth-status-success-bright)',
  amber: 'var(--cth-status-warning)',
  red: 'var(--cth-status-danger)',
  font: "'DM Sans', sans-serif",
};

const ASSET_CATEGORIES = [
  { id: 'logo_light', label: 'Logo — Light', icon: '☀️' },
  { id: 'logo_dark', label: 'Logo — Dark', icon: '🌙' },
  { id: 'icon', label: 'Brand Icon', icon: '⬡' },
  { id: 'pattern', label: 'Pattern', icon: '⠿' },
  { id: 'watermark', label: 'Watermark', icon: '💧' },
  { id: 'font_file', label: 'Font File', icon: 'Aa' },
  { id: 'other', label: 'Other', icon: '📎' },
];

const VALID_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/gif': '.gif',
  'font/ttf': '.ttf',
  'font/woff': '.woff',
  'font/woff2': '.woff2',
  'application/pdf': '.pdf',
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES_ONCE = 20;

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

function isImage(fileType) {
  return fileType && fileType.startsWith('image/');
}

function getCategoryLabel(id) {
  const cat = ASSET_CATEGORIES.find((c) => c.id === id);
  return cat ? cat.label : 'Other';
}

function getCategoryIcon(id) {
  const cat = ASSET_CATEGORIES.find((c) => c.id === id);
  return cat ? cat.icon : '📎';
}

function guessCategory(filename) {
  const lower = (filename || '').toLowerCase();
  if (lower.includes('logo') && (lower.includes('white') || lower.includes('light'))) return 'logo_light';
  if (lower.includes('logo') && (lower.includes('dark') || lower.includes('black'))) return 'logo_dark';
  if (lower.includes('logo')) return 'logo_light';
  if (lower.includes('icon')) return 'icon';
  if (lower.includes('pattern') || lower.includes('texture')) return 'pattern';
  if (lower.includes('watermark')) return 'watermark';
  if (lower.match(/\.(ttf|woff|woff2)$/)) return 'font_file';
  return 'other';
}

function normalizeAsset(asset, idx = 0) {
  return {
    asset_id: asset.asset_id || asset.id || `asset-${idx}`,
    preview_url: asset.preview_url || asset.url || asset.file_url || '',
    filename: asset.filename || asset.name || 'Asset',
    file_type: asset.file_type || asset.fileType || '',
    file_size: asset.file_size || asset.fileSize || 0,
    category: asset.category || asset.type || 'other',
    label: asset.label || asset.name || asset.filename || 'Asset',
  };
}

function useUploadQueue(workspaceId, onComplete) {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    const pending = queue.filter((f) => f.status === 'pending');
    const running = queue.filter((f) => f.status === 'uploading');

    if (running.length >= 3 || pending.length === 0) return;

    const toStart = pending.slice(0, 3 - running.length);

    toStart.forEach((item) => {
      setQueue((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading' } : f))
      );

      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('context', 'brand_asset');
      formData.append('category', item.category || guessCategory(item.file.name));
      formData.append('label', item.label || item.file.name.replace(/\.[^/.]+$/, ''));
      formData.append('workspace_id', workspaceId || '');

      apiClient
        .post("/api/media-upload/upload-asset", formData)
        .then((res) => {
          const completedAsset = normalizeAsset({
            asset_id: res.asset_id,
            preview_url: res.preview_url,
            filename: item.file.name,
            file_type: item.file.type,
            file_size: item.file.size,
            category: item.category,
            label: item.label || item.file.name.replace(/\.[^/.]+$/, ''),
          });

          setQueue((prev) =>
            prev.map((f) =>
              f.id === item.id ? { ...f, status: 'done', progress: 100 } : f
            )
          );

          if (onComplete) onComplete(completedAsset);
        })
        .catch((err) => {
          setQueue((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    status: 'error',
                    error: err.response?.data?.detail || 'Upload failed',
                    progress: 0,
                  }
                : f
            )
          );
        });
    });
  }, [queue, workspaceId, onComplete]);

  function addFiles(files) {
    const newItems = Array.from(files)
      .slice(0, MAX_FILES_ONCE)
      .map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
        category: guessCategory(file.name),
        label: file.name.replace(/\.[^/.]+$/, ''),
        status: 'pending',
        progress: 0,
        error: null,
      }));

    setQueue((prev) => [...prev, ...newItems]);
  }

  function clearDone() {
    setQueue((prev) => prev.filter((f) => f.status !== 'done'));
  }

  function retryFailed(id) {
    setQueue((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: 'pending', progress: 0, error: null } : f
      )
    );
  }

  function removeFromQueue(id) {
    setQueue((prev) => prev.filter((f) => f.id !== id));
  }

  const done = queue.filter((f) => f.status === 'done').length;
  const errors = queue.filter((f) => f.status === 'error').length;
  const uploading = queue.filter(
    (f) => f.status === 'uploading' || f.status === 'pending'
  ).length;

  return { queue, addFiles, clearDone, retryFailed, removeFromQueue, done, errors, uploading };
}

function UploadProgressItem({ item, onRetry, onRemove }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 0',
        borderBottom: '1px solid var(--cth-admin-border)',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: C.t08,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        {isImage(item.fileType) ? '🖼' : item.fileType?.includes('font') ? 'Aa' : '📄'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 11.5,
            color: C.t70,
            margin: '0 0 3px',
            fontFamily: C.font,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.filename}
        </p>

        {item.status !== 'done' && item.status !== 'error' && (
          <div
            style={{
              height: 3,
              background: C.t08,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${item.progress}%`,
                background: C.accent,
                borderRadius: 2,
                transition: 'width 0.3s',
              }}
            />
          </div>
        )}

        {item.status === 'error' && (
          <p style={{ fontSize: 10, color: C.red, margin: 0, fontFamily: C.font }}>
            {item.error || 'Upload failed'}
          </p>
        )}

        {item.status === 'done' && (
          <p style={{ fontSize: 10, color: C.green, margin: 0, fontFamily: C.font }}>
            ✓ Uploaded
          </p>
        )}
      </div>

      <span
        style={{
          fontSize: 10,
          color: C.t25,
          fontFamily: C.font,
          flexShrink: 0,
        }}
      >
        {formatBytes(item.fileSize)}
      </span>

      {item.status === 'error' && (
        <button
          onClick={() => onRetry(item.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: C.amber,
            fontSize: 10,
            fontFamily: C.font,
          }}
        >
          Retry
        </button>
      )}

      {(item.status === 'done' || item.status === 'error') && (
        <button
          onClick={() => onRemove(item.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: C.t20,
            padding: 2,
          }}
        >
          <svg width="10" height="10" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      )}
    </div>
  );
}

function AssetCard({ asset, onDelete, onEdit }) {
  const [imgOk, setImgOk] = useState(true);
  const isImg = isImage(asset.file_type);

  function handleCopy() {
    const url = asset.preview_url.startsWith('http')
      ? asset.preview_url
      : `${API}${asset.preview_url}`;

    navigator.clipboard.writeText(url).catch(() => {});
  }

  function handleDownload() {
    const url = asset.preview_url.startsWith('http')
      ? asset.preview_url
      : `${API}${asset.preview_url}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.filename || 'asset';
    a.click();
  }

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(224,78,53,0.24)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <div
        style={{
          height: 110,
          background: 'var(--cth-admin-panel-alt)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isImg && imgOk ? (
          <img
            src={asset.preview_url.startsWith('http') ? asset.preview_url : `${API}${asset.preview_url}`}
            alt={asset.label || asset.filename}
            onError={() => setImgOk(false)}
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 24 }}>{getCategoryIcon(asset.category)}</span>
            <span style={{ fontSize: 9.5, color: C.t30, fontFamily: C.font }}>
              {asset.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
            </span>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            background: 'rgba(13,0,16,0.85)',
            borderRadius: 20,
            padding: '1px 8px',
          }}
        >
          <span style={{ fontSize: 9.5, color: C.t50, fontFamily: C.font }}>
            {getCategoryLabel(asset.category)}
          </span>
        </div>
      </div>

      <div style={{ padding: '10px 10px 8px' }}>
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: C.t70,
              fontFamily: C.font,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={asset.label || asset.filename}
          >
            {asset.label || asset.filename || 'Asset'}
          </div>
          <div
            style={{
              fontSize: 10,
              color: C.t30,
              fontFamily: C.font,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={asset.filename}
          >
            {asset.filename || ''}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <button
            onClick={() => onEdit(asset)}
            style={{
              border: `1px solid ${C.border}`,
              background: 'var(--cth-admin-panel-alt)',
              color: C.t70,
              borderRadius: 8,
              padding: '7px 8px',
              cursor: 'pointer',
              fontFamily: C.font,
              fontSize: 11,
            }}
          >
            Edit
          </button>

          <button
            onClick={handleDownload}
            style={{
              border: `1px solid ${C.border}`,
              background: 'var(--cth-admin-panel-alt)',
              color: C.t70,
              borderRadius: 8,
              padding: '7px 8px',
              cursor: 'pointer',
              fontFamily: C.font,
              fontSize: 11,
            }}
          >
            Download
          </button>

          <button
            onClick={handleCopy}
            style={{
              border: `1px solid ${C.border}`,
              background: 'var(--cth-admin-panel-alt)',
              color: C.t70,
              borderRadius: 8,
              padding: '7px 8px',
              cursor: 'pointer',
              fontFamily: C.font,
              fontSize: 11,
            }}
          >
            Copy URL
          </button>

          <button
            onClick={() => onDelete(asset)}
            style={{
              border: '1px solid rgba(239,68,68,0.28)',
              background: 'rgba(239,68,68,0.10)',
              color: C.red,
              borderRadius: 8,
              padding: '7px 8px',
              cursor: 'pointer',
              fontFamily: C.font,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IdentityStudioAssets({
  workspaceId = '',
  assets = [],
  onAssetsChange,
  onDeleteAsset,
}) {
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [showQueue, setShowQueue] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);

  const uploader = useUploadQueue(workspaceId, (completedAsset) => {
    const updatedAssets = [completedAsset, ...assets];
    if (onAssetsChange) onAssetsChange(updatedAssets);
  });

  useEffect(() => {
    setLoading(true);

    axios
      .get("/api/media-upload/assets", { params: { context: "brand_asset", workspace_id: workspaceId } })
      .then((res) => {
        const loadedAssets = Array.isArray(res.data?.assets)
          ? res.data.assets.map((a, idx) => normalizeAsset(a, idx))
          : [];
        if (onAssetsChange) onAssetsChange(loadedAssets);
      })
      .catch((err) => {
        console.error('Failed to load assets:', err);
      })
      .finally(() => setLoading(false));
  }, [workspaceId, onAssetsChange]);

  useEffect(() => {
    if (uploader.uploading > 0 || uploader.errors > 0) {
      setShowQueue(true);
    }
  }, [uploader.uploading, uploader.errors]);

  function handleFiles(files) {
    const valid = [];
    const rejected = [];

    Array.from(files).forEach((file) => {
      if (!VALID_TYPES[file.type] && !file.name.match(/\.(ttf|woff|woff2)$/)) {
        rejected.push(`${file.name} — unsupported type`);
      } else if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} — exceeds 20MB`);
      } else {
        valid.push(file);
      }
    });

    if (valid.length > 0) {
      uploader.addFiles(valid);
      setShowQueue(true);
    }

    if (rejected.length > 0) {
      console.warn('Rejected files:', rejected);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDelete(asset) {
    if (!asset) return;
    setPendingDelete(asset);
  }

  function confirmPendingDelete() {
    if (!pendingDelete || !onDeleteAsset) {
      setPendingDelete(null);
      return;
    }
    const target = pendingDelete;
    const assetId = target.asset_id || target.id;
    setPendingDelete(null);

    if (!assetId) return;

    Promise.resolve(onDeleteAsset(assetId)).catch((err) => {
      console.error('Delete failed:', err);
      setDeleteError('Delete failed. Please try again.');
      setTimeout(() => setDeleteError(null), 3000);
    });
  }

  function handleEditSave(assetId, updates) {
    return apiClient.patch(`/api/media-upload/assets/${assetId}`, updates).then(() => {
      const updatedAssets = assets.map((a) =>
        a.asset_id === assetId ? { ...a, ...updates } : a
      );
      if (onAssetsChange) onAssetsChange(updatedAssets);
    });
  }

  const normalizedAssets = Array.isArray(assets) ? assets.map((a, idx) => normalizeAsset(a, idx)) : [];

  const filteredAssets =
    filter === 'all'
      ? normalizedAssets
      : normalizedAssets.filter((a) => a.category === filter);

  const categoryGroups = ASSET_CATEGORIES.map((cat) => ({
    ...cat,
    count: normalizedAssets.filter((a) => a.category === cat.id).length,
  })).filter((c) => c.count > 0);

  return (
    <div style={{ fontFamily: C.font }}>
      {editing && (
        <EditAssetModal
          asset={editing}
          onSave={handleEditSave}
          onClose={() => setEditing(null)}
        />
      )}

      {deleteError && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 400,
            padding: '10px 18px',
            borderRadius: 9,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: 'var(--cth-status-danger)',
            fontSize: 12.5,
            fontFamily: C.font,
          }}
        >
          {deleteError}
        </div>
      )}

      {normalizedAssets.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: `1px solid ${C.border}`,
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '7px 14px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: C.font,
              fontSize: 11.5,
              fontWeight: filter === 'all' ? 600 : 400,
              color: filter === 'all' ? C.accent : C.t40,
              borderBottom: `2px solid ${filter === 'all' ? C.accent : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            All ({normalizedAssets.length})
          </button>

          {categoryGroups.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              style={{
                padding: '7px 14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: C.font,
                fontSize: 11.5,
                fontWeight: filter === cat.id ? 600 : 400,
                color: filter === cat.id ? C.accent : C.t40,
                borderBottom: `2px solid ${filter === cat.id ? C.accent : 'transparent'}`,
                marginBottom: -1,
              }}
            >
              {cat.icon} {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      )}

      <div
        ref={dropZoneRef}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!dropZoneRef.current?.contains(e.relatedTarget)) setDragging(false);
        }}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? C.accent : C.border}`,
          borderRadius: 12,
          padding: '24px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(224,78,53,0.05)' : 'none',
          transition: 'all 0.15s',
          marginBottom: normalizedAssets.length > 0 ? 16 : 0,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={`${Object.keys(VALID_TYPES).join(',')},.ttf,.woff,.woff2`}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          style={{ display: 'none' }}
        />

        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: dragging ? 'rgba(224,78,53,0.15)' : C.t08,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={dragging ? C.accent : C.t40} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>

        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: dragging ? C.accent : C.t70,
            margin: '0 0 4px',
          }}
        >
          {dragging ? 'Drop files here' : 'Upload brand assets'}
        </p>
        <p style={{ fontSize: 11, color: C.t30, margin: '0 0 10px' }}>
          Drag and drop multiple files · PNG, SVG, JPG, WebP, PDF, Fonts · Max 20MB each
        </p>
        <span style={{ fontSize: 11.5, color: C.accent, fontWeight: 500 }}>
          Browse files
        </span>
      </div>

      {showQueue && uploader.queue.length > 0 && (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: C.t30,
                  margin: 0,
                }}
              >
                Uploads
              </p>

              {uploader.uploading > 0 && (
                <div
                  className="animate-spin"
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(224,78,53,0.3)',
                    borderTopColor: C.accent,
                  }}
                />
              )}

              {uploader.done > 0 && uploader.uploading === 0 && (
                <span style={{ fontSize: 10, color: C.green }}>{uploader.done} done</span>
              )}

              {uploader.errors > 0 && (
                <span style={{ fontSize: 10, color: C.red }}>{uploader.errors} failed</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {uploader.done > 0 && (
                <button
                  onClick={uploader.clearDone}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 10.5,
                    color: C.t30,
                    fontFamily: C.font,
                  }}
                >
                  Clear done
                </button>
              )}

              <button
                onClick={() => setShowQueue(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: C.t20,
                  padding: 2,
                }}
              >
                <svg width="11" height="11" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            </div>
          </div>

          {uploader.queue.map((item) => (
            <UploadProgressItem
              key={item.id}
              item={item}
              onRetry={uploader.retryFailed}
              onRemove={uploader.removeFromQueue}
            />
          ))}
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 120,
            gap: 10,
          }}
        >
          <div
            className="animate-spin"
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: '2px solid rgba(224,78,53,0.3)',
              borderTopColor: C.accent,
            }}
          />
          <span style={{ fontSize: 12, color: C.t30 }}>Loading assets...</span>
        </div>
      ) : filteredAssets.length === 0 && normalizedAssets.length === 0 ? (
        <p
          style={{
            fontSize: 12,
            color: C.t25,
            textAlign: 'center',
            padding: '20px 0',
            margin: 0,
          }}
        >
          No assets yet. Upload your logo, icons, patterns, and brand elements above.
        </p>
      ) : filteredAssets.length === 0 ? (
        <p
          style={{
            fontSize: 12,
            color: C.t25,
            textAlign: 'center',
            padding: '12px 0',
            margin: 0,
          }}
        >
          No assets in this category.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 10,
          }}
        >
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.asset_id}
              asset={asset}
              onDelete={handleDelete}
              onEdit={(a) => setEditing(a)}
            />
          ))}
        </div>
      )}

      {pendingDelete ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete Asset"
          onClick={() => setPendingDelete(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(13, 0, 16, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: 'var(--cth-command-panel)',
              border: '1px solid var(--cth-command-border)',
              borderRadius: 4,
              width: '100%',
              maxWidth: 480,
              padding: 28,
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--cth-command-ink)',
                margin: 0,
                letterSpacing: '-0.005em',
                lineHeight: 1.25,
              }}
            >
              Delete Asset
            </h2>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: 'var(--cth-command-muted)',
                margin: '12px 0 0',
                lineHeight: 1.6,
              }}
            >
              This will permanently delete this asset. This cannot be undone.
            </p>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                fontStyle: 'italic',
                color: 'var(--cth-command-muted)',
                margin: '8px 0 24px',
                lineHeight: 1.55,
                wordBreak: 'break-word',
              }}
            >
              {pendingDelete.name || pendingDelete.filename || pendingDelete.original_name || 'Untitled asset'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                style={{
                  background: 'transparent',
                  color: 'var(--cth-command-ink)',
                  border: '1px solid var(--cth-command-border)',
                  borderRadius: 4,
                  padding: '10px 18px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-delete-asset-btn"
                onClick={confirmPendingDelete}
                style={{
                  background: 'var(--cth-command-crimson)',
                  color: 'var(--cth-command-ivory)',
                  border: 'none',
                  borderRadius: 4,
                  padding: '10px 18px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                }}
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
