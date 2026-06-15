import type { FC } from 'react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import type { SceneId } from './LandingPage'
import archimedesImg from '../assets/archimedes.png'
import blacksmithImg from '../assets/blacksmith-removebg-preview.png'
import kingSitImg from '../assets/kingSit.png'
import guardsImg from '../assets/guards.png'
import crownImg from '../assets/crown.svg'
import theatreStageImg from '../assets/digital-art-style-theatre-stage.jpg'

interface StoryIntroSceneProps {
  onNavigate: (scene: SceneId) => void
}

type IntroActorId = 'king' | 'guards' | 'archimedes' | 'blacksmith' | 'crown'

interface StoryBeat {
  id: string
  title: string
  text: string
  audioSrc: string
  focusActor: IntroActorId
  visibleActors: IntroActorId[]
}

const beats: StoryBeat[] = [
  {
    id: 'throne',
    title: 'The throne of Syracuse',
    text:
      'In the royal court of Syracuse in ancient Greece, King Hiero sits in state while his guards watch over the hall.',
    audioSrc: '/audio/voicelines/intro1.mp3',
    focusActor: 'king',
    visibleActors: ['king', 'guards'],
  },
  {
    id: 'crown-arrives',
    title: 'The crown is presented',
    text:
      'A blacksmith presents the king with a shining crown, a gift meant to honor the gods and the throne.',
    audioSrc: '/audio/voicelines/intro2.mp3',
    focusActor: 'crown',
    visibleActors: ['king', 'guards', 'blacksmith', 'crown'],
  },
  {
    id: 'suspicion',
    title: 'A troubling suspicion',
    text:
      'The king begins to wonder whether the blacksmith secretly mixed cheaper silver into the gold and kept part of the treasure for himself.',
    audioSrc: '/audio/voicelines/intro3.mp3',
    focusActor: 'blacksmith',
    visibleActors: ['king', 'guards', 'blacksmith', 'crown'],
  },
  {
    id: 'archimedes-summoned',
    title: 'Archimedes is summoned',
    text:
      'Archimedes is called before the king, known throughout Syracuse for his sharp mind and unusual way of thinking.',
    audioSrc: '/audio/voicelines/intro4.mp3',
    focusActor: 'archimedes',
    visibleActors: ['king', 'guards', 'archimedes', 'crown'],
  },
  {
    id: 'task',
    title: 'The king gives the challenge',
    text:
      'Hiero gives Archimedes a difficult task: prove whether the crown is pure gold without melting it or breaking it apart.',
    audioSrc: '/audio/voicelines/intro5.mp3',
    focusActor: 'crown',
    visibleActors: ['king', 'archimedes', 'crown'],
  },
  {
    id: 'pondering',
    title: 'A hard problem remains',
    text:
      'Left alone with the mystery, Archimedes studies the crown and wonders how truth can be uncovered without destroying it.',
    audioSrc: '/audio/voicelines/intro6.mp3',
    focusActor: 'archimedes',
    visibleActors: ['archimedes', 'crown'],
  },
]

/** Quiet lead before narration + tail after it ends (progress bar and auto-advance pacing). */
const INTRO_LEAD_S = 1
const INTRO_TAIL_S = 1
/** Brief delay so layout paints, then full lead second for reading before voice. */
const INTRO_PLAY_DELAY_MS = 220 + Math.round(INTRO_LEAD_S * 1000)

interface IntroProgressParams {
  sceneAnchorMs: number
  duration: number
  currentTime: number
  tailStartMs: number | null
}

function computeStoryIntroTimeline01(nowMs: number, p: IntroProgressParams): number {
  const d = p.duration
  if (!(d > 0 && Number.isFinite(d))) return 0
  const spanS = INTRO_LEAD_S + d + INTRO_TAIL_S
  const elapsedMs = nowMs - p.sceneAnchorMs
  if (p.tailStartMs != null) {
    const tailElapsedS = (nowMs - p.tailStartMs) / 1000
    const tailPart = Math.min(INTRO_TAIL_S, Math.max(0, tailElapsedS))
    return Math.min(1, (INTRO_LEAD_S + d + tailPart) / spanS)
  }
  let virtualS: number
  if (elapsedMs < INTRO_PLAY_DELAY_MS) {
    virtualS = (elapsedMs / INTRO_PLAY_DELAY_MS) * INTRO_LEAD_S
  } else {
    virtualS = INTRO_LEAD_S + Math.min(Math.max(0, p.currentTime), d)
  }
  return Math.min(1, virtualS / spanS)
}

