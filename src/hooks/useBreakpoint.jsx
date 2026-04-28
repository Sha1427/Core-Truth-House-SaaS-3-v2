/**
 * useBreakpoint.js
 * Core Truth House OS — Responsive Breakpoint Hooks
 *
 * BREAKPOINTS:
 *   xs:  0–479     (small phone)
 *   sm:  480–767   (large phone / small tablet)
 *   md:  768–1023  (tablet)
 *   lg:  1024–1279 (small desktop)
 *   xl:  1280+     (desktop)
 */

import { useState, useEffect } from 'react';

// Breakpoint definitions
const BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Core window width hook
export function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);

  return width;
}

// Breakpoint hook
export function useBreakpoint() {
  const width = useWindowWidth();

  const bp = width < BREAKPOINTS.sm ? 'xs'
    : width < BREAKPOINTS.md ? 'sm'
    : width < BREAKPOINTS.lg ? 'md'
    : width < BREAKPOINTS.xl ? 'lg'
    : 'xl';

  return {
    width,
    bp,
    isXs: bp === 'xs',
    isSm: bp === 'sm',
    isMd: bp === 'md',
    isLg: bp === 'lg',
    isXl: bp === 'xl',

    // Semantic helpers
    isMobile: width < BREAKPOINTS.md,     // xs + sm → phones
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,

    // Touch-first layouts
    isTouch: width < BREAKPOINTS.lg,     // phones + tablets

    // Sidebar collapses at tablet and below
    sidebarCollapsed: width < BREAKPOINTS.lg,

    // Grid column helpers
    cols: width < BREAKPOINTS.sm ? 1
      : width < BREAKPOINTS.md ? 2
      : width < BREAKPOINTS.lg ? 2
      : width < BREAKPOINTS.xl ? 3
      : 4,
  };
}

// Responsive value hook
export function useResponsiveValue(values) {
  const { bp } = useBreakpoint();
  const order = ['xl', 'lg', 'md', 'sm', 'xs'];
  const currentIdx = order.indexOf(bp);

  for (let i = currentIdx; i < order.length; i++) {
    if (values[order[i]] !== undefined) {
      return values[order[i]];
    }
  }
  return values[order[order.length - 1]];
}

// Media query hook
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    setMatches(mq.matches);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Responsive styles helper
export function rs(bp, styles) {
  const result = { ...(styles.base || {}) };
  if (bp.isMobile && styles.mobile) Object.assign(result, styles.mobile);
  if (bp.isTablet && styles.tablet) Object.assign(result, styles.tablet);
  if (bp.isDesktop && styles.desktop) Object.assign(result, styles.desktop);
  if (bp.isXs && styles.xs) Object.assign(result, styles.xs);
  return result;
}
