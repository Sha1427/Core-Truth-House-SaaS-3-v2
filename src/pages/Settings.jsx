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
  CheckCircle,
  XCircle,
  Loader2,
  Music,
  Link2,
  Building2,
  Mail,
} from 'lucide-react';
import axios from 'axios';
import { usePlan } from '../context/PlanContext';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { IOSInstallInstructions } from '../pwa/PWAProvider';
import apiClient from "../lib/apiClient";
import MailIntegrationsSettings from "../components/mail/MailIntegrationsSettings";
import SocialConnectionsSection from "../components/SocialConnectionsSection";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";
const MONO = "'DM Mono', ui-monospace, 'SF Mono', Menlo, monospace";

const PAGE_STYLE = {
  background: 'var(--cth-command-blush)',
  minHeight: '100vh',
};

const CARD_STYLE = {
  background: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
};

const SECTION_LABEL_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  margin: 0,
};

const SECTION_HEADING_STYLE = {
  fontFamily: SERIF,
  fontSize: 22,
  fontWeight: 600,
  color: 'var(--cth-command-ink)',
  margin: 0,
  letterSpacing: '-0.005em',
  lineHeight: 1.25,
};

const SUBHEAD_STYLE = {
  fontFamily: SERIF,
  fontSize: 17,
  fontWeight: 600,
  color: 'var(--cth-command-ink)',
  margin: 0,
  letterSpacing: '-0.005em',
  lineHeight: 1.3,
};

const BODY_STYLE = {
  fontFamily: SANS,
  fontSize: 13,
  lineHeight: 1.6,
  color: 'var(--cth-command-ink)',
  margin: 0,
};

const MUTED_STYLE = {
  fontFamily: SANS,
  fontSize: 12,
  lineHeight: 1.55,
  color: 'var(--cth-command-muted)',
  margin: 0,
};

const FIELD_LABEL_STYLE = {
  display: 'block',
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  color: 'var(--cth-command-ink)',
  marginBottom: 6,
};

const INPUT_STYLE = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'var(--cth-command-panel)',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
  padding: '9px 12px',
  fontFamily: SANS,
  fontSize: 13,
  outline: 'none',
};

const TEXTAREA_STYLE = {
  ...INPUT_STYLE,
  padding: '10px 12px',
  lineHeight: 1.55,
  resize: 'vertical',
};

