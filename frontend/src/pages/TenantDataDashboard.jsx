/**
 * TenantDataDashboard.jsx
 * Core Truth House OS — Tenant Data Overview
 * 
 * Shows tenants a complete view of all their stored data.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useWorkspace } from '../context/WorkspaceContext';
import { useColors } from '../context/ThemeContext';
import { useUser } from '../hooks/useAuth';
import {
  Database, FileText, Target, Megaphone, Image, FolderOpen,
  CheckCircle, Download, RefreshCw, ChevronRight,
  BarChart3, Layers, BookOpen, Sparkles
} from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL;

// Collection icons and routes
const COLLECTION_CONFIG = {
  brand_memory: {
    icon: Database,
    label: 'Brand Memory',
    description: 'AI context & brand variables',
    route: '/brand-intelligence',
    color: '#AF0024',
  },
  brand_foundation: {
    icon: BookOpen,
    label: 'Brand Foundation',
    description: 'Mission, vision, values, story',
    route: '/brand-intelligence',
    color: '#e04e35',
  },
  strategic_os_steps: {
    icon: Target,
    label: 'Strategic OS',
    description: '9-step brand strategy workflow',
    route: '/strategic-os',
    color: '#C7A09D',
  },
  brand_audits: {
    icon: BarChart3,
    label: 'Brand Audits',
    description: 'Brand health scores & analysis',
    route: '/brand-audit',
    color: '#10B981',
  },
  campaigns: {
    icon: Megaphone,
    label: 'Campaigns',
    description: 'Marketing campaigns & content plans',
    route: '/campaign-builder',
    color: '#9B1B30',
  },
  documents: {
    icon: FolderOpen,
    label: 'Documents',
    description: 'Uploaded & generated files',
    route: '/documents',
    color: '#C7A09D',
  },
  media_assets: {
    icon: Image,
    label: 'Media Assets',
    description: 'Generated images & videos',
    route: '/media-studio',
    color: '#e04e35',
  },
  content_assets: {
    icon: FileText,
    label: 'Content Library',
    description: 'Generated content pieces',
    route: '/content-studio',
    color: '#AF0024',
  },
  onboarding: {
    icon: CheckCircle,
    label: 'Onboarding',
    description: 'Setup progress & milestones',
    route: '/command-center',
    color: '#10B981',
  },
};

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Progress ring component
function ProgressRing({ value, max, size = 48, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(199,160,157,0.15)" strokeWidth="4"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, color: '#f8f5fa',
      }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}

// Collection card component
function CollectionCard({ name, data, onClick, colors }) {
  const config = COLLECTION_CONFIG[name];
  if (!config) return null;

  const Icon = config.icon;
  const count = data?.count || 0;

  return (
    <button
      data-testid={`collection-card-${name}`}
      onClick={onClick}
      style={{
        background: colors.cardBg,
        border: `1px solid ${colors.tuscany}15`,
        borderRadius: 12,
        padding: '16px 18px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${config.color}40`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = `${colors.tuscany}15`;
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: `${config.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} style={{ color: config.color }} />
        </div>
        <ChevronRight size={16} style={{ color: colors.tuscany }} />
      </div>

      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
          {config.label}
        </h3>
        <p style={{ fontSize: 11, color: colors.textMuted, margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
          {config.description}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
        {name === 'strategic_os_steps' && data?.completed !== undefined ? (
          <>
            <ProgressRing value={data.completed} max={data.total} size={32} color={config.color} />
            <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              {data.completed}/{data.total} steps
            </span>
          </>
        ) : name === 'brand_memory' && data?.completion_pct !== undefined ? (
          <>
            <ProgressRing value={data.completion_pct} max={100} size={32} color={config.color} />
            <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              {data.fields_filled} fields filled
            </span>
          </>
        ) : name === 'brand_foundation' ? (
          <>
            <ProgressRing value={data?.fields_filled || 0} max={data?.total_fields || 8} size={32} color={config.color} />
            <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
              {data?.fields_filled || 0}/{data?.total_fields || 8} sections
            </span>
          </>
        ) : name === 'brand_audits' ? (
          <span style={{ fontSize: 12, color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            {count} audit{count !== 1 ? 's' : ''} • Latest: <strong style={{ color: config.color }}>{data?.latest_score || 'N/A'}</strong>
          </span>
        ) : name === 'documents' ? (
          <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            {count} file{count !== 1 ? 's' : ''} • {formatBytes(data?.total_size_bytes)}
          </span>
        ) : name === 'onboarding' ? (
          <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            {data?.milestones_completed || 0} milestones completed
          </span>
        ) : (
          <span style={{ fontSize: 11, color: colors.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
            {count} item{count !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </button>
  );
}

export default function TenantDataDashboard() {
  const navigate = useNavigate();
  const colors = useColors();
  const { activeWorkspace } = useWorkspace();
  const { user } = useUser();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const workspaceId = activeWorkspace?.id || '';
  const userId = user?.id || 'default';

  useEffect(() => {
    loadSummary();
  }, [workspaceId]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/tenant-data/summary`, {
        params: { workspace_id: workspaceId, user_id: userId }
      });
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load tenant data summary:', err);
    }
    setLoading(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API}/api/tenant-data/full-export`, {
        params: { workspace_id: workspaceId, user_id: userId }
      });
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brand-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
  };

  const handleCollectionClick = (name) => {
    const config = COLLECTION_CONFIG[name];
    if (config?.route) {
      navigate(config.route);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <RefreshCw size={24} style={{ color: colors.cinnabar, animation: 'spin 1s linear infinite' }} />
        <p style={{ color: colors.textMuted, marginTop: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Loading your data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const collections = summary?.collections || {};

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Playfair Display', serif" }}>
            <Layers size={22} style={{ color: colors.cinnabar }} />
            Your Data Dashboard
          </h1>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: '6px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
            Overview of all your brand data stored in Core Truth House
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            data-testid="refresh-data-btn"
            onClick={loadSummary}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.tuscany}30`,
              borderRadius: 8,
              padding: '8px 14px',
              color: colors.textMuted,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            data-testid="export-data-btn"
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: `${colors.cinnabar}15`,
              border: `1px solid ${colors.cinnabar}40`,
              borderRadius: 8,
              padding: '8px 16px',
              color: colors.cinnabar,
              fontSize: 12,
              fontWeight: 600,
              cursor: exporting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: exporting ? 0.7 : 1,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Download size={14} />
            {exporting ? 'Exporting...' : 'Export All Data'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 24,
      }}>
        {[
          {
            label: 'BRAND MEMORY',
            value: `${collections.brand_memory?.completion_pct || 0}%`,
            sub: 'completion',
            color: colors.cinnabar,
          },
          {
            label: 'STRATEGIC OS',
            value: `${collections.strategic_os_steps?.completed || 0}/9`,
            sub: 'steps done',
            color: colors.tuscany,
          },
          {
            label: 'BRAND SCORE',
            value: collections.brand_audits?.latest_score || '—',
            sub: 'latest audit',
            color: '#10B981',
          },
          {
            label: 'TOTAL FILES',
            value: (collections.documents?.count || 0) + (collections.media_assets?.count || 0),
            sub: 'docs & media',
            color: colors.crimson,
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: colors.cardBg,
              border: `1px solid ${colors.tuscany}15`,
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <p style={{ fontSize: 10, color: colors.tuscany, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'DM Sans', sans-serif" }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 24, fontWeight: 700, color: stat.color, margin: '4px 0 2px', fontFamily: "'DM Sans', sans-serif" }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Collections Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
      }}>
        {Object.entries(collections).map(([name, data]) => (
          <CollectionCard
            key={name}
            name={name}
            data={data}
            colors={colors}
            onClick={() => handleCollectionClick(name)}
          />
        ))}
      </div>

      {/* Footer info */}
      <div style={{
        marginTop: 28,
        padding: '14px 18px',
        background: `${colors.crimson}08`,
        border: `1px solid ${colors.crimson}20`,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <Sparkles size={18} style={{ color: colors.cinnabar }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, color: colors.textPrimary, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            <strong>Data Privacy:</strong> All your brand data is stored securely and scoped to your workspace.
          </p>
          <p style={{ fontSize: 11, color: colors.textMuted, margin: '4px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
            Last synced: {formatDate(summary?.generated_at)} • Workspace: {workspaceId || 'Default'}
          </p>
        </div>
      </div>
    </div>
  );
}
