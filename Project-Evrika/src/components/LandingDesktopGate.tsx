import { type FC, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  isLandingDesktopGateDismissed,
  LANDING_DESKTOP_GATE_DISMISSED_KEY,
  useMobileLandingViewport,
} from '../lib/landingDesktopGate'

const SHOW_DELAY_MS = 3200
const FADE_MS = 520

type GatePhase = 'idle' | 'visible' | 'leaving' | 'dismissed'

interface LandingDesktopGateProps {
  onDismiss?: () => void
}

const DesktopIcon: FC = () => (
  <svg
    className="landing-desktop-gate-icon"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <rect x="8" y="12" width="48" height="32" rx="4" stroke="currentColor" strokeWidth="2.5" />
    <path d="M 8 40 H56" stroke="currentColor" strokeWidth="2.5" />
    <path
      d="M26 52 H38 L34 44 H30 Z"
      fill="currentColor"
      fillOpacity="0.35"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <rect x="14" y="18" width="36" height="18" rx="2" fill="currentColor" fillOpacity="0.12" />
  </svg>
)

const LaurelIcon: FC = () => (
  <svg
    className="landing-desktop-gate-laurel"
    viewBox="0 0 120 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M8 16 C14 8 22 6 30 10 C24 14 20 20 18 26 C14 22 10 18 8 16Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <path
      d="M112 16 C106 8 98 6 90 10 C96 14 100 20 102 26 C106 22 110 18 112 16Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <path d="M36 16 H84" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" opacity="0.5" />
  </svg>
)

const LandingDesktopGate: FC<LandingDesktopGateProps> = ({ onDismiss }) => {
  const mobileViewport = useMobileLandingViewport()
  const [phase, setPhase] = useState<GatePhase>(() =>
    isLandingDesktopGateDismissed() ? 'dismissed' : 'idle',
  )

  useEffect(() => {
    if (phase !== 'dismissed') return
    onDismiss?.()
  }, [phase, onDismiss])

  useEffect(() => {
    if (phase !== 'idle') return
    if (!mobileViewport) return
    if (isLandingDesktopGateDismissed()) {
      setPhase('dismissed')
      return
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const showDelay = reducedMotion ? 0 : SHOW_DELAY_MS

    const showTimer = window.setTimeout(() => {
      if (isLandingDesktopGateDismissed()) return
      setPhase('visible')
    }, showDelay)

    return () => window.clearTimeout(showTimer)
  }, [phase, mobileViewport])

  const dismiss = useCallback(() => {
    if (phase === 'leaving' || phase === 'dismissed') return
    setPhase('leaving')
    window.setTimeout(() => {
      try {
        sessionStorage.setItem(LANDING_DESKTOP_GATE_DISMISSED_KEY, '1')
      } catch {
        /* ignore */
      }
      setPhase('dismissed')
    }, FADE_MS)
  }, [phase])

  if (phase === 'dismissed' || !mobileViewport) {
    return null
  }

  const visible = phase === 'visible'
  const leaving = phase === 'leaving'

  return createPortal(
    <aside
      className={`landing-desktop-gate${visible ? ' landing-desktop-gate--visible' : ''}${
        leaving ? ' landing-desktop-gate--leaving' : ''
      }${phase === 'idle' ? ' landing-desktop-gate--pending' : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={!visible && !leaving}
    >
      <div className="landing-desktop-gate-inner">
        <button
          type="button"
          className="landing-desktop-gate-close"
          aria-label="Dismiss desktop notice"
          onClick={dismiss}
        >
          <span aria-hidden>×</span>
        </button>
        <LaurelIcon />
        <div className="landing-desktop-gate-body">
          <DesktopIcon />
          <div className="landing-desktop-gate-copy">
            <p className="landing-desktop-gate-title">Best on desktop</p>
            <p className="landing-desktop-gate-text">
              Play on desktop to start the journey and experience the awe!
            </p>
          </div>
        </div>
        <p className="landing-desktop-gate-greek" lang="el">
          ΕΥΡΗΚΑ
        </p>
      </div>
    </aside>,
    document.body,
  )
}

export default LandingDesktopGate
