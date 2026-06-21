import type { FC } from 'react'

interface LandingDesktopGateProps {
  pulse?: boolean
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
    <path d="M8 40 H56" stroke="currentColor" strokeWidth="2.5" />
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

const LandingDesktopGate: FC<LandingDesktopGateProps> = ({ pulse = false }) => (
  <aside
    className={`landing-desktop-gate${pulse ? ' landing-desktop-gate-pulse' : ''}`}
    role="status"
    aria-live="polite"
  >
    <div className="landing-desktop-gate-inner">
      <LaurelIcon />
      <div className="landing-desktop-gate-body">
        <DesktopIcon />
        <div className="landing-desktop-gate-copy">
          <p className="landing-desktop-gate-title">Desktop experience</p>
          <p className="landing-desktop-gate-text">
            Explore the full interactive lesson on a computer or tablet in landscape (960px+ wide).
          </p>
        </div>
      </div>
      <p className="landing-desktop-gate-greek" lang="el">
        ΕΥΡΗΚΑ — best on desktop
      </p>
    </div>
  </aside>
)

export default LandingDesktopGate
