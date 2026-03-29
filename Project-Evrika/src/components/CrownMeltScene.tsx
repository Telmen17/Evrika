import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import archimedesPng from '../assets/archimedes.png'
import crownSvg from '../assets/crown.svg'
import type { SceneId } from './LandingPage'

interface CrownMeltSceneProps {
  onNavigate: (scene: SceneId) => void
}

const DRAG_TYPE = 'application/x-evrika-melt-crown'

type MeltPhase =
  | 'quiz'
  | 'quizFeedback'
  | 'prelude'
  | 'forge'
  | 'guard'
  | 'returnCrown'
  | 'done'

type QuizOptionId = 'volume' | 'noInfo' | 'ifAllowed' | 'mustStay'

const QUIZ_OPTIONS: Array<{
  id: QuizOptionId
  text: string
}> = [
  {
    id: 'volume',
    text: 'Melt it into a simple shape, then measure volume and density.',
  },
  {
    id: 'noInfo',
    text: 'Melting destroys the crown without revealing purity.',
  },
  {
    id: 'ifAllowed',
    text: 'Only if the king permits — we can’t destroy it on our own.',
  },
  {
    id: 'mustStay',
    text: 'Never — Hiero needs the crown intact.',
  },
]

const QUIZ_FEEDBACK: Record<QuizOptionId, string> = {
  volume: 'Okay — let’s try it out.',
  noInfo: 'You’re right — but let’s see what happens.',
  ifAllowed: 'Okay — let’s see what happens if we did.',
  mustStay:
    'You’re right — we can’t melt it. But let’s see whether Archimedes’s idea works or not.',
}

