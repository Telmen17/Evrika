/**
 * landingDesktopGate — session storage and viewport helpers for the mobile desktop banner.
 *
 * Responsibility: dismiss flag, hard-reload reset, isMobileLandingViewport (non-hook).
 * Hook: hooks/useMobileLandingViewport.ts
 * Docs: docs/components/landing.md
 * Tests: tests/frontend/unit/lib/landingDesktopGate.test.ts
 */

export const LANDING_DESKTOP_GATE_DISMISSED_KEY = 'evrika-landing-desktop-gate-dismissed'

/** Set true to re-enable the sticky mobile desktop tip banner (component kept as backup). */
export const LANDING_DESKTOP_GATE_ENABLED = false

export const LANDING_DESKTOP_GATE_MIN_WIDTH_PX = 960

const MOBILE_MEDIA_QUERY = `(max-width: ${LANDING_DESKTOP_GATE_MIN_WIDTH_PX - 1}px)`

/** Hard reload starts fresh — dismiss only sticks until the next full page load. */
function resetDismissOnHardReload(): void {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined
    if (nav?.type === 'reload') {
      sessionStorage.removeItem(LANDING_DESKTOP_GATE_DISMISSED_KEY)
    }
  } catch {
    /* ignore */
  }
}

resetDismissOnHardReload()

export function isLandingDesktopGateDismissed(): boolean {
  try {
    return sessionStorage.getItem(LANDING_DESKTOP_GATE_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function isMobileLandingViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}
