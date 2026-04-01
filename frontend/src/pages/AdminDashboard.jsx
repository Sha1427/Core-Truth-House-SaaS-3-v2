import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useAuth';
import axios from 'axios';
import { DashboardLayout } from '../components/Layout';
import {
  Settings, Activity, Building2, MessageSquare, Key, Video,
  Package, Link, BookOpen, TrendingUp, Loader2, RefreshCw, Cpu, Shield, Wand2
} from 'lucide-react';

import { AdminOverview } from '../components/admin/AdminOverview';
import { AdminTenants } from '../components/admin/AdminTenants';
import { AdminMessages } from '../components/admin/AdminMessages';
import { AdminApiConfig } from '../components/admin/AdminApiConfig';
import { AdminTrainingVideos } from '../components/admin/AdminTrainingVideos';
import { AdminAddonRequests } from '../components/admin/AdminAddonRequests';
import { AdminAffiliateLinks } from '../components/admin/AdminAffiliateLinks';
import { AdminPreloadedPrompts } from '../components/admin/AdminPreloadedPrompts';
import { AdminAnalytics } from '../components/admin/AdminAnalytics';
import { ClientDashboardView } from '../components/admin/ClientDashboardView';
import { AdminModelConfig } from '../components/admin/AdminModelConfig';
import { AdminPersonalKeys } from '../components/admin/AdminPersonalKeys';
import { AdminMediaPromptEngine } from '../components/admin/AdminMediaPromptEngine';

const API = import.meta.env.VITE_BACKEND_URL;

const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'tenants', label: 'Tenants', icon: Building2 },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'ai-model', label: 'AI Model', icon: Cpu },
  { id: 'api-config', label: 'API Keys', icon: Key },
  { id: 'personal-keys', label: 'My API Keys', icon: Shield },
  { id: 'training', label: 'Training Videos', icon: Video },
  { id: 'addon-requests', label: 'Add-on Requests', icon: Package },
  { id: 'affiliate', label: 'Affiliate Links', icon: Link },
  { id: 'prompts', label: 'Preload Prompts', icon: BookOpen },
  { id: 'media-prompt-engine', label: 'Media Prompt Engine', icon: Wand2 },
];

