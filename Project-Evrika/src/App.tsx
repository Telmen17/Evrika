import { useState, useEffect } from 'react'
import './App.css'
import LandingPage, { type SceneId } from './components/LandingPage'
import StoryIntroScene from './components/StoryIntroScene'
import StoryBathScene from './components/StoryBathScene'
import CrownWeighScene from './components/CrownWeighScene.tsx'
import CrownMeltScene from './components/CrownMeltScene.tsx'
import BuoyancyBathScene from './components/BuoyancyBathScene'
import CrownDensityScene from './components/CrownDensityScene'
import RecapScreen from './components/RecapScreen'

function App() {
  const [currentScene, setCurrentScene] = useState<SceneId>('landing')
  const [completedScenes, setCompletedScenes] = useState<SceneId[]>([])

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

  return <div className="app-root">{content}</div>
}

export default App
