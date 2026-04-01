import React from 'react';
import { ArrowLeft, Loader2, FileText, Sparkles, Image, Building2, Package } from 'lucide-react';
import { StatCard } from './shared';

export function ClientDashboardView({ viewingClient, clientData, clientLoading, onClose }) {
  return (
    <div data-testid="client-dashboard-modal"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9000, overflow: 'auto', padding: '20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="flex items-center justify-between mb-6">
          <button data-testid="close-client-view" onClick={onClose}
            className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft size={18} /> Back to Admin
          </button>
          <h2 className="text-xl font-bold text-white">
            {clientData?.user?.name || clientData?.user?.email || 'Client Dashboard'}
          </h2>
        </div>
        {clientLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#e04e35]" />
          </div>
        ) : clientData ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard icon={FileText} label="Content" value={clientData.stats.total_content} color="#e04e35" />
              <StatCard icon={Sparkles} label="Prompts" value={clientData.stats.total_prompts} color="#763b5b" />
              <StatCard icon={Image} label="Media" value={clientData.stats.total_media} color="#22c55e" />
              <StatCard icon={Building2} label="Workspaces" value={clientData.stats.total_workspaces} color="#AF0024" />
              <StatCard icon={Package} label="Offers" value={clientData.stats.total_offers} color="#f59e0b" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#2b1040] border border-white/10">
                <h3 className="text-white font-semibold mb-4">User Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="text-white">{clientData.user?.name || '\u2014'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="text-white">{clientData.user?.email || '\u2014'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Plan</span><span className="text-[#e04e35] font-semibold capitalize">{clientData.user?.plan || 'foundation'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Joined</span><span className="text-white">{clientData.user?.created_at ? new Date(clientData.user.created_at).toLocaleDateString() : '\u2014'}</span></div>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-[#2b1040] border border-white/10">
                <h3 className="text-white font-semibold mb-4">Usage</h3>
                {clientData.usage ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Plan Limit</span><span className="text-white">{clientData.usage.limit || 75}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Used This Month</span><span className="text-white">{clientData.usage.generation_count || 0}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Credit Balance</span><span className="text-[#e04e35] font-semibold">{clientData.usage.credit_balance || 0}</span></div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No usage data yet</p>
                )}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-[#2b1040] border border-white/10">
              <h3 className="text-white font-semibold mb-4">Recent Content ({clientData.content.length})</h3>
              {clientData.content.length === 0 ? (
                <p className="text-gray-400 text-sm">No content generated yet</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {clientData.content.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                      <div>
                        <div className="text-white text-sm">{item.title || item.type || 'Untitled'}</div>
                        <div className="text-gray-400 text-xs">{item.type} • {new Date(item.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {clientData.foundations?.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#2b1040] border border-white/10">
                <h3 className="text-white font-semibold mb-4">Brand Foundation</h3>
                {clientData.foundations.map((f, i) => (
                  <div key={i} className="space-y-2 text-sm">
                    {Object.entries(f).filter(([k]) => !['id', 'user_id', 'workspace_id', 'created_at', 'updated_at'].includes(k)).map(([key, val]) => (
                      val && <div key={key} className="flex gap-4">
                        <span className="text-gray-400 capitalize min-w-[120px]">{key.replace(/_/g, ' ')}</span>
                        <span className="text-white">{typeof val === 'string' ? val.substring(0, 200) : JSON.stringify(val).substring(0, 200)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
