import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import archimedesPng from '../assets/archimedes.png'
import archimedesStep2 from '../assets/archimedes-step2.png'
import archimedesStep3 from '../assets/archimedes-step3.png'
import archimedesStep4 from '../assets/archimedes-step4.png'
import archimedesStep5 from '../assets/archimedes-step5.png'
import bathPng from '../assets/bath.png'
import bathhouseJpg from '../assets/bathhouse.jpg'
import type { SceneId } from './LandingPage'

/** Step 1 = idle; steps 2–5 = sequential “into the bath” frames. */
const ARCH_BATH_FRAMES = [
  archimedesPng,
  archimedesStep2,
  archimedesStep3,
  archimedesStep4,
  archimedesStep5,
] as const

/** Pause on idle before first step. */
const ARCH_BATH_INTRO_MS = 450
/** Time between archFrame advances = dwell (readable hold) + quick crossfade. */
const ARCH_BATH_FRAME_HOLD_MS = 1300
/** Quick crossfade; must stay well below ARCH_BATH_STEP_MS so each pose reads clearly. */
const ARCH_BATH_CROSSFADE_MS = 200
const ARCH_BATH_STEP_MS = ARCH_BATH_FRAME_HOLD_MS + ARCH_BATH_CROSSFADE_MS
/** Hold last frame (step 5) before water “rises”; then overflow delay. */
const ARCH_BATH_AFTER_LAST_MS = 500
const BATH_SUBMERGED_TO_OVERFLOW_MS = 1300

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

/** Visual steps for the displacement sketch (sprites + water). */
type BathVisualPhase = 'idle' | 'stepIn' | 'submerged' | 'overflow'

const StoryBathScene: FC<StoryBathSceneProps> = ({ onNavigate }) => {
  const [index, setIndex] = useState(0)
  const [bathPhase, setBathPhase] = useState<BathVisualPhase>('idle')
  /** 0 = `archimedes.png`; 1–4 = step2 … step5 */
  const [archFrame, setArchFrame] = useState<0 | 1 | 2 | 3 | 4>(0)
  /** Crossfade double-buffer: outgoing / incoming src while opacity animates. */
  const [archOutSrc, setArchOutSrc] = useState(ARCH_BATH_FRAMES[0])
  const [archInSrc, setArchInSrc] = useState(ARCH_BATH_FRAMES[0])
  const [archCrossfading, setArchCrossfading] = useState(false)
  const archFramePrevRef = useRef<number | null>(null)
  const bathTimersRef = useRef<number[]>([])
  const beat = bathBeats[index]

  const clearBathTimers = useCallback(() => {
    bathTimersRef.current.forEach((id) => window.clearTimeout(id))
    bathTimersRef.current = []
  }, [])

  const schedule = useCallback((fn: () => void, ms: number) => {
    bathTimersRef.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => {
    clearBathTimers()
    if (index !== 0) {
      setBathPhase('idle')
      setArchFrame(4)
    } else {
      setBathPhase('idle')
      setArchFrame(0)
    }
  }, [index, clearBathTimers])

  useEffect(() => () => clearBathTimers(), [clearBathTimers])

  useEffect(() => {
    if (archFramePrevRef.current === null) {
      archFramePrevRef.current = archFrame
      const s = ARCH_BATH_FRAMES[archFrame]
      setArchOutSrc(s)
      setArchInSrc(s)
      return
    }
    if (archFramePrevRef.current === archFrame) return
    archFramePrevRef.current = archFrame
    const next = ARCH_BATH_FRAMES[archFrame]
    setArchInSrc(next)
    const raf1 = requestAnimationFrame(() => {
      setArchCrossfading(true)
    })
    const id = window.setTimeout(() => {
      setArchOutSrc(next)
      setArchCrossfading(false)
    }, ARCH_BATH_CROSSFADE_MS)
    return () => {
      cancelAnimationFrame(raf1)
      window.clearTimeout(id)
    }
  }, [archFrame])

  const startBathSequence = useCallback(() => {
    if (bathPhase !== 'idle' || index !== 0) return
    clearBathTimers()
    setBathPhase('stepIn')

    const t0 = ARCH_BATH_INTRO_MS
    const steps: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4]
    steps.forEach((s, i) => {
      schedule(() => setArchFrame(s), t0 + ARCH_BATH_STEP_MS * i)
    })

    const lastFrameAt = t0 + ARCH_BATH_STEP_MS * 3
    schedule(() => setBathPhase('submerged'), lastFrameAt + ARCH_BATH_AFTER_LAST_MS)
    schedule(
      () => setBathPhase('overflow'),
      lastFrameAt + ARCH_BATH_AFTER_LAST_MS + BATH_SUBMERGED_TO_OVERFLOW_MS,
    )
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
              </div>
            ) : null}
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
                <div
                  className={`story-bath-archimedes-wrap story-bath-archimedes--f${archFrame}`}
                >
                  <img
                    src={archOutSrc}
                    alt=""
                    className="story-bath-archimedes-layer"
                    style={{
                      opacity: archCrossfading ? 0 : 1,
                      zIndex: archCrossfading ? 1 : 2,
                    }}
                  />
                  <img
                    src={archInSrc}
                    alt=""
                    className="story-bath-archimedes-layer"
                    style={{
                      opacity: archCrossfading ? 1 : 0,
                      zIndex: archCrossfading ? 2 : 1,
                    }}
                  />
                </div>
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
          {index === 0 ? (
            bathPhase === 'overflow' ? (
              <button className="primary-button" type="button" onClick={goNext}>
                Next
              </button>
            ) : null
          ) : (
            <button
              className="primary-button"
              type="button"
              onClick={() => onNavigate('displacement')}
            >
              Continue to the displacement test
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

export default StoryBathScene
