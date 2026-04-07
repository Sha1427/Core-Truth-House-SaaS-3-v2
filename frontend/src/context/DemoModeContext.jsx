/**
 * DemoModeContext.jsx
 * CTH OS — Demo Mode Context
 *
 * Demo mode is a sealed showroom:
 * - reads return seeded demo data
 * - writes are intercepted and never sent to live persistence
 * - demo-only state uses separate storage keys
 */

import React, { createContext, useContext, useMemo } from "react";
import DEMO_SEED_DATA from "../data/demoSeedData";

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

const DEMO_STORAGE_KEYS = {
  state: "cth_demo_state",
  workspaceId: "cth_demo_workspace_id",
};

const DemoModeContext = createContext({
  isDemoMode: false,
  getDemoData: () => null,
  isWriteBlocked: () => false,
  getDemoWriteResponse: () => ({
    ok: true,
    demo: true,
    message: "Demo mode: changes were not saved to live data.",
  }),
  demoStorageKeys: DEMO_STORAGE_KEYS,
});

function normalizeDemoKey(endpoint = "") {
  return String(endpoint || "")
    .replace("/api/persist/", "")
    .replace("/persist/", "")
    .replace(/\/steps\/\d+/, "/steps")
    .split("?")[0]
    .trim();
}

export function DemoModeProvider({ children }) {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

  function getDemoData(endpoint) {
    if (!isDemoMode) return null;

    const key = normalizeDemoKey(endpoint);
    return DEMO_SEED_DATA[key] || {};
  }

  function isWriteBlocked(method = "GET") {
    if (!isDemoMode) return false;
    return WRITE_METHODS.includes(String(method).toUpperCase());
  }

  function getDemoWriteResponse(payload = null) {
    return {
      ok: true,
      demo: true,
      message: "Demo mode: changes were not saved to live data.",
      data: payload,
    };
  }

  const value = useMemo(
    () => ({
      isDemoMode,
      getDemoData,
      isWriteBlocked,
      getDemoWriteResponse,
      demoStorageKeys: DEMO_STORAGE_KEYS,
    }),
    [isDemoMode]
  );

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}

export default DemoModeContext;
