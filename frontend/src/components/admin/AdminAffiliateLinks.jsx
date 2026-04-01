import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Link as LinkIcon, Plus, Save, Trash2, Loader2, X } from 'lucide-react';
import { useColors } from '../../context/ThemeContext';

const API = import.meta.env.VITE_BACKEND_URL;

const EMPTY_FORM = {
  title: '',
  url: '',
  description: '',
  category: 'general',
  image_url: '',
  commission: '',
};

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function DeleteConfirmModal({ item, onCancel, onConfirm, deleting }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1A0020] p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold text-lg">Delete affiliate link?</h3>
          <button
            onClick={onCancel}
            className="text-white/40 hover:text-white"
            disabled={deleting}
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-white/60 leading-relaxed mb-5">
          This will remove <span className="text-white font-medium">{item.title}</span> from the affiliate list.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminAffiliateLinks({ affiliateLinks = [], fetchAffiliateLinks, adminId }) {
  const colors = useColors();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sortedLinks = useMemo(() => {
    return [...affiliateLinks].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });
  }, [affiliateLinks]);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
  };

  const validate = () => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.url.trim()) return 'URL is required.';
    if (!isValidUrl(form.url.trim())) return 'Enter a valid URL starting with http:// or https://';
    if (form.image_url.trim() && !isValidUrl(form.image_url.trim())) {
      return 'Image URL must be a valid http:// or https:// URL.';
    }
    return '';
  };

  const handleSave = async () => {
    resetMessages();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${API}/api/admin/affiliate-links`,
        {
          title: form.title.trim(),
          url: form.url.trim(),
          description: form.description.trim(),
          category: form.category.trim() || 'general',
          image_url: form.image_url.trim(),
          commission: form.commission.trim(),
        },
        { params: { admin_id: adminId } }
      );

      resetForm();
      setShowForm(false);
      setSuccess('Affiliate link saved.');
      if (typeof fetchAffiliateLinks === 'function') {
        await fetchAffiliateLinks();
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save affiliate link.');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (link) => {
    resetMessages();
    setDeleteTarget(link);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    setDeletingId(deleteTarget.id);
    resetMessages();

    try {
      await axios.delete(`${API}/api/admin/affiliate-links/${deleteTarget.id}`, {
        params: { admin_id: adminId },
      });

      setSuccess('Affiliate link deleted.');
      setDeleteTarget(null);

      if (typeof fetchAffiliateLinks === 'function') {
        await fetchAffiliateLinks();
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to delete affiliate link.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="space-y-4" data-testid="affiliate-links-tab">
      <DeleteConfirmModal
        item={deleteTarget}
        deleting={deletingId === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <div className="flex items-center justify-between">
        <h3 style={{ color: colors.textPrimary, fontWeight: 600 }}>Affiliate Links</h3>
        <button
          data-testid="add-affiliate-btn"
          onClick={() => {
            resetMessages();
            setShowForm((prev) => !prev);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#e04e35] rounded-xl text-white text-sm font-medium"
        >
          <Plus size={16} /> {showForm ? 'Close' : 'Add Link'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {showForm && (
        <div
          className="p-5 rounded-2xl border border-[#e04e35]/30 space-y-4"
          style={{ background: colors.darker }}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                Title
              </label>
              <input
                type="text"
                placeholder="Product name"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: colors.darkest,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                }}
              />
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                URL
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: colors.darkest,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                }}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                Image URL
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: colors.darkest,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                }}
              />
            </div>

            <div>
              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
                Commission
              </label>
              <input
                type="text"
                placeholder="e.g. 20%"
                value={form.commission}
                onChange={(e) => setForm({ ...form, commission: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: colors.darkest,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
              Category
            </label>
            <input
              type="text"
              placeholder="general"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: colors.darkest,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>
              Description
            </label>
            <input
              type="text"
              placeholder="Brief description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                background: colors.darkest,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#e04e35] rounded-lg text-white text-sm font-medium flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
                resetMessages();
              }}
              disabled={saving}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                color: colors.textMuted,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {sortedLinks.length === 0 ? (
        <div className="text-center py-16">
          <LinkIcon
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: colors.textMuted, opacity: 0.4 }}
          />
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>
            No Affiliate Links
          </h3>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Add links to show in the store
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLinks.map((link) => {
            const isDeleting = deletingId === link.id;

            return (
              <div
                key={link.id}
                className="flex items-center gap-4 p-4 rounded-xl border"
                style={{ background: colors.darker, borderColor: colors.border }}
              >
                {link.image_url ? (
                  <img
                    src={link.image_url}
                    alt={link.title || ''}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: colors.darkest, border: `1px solid ${colors.border}` }}
                  >
                    <LinkIcon size={18} style={{ color: colors.textMuted }} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div style={{ color: colors.textPrimary, fontWeight: 600 }}>{link.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                    {link.description || 'No description'}
                  </div>

                  <div className="flex gap-3 mt-2 text-xs flex-wrap">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: colors.cinnabar }}
                    >
                      Visit
                    </a>
                    {link.category && (
                      <span style={{ color: colors.textMuted }}>Category: {link.category}</span>
                    )}
                    {link.commission && (
                      <span style={{ color: colors.textMuted }}>
                        Commission: {link.commission}
                      </span>
                    )}
                    <span style={{ color: colors.textMuted }}>
                      Clicks: {link.clicks || 0}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => requestDelete(link)}
                  disabled={isDeleting}
                  className="p-2 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                  style={{ color: colors.textMuted }}
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
