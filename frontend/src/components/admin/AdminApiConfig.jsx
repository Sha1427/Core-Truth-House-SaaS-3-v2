import React, { useMemo, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { Key, Plus, Save, Trash2, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const EMPTY_FORM = {
  service: '',
  key_name: '',
  key_value: '',
  description: '',
};

const SERVICE_OPTIONS = [
  { value: 'replicate', label: 'Replicate' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'resend', label: 'Resend' },
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'custom', label: 'Custom' },
];

function StatusBanner({ type = 'info', message, onClose }) {
  if (!message) return null;

  const styles = {
    success: {
      wrap: 'bg-green-500/10 border-green-500/20 text-green-400',
      icon: <CheckCircle2 size={15} className="shrink-0" />,
    },
    error: {
      wrap: 'bg-red-500/10 border-red-500/20 text-red-400',
      icon: <AlertCircle size={15} className="shrink-0" />,
    },
    info: {
      wrap: 'bg-white/5 border-white/10 text-gray-300',
      icon: <AlertCircle size={15} className="shrink-0" />,
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 ${current.wrap}`}>
      <div className="flex items-start gap-2">
        {current.icon}
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current/70 hover:text-current transition-colors"
          aria-label="Close message"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function DeleteConfirmModal({ config, onCancel, onConfirm, deleting }) {
  if (!config) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--cth-surface-night)] p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">Delete API configuration?</h3>
            <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone.</p>
          </div>
        </div>

        <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-5">
          <div className="text-sm text-white font-medium">{config.key_name}</div>
          <div className="text-xs text-gray-400 mt-1">
            {config.service} • {config.key_value}
          </div>
          {config.description ? (
            <div className="text-xs text-gray-500 mt-2">{config.description}</div>
          ) : null}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 bg-red-500 rounded-lg text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminApiConfig({ apiConfigs = [], fetchApiConfigs }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isValid = useMemo(() => {
    return Boolean(form.service && form.key_name.trim() && form.key_value.trim());
  }, [form]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const save = async () => {
    clearMessages();

    if (!isValid) {
      setError('Service, key name, and key value are required.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/api/admin/api-config', form);
      setSuccess('API configuration saved successfully.');
      resetForm();
      await fetchApiConfigs?.();
    } catch (err) {
      console.error('API config save error:', err);
      const msg = err?.payload?.detail || err?.message || 'Unknown error';
      setError(`Failed to save config: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!deleteTarget?.id) return;

    clearMessages();
    setDeletingId(deleteTarget.id);

    try {
      await apiClient.delete(`/api/admin/api-config/${deleteTarget.id}`);
      setSuccess('API configuration deleted.');
      setDeleteTarget(null);
      await fetchApiConfigs?.();
    } catch (err) {
      console.error('API config delete error:', err);
      const msg = err?.payload?.detail || err?.message || 'Delete failed';
      setError(msg);
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="space-y-4" data-testid="api-config-tab">
      <DeleteConfirmModal
        config={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmRemove}
        deleting={deletingId === deleteTarget?.id}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">API Key Configuration</h3>
        <button
          data-testid="add-api-key-btn"
          onClick={() => {
            clearMessages();
            setShowForm((prev) => !prev);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--cth-admin-accent)] rounded-xl text-white text-sm font-medium hover:bg-[color-mix(in srgb, var(--cth-admin-accent) 82%, black)] transition-colors"
        >
          <Plus size={16} />
          {showForm ? 'Close Form' : 'Add API Key'}
        </button>
      </div>

      <StatusBanner type="success" message={success} onClose={() => setSuccess('')} />
      <StatusBanner type="error" message={error} onClose={() => setError('')} />

      {showForm && (
        <div className="p-5 rounded-2xl bg-[var(--cth-admin-ink)] border border-[var(--cth-admin-accent)]/30 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Service</label>
              <select
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--cth-surface-deep)] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--cth-admin-accent)]/50"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">Select service...</option>
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Key Name</label>
              <input
                type="text"
                placeholder="e.g., REPLICATE_API_TOKEN"
                value={form.key_name}
                onChange={(e) => setForm({ ...form, key_name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--cth-admin-accent)]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">API Key Value</label>
            <input
              type="password"
              placeholder="sk-..."
              value={form.key_value}
              onChange={(e) => setForm({ ...form, key_value: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--cth-admin-accent)]/50"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Description (optional)</label>
            <input
              type="text"
              placeholder="What is this key for?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--cth-admin-accent)]/50"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !isValid}
              className="px-4 py-2 bg-[var(--cth-admin-accent)] rounded-lg text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-[color-mix(in srgb, var(--cth-admin-accent) 82%, black)] transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Key'}
            </button>

            <button
              onClick={resetForm}
              disabled={saving}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {apiConfigs.length === 0 ? (
          <div className="text-center py-16">
            <Key className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No API Keys Configured</h3>
            <p className="text-sm text-gray-400">Add API keys to enable third-party integrations</p>
          </div>
        ) : (
          apiConfigs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--cth-admin-ink)] border border-white/10"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Key size={18} className="text-[var(--cth-admin-accent)]" />
                </div>

                <div className="min-w-0">
                  <div className="text-white font-medium break-all">{config.key_name}</div>
                  <div className="text-xs text-gray-400 break-all">
                    {config.service} • {config.key_value}
                  </div>
                  {config.description ? (
                    <div className="text-xs text-gray-500 mt-1">{config.description}</div>
                  ) : null}
                </div>
              </div>

              <button
                onClick={() => setDeleteTarget(config)}
                disabled={deletingId === config.id}
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 shrink-0"
                aria-label={`Delete ${config.key_name}`}
              >
                {deletingId === config.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
