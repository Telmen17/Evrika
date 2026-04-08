import { useEffect, useRef } from 'react'
import headImg from '../assets/head.png'
import { useLessonHub } from '../context/LessonHubContext'

export function ArchimedesCompanion() {
  const { companion, setCompanionBubbleOpen } = useLessonHub()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const el = audioRef.current
    if (!el || !companion.audioSrc) return
    el.src = companion.audioSrc
    el.currentTime = 0
    void el.play().catch(() => {
      /* autoplay blocked */
    })
    return () => {
      el.pause()
    }
  }, [companion.audioSrc])

  return (
    <div className="archimedes-companion" aria-live="polite">
      <audio ref={audioRef} className="archimedes-companion__audio" />
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
            {companion.audioSrc ? (
              <button
                type="button"
                className="archimedes-companion__replay"
                onClick={() => {
                  const el = audioRef.current
                  if (el) {
                    el.currentTime = 0
                    void el.play().catch(() => {})
                  }
                }}
              >
                Replay voice
              </button>
            ) : null}
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
