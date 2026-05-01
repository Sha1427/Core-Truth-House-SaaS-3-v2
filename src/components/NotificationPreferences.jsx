import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Mail, Smartphone, Zap, DollarSign, FileText,
  Users, Settings, Check, Info,
} from 'lucide-react';
import axios from 'axios';
import { useUser } from '../hooks/useAuth';
import { useColors } from '../context/ThemeContext';
import apiClient from "../lib/apiClient";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const SANS = "'DM Sans', sans-serif";
const SERIF = "'Playfair Display', serif";

const CARD_STYLE = {
  backgroundColor: 'var(--cth-command-panel)',
  border: '1px solid var(--cth-command-border)',
  borderRadius: 4,
  padding: 20,
};

const HEADING_STYLE = {
  fontFamily: SERIF,
  color: 'var(--cth-command-ink)',
  margin: 0,
  letterSpacing: '-0.005em',
};

const BODY_STYLE = {
  fontFamily: SANS,
  color: 'var(--cth-command-ink)',
  margin: 0,
};

const MUTED_STYLE = {
  fontFamily: SANS,
  color: 'var(--cth-command-muted)',
  margin: 0,
};

const EYEBROW_STYLE = {
  fontFamily: SANS,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--cth-command-muted)',
  margin: 0,
};

const DEFAULT_PREFERENCES = {
  // In-app notifications
  in_app_enabled: true,

  // Email notifications
  email_enabled: true,
  email_digest: 'instant', // instant, daily, weekly, none

  // Push notifications (browser)
  push_enabled: false,

  // Notification categories
  crm_notifications: true,
  content_notifications: true,
  ai_job_notifications: true,
  billing_notifications: true,
  team_notifications: true,
  system_notifications: true,

  // Specific events
  deal_stage_changes: true,
  deal_won_lost: true,
  content_published: true,
  ai_generation_complete: true,
  weekly_digest: true,
  billing_alerts: true,
  team_invites: true,
  ai_usage_alerts: true,
};

const CATEGORY_CONFIG = [
  {
    id: 'crm_notifications',
    label: 'CRM & Sales',
    description: 'Deal updates, contact changes, pipeline alerts',
    icon: DollarSign,
    subOptions: [
      { id: 'deal_stage_changes', label: 'Deal stage changes' },
      { id: 'deal_won_lost', label: 'Deal won/lost notifications' },
    ],
  },
  {
    id: 'content_notifications',
    label: 'Content',
    description: 'Blog posts, content publishing, scheduling',
    icon: FileText,
    subOptions: [
      { id: 'content_published', label: 'Content published' },
    ],
  },
  {
    id: 'ai_job_notifications',
    label: 'AI Generation',
    description: 'Image generation, video generation, AI content',
    icon: Zap,
    subOptions: [
      { id: 'ai_generation_complete', label: 'AI generation complete' },
      { id: 'ai_usage_alerts', label: 'AI credit usage alerts' },
    ],
  },
  {
    id: 'billing_notifications',
    label: 'Billing',
    description: 'Payment confirmations, subscription updates',
    icon: DollarSign,
    subOptions: [
      { id: 'billing_alerts', label: 'Billing alerts' },
    ],
  },
  {
    id: 'team_notifications',
    label: 'Team',
    description: 'Team invites, member changes, permissions',
    icon: Users,
    subOptions: [
      { id: 'team_invites', label: 'Team invites' },
    ],
  },
  {
    id: 'system_notifications',
    label: 'System',
    description: 'Updates, maintenance, announcements',
    icon: Settings,
    subOptions: [
      { id: 'weekly_digest', label: 'Weekly digest email' },
    ],
  },
];

