import type { FC } from 'react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import archimedesPng from '../assets/archimedes.png'
import crownSvg from '../assets/crown.svg'
import furnacePng from '../assets/furnace.png'
import guardPng from '../assets/guard.png'
import type { SceneId } from './LandingPage'
import { useLessonHub } from '../context/LessonHubContext'

interface CrownMeltSceneProps {
  onNavigate: (scene: SceneId) => void
}

const DRAG_TYPE = 'application/x-evrika-melt-crown'

type MeltPhase =
  | 'quiz'
  | 'quizFeedback'
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

function coerceQuizChoice(raw: string | null): QuizOptionId | null {
  if (!raw) return null
  return QUIZ_OPTIONS.some((o) => o.id === raw) ? (raw as QuizOptionId) : null
}

function initialGuardPoseForMelt(m: {
  phase: string
  guardPose?: number
}): number {
  if (m.phase === 'returnCrown' || m.phase === 'done') return 2
  if (m.phase === 'guard') {
    const n = Number(m.guardPose)
    if (Number.isFinite(n)) return Math.min(2, Math.max(0, n))
  }
  return 0
}

function initialGuardSpeechForMelt(m: {
  phase: string
  guardSpeechShown?: boolean
}): boolean {
  if (m.phase === 'returnCrown' || m.phase === 'done') return true
  if (m.phase === 'guard') return Boolean(m.guardSpeechShown)
  return false
}

const QUIZ_FEEDBACK: Record<QuizOptionId, string> = {
  volume: 'Okay — let’s try it out.',
  noInfo: 'You’re right — but let’s see what happens.',
  ifAllowed: 'Okay — let’s see what happens if we did.',
  mustStay:
    'You’re right — we can’t melt it. But let’s see whether Archimedes’s idea works or not.',
}

/** After the room is complete, tapping furnace / crown / guard plays this reminder. */
const GUARD_REVISIT_AUDIO_SRC = '/audio/guard-warn2.mp3'
const GUARD_REVISIT_TRANSCRIPT =
  "Don't try anything funny, you are still forbidden from melting the crown!"

/** Furnace image + animated fire (shared by quiz preview and interactive workshop). */
const FurnaceFireVisual: FC = () => (
  <>
    <img src={furnacePng} alt="" className="crown-melt-furnace-img" />
    <div className="crown-melt-firebox-fx" aria-hidden="true">
      <div className="crown-melt-firebox-glow" />
      <div className="crown-melt-flames crown-melt-flames--on-image">
        <span className="crown-melt-flame crown-melt-flame-a" />
        <span className="crown-melt-flame crown-melt-flame-b" />
        <span className="crown-melt-flame crown-melt-flame-c" />
        <span className="crown-melt-ember crown-melt-ember-1" />
        <span className="crown-melt-ember crown-melt-ember-2" />
        <span className="crown-melt-ember crown-melt-ember-3" />
      </div>
    </div>
  </>
)

