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
    const el = audioRef.current
    if (!companion.audioSrc) {
      companionAudioSrcRef.current = null
      el?.pause()
      return
    }
    if (!el) return
    const srcChanged = companionAudioSrcRef.current !== companion.audioSrc
    companionAudioSrcRef.current = companion.audioSrc
    if (srcChanged) {
      el.src = companion.audioSrc
      el.currentTime = 0
    }
    el.volume = audioEnabled ? 1 : 0
    if (!audioEnabled) {
      el.pause()
      return () => {
        el.pause()
      }
    }
    void el.play().catch(() => {
      /* autoplay blocked */
    })
    return () => {
      el.pause()
    }
  }, [companion.audioSrc, audioEnabled])

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
