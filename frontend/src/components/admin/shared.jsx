import React from 'react';

export function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="p-5 rounded-2xl bg-[var(--cth-admin-ink)] border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

export const PLAN_COLORS = {
  free: 'var(--cth-admin-muted)',
  foundation: 'var(--cth-admin-accent)',
  structure: 'var(--cth-admin-ruby)',
  house: 'var(--cth-brand-primary)',
  estate: 'var(--cth-brand-primary-soft)'
};
