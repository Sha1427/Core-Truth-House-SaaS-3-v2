import React from 'react';
import { DashboardLayout, TopBar } from '../components/Layout';
import { useColors } from '../context/ThemeContext';
import {
  Rocket,
  AlertTriangle,
  Calendar,
  Target,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

function LaunchPlannerContent() {
  const colors = useColors();

  const nextSteps = [
    {
      title: 'Use Campaign Builder instead',
      description: 'Launch Planner is offline. Build your active rollout inside Campaign Builder for now.',
      path: '/campaign-builder',
    },
    {
      title: 'Map your launch sequence in Strategic OS',
      description: 'Document positioning, messaging, and execution order before you publish.',
      path: '/strategic-os',
    },
    {
      title: 'Prepare assets in Content Studio',
      description: 'Create the emails, posts, and media assets you need before launch week.',
      path: '/content-studio',
    },
  ];

  return (
    <DashboardLayout>
      <TopBar
        title="Launch Planner"
        subtitle="This module is temporarily offline while the backend contract is rebuilt."
      />

      <div className="flex-1 overflow-auto px-4 py-4 md:px-7 md:py-6">
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: 20 }}>
          <div
            style={{
              background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.08))`,
              border: `1px solid ${colors.crimson}33`,
              borderRadius: 18,
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'rgba(224, 78, 53, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={24} style={{ color: colors.cinnabar }} />
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 24,
                    lineHeight: 1.2,
                    color: colors.textPrimary,
                    marginBottom: 10,
                  }}
                >
                  Launch Planner is unavailable right now
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.75,
                    color: colors.textMuted,
                    maxWidth: 760,
                  }}
                >
                  This page has been disabled because its old backend endpoints are no longer live.
                  Instead of showing broken launch data or saving to dead routes, this screen now
                  points you to the current working tools.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.1fr 0.9fr',
              gap: 20,
            }}
          >
            <div
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.tuscany}22`,
                borderRadius: 18,
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <Rocket size={18} style={{ color: colors.cinnabar }} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: colors.textPrimary,
                  }}
                >
                  What changed
                </span>
              </div>

              <div style={{ display: 'grid', gap: 14 }}>
                {[
                  'The previous Launch Planner page depended on legacy /api/launches endpoints.',
                  'Those routes are not part of the current mounted backend surface.',
                  'This module needs a full rebuild against the current Campaigns and Strategic OS contracts.',
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: colors.darkest,
                      border: `1px solid ${colors.border}`,
                      color: colors.textMuted,
                      fontSize: 13,
                      lineHeight: 1.7,
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: colors.cardBg,
                border: `1px solid ${colors.tuscany}22`,
                borderRadius: 18,
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <Sparkles size={18} style={{ color: colors.cinnabar }} />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: colors.textPrimary,
                  }}
                >
                  Use these instead
                </span>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {nextSteps.map((item) => (
                  <a
                    key={item.path}
                    href={item.path}
                    style={{
                      display: 'block',
                      textDecoration: 'none',
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: colors.darkest,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          color: colors.textPrimary,
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {item.title}
                      </span>
                      <ChevronRight size={14} style={{ color: colors.textMuted }} />
                    </div>
                    <div
                      style={{
                        color: colors.textMuted,
                        fontSize: 12,
                        lineHeight: 1.65,
                      }}
                    >
                      {item.description}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              background: `linear-gradient(180deg, ${colors.cardBg}, rgba(175, 0, 36, 0.04))`,
              border: `1px solid ${colors.tuscany}22`,
              borderRadius: 18,
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <Calendar size={18} style={{ color: colors.cinnabar }} />
              <Target size={18} style={{ color: colors.cinnabar }} />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: colors.textPrimary,
                }}
              >
                Recommended temporary workflow
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                {
                  step: '1',
                  title: 'Strategic OS',
                  text: 'Clarify the offer, message, audience, and timing.',
                },
                {
                  step: '2',
                  title: 'Content Studio',
                  text: 'Create launch assets before the rollout starts.',
                },
                {
                  step: '3',
                  title: 'Campaign Builder',
                  text: 'Track the active promotion inside a live campaign.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    padding: '16px',
                    borderRadius: 14,
                    background: colors.darkest,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      background: `${colors.cinnabar}22`,
                      color: colors.cinnabar,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    {item.step}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: colors.textPrimary,
                      marginBottom: 6,
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.65,
                      color: colors.textMuted,
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function LaunchPlanner() {
  return <LaunchPlannerContent />;
}
