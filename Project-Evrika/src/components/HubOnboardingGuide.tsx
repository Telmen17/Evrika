/**
 * HubOnboardingGuide — first-visit guided tour of the workshop.
 *
 * Docs: docs/components/hub.md
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
  type CSSProperties,
} from 'react'
import { computeHeadCueArrows, type HeadCueAnchor } from '../lib/hubGuideHeadCueArrows'
import {
  GUIDE_CUE_ENTER_DELAY_MS,
  GUIDE_CUE_FADE_MS,
  GUIDE_MOTION_MS,
  resetCompanionHeadFlight,
  setCompanionHeadPosition,
} from '../lib/hubGuideHeadFlight'
import { buildGuideSpotlightLayout, type GuideSpotlightLayout } from '../lib/hubGuideSpotlight'
import { HubGuideSpotlightLayer } from './HubGuideSpotlightLayer'

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
  /** Point a cue arrow at the companion dock (head flies there on finish). */
  pointToDock?: boolean
}

const STEPS: GuideStep[] = [
  {
    selector: null,
    title: 'Greetings — I am Archimedes!',
    text: "Welcome to my workshop. Follow me and I'll show you how to crack King Hiero's puzzle.",
  },
  {
    selector: '.hub-objective-text-copy',
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
    selector: null,
    pointToDock: true,
    title: 'Need a hand?',
    text: 'Tap my head any time for a hint. Now go — prove what the crown is truly made of!',
  },
]

const DOCK_SLOT_SELECTOR = '.archimedes-companion__head-slot'

const CLUSTER_W = 332
const CLUSTER_H = 210
const CLUSTER_HEAD_CENTER_X = CLUSTER_W / 2
const CLUSTER_HEAD_CENTER_Y = 42
const MARGIN = 16
const GAP = 22

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function dockHintSpacing(viewportH: number) {
  return {
    aboveGap: Math.round(clamp(viewportH * 0.11, 88, 140)),
    bottomMargin: Math.round(clamp(viewportH * 0.14, 88, 160)),
    extraLift: Math.round(clamp(viewportH * 0.035, 20, 48)),
  }
}

type GuidePhase = 'entering' | 'active' | 'exiting'

interface ClusterPos {
  x: number
  y: number
  /** Which side of the cluster points at the target (for the pointer nub). */
  arrow: 'left' | 'right' | 'up' | 'down' | 'none'
}

