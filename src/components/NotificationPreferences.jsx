import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, Mail, Smartphone, Zap, DollarSign, FileText, 
  Users, Settings, Check, Info, AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { useUser } from '../hooks/useAuth';
import { useColors } from '../context/ThemeContext';
import apiClient from "../lib/apiClient";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

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
    ]
  },
  {
    id: 'content_notifications',
    label: 'Content',
    description: 'Blog posts, content publishing, scheduling',
    icon: FileText,
    subOptions: [
      { id: 'content_published', label: 'Content published' },
    ]
  },
  {
    id: 'ai_job_notifications',
    label: 'AI Generation',
    description: 'Image generation, video generation, AI content',
    icon: Zap,
    subOptions: [
      { id: 'ai_generation_complete', label: 'AI generation complete' },
      { id: 'ai_usage_alerts', label: 'AI credit usage alerts' },
    ]
  },
  {
    id: 'billing_notifications',
    label: 'Billing',
    description: 'Payment confirmations, subscription updates',
    icon: DollarSign,
    subOptions: [
      { id: 'billing_alerts', label: 'Billing alerts' },
    ]
  },
  {
    id: 'team_notifications',
    label: 'Team',
    description: 'Team invites, member changes, permissions',
    icon: Users,
    subOptions: [
      { id: 'team_invites', label: 'Team invites' },
    ]
  },
  {
    id: 'system_notifications',
    label: 'System',
    description: 'Updates, maintenance, announcements',
    icon: Settings,
    subOptions: [
      { id: 'weekly_digest', label: 'Weekly digest email' },
    ]
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
        <div className="w-6 h-6 border-2 border-[var(--cth-admin-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold cth-heading" >
            Notification Preferences
          </h3>
          <p className="text-xs cth-muted mt-1">
            Control how and when you receive notifications
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Check size={14} />
            Saved
          </span>
        )}
      </div>

      {/* Delivery Channels */}
      <div className="p-5 cth-card-muted border border-[var(--cth-admin-border)] rounded-xl">
        <h4 className="text-sm font-semibold cth-heading mb-4">Delivery Channels</h4>
        
        <div className="space-y-4">
          {/* In-app notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--cth-admin-accent)]/15 flex items-center justify-center">
                <Bell size={18} className="text-[var(--cth-admin-accent)]" />
              </div>
              <div>
                <div className="text-sm font-medium cth-heading">In-App Notifications</div>
                <div className="text-xs cth-muted">Show notifications in the app</div>
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
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Mail size={18} className="text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium cth-heading">Email Notifications</div>
                <div className="text-xs cth-muted">Receive notifications via email</div>
              </div>
            </div>
            <Toggle 
              checked={preferences.email_enabled} 
              onChange={() => handleToggle('email_enabled')} 
            />
          </div>

          {/* Email digest frequency */}
          {preferences.email_enabled && (
            <div className="ml-13 pl-4 border-l border-[var(--cth-admin-border)]">
              <div className="text-xs cth-muted mb-2">Email frequency</div>
              <div className="flex gap-2">
                {[
                  { value: 'instant', label: 'Instant' },
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'none', label: 'None' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleDigestChange(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      preferences.email_digest === opt.value
                        ? 'bg-[var(--cth-admin-accent)] cth-heading'
                        : 'cth-card-muted cth-muted hover:bg-[var(--cth-admin-panel-alt)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Push notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Smartphone size={18} className="text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-medium cth-heading">Push Notifications</div>
                <div className="text-xs cth-muted">Browser push notifications</div>
              </div>
            </div>
            {pushPermission === 'granted' ? (
              <Toggle 
                checked={preferences.push_enabled} 
                onChange={() => handleToggle('push_enabled')} 
              />
            ) : pushPermission === 'denied' ? (
              <span className="text-xs text-red-400">Blocked in browser</span>
            ) : (
              <button
                onClick={requestPushPermission}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notification Categories */}
      <div className="p-5 cth-card-muted border border-[var(--cth-admin-border)] rounded-xl">
        <h4 className="text-sm font-semibold cth-heading mb-4">Notification Categories</h4>
        
        <div className="space-y-4">
          {CATEGORY_CONFIG.map(category => {
            const Icon = category.icon;
            const isEnabled = preferences[category.id];
            
            return (
              <div key={category.id} className="pb-4 border-b border-[var(--cth-admin-border)] last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Icon size={18} className="text-[var(--cth-admin-muted)]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium cth-heading">{category.label}</div>
                      <div className="text-xs cth-muted">{category.description}</div>
                    </div>
                  </div>
                  <Toggle 
                    checked={isEnabled} 
                    onChange={() => handleToggle(category.id)} 
                  />
                </div>
                
                {/* Sub-options */}
                {isEnabled && category.subOptions && (
                  <div className="ml-13 mt-3 pl-4 border-l border-[var(--cth-admin-border)] space-y-2">
                    {category.subOptions.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between py-1">
                        <span className="text-xs cth-muted">{sub.label}</span>
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
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-medium text-blue-300">Real-time Notifications</div>
          <div className="text-xs text-blue-300/70 mt-1">
            When connected, you'll receive notifications instantly via WebSocket. If disconnected, 
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
      onClick={onChange}
      className={`relative ${s.track} rounded-full transition-colors ${
        checked ? 'bg-[var(--cth-admin-accent)]' : 'bg-white/20'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 ${s.thumb} rounded-full bg-white transition-transform ${
          checked ? s.translate : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default NotificationPreferences;

