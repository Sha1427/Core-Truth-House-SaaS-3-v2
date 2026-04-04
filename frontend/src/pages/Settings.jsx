import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUser } from '../hooks/useAuth';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  User, Instagram, Linkedin, Facebook, Twitter, Youtube, Globe,
  Save, Bell, CreditCard, Shield, ChevronRight, Check, Loader2,
  AtSign, Music, Link2, Building2
} from 'lucide-react';
import axios from 'axios';
import { usePlan } from '../context/PlanContext';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { IOSInstallInstructions } from '../pwa/PWAProvider';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function Settings() {
  const colors = useColors();
  const { user } = useUser();
  const { plan, isSuperAdmin } = usePlan();
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    website: '',
  });

  // Workspace/Brand name
  const [brandName, setBrandName] = useState('');
  const [brandNameSaving, setBrandNameSaving] = useState(false);

  const [socials, setSocials] = useState({
    instagram: '',
    linkedin: '',
    facebook: '',
    twitter: '',
    tiktok: '',
    youtube: '',
  });

  const [notifications, setNotifications] = useState({
    weekly_digest: true,
    billing_alerts: true,
    team_invites: true,
    ai_usage_alerts: true,
  });

  // Custom domain state
  const [domainData, setDomainData] = useState(null);
  const [domainInput, setDomainInput] = useState('');
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainLoading, setDomainLoading] = useState(false);
  const [dnsVerifying, setDnsVerifying] = useState(false);
  const [dnsResult, setDnsResult] = useState(null);

  const canUseDomain = isSuperAdmin || ['HOUSE', 'ESTATE'].includes(plan);

  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  useEffect(() => {
    // Load brand name when workspace changes
    if (activeWorkspace) {
      setBrandName(activeWorkspace.brand_name || activeWorkspace.name || '');
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeTab === 'domain' && canUseDomain) loadDomain();
  }, [activeTab]);

  const loadDomain = async () => {
    if (!user?.id) return;
    setDomainLoading(true);
    try {
      const res = await axios.get(`${API}/custom-domain?workspace_id=default&user_id=${user.id}`);
      if (res.data.domain) {
        setDomainData(res.data.domain);
        setDomainInput(res.data.domain.domain || '');
      }
    } catch {} finally { setDomainLoading(false); }
  };

  const saveDomain = async () => {
    if (!domainInput.trim()) return;
    setDomainSaving(true);
    try {
      await axios.post(`${API}/custom-domain`, {
        domain: domainInput.trim(),
        workspace_id: 'default',
        user_id: user?.id,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadDomain();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to save domain');
    } finally { setDomainSaving(false); }
  };

  const removeDomain = async () => {
    if (!window.confirm('Remove your custom domain?')) return;
    try {
      await axios.delete(`${API}/custom-domain?workspace_id=default&user_id=${user?.id}`);
      setDomainData(null);
      setDomainInput('');
      setDnsResult(null);
    } catch { alert('Failed to remove domain'); }
  };

  const verifyDns = async () => {
    setDnsVerifying(true);
    setDnsResult(null);
    try {
      const res = await axios.post(`${API}/custom-domain/verify?workspace_id=default&user_id=${user?.id}`);
      setDnsResult(res.data);
      loadDomain();
    } catch (e) {
      setDnsResult({ verified: false, error: e.response?.data?.detail || 'Verification failed' });
    } finally { setDnsVerifying(false); }
  };

  const loadSettings = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API}/settings?user_id=${user.id}`);
      if (res.data.profile) setProfile(res.data.profile);
      if (res.data.socials) setSocials(res.data.socials);
      if (res.data.notifications) setNotifications(res.data.notifications);
    } catch (e) { /* no settings yet */ }
    // Load brand name from active workspace
    if (activeWorkspace) {
      setBrandName(activeWorkspace.brand_name || activeWorkspace.name || '');
    }
  };

  const handleSaveBrandName = async () => {
    if (!activeWorkspace?.id || !brandName.trim()) return;
    setBrandNameSaving(true);
    try {
      await axios.put(`${API}/workspaces/${activeWorkspace.id}`, {
        brand_name: brandName.trim(),
      });
      await refreshWorkspaces();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save brand name:', e);
      alert('Failed to save brand name. Please try again.');
    } finally {
      setBrandNameSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/settings`, {
        user_id: user?.id,
        profile,
        socials,
        notifications,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Save settings failed', e);
    } finally {
      setSaving(false);
    }
  };

  const card = {
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  };

  const labelStyle = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: colors.textMuted, marginBottom: 6 };
  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    background: colors.darker, border: `1px solid ${colors.border}`,
    color: colors.textPrimary, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  const tabs = [
    { id: 'workspace', label: 'Workspace', icon: Building2 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'socials', label: 'Social Media', icon: Instagram },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    ...(canUseDomain ? [{ id: 'domain', label: 'Custom Domain', icon: Link2 }] : []),
    { id: 'team', label: 'Team', icon: Shield },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  ];

  const socialFields = [
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@yourbrand' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/yourname' },
    { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'facebook.com/yourpage' },
    { key: 'twitter', label: 'X (Twitter)', icon: Twitter, placeholder: '@yourhandle' },
    { key: 'tiktok', label: 'TikTok', icon: Music, placeholder: '@yourtiktok' },
    { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'youtube.com/@yourchannel' },
  ];

  return (
    <DashboardLayout>
      <TopBar title="Settings" subtitle="Manage your profile, social links, and preferences" />
      <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28, background: colors.darker, borderRadius: 14, padding: 6, border: `1px solid ${colors.border}` }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-testid={`settings-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '9px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                    background: active ? colors.cardBg : 'transparent',
                    color: active ? colors.textPrimary : colors.textMuted,
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Workspace Tab */}
          {activeTab === 'workspace' && (
            <div style={card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, marginBottom: 6 }}>Brand / Workspace Name</div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 20 }}>
                This name appears throughout the platform and in your exported materials.
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={labelStyle}>Brand Name</div>
                <input
                  data-testid="brand-name-input"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="Enter your brand name..."
                  style={inputStyle}
                />
              </div>

              <button
                data-testid="save-brand-name-btn"
                onClick={handleSaveBrandName}
                disabled={brandNameSaving || !brandName.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 10,
                  background: brandNameSaving || !brandName.trim() ? colors.darker : 'linear-gradient(135deg, #af0024, #e04e35)',
                  border: 'none',
                  color: brandNameSaving || !brandName.trim() ? colors.textMuted : '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: brandNameSaving || !brandName.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {brandNameSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {brandNameSaving ? 'Saving...' : 'Save Brand Name'}
              </button>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 8 }}>Current Workspace ID</div>
                <div style={{ ...inputStyle, background: colors.darker, color: colors.textMuted, fontFamily: 'monospace', fontSize: 11 }}>
                  {activeWorkspace?.id || '—'}
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${colors.border}`, flexShrink: 0, background: colors.darker, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {user?.imageUrl
                      ? <img src={user.imageUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <User size={28} style={{ color: colors.textMuted }} />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: colors.textPrimary }}>{user?.fullName || 'Your Name'}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{user?.primaryEmailAddress?.emailAddress}</div>
                    <a
                      href="https://accounts.clerk.dev/user"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 12, color: colors.cinnabar, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}
                    >
                      Update photo & name via Clerk →
                    </a>
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={labelStyle}>Clerk User ID</div>
                  <div style={{ ...inputStyle, background: colors.darker, color: colors.textMuted, fontFamily: 'monospace', fontSize: 12 }}>
                    {user?.id || '—'}
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={labelStyle}>Bio / Short Description</div>
                  <textarea
                    value={profile.bio}
                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="A short description of your brand or role..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <div>
                  <div style={labelStyle}>Website URL</div>
                  <div style={{ position: 'relative' }}>
                    <Globe size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
                    <input
                      value={profile.website}
                      onChange={e => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yourbrand.com"
                      style={{ ...inputStyle, paddingLeft: 34 }}
                    />
                  </div>
                </div>
              </div>

              {/* iOS Install Instructions */}
              <div className="mt-6">
                <IOSInstallInstructions />
              </div>
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === 'socials' && (
            <div style={card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, marginBottom: 6 }}>Social Media Handles</div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 20 }}>These are used in your Brand Kit Export and Content Studio context.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {socialFields.map(field => {
                  const Icon = field.icon;
                  return (
                    <div key={field.key}>
                      <div style={labelStyle}>{field.label}</div>
                      <div style={{ position: 'relative' }}>
                        <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
                        <input
                          data-testid={`social-${field.key}`}
                          value={socials[field.key]}
                          onChange={e => setSocials({ ...socials, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          style={{ ...inputStyle, paddingLeft: 34 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notifications Tab - Enhanced */}
          {activeTab === 'notifications' && (
            <div style={card}>
              <NotificationPreferences />
            </div>
          )}

          {/* Custom Domain Tab */}
          {activeTab === 'domain' && canUseDomain && (
            <div style={card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, marginBottom: 6 }}>Custom Domain</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>
                Map your own domain to your brand workspace. Available on The House and The Estate plans.
              </div>
              {domainLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: colors.cinnabar }} />
                </div>
              ) : (
                <>
                  {domainData && (
                    <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: colors.darker, border: `1px solid ${colors.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary }}>{domainData.domain}</div>
                          <div style={{ fontSize: 11, color: domainData.status === 'verified' ? '#22c55e' : domainData.status === 'failed' ? '#ef4444' : colors.textMuted, marginTop: 4 }}>
                            Status: {domainData.status === 'verified' ? 'Verified' : domainData.status === 'failed' ? 'DNS Verification Failed' : 'Pending Verification'}
                          </div>
                          {domainData.dns_error && domainData.status !== 'verified' && (
                            <div style={{ fontSize: 10, color: '#ef4444', marginTop: 2 }}>{domainData.dns_error}</div>
                          )}
                          {domainData.last_checked && (
                            <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                              Last checked: {new Date(domainData.last_checked).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {domainData.status !== 'verified' && (
                            <button
                              data-testid="verify-dns-btn"
                              onClick={verifyDns}
                              disabled={dnsVerifying}
                              style={{
                                fontSize: 11, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
                                color: 'white', fontWeight: 600,
                              }}
                            >
                              {dnsVerifying ? 'Checking...' : 'Verify DNS'}
                            </button>
                          )}
                          <button onClick={removeDomain} style={{ fontSize: 11, color: '#ef4444', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>Remove</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {dnsResult && (
                    <div style={{
                      marginBottom: 16, padding: 12, borderRadius: 10,
                      background: dnsResult.verified ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${dnsResult.verified ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: dnsResult.verified ? '#22c55e' : '#ef4444', marginBottom: 4 }}>
                        {dnsResult.verified ? 'DNS Verified Successfully!' : 'DNS Verification Failed'}
                      </div>
                      {dnsResult.error && (
                        <div style={{ fontSize: 11, color: colors.textMuted }}>{dnsResult.error}</div>
                      )}
                      {dnsResult.records && dnsResult.records.length > 0 && (
                        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                          Found records: {dnsResult.records.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={labelStyle}>Domain Name</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      data-testid="custom-domain-input"
                      value={domainInput}
                      onChange={e => setDomainInput(e.target.value)}
                      placeholder="yourbrand.com"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      data-testid="save-domain-btn"
                      onClick={saveDomain}
                      disabled={domainSaving || !domainInput.trim()}
                      style={{
                        padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
                        color: 'white', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                        opacity: !domainInput.trim() ? 0.5 : 1,
                      }}
                    >
                      {domainSaving ? 'Saving...' : 'Save Domain'}
                    </button>
                  </div>
                  <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: 'rgba(224,78,53,0.05)', border: '1px solid rgba(224,78,53,0.15)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: colors.cinnabar, marginBottom: 6 }}>DNS Configuration</div>
                    <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.6 }}>
                      Point your domain's DNS to our servers by adding a CNAME record:<br />
                      <code style={{ background: colors.darker, padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>CNAME yourbrand.com → app.coretruthhouse.com</code>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Team tab — redirect */}
          {activeTab === 'team' && (
            <div style={card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, marginBottom: 6 }}>Team Management</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Invite members, manage roles, and track team activity.</div>
              <Link
                to="/team"
                data-testid="go-to-team-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                  borderRadius: 12, background: `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
                  color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                }}
              >
                Go to Team Management <ChevronRight size={15} />
              </Link>
            </div>
          )}

          {/* Billing tab — redirect */}
          {activeTab === 'billing' && (
            <div style={card}>
              <div style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, marginBottom: 6 }}>Billing & Plan</div>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Manage your subscription, view invoices, and purchase credit top-ups.</div>
              <Link
                to="/billing"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                  borderRadius: 12, background: `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
                  color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600,
                }}
              >
                Go to Billing & Plans <ChevronRight size={15} />
              </Link>
            </div>
          )}

          {/* Save button */}
          {activeTab !== 'billing' && activeTab !== 'domain' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <button
                data-testid="settings-save-btn"
                onClick={handleSave}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                  borderRadius: 12, border: 'none', cursor: saving ? 'wait' : 'pointer',
                  background: saved ? '#2D6A4F' : `linear-gradient(135deg, ${colors.cinnabar}, ${colors.crimson})`,
                  color: 'white', fontSize: 13, fontWeight: 700, transition: 'background 0.3s',
                }}
              >
                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={15} /> : <Save size={15} />}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
              </button>
            </div>
          )}

        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}

