/**
 * useSceneNavigation — in-memory scene router state and cloud transitions.
 *
 * Responsibility: currentScene, completedScenes, navigate, navigateWithClouds, intro→hub flow.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import { useCallback, useState } from 'react'
import { HUB_GUIDE_FROM_INTRO_KEY } from '../lib/hubRooms'
import type { SceneId } from '../types/sceneId'

export type CloudTransitionPhase = 'idle' | 'covering' | 'revealing'

export function useSceneNavigation() {
  const [currentScene, setCurrentScene] = useState<SceneId>('landing')
  const [completedScenes, setCompletedScenes] = useState<SceneId[]>([])
  const [transitionPhase, setTransitionPhase] = useState<CloudTransitionPhase>('idle')
  const [pendingScene, setPendingScene] = useState<SceneId | null>(null)
  const [hubFromIntro, setHubFromIntro] = useState(false)

  const completeNavigation = useCallback((scene: SceneId) => {
    setCurrentScene(scene)
    setCompletedScenes((prev) => (prev.includes(scene) ? prev : [...prev, scene]))
  }, [])

  const navigate = useCallback(
    (scene: SceneId) => {
      setHubFromIntro(false)
      completeNavigation(scene)
    },
    [completeNavigation],
  )

  const navigateWithClouds = useCallback(
    (scene: SceneId) => {
      setTransitionPhase((phase) => {
        if (phase !== 'idle') return phase
        setPendingScene(scene)
        return 'covering'
      })
    },
    [],
  )

  const startJourney = useCallback(() => {
    navigateWithClouds('intro')
  }, [navigateWithClouds])

  const navigateFromIntro = useCallback(
    (scene: SceneId) => {
      if (scene === 'hub') {
        setHubFromIntro(true)
        try {
          sessionStorage.setItem(HUB_GUIDE_FROM_INTRO_KEY, '1')
        } catch {
          /* ignore */
        }
        navigateWithClouds('hub')
      } else {
        navigate(scene)
      }
    },
    [navigate, navigateWithClouds],
  )

  const onCloudTransitionEnd = useCallback(() => {
    if (transitionPhase === 'covering' && pendingScene) {
      completeNavigation(pendingScene)
      setTransitionPhase('revealing')
      return
    }
    if (transitionPhase === 'revealing') {
      setPendingScene(null)
      setTransitionPhase('idle')
    }
  }, [transitionPhase, pendingScene, completeNavigation])

  return {
    currentScene,
    completedScenes,
    transitionPhase,
    hubFromIntro,
    navigate,
    navigateFromIntro,
    startJourney,
    onCloudTransitionEnd,
  }
}
