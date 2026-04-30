import React, { useState } from 'react';
import axios from 'axios';
import { Video, Plus, Save, Trash2 } from 'lucide-react';
import { useColors } from '../../context/ThemeContext';

const API = import.meta.env.VITE_BACKEND_URL;

export function AdminTrainingVideos({ trainingVideos, fetchTrainingVideos, adminId }) {
  const colors = useColors();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', url: '', category: 'general', file: null });

  const save = async () => {
    if (!form.title || (!form.url && !form.file)) return;
    try {
      if (form.file) {
        const fd = new FormData();
        fd.append('file', form.file);
        fd.append('title', form.title);
        fd.append('description', form.description);
        fd.append('category', form.category);
        fd.append('admin_id', adminId);
        await axios.post(`${API}/api/admin/training-videos/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post(`${API}/api/admin/training-videos?admin_id=${adminId}`, { title: form.title, description: form.description, url: form.url, category: form.category });
      }
      setForm({ title: '', description: '', url: '', category: 'general', file: null });
      setShowForm(false);
      fetchTrainingVideos();
    } catch { alert('Failed to save video'); }
  };

  const remove = async (videoId) => {
    if (!window.confirm('Delete this training video?')) return;
    try { await axios.delete(`${API}/api/admin/training-videos/${videoId}?admin_id=${adminId}`); fetchTrainingVideos(); } catch {}
  };

  return (
    <div className="space-y-4" data-testid="training-videos-tab">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Training Videos</h3>
        <button data-testid="add-video-btn" onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--cth-admin-accent)] rounded-xl text-white text-sm font-medium">
          <Plus size={16} /> Add Video
        </button>
      </div>
      {showForm && (
        <div className="p-5 rounded-2xl bg-[var(--cth-admin-ink)] border border-[var(--cth-admin-accent)]/30 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Title</label>
              <input type="text" placeholder="Video title" value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--cth-admin-accent)]/50" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--cth-admin-accent)]/50">
                <option value="general">General</option>
                <option value="getting-started">Getting Started</option>
                <option value="branding">Branding</option>
                <option value="content">Content Creation</option>
                <option value="marketing">Marketing</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: colors.textMuted }}>Video URL or Upload</label>
            <input type="text" placeholder="https://youtube.com/... or https://vimeo.com/..."
              value={form.url} onChange={e => setForm({...form, url: e.target.value, file: null})}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: colors.darkest, border: `1px solid ${colors.border}`, color: colors.textPrimary, fontSize: 14 }} />
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs" style={{ color: colors.textMuted }}>or</span>
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-xs"
                style={{ border: `1px solid ${colors.border}`, color: form.file ? colors.cinnabar : colors.textMuted }}>
                <Video size={14} />
                {form.file ? form.file.name : 'Upload video file'}
                <input type="file" accept="video/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setForm({...form, file: f, url: ''}); }} />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea placeholder="What will they learn?" value={form.description}
              onChange={e => setForm({...form, description: e.target.value})} rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--cth-admin-accent)]/50 resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-4 py-2 bg-[var(--cth-admin-accent)] rounded-lg text-white text-sm font-medium flex items-center gap-2"><Save size={14} /> Save Video</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-400 text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {trainingVideos.length === 0 ? (
          <div className="text-center py-16">
            <Video className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Training Videos</h3>
            <p className="text-sm text-gray-400">Add videos for your clients to learn from</p>
          </div>
        ) : (
          trainingVideos.map(video => (
            <div key={video.id} className="p-4 rounded-xl bg-[var(--cth-admin-ink)] border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--cth-admin-accent)]/10 flex items-center justify-center flex-shrink-0">
                    <Video size={20} className="text-[var(--cth-admin-accent)]" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{video.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{video.description}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400 capitalize">{video.category}</span>
                      {video.url && <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--cth-admin-accent)] hover:underline">Watch Video</a>}
                      {video.is_uploaded && <span className="text-xs text-green-400">Uploaded</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => remove(video.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
