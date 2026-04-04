import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { DashboardLayout, TopBar } from '../components/Layout';
import {
  Activity, ArrowRight, Loader2, Palette, FileText, Package,
  Cog, Rocket, Sparkles, TrendingUp, AlertCircle
} from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const MODULE_META = {
  brand_foundation: { icon: Palette, path: '/brand-foundation', color: '#AF0024' },
  content_studio: { icon: FileText, path: '/content-studio', color: '#e04e35' },
  systems_builder: { icon: Cog, path: '/systems-builder', color: '#C7A09D' },
  offer_builder: { icon: Package, path: '/offer-builder', color: '#9B1B30' },
  identity_studio: { icon: Sparkles, path: '/identity-studio', color: '#e04e35' },
  launch_planner: { icon: Rocket, path: '/launch-planner', color: '#AF0024' },
};

function ScoreRing({ score, size = 120, stroke = 8, color = '#e04e35' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

function ModuleCard({ moduleKey, data }) {
  const meta = MODULE_META[moduleKey] || {};
  const Icon = meta.icon || Activity;
  const color = meta.color || '#e04e35';
  const score = data?.score || 0;

  return (
    <Link to={meta.path || '/'} data-testid={`health-module-${moduleKey}`}
      className="group p-5 rounded-2xl border border-white/5 bg-[#2b1040] hover:border-[rgba(224,78,53,0.3)] transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div className="relative w-14 h-14">
          <ScoreRing score={score} size={56} stroke={5} color={color} />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
            {score}%
          </span>
        </div>
      </div>
      <h3 className="text-white font-semibold text-sm mb-1">{data?.label || moduleKey}</h3>
      <div className="text-xs text-gray-500 mb-3">{data?.completed}/{data?.total} completed</div>
      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-gray-500 group-hover:text-[#e04e35] transition-colors">
        Continue building <ArrowRight size={12} />
      </div>
    </Link>
  );
}

export default function BrandHealthDashboard() {
  const { user } = useUser();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchHealth();
  }, [user?.id]);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/brand-health?user_id=${user?.id}`);
      setHealth(res.data);
    } catch (e) { console.error('Failed to load brand health', e); }
    finally { setLoading(false); }
  };

  const overallScore = health?.overall_score || 0;
  const modules = health?.modules || {};
  const recommendations = health?.recommendations || [];

  const getScoreLabel = (s) => {
    if (s >= 80) return { text: 'Excellent', color: '#22c55e' };
    if (s >= 60) return { text: 'Strong', color: '#e04e35' };
    if (s >= 40) return { text: 'Growing', color: '#eab308' };
    if (s >= 20) return { text: 'Building', color: '#f97316' };
    return { text: 'Just Starting', color: '#ef4444' };
  };

  const label = getScoreLabel(overallScore);

  return (
    <DashboardLayout>
      <TopBar title="Brand Health Score" subtitle="Track your brand-building progress across all modules" />
      <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-[#e04e35]" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overall Score */}
            <div className="flex flex-col md:flex-row gap-8 items-center p-8 rounded-2xl border border-white/5 bg-[#2b1040]"
              data-testid="overall-health-score">
              <div className="relative">
                <ScoreRing score={overallScore} size={180} stroke={12} color={label.color} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{overallScore}</span>
                  <span className="text-xs text-gray-500">/ 100</span>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: label.color }}>
                  Brand Health: {label.text}
                </div>
                <h2 className="text-white font-bold text-2xl mb-2">
                  Your Brand Ecosystem
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
                  {overallScore >= 80
                    ? "Your brand ecosystem is well-built. Keep refining and expanding."
                    : overallScore >= 40
                      ? "Good progress! Focus on the modules below to strengthen your brand."
                      : "You're just getting started. Complete the recommended modules to build your brand foundation."
                  }
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <TrendingUp size={14} className="text-[#e04e35]" />
                  <span className="text-xs text-gray-500">
                    {Object.values(modules).filter(m => m.score === 100).length} of {Object.keys(modules).length} modules complete
                  </span>
                </div>
              </div>
            </div>

            {/* Module Grid */}
            <div>
              <h3 className="text-white font-semibold mb-4">Module Breakdown</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(modules).map(([key, data]) => (
                  <ModuleCard key={key} moduleKey={key} data={data} />
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle size={16} className="text-[#e04e35]" /> Recommended Actions
                </h3>
                <div className="space-y-3">
                  {recommendations.map((rec, i) => {
                    const meta = MODULE_META[rec.module] || {};
                    const Icon = meta.icon || Activity;
                    return (
                      <Link key={i} to={meta.path || '/'} data-testid={`recommendation-${rec.module}`}
                        className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-[#2b1040] hover:border-[rgba(224,78,53,0.3)] transition-all">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${meta.color || '#e04e35'}15` }}>
                          <Icon size={18} style={{ color: meta.color || '#e04e35' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white">{rec.label}</div>
                          <div className="text-xs text-gray-500">{rec.action}</div>
                        </div>
                        <div className="text-xs font-bold px-3 py-1 rounded-full"
                          style={{ background: `${meta.color || '#e04e35'}15`, color: meta.color || '#e04e35' }}>
                          {rec.score}%
                        </div>
                        <ArrowRight size={16} className="text-gray-600" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