export default function AdminDashboard() {
  const { user } = useUser();
  const adminId = user?.id || 'default';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Core data
  const [overview, setOverview] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [usageAnalytics, setUsageAnalytics] = useState(null);

  // Tab-specific data
  const [apiConfigs, setApiConfigs] = useState([]);
  const [trainingVideos, setTrainingVideos] = useState([]);
  const [addonRequests, setAddonRequests] = useState([]);
  const [affiliateLinks, setAffiliateLinks] = useState([]);
  const [preloadedPrompts, setPreloadedPrompts] = useState([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState(new Set());

  // Client view
  const [viewingClient, setViewingClient] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [clientLoading, setClientLoading] = useState(false);

  useEffect(() => { fetchAllData(); }, [adminId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [overviewRes, tenantsRes, messagesRes, usageRes] = await Promise.all([
        axios.get(`${API}/api/admin/overview?admin_id=${adminId}`),
        axios.get(`${API}/api/admin/tenants?admin_id=${adminId}&limit=10`),
        axios.get(`${API}/api/admin/messages?admin_id=${adminId}&limit=10`),
        axios.get(`${API}/api/admin/analytics/usage?admin_id=${adminId}`)
      ]);
      setOverview(overviewRes.data);
      setTenants(tenantsRes.data.tenants || []);
      setMessages(messagesRes.data.messages || []);
      setUsageAnalytics(usageRes.data);
    } catch (err) { console.error('Error fetching admin data:', err); }
    finally { setLoading(false); }
  };

  const handleRefresh = async () => { setRefreshing(true); await fetchAllData(); setRefreshing(false); };

  // Tab data fetchers
  const fetchApiConfigs = async () => {
    try { const res = await axios.get(`${API}/api/admin/api-config?admin_id=${adminId}`); setApiConfigs(res.data.configs || []); } catch {}
  };
  const fetchTrainingVideos = async () => {
    try { const res = await axios.get(`${API}/api/admin/training-videos?admin_id=${adminId}`); setTrainingVideos(res.data.videos || []); } catch {}
  };
  const fetchAddonRequests = async () => {
    try { const res = await axios.get(`${API}/api/admin/addon-requests?admin_id=${adminId}`); setAddonRequests(res.data.requests || []); } catch {}
  };
  const fetchAffiliateLinks = async () => {
    try { const res = await axios.get(`${API}/api/admin/affiliate-links?admin_id=${adminId}`); setAffiliateLinks(res.data.links || []); } catch {}
  };
  const fetchPreloadedPrompts = async () => {
    try { const res = await axios.get(`${API}/api/admin/preloaded-prompts?admin_id=${adminId}`); setPreloadedPrompts(res.data.prompts || []); } catch {}
  };

  useEffect(() => {
    if (activeTab === 'api-config') fetchApiConfigs();
    if (activeTab === 'training') fetchTrainingVideos();
    if (activeTab === 'addon-requests') fetchAddonRequests();
    if (activeTab === 'affiliate') fetchAffiliateLinks();
    if (activeTab === 'prompts') fetchPreloadedPrompts();
  }, [activeTab]);

  // Client view — uses safe tenant detail endpoint (metadata + usage only)
  const viewClient = async (clientId) => {
    setClientLoading(true);
    setViewingClient(clientId);
    try {
      const res = await axios.get(`${API}/api/admin/tenants/${clientId}?admin_id=${adminId}`);
      setClientData(res.data);
    } catch { alert('Failed to load client data'); }
    finally { setClientLoading(false); }
  };

  // Message actions
  const deleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`${API}/api/admin/messages/${msgId}?admin_id=${adminId}`);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      if (selectedMessage?.id === msgId) setSelectedMessage(null);
      selectedMessages.delete(msgId);
      setSelectedMessages(new Set(selectedMessages));
    } catch { alert('Failed to delete message'); }
  };

  const deleteSelectedMessages = async () => {
    if (selectedMessages.size === 0) return;
    if (!window.confirm(`Delete ${selectedMessages.size} message(s)?`)) return;
    try {
      for (const msgId of selectedMessages) {
        await axios.delete(`${API}/api/admin/messages/${msgId}?admin_id=${adminId}`);
      }
      setMessages(prev => prev.filter(m => !selectedMessages.has(m.id)));
      setSelectedMessages(new Set());
      setSelectedMessage(null);
    } catch { alert('Failed to delete some messages'); }
  };

  const markMessageRead = async (msgId) => {
    try {
      await axios.put(`${API}/api/admin/messages/${msgId}/status?status=read&admin_id=${adminId}`);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'read' } : m));
    } catch {}
  };

  const updateAddonStatus = async (requestId, status) => {
    try {
      await axios.put(`${API}/api/admin/addon-requests/${requestId}/status?status=${status}&admin_id=${adminId}`);
      fetchAddonRequests();
    } catch {}
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#e04e35]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="admin-dashboard">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Settings className="w-7 h-7 text-[#e04e35]" />
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1">Platform overview and tenant management</p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#2b1040] border border-white/10 rounded-xl text-gray-300 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#2b1040] text-[#e04e35] border-b-2 border-[#e04e35]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'messages' && overview?.unread_contact_messages > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#e04e35] text-white text-xs rounded-full">
                  {overview.unread_contact_messages}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <AdminOverview overview={overview} usageAnalytics={usageAnalytics} onTabSwitch={setActiveTab} />}
        {activeTab === 'analytics' && <AdminAnalytics adminId={adminId} overview={overview} />}
        {activeTab === 'tenants' && <AdminTenants tenants={tenants} searchQuery={searchQuery} setSearchQuery={setSearchQuery} viewClient={viewClient} />}
        {activeTab === 'messages' && <AdminMessages messages={messages} selectedMessage={selectedMessage} setSelectedMessage={setSelectedMessage} selectedMessages={selectedMessages} setSelectedMessages={setSelectedMessages} deleteMessage={deleteMessage} deleteSelectedMessages={deleteSelectedMessages} markMessageRead={markMessageRead} />}
        {activeTab === 'api-config' && <AdminApiConfig apiConfigs={apiConfigs} fetchApiConfigs={fetchApiConfigs} adminId={adminId} />}
        {activeTab === 'ai-model' && <AdminModelConfig adminId={adminId} />}
        {activeTab === 'personal-keys' && <AdminPersonalKeys adminId={adminId} />}
        {activeTab === 'training' && <AdminTrainingVideos trainingVideos={trainingVideos} fetchTrainingVideos={fetchTrainingVideos} adminId={adminId} />}
        {activeTab === 'addon-requests' && <AdminAddonRequests addonRequests={addonRequests} updateAddonStatus={updateAddonStatus} adminId={adminId} />}
        {activeTab === 'affiliate' && <AdminAffiliateLinks affiliateLinks={affiliateLinks} fetchAffiliateLinks={fetchAffiliateLinks} adminId={adminId} />}
        {activeTab === 'prompts' && <AdminPreloadedPrompts preloadedPrompts={preloadedPrompts} fetchPreloadedPrompts={fetchPreloadedPrompts} adminId={adminId} />}
        {activeTab === 'media-prompt-engine' && <AdminMediaPromptEngine />}

        {/* Client Dashboard Modal */}
        {viewingClient && (
          <ClientDashboardView
            viewingClient={viewingClient} clientData={clientData} clientLoading={clientLoading}
            onClose={() => { setViewingClient(null); setClientData(null); }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
