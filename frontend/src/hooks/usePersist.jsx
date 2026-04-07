/**
 * usePersist.js
 * CTH OS — Universal Auto-Save + Load Hook
 *
 * Demo mode rules:
 * - reads return seeded demo data
 * - writes never hit live persistence
 * - reset returns to demo seed data
 *
 * Production rules:
 * - reads and writes use the shared apiClient
 * - workspace scoping is handled by the shared client/header flow
 */

import { useState, useEffect, useRef, useCallback } from "react";
import apiClient from "../lib/apiClient";
import { useDemoMode } from "../context/DemoModeContext";

const DEBOUNCE_MS = 800;
const SAVED_FLASH = 2500;

export function usePersist(endpoint, defaults = {}, options = {}) {
  const { autoSave = true, onLoad = null, onSave = null } = options;
  const {
    isDemoMode,
    getDemoData,
    isWriteBlocked,
    getDemoWriteResponse,
  } = useDemoMode();

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

  const clearSavedFlash = useCallback(() => {
    window.setTimeout(() => setSaved(false), SAVED_FLASH);
  }, []);

  const applyLoadedData = useCallback(
    (loaded) => {
      if (loaded && typeof loaded === "object" && Object.keys(loaded).length > 0) {
        const merged = { ...defaults, ...loaded };
        setData(merged);
        if (onLoad) onLoad(loaded);
      } else {
        setData(defaults);
      }

      setDirty(false);
      setLoadErr(null);
    },
    [defaults, onLoad]
  );

  useEffect(() => {
    if (!endpoint) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadErr(null);

      try {
        if (isDemoMode) {
          const seedData = getDemoData(endpoint);
          if (!cancelled) {
            applyLoadedData(seedData || defaults);
            setLoading(false);
          }
          return;
        }

        const loaded = await apiClient.get(endpoint);

        if (!cancelled) {
          applyLoadedData(loaded || defaults);
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;

        if (err?.status === 404) {
          setData(defaults);
          setDirty(false);
          setLoadErr(null);
        } else {
          setLoadErr(err?.message || "Failed to load data");
        }

        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [endpoint, defaults, isDemoMode, getDemoData, applyLoadedData]);

  const save = useCallback(
    async (overrideData) => {
      const toSave = overrideData || latestData.current;

      if (!endpoint) return false;

      if (isWriteBlocked("POST")) {
        setSaving(true);
        setSaved(false);
        setError(null);

        await new Promise((resolve) => setTimeout(resolve, 250));

        const demoResponse = getDemoWriteResponse(toSave);

        setSaving(false);
        setSaved(true);
        setDirty(false);

        if (onSave) onSave(demoResponse);
        clearSavedFlash();

        return true;
      }

      setSaving(true);
      setSaved(false);
      setError(null);

      try {
        const response = await apiClient.post(endpoint, toSave);

        setSaving(false);
        setSaved(true);
        setDirty(false);

        if (onSave) onSave(response);
        clearSavedFlash();

        return true;
      } catch (err) {
        setSaving(false);
        setError(err?.message || "Save failed");
        return false;
      }
    },
    [
      endpoint,
      isWriteBlocked,
      getDemoWriteResponse,
      onSave,
      clearSavedFlash,
    ]
  );

  const queueAutoSave = useCallback(
    (next) => {
      if (!autoSave) return;

      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void save(next);
      }, DEBOUNCE_MS);
    },
    [autoSave, save]
  );

  const setField = useCallback(
    (key, value) => {
      setData((prev) => {
        const next = { ...prev, [key]: value };
        latestData.current = next;
        queueAutoSave(next);
        return next;
      });

      setDirty(true);
      setSaved(false);
    },
    [queueAutoSave]
  );

  const setFields = useCallback(
    (updates) => {
      setData((prev) => {
        const next = { ...prev, ...updates };
        latestData.current = next;
        queueAutoSave(next);
        return next;
      });

      setDirty(true);
      setSaved(false);
    },
    [queueAutoSave]
  );

  const reset = useCallback(async () => {
    clearTimeout(debounceRef.current);
    setDirty(false);
    setError(null);

    try {
      if (isDemoMode) {
        const seedData = getDemoData(endpoint) || defaults;
        applyLoadedData(seedData);
        return;
      }

      const loaded = await apiClient.get(endpoint);
      applyLoadedData(loaded || defaults);
    } catch (err) {
      if (err?.status === 404) {
        setData(defaults);
        setDirty(false);
        return;
      }

      setError(err?.message || "Reset failed");
    }
  }, [endpoint, defaults, isDemoMode, getDemoData, applyLoadedData]);

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
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
        </svg>
        <span className="text-[11px] text-red-400">{persist.error}</span>
        <button
          onClick={() => persist.save()}
          className="text-[10.5px] text-[#E04E35] underline bg-transparent border-none cursor-pointer"
        >
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
        <button
          onClick={() => persist.save()}
          className="text-[11px] text-[#E04E35] px-2.5 py-0.5 rounded-md border border-[#E04E35]/30 bg-transparent cursor-pointer hover:bg-[#E04E35]/10 transition-colors"
        >
          Save now
        </button>
      </div>
    );
  }

  return <span className="text-[11px] text-white/20">All changes saved</span>;
}

export default usePersist;
