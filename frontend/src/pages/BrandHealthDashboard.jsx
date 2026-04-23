import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { DashboardLayout, TopBar } from '../components/Layout';
import {
  Activity,
  ArrowRight,
  Loader2,
  Palette,
  FileText,
  Package,
  Cog,
  Rocket,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import axios from 'axios';
import apiClient from "../lib/apiClient";

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

const MODULE_META = {
  brand_foundation: { icon: Palette, path: '/brand-foundation' },
  content_studio: { icon: FileText, path: '/content-studio' },
  systems_builder: { icon: Cog, path: '/systems-builder' },
  offer_builder: { icon: Package, path: '/offer-builder' },
  identity_studio: { icon: Sparkles, path: '/identity-studio' },
  launch_planner: { icon: Rocket, path: '/launch-planner' },
};

const getScoreMeta = (score) => {
  if (score >= 80) return { text: 'Excellent', className: 'cth-text-success', color: 'var(--cth-success)' };
  if (score >= 60) return { text: 'Strong', className: 'cth-text-accent', color: 'var(--cth-app-accent)' };
  if (score >= 40) return { text: 'Growing', className: 'cth-text-warning', color: 'var(--cth-warning)' };
  if (score >= 20) return { text: 'Building', className: 'cth-text-info', color: 'var(--cth-info)' };
  return { text: 'Just Starting', className: 'cth-text-danger', color: 'var(--cth-danger)' };
};

function ScoreRing({ score, size = 120, stroke = 8, color = 'var(--cth-app-accent)' }) {
  const safeScore = Math.max(0, Math.min(Number(score) || 0, 100));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (safeScore / 100) * circ;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--cth-app-border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

function ModuleCard({ moduleKey, data }) {
  const meta = MODULE_META[moduleKey] || {};
  const Icon = meta.icon || Activity;
  const score = data?.score || 0;
  const scoreMeta = getScoreMeta(score);

  return (
    <Link
      to={meta.path || '/'}
      data-testid={`health-module-${moduleKey}`}
      className="cth-card group block p-5 transition-all hover:-translate-y-0.5"
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: 'rgba(224, 78, 53, 0.10)',
            color: 'var(--cth-app-accent)',
          }}
        >
          <Icon size={18} />
        </div>

        <div className="relative h-14 w-14">
          <ScoreRing score={score} size={56} stroke={5} color={scoreMeta.color} />
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold cth-heading">
            {score}%
          </span>
        </div>
      </div>

      <h3 className="mb-1 text-sm font-semibold cth-heading">
        {data?.label || moduleKey}
      </h3>

      <div className="mb-3 text-xs cth-muted">
        {data?.completed}/{data?.total} completed
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--cth-app-panel-alt)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.max(0, Math.min(Number(score) || 0, 100))}%`,
            background: scoreMeta.color,
          }}
        />
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs cth-muted transition-colors group-hover:cth-text-accent">
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
      const res = await apiClient.get("/brand-health", { params: { user_id: user?.id } });
      setHealth(res.data);
    } catch (e) {
      console.error('Failed to load brand health', e);
    } finally {
      setLoading(false);
    }
  };

  const overallScore = health?.overall_score || 0;
  const modules = health?.modules || {};
  const label = getScoreMeta(overallScore);
  const completeCount = Object.values(modules).filter((m) => m.score === 100).length;
  const moduleCount = Object.keys(modules).length;

  return (
    <DashboardLayout>
      <TopBar
        title="Brand Health Score"
        subtitle="Track your brand-building progress across all modules"
      />

      <div className="cth-page flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin cth-text-accent" />
          </div>
        ) : (
          <div className="space-y-8">
            <div
              className="cth-card flex flex-col items-center gap-8 p-8 md:flex-row"
              data-testid="overall-health-score"
            >
              <div className="relative">
                <ScoreRing
                  score={overallScore}
                  size={180}
                  stroke={12}
                  color={label.color}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold cth-heading">
                    {overallScore}
                  </span>
                  <span className="text-xs cth-muted">/ 100</span>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className={`mb-2 text-xs font-bold uppercase tracking-widest ${label.className}`}>
                  Brand Health: {label.text}
                </div>

                <h2 className="mb-2 text-2xl font-bold cth-heading">
                  Your Brand Ecosystem
                </h2>

                <p className="max-w-lg text-sm leading-relaxed cth-muted">
                  {overallScore >= 80
                    ? 'Your brand ecosystem is well-built. Keep refining and expanding.'
                    : overallScore >= 40
                      ? 'Good progress! Focus on the modules below to strengthen your brand.'
                      : "You're just getting started. Complete the recommended modules to build your brand foundation."}
                </p>

                <div className="mt-4 flex items-center justify-center gap-2 md:justify-start">
                  <TrendingUp size={14} className="cth-text-accent" />
                  <span className="text-xs cth-muted">
                    {completeCount} of {moduleCount} modules complete
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-semibold cth-heading">
                Module Breakdown
              </h3>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {Object.entries(modules).map(([key, data]) => (
                  <ModuleCard key={key} moduleKey={key} data={data} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
