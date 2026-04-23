import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../hooks/useAuth';
import axios from 'axios';
import { DashboardLayout } from '../components/Layout';
import {
import apiClient from "../lib/apiClient";
  Mail, Eye, Send, Loader2, Check, Settings2, CalendarDays, PenLine, Target, BarChart3
} from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function Toggle({ checked, onChange, label, testId }) {
  return (
    <label data-testid={testId} className="flex items-center justify-between py-3 cursor-pointer group">
      <span className="text-sm cth-body transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors"
        style={{ background: checked ? 'var(--cth-admin-accent)' : 'var(--cth-admin-border)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </label>
  );
}

export default function DigestPage() {
  const { user } = useUser();
  const userId = user?.id || 'default';
  const iframeRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');

  const [prefs, setPrefs] = useState({
    enabled: false,
    email: '',
    day_of_week: 'monday',
    include_events: true,
    include_blog: true,
    include_crm: true,
    include_usage: true,
    user_name: '',
  });

  useEffect(() => {
    fetchAll();
  }, [userId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prefsRes, previewRes] = await Promise.all([
        apiClient.get("/api/digest/preferences", { params: { user_id: userId } }),
        apiClient.get("/api/digest/preview", { params: { user_id: userId } }),
      ]);
      if (prefsRes.data) {
        setPrefs(p => ({ ...p, ...prefsRes.data, user_name: prefsRes.data.user_name || user?.firstName || '' }));
      }
      if (previewRes.data) {
        setPreviewHtml(previewRes.data.html || '');
        setPreviewData(previewRes.data.data || null);
      }
    } catch (err) { console.error('Fetch failed:', err); }
    setLoading(false);
  };

  const savePrefs = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/digest/preferences?user_id=${userId}`, prefs);
      setSaving(false);
      setTimeout(() => setSaving(false), 1500);
    } catch (err) { console.error('Save failed:', err); setSaving(false); }
  };

  const sendNow = async () => {
    if (!prefs.email) { setSendResult({ ok: false, msg: 'Set an email address first.' }); return; }
    setSending(true);
    setSendResult(null);
    try {
      const res = await apiClient.post("/api/digest/send", {}, { params: { user_id: userId } });
      const status = res.data?.result?.status || res.data?.status;
      if (status === 'sent') {
        setSendResult({ ok: true, msg: 'Digest sent!' });
      } else if (status === 'skipped') {
        setSendResult({ ok: false, msg: 'Resend API key not configured. Email was not sent.' });
      } else {
        setSendResult({ ok: true, msg: `Digest queued (${status}).` });
      }
    } catch (err) {
      setSendResult({ ok: false, msg: 'Failed to send. Check Resend configuration.' });
    }
    setSending(false);
  };

  const update = (k, v) => setPrefs(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const doc = iframeRef.current.contentDocument;
      doc.open();
      doc.write(previewHtml);
      doc.close();
    }
  }, [previewHtml, activeTab]);

  const statCards = previewData ? [
    { label: 'Pipeline', value: `$${(previewData.pipeline_value || 0).toLocaleString()}`, icon: Target, color: 'var(--cth-admin-accent)' },
    { label: 'Contacts', value: previewData.total_contacts || 0, icon: Mail, color: 'var(--cth-status-success-bright)' },
    { label: 'Deals', value: previewData.total_deals || 0, icon: BarChart3, color: 'var(--cth-admin-ruby)' },
    { label: 'Events', value: (previewData.upcoming_events || []).length, icon: CalendarDays, color: 'var(--cth-admin-muted)' },
    { label: 'Posts', value: (previewData.recent_posts || []).length, icon: PenLine, color: 'var(--cth-status-warning)' },
  ] : [];

  return (
    <DashboardLayout>
      <div data-testid="digest-page" className="cth-page flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b sticky top-0 z-30 backdrop-blur-xl" style={{ borderColor: 'var(--cth-admin-border)', background: 'rgba(248, 244, 242, 0.94)' }}>
          <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1 pl-10 md:pl-0">
                <h1 className="font-bold cth-heading text-lg md:text-xl flex items-center gap-2">
                  <Mail size={20} className="cth-text-accent flex-shrink-0" /> Weekly Digest
                </h1>
                <p className="text-xs cth-muted mt-0.5">
                  {prefs.enabled ? `Enabled — ${prefs.day_of_week}s` : 'Disabled — enable below'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button data-testid="send-digest-btn" onClick={sendNow} disabled={sending}
                  className="cth-button-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                  >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send Now
                </button>
              </div>
            </div>
            {sendResult && (
              <div data-testid="send-result" className="mt-3 text-xs px-4 py-2.5 rounded-xl"
                style={{
                  background: sendResult.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${sendResult.ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  color: sendResult.ok ? 'var(--cth-status-success-bright)' : 'var(--cth-status-danger)',
                }}>
                {sendResult.msg}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-5 md:px-6 md:py-8">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={32} className="mx-auto animate-spin cth-text-accent" />
              <p className="cth-muted mt-3 text-sm">Loading digest...</p>
            </div>
          ) : (
            <>
              {/* Stats row */}
              {statCards.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                  {statCards.map(s => (
                    <div key={s.label} className="rounded-xl p-4 text-center"
                      style={{ background: 'var(--cth-admin-panel)', border: '1px solid var(--cth-admin-border)' }}>
                      <s.icon size={16} className="mx-auto mb-1.5" style={{ color: s.color }} />
                      <div className="text-lg font-bold cth-heading">{s.value}</div>
                      <div className="text-xs cth-muted">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 mb-6 p-1 rounded-xl cth-card-muted border w-fit" style={{ borderColor: 'var(--cth-admin-border)' }}>
                {[
                  { id: 'preview', label: 'Preview', icon: Eye },
                  { id: 'settings', label: 'Settings', icon: Settings2 },
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} data-testid={`tab-${t.id}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: activeTab === t.id ? 'rgba(224,78,53,0.15)' : 'transparent',
                      color: activeTab === t.id ? 'var(--cth-admin-accent)' : 'var(--cth-admin-ink-soft)',
                    }}>
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              {/* Preview Tab */}
              {activeTab === 'preview' && (
                <div className="rounded-2xl overflow-hidden border" style={{ background: 'var(--cth-admin-panel)', borderColor: 'var(--cth-admin-border)' }}>
                  <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--cth-admin-border)' }}>
                    <span className="text-xs cth-muted">Email Preview</span>
                    <span className="text-xs" style={{ color: 'var(--cth-admin-ruby)' }}>{previewData?.week_label}</span>
                  </div>
                  <iframe
                    ref={iframeRef}
                    data-testid="digest-preview-iframe"
                    title="Digest Preview"
                    className="w-full border-0"
                    style={{ height: 700, background: 'var(--cth-admin-bg)' }}
                  />
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="max-w-lg space-y-6">
                  <div className="rounded-2xl border p-6" style={{ background: 'var(--cth-admin-panel)', borderColor: 'var(--cth-admin-border)' }}>
                    <h3 className="text-sm font-semibold cth-heading mb-4">Digest Preferences</h3>

                    <Toggle testId="toggle-enabled" checked={prefs.enabled} onChange={v => update('enabled', v)} label="Enable Weekly Digest" />

                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="cth-label">Your Name</label>
                        <input data-testid="digest-name-input" value={prefs.user_name} onChange={e => update('user_name', e.target.value)}
                          placeholder="How should we greet you?"
                          className="cth-input w-full text-sm rounded-xl px-4 py-3" />
                      </div>

                      <div>
                        <label className="cth-label">Email Address</label>
                        <input data-testid="digest-email-input" type="email" value={prefs.email} onChange={e => update('email', e.target.value)}
                          placeholder="your@email.com"
                          className="cth-input w-full text-sm rounded-xl px-4 py-3" />
                      </div>

                      <div>
                        <label className="cth-label">Delivery Day</label>
                        <select data-testid="digest-day-select" value={prefs.day_of_week} onChange={e => update('day_of_week', e.target.value)}
                          className="cth-select w-full text-sm rounded-xl px-4 py-3">
                          {DAYS.map(d => (
                            <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border p-6" style={{ background: 'var(--cth-admin-panel)', borderColor: 'var(--cth-admin-border)' }}>
                    <h3 className="text-sm font-semibold cth-heading mb-2">Include in Digest</h3>
                    <p className="text-xs cth-muted mb-3">Choose which sections appear in your weekly email.</p>

                    <Toggle testId="toggle-events" checked={prefs.include_events} onChange={v => update('include_events', v)} label="Upcoming Events" />
                    <Toggle testId="toggle-blog" checked={prefs.include_blog} onChange={v => update('include_blog', v)} label="Blog Activity" />
                    <Toggle testId="toggle-crm" checked={prefs.include_crm} onChange={v => update('include_crm', v)} label="CRM Pipeline" />
                    <Toggle testId="toggle-usage" checked={prefs.include_usage} onChange={v => update('include_usage', v)} label="AI Usage Stats" />
                  </div>

                  <button data-testid="save-prefs-btn" onClick={savePrefs} disabled={saving}
                    className="cth-button-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                    >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
