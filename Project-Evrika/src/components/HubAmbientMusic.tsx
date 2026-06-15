import { useEffect, useRef } from 'react'
import { useOptionalAudioEnabled } from '../context/GlobalAudioContext'

const AMBIENT_SRC = '/audio/eureka-ambient.mp3'
/** Background music sits low so room narration/voice clips stay intelligible. */
const AMBIENT_VOLUME = 0.32

/**
 * Loops the central-hub ambient track while mounted (i.e. while the learner is in
 * the hub). Playback follows the global mute toggle (`audioEnabled`): muting pauses
 * it, unmuting resumes. If the browser blocks the initial autoplay, it retries on
 * the first user gesture. Unmounting (leaving the hub) stops the music.
 */
export function HubAmbientMusic() {
  const audioEnabled = useOptionalAudioEnabled()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(AMBIENT_SRC)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = AMBIENT_VOLUME
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!audioEnabled) {
      audio.pause()
      return
    }

    let resume: (() => void) | null = null
    const playResult = audio.play()
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(() => {
        // Autoplay blocked (no prior gesture) — resume on the next interaction.
        resume = () => {
          audio.play().catch(() => {})
        }
        window.addEventListener('pointerdown', resume, { once: true })
        window.addEventListener('keydown', resume, { once: true })
      })
    }

    return () => {
      if (resume) {
        window.removeEventListener('pointerdown', resume)
        window.removeEventListener('keydown', resume)
      }
    }
  }, [audioEnabled])

  return null
}
