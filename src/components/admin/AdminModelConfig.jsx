import React, { useState, useEffect } from 'react';
import { Cpu, Check, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_BACKEND_URL;

export function AdminModelConfig({ adminId }) {
  const [models, setModels] = useState([]);
  const [current, setCurrent] = useState({ provider: '', model_id: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/ai-model?admin_id=${adminId}`);
      setCurrent({ provider: res.data.provider, model_id: res.data.model_id });
      setModels(res.data.available_models || []);
    } catch (e) { console.error('Failed to load AI model config', e); }
    finally { setLoading(false); }
  };

  const selectModel = async (provider, model_id) => {
    setSaving(true);
    setSaved(false);
    try {
      await axios.put(`${API}/api/admin/ai-model?admin_id=${adminId}`, { provider, model_id });
      setCurrent({ provider, model_id });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert('Failed to update AI model'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--cth-admin-accent)]" />
      </div>
    );
  }

  const providerGroups = {};
  models.forEach(m => {
    if (!providerGroups[m.provider]) providerGroups[m.provider] = [];
    providerGroups[m.provider].push(m);
  });

  const providerLabels = { anthropic: 'Anthropic', openai: 'OpenAI', google: 'Google' };
  const providerColors = { anthropic: 'var(--cth-status-warning)', openai: 'var(--cth-status-success-bright)', google: 'var(--cth-status-info)' };

  return (
    <div className="space-y-6" data-testid="ai-model-config-tab">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[var(--cth-admin-accent)]" />
            AI Model Selection
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Choose the AI model used for all platform content generation
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Check size={14} className="text-green-400" />
            <span className="text-sm text-green-400 font-medium">Model Updated</span>
          </div>
        )}
      </div>

      {/* Current model banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--cth-admin-accent)]/10 to-[var(--cth-brand-primary)]/5 border border-[var(--cth-admin-accent)]/30">
        <div className="text-xs text-[var(--cth-admin-accent)] uppercase tracking-wider font-medium mb-2">Currently Active</div>
        <div className="text-white font-bold text-lg">
          {models.find(m => m.model_id === current.model_id)?.label || current.model_id}
        </div>
        <div className="text-sm text-gray-400 mt-1">
          Provider: {providerLabels[current.provider] || current.provider}
        </div>
      </div>

      {/* Model grid by provider */}
      {Object.entries(providerGroups).map(([provider, providerModels]) => (
        <div key={provider}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: providerColors[provider] || 'var(--cth-admin-muted)' }} />
            <span className="text-sm font-semibold text-gray-300">{providerLabels[provider] || provider}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {providerModels.map(model => {
              const isActive = current.provider === model.provider && current.model_id === model.model_id;
              return (
                <button
                  key={model.model_id}
                  data-testid={`model-select-${model.model_id}`}
                  onClick={() => !isActive && selectModel(model.provider, model.model_id)}
                  disabled={saving}
                  className={`relative p-5 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'bg-[var(--cth-admin-accent)]/10 border-[var(--cth-admin-accent)]/50'
                      : 'bg-[var(--cth-admin-ink)] border-white/10 hover:border-[var(--cth-admin-accent)]/30 hover:bg-[var(--cth-admin-ink)]/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">{model.label}</span>
                    {isActive && (
                      <div className="w-6 h-6 rounded-full bg-[var(--cth-admin-accent)] flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{model.model_id}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="p-4 rounded-xl bg-white/5 border border-white/5">
        <p className="text-xs text-gray-500 leading-relaxed">
          Changing the AI model affects all content generation across the platform including Brand Foundation, Content Studio, SEO tools, and chatbot responses. 
          The change takes effect immediately for all new generations.
        </p>
      </div>
    </div>
  );
}
