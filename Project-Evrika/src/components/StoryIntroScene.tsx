import type { FC } from 'react'
import { useMemo, useState } from 'react'
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
  const { isPlaying, toggle } = useAudioPlayer(beat.audioSrc)

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
          <button
            className="secondary-button narration-button narration-icon-button"
            type="button"
            onClick={toggle}
          >
            <span className="narration-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M5 14h3l4 4V6L8 10H5z" />
                <path d="M15 9a4 4 0 010 6" />
                <path d="M17.5 6.5a7.5 7.5 0 010 11" />
              </svg>
            </span>
            <span>
              {isPlaying ? 'Pause voice' : 'Play voice'}
            </span>
          </button>
        </div>
        <div className="scene-text journey-story-text">
          <p>{beat.text}</p>
        </div>
      </div>

      <div className="journey-controls">
        <button
          className="secondary-button"
          type="button"
          onClick={goPrev}
          disabled={index === 0}
        >
          Previous scene
        </button>
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


