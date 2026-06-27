/**
 * StoryFinaleScene — throne room finale beats.
 *
 * Docs: docs/components/scenes/story-finale.md
 */

import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import archimedesImg from '../assets/archimedes.png'
import kingSitImg from '../assets/kingSit.png'
import blacksmithImg from '../assets/blacksmith-removebg-preview.png'
import scrollPng from '../assets/scroll.png'
import type { SceneId } from '../types/sceneId'
import { useLessonHub } from '../context/LessonHubContext'
import { ProofScrollWithLock } from './ProofScrollWithLock'
import { EurekaShareCard } from './EurekaShareCard'
import { FeedbackModal } from './FeedbackModal'

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
  const { progress, patchProgress } = useLessonHub()
  const { proofPresented, beatIndex } = progress.throne
  const proofUnlocked = progress.archimedes.proofUnlocked

  const [throneUnlockPhase, setThroneUnlockPhase] = useState<
    'idle' | 'playing' | 'done'
  >(() => (proofUnlocked ? 'playing' : 'idle'))
  const [shareOpen, setShareOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  useEffect(() => {
    if (!proofUnlocked) setThroneUnlockPhase('idle')
  }, [proofUnlocked])

  const onThroneUnlockVideoEnded = useCallback(() => {
    setThroneUnlockPhase('done')
  }, [])

  const beat = finaleBeats[Math.min(beatIndex, finaleBeats.length - 1)]

  const presentProof = () => {
    patchProgress({ throne: { proofPresented: true, beatIndex: 0 } })
  }

  const goNext = () =>
    patchProgress({
      throne: {
        proofPresented,
        beatIndex: Math.min(beatIndex + 1, finaleBeats.length - 1),
      },
    })

  const goPrev = () =>
    patchProgress({
      throne: {
        proofPresented,
        beatIndex: Math.max(beatIndex - 1, 0),
      },
    })

  if (!proofPresented) {
    return (
      <div className="scene story-finale-scene">
        <header className="scene-header hub-scene-header">
          <h2>Throne room</h2>
        </header>

        <section className="scene-body story-finale-body">
          <div className="story-finale-gate">
            <div className="story-finale-layout">
              <div className="story-finale-visual">
                <img
                  src={kingSitImg}
                  alt=""
                  className="story-finale-img story-finale-img--king"
                />
              </div>
              <div className="story-finale-copy">
                <p className="scene-text story-finale-text">
                  King Hiero waits. He will not be satisfied until you can <strong>prove</strong>, on
                  paper, whether the crown is pure gold — using the masses and volumes you gathered in
                  the workshops.
                </p>
              </div>
            </div>

            <div
              className={`story-finale-gate-card${proofUnlocked ? '' : ' story-finale-gate-card--locked'}`}
            >
              <p className="weigh-panel-kicker">Requirement</p>
              <h3>Proof scroll</h3>
              <p className="scene-text">
                {proofUnlocked
                  ? 'Your density proof is sealed. When you are ready, present the scroll to the king to begin the closing scene.'
                  : 'Locked — complete Archimedes’ study with the crown and gold-lump density rows, then seal the proof scroll there.'}
              </p>
            </div>

            <div className="story-finale-gate-actions">
              <button
                type="button"
                className="story-finale-proof-scroll-hit"
                disabled={!proofUnlocked || throneUnlockPhase === 'playing'}
                onClick={presentProof}
                aria-busy={throneUnlockPhase === 'playing'}
                aria-label={
                  proofUnlocked
                    ? 'Present the proof scroll to the king'
                    : 'Proof scroll locked — complete Archimedes’ study first'
                }
              >
                <ProofScrollWithLock
                  scrollSrc={scrollPng}
                  scrollImgClassName="story-finale-proof-scroll-img"
                  showPadlock={!proofUnlocked}
                  playUnlockVideo={proofUnlocked && throneUnlockPhase === 'playing'}
                  onUnlockVideoEnded={onThroneUnlockVideoEnded}
                />
                <span className="story-finale-proof-scroll-caption">
                  {!proofUnlocked
                    ? 'Scroll locked'
                    : throneUnlockPhase === 'playing'
                      ? 'Unlocking…'
                      : 'Present scroll to the king'}
                </span>
              </button>
              {!proofUnlocked ? (
                <p className="helper-text">
                  Use the bottom bar to open <strong>Archimedes&apos; room</strong> and fill in the
                  proof.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="scene story-finale-scene">
      <header className="scene-header hub-scene-header">
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
          <button className="secondary-button" type="button" onClick={goPrev} disabled={beatIndex === 0}>
            Previous
          </button>
        </div>
        <div className="scene-footer-right">
          {beatIndex < finaleBeats.length - 1 ? (
            <button className="primary-button" type="button" onClick={goNext}>
              Next
            </button>
          ) : (
            <>
              <button
                className="secondary-button"
                type="button"
                onClick={() => onNavigate('landing')}
              >
                Return to menu
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setFeedbackOpen(true)}
              >
                Give feedback
              </button>
              <button
                className="primary-button story-finale-share-cta"
                type="button"
                onClick={() => setShareOpen(true)}
              >
                <span className="story-finale-share-spark" aria-hidden>
                  ✦
                </span>
                Share your Eureka
              </button>
            </>
          )}
        </div>
      </footer>

      <EurekaShareCard open={shareOpen} onClose={() => setShareOpen(false)} />

      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        context="lesson-complete"
      />
    </div>
  )
}

export default StoryFinaleScene