const CrownMeltScene: FC<CrownMeltSceneProps> = ({ onNavigate }) => {
  const [phase, setPhase] = useState<MeltPhase>('quiz')
  const [quizChoice, setQuizChoice] = useState<QuizOptionId | null>(null)
  const [crownAtForge, setCrownAtForge] = useState(false)
  const [guardPose, setGuardPose] = useState(0)
  const [guardSpeech, setGuardSpeech] = useState(false)
  const guardTimersRef = useRef<number[]>([])

  const clearGuardTimers = useCallback(() => {
    guardTimersRef.current.forEach((id) => window.clearTimeout(id))
    guardTimersRef.current = []
  }, [])

  useEffect(() => {
    if (
      phase === 'quiz' ||
      phase === 'quizFeedback' ||
      phase === 'prelude' ||
      phase === 'forge'
    ) {
      clearGuardTimers()
      setGuardPose(0)
      setGuardSpeech(false)
      return
    }

    if (phase !== 'guard') {
      return
    }

    const schedule = (fn: () => void, ms: number) => {
      guardTimersRef.current.push(window.setTimeout(fn, ms))
    }

    schedule(() => setGuardPose(1), 120)
    schedule(() => setGuardPose(2), 700)
    schedule(() => setGuardSpeech(true), 1050)
    schedule(() => setPhase('returnCrown'), 2400)

    return clearGuardTimers
  }, [phase, clearGuardTimers])

  const handleDragFromPool = (e: React.DragEvent) => {
    if (phase !== 'forge' || crownAtForge) return
    e.dataTransfer.setData(DRAG_TYPE, 'crown')
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragFromForge = (e: React.DragEvent) => {
    if (phase !== 'returnCrown' || !crownAtForge) return
    e.dataTransfer.setData(DRAG_TYPE, 'crown')
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverForge = (e: React.DragEvent) => {
    if (phase !== 'forge' || crownAtForge) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnForge = (e: React.DragEvent) => {
    e.preventDefault()
    if (phase !== 'forge' || crownAtForge) return
    if (e.dataTransfer.getData(DRAG_TYPE) !== 'crown') return
    setCrownAtForge(true)
    window.setTimeout(() => setPhase('guard'), 450)
  }

  const handleDragOverPool = (e: React.DragEvent) => {
    if (phase !== 'returnCrown' || !crownAtForge) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropOnPool = (e: React.DragEvent) => {
    e.preventDefault()
    if (phase !== 'returnCrown' || !crownAtForge) return
    if (e.dataTransfer.getData(DRAG_TYPE) !== 'crown') return
    setCrownAtForge(false)
    setPhase('done')
  }

  const canContinue = phase === 'done'

  const guardOrAfter =
    phase === 'guard' || phase === 'returnCrown' || phase === 'done'

  return (
    <div className="scene crown-melt-scene">
      <header className="scene-header">
        <button
          className="link-button"
          type="button"
          onClick={() => onNavigate('weigh')}
        >
          ← Back to weighing test
        </button>
        <h2>Test 2 – The Forbidden Furnace</h2>
      </header>

      <section className="scene-body experiment-layout">
        <div className="experiment-controls crown-melt-panel">
          {phase === 'quiz' && (
            <div className="crown-melt-quiz-bundle">
              <div className="crown-melt-quiz-top">
                <p className="weigh-panel-kicker crown-melt-quiz-kicker">Think first</p>
                <h3 className="crown-melt-prompt">
                  Should we melt the crown to learn its purity and what’s inside?
                </h3>
              </div>
              <div className="crown-melt-quiz-grid" role="group" aria-label="Answer choices">
                {QUIZ_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`crown-melt-quiz-option ${quizChoice === opt.id ? 'crown-melt-quiz-option-selected' : ''}`}
                    onClick={() => setQuizChoice(opt.id)}
                  >
                    <span className="crown-melt-quiz-option-text">{opt.text}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="primary-button crown-melt-quiz-continue"
                disabled={!quizChoice}
                onClick={() => setPhase('quizFeedback')}
              >
                Continue
              </button>
            </div>
          )}

          {phase === 'quizFeedback' && quizChoice && (
            <div className="crown-melt-feedback">
              <p className="scene-text crown-melt-feedback-body">
                {QUIZ_FEEDBACK[quizChoice]}
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={() => setPhase('prelude')}
              >
                Continue
              </button>
            </div>
          )}

          {phase === 'prelude' && (
            <>
              <p className="weigh-panel-kicker">Workshop</p>
              <p className="scene-text crown-melt-prelude-copy">
                Drag the crown into the furnace on the right.
              </p>
              <button
                type="button"
                className="primary-button"
                onClick={() => setPhase('forge')}
              >
                Continue
              </button>
            </>
          )}

          {phase === 'forge' && !crownAtForge && (
            <div className="crown-melt-panel-hint">
              <p className="scene-text crown-melt-panel-hint-single">
                Drag the crown into the furnace.
              </p>
            </div>
          )}

          {phase === 'guard' && (
            <div className="crown-melt-panel-hint">
              <p className="scene-text crown-melt-panel-hint-single">
                A guard steps in — listen, then move the crown back.
              </p>
            </div>
          )}

          {phase === 'returnCrown' && (
            <div className="crown-melt-panel-hint crown-melt-panel-hint-pulse">
              <p className="scene-text crown-melt-panel-hint-single">
                Drag the crown back to the pedestal.
              </p>
            </div>
          )}

          {phase === 'done' && (
            <div className="crown-melt-panel-hint">
              <p className="scene-text crown-melt-panel-hint-single">
                So much for the furnace — next, we’ll need another approach.
              </p>
            </div>
          )}
        </div>

        <div className="experiment-canvas crown-melt-canvas">
          <div className="crown-melt-workshop">
            {phase !== 'quiz' && phase !== 'quizFeedback' ? (
              <div className="crown-melt-archimedes">
                <div className="crown-melt-archimedes-glow" />
                <img
                  src={archimedesPng}
                  alt=""
                  className="crown-melt-archimedes-img"
                />
              </div>
            ) : null}

            <div
              className={`crown-melt-furnace-wrap ${phase === 'forge' && !crownAtForge ? 'crown-melt-furnace-wrap-active' : ''}`}
              onDragOver={handleDragOverForge}
              onDrop={handleDropOnForge}
            >
              <div className="crown-melt-furnace" aria-hidden="true">
                <div className="crown-melt-furnace-body" />
                <div className="crown-melt-furnace-mouth" />
                <div className="crown-melt-flames" aria-hidden="true">
                  <span className="crown-melt-flame crown-melt-flame-a" />
                  <span className="crown-melt-flame crown-melt-flame-b" />
                  <span className="crown-melt-flame crown-melt-flame-c" />
                </div>
              </div>
              {crownAtForge && (
                <div
                  className={`crown-melt-crown-in-forge ${phase === 'returnCrown' ? 'crown-melt-crown-in-forge-draggable' : ''}`}
                  draggable={phase === 'returnCrown'}
                  onDragStart={handleDragFromForge}
                >
                  <img src={crownSvg} alt="" className="crown-melt-crown-img" />
                </div>
              )}
              <span className="crown-melt-forge-label">Furnace</span>
            </div>

            {(phase === 'forge' && !crownAtForge) ||
            phase === 'returnCrown' ||
            phase === 'done' ? (
              <div
                className={`crown-melt-crown-pool ${phase === 'returnCrown' && crownAtForge ? 'crown-melt-crown-pool-drop-target' : ''}`}
                draggable={phase === 'forge' && !crownAtForge}
                onDragStart={handleDragFromPool}
                onDragOver={handleDragOverPool}
                onDrop={handleDropOnPool}
              >
                {phase === 'returnCrown' && crownAtForge ? null : (
                  <img src={crownSvg} alt="Royal crown" className="crown-melt-crown-img" />
                )}
                <span className="crown-melt-crown-caption">
                  {phase === 'done'
                    ? 'Back on the pedestal'
                    : phase === 'returnCrown' && crownAtForge
                      ? 'Drop the crown here'
                      : 'Drag me to the furnace'}
                </span>
              </div>
            ) : null}

            {guardOrAfter && (
              <div
                className={`crown-melt-guard ${guardPose >= 1 ? 'crown-melt-guard-visible' : ''} crown-melt-guard-pose-${guardPose}`}
                role="img"
                aria-label="Royal guard halting the attempt"
              >
                <div className="crown-melt-guard-stack">
                  {guardSpeech && (
                    <div className="crown-melt-guard-speech">
                      <strong>Halt!</strong> The crown is sacred — you may not melt or destroy it.
                      Hiero&apos;s order stands.
                    </div>
                  )}
                  <svg
                    className="crown-melt-guard-svg"
                    viewBox="0 0 120 160"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <ellipse cx="60" cy="148" rx="38" ry="8" fill="rgba(0,0,0,0.12)" />
                    <rect x="44" y="72" width="32" height="52" rx="6" fill="#3d4a5c" />
                    <rect x="40" y="88" width="12" height="36" rx="4" fill="#2f3847" />
                    <rect x="68" y="88" width="12" height="36" rx="4" fill="#2f3847" />
                    <circle cx="60" cy="48" r="22" fill="#e8c4a0" />
                    <path
                      d="M38 44 L82 44 L78 28 L42 28 Z"
                      fill="#5c4033"
                    />
                    <rect x="34" y="40" width="52" height="10" rx="2" fill="#6d4c3d" />
                    <g
                      className="crown-melt-guard-arm"
                      style={{ transformOrigin: '76px 78px' }}
                    >
                      <rect x="72" y="74" width="36" height="10" rx="4" fill="#e8c4a0" />
                      <rect x="100" y="68" width="14" height="22" rx="3" fill="#c49a6c" />
                    </g>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="scene-footer">
        <div className="scene-footer-left">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onNavigate('weigh')}
          >
            Back to weighing test
          </button>
        </div>
        <div className="scene-footer-right">
          <button
            className="primary-button"
            type="button"
            onClick={() => onNavigate('bathStory')}
            disabled={!canContinue}
          >
            Continue to the bath story
          </button>
        </div>
      </footer>
    </div>
  )
}

export default CrownMeltScene
