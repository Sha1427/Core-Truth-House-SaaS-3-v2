/**
 * AutomationsPage.jsx — Advanced Automation Rules (Conditional Chains)
 * Core Truth House OS
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../hooks/useAuth';
import { DashboardLayout } from '../components/Layout';
import {
  Loader2, Plus, Zap, Play, Pause, Trash2, ChevronRight, ChevronDown,
  Bell, RefreshCw, Calendar, Tag, Globe, Clipboard, UserPlus, CheckCircle,
  Clock, TrendingUp, Flag, Send, ArrowRight, X, ToggleLeft, ToggleRight,
} from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const ICON_MAP = {
  'bell': Bell, 'refresh-cw': RefreshCw, 'zap': Zap, 'calendar': Calendar,
  'tag': Tag, 'globe': Globe, 'clipboard': Clipboard, 'user-plus': UserPlus,
  'check-circle': CheckCircle, 'clock': Clock, 'trending-up': TrendingUp,
  'flag': Flag, 'send': Send,
};

function TriggerIcon({ icon, size = 16 }) {
  const Comp = ICON_MAP[icon] || Zap;
  return <Comp size={size} />;
}

function FieldInput({ field, value, onChange }) {
  if (field.type === 'select') {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="cth-card border border-[var(--cth-admin-border)] rounded-lg px-3 py-2 text-xs cth-muted focus:outline-none focus:border-[rgba(224,78,53,0.35)] w-full"
      >
        <option value="">Select {field.label}...</option>
        {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.label}
        className="cth-card-muted border border-[var(--cth-admin-border)] rounded-lg px-3 py-2 text-xs cth-heading placeholder:cth-muted focus:outline-none focus:border-[rgba(224,78,53,0.35)] w-full"
      />
    );
  }
  if (field.type === 'textarea') {
    return (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.label}
        rows={2}
        className="cth-card-muted border border-[var(--cth-admin-border)] rounded-lg px-3 py-2 text-xs cth-heading placeholder:cth-muted focus:outline-none focus:border-[rgba(224,78,53,0.35)] w-full resize-none"
      />
    );
  }
  if (field.type === 'time') {
    return (
      <input
        type="time"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="cth-card-muted border border-[var(--cth-admin-border)] rounded-lg px-3 py-2 text-xs cth-heading focus:outline-none focus:border-[rgba(224,78,53,0.35)] w-full"
        style={{ colorScheme: 'light' }}
      />
    );
  }
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.label}
      className="cth-card-muted border border-[var(--cth-admin-border)] rounded-lg px-3 py-2 text-xs cth-heading placeholder:cth-muted focus:outline-none focus:border-[rgba(224,78,53,0.35)] w-full"
    />
  );
}

function AutomationCard({ automation, onSelect, onToggle, onDelete, isSelected }) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all cursor-pointer ${
        isSelected ? 'bg-[rgba(224,78,53,0.10)] border-[rgba(224,78,53,0.24)]' : 'cth-card-muted border-[var(--cth-admin-border)] hover:border-[var(--cth-admin-border)]'
      }`}
      onClick={() => onSelect(automation.id)}
      data-testid={`automation-card-${automation.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${automation.is_active ? 'bg-emerald-400' : 'bg-[var(--cth-admin-border)]'}`} />
          <p className="text-sm font-semibold cth-heading">{automation.name}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(automation.id); }}
            data-testid={`toggle-automation-${automation.id}`}
            className="p-1 rounded-md hover:cth-card-muted transition-colors"
          >
            {automation.is_active ? <ToggleRight size={16} className="text-emerald-400" /> : <ToggleLeft size={16} className="cth-muted" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(automation.id); }}
            className="p-1 rounded-md hover:bg-red-400/10 transition-colors cth-muted hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      {automation.description && <p className="text-[10.5px] cth-muted mb-2">{automation.description}</p>}
      <div className="flex items-center gap-2 text-[9.5px] cth-muted">
        <span className="px-2 py-0.5 rounded-full cth-card-muted">
          {automation.trigger?.type || 'No trigger'}
        </span>
        <ArrowRight size={10} />
        <span className="px-2 py-0.5 rounded-full cth-card-muted">
          {(automation.actions || []).length} action{(automation.actions || []).length !== 1 ? 's' : ''}
        </span>
        {automation.execution_count > 0 && (
          <span className="ml-auto cth-muted">{automation.execution_count} runs</span>
        )}
      </div>
    </div>
  );
}

function AutomationBuilder({ config, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState({ type: '', config: {} });
  const [actions, setActions] = useState([]);
  const [conditions, setConditions] = useState([]);

  const triggerTypes = config?.triggers || [];
  const actionTypes = config?.actions || [];

  const selectedTrigger = triggerTypes.find(t => t.id === trigger.type);

  const addAction = () => {
    setActions([...actions, { id: Date.now().toString(), type: '', config: {} }]);
  };

  const updateAction = (idx, key, val) => {
    setActions(actions.map((a, i) => i === idx ? { ...a, [key]: val } : a));
  };

  const removeAction = (idx) => {
    setActions(actions.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!name || !trigger.type || actions.length === 0) return;
    onSave({
      name,
      description,
      trigger: { type: trigger.type, ...trigger.config },
      conditions,
      actions: actions.map(a => ({ type: a.type, ...a.config })),
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-base font-bold cth-heading mb-1" >New Automation</h2>
          <p className="text-xs cth-muted">Define a trigger, optional conditions, and actions.</p>
        </div>

        {/* Name */}
        <div>
          <label className="text-[10px] font-semibold tracking-widest uppercase cth-muted block mb-1.5">Name <span className="cth-text-accent">*</span></label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Auto-pause low-engagement campaigns"
            data-testid="automation-name-input"
            className="w-full cth-card-muted border border-[var(--cth-admin-border)] rounded-lg px-3.5 py-2.5 text-sm cth-heading placeholder:cth-muted focus:outline-none focus:border-[rgba(224,78,53,0.35)] transition-all"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold tracking-widest uppercase cth-muted block mb-1.5">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this automation do?"
            className="w-full cth-card-muted border border-[var(--cth-admin-border)] rounded-lg px-3.5 py-2.5 text-sm cth-heading placeholder:cth-muted focus:outline-none focus:border-[rgba(224,78,53,0.35)] transition-all"
          />
        </div>

        {/* Trigger */}
        <div>
          <label className="text-[10px] font-semibold tracking-widest uppercase cth-muted block mb-2">
            <span className="cth-text-accent mr-1">IF</span> Trigger <span className="cth-text-accent">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {triggerTypes.map(t => (
              <button
                key={t.id}
                onClick={() => setTrigger({ type: t.id, config: {} })}
                data-testid={`trigger-${t.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  trigger.type === t.id ? 'border-[rgba(224,78,53,0.35)] bg-[var(--cth-admin-accent)]/10' : 'border-[var(--cth-admin-border)] cth-card-muted hover:border-[var(--cth-admin-border)]'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${trigger.type === t.id ? 'bg-[var(--cth-admin-accent)]/20 cth-text-accent' : 'cth-card-muted cth-muted'}`}>
                  <TriggerIcon icon={t.icon} />
                </div>
                <div>
                  <p className={`text-[11px] font-semibold ${trigger.type === t.id ? 'cth-heading' : 'cth-muted'}`}>{t.label}</p>
                  <p className="text-[9.5px] cth-muted">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
          {selectedTrigger && (selectedTrigger.fields || []).length > 0 && (
            <div className="p-4 cth-card-muted rounded-xl border border-[var(--cth-admin-border)] space-y-3">
              <p className="text-[10px] font-semibold cth-muted uppercase tracking-widest">Configure Trigger</p>
              {selectedTrigger.fields.map(field => (
                <div key={field.id}>
                  <label className="text-[10px] cth-muted block mb-1">{field.label}</label>
                  <FieldInput field={field} value={trigger.config[field.id]} onChange={(v) => setTrigger({ ...trigger, config: { ...trigger.config, [field.id]: v } })} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div>
          <label className="text-[10px] font-semibold tracking-widest uppercase cth-muted block mb-2">
            <span className="text-emerald-400 mr-1">THEN</span> Actions <span className="cth-text-accent">*</span>
          </label>
          <div className="space-y-3">
            {actions.map((action, idx) => {
              const actionType = actionTypes.find(a => a.id === action.type);
              return (
                <div key={action.id} className="p-4 cth-card-muted rounded-xl border border-[var(--cth-admin-border)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold cth-muted uppercase tracking-widest">Action {idx + 1}</p>
                    <button onClick={() => removeAction(idx)} className="cth-muted hover:text-red-400 transition-colors"><X size={14} /></button>
                  </div>
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(idx, 'type', e.target.value)}
                    data-testid={`action-type-${idx}`}
                    className="cth-card border border-[var(--cth-admin-border)] rounded-lg px-3 py-2 text-xs cth-muted focus:outline-none w-full mb-3"
                  >
                    <option value="">Select action...</option>
                    {actionTypes.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                  {actionType && (actionType.fields || []).length > 0 && (
                    <div className="space-y-2">
                      {actionType.fields.map(field => (
                        <div key={field.id}>
                          <label className="text-[10px] cth-muted block mb-1">{field.label}</label>
                          <FieldInput field={field} value={action.config[field.id]} onChange={(v) => updateAction(idx, 'config', { ...action.config, [field.id]: v })} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button
              onClick={addAction}
              data-testid="add-action-btn"
              className="w-full py-3 rounded-lg border border-dashed border-[var(--cth-admin-border)] text-xs cth-muted hover:cth-muted hover:border-[rgba(224,78,53,0.24)] transition-all"
            >
              + Add Action
            </button>
          </div>
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={!name || !trigger.type || actions.length === 0}
            data-testid="save-automation-btn"
            className="px-6 py-2.5 rounded-lg bg-[var(--cth-admin-accent)] text-white text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Automation
          </button>
          <button onClick={onCancel} className="px-4 py-2.5 rounded-lg text-xs cth-muted hover:cth-muted transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function AutomationsPageContent() {
  const { user } = useUser();
  const userId = user?.id || 'default';

  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [config, setConfig] = useState(null);
  const [logs, setLogs] = useState([]);
  const [testing, setTesting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [automRes, configRes] = await Promise.all([
        axios.get(`${API}/automations?user_id=${userId}`),
        axios.get(`${API}/automations/config`),
      ]);
      setAutomations(automRes.data.automations || []);
      setConfig(configRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!selectedId) return;
    axios.get(`${API}/automations/${selectedId}/logs`)
      .then(r => setLogs(r.data.logs || []))
      .catch(() => setLogs([]));
  }, [selectedId]);

  const selected = automations.find(a => a.id === selectedId);

  const handleSave = async (data) => {
    try {
      const res = await axios.post(`${API}/automations`, { user_id: userId, ...data });
      setAutomations(prev => [res.data, ...prev]);
      setSelectedId(res.data.id);
      setIsCreating(false);
    } catch (e) { alert('Failed to save: ' + (e.response?.data?.detail || e.message)); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await axios.post(`${API}/automations/${id}/toggle`);
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, is_active: res.data.is_active } : a));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/automations/${id}`);
      setAutomations(prev => prev.filter(a => a.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (e) { console.error(e); }
  };

  const handleTest = async (id) => {
    setTesting(true);
    try {
      await axios.post(`${API}/automations/${id}/test`);
      const logsRes = await axios.get(`${API}/automations/${id}/logs`);
      setLogs(logsRes.data.logs || []);
    } catch (e) { console.error(e); }
    setTesting(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin cth-text-accent" size={32} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <div className="flex items-center justify-between pl-14 pr-4 py-3 md:px-8 md:py-4 border-b border-[var(--cth-admin-border)] bg-[rgba(248,244,242,0.94)] backdrop-blur-sm sticky top-0 z-20">
          <div>
            <h1 className="text-xl font-semibold cth-heading"  data-testid="automations-title">Automations</h1>
            <p className="text-xs cth-muted mt-0.5">Conditional chains — IF trigger → THEN action</p>
          </div>
          <button
            onClick={() => { setIsCreating(true); setSelectedId(null); }}
            data-testid="new-automation-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--cth-admin-accent)] text-white text-xs font-semibold hover:opacity-90 transition-all shadow-lg shadow-[rgba(224,78,53,0.20)]"
          >
            <Plus size={14} /> New Automation
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left: list */}
          <div className="md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r border-[var(--cth-admin-border)] overflow-y-auto p-4 space-y-3 cth-page max-h-48 md:max-h-none">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-semibold tracking-[0.2em] uppercase cth-muted">{automations.length} Automations</p>
              <div className="flex items-center gap-2 text-[10px] cth-muted">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{automations.filter(a => a.is_active).length} active</span>
              </div>
            </div>
            {automations.length === 0 && !isCreating && (
              <div className="text-center py-12">
                <Zap size={28} className="mx-auto cth-muted mb-3" />
                <p className="text-sm cth-muted mb-1">No automations yet</p>
                <p className="text-xs cth-muted">Create your first rule</p>
              </div>
            )}
            {automations.map(a => (
              <AutomationCard
                key={a.id}
                automation={a}
                onSelect={(id) => { setSelectedId(id); setIsCreating(false); }}
                onToggle={handleToggle}
                onDelete={handleDelete}
                isSelected={selectedId === a.id && !isCreating}
              />
            ))}
          </div>

          {/* Right: builder or detail */}
          {isCreating ? (
            <AutomationBuilder config={config} onSave={handleSave} onCancel={() => setIsCreating(false)} />
          ) : selected ? (
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="max-w-2xl space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${selected.is_active ? 'bg-emerald-400' : 'bg-[var(--cth-admin-border)]'}`} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest cth-muted">{selected.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <h2 className="text-lg font-bold cth-heading" >{selected.name}</h2>
                    {selected.description && <p className="text-sm cth-muted mt-1">{selected.description}</p>}
                  </div>
                  <button
                    onClick={() => handleTest(selected.id)}
                    disabled={testing}
                    data-testid="test-automation-btn"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cth-card-muted border border-[var(--cth-admin-border)] text-[10.5px] cth-muted hover:cth-heading transition-all"
                  >
                    {testing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                    Test Run
                  </button>
                </div>

                {/* Visual chain */}
                <div className="p-5 cth-card-muted rounded-xl border border-[var(--cth-admin-border)]">
                  <p className="text-[10px] font-semibold tracking-widest uppercase cth-muted mb-4">Automation Chain</p>

                  {/* Trigger */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--cth-admin-accent)]/15 flex items-center justify-center cth-text-accent">
                      <TriggerIcon icon={(config?.triggers || []).find(t => t.id === selected.trigger?.type)?.icon || 'zap'} size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold cth-text-accent uppercase tracking-widest">IF</p>
                      <p className="text-sm cth-muted">{(config?.triggers || []).find(t => t.id === selected.trigger?.type)?.label || selected.trigger?.type}</p>
                    </div>
                  </div>

                  <div className="ml-5 border-l-2 border-[var(--cth-admin-border)] pl-5 space-y-3">
                    {(selected.actions || []).map((action, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                          <TriggerIcon icon={(config?.actions || []).find(a => a.id === action.type)?.icon || 'zap'} size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-emerald-400/70 uppercase tracking-widest">THEN</p>
                          <p className="text-xs cth-muted">{(config?.actions || []).find(a => a.id === action.type)?.label || action.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execution Logs */}
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase cth-muted mb-3">Execution Logs</p>
                  {logs.length === 0 ? (
                    <p className="text-xs cth-muted py-4">No executions yet. Click "Test Run" to simulate.</p>
                  ) : (
                    <div className="space-y-2">
                      {logs.map(log => (
                        <div key={log.id} className="p-3 cth-card-muted rounded-lg border border-[var(--cth-admin-border)] flex items-center justify-between">
                          <div>
                            <p className="text-xs cth-muted">{log.is_test ? 'Test run' : 'Auto-executed'} — {(log.actions_executed || []).join(', ')}</p>
                            <p className="text-[10px] cth-muted mt-0.5">{new Date(log.executed_at).toLocaleString()}</p>
                          </div>
                          <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-emerald-400/12 text-emerald-400' : 'bg-red-400/12 text-red-400'}`}>{log.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[10.5px] cth-muted">
                  <span>Created: {new Date(selected.created_at).toLocaleDateString()}</span>
                  <span>Runs: {selected.execution_count || 0}</span>
                  {selected.last_executed && <span>Last: {new Date(selected.last_executed).toLocaleString()}</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-[var(--cth-admin-accent)]/10 border border-[rgba(224,78,53,0.18)] flex items-center justify-center mb-5">
                <Zap size={28} className="cth-text-accent/50" />
              </div>
              <h3 className="text-base font-semibold cth-muted mb-2" >Automate your workflow</h3>
              <p className="text-sm cth-muted max-w-sm leading-relaxed mb-6">
                Create conditional chains that run automatically. Set a trigger, define conditions, and choose actions — the OS handles the rest.
              </p>
              <button onClick={() => setIsCreating(true)} data-testid="create-first-automation-btn" className="px-5 py-2.5 rounded-xl bg-[var(--cth-admin-accent)] text-white text-sm font-semibold hover:opacity-90 transition-all">
                Create Your First Automation
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Export with plan gate wrapper
export default function AutomationsPage() {
  return (
      <AutomationsPageContent />
  );
}

