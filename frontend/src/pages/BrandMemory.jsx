import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import { useUser } from '../hooks/useAuth';
import {
  Brain,
  CheckCircle2,
  Circle,
  Sparkles,
  FileText,
  Image,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import axios from 'axios';
import BrandMemoryOSVariables from '../components/Brand/BrandMemoryOSVariables';

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function BrandMemory() {
  const colors = useColors();
  const navigate = useNavigate();
  const { user } = useUser();
  const userId = user?.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      const memoryRes = await axios.get(`${API}/api/analytics/brand-memory?user_id=${userId}`);
      setData(memoryRes.data);
    } catch (err) {
      console.error('Failed to load brand memory:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <TopBar title="Brand Memory" subtitle="Your brand's intelligence layer" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </DashboardLayout>
    );
  }

  const memoryScore = data?.memory_score || 0;
  const fields = data?.fields || {};
  const identity = data?.identity || {};
  const utilization = data?.utilization || {};

  const scoreColor = memoryScore >= 80 ? '#22c55e' : memoryScore >= 50 ? '#3b82f6' : memoryScore >= 25 ? '#f59e0b' : '#ef4444';

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (memoryScore / 100) * circumference;

  return (
    <DashboardLayout>
      <TopBar title="Brand Memory" subtitle="Your brand's intelligence layer" />

      <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>

          {/* Memory Score */}
          <div style={{
            background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175,0,36,0.08))`,
            border: `1px solid ${colors.tuscany}22`,
            borderRadius: 20, padding: '36px', textAlign: 'center', marginBottom: 24
          }}>
            <div style={{ display: 'inline-block', position: 'relative', marginBottom: 20 }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="90" fill="none" stroke={`${colors.tuscany}15`} strokeWidth="8" />
                <circle
                  cx="100" cy="100" r="90" fill="none"
                  stroke={scoreColor} strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', textAlign: 'center'
              }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1 }}>
                  {memoryScore}
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>Memory Score</div>
              </div>
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: colors.textPrimary, marginBottom: 8 }}>
              Brand Memory {memoryScore >= 80 ? 'Complete' : memoryScore >= 50 ? 'Growing' : 'Building'}
            </h3>
            <p style={{ fontSize: 13, color: colors.textMuted, maxWidth: 500, margin: '0 auto' }}>
              {memoryScore >= 80
                ? 'Your brand memory is rich and comprehensive. AI generations will be highly personalized.'
                : memoryScore >= 50
                  ? 'Good progress! Fill in the remaining fields to unlock maximum AI personalization.'
                  : 'Start building your brand foundation. The more you add, the smarter your AI content becomes.'}
            </p>
          </div>

          {/* Foundation Fields */}
          <div style={{
            background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175,0,36,0.06))`,
            border: `1px solid ${colors.tuscany}22`,
            borderRadius: 16, padding: '24px', marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Brain size={20} style={{ color: colors.cinnabar }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>Foundation Fields</span>
              <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: 'auto' }}>
                {Object.values(fields).filter(f => f.filled).length}/{Object.keys(fields).length} complete
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {Object.entries(fields).map(([key, field]) => (
                <div
                  key={key}
                  data-testid={`memory-field-${key}`}
                  onClick={() => navigate('/brand-foundation')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', borderRadius: 10,
                    background: field.filled ? `${colors.cinnabar}08` : colors.darkest,
                    border: `1px solid ${field.filled ? colors.cinnabar + '22' : colors.tuscany + '11'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.cinnabar + '44';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = field.filled ? colors.cinnabar + '22' : colors.tuscany + '11';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {field.filled
                    ? <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
                    : <Circle size={18} style={{ color: colors.textMuted, flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: field.filled ? colors.textPrimary : colors.textMuted }}>
                      {field.label}
                    </div>
                    <div style={{ fontSize: 10, color: field.filled ? '#22c55e' : colors.textMuted }}>
                      {field.filled ? 'Stored in memory' : 'Click to define'}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: colors.textMuted, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>

          {/* Identity + Utilization */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Identity Status */}
            <div style={{
              background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175,0,36,0.06))`,
              border: `1px solid ${colors.tuscany}22`,
              borderRadius: 16, padding: '24px',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 16 }}>
                Visual Identity
              </div>
              {[
                { label: 'Color Palette', done: identity.colors_defined, desc: identity.colors_defined ? 'Defined' : 'Not set', section: 'colors' },
                { label: 'Typography', done: identity.fonts_set, desc: identity.fonts_set ? 'Selected' : 'Not set', section: 'typography' },
                { label: 'Brand Assets', done: identity.assets_uploaded > 0, desc: `${identity.assets_uploaded || 0} uploaded`, section: 'assets' },
              ].map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => navigate('/identity-studio')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', 
                    marginBottom: i < 2 ? 8 : 0,
                    borderRadius: 10,
                    background: item.done ? 'transparent' : `${colors.cinnabar}08`,
                    border: `1px solid ${item.done ? 'transparent' : colors.cinnabar + '22'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${colors.cinnabar}15`;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = item.done ? 'transparent' : `${colors.cinnabar}08`;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  {item.done
                    ? <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
                    : <Circle size={16} style={{ color: colors.cinnabar }} />
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: colors.textPrimary }}>{item.label}</div>
                    {!item.done && (
                      <div style={{ fontSize: 10, color: colors.cinnabar }}>Click to set up</div>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: item.done ? '#22c55e' : colors.textMuted }}>{item.desc}</span>
                  <ChevronRight size={16} style={{ color: colors.textMuted }} />
                </div>
              ))}
            </div>

            {/* Utilization */}
            <div style={{
              background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175,0,36,0.06))`,
              border: `1px solid ${colors.tuscany}22`,
              borderRadius: 16, padding: '24px',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 16 }}>
                Memory Utilization
              </div>
              {[
                { icon: FileText, label: 'Content Generated', value: utilization.content_generated || 0, color: '#22c55e' },
                { icon: Image, label: 'Media Generated', value: utilization.media_generated || 0, color: '#3b82f6' },
                { icon: Sparkles, label: 'AI Generations (Month)', value: utilization.ai_generations_this_month || 0, color: '#e04e35' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0', borderBottom: i < 2 ? `1px solid ${colors.tuscany}11` : 'none',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${item.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <item.icon size={16} style={{ color: item.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: colors.textPrimary }}>{item.label}</div>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic OS Variables Section */}
          <BrandMemoryOSVariables />
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  );
}
