/**
 * HubOnboardingGuide — first-visit guided tour of the workshop.
 *
 * Docs: docs/components/hub.md
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import {
  resetCompanionHeadFlight,
  setCompanionHeadGuideHighlight,
  setCompanionHeadPosition,
} from '../lib/hubGuideHeadFlight'

interface HubOnboardingGuideProps {
  open: boolean
  onClose: () => void
  companionHeadRef: RefObject<HTMLButtonElement | null>
}

interface GuideStep {
  /** CSS selector of the element to spotlight; null = centered welcome/farewell. */
  selector: string | null
  title: string
  text: string
  /** Extra padding (px) around the spotlighted element. */
  pad?: number
}

const STEPS: GuideStep[] = [
  {
    selector: null,
    title: 'Greetings — I am Archimedes!',
    text: "Welcome to my workshop. Follow me and I'll show you how to crack King Hiero's puzzle.",
  },
  {
    selector: '.hub-objective-text',
    title: 'Your challenge',
    text: "The king fears his crown isn't pure gold. We must prove the truth — without melting or breaking it.",
  },
  {
    selector: '.hub-nav-bar',
    title: 'The rooms',
    text: 'Start in the Weighing Chamber and Furnace. New experiments unlock only after you finish the clues before them.',
    pad: 6,
  },
  {
    selector: '.hub-nav-item[data-room="weigh"]',
    title: 'Begin here',
    text: 'Weigh the crown against pure gold. Record the mass — you will need every clue later.',
    pad: 8,
  },
  {
    selector: '.archimedes-companion__head-btn',
    title: 'Need a hand?',
    text: 'Tap my head any time for a hint. Now go — prove what the crown is truly made of!',
    pad: 8,
  },
]

const CLUSTER_W = 332
const CLUSTER_H = 210
const CLUSTER_HEAD_CENTER_X = CLUSTER_W / 2
const CLUSTER_HEAD_CENTER_Y = 42
const CLUSTER_SPOTLIGHT_PAD = 12
const HEAD_SPOTLIGHT_PAD = 10
const MARGIN = 16
const GAP = 22
const FLIGHT_MS = 850

type GuidePhase = 'entering' | 'active' | 'exiting'

interface ClusterPos {
  x: number
  y: number
  /** Which side of the cluster points at the target (for the pointer nub). */
  arrow: 'left' | 'right' | 'up' | 'down' | 'none'
}

