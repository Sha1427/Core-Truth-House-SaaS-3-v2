import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Bell, Check, X, Zap, DollarSign, Info, AlertTriangle, 
  Trophy, ArrowRight, UserPlus, FileText, Globe, Clock,
  Sparkles, CheckCircle, XCircle, Image, Video, CreditCard,
  RefreshCw, Users, UserCheck, UserMinus, Settings, Wrench,
  Download, BookOpen, Filter, Trash2, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { useUser } from '../hooks/useAuth';
import apiClient from "../lib/apiClient";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;
const WS_URL = import.meta.env.VITE_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

// Icon mapping for notification types
const TYPE_ICONS = {
  // General
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: XCircle,
  
  // CRM
  deal: DollarSign,
  deal_won: Trophy,
  deal_lost: XCircle,
  deal_stage: ArrowRight,
  contact_added: UserPlus,
  
  // Content
  content: FileText,
  content_published: Globe,
  content_scheduled: Clock,
  blog_published: BookOpen,
  
  // AI Jobs
  ai_job: Sparkles,
  ai_complete: CheckCircle,
  ai_failed: XCircle,
  image_generated: Image,
  video_generated: Video,
  
  // Automation
  automation: Zap,
  automation_triggered: Zap,
  
  // Billing
  billing: CreditCard,
  payment_success: CheckCircle,
  payment_failed: XCircle,
  subscription_renewed: RefreshCw,
  credits_low: AlertTriangle,
  
  // Team
  team: Users,
  team_invite: UserPlus,
  team_joined: UserCheck,
  team_left: UserMinus,
  
  // System
  system: Settings,
  maintenance: Wrench,
  update: Download,
};

const TYPE_COLORS = {
  // General
  info: 'var(--cth-status-info)',
  success: 'var(--cth-status-success-bright)',
  warning: 'var(--cth-status-warning)',
  error: 'var(--cth-status-danger)',
  
  // CRM
  deal: 'var(--cth-admin-muted)',
  deal_won: 'var(--cth-status-success-bright)',
  deal_lost: 'var(--cth-status-danger)',
  deal_stage: 'var(--cth-status-info)',
  contact_added: 'var(--cth-status-focus)',
  
  // Content
  content: 'var(--cth-admin-accent)',
  content_published: 'var(--cth-status-success-bright)',
  content_scheduled: 'var(--cth-status-warning)',
  blog_published: 'var(--cth-admin-accent)',
  
  // AI Jobs
  ai_job: 'var(--cth-admin-accent)',
  ai_complete: 'var(--cth-status-success-bright)',
  ai_failed: 'var(--cth-status-danger)',
  image_generated: 'var(--cth-status-focus)',
  video_generated: 'var(--cth-admin-accent)',
  
  // Automation
  automation: 'var(--cth-admin-accent)',
  automation_triggered: 'var(--cth-status-warning)',
  
  // Billing
  billing: 'var(--cth-status-info)',
  payment_success: 'var(--cth-status-success-bright)',
  payment_failed: 'var(--cth-status-danger)',
  subscription_renewed: 'var(--cth-status-success-bright)',
  credits_low: 'var(--cth-status-warning)',
  
  // Team
  team: 'var(--cth-status-focus)',
  team_invite: 'var(--cth-status-info)',
  team_joined: 'var(--cth-status-success-bright)',
  team_left: 'var(--cth-status-danger)',
  
  // System
  system: 'var(--cth-neutral-500)',
  maintenance: 'var(--cth-status-warning)',
  update: 'var(--cth-status-info)',
};

const CATEGORY_LABELS = {
  all: 'All',
  general: 'General',
  crm: 'CRM & Sales',
  content: 'Content',
  ai: 'AI Jobs',
  billing: 'Billing',
  team: 'Team',
  system: 'System',
};