export function NotificationPreferences() {
  const { user } = useUser();
  const colors = useColors();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;
      try {
        const res = await apiClient.get("/api/notifications/preferences", {
          params: {
            user_id: user.id,
          },
        });
        setPreferences({ ...DEFAULT_PREFERENCES, ...(res.preferences || {}) });
      } catch (err) {
        console.error('Failed to load preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();

    // Check push notification permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, [user?.id]);

  // Save preferences
  const savePreferences = useCallback(async (newPrefs) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await axios.put(`${API}/notifications/preferences?user_id=${user.id}`, newPrefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  }, [user?.id]);

  // Handle toggle change
  const handleToggle = (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Handle email digest change
  const handleDigestChange = (value) => {
    const newPrefs = { ...preferences, email_digest: value };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
  };

  // Request push notification permission
  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === 'granted') {
        const newPrefs = { ...preferences, push_enabled: true };
        setPreferences(newPrefs);
        savePreferences(newPrefs);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[var(--cth-command-crimson)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ ...HEADING_STYLE, fontSize: 18, fontWeight: 600 }}>
            Notification Preferences
          </h3>
          <p style={{ ...MUTED_STYLE, fontSize: 12, lineHeight: 1.55, marginTop: 4 }}>
            Control how and when you receive notifications
          </p>
        </div>
        {saved && (
          <span
            className="flex items-center gap-1.5"
            style={{
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--cth-status-success-bright)',
            }}
          >
            <Check size={14} />
            Saved
          </span>
        )}
      </div>

      {/* Delivery Channels */}
      <div style={CARD_STYLE}>
        <h4 style={{ ...HEADING_STYLE, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Delivery Channels
        </h4>

        <div className="space-y-4">
          {/* In-app notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{
                  borderRadius: 4,
                  background: 'color-mix(in srgb, var(--cth-command-crimson) 12%, transparent)',
                }}
              >
                <Bell size={18} style={{ color: 'var(--cth-command-crimson)' }} />
              </div>
              <div>
                <div style={{ ...BODY_STYLE, fontSize: 14, fontWeight: 500 }}>In-App Notifications</div>
                <div style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>Show notifications in the app</div>
              </div>
            </div>
            <Toggle
              checked={preferences.in_app_enabled}
              onChange={() => handleToggle('in_app_enabled')}
            />
          </div>

          {/* Email notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{
                  borderRadius: 4,
                  background: 'color-mix(in srgb, var(--cth-command-purple) 12%, transparent)',
                }}
              >
                <Mail size={18} style={{ color: 'var(--cth-command-purple)' }} />
              </div>
              <div>
                <div style={{ ...BODY_STYLE, fontSize: 14, fontWeight: 500 }}>Email Notifications</div>
                <div style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>Receive notifications via email</div>
              </div>
            </div>
            <Toggle
              checked={preferences.email_enabled}
              onChange={() => handleToggle('email_enabled')}
            />
          </div>

          {/* Email digest frequency */}
          {preferences.email_enabled && (
            <div
              className="ml-13 pl-4"
              style={{ borderLeft: '1px solid var(--cth-command-border)' }}
            >
              <div style={{ ...EYEBROW_STYLE, marginBottom: 8 }}>Email Frequency</div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'instant', label: 'Instant' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'none', label: 'None' },
                ].map((opt) => {
                  const active = preferences.email_digest === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleDigestChange(opt.value)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 4,
                        border: active ? '1px solid var(--cth-command-purple)' : '1px solid var(--cth-command-border)',
                        background: active ? 'var(--cth-command-purple)' : 'transparent',
                        color: active ? 'var(--cth-command-gold)' : 'var(--cth-command-muted)',
                        fontFamily: SANS,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        cursor: 'pointer',
                        transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Push notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{
                  borderRadius: 4,
                  background: 'color-mix(in srgb, var(--cth-command-gold) 14%, transparent)',
                }}
              >
                <Smartphone size={18} style={{ color: 'var(--cth-command-gold)' }} />
              </div>
              <div>
                <div style={{ ...BODY_STYLE, fontSize: 14, fontWeight: 500 }}>Push Notifications</div>
                <div style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>Browser push notifications</div>
              </div>
            </div>
            {pushPermission === 'granted' ? (
              <Toggle
                checked={preferences.push_enabled}
                onChange={() => handleToggle('push_enabled')}
              />
            ) : pushPermission === 'denied' ? (
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  color: 'var(--cth-danger)',
                }}
              >
                Blocked in browser
              </span>
            ) : (
              <button
                onClick={requestPushPermission}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  border: '1px solid var(--cth-command-border)',
                  background: 'transparent',
                  color: 'var(--cth-command-ink)',
                  fontFamily: SANS,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Enable
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      <div style={CARD_STYLE}>
        <h4 style={{ ...HEADING_STYLE, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Notification Categories
        </h4>

        <div className="space-y-4">
          {CATEGORY_CONFIG.map((category) => {
            const Icon = category.icon;
            const isEnabled = preferences[category.id];

            return (
              <div
                key={category.id}
                className="pb-4 last:border-0 last:pb-0"
                style={{ borderBottom: '1px solid var(--cth-command-border)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 flex items-center justify-center"
                      style={{
                        borderRadius: 4,
                        background: 'var(--cth-command-panel-soft)',
                      }}
                    >
                      <Icon size={18} style={{ color: 'var(--cth-command-muted)' }} />
                    </div>
                    <div>
                      <div style={{ ...BODY_STYLE, fontSize: 14, fontWeight: 500 }}>{category.label}</div>
                      <div style={{ ...MUTED_STYLE, fontSize: 12, marginTop: 2 }}>{category.description}</div>
                    </div>
                  </div>
                  <Toggle
                    checked={isEnabled}
                    onChange={() => handleToggle(category.id)}
                  />
                </div>

                {/* Sub-options */}
                {isEnabled && category.subOptions && (
                  <div
                    className="ml-13 mt-3 pl-4 space-y-2"
                    style={{ borderLeft: '1px solid var(--cth-command-border)' }}
                  >
                    {category.subOptions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between py-1">
                        <span style={{ ...MUTED_STYLE, fontSize: 12 }}>{sub.label}</span>
                        <Toggle
                          checked={preferences[sub.id]}
                          onChange={() => handleToggle(sub.id)}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info box */}
      <div
        className="flex items-start gap-3"
        style={{
          padding: 16,
          borderRadius: 4,
          background: 'color-mix(in srgb, var(--cth-command-purple) 6%, var(--cth-command-panel))',
          border: '1px solid color-mix(in srgb, var(--cth-command-purple) 25%, var(--cth-command-border))',
        }}
      >
        <Info size={16} style={{ color: 'var(--cth-command-purple)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--cth-command-ink)',
            }}
          >
            Real-time Notifications
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 12,
              lineHeight: 1.55,
              color: 'var(--cth-command-muted)',
              marginTop: 4,
            }}
          >
            When connected, you&apos;ll receive notifications instantly via WebSocket. If disconnected,
            the app will poll for new notifications every 30 seconds.
          </div>
        </div>
      </div>
    </div>
  );
}

// Toggle component
function Toggle({ checked, onChange, size = 'md' }) {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
  };
  const s = sizes[size];

  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative ${s.track} rounded-full transition-colors`}
      style={{
        background: checked ? 'var(--cth-command-crimson)' : 'var(--cth-command-border)',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <span
        className={`absolute top-0.5 left-0.5 ${s.thumb} rounded-full transition-transform ${
          checked ? s.translate : 'translate-x-0'
        }`}
        style={{ background: 'var(--cth-command-ivory)' }}
      />
    </button>
  );
}

export default NotificationPreferences;
