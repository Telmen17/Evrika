/**
 * renderSceneContent — maps SceneId to the active React scene tree.
 *
 * Responsibility: scene→component switch used by App.tsx (no routing library).
 * Docs: docs/architecture/routing-and-scenes.md
 */

import type { ReactNode } from 'react'
import BuoyancyBathScene from '../components/BuoyancyBathScene'
import CrownDensityScene from '../components/CrownDensityScene'
import CrownMeltScene from '../components/CrownMeltScene'
import CrownWeighScene from '../components/CrownWeighScene'
import DisplacementLabScene from '../components/DisplacementLabScene'
import ExplorationHub from '../components/ExplorationHub'
import LandingPage from '../components/LandingPage'
import PracticeProblemsScreen from '../components/PracticeProblemsScreen'
import RecapScreen from '../components/RecapScreen'
import StoryBathScene from '../components/StoryBathScene'
import StoryFinaleScene from '../components/StoryFinaleScene'
import StoryIntroScene from '../components/StoryIntroScene'
import WaterDiscoveryScene from '../components/WaterDiscoveryScene'
import type { SceneId } from '../types/sceneId'

export interface SceneRenderContext {
  currentScene: SceneId
  completedScenes: SceneId[]
  navigate: (scene: SceneId) => void
  navigateFromIntro: (scene: SceneId) => void
  startJourney: () => void
  hubFromIntro: boolean
}

export function renderSceneContent(ctx: SceneRenderContext): ReactNode {
  const { currentScene, completedScenes, navigate, navigateFromIntro, startJourney, hubFromIntro } =
    ctx

  switch (currentScene) {
    case 'intro':
      return <StoryIntroScene onNavigate={navigateFromIntro} />
    case 'hub':
      return <ExplorationHub onNavigate={navigate} forceGuide={hubFromIntro} />
    case 'bathStory':
      return <StoryBathScene onNavigate={navigate} />
    case 'weigh':
      return <CrownWeighScene onNavigate={navigate} />
    case 'melt':
      return <CrownMeltScene onNavigate={navigate} />
    case 'waterDiscovery':
      return <WaterDiscoveryScene onNavigate={navigate} />
    case 'displacement':
      return <DisplacementLabScene onNavigate={navigate} />
    case 'finale':
      return <StoryFinaleScene onNavigate={navigate} />
    case 'practice':
      return <PracticeProblemsScreen onNavigate={navigate} />
    case 'bath':
      return <BuoyancyBathScene onNavigate={navigate} />
    case 'crown':
      return <CrownDensityScene onNavigate={navigate} />
    case 'recap':
      return <RecapScreen onNavigate={navigate} />
    case 'landing':
    default:
      return (
        <LandingPage
          onNavigate={navigate}
          onStartJourney={startJourney}
          completedScenes={completedScenes}
        />
      )
  }
}
