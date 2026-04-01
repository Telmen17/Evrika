import type { FC } from 'react'
import { useState } from 'react'
import archimedesImg from '../assets/archimedes.png'
import kingSitImg from '../assets/kingSit.png'
import blacksmithImg from '../assets/blacksmith-removebg-preview.png'
import type { SceneId } from './LandingPage'

interface StoryFinaleSceneProps {
  onNavigate: (scene: SceneId) => void
}

const finaleBeats = [
  {
    id: 'presentation',
    title: 'Before the throne',
    text:
      'Archimedes stands before King Hiero and explains what the balance and the water have shown: the crown matches the royal gold in weight, yet it pushes aside more water than a bar of pure gold — proof that another metal was mixed in.',
    image: 'king' as const,
  },
  {
    id: 'verdict',
    title: 'The king’s verdict',
    text:
      'Hiero’s face darkens with anger. He orders the blacksmith seized and taken to the dungeon for defrauding the crown. The royal treasury will not reward deceit.',
    image: 'blacksmith' as const,
  },
  {
    id: 'reward',
    title: 'A mind rewarded',
    text:
      'To Archimedes, the king grants honor and thanks: Syracuse still has its crown, and now it has the truth. The scholar bows, weary but satisfied — the puzzle of the crown is solved.',
    image: 'archimedes' as const,
  },
  {
    id: 'end',
    title: 'The journey ends',
    text:
      'The hall falls quiet. Somewhere beyond the palace walls, the story of the bath and the cry of “Eureka!” will travel — a reminder that careful thought can uncover what power alone cannot see.',
    image: 'king' as const,
  },
]

const StoryFinaleScene: FC<StoryFinaleSceneProps> = ({ onNavigate }) => {
  const [index, setIndex] = useState(0)
  const beat = finaleBeats[index]

  const goNext = () => setIndex((i) => Math.min(i + 1, finaleBeats.length - 1))
  const goPrev = () => setIndex((i) => Math.max(i - 1, 0))

  return (
    <div className="scene story-finale-scene">
      <header className="scene-header">
        <button className="link-button" type="button" onClick={() => onNavigate('displacement')}>
          ← Back
        </button>
        <h2>{beat.title}</h2>
      </header>

      <section className="scene-body story-finale-body">
        <div className="story-finale-layout">
          <div className="story-finale-visual">
            {beat.image === 'king' ? (
              <img src={kingSitImg} alt="" className="story-finale-img story-finale-img--king" />
            ) : beat.image === 'blacksmith' ? (
              <img
                src={blacksmithImg}
                alt=""
                className="story-finale-img story-finale-img--smith"
              />
            ) : (
              <img
                src={archimedesImg}
                alt=""
                className="story-finale-img story-finale-img--arch"
              />
            )}
          </div>
          <div className="story-finale-copy">
            <p className="scene-text story-finale-text">{beat.text}</p>
          </div>
        </div>
      </section>

      <footer className="scene-footer story-finale-footer">
        <div className="scene-footer-left">
          <button className="secondary-button" type="button" onClick={goPrev} disabled={index === 0}>
            Previous
          </button>
        </div>
        <div className="scene-footer-right">
          {index < finaleBeats.length - 1 ? (
            <button className="primary-button" type="button" onClick={goNext}>
              Next
            </button>
          ) : (
            <button className="primary-button" type="button" onClick={() => onNavigate('landing')}>
              Return to menu
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

export default StoryFinaleScene
