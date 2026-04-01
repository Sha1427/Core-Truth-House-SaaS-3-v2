/**
 * DemoModeContext.jsx
 * CTH OS — Demo Mode Context
 *
 * When REACT_APP_DEMO_MODE=true is set in Railway env vars,
 * every usePersist save is silently intercepted and dropped.
 * All loads return pre-seeded static demo data instead of hitting the API.
 * Zero real data is ever written to MongoDB.
 *
 * USAGE IN App.js:
 *   import { DemoModeProvider, useDemoMode } from './context/DemoModeContext'
 *
 *   Wrap the app:
 *     <DemoModeProvider>
 *       {content}
 *     </DemoModeProvider>
 *
 * RAILWAY ENV VAR:
 *   REACT_APP_DEMO_MODE=true   → demo mode ON  (no writes)
 *   REACT_APP_DEMO_MODE=false  → demo mode OFF (normal production)
 *   (omitted)                  → demo mode OFF (normal production)
 */

import React, { createContext, useContext } from 'react'
import DEMO_SEED_DATA from '../data/demoSeedData'

const DemoModeContext = createContext({
  isDemoMode: false,
  getDemoData: () => ({}),
})

export function DemoModeProvider({ children }) {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  /**
   * getDemoData(endpoint)
   * Returns seeded demo data for a given persist endpoint.
   * Falls back to empty object if no seed data is defined.
   *
   * @param {string} endpoint  e.g. '/api/persist/brand-memory'
   * @returns {object}
   */
  function getDemoData(endpoint) {
    if (!isDemoMode) return null

    // Normalize endpoint to key
    const key = endpoint
      .replace('/api/persist/', '')
      .replace('/persist/', '')
      .replace(/\/steps\/\d+/, '/steps')  // strategic-os/steps/1 → strategic-os/steps
      .split('?')[0]  // strip query params

    return DEMO_SEED_DATA[key] || {}
  }

  return (
    <DemoModeContext.Provider value={{ isDemoMode, getDemoData }}>
      {children}
    </DemoModeContext.Provider>
  )
}

export function useDemoMode() {
  return useContext(DemoModeContext)
}

export default DemoModeContext
