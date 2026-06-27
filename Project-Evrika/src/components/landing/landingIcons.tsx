/**
 * landingIcons — inline SVG symbols for the landing page.
 *
 * Responsibility: decorative icons only (no business logic).
 * Docs: docs/components/landing.md
 */

import type { FC } from 'react'
import type { SceneId } from '../../types/sceneId'

export const JOURNEY_STEPS: Array<{ id: SceneId; label: string; short: string }> = [
  { id: 'intro', label: 'Royal summons', short: 'I' },
  { id: 'bath', label: 'Buoyancy bath', short: 'B' },
  { id: 'crown', label: 'Crown test', short: 'C' },
  { id: 'displacement', label: 'Displacement', short: 'D' },
  { id: 'finale', label: 'Throne finale', short: 'F' },
  { id: 'recap', label: 'Recap', short: 'R' },
]

export const CrownSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <path
      d="M4 22 H28 V24 H4 Z M6 22 L8 10 L12 16 L16 6 L20 16 L24 10 L26 22"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.2"
    />
  </svg>
)

export const DropletSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <path
      d="M16 5 C16 5 8 16 8 21 C8 25.4 11.6 29 16 29 C20.4 29 24 25.4 24 21 C24 16 16 5 16 5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.25"
    />
  </svg>
)

export const ScaleSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <line x1="16" y1="6" x2="16" y2="26" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 14 Q10 18 14 14" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
    <path d="M18 14 Q22 18 26 14" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
  </svg>
)

export const ScrollSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <rect x="7" y="8" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
    <path d="M11 13 H21 M11 17 H19 M11 21 H17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

export const TheatreSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <path d="M4 26 H28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M6 26 V14 C6 10 26 10 26 14 V26"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <path d="M10 26 V18 H22 V26" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)

export const BeakerSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <path
      d="M10 6 H22 V14 L26 24 C27 26 25 28 23 28 H9 C7 28 5 26 6 24 L10 14 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <path d="M9 20 H23" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
  </svg>
)

export const MapSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
    <circle cx="16" cy="16" r="3" fill="currentColor" fillOpacity="0.35" />
    <path d="M16 6 V10 M16 22 V26 M6 16 H10 M22 16 H26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

export const HeroSymbolRow: FC = () => (
  <div className="landing-symbol-row" aria-hidden>
    <CrownSymbol className="landing-symbol" />
    <DropletSymbol className="landing-symbol" />
    <ScaleSymbol className="landing-symbol" />
    <ScrollSymbol className="landing-symbol" />
  </div>
)
