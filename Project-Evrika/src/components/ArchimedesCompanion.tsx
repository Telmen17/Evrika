import { useEffect, useRef } from 'react'
import headImg from '../assets/head.png'
import { useOptionalAudioEnabled } from '../context/GlobalAudioContext'
import { useLessonHub } from '../context/LessonHubContext'

export function ArchimedesCompanion() {
  const { companion, setCompanionBubbleOpen } = useLessonHub()
  const audioEnabled = useOptionalAudioEnabled()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const companionAudioSrcRef = useRef<string | null>(null)

  useEffect(() => {
    const insightRev = companion.insightRevision
    const el = audioRef.current
    if (!companion.audioSrc) {
      companionAudioSrcRef.current = null
      el?.pause()
      return
    }
    if (!el) {
      // #region agent log
      fetch('http://127.0.0.1:7631/ingest/6127e0e1-bb22-4c3e-a1d4-6da855fa1c05', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '6e0570',
        },
        body: JSON.stringify({
          sessionId: '6e0570',
          runId: 'post-fix',
          hypothesisId: 'H5',
          location: 'ArchimedesCompanion.tsx:audio',
          message: 'no audio element ref',
          data: { audioSrc: companion.audioSrc, audioEnabled },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      return
    }

    const src = companion.audioSrc
    const tryPlay = () => {
      el.volume = audioEnabled ? 1 : 0
      if (!audioEnabled) {
        // #region agent log
        fetch('http://127.0.0.1:7631/ingest/6127e0e1-bb22-4c3e-a1d4-6da855fa1c05', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '6e0570',
          },
          body: JSON.stringify({
            sessionId: '6e0570',
            runId: 'post-fix',
            hypothesisId: 'H4',
            location: 'ArchimedesCompanion.tsx:audio',
            message: 'audio skipped (muted)',
            data: { audioSrc: src, audioEnabled },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
        el.pause()
        return
      }
      el.currentTime = 0
      void el.play().then(() => {
        // #region agent log
        fetch('http://127.0.0.1:7631/ingest/6127e0e1-bb22-4c3e-a1d4-6da855fa1c05', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '6e0570',
          },
          body: JSON.stringify({
            sessionId: '6e0570',
            runId: 'post-fix',
            hypothesisId: 'H5',
            location: 'ArchimedesCompanion.tsx:audio',
            message: 'play() resolved',
            data: {
              audioSrc: src,
              audioEnabled,
              readyState: el.readyState,
              revision: insightRev,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
      }).catch((err: unknown) => {
        // #region agent log
        fetch('http://127.0.0.1:7631/ingest/6127e0e1-bb22-4c3e-a1d4-6da855fa1c05', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '6e0570',
          },
          body: JSON.stringify({
            sessionId: '6e0570',
            runId: 'post-fix',
            hypothesisId: 'H5',
            location: 'ArchimedesCompanion.tsx:audio',
            message: 'play() rejected',
            data: {
              audioSrc: src,
              audioEnabled,
              err: err instanceof Error ? err.message : String(err),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
      })
    }

    const srcChanged = companionAudioSrcRef.current !== src
    companionAudioSrcRef.current = src

    const onCanPlay = () => {
      el.removeEventListener('canplay', onCanPlay)
      tryPlay()
    }

    if (srcChanged) {
      el.pause()
      el.src = src
      el.load()
      el.addEventListener('canplay', onCanPlay)
    } else {
      tryPlay()
    }

    return () => {
      el.removeEventListener('canplay', onCanPlay)
      el.pause()
    }
  }, [companion.audioSrc, companion.insightRevision, audioEnabled])

  return (
    <div className="archimedes-companion" aria-live="polite">
      <audio
        ref={audioRef}
        className="archimedes-companion__audio"
        playsInline
        preload="auto"
      />
      <div className="archimedes-companion__dock">
        {companion.bubbleOpen ? (
          <div className="archimedes-companion__bubble">
            <div className="archimedes-companion__bubble-header">
              <span className="archimedes-companion__bubble-label">
                {companion.insightLabel}
              </span>
              <button
                type="button"
                className="archimedes-companion__bubble-close"
                onClick={() => setCompanionBubbleOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="archimedes-companion__bubble-text">
              {companion.transcript || 'Tap the head when I have something to say.'}
            </p>
          </div>
        ) : null}
        <button
          type="button"
          className="archimedes-companion__head-btn"
          onClick={() => setCompanionBubbleOpen(!companion.bubbleOpen)}
          aria-expanded={companion.bubbleOpen}
          aria-label="Archimedes companion"
        >
          <span className="archimedes-companion__head-aura" aria-hidden />
          <span className="archimedes-companion__head-bob" aria-hidden>
            <span className="archimedes-companion__head-ring">
              <img
                src={headImg}
                alt=""
                className="archimedes-companion__head-img"
                width={56}
                height={56}
                draggable={false}
              />
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