function rectCenter(rect: DOMRect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function getGuideHeadAnchor(pos: ClusterPos) {
  return {
    x: pos.x + CLUSTER_HEAD_CENTER_X,
    y: pos.y + CLUSTER_HEAD_CENTER_Y,
  }
}

function computeClusterPos(rect: DOMRect | null): ClusterPos {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (!rect) {
    return {
      x: Math.round((vw - CLUSTER_W) / 2),
      y: Math.round(vh / 2 - CLUSTER_H / 2),
      arrow: 'none',
    }
  }

  const spaceRight = vw - rect.right
  const spaceLeft = rect.left
  const spaceBelow = vh - rect.bottom
  const spaceAbove = rect.top

  let x: number
  let y: number
  let arrow: ClusterPos['arrow']

  if (spaceRight >= CLUSTER_W + GAP) {
    x = rect.right + GAP
    y = rect.top + rect.height / 2 - CLUSTER_H / 2
    arrow = 'left'
  } else if (spaceLeft >= CLUSTER_W + GAP) {
    x = rect.left - CLUSTER_W - GAP
    y = rect.top + rect.height / 2 - CLUSTER_H / 2
    arrow = 'right'
  } else if (spaceBelow >= CLUSTER_H + GAP) {
    x = rect.left + rect.width / 2 - CLUSTER_W / 2
    y = rect.bottom + GAP
    arrow = 'up'
  } else if (spaceAbove >= CLUSTER_H + GAP) {
    x = rect.left + rect.width / 2 - CLUSTER_W / 2
    y = rect.top - CLUSTER_H - GAP
    arrow = 'down'
  } else {
    x = (vw - CLUSTER_W) / 2
    y = vh - CLUSTER_H - MARGIN
    arrow = 'none'
  }

  x = Math.min(Math.max(x, MARGIN), vw - CLUSTER_W - MARGIN)
  y = Math.min(Math.max(y, MARGIN), vh - CLUSTER_H - MARGIN)
  return { x: Math.round(x), y: Math.round(y), arrow }
}

export function HubOnboardingGuide({
  open,
  onClose,
  companionHeadRef,
}: HubOnboardingGuideProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [pos, setPos] = useState<ClusterPos>({ x: 0, y: 0, arrow: 'none' })
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<GuidePhase>('entering')
  const [headRect, setHeadRect] = useState<DOMRect | null>(null)
  const rafRef = useRef(0)
  const exitDoneRef = useRef(false)
  const enterStartedRef = useRef(false)
  const enterTimerRef = useRef<number | null>(null)
  const exitTimerRef = useRef<number | null>(null)
  const skipNextHeadMoveRef = useRef(false)

  const step = STEPS[stepIndex]
  const isLast = stepIndex >= STEPS.length - 1

  const measure = useCallback(() => {
    const current = STEPS[stepIndex]
    let nextRect: DOMRect | null = null
    if (current.selector) {
      const el = document.querySelector(current.selector)
      if (el) nextRect = el.getBoundingClientRect()
    }
    const nextPos = computeClusterPos(nextRect)
    setRect(nextRect)
    setPos(nextPos)

    const head = companionHeadRef.current
    setHeadRect(head ? head.getBoundingClientRect() : null)

    return nextPos
  }, [stepIndex, companionHeadRef])

  const clearEnterTimer = useCallback(() => {
    if (enterTimerRef.current != null) {
      window.clearTimeout(enterTimerRef.current)
      enterTimerRef.current = null
    }
  }, [])

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current != null) {
      window.clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }
  }, [])

  const finishExit = useCallback(() => {
    if (exitDoneRef.current) return
    exitDoneRef.current = true
    clearExitTimer()
    resetCompanionHeadFlight(companionHeadRef.current)
    setPhase('entering')
    setReady(false)
    onClose()
  }, [clearExitTimer, companionHeadRef, onClose])

  const beginExit = useCallback(() => {
    if (phase === 'exiting') return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const head = companionHeadRef.current
    const dockEl = document.querySelector('.archimedes-companion__head-slot')

    if (reduced || !head || !dockEl) {
      finishExit()
      return
    }

    const from = rectCenter(head.getBoundingClientRect())
    const to = rectCenter(dockEl.getBoundingClientRect())

    exitDoneRef.current = false
    setPhase('exiting')
    setCompanionHeadPosition(head, from.x, from.y, false)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCompanionHeadPosition(head, to.x, to.y, true)
      })
    })

    clearExitTimer()
    exitTimerRef.current = window.setTimeout(() => finishExit(), FLIGHT_MS + 80)
  }, [phase, clearExitTimer, companionHeadRef, finishExit])

  const runEnter = useCallback(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const head = companionHeadRef.current
    const current = STEPS[0]
    let nextRect: DOMRect | null = null
    if (current.selector) {
      const el = document.querySelector(current.selector)
      if (el) nextRect = el.getBoundingClientRect()
    }
    const nextPos = computeClusterPos(nextRect)
    setRect(nextRect)
    setPos(nextPos)

    if (!head) {
      setPhase('active')
      setReady(true)
      return
    }

    if (reduced) {
      const anchor = getGuideHeadAnchor(nextPos)
      setCompanionHeadPosition(head, anchor.x, anchor.y, false)
      setPhase('active')
      setReady(true)
      return
    }

    const dockCenter = rectCenter(head.getBoundingClientRect())
    const anchor = getGuideHeadAnchor(nextPos)

    setPhase('entering')
    setReady(false)
    setCompanionHeadPosition(head, dockCenter.x, dockCenter.y, false)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCompanionHeadPosition(head, anchor.x, anchor.y, true)
      })
    })

    clearEnterTimer()
    enterTimerRef.current = window.setTimeout(() => {
      enterTimerRef.current = null
      skipNextHeadMoveRef.current = true
      setPhase('active')
      setReady(true)
    }, FLIGHT_MS)
  }, [clearEnterTimer, companionHeadRef])

  useEffect(() => {
    if (!open) {
      setStepIndex(0)
      setReady(false)
      setPhase('entering')
      exitDoneRef.current = false
      enterStartedRef.current = false
      clearEnterTimer()
      clearExitTimer()
      resetCompanionHeadFlight(companionHeadRef.current)
    }
  }, [open, clearEnterTimer, clearExitTimer, companionHeadRef])

  useLayoutEffect(() => {
    if (!open || enterStartedRef.current) return
    enterStartedRef.current = true
    runEnter()
  }, [open, runEnter])

  useLayoutEffect(() => {
    if (!open || !enterStartedRef.current) return
    measure()
  }, [open, stepIndex, measure])

  useEffect(() => {
    if (!open || phase !== 'active') return
    const head = companionHeadRef.current
    if (!head) return
    const anchor = getGuideHeadAnchor(pos)
    const animate = !skipNextHeadMoveRef.current
    skipNextHeadMoveRef.current = false
    setCompanionHeadPosition(head, anchor.x, anchor.y, animate)
    setHeadRect(head.getBoundingClientRect())
  }, [open, phase, pos, companionHeadRef])

  useEffect(() => {
    if (!open || !ready || phase === 'exiting') {
      setCompanionHeadGuideHighlight(companionHeadRef.current, false)
      return
    }
    setCompanionHeadGuideHighlight(companionHeadRef.current, true)
  }, [open, ready, phase, companionHeadRef, headRect, stepIndex])

  useEffect(() => {
    if (!open) return
    const onChange = () => {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = window.requestAnimationFrame(measure)
    }
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      window.cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [open, measure])

  const goNext = useCallback(() => {
    if (isLast) {
      beginExit()
      return
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }, [isLast, beginExit])

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0))
  }, [])

  useEffect(() => {
    if (!open || phase !== 'active') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') beginExit()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, phase, beginExit, goNext, goPrev])

  useEffect(() => {
    const head = companionHeadRef.current
    if (!head) return

    const syncHeadRect = () => {
      setHeadRect(head.getBoundingClientRect())
    }

    head.addEventListener('transitionend', syncHeadRect)
    return () => {
      head.removeEventListener('transitionend', syncHeadRect)
    }
  }, [companionHeadRef, open, phase])

  const handleHeadTransitionEnd = useCallback(
    (e: Event) => {
      if (phase !== 'exiting' || !(e instanceof TransitionEvent)) return
      if (e.propertyName === 'top') finishExit()
    },
    [phase, finishExit],
  )

  useEffect(() => {
    const head = companionHeadRef.current
    if (!head) return
    head.addEventListener('transitionend', handleHeadTransitionEnd)
    return () => {
      head.removeEventListener('transitionend', handleHeadTransitionEnd)
    }
  }, [companionHeadRef, handleHeadTransitionEnd, open, phase])

  if (!open) return null

  const pad = step.pad ?? 8
  const showGuideChrome = ready && phase !== 'exiting'
  const headIsTarget = step.selector === '.archimedes-companion__head-btn'
  const showClusterSpotlight = showGuideChrome && !rect
  const showTargetSpotlight = showGuideChrome && !!rect
  const showHeadSpotlight =
    showGuideChrome && !!headRect && !!rect && !headIsTarget

  const targetSpotlightStyle = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : undefined

  const clusterSpotlightStyle = showClusterSpotlight
    ? {
        top: pos.y - CLUSTER_SPOTLIGHT_PAD,
        left: pos.x - CLUSTER_SPOTLIGHT_PAD,
        width: CLUSTER_W + CLUSTER_SPOTLIGHT_PAD * 2,
        height: CLUSTER_H + CLUSTER_SPOTLIGHT_PAD * 2,
      }
    : undefined

  const headSpotlightStyle = headRect
    ? {
        top: headRect.top - HEAD_SPOTLIGHT_PAD,
        left: headRect.left - HEAD_SPOTLIGHT_PAD,
        width: headRect.width + HEAD_SPOTLIGHT_PAD * 2,
        height: headRect.height + HEAD_SPOTLIGHT_PAD * 2,
      }
    : undefined

  return (
    <div
      className={`hub-guide${ready ? ' hub-guide--ready' : ''}${
        phase === 'entering' ? ' hub-guide--entering' : ''
      }${phase === 'exiting' ? ' hub-guide--exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Workshop guide"
    >
      <button
        type="button"
        className={`hub-guide-backdrop${
          showClusterSpotlight || showTargetSpotlight
            ? ' hub-guide-backdrop--clear'
            : ''
        }`}
        aria-label="Skip guide"
        onClick={beginExit}
        disabled={phase !== 'active'}
      />

      {showClusterSpotlight ? (
        <div
          className="hub-guide-spotlight hub-guide-spotlight--cluster"
          style={clusterSpotlightStyle}
          aria-hidden
        />
      ) : null}

      {showTargetSpotlight ? (
        <div className="hub-guide-spotlight" style={targetSpotlightStyle} aria-hidden />
      ) : null}

      {showHeadSpotlight ? (
        <div
          className="hub-guide-spotlight hub-guide-spotlight--head"
          style={headSpotlightStyle}
          aria-hidden
        />
      ) : null}

      <div
        className={`hub-guide-cluster hub-guide-cluster--arrow-${pos.arrow}`}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      >
        <div className="hub-guide-head-slot" aria-hidden />

        <div className="hub-guide-bubble">
          <span className="hub-guide-bubble-nub" aria-hidden />
          <div className="hub-guide-step-count">
            {stepIndex + 1} <span>/ {STEPS.length}</span>
          </div>
          <h3 className="hub-guide-title">{step.title}</h3>
          <p className="hub-guide-text">{step.text}</p>
          <div className="hub-guide-actions">
            <button
              type="button"
              className="hub-guide-skip"
              onClick={beginExit}
              disabled={phase !== 'active'}
            >
              Skip
            </button>
            <div className="hub-guide-nav">
              {stepIndex > 0 ? (
                <button type="button" className="hub-guide-prev" onClick={goPrev}>
                  Back
                </button>
              ) : null}
              <button type="button" className="hub-guide-next" onClick={goNext}>
                {isLast ? "Let's go" : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
