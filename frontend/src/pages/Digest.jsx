import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../hooks/useAuth';
import axios from 'axios';
import { DashboardLayout } from '../components/Layout';
import {
  Mail, Eye, Send, Loader2, Check, Settings2, CalendarDays, PenLine, Target, BarChart3
} from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function Toggle({ checked, onChange, label, testId }) {
  return (
    <label data-testid={testId} className="flex items-center justify-between py-3 cursor-pointer group">
      <span className="text-sm text-[#c7a09d] group-hover:text-white transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors"
        style={{ background: checked ? '#e04e35' : 'rgba(255,255,255,0.1)' }}
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
        axios.get(`${API}/api/digest/preferences?user_id=${userId}`),
        axios.get(`${API}/api/digest/preview?user_id=${userId}`),
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
      const res = await axios.post(`${API}/api/digest/send?user_id=${userId}`, {});
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
    { label: 'Pipeline', value: `$${(previewData.pipeline_value || 0).toLocaleString()}`, icon: Target, color: '#e04e35' },
    { label: 'Contacts', value: previewData.total_contacts || 0, icon: Mail, color: '#22c55e' },
    { label: 'Deals', value: previewData.total_deals || 0, icon: BarChart3, color: '#763b5b' },
    { label: 'Events', value: (previewData.upcoming_events || []).length, icon: CalendarDays, color: '#c7a09d' },
    { label: 'Posts', value: (previewData.recent_posts || []).length, icon: PenLine, color: '#fbbf24' },
  ] : [];

  return (
    <DashboardLayout>
      <div data-testid="digest-page" className="flex-1 overflow-y-auto" style={{ background: '#1c0828' }}>
        {/* Header */}
        <div className="border-b border-white/5 bg-[#1c0828]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 py-4 md:px-6 md:py-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1 pl-10 md:pl-0">
                <h1 className="font-bold text-white text-lg md:text-xl flex items-center gap-2">
                  <Mail size={20} className="text-[#e04e35] flex-shrink-0" /> Weekly Digest
                </h1>
                <p className="text-xs text-[#4a3550] mt-0.5">
                  {prefs.enabled ? `Enabled — ${prefs.day_of_week}s` : 'Disabled — enable below'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button data-testid="send-digest-btn" onClick={sendNow} disabled={sending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #e04e35, #af0024)', boxShadow: '0 4px 16px rgba(224,78,53,0.3)' }}>
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
                  color: sendResult.ok ? '#4ade80' : '#f87171',
                }}>
                {sendResult.msg}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-5 md:px-6 md:py-8">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={32} className="mx-auto animate-spin text-[#e04e35]" />
              <p className="text-[#4a3550] mt-3 text-sm">Loading digest...</p>
            </div>
          ) : (
            <>
              {/* Stats row */}
              {statCards.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                  {statCards.map(s => (
                    <div key={s.label} className="rounded-xl p-4 text-center"
                      style={{ background: 'rgba(26,0,32,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <s.icon size={16} className="mx-auto mb-1.5" style={{ color: s.color }} />
                      <div className="text-lg font-bold text-white">{s.value}</div>
                      <div className="text-xs text-[#4a3550]">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[#2b1040] border border-white/5 w-fit">
                {[
                  { id: 'preview', label: 'Preview', icon: Eye },
                  { id: 'settings', label: 'Settings', icon: Settings2 },
                ].map(t => (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} data-testid={`tab-${t.id}`}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: activeTab === t.id ? 'rgba(224,78,53,0.15)' : 'transparent',
                      color: activeTab === t.id ? '#e04e35' : '#4a3550',
                    }}>
                    <t.icon size={14} /> {t.label}
                  </button>
                ))}
              </div>

              {/* Preview Tab */}
              {activeTab === 'preview' && (
                <div className="rounded-2xl overflow-hidden border border-white/5" style={{ background: '#2b1040' }}>
                  <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-[#4a3550]">Email Preview</span>
                    <span className="text-xs text-[#763b5b]">{previewData?.week_label}</span>
                  </div>
                  <iframe
                    ref={iframeRef}
                    data-testid="digest-preview-iframe"
                    title="Digest Preview"
                    className="w-full border-0"
                    style={{ height: 700, background: '#1c0828' }}
                  />
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="max-w-lg space-y-6">
                  <div className="rounded-2xl border border-white/5 p-6" style={{ background: '#2b1040' }}>
                    <h3 className="text-sm font-semibold text-white mb-4">Digest Preferences</h3>

                    <Toggle testId="toggle-enabled" checked={prefs.enabled} onChange={v => update('enabled', v)} label="Enable Weekly Digest" />

                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-xs text-[#763b5b] font-medium uppercase tracking-widest mb-1.5 block">Your Name</label>
                        <input data-testid="digest-name-input" value={prefs.user_name} onChange={e => update('user_name', e.target.value)}
                          placeholder="How should we greet you?"
                          className="w-full text-sm rounded-xl px-4 py-3 border border-white/10 bg-[#1c0828] text-white placeholder-[#4a3550] focus:outline-none focus:border-[rgba(224,78,53,0.4)]" />
                      </div>

                      <div>
                        <label className="text-xs text-[#763b5b] font-medium uppercase tracking-widest mb-1.5 block">Email Address</label>
                        <input data-testid="digest-email-input" type="email" value={prefs.email} onChange={e => update('email', e.target.value)}
                          placeholder="your@email.com"
                          className="w-full text-sm rounded-xl px-4 py-3 border border-white/10 bg-[#1c0828] text-white placeholder-[#4a3550] focus:outline-none focus:border-[rgba(224,78,53,0.4)]" />
                      </div>

                      <div>
                        <label className="text-xs text-[#763b5b] font-medium uppercase tracking-widest mb-1.5 block">Delivery Day</label>
                        <select data-testid="digest-day-select" value={prefs.day_of_week} onChange={e => update('day_of_week', e.target.value)}
                          className="w-full text-sm rounded-xl px-4 py-3 border border-white/10 bg-[#1c0828] text-white focus:outline-none">
                          {DAYS.map(d => (
                            <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/5 p-6" style={{ background: '#2b1040' }}>
                    <h3 className="text-sm font-semibold text-white mb-2">Include in Digest</h3>
                    <p className="text-xs text-[#4a3550] mb-3">Choose which sections appear in your weekly email.</p>

                    <Toggle testId="toggle-events" checked={prefs.include_events} onChange={v => update('include_events', v)} label="Upcoming Events" />
                    <Toggle testId="toggle-blog" checked={prefs.include_blog} onChange={v => update('include_blog', v)} label="Blog Activity" />
                    <Toggle testId="toggle-crm" checked={prefs.include_crm} onChange={v => update('include_crm', v)} label="CRM Pipeline" />
                    <Toggle testId="toggle-usage" checked={prefs.include_usage} onChange={v => update('include_usage', v)} label="AI Usage Stats" />
                  </div>

                  <button data-testid="save-prefs-btn" onClick={savePrefs} disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #e04e35, #af0024)' }}>
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
