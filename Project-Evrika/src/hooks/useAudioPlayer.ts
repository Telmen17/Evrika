/**
 * useAudioPlayer — HTMLAudioElement lifecycle for voicelines.
 *
 * Docs: docs/hooks/README.md
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useOptionalAudioEnabled } from '../context/GlobalAudioContext'

export interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
}

export interface AudioPlayerControls extends AudioPlayerState {
  play: () => void
  pause: () => void
  toggle: () => void
}

export interface UseAudioPlayerOptions {
  /** Fires when the current clip reaches its end (e.g. intro auto-advance). */
  onEnded?: () => void
}

export const useAudioPlayer = (
  src: string | null,
  options?: UseAudioPlayerOptions,
): AudioPlayerControls => {
  const audioEnabled = useOptionalAudioEnabled()
  const onEndedRef = useRef(options?.onEnded)
  onEndedRef.current = options?.onEnded

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef(0)
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  })

  useEffect(() => {
    if (!src) {
      cancelAnimationFrame(rafRef.current)
      audioRef.current?.pause()
      audioRef.current = null
      setState({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      })
      return
    }

    const audio = new Audio(src)
    audio.volume = audioEnabled ? 1 : 0
    audioRef.current = audio
    setState({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    })

    const cancelPump = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }

    const pump = () => {
      if (!audioRef.current || audioRef.current.paused) return
      setState((prev) => ({
        ...prev,
        currentTime: audioRef.current!.currentTime,
      }))
      rafRef.current = requestAnimationFrame(pump)
    }

    const handleLoadedMetadata = () => {
      setState((prev) => ({ ...prev, duration: audio.duration }))
    }

    const handlePlay = () => {
      cancelPump()
      setState((prev) => ({ ...prev, isPlaying: true }))
      pump()
    }

    const handlePause = () => {
      cancelPump()
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: audio.currentTime,
      }))
    }

    const handleEnded = () => {
      cancelPump()
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: audio.duration || prev.currentTime,
      }))
      onEndedRef.current?.()
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      cancelPump()
      audio.pause()
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audioRef.current = null
    }
  }, [src])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = audioEnabled ? 1 : 0
  }, [audioEnabled])

  const play = useCallback(() => {
    if (!audioRef.current) return
    const a = audioRef.current
    if (a.duration && a.currentTime >= a.duration - 0.05) {
      a.currentTime = 0
    }
    a.volume = audioEnabled ? 1 : 0
    void a.play()
  }, [audioEnabled])

  const pause = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
  }, [])

  const toggle = useCallback(() => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      play()
    } else {
      pause()
    }
  }, [pause, play])

  return {
    ...state,
    play,
    pause,
    toggle,
  }
}
