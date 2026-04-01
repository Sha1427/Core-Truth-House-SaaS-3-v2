import React, { useState, useEffect } from 'react';
import { Key, Plus, Save, Trash2, Eye, EyeOff, Shield, AlertTriangle, Check } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_BACKEND_URL;

const API_KEY_SERVICES = [
  { id: 'openai', label: 'OpenAI', keyName: 'OPENAI_API_KEY', description: 'For GPT, DALL-E, Whisper, Sora' },
  { id: 'anthropic', label: 'Anthropic', keyName: 'ANTHROPIC_API_KEY', description: 'For Claude models' },
  { id: 'replicate', label: 'Replicate', keyName: 'REPLICATE_API_TOKEN', description: 'For FLUX, Kling, Minimax' },
  { id: 'elevenlabs', label: 'ElevenLabs', keyName: 'ELEVENLABS_API_KEY', description: 'For voice generation' },
  { id: 'resend', label: 'Resend', keyName: 'RESEND_API_KEY', description: 'For email sending' },
  { id: 'serpapi', label: 'SerpAPI', keyName: 'SERPAPI_KEY', description: 'For SEO research' },
  { id: 'stripe', label: 'Stripe', keyName: 'STRIPE_SECRET_KEY', description: 'For payment processing' },
];

export function AdminPersonalKeys({ adminId }) {
  const [keys, setKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [showValues, setShowValues] = useState({});
  const [editMode, setEditMode] = useState({});
  const [tempValues, setTempValues] = useState({});

  useEffect(() => {
    fetchKeys();
  }, [adminId]);

  const fetchKeys = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/personal-keys?admin_id=${adminId}`);
      setKeys(res.data.keys || {});
    } catch (err) {
      console.error('Failed to fetch personal keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveKey = async (service) => {
    const value = tempValues[service];
    if (!value?.trim()) return;

    setSaving(service);
    try {
      await axios.post(`${API}/api/admin/personal-keys?admin_id=${adminId}`, {
        service,
        key_value: value.trim(),
      });
      setKeys(prev => ({ ...prev, [service]: { configured: true, last_updated: new Date().toISOString() } }));
      setEditMode(prev => ({ ...prev, [service]: false }));
      setTempValues(prev => ({ ...prev, [service]: '' }));
    } catch (err) {
      alert('Failed to save key: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(null);
    }
  };

  const removeKey = async (service) => {
    if (!window.confirm(`Remove your personal ${service} API key? The system will fall back to Emergent LLM key if available.`)) return;
    
    setSaving(service);
    try {
      await axios.delete(`${API}/api/admin/personal-keys/${service}?admin_id=${adminId}`);
      setKeys(prev => {
        const copy = { ...prev };
        delete copy[service];
        return copy;
      });
    } catch (err) {
      alert('Failed to remove key');
    } finally {
      setSaving(null);
    }
  };

  const toggleShowValue = (service) => {
    setShowValues(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const startEdit = (service) => {
    setEditMode(prev => ({ ...prev, [service]: true }));
    setTempValues(prev => ({ ...prev, [service]: '' }));
  };

  const cancelEdit = (service) => {
    setEditMode(prev => ({ ...prev, [service]: false }));
    setTempValues(prev => ({ ...prev, [service]: '' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-[#e04e35] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="personal-keys-tab">
      {/* Header */}
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#e04e35]/10 to-[#af0024]/10 border border-[#e04e35]/20">
        <div className="w-12 h-12 rounded-xl bg-[#e04e35]/20 flex items-center justify-center flex-shrink-0">
          <Shield size={24} className="text-[#e04e35]" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg mb-1">Personal API Keys</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Add your own API keys to use instead of the shared Emergent LLM key. 
            Your keys are encrypted and used exclusively for your account. 
            When configured, your personal keys take priority over the system defaults.
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200/80">
          <strong>Important:</strong> Keep your API keys secure. Never share them. 
          Keys are stored encrypted but you are responsible for usage costs on your personal accounts.
        </div>
      </div>

      {/* Keys List */}
      <div className="space-y-3">
        {API_KEY_SERVICES.map(service => {
          const keyData = keys[service.id];
          const isConfigured = keyData?.configured;
          const isEditing = editMode[service.id];
          const isSaving = saving === service.id;

          return (
            <div
              key={service.id}
              className={`rounded-2xl border transition-all ${
                isConfigured
                  ? 'bg-[#2b1040] border-green-500/30'
                  : 'bg-[#2b1040]/50 border-white/10'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isConfigured ? 'bg-green-500/20' : 'bg-white/5'
                    }`}>
                      {isConfigured ? (
                        <Check size={18} className="text-green-400" />
                      ) : (
                        <Key size={18} className="text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{service.label}</span>
                        {isConfigured && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                            CONFIGURED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{service.keyName}</div>
                      <div className="text-sm text-gray-400 mt-1">{service.description}</div>
                      {isConfigured && keyData.last_updated && (
                        <div className="text-xs text-gray-600 mt-2">
                          Last updated: {new Date(keyData.last_updated).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isConfigured && !isEditing && (
                      <>
                        <button
                          onClick={() => startEdit(service.id)}
                          className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => removeKey(service.id)}
                          disabled={isSaving}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {!isConfigured && !isEditing && (
                      <button
                        onClick={() => startEdit(service.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[#e04e35] text-white font-medium hover:bg-[#e04e35]/90 transition-colors"
                      >
                        <Plus size={14} /> Add Key
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit Form */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <input
                          type={showValues[service.id] ? 'text' : 'password'}
                          value={tempValues[service.id] || ''}
                          onChange={e => setTempValues(prev => ({ ...prev, [service.id]: e.target.value }))}
                          placeholder={`Enter your ${service.label} API key...`}
                          className="w-full px-4 py-3 pr-10 bg-[#1c0828] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#e04e35]/50"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowValue(service.id)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          {showValues[service.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        onClick={() => saveKey(service.id)}
                        disabled={isSaving || !tempValues[service.id]?.trim()}
                        className="px-4 py-2 bg-[#e04e35] rounded-xl text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Save size={14} />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => cancelEdit(service.id)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-sm hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage Info */}
      <div className="p-5 rounded-2xl bg-[#1c0828] border border-white/5">
        <h4 className="text-white font-semibold mb-3">How It Works</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-[#e04e35] mt-1">•</span>
            <span>When you add a personal key, it will be used for all AI operations instead of the Emergent LLM key.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#e04e35] mt-1">•</span>
            <span>Usage costs are billed directly to your personal API accounts.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#e04e35] mt-1">•</span>
            <span>If a personal key fails or is removed, the system falls back to the Emergent LLM key.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#e04e35] mt-1">•</span>
            <span>Your AI credit limits are bypassed when using personal keys.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