const StoryIntroScene: FC<StoryIntroSceneProps> = ({ onNavigate }) => {
  const [index, setIndex] = useState(0)
  const beat = beats[index]
  const visibleActors = useMemo(() => new Set(beat.visibleActors), [beat.visibleActors])

  const [sceneAnchorMs, setSceneAnchorMs] = useState(() => Date.now())
  const [tailStartMs, setTailStartMs] = useState<number | null>(null)
  /** Bumps during lead/tail so tooltip and aria refresh while audio time is flat. */
  const [a11yPulse, setA11yPulse] = useState(0)
  const advanceTimeoutRef = useRef(0)
  const introProgressParamsRef = useRef<IntroProgressParams>({
    sceneAnchorMs: Date.now(),
    duration: 0,
    currentTime: 0,
    tailStartMs: null,
  })
  const progressFillRef = useRef<HTMLDivElement>(null)
  const progressGleamRef = useRef<HTMLSpanElement>(null)

  const clearBeatSchedulers = useCallback(() => {
    window.clearTimeout(advanceTimeoutRef.current)
    advanceTimeoutRef.current = 0
    setTailStartMs(null)
  }, [])

  const onIntroClipEnded = useCallback(() => {
    setTailStartMs(Date.now())
    window.clearTimeout(advanceTimeoutRef.current)
    advanceTimeoutRef.current = window.setTimeout(() => {
      advanceTimeoutRef.current = 0
      setIndex((prev) => {
        if (prev >= beats.length - 1) return prev
        return prev + 1
      })
    }, INTRO_TAIL_S * 1000)
  }, [])

  const { play, currentTime, duration } = useAudioPlayer(beat.audioSrc, {
    onEnded: onIntroClipEnded,
  })

  useEffect(() => {
    setSceneAnchorMs(Date.now())
    clearBeatSchedulers()
  }, [beat.audioSrc, clearBeatSchedulers])

  introProgressParamsRef.current = {
    sceneAnchorMs,
    duration,
    currentTime,
    tailStartMs,
  }

  useLayoutEffect(() => {
    const fill = progressFillRef.current
    if (fill) fill.style.transform = 'scaleX(0)'
    const gleam = progressGleamRef.current
    if (gleam) gleam.style.opacity = '0'
  }, [beat.audioSrc])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const t = computeStoryIntroTimeline01(
        Date.now(),
        introProgressParamsRef.current,
      )
      const fill = progressFillRef.current
      if (fill) {
        fill.style.transform = `scaleX(${t})`
      }
      const gleam = progressGleamRef.current
      if (gleam) {
        gleam.style.opacity = t > 0.02 ? '1' : '0'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setA11yPulse((n) => n + 1), 100)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    return () => {
      window.clearTimeout(advanceTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => {
      play()
    }, INTRO_PLAY_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [beat.audioSrc, play])

  /**
   * Mirrors computeStoryIntroTimeline01 for tooltip / aria (React); the visible bar uses the same
   * math in rAF every frame so motion stays smooth without full scene re-renders.
   */
  const timeline01 = useMemo(
    () =>
      computeStoryIntroTimeline01(Date.now(), {
        sceneAnchorMs,
        duration,
        currentTime,
        tailStartMs,
      }),
    [a11yPulse, sceneAnchorMs, currentTime, duration, tailStartMs],
  )

  const displaySpanS =
    duration > 0 && Number.isFinite(duration)
      ? INTRO_LEAD_S + duration + INTRO_TAIL_S
      : 0
  const displayElapsedS = timeline01 * displaySpanS

  const goNext = () => {
    clearBeatSchedulers()
    setIndex((prev) => Math.min(prev + 1, beats.length - 1))
  }

  const goPrev = () => {
    clearBeatSchedulers()
    setIndex((prev) => Math.max(prev - 1, 0))
  }

  function actorClass(actorId: IntroActorId, baseClass: string) {
    const isVisible = visibleActors.has(actorId)
    const isFocused = beat.focusActor === actorId
    return `${baseClass} story-actor ${isVisible ? 'story-actor-visible' : 'story-actor-hidden'} ${isFocused ? 'story-actor-focus' : ''}`
  }

  const isLast = index >= beats.length - 1

  return (
    <div className="scene journey-scene">
      <button
        className="link-button menu-button"
        type="button"
        onClick={() => onNavigate('landing')}
      >
        ← Menu
      </button>

      <div className="journey-scene-body">
        <div className="scene-image-container">
          <div className="scene-stage-wrap">
            <img
              src={theatreStageImg}
              alt="Ancient Greek throne room"
              className="scene-image"
            />
            <div className="story-scene-wash" aria-hidden />
            <img
              src={archimedesImg}
              alt="Archimedes"
              className={actorClass('archimedes', 'scene-archimedes')}
            />
            <img
              src={guardsImg}
              alt="Palace guards"
              className={actorClass('guards', 'scene-guards')}
            />
            <img
              src={kingSitImg}
              alt="King Hiero"
              className={actorClass('king', 'scene-king')}
            />
            <div className={actorClass('blacksmith', 'story-blacksmith')}>
              <img
                src={blacksmithImg}
                alt="The royal blacksmith"
                className="story-blacksmith-img"
              />
            </div>
            <div className={actorClass('crown', 'story-crown')}>
              <img src={crownImg} alt="The golden crown" className="story-crown-img" />
            </div>
          </div>
        </div>

        <div className="narration-container journey-story-box">
          <div className="journey-story-box-header">
            <div>
              <div className="story-step-indicator">
                Scene {index + 1} of {beats.length}
              </div>
              <h2 className="journey-beat-title">{beat.title}</h2>
            </div>
          </div>
          <div className="scene-text journey-story-text">
            <p>{beat.text}</p>
          </div>
        </div>
      </div>

      <div className="journey-controls journey-controls--cinematic">
        <button
          type="button"
          className="journey-skip-btn"
          onClick={goPrev}
          disabled={index === 0}
          aria-label="Previous scene"
        >
          <span className="journey-skip-btn__glyph" aria-hidden>
            ‹
          </span>
        </button>
        <div
          className="journey-progress-wrap"
          title={
            displaySpanS > 0
              ? `Scene pacing: ~${Math.round(displayElapsedS)} / ${Math.round(displaySpanS)} s (includes ${INTRO_LEAD_S}s before and ${INTRO_TAIL_S}s after narration)${
                  isLast ? ' — when complete, use → to enter the workshop.' : ''
                }`
              : isLast
                ? 'Narration progress — when complete, use → to enter the workshop.'
                : 'Narration progress — includes quiet time before and after the voice; mute is volume only.'
          }
        >
          <div
            className="journey-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(timeline01 * 100)}
            aria-valuetext={
              displaySpanS > 0
                ? `About ${Math.round(displayElapsedS)} of ${Math.round(displaySpanS)} seconds for this scene, including time to read before and after narration`
                : isLast
                  ? 'Final scene narration'
                  : 'Narration progress'
            }
            aria-label="Narration progress for this scene"
          >
            <div className="journey-progress-fill" ref={progressFillRef}>
              <span
                ref={progressGleamRef}
                className="journey-progress-fill-gleam"
                style={{ opacity: 0 }}
                aria-hidden
              />
            </div>
          </div>
        </div>
        {isLast ? (
          <div className="journey-final-cta">
            <span className="journey-final-cta-rays" aria-hidden />
            <button
              type="button"
              className="journey-skip-btn journey-skip-btn--primary journey-skip-btn--final-pulse"
              onClick={() => onNavigate('hub')}
              aria-label="Enter Archimedes workshop"
            >
              <span className="journey-skip-btn__glyph" aria-hidden>
                ›
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="journey-skip-btn"
            onClick={goNext}
            aria-label="Next scene"
          >
            <span className="journey-skip-btn__glyph" aria-hidden>
              ›
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export default StoryIntroScene
