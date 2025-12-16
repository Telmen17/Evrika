import { useEffect, useRef, useState } from 'react'

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

export const useAudioPlayer = (src: string | null): AudioPlayerControls => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  })

  useEffect(() => {
    if (!src) return

    const audio = new Audio(src)
    audioRef.current = audio

    const handleLoadedMetadata = () => {
      setState((prev) => ({ ...prev, duration: audio.duration }))
    }

    const handleTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
      }))
    }

    const handleEnded = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: audio.duration,
      }))
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.pause()
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audioRef.current = null
    }
  }, [src])

  const play = () => {
    if (!audioRef.current) return
    void audioRef.current.play()
    setState((prev) => ({ ...prev, isPlaying: true }))
  }

  const pause = () => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setState((prev) => ({ ...prev, isPlaying: false }))
  }

  const toggle = () => {
    if (state.isPlaying) {
      pause()
    } else {
      play()
    }
  }

  return {
    ...state,
    play,
    pause,
    toggle,
  }
}


