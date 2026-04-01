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

const API = import.meta.env.VITE_BACKEND_URL;

const C = {
  bg: '#0D0010',
  card: 'rgba(255,255,255,0.03)',
  panel: '#1A0020',
  border: 'rgba(255,255,255,0.07)',
  accent: '#E04E35',
  white: '#fff',
  t80: 'rgba(255,255,255,0.8)',
  t70: 'rgba(255,255,255,0.7)',
  t60: 'rgba(255,255,255,0.6)',
  t50: 'rgba(255,255,255,0.5)',
  t40: 'rgba(255,255,255,0.4)',
  t30: 'rgba(255,255,255,0.3)',
  t25: 'rgba(255,255,255,0.25)',
  t20: 'rgba(255,255,255,0.2)',
  t10: 'rgba(255,255,255,0.1)',
  t08: 'rgba(255,255,255,0.08)',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
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

      axios
        .post(`${API}/api/media-upload/upload-asset`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setQueue((prev) =>
                prev.map((f) => (f.id === item.id ? { ...f, progress: pct } : f))
              );
            }
          },
        })
        .then((res) => {
          const completedAsset = normalizeAsset({
            asset_id: res.data.asset_id,
            preview_url: res.data.preview_url,
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
        borderBottom: '1px solid rgba(255,255,255,0.04)',
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
  const [showMenu, setShowMenu] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const isImg = isImage(asset.file_type);

  function handleCopy() {
    const url = asset.preview_url.startsWith('http')
      ? asset.preview_url
      : `${API}${asset.preview_url}`;

    navigator.clipboard.writeText(url).then(() => setShowMenu(false)).catch(() => {});
  }

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      <div
        style={{
          height: 110,
          background: 'rgba(255,255,255,0.04)',
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

        <button
          onClick={() => setShowMenu((p) => !p)}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'rgba(13,0,16,0.85)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.t50,
          }}
        >
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showMenu && (
          <>
            <div
              onClick={() => setShowMenu(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 9 }}
            />
            <div
              style={{
                position: 'absolute',
                top: 32,
                right: 6,
                zIndex: 10,
                background: '#1A0020',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 9,
                overflow: 'hidden',
                minWidth: 140,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              {[
                {
                  label: 'Copy URL',
                  icon: '🔗',
                  action: handleCopy,
                },
                {
                  label: 'Download',
                  icon: '⬇',
                  action: () => {
                    const url = asset.preview_url.startsWith('http')
                      ? asset.preview_url
                      : `${API}${asset.preview_url}`;
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = asset.filename || 'asset';
                    a.click();
                    setShowMenu(false);
                  },
                },
                {
                  label: 'Edit label',
                  icon: '✏️',
                  action: () => {
                    onEdit(asset);
                    setShowMenu(false);
                  },
                },
                {
                  label: 'Delete',
                  icon: '🗑',
                  action: () => {
                    onDelete(asset.asset_id);
                    setShowMenu(false);
                  },
                  danger: true,
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: C.font,
                    fontSize: 12,
                    color: item.danger ? C.red : C.t70,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = item.danger
                      ? 'rgba(239,68,68,0.08)'
                      : C.t08;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <span style={{ fontSize: 13 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '8px 10px' }}>
        <p
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            color: C.t80,
            margin: '0 0 2px',
            fontFamily: C.font,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {asset.label || asset.filename}
        </p>
        <p style={{ fontSize: 9.5, color: C.t25, margin: 0, fontFamily: C.font }}>
          {asset.file_size ? formatBytes(asset.file_size) : ''}
        </p>
      </div>
    </div>
  );
}

function EditAssetModal({ asset, onSave, onClose }) {
  const [label, setLabel] = useState(asset.label || asset.filename || '');
  const [category, setCategory] = useState(asset.category || 'other');
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    onSave(asset.asset_id, { label, category })
      .then(() => onClose())
      .catch(() => setSaving(false));
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 24,
      }}
    >
      <div
        style={{
          background: C.panel,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '24px 28px',
          width: '100%',
          maxWidth: 400,
          fontFamily: C.font,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.white, margin: 0 }}>
            Edit Asset
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: C.t30,
              cursor: 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: C.t30,
              display: 'block',
              marginBottom: 5,
            }}
          >
            Label
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{
              width: '100%',
              background: C.t08,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: '8px 11px',
              fontSize: 13,
              color: C.white,
              fontFamily: C.font,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: C.t30,
              display: 'block',
              marginBottom: 5,
            }}
          >
            Category
          </label>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ASSET_CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    border: `1px solid ${isSelected ? 'rgba(224,78,53,0.5)' : C.border}`,
                    background: isSelected ? 'rgba(224,78,53,0.1)' : 'none',
                    color: isSelected ? C.accent : C.t40,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: C.font,
                  }}
                >
                  {cat.icon} {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: 'none',
              color: C.t40,
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: C.font,
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2,
              padding: '8px',
              borderRadius: 8,
              border: 'none',
              background: C.accent,
              color: C.white,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: C.font,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
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

  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);

  const uploader = useUploadQueue(workspaceId, (completedAsset) => {
    const updatedAssets = [completedAsset, ...assets];
    if (onAssetsChange) onAssetsChange(updatedAssets);
  });

  useEffect(() => {
    setLoading(true);

    axios
      .get(`${API}/api/media-upload/assets?context=brand_asset&workspace_id=${workspaceId}`)
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

  function handleDelete(assetId) {
    if (!onDeleteAsset) return;

    Promise.resolve(onDeleteAsset(assetId)).catch((err) => {
      console.error('Delete failed:', err);
      setDeleteError('Delete failed. Please try again.');
      setTimeout(() => setDeleteError(null), 3000);
    });
  }

  function handleEditSave(assetId, updates) {
    return axios.patch(`${API}/api/media-upload/assets/${assetId}`, updates).then(() => {
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
            color: '#f87171',
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
    </div>
  );
}
