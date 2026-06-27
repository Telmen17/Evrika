import { useEffect, useState } from 'react'

export const LANDING_DESKTOP_GATE_DISMISSED_KEY = 'evrika-landing-desktop-gate-dismissed'

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

export function useMobileLandingViewport(): boolean {
  const [mobile, setMobile] = useState(isMobileLandingViewport)

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA_QUERY)
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return mobile
}
