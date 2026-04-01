import React, { useState } from 'react';
import axios from 'axios';
import { BookOpen, Plus, Save, Trash2 } from 'lucide-react';
import { useColors } from '../../context/ThemeContext';

const API = import.meta.env.VITE_BACKEND_URL;

export function AdminPreloadedPrompts({ preloadedPrompts, fetchPreloadedPrompts, adminId }) {
  const colors = useColors();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', min_plan: 'STRUCTURE', tags: [] });

  const save = async () => {
    if (!form.title || !form.content) return;
    try {
      await axios.post(`${API}/api/admin/preloaded-prompts?admin_id=${adminId}`, form);
      setForm({ title: '', content: '', category: 'general', min_plan: 'STRUCTURE', tags: [] });
      setShowForm(false);
      fetchPreloadedPrompts();
    } catch { alert('Failed to save'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this prompt?')) return;
    try { await axios.delete(`${API}/api/admin/preloaded-prompts/${id}?admin_id=${adminId}`); fetchPreloadedPrompts(); } catch {}
  };

  return (
    <div className="space-y-4" data-testid="preloaded-prompts-tab">
      <div className="flex items-center justify-between">
        <h3 style={{ color: colors.textPrimary, fontWeight: 600 }}>Preloaded Prompts for Prompt Hub</h3>
        <button data-testid="add-preloaded-prompt-btn" onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#e04e35] rounded-xl text-white text-sm font-medium">
          <Plus size={16} /> Add Prompt
        </button>
      </div>
      {showForm && (
        <div className="p-5 rounded-2xl border border-[#e04e35]/30 space-y-4" style={{ background: colors.darker }}>
          <div>
            <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Title</label>
            <input type="text" placeholder="Prompt title" value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: colors.darkest, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: 14 }} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Prompt Content</label>
            <textarea placeholder="Write the full prompt..." value={form.content}
              onChange={e => setForm({...form, content: e.target.value})} rows={5}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: colors.darkest, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: 14, resize: 'vertical' }} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Category</label>
              <input type="text" placeholder="e.g. branding, content, strategy" value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: colors.darkest, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: 14 }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Minimum Plan Required</label>
              <select value={form.min_plan} onChange={e => setForm({...form, min_plan: e.target.value})}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: colors.darkest, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: 14, colorScheme: 'dark' }}>
                <option value="STRUCTURE">Structure ($97+)</option>
                <option value="HOUSE">House ($197+)</option>
                <option value="ESTATE">Estate ($497+)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-[#e04e35] rounded-lg text-white text-sm font-medium flex items-center gap-2"><Save size={14} /> Save Prompt</button>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      {preloadedPrompts.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: colors.textMuted, opacity: 0.4 }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.textPrimary }}>No Preloaded Prompts</h3>
          <p className="text-sm" style={{ color: colors.textMuted }}>Add prompts for Structure+ clients to use in the Prompt Hub</p>
        </div>
      ) : (
        <div className="space-y-3">
          {preloadedPrompts.map(p => (
            <div key={p.id} className="p-4 rounded-xl border" style={{ background: colors.darker, borderColor: colors.border }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: colors.textPrimary, fontWeight: 600 }}>{p.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${colors.cinnabar}20`, color: colors.cinnabar }}>{p.min_plan}+</span>
                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${colors.tuscany}15`, color: colors.tuscany }}>{p.category}</span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: colors.textMuted }}>{p.content}</p>
                </div>
                <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-red-500/10" style={{ color: colors.textMuted }}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