function computeDockHintClusterPos(dockRect: DOMRect): ClusterPos {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const { aboveGap, bottomMargin, extraLift } = dockHintSpacing(vh)

  let x = dockRect.left - CLUSTER_W - GAP
  let y = dockRect.top + dockRect.height / 2 - CLUSTER_H / 2
  let arrow: ClusterPos['arrow'] = 'right'

  if (x < MARGIN) {
    x = dockRect.left + dockRect.width / 2 - CLUSTER_W / 2
    y = dockRect.top - CLUSTER_H - aboveGap - extraLift
    arrow = 'down'
  }

  if (y < MARGIN) {
    y = dockRect.bottom + GAP
    arrow = 'up'
  }

  x = Math.min(Math.max(x, MARGIN), vw - CLUSTER_W - MARGIN)
  y = Math.min(Math.max(y, MARGIN), vh - CLUSTER_H - bottomMargin)
  return { x: Math.round(x), y: Math.round(y), arrow }
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
  const maskId = useId().replace(/:/g, '')
  const [stepIndex, setStepIndex] = useState(0)
  const [pos, setPos] = useState<ClusterPos>({ x: 0, y: 0, arrow: 'none' })
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<GuidePhase>('entering')
  const [spotlight, setSpotlight] = useState<GuideSpotlightLayout>({
    maskHoles: [],
    rings: [],
  })
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const [headCueAnchor, setHeadCueAnchor] = useState<HeadCueAnchor | null>(null)
  const [headCueVisible, setHeadCueVisible] = useState(false)
  const headCueAnchorRef = useRef<HeadCueAnchor | null>(null)
  const rafRef = useRef(0)
  const exitDoneRef = useRef(false)
  const enterStartedRef = useRef(false)
  const enterTimerRef = useRef<number | null>(null)
  const exitTimerRef = useRef<number | null>(null)
  const skipNextHeadMoveRef = useRef(false)
  const targetRectRef = useRef<DOMRect | null>(null)
  const spotlightRafRef = useRef(0)

  const step = STEPS[stepIndex]
  const isLast = stepIndex >= STEPS.length - 1

  const refreshSpotlight = useCallback(() => {
    const current = STEPS[stepIndex]
    const head = companionHeadRef.current

    if (current.pointToDock && head) {
      const rect = head.getBoundingClientRect()
      const next: HeadCueAnchor = {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
        radius: Math.max(rect.width, rect.height) / 2,
      }
      const prev = headCueAnchorRef.current
      if (
        !prev ||
        Math.abs(prev.cx - next.cx) > 0.5 ||
        Math.abs(prev.cy - next.cy) > 0.5 ||
        Math.abs(prev.radius - next.radius) > 0.5
      ) {
        headCueAnchorRef.current = next
        setHeadCueAnchor(next)
      }
    } else if (headCueAnchorRef.current) {
      headCueAnchorRef.current = null
      setHeadCueAnchor(null)
    }

    setSpotlight(
      buildGuideSpotlightLayout(
        companionHeadRef.current,
        current.pointToDock ? null : targetRectRef.current,
        current.pad ?? 8,
      ),
    )
    setViewport({ w: window.innerWidth, h: window.innerHeight })
  }, [stepIndex, companionHeadRef])

  const measure = useCallback(() => {
    const current = STEPS[stepIndex]
    let nextRect: DOMRect | null = null
    let nextPos: ClusterPos

    if (current.pointToDock) {
      const dockEl = document.querySelector(DOCK_SLOT_SELECTOR)
      const dockRect = dockEl?.getBoundingClientRect() ?? null
      nextPos = dockRect
        ? computeDockHintClusterPos(dockRect)
        : computeClusterPos(null)
      setPos(nextPos)
      targetRectRef.current = null
    } else {
      if (current.selector) {
        const el = document.querySelector(current.selector)
        if (el) nextRect = el.getBoundingClientRect()
      }
      nextPos = computeClusterPos(nextRect)
      targetRectRef.current = nextRect
      setPos(nextPos)
    }

    refreshSpotlight()
    return nextPos
  }, [stepIndex, refreshSpotlight])

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

  const startHeadExitFlight = useCallback(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const head = companionHeadRef.current
    const dockEl = document.querySelector(DOCK_SLOT_SELECTOR)

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
    exitTimerRef.current = window.setTimeout(() => finishExit(), GUIDE_MOTION_MS + 80)
  }, [clearExitTimer, companionHeadRef, finishExit])

  const beginExit = useCallback(() => {
    if (phase === 'exiting') return

    if (step.pointToDock) {
      setHeadCueVisible(false)
      setPhase('exiting')
      clearExitTimer()
      exitTimerRef.current = window.setTimeout(() => {
        exitTimerRef.current = null
        startHeadExitFlight()
      }, GUIDE_CUE_FADE_MS)
      return
    }

    startHeadExitFlight()
  }, [phase, step.pointToDock, clearExitTimer, startHeadExitFlight])

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
    targetRectRef.current = nextRect
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
    }, GUIDE_MOTION_MS)
  }, [clearEnterTimer, companionHeadRef])

  useEffect(() => {
    if (!open) {
      setStepIndex(0)
      setReady(false)
      setPhase('entering')
      exitDoneRef.current = false
      enterStartedRef.current = false
      setHeadCueVisible(false)
      headCueAnchorRef.current = null
      setHeadCueAnchor(null)
      targetRectRef.current = null
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
  }, [open, phase, pos, companionHeadRef])

  useEffect(() => {
    if (!open || phase === 'entering') {
      window.cancelAnimationFrame(spotlightRafRef.current)
      return
    }
    if (!ready && phase !== 'exiting') return

    const tick = () => {
      refreshSpotlight()
      spotlightRafRef.current = window.requestAnimationFrame(tick)
    }

    spotlightRafRef.current = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(spotlightRafRef.current)
  }, [open, ready, phase, refreshSpotlight])

  useEffect(() => {
    if (!step.pointToDock || !ready || phase !== 'active') {
      setHeadCueVisible(false)
      return
    }

    setHeadCueVisible(false)
    const timer = window.setTimeout(
      () => setHeadCueVisible(true),
      GUIDE_CUE_ENTER_DELAY_MS,
    )
    return () => window.clearTimeout(timer)
  }, [step.pointToDock, ready, phase, pos, stepIndex])

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

  const showSpotlight = ready && phase !== 'exiting'
  const headCueArrows =
    headCueAnchor && step.pointToDock
      ? computeHeadCueArrows(headCueAnchor)
      : null

  return (
    <div
      className={`hub-guide${ready ? ' hub-guide--ready' : ''}${
        phase === 'entering' ? ' hub-guide--entering' : ''
      }${phase === 'exiting' ? ' hub-guide--exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Workshop guide"
    >
      <HubGuideSpotlightLayer
        maskId={maskId}
        viewportW={viewport.w}
        viewportH={viewport.h}
        maskHoles={spotlight.maskHoles}
        rings={spotlight.rings}
        visible={showSpotlight}
      />

      <button
        type="button"
        className="hub-guide-backdrop hub-guide-backdrop--clear"
        aria-label="Skip guide"
        onClick={beginExit}
        disabled={phase !== 'active'}
      />

      {headCueArrows ? (
        <div
          className={`hub-guide-head-cues${
            headCueVisible ? ' hub-guide-head-cues--visible' : ''
          }`}
          aria-hidden
        >
          {headCueArrows.map((arrow, index) => (
            <div
              key={index}
              className="hub-guide-head-cue"
              style={
                {
                  left: `${arrow.x}px`,
                  top: `${arrow.y}px`,
                  '--arrow-rotate': `${arrow.rotation}deg`,
                  '--arrow-delay': `${arrow.delay}s`,
                } as CSSProperties
              }
            >
              <span className="hub-guide-head-cue__glyph">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 12h11.5M14.5 8.5 18 12l-3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div
        className={`hub-guide-cluster hub-guide-cluster--arrow-${pos.arrow}`}
        style={{ left: pos.x, top: pos.y }}
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
