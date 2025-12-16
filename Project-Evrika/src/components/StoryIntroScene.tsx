import type { FC } from 'react'
import { useState } from 'react'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import type { SceneId } from './LandingPage'

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
  {
    id: 'bath',
    title: 'A quiet bath, a loud idea',
    text:
      'While stepping into a bath, Archimedes notices the water level rise. The volume of water pushed aside must match the volume of his body.',
  },
  {
    id: 'eureka',
    title: 'Eureka!',
    text:
      'If water tells you volume, and a scale tells you mass, then density reveals the truth. Archimedes can now test the crown—and runs through the streets crying, "Eureka!"',
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
    <div className="scene">
      <header className="scene-header">
        <button
          className="link-button"
          type="button"
          onClick={() => onNavigate('landing')}
        >
          ← Back to menu
        </button>
        <h2>{beat.title}</h2>
      </header>

      <section className="scene-body">
        <div className="scene-text">
          <p>{beat.text}</p>

          <div className="story-step-indicator">
            Step {index + 1} of {beats.length}
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={toggle}
          >
            {isPlaying ? 'Pause narration' : 'Play narration'}
          </button>
        </div>
        <div className="scene-visual-placeholder">
          <p className="scene-visual-caption">
            3D intro scene placeholder – a calm bath and a glowing crown will live here.
          </p>
        </div>
      </section>

      <footer className="scene-footer">
        <div className="scene-footer-left">
          <button
            className="secondary-button"
            type="button"
            onClick={goPrev}
            disabled={index === 0}
          >
            Previous
          </button>
        </div>
        <div className="scene-footer-right">
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
              onClick={() => onNavigate('bath')}
            >
              Continue to Buoyancy Bath
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

export default StoryIntroScene


