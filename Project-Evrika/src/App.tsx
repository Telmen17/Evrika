import { useState, useEffect } from 'react'
import './App.css'
import LandingPage, { type SceneId } from './components/LandingPage'
import leafImg from './assets/leaf.png'
import StoryIntroScene from './components/StoryIntroScene'
import StoryBathScene from './components/StoryBathScene'
import CrownWeighScene from './components/CrownWeighScene.tsx'
import CrownMeltScene from './components/CrownMeltScene.tsx'
import WaterDiscoveryScene from './components/WaterDiscoveryScene'
import BuoyancyBathScene from './components/BuoyancyBathScene'
import CrownDensityScene from './components/CrownDensityScene'
import RecapScreen from './components/RecapScreen'
import DisplacementLabScene from './components/DisplacementLabScene'
import StoryFinaleScene from './components/StoryFinaleScene'
import PracticeProblemsScreen from './components/PracticeProblemsScreen'
import ExplorationHub from './components/ExplorationHub'
import { GlobalAudioToggle } from './components/GlobalAudioToggle'

const LEAF_LENGTH_PX = 140
const LEAF_OVERLAP_PX = 44
const LEAF_STEP_PX = LEAF_LENGTH_PX - LEAF_OVERLAP_PX
const SIDE_VINE_WIDTH_PX = LEAF_LENGTH_PX
type CloudTransitionPhase = 'idle' | 'covering' | 'revealing'

function App() {
  const [currentScene, setCurrentScene] = useState<SceneId>('landing')
  const [completedScenes, setCompletedScenes] = useState<SceneId[]>([])
  const [transitionPhase, setTransitionPhase] = useState<CloudTransitionPhase>('idle')
  const [pendingScene, setPendingScene] = useState<SceneId | null>(null)
  /** True when the hub is being entered directly from the story intro (replays the guide). */
  const [hubFromIntro, setHubFromIntro] = useState(false)
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  const completeNavigation = (scene: SceneId) => {
    setCurrentScene(scene)
    setCompletedScenes((prev) =>
      prev.includes(scene) ? prev : [...prev, scene],
    )
  }

  const navigate = (scene: SceneId) => {
    setHubFromIntro(false)
    completeNavigation(scene)
  }

  /** Cinematic cloud sweep, then swap scenes — used for landing→intro and intro→hub. */
  const navigateWithClouds = (scene: SceneId) => {
    if (transitionPhase !== 'idle') {
      return
    }
    setPendingScene(scene)
    setTransitionPhase('covering')
  }

  const startJourney = () => {
    navigateWithClouds('intro')
  }

  const navigateFromIntro = (scene: SceneId) => {
    if (scene === 'hub') {
      setHubFromIntro(true)
      navigateWithClouds('hub')
    } else {
      navigate(scene)
    }
  }

  useEffect(() => {
    if (currentScene !== 'landing') {
      document.body.classList.add('lesson-active')
    } else {
      document.body.classList.remove('lesson-active')
    }
    /* Hub has its own full chrome (top bar + nav); the leaf frame only collides there. */
    document.body.classList.toggle('hub-active', currentScene === 'hub')
  }, [currentScene])

  useEffect(() => {
    const onResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  let content

  switch (currentScene) {
    case 'intro':
      content = <StoryIntroScene onNavigate={navigateFromIntro} />
      break
    case 'hub':
      content = <ExplorationHub onNavigate={navigate} forceGuide={hubFromIntro} />
      break
    case 'bathStory':
      content = <StoryBathScene onNavigate={navigate} />
      break
    case 'weigh':
      content = <CrownWeighScene onNavigate={navigate} />
      break
    case 'melt':
      content = <CrownMeltScene onNavigate={navigate} />
      break
    case 'waterDiscovery':
      content = <WaterDiscoveryScene onNavigate={navigate} />
      break
    case 'displacement':
      content = <DisplacementLabScene onNavigate={navigate} />
      break
    case 'finale':
      content = <StoryFinaleScene onNavigate={navigate} />
      break
    case 'practice':
      content = <PracticeProblemsScreen onNavigate={navigate} />
      break
    case 'bath':
      content = <BuoyancyBathScene onNavigate={navigate} />
      break
    case 'crown':
      content = <CrownDensityScene onNavigate={navigate} />
      break
    case 'recap':
      content = <RecapScreen onNavigate={navigate} />
      break
    case 'landing':
    default:
      content = (
        <LandingPage
          onNavigate={navigate}
          onStartJourney={startJourney}
          completedScenes={completedScenes}
        />
      )
      break
  }

  const leafCountForLength = (length: number) =>
    Math.max(2, Math.floor((length - LEAF_LENGTH_PX) / LEAF_STEP_PX) + 1)

  const topLeafCountForConnection = (viewportWidth: number) =>
    Math.max(
      2,
      Math.ceil(
        (viewportWidth - SIDE_VINE_WIDTH_PX - LEAF_LENGTH_PX) / LEAF_STEP_PX,
      ) + 1,
    )

  const sideLeafCount = leafCountForLength(viewport.height)
  const topLeafCount = topLeafCountForConnection(viewport.width)
  const showCloudTransition = transitionPhase !== 'idle'

  return (
    <>
      <div
        className="frame-decoration"
        aria-hidden
      >
        <div className="frame-edge frame-top">
          {Array.from({ length: topLeafCount }, (_, i) => (
            <div key={`t-${i}`} className="frame-leaf-slot">
              <img
                className="frame-leaf-img frame-leaf-img-top"
                src={leafImg}
                alt=""
              />
            </div>
          ))}
        </div>
        <div className="frame-edge frame-left">
          {Array.from({ length: sideLeafCount }, (_, i) => (
            <div key={`l-${i}`} className="frame-leaf-slot">
              <img className="frame-leaf-img" src={leafImg} alt="" />
            </div>
          ))}
        </div>
        <div className="frame-edge frame-right">
          {Array.from({ length: sideLeafCount }, (_, i) => (
            <div key={`r-${i}`} className="frame-leaf-slot">
              <img className="frame-leaf-img" src={leafImg} alt="" />
            </div>
          ))}
        </div>
      </div>
      <div className="app-root">{content}</div>
      <GlobalAudioToggle visible={currentScene !== 'landing'} />
      {showCloudTransition ? (
        <div className={`cloud-transition cloud-transition-${transitionPhase}`} aria-hidden="true">
          <div className="cloud-transition-glow" />
          <div className="cloud-transition-side cloud-transition-side-left" />
          <div
            className="cloud-transition-side cloud-transition-side-right"
            onAnimationEnd={() => {
              if (transitionPhase === 'covering' && pendingScene) {
                completeNavigation(pendingScene)
                setTransitionPhase('revealing')
                return
              }

              if (transitionPhase === 'revealing') {
                setPendingScene(null)
                setTransitionPhase('idle')
              }
            }}
          />
        </div>
      ) : null}
    </>
  )
}

export default App
