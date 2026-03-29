import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import archimedesPng from '../assets/archimedes.png'
import bathPng from '../assets/bath.png'
import bathhouseJpg from '../assets/bathhouse.jpg'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import type { SceneId } from './LandingPage'

interface StoryBathSceneProps {
  onNavigate: (scene: SceneId) => void
}

const bathBeats = [
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

/** Visual steps for the displacement sketch (CSS-only; one Archimedes asset). */
type BathVisualPhase = 'idle' | 'stepIn' | 'submerged' | 'overflow'

const StoryBathScene: FC<StoryBathSceneProps> = ({ onNavigate }) => {
  const [index, setIndex] = useState(0)
  const [bathPhase, setBathPhase] = useState<BathVisualPhase>('idle')
  const bathTimersRef = useRef<number[]>([])
  const beat = bathBeats[index]
  const { isPlaying, toggle } = useAudioPlayer('/audio/intro_part1.mp3')

  const clearBathTimers = useCallback(() => {
    bathTimersRef.current.forEach((id) => window.clearTimeout(id))
    bathTimersRef.current = []
  }, [])

  const schedule = useCallback((fn: () => void, ms: number) => {
    bathTimersRef.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => {
    if (index !== 0) {
      clearBathTimers()
      setBathPhase('idle')
    }
  }, [index, clearBathTimers])

  useEffect(() => () => clearBathTimers(), [clearBathTimers])

  const startBathSequence = useCallback(() => {
    if (bathPhase !== 'idle' || index !== 0) return
    clearBathTimers()
    setBathPhase('stepIn')
    schedule(() => setBathPhase('submerged'), 850)
    schedule(() => setBathPhase('overflow'), 1500)
  }, [bathPhase, index, clearBathTimers, schedule])

  const goNext = () => {
    setIndex((prev) => Math.min(prev + 1, bathBeats.length - 1))
  }

  const goPrev = () => {
    setIndex((prev) => Math.max(prev - 1, 0))
  }

  const stageClass =
    bathPhase === 'idle'
      ? ''
      : bathPhase === 'stepIn'
        ? 'story-bath-stage--step-in'
        : bathPhase === 'submerged'
          ? 'story-bath-stage--submerged'
          : 'story-bath-stage--overflow'

  return (
    <div className="scene story-bath-scene">
      <header className="scene-header">
        <button
          className="link-button"
          type="button"
          onClick={() => onNavigate('melt')}
        >
          ← Back to earlier tests
        </button>
        <h2>{beat.title}</h2>
      </header>

      <section className="scene-body story-bath-body">
        <div className="story-bath-layout">
          <div className="story-bath-copy">
            <p className="scene-text story-bath-text">{beat.text}</p>

            <div className="story-step-indicator">
              Step {index + 2} of {bathBeats.length + 1}
            </div>

            {index === 0 ? (
              <div className="story-bath-actions">
                <button
                  type="button"
                  className="primary-button story-bath-step-btn"
                  disabled={bathPhase !== 'idle'}
                  onClick={startBathSequence}
                >
                  {bathPhase === 'idle'
                    ? 'Step into the bath'
                    : bathPhase === 'stepIn'
                      ? 'Stepping in…'
                      : bathPhase === 'submerged'
                        ? 'Water rising…'
                        : 'Water overflows…'}
                </button>
                <p className="story-bath-actions-hint">
                  Watch the water level as Archimedes enters—then displacement pushes it over the rim.
                </p>
              </div>
            ) : null}

            <button
              className="secondary-button story-bath-narration-btn"
              type="button"
              onClick={toggle}
            >
              {isPlaying ? 'Pause narration' : 'Play narration'}
            </button>
          </div>

          <div
            className={`story-bath-stage ${stageClass} ${index === 1 ? 'story-bath-stage--eureka' : ''}`}
            aria-live="polite"
          >
            <img src={bathhouseJpg} alt="" className="story-bath-bg" />
            <div className="story-bath-stage-inner">
              <div className="story-bath-composite">
                <div className="story-bath-overflow story-bath-overflow--left" aria-hidden />
                <div className="story-bath-overflow story-bath-overflow--right" aria-hidden />
                <div className="story-bath-water" aria-hidden />
                <img
                  src={archimedesPng}
                  alt=""
                  className="story-bath-archimedes"
                />
                <img src={bathPng} alt="" className="story-bath-tub" />
                <div className="story-bath-spills" aria-hidden>
                  <div className="story-bath-spill story-bath-spill--left" />
                  <div className="story-bath-spill story-bath-spill--center" />
                  <div className="story-bath-spill story-bath-spill--right" />
                </div>
              </div>
            </div>
          </div>
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
          {index < bathBeats.length - 1 ? (
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

export default StoryBathScene
