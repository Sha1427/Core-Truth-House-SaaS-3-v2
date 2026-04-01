import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../context/PlanContext';
import { useColors } from '../context/ThemeContext';
import { DashboardLayout } from './Layout';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { getRoute, PLAN_LABELS } from '../config/routeConfig';
import { PLAN_INFO } from '../config/planAccess';

/**
 * Route-level gate that blocks access to pages
 * the user's plan doesn't include.
 */
export function PlanGate({ route, children }) {
  const { canAccess, getUpgradeInfo, loading, isSuperAdmin } = usePlan();
  const colors = useColors();
  const navigate = useNavigate();

  if (loading) return null;

  // Get route config to check for superAdminOnly flag
  const routeConfig = getRoute(route);

  // Block access if route is superAdminOnly and user is not super admin
  if ((route === '/admin' || routeConfig?.superAdminOnly) && !isSuperAdmin) {
    return (
      <DashboardLayout>
        <div data-testid="admin-gate-page" className="flex-1 flex items-center justify-center p-6 md:p-10">
          <div className="text-center">
            <Lock size={48} style={{ color: colors.cinnabar, marginBottom: 20 }} />
            <h1 className="text-xl md:text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: colors.textPrimary }}>Admin Access Only</h1>
            <p className="text-sm mb-6" style={{ color: colors.textMuted }}>This area is restricted to the Super Admin.</p>
            <button onClick={() => navigate('/dashboard')} className="px-6 py-3 rounded-xl text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #af0024, #e04e35)' }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (canAccess(route)) {
    return children;
  }

  const routeInfo = getRoute(route);
  const upgrade = getUpgradeInfo(route);
  const planLabel = routeInfo?.requiredPlan ? PLAN_LABELS[routeInfo.requiredPlan] || upgrade?.name : 'a higher plan';

  return (
    <DashboardLayout>
      <div data-testid="plan-gate-page" className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-auto">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl flex items-center justify-center mx-auto mb-5 md:mb-6" style={{ background: 'linear-gradient(135deg, rgba(175,0,36,0.2), rgba(224,78,53,0.15))' }}>
            <Lock size={28} style={{ color: colors.cinnabar }} />
          </div>

          <h1 className="text-2xl md:text-[28px] font-bold mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: colors.textPrimary }}>
            Upgrade to Unlock
          </h1>

          <p className="text-sm md:text-[15px] leading-relaxed mb-6 md:mb-8" style={{ color: colors.textMuted }}>
            {routeInfo?.lockedTooltip || (
              <>This feature is available on <strong style={{ color: colors.cinnabar }}>{planLabel}</strong> and above. Upgrade to access all the tools you need to grow your brand.</>
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button data-testid="plan-gate-upgrade-btn" onClick={() => navigate('/billing')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #af0024, #e04e35)', letterSpacing: '0.02em' }}>
              <Sparkles size={16} /> View Plans & Upgrade <ArrowRight size={16} />
            </button>
            <button data-testid="plan-gate-back-btn" onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded-xl text-sm" style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textMuted }}>
              Back to Dashboard
            </button>
          </div>

          {/* Plan comparison */}
          <div className="mt-8 md:mt-10 p-4 md:p-5 rounded-xl text-left" style={{ background: `${colors.tuscany}08`, border: `1px solid ${colors.tuscany}15` }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: colors.tuscany }}>
              Plan Highlights
            </div>
            {Object.entries(PLAN_INFO)
              .filter(([k]) => k !== 'free' && k !== 'audit')
              .sort((a, b) => a[1].order - b[1].order)
              .map(([key, info]) => (
                <div key={key} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${colors.border}`, opacity: info.order < (upgrade?.order || 0) ? 0.4 : 1 }}>
                  <span className="text-[13px] font-medium" style={{ color: colors.textPrimary, fontWeight: key === upgrade?.plan ? 700 : 400 }}>
                    {key === upgrade?.plan ? '-> ' : ''}{info.name}
                  </span>
                  <span className="text-[13px]" style={{ color: colors.textMuted }}>${info.price}/mo</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
