import { useState, useEffect } from 'react'
import './App.css'
import LandingPage, { type SceneId } from './components/LandingPage'
import leafImg from './assets/leaf.png'
import StoryIntroScene from './components/StoryIntroScene'
import StoryBathScene from './components/StoryBathScene'
import CrownWeighScene from './components/CrownWeighScene.tsx'
import CrownMeltScene from './components/CrownMeltScene.tsx'
import BuoyancyBathScene from './components/BuoyancyBathScene'
import CrownDensityScene from './components/CrownDensityScene'
import RecapScreen from './components/RecapScreen'

const LEAF_LENGTH_PX = 140
const LEAF_OVERLAP_PX = 44
const LEAF_STEP_PX = LEAF_LENGTH_PX - LEAF_OVERLAP_PX
const SIDE_VINE_WIDTH_PX = LEAF_LENGTH_PX

function App() {
  const [currentScene, setCurrentScene] = useState<SceneId>('landing')
  const [completedScenes, setCompletedScenes] = useState<SceneId[]>([])
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  const navigate = (scene: SceneId) => {
    setCurrentScene(scene)
    setCompletedScenes((prev) =>
      prev.includes(scene) ? prev : [...prev, scene],
    )
  }

  useEffect(() => {
    if (currentScene !== 'landing') {
      document.body.classList.add('lesson-active')
    } else {
      document.body.classList.remove('lesson-active')
    }
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
      content = <StoryIntroScene onNavigate={navigate} />
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
    </>
  )
}

export default App
