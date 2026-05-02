/**
 * useCampaignContext.jsx
 * CTH OS — Campaign Builder Strategic OS Pre-Population Hook
 *
 * On Campaign Builder mount, fetches the aggregated Strategic OS
 * context from the API and pre-populates the new campaign form.
 */

import { useState, useEffect } from 'react'

const API = `${import.meta.env.VITE_BACKEND_URL}/api`;

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useCampaignContext(userId, workspaceId) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prefilled, setPrefilled] = useState([]);
  const [source, setSource] = useState({});
  const [completionSummary, setCompletionSummary] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ user_id: userId });
    if (workspaceId) params.append('workspace_id', workspaceId);

    fetch(`${API}/campaign-builder/strategic-context?${params}`)
      .then(r => {
        if (!r.ok) throw new Error('Could not load strategic context');
        return r.json();
      })
      .then(ctx => {
        setData(ctx.data || {});
        setPrefilled(ctx.prefilled_fields || []);
        setSource(ctx.field_sources || {});
        setCompletionSummary(ctx.completion_summary || {});
        setMessage(ctx.message || null);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [userId, workspaceId]);

  // Returns whether a specific field was pre-populated from Strategic OS
  function isPrefilledFrom(fieldName, stepName) {
    if (!prefilled.includes(fieldName)) return false;
    if (!stepName) return true;
    return source[fieldName] === stepName;
  }

  return {
    data,           // pre-populated campaign context data
    loading,        // true while loading
    error,          // error message or null
    prefilled,      // array of field names that were pre-populated
    source,         // map of field name → source step
    completionSummary,
    message,        // message about missing steps
    isPrefilledFrom,
  };
}

// ─────────────────────────────────────────────────────────────
// SOURCE BADGE
// Shows where a pre-populated field came from
// ─────────────────────────────────────────────────────────────

export function StrategicOSSourceBadge({ step = 'Strategic OS' }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold rounded-full px-2 py-0.5"
      style={{ 
        color: 'rgba(224,78,53,0.8)', 
        background: 'rgba(224,78,53,0.08)', 
        border: '1px solid rgba(224,78,53,0.18)' 
      }}>
      <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
      {step}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// CONTEXT BANNER
// Shows at top of new campaign form when data is pre-loaded
// ─────────────────────────────────────────────────────────────

export function CampaignOSContextBanner({ ctx, onViewOS, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (ctx.loading || ctx.error || dismissed) return null;
  
  // Show message for incomplete Strategic OS
  if (ctx.message) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl mb-5"
        style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--cth-status-warning)" strokeWidth="2" className="flex-shrink-0 mt-0.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-white m-0 mb-1">{ctx.message}</p>
          {onViewOS && (
            <button onClick={onViewOS} className="mt-1 text-[11px] font-medium" style={{ color: 'var(--cth-status-warning)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Go to Strategic OS →
            </button>
          )}
        </div>
      </div>
    );
  }
  
  if (ctx.prefilled.length === 0) return null;

  const count = ctx.prefilled.length;

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl mb-5"
      style={{ background: 'rgba(224,78,53,0.07)', border: '1px solid rgba(224,78,53,0.2)' }}>
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--cth-admin-accent)" strokeWidth="2" className="flex-shrink-0 mt-0.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
      <div className="flex-1">
        <p className="text-[12.5px] font-semibold text-white m-0 mb-1">
          {count} fields pre-filled from your Strategic OS
        </p>
        <p className="text-[11px] text-white/45 m-0 leading-relaxed">
          Your audience profile, positioning, platform strategy, and offer have been loaded automatically.
          Review and adjust anything that needs updating for this specific campaign.
        </p>
        {onViewOS && (
          <button onClick={onViewOS} className="mt-2 text-[11px] font-medium" style={{ color: 'var(--cth-admin-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            View Strategic OS →
          </button>
        )}
      </div>
      {onDismiss && (
        <button onClick={() => { setDismissed(true); if (onDismiss) onDismiss(); }} 
          className="text-white/25 text-lg leading-none p-1 cursor-pointer bg-transparent border-none hover:text-white/50">
          ×
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PREFILLED INPUT WRAPPER
// Wraps any form field to show source badge when pre-populated
// ─────────────────────────────────────────────────────────────

export function PrefilledField({ fieldName, ctx, label, stepLabel = 'Strategic OS', children }) {
  const isPrefilled = ctx.prefilled.includes(fieldName);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1.5">
        <label className="text-[10px] font-semibold tracking-widest uppercase text-white/35">
          {label}
        </label>
        {isPrefilled && <StrategicOSSourceBadge step={stepLabel} />}
      </div>
      {children}
      {isPrefilled && (
        <p className="text-[9.5px] text-white/20 mt-1">
          Loaded from Strategic OS · Edit to override for this campaign
        </p>
      )}
    </div>
  );
}

export default useCampaignContext;