const CrownMeltScene: FC<CrownMeltSceneProps> = ({ onNavigate: _onNavigate }) => {
  const { progress, patchProgress } = useLessonHub()
  const saved = progress.melt
  const [phase, setPhase] = useState<MeltPhase>(() => saved.phase)
  const [quizChoice, setQuizChoice] = useState<QuizOptionId | null>(() =>
    coerceQuizChoice(saved.quizChoice),
  )
  const [crownAtForge, setCrownAtForge] = useState(() => saved.crownAtForge)
  const [guardPose, setGuardPose] = useState(() => initialGuardPoseForMelt(saved))
  const [guardSpeech, setGuardSpeech] = useState(() =>
    initialGuardSpeechForMelt(saved),
  )
  const [guardVoicePlaying, setGuardVoicePlaying] = useState(false)
  const guardTimersRef = useRef<number[]>([])
  const guardAudioRef = useRef<HTMLAudioElement | null>(null)
  const revisitAudioRef = useRef<HTMLAudioElement | null>(null)
  const [revisitWarnOpen, setRevisitWarnOpen] = useState(false)
  const [revisitVoicePlaying, setRevisitVoicePlaying] = useState(false)
  const guardPoseRef = useRef(guardPose)
  const guardSpeechRef = useRef(guardSpeech)
  guardPoseRef.current = guardPose
  guardSpeechRef.current = guardSpeech

  const clearGuardTimers = useCallback(() => {
    guardTimersRef.current.forEach((id) => window.clearTimeout(id))
    guardTimersRef.current = []
  }, [])

  useEffect(() => {
    patchProgress({
      melt: {
        phase,
        quizChoice,
        crownAtForge,
        guardPose:
          phase === 'quiz' || phase === 'quizFeedback' || phase === 'forge'
            ? 0
            : guardPose,
        guardSpeechShown:
          phase === 'quiz' || phase === 'quizFeedback' || phase === 'forge'
            ? false
            : guardSpeech,
      },
    })
  }, [
    phase,
    quizChoice,
    crownAtForge,
    guardPose,
    guardSpeech,
    patchProgress,
  ])

  useLayoutEffect(() => {
    if (
      (phase === 'returnCrown' || phase === 'done') &&
      (guardPose < 2 || !guardSpeech)
    ) {
      setGuardPose(2)
      setGuardSpeech(true)
    }
  }, [phase, guardPose, guardSpeech])

  useEffect(() => {
    if (
      phase === 'quiz' ||
      phase === 'quizFeedback' ||
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

    clearGuardTimers()

    const schedule = (fn: () => void, ms: number) => {
      guardTimersRef.current.push(window.setTimeout(fn, ms))
    }

    const pose = guardPoseRef.current
    const speech = guardSpeechRef.current

    if (speech && pose >= 2) {
      schedule(() => setPhase('returnCrown'), 500)
      return clearGuardTimers
    }

    if (pose === 0) {
      schedule(() => setGuardPose(1), 120)
      schedule(() => setGuardPose(2), 700)
      schedule(() => setGuardSpeech(true), 1050)
      schedule(() => setPhase('returnCrown'), 2400)
      return clearGuardTimers
    }

    if (pose === 1) {
      schedule(() => setGuardPose(2), 580)
      schedule(() => setGuardSpeech(true), 930)
      schedule(() => setPhase('returnCrown'), 2280)
      return clearGuardTimers
    }

    if (pose === 2 && !speech) {
      schedule(() => setGuardSpeech(true), 350)
      schedule(() => setPhase('returnCrown'), 1700)
      return clearGuardTimers
    }

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

  const guardOrAfter =
    phase === 'guard' || phase === 'returnCrown' || phase === 'done'

  const showCrownPool =
    (phase === 'forge' && !crownAtForge) ||
    phase === 'returnCrown' ||
    phase === 'done'

  const toggleGuardVoice = useCallback(() => {
    const el = guardAudioRef.current
    if (!el) return
    if (el.paused) {
      el.play().catch(() => {})
    } else {
      el.pause()
      el.currentTime = 0
    }
  }, [])

  useEffect(() => {
    if (!guardSpeech) {
      const a = guardAudioRef.current
      if (a) {
        a.pause()
        a.currentTime = 0
      }
      setGuardVoicePlaying(false)
    }
  }, [guardSpeech])

  const triggerRevisitGuardWarn = useCallback(() => {
    if (phase !== 'done') return
    setRevisitWarnOpen(true)
    const el = revisitAudioRef.current
    if (el) {
      el.currentTime = 0
      void el.play().catch(() => {
        /* autoplay / missing file */
      })
    }
  }, [phase])

  const closeRevisitWarn = useCallback(() => {
    setRevisitWarnOpen(false)
    const el = revisitAudioRef.current
    if (el) {
      el.pause()
      el.currentTime = 0
    }
    setRevisitVoicePlaying(false)
  }, [])

  const toggleRevisitVoice = useCallback(() => {
    const el = revisitAudioRef.current
    if (!el) return
    if (el.paused) {
      void el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [])

  const onRevisitKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (phase !== 'done') return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        triggerRevisitGuardWarn()
      }
    },
    [phase, triggerRevisitGuardWarn],
  )

  return (
    <div className="scene crown-melt-scene">
      <header className="scene-header hub-scene-header">
        <h2>Test 2 – The Forbidden Furnace</h2>
      </header>

      <section className="scene-body experiment-layout">
        <div className="experiment-controls crown-melt-panel">
          <div className="crown-melt-panel-body">
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
              </div>
            )}

            {phase === 'quizFeedback' && quizChoice && (
              <div className="crown-melt-feedback">
                <p className="scene-text crown-melt-feedback-body">
                  {QUIZ_FEEDBACK[quizChoice]}
                </p>
              </div>
            )}

            {phase === 'forge' && !crownAtForge && (
              <div className="crown-melt-panel-hint">
                <p className="scene-text crown-melt-panel-hint-single">
                  Drag the crown into the furnace in the center.
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
                  So much for the furnace — we have found out that we cannot use the furnace, we’ll need another approach.
                </p>
              </div>
            )}
          </div>

          {(phase === 'quiz' || phase === 'quizFeedback') && (
            <div className="crown-melt-panel-actions">
              {phase === 'quiz' && (
                <button
                  type="button"
                  className="primary-button crown-melt-panel-continue"
                  disabled={!quizChoice}
                  onClick={() => setPhase('quizFeedback')}
                >
                  Continue
                </button>
              )}
              {phase === 'quizFeedback' && (
                <button
                  type="button"
                  className="primary-button crown-melt-panel-continue"
                  onClick={() => setPhase('forge')}
                >
                  Continue
                </button>
              )}
            </div>
          )}
        </div>

        <div className="experiment-canvas crown-melt-canvas">
          <div className="crown-melt-workshop">
            {phase === 'done' && revisitWarnOpen ? (
              <div
                className="crown-melt-revisit-bubble"
                role="dialog"
                aria-labelledby="crown-melt-revisit-title"
                aria-modal="true"
              >
                <button
                  type="button"
                  className="crown-melt-revisit-close"
                  onClick={closeRevisitWarn}
                  aria-label="Close"
                >
                  ×
                </button>
                <button
                  type="button"
                  className={`crown-melt-revisit-audio ${revisitVoicePlaying ? 'crown-melt-revisit-audio--on' : ''}`}
                  aria-label={revisitVoicePlaying ? 'Stop voice' : 'Play voice'}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    toggleRevisitVoice()
                  }}
                >
                  <span aria-hidden>{revisitVoicePlaying ? '◼' : '▶'}</span>
                </button>
                <p id="crown-melt-revisit-title" className="crown-melt-revisit-kicker">
                  Royal guard
                </p>
                <p className="crown-melt-revisit-text">{GUARD_REVISIT_TRANSCRIPT}</p>
                <audio
                  ref={revisitAudioRef}
                  src={GUARD_REVISIT_AUDIO_SRC}
                  preload="metadata"
                  onPlay={() => setRevisitVoicePlaying(true)}
                  onPause={() => setRevisitVoicePlaying(false)}
                  onEnded={() => setRevisitVoicePlaying(false)}
                />
              </div>
            ) : null}

            <div
              className="crown-melt-stage-row"
              aria-hidden={phase === 'quiz' || phase === 'quizFeedback'}
            >
              <div className="crown-melt-slot crown-melt-slot--guard">
                {guardOrAfter ? (
                  <div
                    className={`crown-melt-guard ${guardPose >= 1 ? 'crown-melt-guard-visible' : ''} crown-melt-guard-pose-${guardPose}${phase === 'done' ? ' crown-melt-guard--done-tappable' : ''}`}
                    role={phase === 'done' ? 'button' : 'img'}
                    tabIndex={phase === 'done' ? 0 : undefined}
                    aria-label={
                      phase === 'done'
                        ? 'Royal guard — tap for reminder about the crown'
                        : 'Royal guard halting the attempt'
                    }
                    onClick={phase === 'done' ? () => triggerRevisitGuardWarn() : undefined}
                    onKeyDown={phase === 'done' ? onRevisitKeyDown : undefined}
                  >
                    <div className="crown-melt-guard-stack">
                      {guardSpeech && phase !== 'done' && (
                        <div className="crown-melt-guard-speech">
                          <button
                            type="button"
                            className={`crown-melt-guard-speech-audio ${guardVoicePlaying ? 'crown-melt-guard-speech-audio--on' : ''}`}
                            aria-label={guardVoicePlaying ? 'Stop guard voice' : 'Play guard voice'}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleGuardVoice()
                            }}
                          >
                            <span className="crown-melt-guard-speech-audio-icon" aria-hidden="true">
                              {guardVoicePlaying ? '◼' : '▶'}
                            </span>
                          </button>
                          <p className="crown-melt-guard-speech-text">
                            <strong>Halt!</strong> The crown is sacred — you may not melt or destroy it.
                            Hiero&apos;s order stands.
                          </p>
                          <audio
                            ref={guardAudioRef}
                            src="/audio/guard-voice.mp3"
                            preload="metadata"
                            onEnded={() => setGuardVoicePlaying(false)}
                            onPlay={() => setGuardVoicePlaying(true)}
                            onPause={() => setGuardVoicePlaying(false)}
                          />
                        </div>
                      )}
                      <img
                        src={guardPng}
                        alt=""
                        className="crown-melt-guard-img"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="crown-melt-slot-placeholder crown-melt-slot-placeholder--guard" aria-hidden />
                )}
              </div>

              <div className="crown-melt-slot crown-melt-slot--furnace">
                <div
                  className={`crown-melt-furnace-wrap ${phase === 'forge' && !crownAtForge ? 'crown-melt-furnace-wrap-active' : ''}${phase === 'done' ? ' crown-melt-furnace-wrap--done-tappable' : ''}`}
                  role={phase === 'done' ? 'button' : undefined}
                  tabIndex={phase === 'done' ? 0 : undefined}
                  aria-label={phase === 'done' ? 'Furnace — tap for a reminder' : undefined}
                  onClick={phase === 'done' ? () => triggerRevisitGuardWarn() : undefined}
                  onKeyDown={phase === 'done' ? onRevisitKeyDown : undefined}
                  onDragOver={handleDragOverForge}
                  onDrop={handleDropOnForge}
                >
                  <div className="crown-melt-furnace-media">
                    <FurnaceFireVisual />
                    {crownAtForge && (
                      <div
                        className={`crown-melt-crown-in-forge ${phase === 'returnCrown' ? 'crown-melt-crown-in-forge-draggable' : ''}`}
                        draggable={phase === 'returnCrown'}
                        onDragStart={handleDragFromForge}
                      >
                        <img src={crownSvg} alt="" className="crown-melt-crown-img" />
                      </div>
                    )}
                  </div>
                  <span className="crown-melt-forge-label">Furnace</span>
                </div>
              </div>

              <div className="crown-melt-slot crown-melt-slot--crown">
                {showCrownPool ? (
                  <div
                    className={`crown-melt-crown-pool ${phase === 'returnCrown' && crownAtForge ? 'crown-melt-crown-pool-drop-target' : ''}${phase === 'done' ? ' crown-melt-crown-pool--done-tappable' : ''}`}
                    role={phase === 'done' ? 'button' : undefined}
                    tabIndex={phase === 'done' ? 0 : undefined}
                    aria-label={phase === 'done' ? 'Crown on pedestal — tap for a reminder' : undefined}
                    draggable={phase === 'forge' && !crownAtForge}
                    onDragStart={handleDragFromPool}
                    onDragOver={handleDragOverPool}
                    onDrop={handleDropOnPool}
                    onClick={phase === 'done' ? () => triggerRevisitGuardWarn() : undefined}
                    onKeyDown={phase === 'done' ? onRevisitKeyDown : undefined}
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
                ) : (
                  <div className="crown-melt-crown-slot-spacer" aria-hidden />
                )}
              </div>

              <div className="crown-melt-slot crown-melt-slot--archimedes">
                <div className="crown-melt-archimedes">
                  <div className="crown-melt-archimedes-glow" />
                  <img
                    src={archimedesPng}
                    alt=""
                    className="crown-melt-archimedes-img"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default CrownMeltScene