export function NotificationBell() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // Load notifications from API
  const load = useCallback(async (append = false) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const offset = append ? notifications.length : 0;
      const params = new URLSearchParams({
        user_id: user.id,
        limit: '20',
        offset: offset.toString()
      });
      if (filter !== 'all') {
        params.append('category', filter);
      }
      
      const res = await apiClient.get("/api/notifications", {
        params: {
          user_id: user.id,
          limit: '20',
          offset: offset.toString(),
          ...(filter !== 'all' ? { category: filter } : {}),
        },
      });
      const newNotifications = res.notifications || [];
      
      if (append) {
        setNotifications(prev => [...prev, ...newNotifications]);
      } else {
        setNotifications(newNotifications);
      }
      setUnread(res.unread_count || 0);
      setHasMore(res.has_more || false);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter, notifications.length]);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!user?.id || !WS_URL) return;
    
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    const ws = new WebSocket(`${WS_URL}/api/notifications/ws/${user.id}`);
    
    ws.onopen = () => {
      setIsConnected(true);

      // Start ping interval to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_notification') {
          // Add new notification to the top
          setNotifications(prev => [data.notification, ...prev]);
          setUnread(data.unread_count);
          
          // Show browser notification if permitted
          showBrowserNotification(data.notification);
        } else if (data.type === 'unread_count') {
          setUnread(data.count);
        } else if (data.type === 'read_confirmed') {
          // Update notification as read in local state
          setNotifications(prev => 
            prev.map(n => n.id === data.notification_id ? { ...n, is_read: true } : n)
          );
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      clearInterval(pingIntervalRef.current);
      
      // Reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsRef.current = ws;
  }, [user?.id]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }, []);

  // Initialize
  useEffect(() => {
    load();
    connectWebSocket();
    requestNotificationPermission();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pingIntervalRef.current);
    };
  }, [user?.id]);

  // Reload when filter changes
  useEffect(() => {
    if (user?.id) {
      load();
    }
  }, [filter]);

  const markRead = async (id) => {
    // Optimistic update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnread(prev => Math.max(0, prev - 1));
    
    // Send via WebSocket if connected, otherwise use REST
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mark_read', notification_id: id }));
    } else {
      await axios.put(`${API}/notifications/${id}/read?user_id=${user.id}`);
    }
  };

  const markAllRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
    
    await axios.put(`${API}/notifications/mark-all-read?user_id=${user.id}`);
  };

  const dismiss = async (id) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    await axios.delete(`${API}/notifications/${id}`);
    load(); // Reload to get accurate unread count
  };

  const clearRead = async () => {
    await axios.delete(`${API}/notifications/clear-all?user_id=${user.id}&read_only=true`);
    load();
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      load(true);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      <button 
        onClick={() => { setOpen(!open); if (!open) load(); }}
        data-testid="notification-bell"
        className="relative p-2 rounded-lg cth-muted hover:opacity-80 hover:bg-[var(--cth-admin-panel-alt)] transition-all"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--cth-admin-accent)] cth-heading text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {/* Connection indicator */}
        <span 
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-500'}`}
          title={isConnected ? 'Real-time connected' : 'Polling mode'}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            className="absolute right-0 top-12 z-50 w-96 max-h-[500px] overflow-hidden rounded-2xl border border-[var(--cth-admin-border)] bg-[var(--cth-admin-panel)] shadow-2xl"
            data-testid="notification-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cth-admin-border)]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold cth-heading">Notifications</span>
                {isConnected && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[var(--cth-admin-accent)] hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Filter bar */}
            <div className="px-4 py-2 border-b border-[var(--cth-admin-border)] flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cth-card-muted text-xs cth-muted hover:bg-[var(--cth-admin-panel-alt)] transition-colors"
                >
                  <Filter size={12} />
                  {CATEGORY_LABELS[filter]}
                  <ChevronDown size={12} />
                </button>
                
                {showFilter && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                    <div className="absolute top-full left-0 mt-1 w-40 bg-[var(--cth-admin-panel)] border border-[var(--cth-admin-border)] rounded-lg shadow-xl z-20 py-1">
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => { setFilter(key); setShowFilter(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                            filter === key ? 'cth-text-accent cth-card-muted' : 'cth-muted hover:opacity-80 hover:bg-[var(--cth-admin-panel-alt)]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {notifications.some(n => n.is_read) && (
                <button 
                  onClick={clearRead}
                  className="flex items-center gap-1 px-2 py-1.5 text-xs cth-muted hover:cth-muted transition-colors"
                >
                  <Trash2 size={12} />
                  Clear read
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="overflow-y-auto max-h-80">
              {loading && notifications.length === 0 ? (
                <div className="text-center py-12 text-xs text-[var(--cth-admin-muted)]">
                  <div className="w-5 h-5 border-2 border-[var(--cth-admin-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : notifications.length > 0 ? (
                <>
                  {notifications.map(n => {
                    const Icon = TYPE_ICONS[n.type] || Info;
                    const color = TYPE_COLORS[n.type] || 'var(--cth-status-info)';
                    
                    return (
                      <div 
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--cth-admin-border)] transition-colors hover:cth-card-muted ${
                          !n.is_read ? 'cth-card-muted' : ''
                        }`}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${color}15` }}
                        >
                          <Icon size={14} style={{ color }} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className={`text-xs font-semibold leading-tight ${!n.is_read ? 'cth-heading' : 'text-[var(--cth-admin-muted)]'}`}>
                              {n.title}
                            </div>
                            {n.priority === 'high' || n.priority === 'urgent' && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--cth-admin-accent)]/20 text-[var(--cth-admin-accent)]">
                                {n.priority}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--cth-admin-muted)] mt-0.5 line-clamp-2">{n.message}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-[var(--cth-brand-primary-soft)]">{getTimeAgo(n.created_at)}</span>
                            {n.link && (
                              <a 
                                href={n.link}
                                className="text-[10px] text-[var(--cth-admin-accent)] hover:underline"
                                onClick={() => { markRead(n.id); setOpen(false); }}
                              >
                                View →
                              </a>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          {!n.is_read && (
                            <button 
                              onClick={() => markRead(n.id)} 
                              className="p-1 text-[var(--cth-admin-muted)] hover:text-green-400 transition-colors"
                              title="Mark as read"
                            >
                              <Check size={12} />
                            </button>
                          )}
                          <button 
                            onClick={() => dismiss(n.id)} 
                            className="p-1 text-[var(--cth-admin-muted)] hover:text-red-400 transition-colors"
                            title="Dismiss"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Load more button */}
                  {hasMore && (
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="w-full py-3 text-xs text-[var(--cth-admin-accent)] hover:cth-card-muted transition-colors"
                    >
                      {loading ? 'Loading...' : 'Load more'}
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Bell size={24} className="mx-auto mb-2 text-[var(--cth-brand-primary-soft)]" />
                  <div className="text-xs text-[var(--cth-admin-muted)]">No notifications</div>
                  <div className="text-[10px] text-[var(--cth-brand-primary-soft)] mt-1">
                    {filter !== 'all' ? `No ${CATEGORY_LABELS[filter]} notifications` : "You're all caught up!"}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-[var(--cth-admin-border)] flex justify-between items-center">
              <a 
                href="/settings?tab=notifications"
                className="text-[10px] text-[var(--cth-admin-muted)] hover:cth-heading transition-colors"
              >
                Notification Settings
              </a>
              {unread > 0 && (
                <span className="text-[10px] text-[var(--cth-admin-accent)]">{unread} unread</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
