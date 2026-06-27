/**
 * useAppChromeEffects — syncs document/body classes with the active scene.
 *
 * Responsibility: lesson-active, landing-scrollable, hub-active, landing scroll reset.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import { useEffect } from 'react'
import type { SceneId } from '../types/sceneId'

export function useAppChromeEffects(currentScene: SceneId): void {
  useEffect(() => {
    if (currentScene !== 'landing') {
      document.body.classList.add('lesson-active')
    } else {
      document.body.classList.remove('lesson-active')
    }
    const onLanding = currentScene === 'landing'
    document.documentElement.classList.toggle('landing-scrollable', onLanding)
    document.body.classList.toggle('landing-scrollable', onLanding)
    if (onLanding) {
      requestAnimationFrame(() => {
        document.querySelector('.app-root')?.scrollTo({ top: 0, left: 0 })
      })
    }
    document.body.classList.toggle('hub-active', currentScene === 'hub')
  }, [currentScene])
}
