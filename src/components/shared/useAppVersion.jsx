/**
 * useAppVersion.jsx
 * CTH OS — App Version Check + Auto-Refresh
 *
 * This hook:
 * - Polls /api/version every 3 minutes
 * - Compares against the version embedded at build time
 * - Shows an "Update available" banner when versions differ
 * - Forces a hard reload (bypasses all caches) on user click
 * - Handles the PWA Service Worker — tells it to skip waiting
 */

import { useState, useEffect, useRef } from 'react'

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────

// How often to poll for a new version (ms)
const POLL_INTERVAL = 3 * 60 * 1000   // 3 minutes

// Version embedded at build time via CRA
// Falls back to 'dev' if not set
const CURRENT_VERSION = import.meta.env.VITE_VERSION || 'dev'

// API base URL from environment
const API_BASE = import.meta.env.VITE_BACKEND_URL || ''

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useAppVersion() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [swWaiting, setSwWaiting] = useState(false)
  const swRegRef = useRef(null)

  // Listen for Service Worker waiting
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((reg) => {
      swRegRef.current = reg

      // New SW already waiting from previous load
      if (reg.waiting) {
        setSwWaiting(true)
        setUpdateAvailable(true)
      }

      // SW update found during this session
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setSwWaiting(true)
            setUpdateAvailable(true)
          }
        })
      })
    }).catch(() => {})

    // When new SW takes control — reload to get fresh assets
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }, [])

  // Poll /api/version for server-side version
  useEffect(() => {
    // Skip polling in dev mode
    if (CURRENT_VERSION === 'dev') return

    function checkVersion() {
      fetch(`${API_BASE}/api/version`, {
        cache: 'no-store',
        credentials: 'omit',
      })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data && data.version && data.version !== CURRENT_VERSION) {
            setUpdateAvailable(true)
          }
        })
        .catch(() => {}) // silent — don't alert on network error
    }

    // Check immediately on mount
    checkVersion()

    // Then poll on interval
    const interval = setInterval(checkVersion, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // Apply update
  function applyUpdate() {
    // Tell the waiting Service Worker to take control now
    if (swWaiting && swRegRef.current && swRegRef.current.waiting) {
      swRegRef.current.waiting.postMessage({ type: 'SKIP_WAITING' })
      // controllerchange event above will trigger window.location.reload()
      return
    }

    // No SW waiting — do a hard reload that bypasses all caches
    hardReload()
  }

  function hardReload() {
    // Add a cache-busting query param to force the browser to
    // re-fetch the HTML (which has new hashed JS/CSS bundle paths)
    const url = new URL(window.location.href)
    url.searchParams.set('_v', Date.now().toString())
    window.location.replace(url.toString())
  }

  return { updateAvailable, applyUpdate }
}

// ─────────────────────────────────────────────────────────────
// BANNER COMPONENT
// Drop this into App.jsx — appears at top of page when update is ready
// ─────────────────────────────────────────────────────────────

export function AppVersionBanner() {
  const { updateAvailable, applyUpdate } = useAppVersion()
  
  if (!updateAvailable) return null

  return (
    <div 
      data-testid="app-version-banner"
      style={{
        position: 'fixed',
        top: 0, 
        left: 0, 
        right: 0,
        zIndex: 9998,
        background: 'var(--cth-brand-primary-soft)',
        borderBottom: '1px solid rgba(224,78,53,0.4)',
        padding: '9px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--cth-admin-accent)" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <span style={{ fontSize: 12, color: 'var(--cth-admin-ink-soft)' }}>
          A new version of CTH OS is ready
        </span>
      </div>
      <button
        data-testid="update-now-btn"
        onClick={applyUpdate}
        style={{ 
          padding: '5px 16px', 
          borderRadius: 7, 
          border: 'none', 
          background: 'var(--cth-admin-accent)', 
          color: 'var(--cth-on-dark)', 
          fontSize: 11.5, 
          fontWeight: 600, 
          cursor: 'pointer', 
          fontFamily: "'DM Sans', sans-serif" 
        }}
      >
        Update now
      </button>
    </div>
  )
}

export default AppVersionBanner
