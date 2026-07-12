import { describe, expect, it } from 'vitest'
import {
  isLandingDesktopGateDismissed,
  isMobileLandingViewport,
  LANDING_DESKTOP_GATE_DISMISSED_KEY,
  LANDING_DESKTOP_GATE_ENABLED,
  LANDING_DESKTOP_GATE_MIN_WIDTH_PX,
} from '@/lib/landingDesktopGate'
import { mockMatchMedia, setViewportWidth } from '../../setup/matchMedia'

describe('landingDesktopGate', () => {
  it('reads dismiss state from sessionStorage', () => {
    expect(isLandingDesktopGateDismissed()).toBe(false)
    sessionStorage.setItem(LANDING_DESKTOP_GATE_DISMISSED_KEY, '1')
    expect(isLandingDesktopGateDismissed()).toBe(true)
  })

  it('treats sub-960px widths as mobile landing viewports', () => {
    setViewportWidth(390)
    expect(isMobileLandingViewport()).toBe(true)

    setViewportWidth(LANDING_DESKTOP_GATE_MIN_WIDTH_PX)
    expect(isMobileLandingViewport()).toBe(false)
  })

  it('keeps the desktop gate disabled until explicitly re-enabled', () => {
    expect(LANDING_DESKTOP_GATE_ENABLED).toBe(false)
  })

  it('evaluates max-width media queries via matchMedia mock', () => {
    mockMatchMedia(800)
    expect(window.matchMedia('(max-width: 959px)').matches).toBe(true)
    mockMatchMedia(1200)
    expect(window.matchMedia('(max-width: 959px)').matches).toBe(false)
  })
})
