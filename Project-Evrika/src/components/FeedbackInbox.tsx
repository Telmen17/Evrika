/**
 * FeedbackInbox — dev-only viewer for locally stored feedback.
 *
 * Docs: docs/components/feedback.md
 */

import { useEffect, useState } from 'react'
import {
  clearLocalFeedback,
  loadLocalFeedback,
  FEEDBACK_CONFIG,
  type FeedbackEntry,
} from '../lib/feedback'

interface FeedbackInboxProps {
  open: boolean
  onClose: () => void
}

const SENTIMENT_GLYPH: Record<string, string> = {
  love: '🤩',
  ok: '🙂',
  meh: '😕',
}

const overlayClass =
  'fixed inset-0 z-[1310] flex items-center justify-center p-[clamp(0.75rem,3vw,2rem)]'

const backdropClass =
  'feedback-animate-fade absolute inset-0 m-0 cursor-pointer border-0 bg-backdrop p-0 backdrop-blur-[3px]'

const modalClass =
  'feedback-animate-pop relative z-[1] w-full max-w-[620px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[20px] border-[1.5px] border-gold-border bg-gradient-to-b from-parchment to-parchment-mid p-[clamp(1.2rem,2.6vw,1.8rem)] shadow-[var(--shadow-feedback)]'

const closeButtonClass =
  'absolute top-[0.6rem] right-[0.7rem] grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-gold-border/80 bg-white/50 text-[1.4rem] leading-none text-ink-close transition-[background,transform] duration-150 hover:scale-[1.06] hover:bg-white/85'

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

/** DEV-only viewer of locally captured feedback (mirrors what gets emailed). */
export function FeedbackInbox({ open, onClose }: FeedbackInboxProps) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([])

  useEffect(() => {
    if (open) setEntries(loadLocalFeedback())
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleClear = () => {
    if (!window.confirm('Clear all locally stored feedback? (Emailed copies are unaffected.)')) {
      return
    }
    clearLocalFeedback()
    setEntries([])
  }

  return (
    <div className={overlayClass} role="dialog" aria-modal="true" aria-label="Feedback inbox">
      <button type="button" className={backdropClass} aria-label="Close" onClick={onClose} />

      <div className={modalClass}>
        <button type="button" className={closeButtonClass} onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="mb-[0.9rem]">
          <h2 className="mb-[0.3rem] mt-[0.2rem] font-serif text-[clamp(1.15rem,1rem+1vw,1.5rem)] text-ink-brown">
            Feedback inbox (dev)
          </h2>
          <p className="m-0 text-[0.9rem] leading-[1.45] text-ink-muted">
            {FEEDBACK_CONFIG.accessKey
              ? 'Live submissions are emailed to you; this is the local mirror.'
              : 'No email key set yet — submissions are stored here only. Add a Web3Forms key to also receive them by email.'}
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="py-8 text-center text-ink-muted/70">No feedback captured yet.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-[0.6rem] p-0">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="rounded-chip border-[1.5px] border-gold-border/60 bg-parchment-wash px-[0.85rem] py-[0.7rem]"
              >
                <div className="mb-[0.35rem] flex items-center gap-2 text-[0.72rem] text-ink-muted/70">
                  {entry.sentiment ? (
                    <span className="text-base" aria-hidden>
                      {SENTIMENT_GLYPH[entry.sentiment] ?? ''}
                    </span>
                  ) : null}
                  <span className="font-bold uppercase tracking-wide text-[#a0722a]">
                    {entry.context}
                  </span>
                  <time className="ml-auto">{formatDate(entry.createdAt)}</time>
                </div>
                <p className="m-0 whitespace-pre-wrap text-[0.9rem] leading-[1.45] text-ink-field">
                  {entry.message}
                </p>
              </li>
            ))}
          </ul>
        )}

        {entries.length > 0 ? (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[0.78rem] text-ink-muted/70">{entries.length} stored</span>
            <button
              type="button"
              className="cursor-pointer rounded-lg border-[1.5px] border-danger-border bg-[rgba(255,240,235,0.8)] px-[0.9rem] py-[0.4rem] text-[0.78rem] font-semibold text-danger hover:bg-[#fff3f0]"
              onClick={handleClear}
            >
              Clear local
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
