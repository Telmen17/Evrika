/**
 * LandingPage — marketing entry orchestrator.
 *
 * Responsibility: compose hero, preview, path chooser, and optional desktop gate.
 * Docs: docs/components/landing.md
 * Tests: tests/frontend/integration/components/LandingPage.test.tsx
 */

import { type FC, useCallback, useState } from 'react'
import { useDesktopExperience } from '../hooks/useDesktopExperience'
import {
  isLandingDesktopGateDismissed,
  LANDING_DESKTOP_GATE_ENABLED,
} from '../lib/landingDesktopGate'
import type { SceneId } from '../types/sceneId'
import LandingDesktopGate from './LandingDesktopGate'
import { LandingHero } from './landing/LandingHero'
import { LandingPathsSection } from './landing/LandingPathsSection'
import { LandingPreviewSection } from './landing/LandingPreviewSection'

export type { SceneId } from '../types/sceneId'

interface LandingPageProps {
  onNavigate: (scene: SceneId) => void
  onStartJourney: () => void
  completedScenes: SceneId[]
}

const LandingPage: FC<LandingPageProps> = ({ onNavigate, onStartJourney, completedScenes }) => {
  const isDesktop = useDesktopExperience()
  const [gateDismissed, setGateDismissed] = useState(isLandingDesktopGateDismissed)
  const handleGateDismiss = useCallback(() => setGateDismissed(true), [])

  const gateActive = LANDING_DESKTOP_GATE_ENABLED && !gateDismissed

  return (
    <div
      className={`landing-page${isDesktop ? '' : ' landing-page-mobile'}${
        gateDismissed || !LANDING_DESKTOP_GATE_ENABLED ? ' landing-page-mobile-gate-dismissed' : ''
      }`}
    >
      <LandingHero isDesktop={isDesktop} onStartJourney={onStartJourney} />
      <LandingPreviewSection />
      <LandingPathsSection completedScenes={completedScenes} onNavigate={onNavigate} />
      {gateActive ? <LandingDesktopGate onDismiss={handleGateDismiss} /> : null}
    </div>
  )
}

export default LandingPage
