import { useAppChromeEffects } from './app/useAppChromeEffects'
import { renderSceneContent } from './app/sceneRegistry'
import { useSceneNavigation } from './app/useSceneNavigation'
import './App.css'
import LandingBackground from './components/LandingBackground'
import { LeafFrameDecoration } from './components/LeafFrameDecoration'
import { GlobalAudioToggle } from './components/GlobalAudioToggle'

/**
 * App — root shell: scene router, leaf frame, cloud transitions, global chrome.
 *
 * Responsibility: compose navigation hooks and render the active scene.
 * Docs: docs/architecture/routing-and-scenes.md
 */

function App() {
  const {
    currentScene,
    completedScenes,
    transitionPhase,
    hubFromIntro,
    navigate,
    navigateFromIntro,
    startJourney,
    onCloudTransitionEnd,
  } = useSceneNavigation()

  useAppChromeEffects(currentScene)

  const content = renderSceneContent({
    currentScene,
    completedScenes,
    navigate,
    navigateFromIntro,
    startJourney,
    hubFromIntro,
  })

  const showCloudTransition = transitionPhase !== 'idle'

  return (
    <>
      <LeafFrameDecoration />
      {currentScene === 'landing' ? <LandingBackground /> : null}
      <div className="app-root">{content}</div>
      <GlobalAudioToggle visible={currentScene !== 'landing'} />
      {showCloudTransition ? (
        <div
          className={`cloud-transition cloud-transition-${transitionPhase}`}
          aria-hidden="true"
        >
          <div className="cloud-transition-glow" />
          <div className="cloud-transition-side cloud-transition-side-left" />
          <div
            className="cloud-transition-side cloud-transition-side-right"
            onAnimationEnd={onCloudTransitionEnd}
          />
        </div>
      ) : null}
    </>
  )
}

export default App
