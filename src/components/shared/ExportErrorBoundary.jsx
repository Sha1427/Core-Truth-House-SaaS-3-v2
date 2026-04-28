/**
 * ExportErrorBoundary.jsx
 * CTH OS — Export Error Boundary + Graceful Fallback
 *
 * Instead of showing a technical error, it:
 * 1. Catches the Playwright error
 * 2. Shows a clear human-readable message
 * 3. Offers Print and Basic PDF as immediate fallbacks
 * 4. Shows the exact server fix command for the developer
 */

import { useState } from 'react'

const C = {
  accent: 'var(--cth-admin-accent)',
  red:    'var(--cth-status-danger)',
  amber:  'var(--cth-status-warning)',
  green:  'var(--cth-status-success-bright)',
  white:  'var(--cth-white)',
  t60:    'var(--cth-admin-ink-soft)',
  t40:    'var(--cth-admin-muted)',
  t25:    'var(--cth-admin-muted)',
  t10:    'var(--cth-admin-border)',
  panel:  'var(--cth-surface-night)',
  border: 'var(--cth-admin-border)',
  font:   "'DM Sans', sans-serif",
}

function isPlaywrightError(msg) {
  if (!msg) return false
  const m = msg.toLowerCase()
  return m.includes('playwright') || m.includes('chromium') || m.includes('executable') || m.includes('browser')
}

// ─────────────────────────────────────────────────────────────
// EXPORT ERROR MODAL
// ─────────────────────────────────────────────────────────────

export function ExportErrorModal({ error = '', onClose, onPrint, onBasicPDF }) {
  const playwright = isPlaywrightError(error)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 24, fontFamily: C.font }}>
      <div style={{ background: C.panel, border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '28px 32px', width: '100%', maxWidth: 460 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--cth-status-danger-soft-bg)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.white, margin: '0 0 4px' }}>
              {playwright ? 'PDF generator not configured' : 'Export failed'}
            </h3>
            <p style={{ fontSize: 11.5, color: C.t40, margin: 0, lineHeight: 1.5 }}>
              {playwright
                ? 'The styled PDF generator requires Playwright to be installed on the server. This is a one-time server setup.'
                : (error || 'Something went wrong. Try a different export format.')
              }
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.t25, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4, flexShrink: 0 }}>×</button>
        </div>

        {/* Server fix — shown to admin/developer */}
        {playwright && (
          <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 8, marginBottom: 18 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.t25, margin: '0 0 6px' }}>Server fix (run once)</p>
            <code style={{ fontSize: 12, color: 'color-mix(in srgb, var(--cth-status-danger) 45%, white)', fontFamily: 'monospace', display: 'block' }}>
              playwright install chromium
            </code>
            <p style={{ fontSize: 10, color: C.t25, margin: '5px 0 0' }}>
              Or for Railway/Docker: <code style={{ color: 'color-mix(in srgb, var(--cth-status-danger) 45%, white)' }}>playwright install --with-deps chromium</code>
            </p>
          </div>
        )}

        {/* Fallback options */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.t25, margin: '0 0 10px' }}>
            Use one of these now
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            <button
              onClick={() => { onClose(); if (onPrint) onPrint() }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 9, border: '1px solid var(--cth-admin-border)', background: C.t10, cursor: 'pointer', textAlign: 'left', fontFamily: C.font }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>🖨</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.white, margin: 0 }}>Print / Save as PDF</p>
                <p style={{ fontSize: 10.5, color: C.t40, margin: '1px 0 0' }}>Opens browser print dialog — works offline, no server needed</p>
              </div>
            </button>

            <button
              onClick={() => { onClose(); if (onBasicPDF) onBasicPDF() }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 9, border: '1px solid var(--cth-admin-border)', background: C.t10, cursor: 'pointer', textAlign: 'left', fontFamily: C.font }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>📋</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.white, margin: 0 }}>Basic PDF</p>
                <p style={{ fontSize: 10.5, color: C.t40, margin: '1px 0 0' }}>Clean document without full styling — fast, always works</p>
              </div>
            </button>
          </div>
        </div>

        <button onClick={onClose} style={{ marginTop: 16, width: '100%', padding: '7px', borderRadius: 8, border: '1px solid ' + C.border, background: 'none', color: C.t40, fontSize: 12, cursor: 'pointer', fontFamily: C.font }}>
          Close
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// EXPORT WITH FALLBACK — drop-in export button
// ─────────────────────────────────────────────────────────────

/**
 * ExportWithFallback
 *
 * Props:
 *   onStyledPDF  function  — async function that calls the styled PDF endpoint
 *   onPrint      function  — opens browser print dialog
 *   onBasicPDF   function  — async function that calls the basic PDF endpoint
 *   label        string    — button label (default "Export PDF")
 *   variant      string    — 'primary' | 'secondary' (default 'secondary')
 *   disabled     boolean
 */
export function ExportWithFallback({ onStyledPDF, onPrint, onBasicPDF, label = 'Export PDF', variant = 'secondary', disabled = false }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleClick() {
    if (!onStyledPDF || loading || disabled) return
    setLoading(true)
    setError(null)

    Promise.resolve(onStyledPDF())
      .then(() => setLoading(false))
      .catch((err) => {
        setLoading(false)
        setError(err.message || 'Export failed')
      })
  }

  const btnStyle = variant === 'primary'
    ? { display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 8, border: 'none', background: loading || disabled ? 'rgba(224,78,53,0.5)' : C.accent, color: C.white, fontSize: 12, fontWeight: 600, cursor: loading || disabled ? 'not-allowed' : 'pointer', fontFamily: C.font }
    : { display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--cth-admin-border)', background: 'var(--cth-admin-panel-alt)', color: loading || disabled ? C.t25 : C.t60, fontSize: 12, cursor: loading || disabled ? 'not-allowed' : 'pointer', fontFamily: C.font }

  return (
    <>
      <button onClick={handleClick} disabled={loading || disabled} style={btnStyle} data-testid="export-pdf-btn">
        {loading ? (
          <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid var(--cth-admin-border)', borderTopColor: C.white, animation: 'cth-spin 0.8s linear infinite' }} />
        ) : (
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
        )}
        {loading ? 'Generating...' : label}
        <style dangerouslySetInnerHTML={{ __html: '@keyframes cth-spin{to{transform:rotate(360deg)}}' }} />
      </button>

      {error && (
        <ExportErrorModal
          error={error}
          onClose={() => setError(null)}
          onPrint={onPrint}
          onBasicPDF={onBasicPDF}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// SAFE EXPORT FETCH — wrapper for export API calls
// ─────────────────────────────────────────────────────────────

/**
 * safeExportFetch
 * Wrapper around fetch for export endpoints.
 * Converts Playwright server errors into clean Error objects.
 */
export async function safeExportFetch(fetchPromise) {
  const response = await fetchPromise

  if (!response.ok) {
    let data = {}
    try { data = await response.json() } catch (e) {}

    const detail = data.detail || data.error || 'Export failed'

    if (isPlaywrightError(detail)) {
      throw new Error('Playwright browser not installed on server. Run: playwright install chromium')
    }

    throw new Error(detail)
  }

  const contentType = response.headers.get('content-type') || ''

  // JSON = async job
  if (contentType.includes('application/json')) {
    return response.json()
  }

  // Binary = direct PDF download
  const blob = await response.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'CTH_Export.pdf'
  a.click()
  URL.revokeObjectURL(url)
  return { downloaded: true }
}

export default ExportWithFallback
