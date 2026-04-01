import React from 'react';
import { Building2, Search, Eye } from 'lucide-react';
import { PLAN_COLORS } from './shared';

export function AdminTenants({ tenants, searchQuery, setSearchQuery, viewClient }) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text" placeholder="Search tenants..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#2b1040] border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#e04e35]/50"
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full">
          <thead className="bg-[#2b1040]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Workspace</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Team</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Content</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Activity</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tenants.filter(t =>
              t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.owner_id?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((tenant) => (
              <tr key={tenant.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#e04e35]/20 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#e04e35]" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{tenant.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{tenant.owner_id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="px-2 py-1 rounded-full text-xs capitalize"
                    style={{ background: `${PLAN_COLORS[tenant.plan] || PLAN_COLORS.free}20`, color: PLAN_COLORS[tenant.plan] || PLAN_COLORS.free }}>
                    {tenant.plan || 'free'}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-300">{tenant.team_size || 1}</td>
                <td className="px-4 py-4 text-gray-300">{tenant.content_count || 0}</td>
                <td className="px-4 py-4 text-gray-400 text-sm">
                  {tenant.last_activity ? new Date(tenant.last_activity).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-4 text-right">
                  <button data-testid={`view-client-${tenant.owner_id || tenant.id}`}
                    onClick={() => viewClient(tenant.owner_id || tenant.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
