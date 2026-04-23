import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useUser } from '../hooks/useAuth';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  User,
  Instagram,
  Linkedin,
  Facebook,
  Twitter,
  Youtube,
  Globe,
  Save,
  Bell,
  CreditCard,
  Shield,
  ChevronRight,
  Check,
  Loader2,
  Music,
  Link2,
  Building2,
} from 'lucide-react';
import axios from 'axios';
import { usePlan } from '../context/PlanContext';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { IOSInstallInstructions } from '../pwa/PWAProvider';
import apiClient from "../lib/apiClient";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
};

export default function Settings() {
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
    if (activeWorkspace) {
      setBrandName(activeWorkspace.brand_name || activeWorkspace.name || '');
    }
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeTab === 'domain' && canUseDomain) loadDomain();
  }, [activeTab, canUseDomain]);

  useEffect(() => {
    const nextTab = searchParams.get('tab') || 'profile';
    setActiveTab(nextTab);
  }, [searchParams]);

  const loadDomain = async () => {
    if (!user?.id) return;
    setDomainLoading(true);

    try {
      const res = await apiClient.get("/custom-domain", { params: { workspace_id: "default", user_id: user.id } });
      if (res.data.domain) {
        setDomainData(res.data.domain);
        setDomainInput(res.data.domain.domain || '');
      }
    } catch {
      // Domain may not exist yet.
    } finally {
      setDomainLoading(false);
    }
  };

  const saveDomain = async () => {
    if (!domainInput.trim()) return;
    setDomainSaving(true);

    try {
      await apiClient.post("/custom-domain", {
        domain: domainInput.trim(),
        workspace_id: 'default',
        user_id: user?.id,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadDomain();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to save domain');
    } finally {
      setDomainSaving(false);
    }
  };

  const removeDomain = async () => {
    if (!window.confirm('Remove your custom domain?')) return;

    try {
      await axios.delete(`${API}/custom-domain?workspace_id=default&user_id=${user?.id}`);
      setDomainData(null);
      setDomainInput('');
      setDnsResult(null);
    } catch {
      alert('Failed to remove domain');
    }
  };

  const verifyDns = async () => {
    setDnsVerifying(true);
    setDnsResult(null);

    try {
      const res = await apiClient.post("/custom-domain/verify", {}, { params: { workspace_id: "default", user_id: user?.id } });
      setDnsResult(res.data);
      loadDomain();
    } catch (e) {
      setDnsResult({
        verified: false,
        error: e.response?.data?.detail || 'Verification failed',
      });
    } finally {
      setDnsVerifying(false);
    }
  };

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      const res = await apiClient.get("/settings", { params: { user_id: user.id } });
      if (res.data.profile) setProfile(res.data.profile);
      if (res.data.socials) setSocials(res.data.socials);
      if (res.data.notifications) setNotifications(res.data.notifications);
    } catch {
      // No settings yet.
    }

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
      await apiClient.post("/settings", {
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

  const statusColorClass = (value) => {
    if (value === 'verified') return 'cth-text-success';
    if (value === 'failed') return 'cth-text-danger';
    return 'cth-muted';
  };

  return (
    <DashboardLayout>
      <TopBar title="Settings" subtitle="Manage your profile, social links, and preferences" />

      <div className="cth-page flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
        <div className="mx-auto max-w-[760px]">
          <div className="cth-card-muted mb-7 flex gap-1 overflow-x-auto p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  data-testid={`settings-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-w-fit flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    active ? 'cth-card cth-heading' : 'cth-muted'
                  }`}
                  type="button"
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'workspace' && (
            <div className="cth-card mb-5 p-6">
              <div className="mb-1 text-[15px] font-bold cth-heading">Brand / Workspace Name</div>
              <div className="mb-5 text-xs cth-muted">
                This name appears throughout the platform and in your exported materials.
              </div>

              <div className="mb-5">
                <label className="cth-label">Brand Name</label>
                <input
                  data-testid="brand-name-input"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Enter your brand name..."
                  className="cth-input"
                  style={inputBase}
                />
              </div>

              <button
                data-testid="save-brand-name-btn"
                onClick={handleSaveBrandName}
                disabled={brandNameSaving || !brandName.trim()}
                className="cth-button-primary inline-flex items-center gap-2"
                type="button"
                style={{ opacity: brandNameSaving || !brandName.trim() ? 0.7 : 1 }}
              >
                {brandNameSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {brandNameSaving ? 'Saving...' : 'Save Brand Name'}
              </button>

              <div className="mt-6 border-t pt-5 cth-divider">
                <div className="mb-2 text-xs font-semibold cth-muted">Current Workspace ID</div>
                <div className="cth-card-muted font-mono text-xs cth-muted p-3">
                  {activeWorkspace?.id || '—'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <div className="cth-card mb-5 p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border cth-divider cth-card-muted">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User size={28} className="cth-muted" />
                    )}
                  </div>

                  <div>
                    <div className="text-[17px] font-bold cth-heading">{user?.fullName || 'Your Name'}</div>
                    <div className="text-sm cth-muted">{user?.primaryEmailAddress?.emailAddress}</div>
                    <a
                      href="https://accounts.clerk.dev/user"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs cth-text-accent"
                    >
                      Update photo & name via Clerk →
                    </a>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="cth-label">Clerk User ID</label>
                  <div className="cth-card-muted p-3 font-mono text-xs cth-muted">
                    {user?.id || '—'}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="cth-label">Bio / Short Description</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="A short description of your brand or role..."
                    rows={3}
                    className="cth-textarea"
                  />
                </div>

                <div>
                  <label className="cth-label">Website URL</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 cth-muted" />
                    <input
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yourbrand.com"
                      className="cth-input pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <IOSInstallInstructions />
              </div>
            </div>
          )}

          {activeTab === 'socials' && (
            <div className="cth-card mb-5 p-6">
              <div className="mb-1 text-[15px] font-bold cth-heading">Social Media Handles</div>
              <div className="mb-5 text-xs cth-muted">
                These are used in your Brand Kit Export and Content Studio context.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {socialFields.map((field) => {
                  const Icon = field.icon;

                  return (
                    <div key={field.key}>
                      <label className="cth-label">{field.label}</label>
                      <div className="relative">
                        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 cth-muted" />
                        <input
                          data-testid={`social-${field.key}`}
                          value={socials[field.key]}
                          onChange={(e) => setSocials({ ...socials, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          className="cth-input pl-9"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="cth-card mb-5 p-6">
              <NotificationPreferences />
            </div>
          )}

          {activeTab === 'domain' && canUseDomain && (
            <div className="cth-card mb-5 p-6">
              <div className="mb-1 text-[15px] font-bold cth-heading">Custom Domain</div>
              <div className="mb-5 text-sm cth-muted">
                Map your own domain to your brand workspace. Available on The House and The Estate plans.
              </div>

              {domainLoading ? (
                <div className="flex justify-center p-5">
                  <Loader2 size={20} className="animate-spin cth-text-accent" />
                </div>
              ) : (
                <>
                  {domainData && (
                    <div className="cth-card-muted mb-4 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold cth-heading">{domainData.domain}</div>
                          <div className={`mt-1 text-xs ${statusColorClass(domainData.status)}`}>
                            Status:{' '}
                            {domainData.status === 'verified'
                              ? 'Verified'
                              : domainData.status === 'failed'
                                ? 'DNS Verification Failed'
                                : 'Pending Verification'}
                          </div>

                          {domainData.dns_error && domainData.status !== 'verified' && (
                            <div className="mt-1 text-[10px] cth-text-danger">{domainData.dns_error}</div>
                          )}

                          {domainData.last_checked && (
                            <div className="mt-1 text-[10px] cth-muted">
                              Last checked: {new Date(domainData.last_checked).toLocaleString()}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          {domainData.status !== 'verified' && (
                            <button
                              data-testid="verify-dns-btn"
                              onClick={verifyDns}
                              disabled={dnsVerifying}
                              className="cth-button-primary px-3 py-1.5 text-xs"
                              type="button"
                            >
                              {dnsVerifying ? 'Checking...' : 'Verify DNS'}
                            </button>
                          )}

                          <button
                            onClick={removeDomain}
                            className="cth-button-ghost px-3 py-1.5 text-xs"
                            style={{ color: 'var(--cth-danger)' }}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {dnsResult && (
                    <div
                      className={`cth-card mb-4 p-3 text-sm ${
                        dnsResult.verified ? 'cth-text-success' : 'cth-text-danger'
                      }`}
                      style={{
                        background: dnsResult.verified
                          ? 'color-mix(in srgb, var(--cth-success) 10%, var(--cth-app-panel))'
                          : 'color-mix(in srgb, var(--cth-danger) 10%, var(--cth-app-panel))',
                        borderColor: dnsResult.verified
                          ? 'color-mix(in srgb, var(--cth-success) 25%, var(--cth-app-border))'
                          : 'color-mix(in srgb, var(--cth-danger) 25%, var(--cth-app-border))',
                      }}
                    >
                      <div className="mb-1 text-xs font-bold">
                        {dnsResult.verified ? 'DNS Verified Successfully!' : 'DNS Verification Failed'}
                      </div>

                      {dnsResult.error && <div className="text-xs cth-muted">{dnsResult.error}</div>}

                      {dnsResult.records && dnsResult.records.length > 0 && (
                        <div className="mt-1 text-xs cth-muted">
                          Found records: {dnsResult.records.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  <label className="cth-label">Domain Name</label>
                  <div className="flex gap-2">
                    <input
                      data-testid="custom-domain-input"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      placeholder="yourbrand.com"
                      className="cth-input flex-1"
                    />

                    <button
                      data-testid="save-domain-btn"
                      onClick={saveDomain}
                      disabled={domainSaving || !domainInput.trim()}
                      className="cth-button-primary whitespace-nowrap"
                      type="button"
                      style={{ opacity: !domainInput.trim() ? 0.7 : 1 }}
                    >
                      {domainSaving ? 'Saving...' : 'Save Domain'}
                    </button>
                  </div>

                  <div
                    className="mt-4 rounded-xl p-4"
                    style={{
                      background: 'rgba(224,78,53,0.06)',
                      border: '1px solid rgba(224,78,53,0.16)',
                    }}
                  >
                    <div className="mb-1.5 text-xs font-bold cth-text-accent">DNS Configuration</div>
                    <div className="text-xs leading-relaxed cth-muted">
                      Point your domain&apos;s DNS to our servers by adding a CNAME record:
                      <br />
                      <code className="cth-card-muted mt-1 inline-block rounded px-2 py-1 text-[11px]">
                        CNAME yourbrand.com → app.coretruthhouse.com
                      </code>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="cth-card mb-5 p-6">
              <div className="mb-1 text-[15px] font-bold cth-heading">Team Management</div>
              <div className="mb-5 text-sm cth-muted">
                Invite members, manage roles, and track team activity.
              </div>

              <Link
                to="/team"
                data-testid="go-to-team-btn"
                className="cth-button-primary inline-flex items-center gap-2"
              >
                Go to Team Management <ChevronRight size={15} />
              </Link>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="cth-card mb-5 p-6">
              <div className="mb-1 text-[15px] font-bold cth-heading">Billing & Plan</div>
              <div className="mb-5 text-sm cth-muted">
                Manage your subscription, view invoices, and purchase credit top-ups.
              </div>

              <Link
                to="/billing"
                className="cth-button-primary inline-flex items-center gap-2"
              >
                Go to Billing & Plans <ChevronRight size={15} />
              </Link>
            </div>
          )}

          {activeTab !== 'billing' && activeTab !== 'domain' && (
            <div className="flex justify-end pt-2">
              <button
                data-testid="settings-save-btn"
                onClick={handleSave}
                disabled={saving}
                className="cth-button-primary inline-flex items-center gap-2"
                type="button"
                style={{
                  background: saved ? 'var(--cth-success)' : 'var(--cth-app-accent)',
                  borderColor: saved ? 'var(--cth-success)' : 'var(--cth-app-accent)',
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                {saving ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : saved ? (
                  <Check size={15} />
                ) : (
                  <Save size={15} />
                )}
                {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
