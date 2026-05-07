/**
 * usePersist.js
 * CTH OS — Universal Auto-Save + Load Hook
 *
 * - use shared apiClient for production reads/writes
 * - handle 404s more safely from Axios-style errors
 * - avoid stale save timers
 * - preserve shared workspace-header scoping through apiClient
 */

import { useState, useEffect, useRef, useCallback } from "react";
import apiClient from "../lib/apiClient";

const DEBOUNCE_MS = 800;
const SAVED_FLASH = 2500;

function getStatusCode(err) {
  return err?.status || err?.response?.status || err?.request?.status || null;
}

function getErrorMessage(err, fallback) {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

export function usePersist(endpoint, defaults = {}, options = {}) {
  const { autoSave = true, onLoad = null, onSave = null } = options;

  const [data, setData] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const [loadErr, setLoadErr] = useState(null);

  const debounceRef = useRef(null);
  const savedFlashRef = useRef(null);
  const latestData = useRef(data);

  useEffect(() => {
    latestData.current = data;
  }, [data]);

  const clearSavedFlash = useCallback(() => {
    clearTimeout(savedFlashRef.current);
    savedFlashRef.current = window.setTimeout(() => setSaved(false), SAVED_FLASH);
  }, []);

  const applyLoadedData = useCallback(
    (loaded) => {
      if (
        loaded &&
        typeof loaded === "object" &&
        !Array.isArray(loaded) &&
        Object.keys(loaded).length > 0
      ) {
        const merged = { ...defaults, ...loaded };
        setData(merged);
        latestData.current = merged;
        if (onLoad) onLoad(loaded);
      } else {
        setData(defaults);
        latestData.current = defaults;
      }

      setDirty(false);
      setLoadErr(null);
      setError(null);
    },
    [defaults, onLoad]
  );

  useEffect(() => {
    if (!endpoint) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadErr(null);

      try {
        const loaded = await apiClient.get(endpoint);

        if (!cancelled) {
          applyLoadedData(loaded || defaults);
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;

        const status = getStatusCode(err);

        if (status === 404) {
          setData(defaults);
          latestData.current = defaults;
          setDirty(false);
          setLoadErr(null);
        } else {
          setLoadErr(getErrorMessage(err, "Failed to load data"));
        }

        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [endpoint, defaults, applyLoadedData]);

  const save = useCallback(
    async (overrideData) => {
      const toSave = overrideData || latestData.current;

      if (!endpoint) return false;

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
        setError(getErrorMessage(err, "Save failed"));
        return false;
      }
    },
    [endpoint, onSave, clearSavedFlash]
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
      const loaded = await apiClient.get(endpoint);
      applyLoadedData(loaded || defaults);
    } catch (err) {
      const status = getStatusCode(err);

      if (status === 404) {
        setData(defaults);
        latestData.current = defaults;
        setDirty(false);
        return;
      }

      setError(getErrorMessage(err, "Reset failed"));
    }
  }, [endpoint, defaults, applyLoadedData]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      clearTimeout(savedFlashRef.current);
    };
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
        <div className="w-3 h-3 rounded-full border-2 border-[var(--cth-admin-accent)]/30 border-t-[var(--cth-admin-accent)] animate-spin" />
        <span className="text-[11px] text-white/35">Loading...</span>
      </div>
    );
  }

  if (persist.error) {
    return (
      <div className="flex items-center gap-2">
        <svg
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="var(--cth-status-danger)"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
        </svg>
        <span className="text-[11px] text-red-400">{persist.error}</span>
        <button
          onClick={() => persist.save()}
          className="text-[10.5px] text-[var(--cth-admin-accent)] underline bg-transparent border-none cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (persist.saving) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border-2 border-[var(--cth-admin-accent)]/30 border-t-[var(--cth-admin-accent)] animate-spin" />
        <span className="text-[11px] text-white/40">Saving...</span>
      </div>
    );
  }

  if (persist.saved) {
    return (
      <div className="flex items-center gap-1.5">
        <svg
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="var(--cth-status-success-bright)"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
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
          className="text-[11px] text-[var(--cth-admin-accent)] px-2.5 py-0.5 rounded-md border border-[var(--cth-admin-accent)]/30 bg-transparent cursor-pointer hover:bg-[var(--cth-admin-accent)]/10 transition-colors"
        >
          Save now
        </button>
      </div>
    );
  }

  return <span className="text-[11px] text-white/20">All changes saved</span>;
}

export default usePersist;
