/**
 * usePersist.js — DEMO MODE PATCH
 * CTH OS — Universal Auto-Save + Load Hook
 *
 * CHANGES FROM ORIGINAL:
 *   - Imports useDemoMode from DemoModeContext
 *   - In LOAD: if isDemoMode, returns demo seed data instead of API call
 *   - In SAVE: if isDemoMode, silently drops the save (no API call, no error)
 *   - Everything else is identical to the original
 *
 * ORIGINAL BEHAVIOR is fully preserved when REACT_APP_DEMO_MODE is not 'true'.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useWorkspace } from '../context/WorkspaceContext';
import { useDemoMode } from '../context/DemoModeContext';

const API = import.meta.env.VITE_BACKEND_URL;
const DEBOUNCE_MS = 800;
const SAVED_FLASH = 2500;

export function usePersist(endpoint, defaults = {}, options = {}) {
  const { autoSave = true, onLoad = null, onSave = null } = options;
  const { activeWorkspace } = useWorkspace();
  const workspaceId = activeWorkspace?.id || '';

  // ── DEMO MODE INTERCEPT ───────────────────────────────────────
  const { isDemoMode, getDemoData } = useDemoMode();

  // Data state
  const [data, setData] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const [loadErr, setLoadErr] = useState(null);

  const debounceRef = useRef(null);
  const latestData = useRef(data);

  useEffect(() => {
    latestData.current = data;
  }, [data]);

  // ── LOAD ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!endpoint) return;

    setLoading(true);
    setLoadErr(null);

    // DEMO MODE: return seed data, never call the API
    if (isDemoMode) {
      const seedData = getDemoData(endpoint);
      if (seedData && Object.keys(seedData).length > 0) {
        setData({ ...defaults, ...seedData });
        if (onLoad) onLoad(seedData);
      }
      setLoading(false);
      setDirty(false);
      return;
    }

    // PRODUCTION: normal API call
    const url = `${API}${endpoint}${endpoint.includes('?') ? '&' : '?'}workspace_id=${workspaceId}`;

    axios.get(url)
      .then(res => {
        const loaded = res.data;
        if (loaded && Object.keys(loaded).length > 0) {
          setData({ ...defaults, ...loaded });
          if (onLoad) onLoad(loaded);
        }
        setLoading(false);
        setDirty(false);
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setLoading(false);
        } else {
          setLoadErr(err.response?.data?.detail || 'Failed to load data');
          setLoading(false);
        }
      });
  }, [workspaceId, endpoint, isDemoMode]);

  // ── SAVE ──────────────────────────────────────────────────────
  const save = useCallback((overrideData) => {
    const toSave = overrideData || latestData.current;

    // DEMO MODE: silently pretend to save — no API call, no error
    if (isDemoMode) {
      setSaving(true);
      setSaved(false);
      setTimeout(() => {
        setSaving(false);
        setSaved(true);
        setDirty(false);
        setTimeout(() => setSaved(false), SAVED_FLASH);
      }, 400); // slight delay to feel realistic
      return Promise.resolve(true);
    }

    // PRODUCTION: normal save
    setSaving(true);
    setSaved(false);
    setError(null);

    const url = `${API}${endpoint}${endpoint.includes('?') ? '&' : '?'}workspace_id=${workspaceId}`;

    return axios.post(url, toSave)
      .then(res => {
        setSaving(false);
        setSaved(true);
        setDirty(false);
        if (onSave) onSave(res.data);
        setTimeout(() => setSaved(false), SAVED_FLASH);
        return true;
      })
      .catch(err => {
        setSaving(false);
        setError(err.response?.data?.detail || 'Save failed');
        return false;
      });
  }, [workspaceId, endpoint, onSave, isDemoMode]);

  // ── SET FIELD ─────────────────────────────────────────────────
  const setField = useCallback((key, value) => {
    setData(prev => {
      const next = { ...prev, [key]: value };
      latestData.current = next;

      if (autoSave) {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          save(next);
        }, DEBOUNCE_MS);
      }

      return next;
    });
    setDirty(true);
    setSaved(false);
  }, [autoSave, save]);

  const setFields = useCallback((updates) => {
    setData(prev => {
      const next = { ...prev, ...updates };
      latestData.current = next;

      if (autoSave) {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          save(next);
        }, DEBOUNCE_MS);
      }

      return next;
    });
    setDirty(true);
    setSaved(false);
  }, [autoSave, save]);

  const reset = useCallback(() => {
    clearTimeout(debounceRef.current);
    setDirty(false);
    setError(null);

    if (isDemoMode) {
      const seedData = getDemoData(endpoint);
      if (seedData) setData({ ...defaults, ...seedData });
      return;
    }

    const url = `${API}${endpoint}${endpoint.includes('?') ? '&' : '?'}workspace_id=${workspaceId}`;
    axios.get(url)
      .then(res => {
        if (res.data) setData({ ...defaults, ...res.data });
      })
      .catch(() => {});
  }, [endpoint, defaults, workspaceId, isDemoMode, getDemoData]);

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return {
    data,
    setField,
    setFields,
    setData,
    save,
    reset,
    loading,
    saving,
    saved,
    dirty,
    error,
    loadErr,
  };
}

// ── SAVE STATUS BAR ───────────────────────────────────────────
export function SaveStatusBar({ persist }) {
  if (persist.loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border-2 border-[#E04E35]/30 border-t-[#E04E35] animate-spin" />
        <span className="text-[11px] text-white/35">Loading...</span>
      </div>
    );
  }

  if (persist.error) {
    return (
      <div className="flex items-center gap-2">
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
        </svg>
        <span className="text-[11px] text-red-400">{persist.error}</span>
        <button onClick={() => persist.save()} className="text-[10.5px] text-[#E04E35] underline bg-transparent border-none cursor-pointer">
          Retry
        </button>
      </div>
    );
  }

  if (persist.saving) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border-2 border-[#E04E35]/30 border-t-[#E04E35] animate-spin" />
        <span className="text-[11px] text-white/40">Saving...</span>
      </div>
    );
  }

  if (persist.saved) {
    return (
      <div className="flex items-center gap-1.5">
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
        <span className="text-[11px] text-green-500">Saved</span>
      </div>
    );
  }

  if (persist.dirty) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span className="text-[11px] text-white/30">Unsaved changes</span>
        <button onClick={() => persist.save()} className="text-[11px] text-[#E04E35] px-2.5 py-0.5 rounded-md border border-[#E04E35]/30 bg-transparent cursor-pointer hover:bg-[#E04E35]/10 transition-colors">
          Save now
        </button>
      </div>
    );
  }

  return <span className="text-[11px] text-white/20">All changes saved</span>;
}

export default usePersist;
