/**
 * LandingPage — marketing entry orchestrator.
 *
 * Responsibility: compose hero, preview, path chooser, and desktop gate.
 * Docs: docs/components/landing.md
 * Tests: tests/frontend/integration/components/LandingPage.test.tsx
 */

import { type FC, useCallback, useState } from 'react'
import { useDesktopExperience } from '../hooks/useDesktopExperience'
import { isLandingDesktopGateDismissed } from '../lib/landingDesktopGate'
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

  return (
    <div
      className={`landing-page${isDesktop ? '' : ' landing-page-mobile'}${
        gateDismissed ? ' landing-page-mobile-gate-dismissed' : ''
      }`}
    >
      <LandingHero isDesktop={isDesktop} onStartJourney={onStartJourney} />
      <LandingPreviewSection />
      {isDesktop ? (
        <LandingPathsSection completedScenes={completedScenes} onNavigate={onNavigate} />
      ) : null}
      <LandingDesktopGate onDismiss={handleGateDismiss} />
    </div>
  )
}

export default LandingPage