const PRIMARY_CTA_STYLE = {
  background: 'var(--cth-command-purple)',
  color: 'var(--cth-command-gold)',
  border: 'none',
  borderRadius: 4,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const PRIMARY_CTA_SMALL_STYLE = {
  ...PRIMARY_CTA_STYLE,
  padding: '6px 12px',
  fontSize: 11,
};

const SECONDARY_BUTTON_STYLE = {
  background: 'transparent',
  color: 'var(--cth-command-ink)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const DESTRUCTIVE_BUTTON_STYLE = {
  background: 'var(--cth-command-crimson)',
  color: 'var(--cth-command-ivory)',
  border: 'none',
  borderRadius: 4,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
};

const DESTRUCTIVE_BUTTON_SMALL_STYLE = {
  ...DESTRUCTIVE_BUTTON_STYLE,
  padding: '6px 12px',
  fontSize: 11,
};

function statusColor(value) {
  if (value === 'verified') return 'var(--cth-status-success-bright)';
  if (value === 'failed') return 'var(--cth-danger)';
  return 'var(--cth-command-muted)';
}

function Modal({ open, onClose, children, ariaLabel }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(13, 0, 16, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          ...CARD_STYLE,
          width: '100%',
          maxWidth: 480,
          padding: 28,
        }}
      >
        {children}
      </div>
    </div>
  );
}

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

  const [confirmRenameOpen, setConfirmRenameOpen] = useState(false);
  const [confirmRemoveDomainOpen, setConfirmRemoveDomainOpen] = useState(false);

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

  const requestRemoveDomain = () => {
    setConfirmRemoveDomainOpen(true);
  };

  const performRemoveDomain = async () => {
    setConfirmRemoveDomainOpen(false);
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

  const requestSaveBrandName = () => {
    if (!activeWorkspace?.id || !brandName.trim()) return;
    setConfirmRenameOpen(true);
  };

  const performSaveBrandName = async () => {
    setConfirmRenameOpen(false);
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
    { id: 'mail', label: 'Mail Integrations', icon: Mail },
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

  const sidebar = (
    <aside
      className="md:sticky md:top-4 md:self-start"
      style={{
        background: 'var(--cth-command-purple)',
        borderRadius: 4,
        border: '1px solid var(--cth-command-border)',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <nav style={{ padding: '12px 0' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              data-testid={`settings-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: active
                  ? 'color-mix(in srgb, var(--cth-command-ivory) 8%, var(--cth-command-purple))'
                  : 'transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderLeft: `3px solid ${active ? 'var(--cth-command-crimson)' : 'transparent'}`,
                padding: '10px 16px',
                fontFamily: SANS,
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active
                  ? 'var(--cth-command-ivory)'
                  : 'color-mix(in srgb, var(--cth-command-ivory) 78%, var(--cth-command-purple))',
                textAlign: 'left',
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <DashboardLayout>
      <TopBar title="Settings" subtitle="Manage your profile, social links, and preferences" />

      <div
        className="flex-1 overflow-auto px-4 py-7 md:px-8"
        style={PAGE_STYLE}
        data-testid="settings-page"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-5 md:flex-row md:gap-6">
            <div className="md:w-[220px] md:shrink-0">{sidebar}</div>

            <main className="min-w-0 flex-1">
              {activeTab === 'workspace' && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <h2 style={SECTION_HEADING_STYLE}>Brand / Workspace Name</h2>
                  <p style={{ ...MUTED_STYLE, marginTop: 8, marginBottom: 20 }}>
                    This name appears throughout the platform and in your exported materials.
                  </p>

                  <div className="mb-5">
                    <label style={FIELD_LABEL_STYLE}>Brand Name</label>
                    <input
                      data-testid="brand-name-input"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Enter your brand name..."
                      style={INPUT_STYLE}
                    />
                  </div>

                  <button
                    data-testid="save-brand-name-btn"
                    onClick={requestSaveBrandName}
                    disabled={brandNameSaving || !brandName.trim()}
                    type="button"
                    style={{
                      ...PRIMARY_CTA_STYLE,
                      opacity: brandNameSaving || !brandName.trim() ? 0.65 : 1,
                      cursor: brandNameSaving || !brandName.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {brandNameSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {brandNameSaving ? 'Saving...' : 'Save Brand Name'}
                  </button>

                  <div
                    className="mt-6 pt-5"
                    style={{ borderTop: '1px solid var(--cth-command-border)' }}
                  >
                    <p style={{ ...SECTION_LABEL_STYLE, marginBottom: 8 }}>Current Workspace ID</p>
                    <div
                      style={{
                        ...CARD_STYLE,
                        background: 'var(--cth-command-panel-soft)',
                        padding: 12,
                        fontFamily: MONO,
                        fontSize: 12,
                        color: 'var(--cth-command-muted)',
                      }}
                    >
                      {activeWorkspace?.id || ', '}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div>
                  <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                    <div className="mb-6 flex items-center gap-4">
                      <div
                        className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full"
                        style={{
                          background: 'var(--cth-command-panel-soft)',
                          border: '1px solid var(--cth-command-border)',
                        }}
                      >
                        {user?.imageUrl ? (
                          <img src={user.imageUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <User size={28} style={{ color: 'var(--cth-command-muted)' }} />
                        )}
                      </div>

                      <div>
                        <div
                          style={{
                            fontFamily: SERIF,
                            fontSize: 18,
                            fontWeight: 600,
                            color: 'var(--cth-command-ink)',
                            letterSpacing: '-0.005em',
                          }}
                        >
                          {user?.fullName || 'Your Name'}
                        </div>
                        <div style={{ ...MUTED_STYLE, marginTop: 2, fontSize: 13 }}>
                          {user?.primaryEmailAddress?.emailAddress}
                        </div>
                        <a
                          href="https://accounts.clerk.dev/user"
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-block',
                            marginTop: 6,
                            fontFamily: SANS,
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--cth-command-crimson)',
                            textDecoration: 'none',
                          }}
                        >
                          Update photo & name via Clerk →
                        </a>
                      </div>
                    </div>

                    <div className="mb-5">
                      <label style={FIELD_LABEL_STYLE}>Clerk User ID</label>
                      <div
                        style={{
                          ...CARD_STYLE,
                          background: 'var(--cth-command-panel-soft)',
                          padding: 12,
                          fontFamily: MONO,
                          fontSize: 12,
                          color: 'var(--cth-command-muted)',
                        }}
                      >
                        {user?.id || ', '}
                      </div>
                    </div>

                    <div className="mb-5">
                      <label style={FIELD_LABEL_STYLE}>Bio / Short Description</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder="A short description of your brand or role..."
                        rows={3}
                        style={TEXTAREA_STYLE}
                      />
                    </div>

                    <div>
                      <label style={FIELD_LABEL_STYLE}>Website URL</label>
                      <div className="relative">
                        <Globe
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: 'var(--cth-command-muted)' }}
                        />
                        <input
                          value={profile.website}
                          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                          placeholder="https://yourbrand.com"
                          style={{ ...INPUT_STYLE, paddingLeft: 36 }}
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
                <>
                  <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                    <SocialConnectionsSection />
                  </div>

                  <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                    <h2 style={SECTION_HEADING_STYLE}>Social Media Handles</h2>
                    <p style={{ ...MUTED_STYLE, marginTop: 8, marginBottom: 20 }}>
                      These are used in your Brand Kit Export and Content Studio context.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      {socialFields.map((field) => {
                        const Icon = field.icon;

                        return (
                          <div key={field.key}>
                            <label style={FIELD_LABEL_STYLE}>{field.label}</label>
                            <div className="relative">
                              <Icon
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--cth-command-muted)' }}
                              />
                              <input
                                data-testid={`social-${field.key}`}
                                value={socials[field.key]}
                                onChange={(e) => setSocials({ ...socials, [field.key]: e.target.value })}
                                placeholder={field.placeholder}
                                style={{ ...INPUT_STYLE, paddingLeft: 36 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'notifications' && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <NotificationPreferences />
                </div>
              )}

              {activeTab === 'mail' && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <MailIntegrationsSettings />
                </div>
              )}

              {activeTab === 'domain' && canUseDomain && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <h2 style={SECTION_HEADING_STYLE}>Custom Domain</h2>
                  <p style={{ ...MUTED_STYLE, marginTop: 8, marginBottom: 20 }}>
                    Map your own domain to your brand workspace. Available on The House and The Estate plans.
                  </p>

                  {domainLoading ? (
                    <div className="flex justify-center p-5">
                      <Loader2
                        size={20}
                        className="animate-spin"
                        style={{ color: 'var(--cth-command-crimson)' }}
                      />
                    </div>
                  ) : (
                    <>
                      {domainData && (
                        <div
                          className="mb-4"
                          style={{
                            ...CARD_STYLE,
                            background: 'var(--cth-command-panel-soft)',
                            padding: 16,
                          }}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div
                                style={{
                                  fontFamily: SANS,
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: 'var(--cth-command-ink)',
                                }}
                              >
                                {domainData.domain}
                              </div>
                              <div
                                style={{
                                  fontFamily: SANS,
                                  fontSize: 11,
                                  marginTop: 6,
                                  color: statusColor(domainData.status),
                                }}
                              >
                                Status:{' '}
                                {domainData.status === 'verified'
                                  ? 'Verified'
                                  : domainData.status === 'failed'
                                  ? 'DNS Verification Failed'
                                  : 'Pending Verification'}
                              </div>

                              {domainData.dns_error && domainData.status !== 'verified' && (
                                <div
                                  style={{
                                    marginTop: 6,
                                    fontFamily: SANS,
                                    fontSize: 10,
                                    color: 'var(--cth-danger)',
                                  }}
                                >
                                  {domainData.dns_error}
                                </div>
                              )}

                              {domainData.last_checked && (
                                <div style={{ ...MUTED_STYLE, marginTop: 6, fontSize: 10 }}>
                                  Last checked: {new Date(domainData.last_checked).toLocaleString()}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {domainData.status !== 'verified' && (
                                <button
                                  data-testid="verify-dns-btn"
                                  onClick={verifyDns}
                                  disabled={dnsVerifying}
                                  type="button"
                                  style={{
                                    ...PRIMARY_CTA_SMALL_STYLE,
                                    opacity: dnsVerifying ? 0.65 : 1,
                                    cursor: dnsVerifying ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {dnsVerifying ? 'Checking...' : 'Verify DNS'}
                                </button>
                              )}

                              <button
                                onClick={requestRemoveDomain}
                                type="button"
                                style={DESTRUCTIVE_BUTTON_SMALL_STYLE}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <label style={FIELD_LABEL_STYLE}>Domain Name</label>
                      <div className="flex gap-2">
                        <input
                          data-testid="custom-domain-input"
                          value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value)}
                          placeholder="yourbrand.com"
                          style={{ ...INPUT_STYLE, flex: 1 }}
                        />

                        <button
                          data-testid="save-domain-btn"
                          onClick={saveDomain}
                          disabled={domainSaving || !domainInput.trim()}
                          type="button"
                          style={{
                            ...PRIMARY_CTA_STYLE,
                            whiteSpace: 'nowrap',
                            opacity: !domainInput.trim() ? 0.65 : 1,
                            cursor: !domainInput.trim() ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {domainSaving ? 'Saving...' : 'Save Domain'}
                        </button>
                      </div>

                      <div
                        className="mt-4"
                        style={{
                          ...CARD_STYLE,
                          background: 'color-mix(in srgb, var(--cth-command-crimson) 6%, var(--cth-command-panel))',
                          borderColor: 'color-mix(in srgb, var(--cth-command-crimson) 25%, var(--cth-command-border))',
                          padding: 16,
                        }}
                      >
                        <div
                          style={{
                            ...SECTION_LABEL_STYLE,
                            color: 'var(--cth-command-crimson)',
                          }}
                        >
                          DNS Configuration
                        </div>
                        <div style={{ ...MUTED_STYLE, marginTop: 8, fontSize: 12 }}>
                          Point your domain&apos;s DNS to our servers by adding a CNAME record:
                          <br />
                          <code
                            style={{
                              display: 'inline-block',
                              marginTop: 6,
                              background: 'var(--cth-command-panel-soft)',
                              border: '1px solid var(--cth-command-border)',
                              borderRadius: 4,
                              padding: '4px 8px',
                              fontFamily: MONO,
                              fontSize: 11,
                              color: 'var(--cth-command-ink)',
                            }}
                          >
                            CNAME yourbrand.com → app.coretruthhouse.com
                          </code>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'team' && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <h2 style={SECTION_HEADING_STYLE}>Team Management</h2>
                  <p style={{ ...MUTED_STYLE, marginTop: 8, marginBottom: 20 }}>
                    Invite members, manage roles, and track team activity.
                  </p>

                  <Link to="/team" data-testid="go-to-team-btn" style={PRIMARY_CTA_STYLE}>
                    Go to Team Management <ChevronRight size={15} />
                  </Link>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="mb-5" style={{ ...CARD_STYLE, padding: 24 }}>
                  <h2 style={SECTION_HEADING_STYLE}>Billing & Plan</h2>
                  <p style={{ ...MUTED_STYLE, marginTop: 8, marginBottom: 20 }}>
                    Manage your subscription, view invoices, and purchase credit top-ups.
                  </p>

                  <Link to="/billing" style={PRIMARY_CTA_STYLE}>
                    Go to Billing & Plans <ChevronRight size={15} />
                  </Link>
                </div>
              )}

              {activeTab !== 'billing' &&
                activeTab !== 'domain' &&
                activeTab !== 'mail' && (
                  <div className="flex justify-end pt-2">
                    <button
                      data-testid="settings-save-btn"
                      onClick={handleSave}
                      disabled={saving}
                      type="button"
                      style={{
                        ...PRIMARY_CTA_STYLE,
                        background: saved
                          ? 'var(--cth-status-success-bright)'
                          : 'var(--cth-command-purple)',
                        color: saved ? 'var(--cth-command-ivory)' : 'var(--cth-command-gold)',
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
                      {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
                    </button>
                  </div>
                )}
            </main>
          </div>
        </div>
      </div>

      {/* Modals */}

      <Modal
        open={confirmRenameOpen}
        onClose={() => setConfirmRenameOpen(false)}
        ariaLabel="Rename Workspace"
      >
        <h2 style={SECTION_HEADING_STYLE}>Rename Workspace</h2>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            color: 'var(--cth-command-muted)',
            margin: '12px 0 24px',
            lineHeight: 1.6,
          }}
        >
          Renaming your workspace will update it across the platform. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmRenameOpen(false)}
            style={SECONDARY_BUTTON_STYLE}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-rename-btn"
            onClick={performSaveBrandName}
            style={DESTRUCTIVE_BUTTON_STYLE}
          >
            Confirm Rename
          </button>
        </div>
      </Modal>

      <Modal
        open={confirmRemoveDomainOpen}
        onClose={() => setConfirmRemoveDomainOpen(false)}
        ariaLabel="Remove Custom Domain"
      >
        <h2 style={SECTION_HEADING_STYLE}>Remove Custom Domain</h2>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            color: 'var(--cth-command-muted)',
            margin: '12px 0 24px',
            lineHeight: 1.6,
          }}
        >
          Are you sure you want to remove this domain? Your workspace will revert to the default URL.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmRemoveDomainOpen(false)}
            style={SECONDARY_BUTTON_STYLE}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="confirm-remove-domain-btn"
            onClick={performRemoveDomain}
            style={DESTRUCTIVE_BUTTON_STYLE}
          >
            Remove Domain
          </button>
        </div>
      </Modal>

      <Modal
        open={!!dnsResult}
        onClose={() => setDnsResult(null)}
        ariaLabel="DNS Verification Result"
      >
        <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
          {dnsResult?.verified ? (
            <CheckCircle size={32} style={{ color: 'var(--cth-status-success-bright)' }} />
          ) : (
            <XCircle size={32} style={{ color: 'var(--cth-command-crimson)' }} />
          )}
          <h2 style={SECTION_HEADING_STYLE}>
            {dnsResult?.verified ? 'Domain Verified' : 'Verification Failed'}
          </h2>
        </div>
        <p
          style={{
            fontFamily: SANS,
            fontSize: 14,
            color: 'var(--cth-command-muted)',
            margin: '0 0 24px',
            lineHeight: 1.6,
          }}
        >
          {dnsResult?.verified
            ? 'Your domain has been successfully verified and is now active.'
            : dnsResult?.error || 'DNS verification could not be completed. Check your CNAME record and try again.'}
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setDnsResult(null)}
            style={PRIMARY_CTA_STYLE}
          >
            Close
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
