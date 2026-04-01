/**
 * DashboardMarquee.jsx
 * CTH OS — Energetic Background Marquee for Dashboard
 *
 * A horizontally scrolling ticker that runs behind the dashboard header.
 * Shows platform stats, module names, and live activity chips.
 * Subtle at 12% opacity so it doesn't compete with content.
 *
 * USAGE in Dashboard.js:
 *   import DashboardMarquee from '../components/DashboardMarquee'
 *
 *   // Place just below the TopBar, before the main content grid:
 *   <DashboardMarquee stats={stats} />
 *
 * Props:
 *   stats  object  { content_generated, ai_credits_used, campaigns, score }
 */

import React, { useEffect, useState } from 'react'

const STATIC_ITEMS = [
  { icon: '◈', label: 'Brand Foundation' },
  { icon: '⬡', label: 'Strategic OS' },
  { icon: '✦', label: 'Content Studio' },
  { icon: '◉', label: 'Identity Studio' },
  { icon: '▲', label: 'Campaign Builder' },
  { icon: '◇', label: 'Offer Builder' },
  { icon: '⬟', label: 'Media Studio' },
  { icon: '✧', label: 'Brand Intelligence' },
  { icon: '◈', label: 'Brand Audit' },
  { icon: '⬡', label: 'Prompt Hub' },
  { icon: '✦', label: 'CRM Suite' },
  { icon: '◉', label: 'Brand Kit Export' },
]

export default function DashboardMarquee({ stats = {} }) {
  const [items, setItems] = useState(STATIC_ITEMS)

  useEffect(() => {
    // Inject live stats into marquee items
    const liveItems = [...STATIC_ITEMS]

    if (stats.content_generated > 0) {
      liveItems.push({ icon: '⚡', label: `${stats.content_generated} pieces generated`, highlight: true })
    }
    if (stats.campaigns > 0) {
      liveItems.push({ icon: '📣', label: `${stats.campaigns} campaigns active`, highlight: true })
    }
    if (stats.ai_credits_used !== undefined) {
      liveItems.push({ icon: '🤖', label: `AI credits: ${stats.ai_credits_used}`, highlight: false })
    }
    if (stats.score > 0) {
      liveItems.push({ icon: '🔍', label: `Brand Score: ${stats.score}%`, highlight: true })
    }

    setItems(liveItems)
  }, [stats])

  // Duplicate items for seamless loop
  const doubled = [...items, ...items]

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      height: 36,
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(0,0,0,0.2)',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .cth-marquee-track {
          display: flex;
          align-items: center;
          height: 100%;
          width: max-content;
          animation: marquee-scroll ${items.length * 3.5}s linear infinite;
          will-change: transform;
        }
        .cth-marquee-track:hover {
          animation-play-state: paused;
        }
      `}} />

      {/* Left fade */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 60,
        background: 'linear-gradient(90deg, rgba(13,0,16,0.9) 0%, transparent 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      {/* Right fade */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 60,
        background: 'linear-gradient(270deg, rgba(13,0,16,0.9) 0%, transparent 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      <div className="cth-marquee-track">
        {doubled.map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '0 20px',
            height: '100%',
            flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{
              fontSize: 13,
              color: item.highlight ? '#E04E35' : 'rgba(255,255,255,0.2)',
              lineHeight: 1,
            }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: item.highlight ? 600 : 400,
              color: item.highlight ? 'rgba(224,78,53,0.7)' : 'rgba(255,255,255,0.18)',
              letterSpacing: '0.08em',
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: 'nowrap',
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
