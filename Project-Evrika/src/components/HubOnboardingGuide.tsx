/**
 * HubOnboardingGuide — first-visit guided tour of the workshop.
 *
 * Docs: docs/components/hub.md
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import headImg from '../assets/head.png'

interface HubOnboardingGuideProps {
  open: boolean
  onClose: () => void
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
const MARGIN = 16
const GAP = 22

interface ClusterPos {
  x: number
  y: number
  /** Which side of the cluster points at the target (for the pointer nub). */
  arrow: 'left' | 'right' | 'up' | 'down' | 'none'
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

export function HubOnboardingGuide({ open, onClose }: HubOnboardingGuideProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [pos, setPos] = useState<ClusterPos>({ x: 0, y: 0, arrow: 'none' })
  const [ready, setReady] = useState(false)
  const rafRef = useRef(0)

  const step = STEPS[stepIndex]
  const isLast = stepIndex >= STEPS.length - 1

  const measure = useCallback(() => {
    const current = STEPS[stepIndex]
    let nextRect: DOMRect | null = null
    if (current.selector) {
      const el = document.querySelector(current.selector)
      if (el) nextRect = el.getBoundingClientRect()
    }
    setRect(nextRect)
    setPos(computeClusterPos(nextRect))
  }, [stepIndex])

  useEffect(() => {
    if (!open) {
      setStepIndex(0)
      setReady(false)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open) return
    measure()
  }, [open, measure])

  useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => setReady(true))
    return () => window.cancelAnimationFrame(id)
  }, [open])

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
      onClose()
      return
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }, [isLast, onClose])

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0))
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === 'Enter') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, goNext, goPrev])

  if (!open) return null

  const pad = step.pad ?? 8
  const spotlightStyle = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : undefined

  return (
    <div
      className={`hub-guide${ready ? ' hub-guide--ready' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Workshop guide"
    >
      <button
        type="button"
        className={`hub-guide-backdrop${rect ? ' hub-guide-backdrop--clear' : ''}`}
        aria-label="Skip guide"
        onClick={onClose}
      />

      {rect ? <div className="hub-guide-spotlight" style={spotlightStyle} aria-hidden /> : null}

      <div
        className={`hub-guide-cluster hub-guide-cluster--arrow-${pos.arrow}`}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
      >
        <div className="hub-guide-head" aria-hidden>
          <span className="hub-guide-head-aura" />
          <span className="hub-guide-head-ring">
            <img src={headImg} alt="" width={64} height={64} draggable={false} />
          </span>
        </div>

        <div className="hub-guide-bubble">
          <span className="hub-guide-bubble-nub" aria-hidden />
          <div className="hub-guide-step-count">
            {stepIndex + 1} <span>/ {STEPS.length}</span>
          </div>
          <h3 className="hub-guide-title">{step.title}</h3>
          <p className="hub-guide-text">{step.text}</p>
          <div className="hub-guide-actions">
            <button type="button" className="hub-guide-skip" onClick={onClose}>
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
