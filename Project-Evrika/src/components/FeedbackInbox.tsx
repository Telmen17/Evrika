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
    <div className="feedback-inbox" role="dialog" aria-modal="true" aria-label="Feedback inbox">
      <button type="button" className="feedback-backdrop" aria-label="Close" onClick={onClose} />

      <div className="feedback-inbox-modal">
        <button type="button" className="feedback-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="feedback-inbox-head">
          <h2 className="feedback-title">Feedback inbox (dev)</h2>
          <p className="feedback-sub">
            {FEEDBACK_CONFIG.accessKey
              ? 'Live submissions are emailed to you; this is the local mirror.'
              : 'No email key set yet — submissions are stored here only. Add a Web3Forms key to also receive them by email.'}
          </p>
        </div>

        {entries.length === 0 ? (
          <p className="feedback-inbox-empty">No feedback captured yet.</p>
        ) : (
          <ul className="feedback-inbox-list">
            {entries.map((entry) => (
              <li key={entry.id} className="feedback-inbox-item">
                <div className="feedback-inbox-meta">
                  {entry.sentiment ? (
                    <span className="feedback-inbox-glyph" aria-hidden>
                      {SENTIMENT_GLYPH[entry.sentiment] ?? ''}
                    </span>
                  ) : null}
                  <span className="feedback-inbox-context">{entry.context}</span>
                  <time className="feedback-inbox-date">{formatDate(entry.createdAt)}</time>
                </div>
                <p className="feedback-inbox-message">{entry.message}</p>
              </li>
            ))}
          </ul>
        )}

        {entries.length > 0 ? (
          <div className="feedback-inbox-footer">
            <span className="feedback-inbox-count">{entries.length} stored</span>
            <button type="button" className="feedback-inbox-clear" onClick={handleClear}>
              Clear local
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
