/**
 * BrandMemoryOSVariables.jsx
 * CTH OS — Brand Memory Strategic OS Variables
 *
 * Full replacement:
 * - auto-load + auto-save via usePersist
 * - backward-compatible with legacy os_variables shape
 * - grouped strategic inputs for Strategic OS readiness
 */

import { useMemo, useState } from 'react';
import { usePersist, SaveStatusBar } from '../../hooks/usePersist';
import {
  ChevronDown,
  ChevronUp,
  Target,
  Users,
  Globe,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  Rocket,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// FIELD DEFINITIONS
// ─────────────────────────────────────────────────────────────

const FIELD_GROUPS = [
  {
    id: 'offers',
    label: 'Offers & Unique Mechanism',
    icon: Target,
    fields: [
      {
        id: 'primary_offer',
        label: 'Primary Offer',
        required: true,
        placeholder: 'Your main product/service offering',
        type: 'input',
      },
      {
        id: 'secondary_offers',
        label: 'Secondary Offers',
        required: false,
        placeholder: 'Other products/services',
        type: 'input',
      },
      {
        id: 'unique_mechanism',
        label: 'Unique Mechanism',
        required: true,
        placeholder: 'What makes your approach different?',
        type: 'textarea',
        rows: 2,
      },
    ],
  },
  {
    id: 'audience',
    label: 'Audience & Strengths',
    icon: Users,
    fields: [
      {
        id: 'audience_problem',
        label: 'Audience Problem',
        required: true,
        placeholder: 'What pain point does your audience have?',
        type: 'textarea',
        rows: 2,
      },
      {
        id: 'audience_desire',
        label: 'Audience Desire',
        required: true,
        placeholder: 'What outcome does your audience want?',
        type: 'textarea',
        rows: 2,
      },
      {
        id: 'brand_strengths',
        label: 'Brand Strengths',
        required: false,
        placeholder: 'What are your unique strengths?',
        type: 'textarea',
        rows: 2,
      },
      {
        id: 'founder_background',
        label: 'Founder Background',
        required: false,
        placeholder: 'Relevant experience or credentials',
        type: 'textarea',
        rows: 2,
      },
    ],
  },
  {
    id: 'competitors',
    label: 'Competitors',
    icon: AlertTriangle,
    fields: [
      {
        id: 'competitor_1',
        label: 'Competitor 1',
        required: false,
        placeholder: 'Main competitor name/brand',
        type: 'input',
      },
      {
        id: 'competitor_2',
        label: 'Competitor 2',
        required: false,
        placeholder: 'Second competitor',
        type: 'input',
      },
      {
        id: 'competitor_3',
        label: 'Competitor 3',
        required: false,
        placeholder: 'Third competitor',
        type: 'input',
      },
    ],
  },
  {
    id: 'platforms',
    label: 'Platforms',
    icon: Globe,
    fields: [
      {
        id: 'platforms',
        label: 'Platforms',
        required: true,
        placeholder: null,
        type: 'platforms',
      },
    ],
  },
  {
    id: 'goals',
    label: 'Goals & Revenue',
    icon: TrendingUp,
    fields: [
      {
        id: 'growth_goal',
        label: 'Growth Goal',
        required: true,
        placeholder: 'What is your primary growth objective?',
        type: 'input',
      },
      {
        id: 'revenue_goal',
        label: 'Revenue Goal',
        required: true,
        placeholder: 'Your revenue target (e.g. $10K MRR)',
        type: 'input',
      },
    ],
  },
  {
    id: 'content',
    label: 'Content & Strategy',
    icon: MessageSquare,
    fields: [
      {
        id: 'content_style',
        label: 'Content Style',
        required: false,
        placeholder: 'How would you describe your content style?',
        type: 'textarea',
        rows: 2,
      },
      {
        id: 'posting_frequency',
        label: 'Posting Frequency',
        required: false,
        placeholder: 'How often do you post?',
        type: 'input',
      },
    ],
  },
  {
    id: 'brand',
    label: 'Brand Voice & Identity',
    icon: Rocket,
    fields: [
      {
        id: 'voice',
        label: 'Brand Voice',
        required: true,
        placeholder: 'How does your brand sound? e.g. professional, friendly, bold',
        type: 'textarea',
        rows: 2,
      },
      {
        id: 'brand_name',
        label: 'Brand Name',
        required: true,
        placeholder: 'Your brand or company name',
        type: 'input',
      },
      {
        id: 'tagline',
        label: 'Tagline',
        required: false,
        placeholder: 'Your brand tagline or slogan',
        type: 'input',
      },
    ],
  },
];

const ALL_FIELDS = FIELD_GROUPS.flatMap((group) => group.fields);
const REQUIRED_FIELDS = ALL_FIELDS.filter((field) => field.required);

const PLATFORM_OPTIONS = [
  'Instagram',
  'LinkedIn',
  'X (Twitter)',
  'TikTok',
  'YouTube',
  'Facebook',
  'Email',
  'Blog',
  'Podcast',
];

const C = {
  accent: '#E04E35',
  bg: '#0D0010',
  panel: '#1A0020',
  border: 'rgba(255,255,255,0.07)',
  t60: 'rgba(255,255,255,0.6)',
  t40: 'rgba(255,255,255,0.4)',
  t25: 'rgba(255,255,255,0.25)',
  t10: 'rgba(255,255,255,0.1)',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  font: "'DM Sans', sans-serif",
};

function hasValue(field, value) {
  if (field.type === 'platforms') return Array.isArray(value) && value.length > 0;
  return !!String(value ?? '').trim();
}

function getSafeData(rawData) {
  if (!rawData || typeof rawData !== 'object') return {};

  const merged =
    rawData.os_variables && typeof rawData.os_variables === 'object'
      ? { ...rawData, ...rawData.os_variables }
      : rawData;

  return {
    ...merged,
    platforms: Array.isArray(merged.platforms) ? merged.platforms : [],
  };
}

export default function BrandMemoryOSVariables() {
  const [expandedGroups, setExpandedGroups] = useState({
    offers: true,
    audience: true,
    brand: true,
  });

  const persist = usePersist('/api/persist/brand-memory', {}, { autoSave: true });

  const { data: rawData, setField, loading } = persist;

  const data = useMemo(() => getSafeData(rawData), [rawData]);

  const completion = useMemo(() => {
    const filled = REQUIRED_FIELDS.filter((field) => hasValue(field, data[field.id])).length;
    const total = REQUIRED_FIELDS.length;
    const percent = total > 0 ? Math.round((filled / total) * 100) : 0;

    return { filled, total, percent };
  }, [data]);

  const missingRequired = useMemo(() => {
    return REQUIRED_FIELDS.filter((field) => !hasValue(field, data[field.id]));
  }, [data]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const togglePlatform = (platform) => {
    const current = Array.isArray(data.platforms) ? data.platforms : [];
    const updated = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform];

    setField('platforms', updated);
  };

  const getGroupStats = (group) => {
    const filled = group.fields.filter((field) => hasValue(field, data[field.id])).length;
    const required = group.fields.filter((field) => field.required).length;
    const requiredFilled = group.fields.filter(
      (field) => field.required && hasValue(field, data[field.id])
    ).length;

    return { filled, total: group.fields.length, required, requiredFilled };
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: C.t40 }}>
        <div
          style={{
            width: 24,
            height: 24,
            margin: '0 auto',
            borderRadius: '50%',
            border: '2px solid rgba(224,78,53,0.3)',
            borderTopColor: C.accent,
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ fontSize: 12, marginTop: 12, fontFamily: C.font }}>Loading Brand Memory...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: C.font }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              fontFamily: 'Georgia, serif',
            }}
          >
            Strategic OS Variables
          </h3>
          <p style={{ fontSize: 11.5, color: C.t40, margin: '4px 0 0' }}>
            Configure your brand variables for AI-powered strategy generation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <SaveStatusBar persist={persist} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 8,
              background:
                completion.percent >= 80 ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                completion.percent >= 80 ? 'rgba(34,197,94,0.3)' : C.border
              }`,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: completion.percent >= 80 ? C.green : '#fff',
              }}
            >
              {completion.percent}%
            </span>
            <span style={{ fontSize: 10.5, color: C.t40 }}>Complete</span>
          </div>
        </div>
      </div>

      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: C.t10,
          marginBottom: 14,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${completion.percent}%`,
            background: completion.percent >= 80 ? C.green : C.accent,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div
        style={{
          marginBottom: 24,
          padding: '10px 12px',
          borderRadius: 10,
          background: missingRequired.length === 0 ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${
            missingRequired.length === 0 ? 'rgba(34,197,94,0.18)' : 'rgba(245,158,11,0.18)'
          }`,
        }}
      >
        {missingRequired.length === 0 ? (
          <p style={{ margin: 0, fontSize: 11.5, color: C.green }}>
            All required Strategic OS variables are filled in.
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 11.5, color: C.amber, lineHeight: 1.5 }}>
            Missing required fields: {missingRequired.map((field) => field.label).join(', ')}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FIELD_GROUPS.map((group) => {
          const Icon = group.icon;
          const isOpen = !!expandedGroups[group.id];
          const stats = getGroupStats(group);

          return (
            <div
              key={group.id}
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(224,78,53,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} style={{ color: C.accent }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                      {group.label}
                    </span>
                    <span style={{ fontSize: 10.5, color: C.t40 }}>
                      {stats.filled}/{stats.total}
                    </span>
                    {stats.required > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          color:
                            stats.requiredFilled === stats.required ? C.green : C.amber,
                        }}
                      >
                        required {stats.requiredFilled}/{stats.required}
                      </span>
                    )}
                  </div>
                </div>

                {isOpen ? (
                  <ChevronUp size={16} style={{ color: C.t40 }} />
                ) : (
                  <ChevronDown size={16} style={{ color: C.t40 }} />
                )}
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: '0 16px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  {group.fields.map((field) => {
                    const value =
                      field.type === 'platforms'
                        ? Array.isArray(data[field.id])
                          ? data[field.id]
                          : []
                        : data[field.id] || '';

                    const isMissing = field.required && !hasValue(field, value);

                    return (
                      <div key={field.id}>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: isMissing ? C.amber : C.t40,
                            marginBottom: 6,
                          }}
                        >
                          {field.label}
                          {field.required && <span style={{ color: C.accent }}>*</span>}
                        </label>

                        {field.type === 'platforms' ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {PLATFORM_OPTIONS.map((platform) => {
                              const selected =
                                Array.isArray(data.platforms) && data.platforms.includes(platform);

                              return (
                                <button
                                  key={platform}
                                  type="button"
                                  onClick={() => togglePlatform(platform)}
                                  style={{
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    border: `1px solid ${
                                      selected ? 'rgba(224,78,53,0.5)' : C.border
                                    }`,
                                    background: selected
                                      ? 'rgba(224,78,53,0.15)'
                                      : 'transparent',
                                    color: selected ? '#fff' : C.t60,
                                    fontSize: 11.5,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {platform}
                                </button>
                              );
                            })}
                          </div>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            value={value}
                            onChange={(e) => setField(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            rows={field.rows || 2}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: 8,
                              border: `1px solid ${isMissing ? 'rgba(245,158,11,0.35)' : C.border}`,
                              background: 'rgba(255,255,255,0.03)',
                              color: '#fff',
                              fontSize: 13,
                              fontFamily: C.font,
                              resize: 'vertical',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setField(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: 8,
                              border: `1px solid ${isMissing ? 'rgba(245,158,11,0.35)' : C.border}`,
                              background: 'rgba(255,255,255,0.03)',
                              color: '#fff',
                              fontSize: 13,
                              fontFamily: C.font,
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
