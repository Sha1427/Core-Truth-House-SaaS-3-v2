import React from 'react';

export function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="p-5 rounded-2xl bg-[#2b1040] border border-white/10">
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
  free: '#4a3550',
  foundation: '#e04e35',
  structure: '#763b5b',
  house: '#AF0024',
  estate: '#33033c'
};
