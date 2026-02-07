import type { FC } from 'react'
import { useState } from 'react'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import type { SceneId } from './LandingPage'
import archimedesImg from '../assets/archimedes.png'
import kingSitImg from '../assets/kingSit.png'
import guardsImg from '../assets/guards.png'

interface StoryIntroSceneProps {
  onNavigate: (scene: SceneId) => void
}

const beats = [
  {
    id: 'king',
    title: 'A puzzle for Archimedes',
    text:
      "King Hiero of Syracuse suspects that his new crown isn't pure gold. He turns to Archimedes for an answer—without damaging the crown.",
  },
]

const StoryIntroScene: FC<StoryIntroSceneProps> = ({ onNavigate }) => {
  const [index, setIndex] = useState(0)
  const beat = beats[index]
  const { isPlaying, toggle } = useAudioPlayer('/audio/intro_part1.mp3')

  const goNext = () => {
    setIndex((prev) => Math.min(prev + 1, beats.length - 1))
  }

  const goPrev = () => {
    setIndex((prev) => Math.max(prev - 1, 0))
  }

  return (
    <div className="scene journey-scene">
      <button
        className="link-button menu-button"
        type="button"
        onClick={() => onNavigate('landing')}
      >
        ← Menu
      </button>

      <div className="scene-image-container">
        <div className="scene-stage-wrap">
          <img 
            src="/digital-art-style-theatre-stage.jpg" 
            alt="Theatre stage" 
            className="scene-image"
          />
          <img 
            src={archimedesImg} 
            alt="Archimedes" 
            className="scene-archimedes"
          />
          <img 
            src={guardsImg} 
            alt="Palace guards" 
            className="scene-guards"
          />
          <img 
            src={kingSitImg} 
            alt="King Hiero" 
            className="scene-king"
          />
        </div>
      </div>

      <div className="narration-container">
        <div className="scene-text">
          <p>{beat.text}</p>
          <div className="story-step-indicator">
            Step {index + 1} of {beats.length}
          </div>
        </div>
        <button
          className="secondary-button narration-button"
          type="button"
          onClick={toggle}
        >
          {isPlaying ? 'Pause narration' : 'Play narration'}
        </button>
      </div>

      <div className="next-button-container">
        {index < beats.length - 1 ? (
          <button
            className="primary-button"
            type="button"
            onClick={goNext}
          >
            Next
          </button>
        ) : (
          <button
            className="primary-button"
            type="button"
            onClick={() => onNavigate('weigh')}
          >
            Continue to the crown tests
          </button>
        )}
      </div>
    </div>
  )
}

export default StoryIntroScene


