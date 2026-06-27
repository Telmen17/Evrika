/**
 * FeedbackModal — anonymous learner feedback dialog.
 *
 * Docs: docs/components/feedback.md
 * Tests: tests/frontend/integration/components/FeedbackModal.test.tsx
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  submitFeedback,
  type FeedbackSentiment,
} from '../lib/feedback'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
  /** Where the feedback was triggered from (stored with the entry). */
  context?: string
}

type Status = 'editing' | 'sending' | 'done'

const MAX_LEN = 1000

const SENTIMENTS: Array<{ id: Exclude<FeedbackSentiment, null>; glyph: string; label: string }> = [
  { id: 'love', glyph: '🤩', label: 'Loved it' },
  { id: 'ok', glyph: '🙂', label: 'It was okay' },
  { id: 'meh', glyph: '😕', label: 'Needs work' },
]

export function FeedbackModal({ open, onClose, context = 'lesson-complete' }: FeedbackModalProps) {
  const [message, setMessage] = useState('')
  const [sentiment, setSentiment] = useState<FeedbackSentiment>(null)
  const [status, setStatus] = useState<Status>('editing')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const closeTimerRef = useRef(0)

  const resetState = useCallback(() => {
    setMessage('')
    setSentiment(null)
    setStatus('editing')
  }, [])

  useEffect(() => {
    if (!open) {
      window.clearTimeout(closeTimerRef.current)
      resetState()
    }
  }, [open, resetState])

  useEffect(() => {
    if (open && status === 'editing') {
      const t = window.setTimeout(() => textareaRef.current?.focus(), 120)
      return () => window.clearTimeout(t)
    }
  }, [open, status])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), [])

  const handleSubmit = useCallback(async () => {
    const trimmed = message.trim()
    if (!trimmed || status === 'sending') return
    setStatus('sending')
    await submitFeedback({ message: trimmed, sentiment, context })
    setStatus('done')
    closeTimerRef.current = window.setTimeout(() => onClose(), 2600)
  }, [message, sentiment, status, context, onClose])

  if (!open) return null

  const remaining = MAX_LEN - message.length
  const canSubmit = message.trim().length > 0 && status !== 'sending'

  return (
    <div className="feedback" role="dialog" aria-modal="true" aria-label="Send feedback">
      <button type="button" className="feedback-backdrop" aria-label="Close" onClick={onClose} />

      <div className="feedback-modal">
        <button type="button" className="feedback-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {status === 'done' ? (
          <div className="feedback-thanks" aria-live="polite">
            <div className="feedback-thanks-burst" aria-hidden>
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} className={`feedback-spark feedback-spark--${i}`} />
              ))}
            </div>
            <div className="feedback-thanks-check" aria-hidden>
              <svg viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="24" />
                <path d="M15 27l8 8 15-16" />
              </svg>
            </div>
            <h2 className="feedback-thanks-title">Thank you!</h2>
            <p className="feedback-thanks-text">
              Your thoughts go straight to the team. You just helped make this better for the next
              curious mind.
            </p>
          </div>
        ) : (
          <>
            <div className="feedback-head">
              <p className="feedback-kicker">Anonymous feedback</p>
              <h2 className="feedback-title">How was your Eureka journey?</h2>
              <p className="feedback-sub">
                No names, no email — just your honest thoughts. Tell us what you loved or what we
                should fix.
              </p>
            </div>

            <div className="feedback-sentiments" role="group" aria-label="Overall feeling">
              {SENTIMENTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`feedback-sentiment${sentiment === s.id ? ' feedback-sentiment--active' : ''}`}
                  onClick={() => setSentiment((prev) => (prev === s.id ? null : s.id))}
                  aria-pressed={sentiment === s.id}
                  title={s.label}
                >
                  <span className="feedback-sentiment-glyph" aria-hidden>
                    {s.glyph}
                  </span>
                  <span className="feedback-sentiment-label">{s.label}</span>
                </button>
              ))}
            </div>

            <label className="feedback-field">
              <span className="feedback-field-label">Your message</span>
              <textarea
                ref={textareaRef}
                className="feedback-textarea"
                value={message}
                maxLength={MAX_LEN}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What stood out? What confused you? What would make it more fun?"
                rows={5}
              />
            </label>

            <div className="feedback-actions">
              <span className={`feedback-count${remaining < 80 ? ' feedback-count--low' : ''}`}>
                {remaining}
              </span>
              <button
                type="button"
                className="feedback-submit"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {status === 'sending' ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
