/**
 * ArchimedesCompanion — insight bubble and voiceline playback in the hub.
 *
 * Docs: docs/components/hub.md
 */

import { useEffect, useRef } from 'react'
import headImg from '../assets/head.png'
import { useOptionalAudioEnabled } from '../context/GlobalAudioContext'
import { useLessonHub } from '../context/LessonHubContext'

export function ArchimedesCompanion() {
  const { companion, setCompanionBubbleOpen, notifyInsightPlaybackEnded } =
    useLessonHub()
  const audioEnabled = useOptionalAudioEnabled()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const companionAudioSrcRef = useRef<string | null>(null)
  const latestAudioSessionRef = useRef(companion.audioSessionId)
  latestAudioSessionRef.current = companion.audioSessionId

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const sessionWhenAttached = companion.audioSessionId
    const onEnded = () => {
      if (sessionWhenAttached !== latestAudioSessionRef.current) {
        return
      }
      let pathname = ''
      try {
        pathname = new URL(
          el.currentSrc || el.src || '',
          window.location.href,
        ).pathname
      } catch {
        pathname = ''
      }
      notifyInsightPlaybackEnded(pathname)
    }
    el.addEventListener('ended', onEnded)
    return () => el.removeEventListener('ended', onEnded)
  }, [companion.audioSessionId, notifyInsightPlaybackEnded])

  useEffect(() => {
    const el = audioRef.current
    if (!companion.audioSrc) {
      companionAudioSrcRef.current = null
      el?.pause()
      return
    }
    if (!el) return

    const src = companion.audioSrc
    const tryPlay = () => {
      el.muted = !audioEnabled
      el.volume = audioEnabled ? 1 : 0
      el.currentTime = 0
      void el.play().catch(() => {
        /* autoplay / decode blocked */
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
  }, [
    companion.audioSrc,
    companion.insightRevision,
    companion.audioSessionId,
    audioEnabled,
  ])

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
