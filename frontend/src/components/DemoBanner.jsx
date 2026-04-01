/**
 * DemoBanner.jsx
 * CTH OS — Demo Mode Banner
 *
 * Shows a persistent banner at the top when REACT_APP_DEMO_MODE=true.
 * Tells visitors they're in demo mode and their changes won't be saved.
 * Includes a CTA to sign up for the real platform.
 *
 * USAGE in Layout.js — add at the very top of the layout render:
 *   import DemoBanner from './DemoBanner'
 *   // Inside the layout JSX, before the sidebar:
 *   <DemoBanner />
 */

import React, { useState } from 'react'
import { useDemoMode } from '../context/DemoModeContext'

export default function DemoBanner() {
  const { isDemoMode } = useDemoMode()
  const [dismissed, setDismissed] = useState(false)

  if (!isDemoMode || dismissed) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: 'linear-gradient(90deg, #AF0024, #E04E35)',
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      boxShadow: '0 2px 16px rgba(175,0,36,0.4)',
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14 }}>👁</span>
        <span style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: '#fff',
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '0.01em',
        }}>
          You are viewing a live demo. Changes are not saved.
        </span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <a
          href="/sign-up"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 7,
            padding: '5px 14px',
            textDecoration: 'none',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'background 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
        >
          Start free →
        </a>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 18,
            lineHeight: 1,
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
