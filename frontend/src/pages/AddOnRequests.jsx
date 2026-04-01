import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useAuth';
import axios from 'axios';
import { DashboardLayout } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import { Package, Plus, Clock, CheckCircle, X, Send } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

export default function AddOnRequests() {
  const colors = useColors();
  const { user } = useUser();
  const userId = user?.id || 'default';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'feature' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/addon-requests`);
      // Filter to show only this user's requests
      const mine = (res.data.requests || []).filter(r => r.user_id === userId);
      setRequests(mine);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [userId]);

  const submitRequest = async () => {
    if (!form.title || !form.description) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/admin/addon-requests?user_id=${userId}`, form);
      setForm({ title: '', description: '', category: 'feature' });
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      alert('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    pending: { color: '#9ca3af', icon: Clock, label: 'Pending' },
    under_review: { color: '#f59e0b', icon: Clock, label: 'Under Review' },
    approved: { color: '#22c55e', icon: CheckCircle, label: 'Approved' },
    denied: { color: '#ef4444', icon: X, label: 'Denied' },
    completed: { color: '#3b82f6', icon: CheckCircle, label: 'Completed' },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="addon-requests-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Package size={28} style={{ color: colors.cinnabar }} />
              Add-on Requests
            </h1>
            <p style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>
              Request additional features or services from your admin
            </p>
          </div>
          <button
            data-testid="new-request-btn"
            onClick={() => setShowForm(!showForm)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 12,
              background: 'linear-gradient(135deg, #af0024, #e04e35)',
              border: 'none', color: 'white', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            New Request
          </button>
        </div>

        {showForm && (
          <div style={{
            padding: 24, borderRadius: 16,
            background: colors.darker, border: `1px solid ${colors.cinnabar}33`,
          }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>What do you need?</label>
              <input
                type="text"
                placeholder="e.g., Custom analytics dashboard"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                data-testid="request-title-input"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  background: `${colors.tuscany}08`, border: `1px solid ${colors.border}`,
                  color: colors.textPrimary, fontSize: 14,
                }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>Describe your request</label>
              <textarea
                placeholder="Provide as much detail as possible..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                data-testid="request-description-input"
                rows={4}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  background: `${colors.tuscany}08`, border: `1px solid ${colors.border}`,
                  color: colors.textPrimary, fontSize: 14, resize: 'vertical',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['feature', 'integration', 'support', 'other'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setForm({...form, category: cat})}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12,
                    border: form.category === cat ? `1px solid ${colors.cinnabar}` : `1px solid ${colors.border}`,
                    background: form.category === cat ? `${colors.cinnabar}22` : 'transparent',
                    color: form.category === cat ? colors.cinnabar : colors.textMuted,
                    cursor: 'pointer', textTransform: 'capitalize',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                data-testid="submit-request-btn"
                onClick={submitRequest}
                disabled={submitting || !form.title || !form.description}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 20px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #af0024, #e04e35)',
                  border: 'none', color: 'white', fontSize: 14, fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                <Send size={14} />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button onClick={() => setShowForm(false)} style={{
                padding: '12px 20px', borderRadius: 10, background: 'transparent',
                border: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: 14, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: colors.textMuted }}>Loading...</div>
        ) : requests.length === 0 && !showForm ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <Package size={48} style={{ color: colors.textMuted, margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontSize: 16, color: colors.textPrimary, fontWeight: 600, marginBottom: 8 }}>No requests yet</p>
            <p style={{ fontSize: 14, color: colors.textMuted }}>Need something extra? Submit a request above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map(req => {
              const status = statusConfig[req.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <div
                  key={req.id}
                  data-testid={`request-${req.id}`}
                  style={{
                    padding: 20, borderRadius: 14,
                    background: colors.darker, border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>{req.title}</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: `${status.color}20`, color: status.color,
                        }}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>{req.description}</p>
                      {req.admin_notes && (
                        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: `${colors.tuscany}08`, border: `1px solid ${colors.tuscany}15` }}>
                          <span style={{ fontSize: 11, color: colors.tuscany, fontWeight: 600 }}>Admin Response:</span>
                          <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{req.admin_notes}</p>
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: colors.textMuted, whiteSpace: 'nowrap' }}>
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
