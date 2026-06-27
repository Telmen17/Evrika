/**
 * FeedbackModal — anonymous learner feedback dialog.
 *
 * Docs: docs/components/feedback.md
 * Tests: tests/frontend/integration/components/FeedbackModal.test.tsx
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../lib/cn'
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

const overlayClass =
  'fixed inset-0 z-[1310] flex items-center justify-center p-[clamp(0.75rem,3vw,2rem)]'

const backdropClass =
  'feedback-animate-fade absolute inset-0 m-0 cursor-pointer border-0 bg-backdrop p-0 backdrop-blur-[3px]'

const modalClass =
  'feedback-animate-pop relative z-[1] w-full max-w-[540px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[20px] border-[1.5px] border-gold-border bg-gradient-to-b from-parchment to-parchment-mid p-[clamp(1.2rem,2.6vw,1.8rem)] shadow-[var(--shadow-feedback)]'

const closeButtonClass =
  'absolute top-[0.6rem] right-[0.7rem] grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-gold-border/80 bg-white/50 text-[1.4rem] leading-none text-ink-close transition-[background,transform] duration-150 hover:scale-[1.06] hover:bg-white/85'

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
    <div className={overlayClass} role="dialog" aria-modal="true" aria-label="Send feedback">
      <button type="button" className={backdropClass} aria-label="Close" onClick={onClose} />

      <div className={modalClass}>
        <button type="button" className={closeButtonClass} onClick={onClose} aria-label="Close">
          ×
        </button>

        {status === 'done' ? (
          <div className="relative px-2 pb-2 pt-4 text-center" aria-live="polite">
            <div className="feedback-thanks-burst" aria-hidden>
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} className={`feedback-spark feedback-spark--${i}`} />
              ))}
            </div>
            <div className="feedback-thanks-check mx-auto mb-[0.4rem] h-[84px] w-[84px]" aria-hidden>
              <svg className="h-full w-full" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="24" />
                <path d="M15 27l8 8 15-16" />
              </svg>
            </div>
            <h2 className="mb-[0.3rem] font-serif text-2xl text-success">Thank you!</h2>
            <p className="mx-auto max-w-[360px] text-[0.92rem] leading-normal text-ink-muted">
              Your thoughts go straight to the team. You just helped make this better for the next
              curious mind.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-center">
              <p className="m-0 font-serif text-[0.74rem] font-bold uppercase tracking-[0.2em] text-gold-muted">
                Anonymous feedback
              </p>
              <h2 className="mb-[0.3rem] mt-[0.2rem] font-serif text-[clamp(1.15rem,1rem+1vw,1.5rem)] text-ink-brown">
                How was your Eureka journey?
              </h2>
              <p className="m-0 text-[0.9rem] leading-[1.45] text-ink-muted">
                No names, no email — just your honest thoughts. Tell us what you loved or what we
                should fix.
              </p>
            </div>

            <div className="mb-4 flex justify-center gap-2" role="group" aria-label="Overall feeling">
              {SENTIMENTS.map((s) => {
                const isActive = sentiment === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={cn(
                      'flex max-w-[110px] flex-1 flex-col items-center gap-1 rounded-chip border-[1.5px] border-gold-border/60 bg-parchment-wash px-[0.4rem] py-[0.55rem] transition-[transform,background,border-color] duration-150 hover:-translate-y-0.5 hover:bg-[#fffdf6]',
                      isActive &&
                        'border-gold-ring bg-gradient-to-b from-[#fff6df] to-[#f3e0b0] shadow-[0_4px_12px_rgba(120,80,20,0.18)]',
                    )}
                    onClick={() => setSentiment((prev) => (prev === s.id ? null : s.id))}
                    aria-pressed={isActive}
                    title={s.label}
                  >
                    <span className="text-2xl leading-none" aria-hidden>
                      {s.glyph}
                    </span>
                    <span className="text-[0.68rem] font-semibold text-[#6b4f10]">{s.label}</span>
                  </button>
                )
              })}
            </div>

            <label className="block">
              <span className="mb-[0.3rem] block text-[0.74rem] font-bold tracking-wide text-ink-label">
                Your message
              </span>
              <textarea
                ref={textareaRef}
                className="min-h-[110px] w-full resize-y rounded-chip border-[1.5px] border-[#c8a960] bg-parchment-soft px-[0.8rem] py-[0.7rem] font-[inherit] text-[0.92rem] leading-normal text-ink-field shadow-[inset_0_1px_3px_rgba(120,80,20,0.12)] transition-[border-color,box-shadow] duration-150 focus:border-gold-ring focus:outline-none focus:shadow-[0_0_0_3px_rgba(214,165,51,0.25)]"
                value={message}
                maxLength={MAX_LEN}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What stood out? What confused you? What would make it more fun?"
                rows={5}
              />
            </label>

            <div className="mt-[0.9rem] flex items-center justify-between gap-3">
              <span
                className={cn(
                  'text-[0.78rem] tabular-nums text-ink-muted/60',
                  remaining < 80 && 'font-bold text-[#c0561e]',
                )}
              >
                {remaining}
              </span>
              <button
                type="button"
                className="cursor-pointer rounded-[10px] border-[1.5px] border-[#a0722a] bg-gradient-to-b from-gold-ring to-gold-dark px-[1.3rem] py-[0.55rem] text-[0.88rem] font-bold text-[#fff8ea] shadow-[var(--shadow-gold-button)] transition-[transform,filter] duration-150 hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
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
