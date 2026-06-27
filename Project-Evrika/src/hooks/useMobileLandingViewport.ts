/**
 * useMobileLandingViewport — tracks sub-960px width for the landing desktop gate.
 *
 * Responsibility: reactive matchMedia subscription for mobile landing layout.
 * Docs: docs/components/landing.md
 * Tests: tests/frontend/integration/hooks/useMobileLandingViewport.test.tsx
 */

import { useEffect, useState } from 'react'
import {
  isMobileLandingViewport,
  LANDING_DESKTOP_GATE_MIN_WIDTH_PX,
} from '../lib/landingDesktopGate'

const MOBILE_MEDIA_QUERY = `(max-width: ${LANDING_DESKTOP_GATE_MIN_WIDTH_PX - 1}px)`

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
