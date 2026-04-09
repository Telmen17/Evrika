import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import type { SceneId } from './LandingPage'
import archimedesImg from '../assets/archimedes.png'
import blacksmithImg from '../assets/blacksmith-removebg-preview.png'
import kingSitImg from '../assets/kingSit.png'
import guardsImg from '../assets/guards.png'
import crownImg from '../assets/crown.svg'

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
    audioSrc: '/audio/intro1.mp3',
    focusActor: 'king',
    visibleActors: ['king', 'guards'],
  },
  {
    id: 'crown-arrives',
    title: 'The crown is presented',
    text:
      'A blacksmith presents the king with a shining crown, a gift meant to honor the gods and the throne.',
    audioSrc: '/audio/intro2.mp3',
    focusActor: 'crown',
    visibleActors: ['king', 'guards', 'blacksmith', 'crown'],
  },
  {
    id: 'suspicion',
    title: 'A troubling suspicion',
    text:
      'The king begins to wonder whether the blacksmith secretly mixed cheaper silver into the gold and kept part of the treasure for himself.',
    audioSrc: '/audio/intro3.mp3',
    focusActor: 'blacksmith',
    visibleActors: ['king', 'guards', 'blacksmith', 'crown'],
  },
  {
    id: 'archimedes-summoned',
    title: 'Archimedes is summoned',
    text:
      'Archimedes is called before the king, known throughout Syracuse for his sharp mind and unusual way of thinking.',
    audioSrc: '/audio/intro4.mp3',
    focusActor: 'archimedes',
    visibleActors: ['king', 'guards', 'archimedes', 'crown'],
  },
  {
    id: 'task',
    title: 'The king gives the challenge',
    text:
      'Hiero gives Archimedes a difficult task: prove whether the crown is pure gold without melting it or breaking it apart.',
    audioSrc: '/audio/intro5.mp3',
    focusActor: 'crown',
    visibleActors: ['king', 'archimedes', 'crown'],
  },
  {
    id: 'pondering',
    title: 'A hard problem remains',
    text:
      'Left alone with the mystery, Archimedes studies the crown and wonders how truth can be uncovered without destroying it.',
    audioSrc: '/audio/intro6.mp3',
    focusActor: 'archimedes',
    visibleActors: ['archimedes', 'crown'],
  },
]

const StoryIntroScene: FC<StoryIntroSceneProps> = ({ onNavigate }) => {
  const [index, setIndex] = useState(0)
  const beat = beats[index]
  const visibleActors = useMemo(() => new Set(beat.visibleActors), [beat.visibleActors])
  const onIntroClipEnded = useCallback(() => {
    setIndex((prev) => {
      if (prev >= beats.length - 1) return prev
      return prev + 1
    })
  }, [])

  const { play, currentTime, duration } = useAudioPlayer(beat.audioSrc, {
    onEnded: onIntroClipEnded,
  })

  useEffect(() => {
    const t = window.setTimeout(() => {
      play()
    }, 220)
    return () => clearTimeout(t)
  }, [beat.audioSrc, play])

  const timeline01 =
    duration > 0 && Number.isFinite(duration)
      ? Math.min(1, currentTime / duration)
      : 0

  const goNext = () => {
    setIndex((prev) => Math.min(prev + 1, beats.length - 1))
  }

  const goPrev = () => {
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
              src="/digital-art-style-theatre-stage.jpg"
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
            duration > 0 && Number.isFinite(duration)
              ? `Narration: ${Math.round(currentTime)} / ${Math.round(duration)} s${
                  isLast ? ' — when complete, use → to enter the workshop.' : ''
                }`
              : isLast
                ? 'Narration progress — when complete, use → to enter the workshop.'
                : 'Narration progress — bar follows voice timing; mute is volume only.'
          }
        >
          <div
            className="journey-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(timeline01 * 100)}
            aria-valuetext={
              duration > 0 && Number.isFinite(duration)
                ? `${Math.round(currentTime)} of ${Math.round(duration)} seconds`
                : isLast
                  ? 'Final scene narration'
                  : 'Narration progress'
            }
            aria-label="Narration progress for this scene"
          >
            <div
              className="journey-progress-fill"
              style={{ transform: `scaleX(${timeline01})` }}
            >
              {timeline01 > 0.02 ? (
                <span className="journey-progress-fill-gleam" aria-hidden />
              ) : null}
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
