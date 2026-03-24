import { useCallback, useEffect, useRef, useState } from 'react'

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
    if (!src) {
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
    audioRef.current = audio
    setState({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    })

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

  const play = useCallback(() => {
    if (!audioRef.current) return
    if (
      audioRef.current.duration &&
      audioRef.current.currentTime >= audioRef.current.duration - 0.05
    ) {
      audioRef.current.currentTime = 0
    }
    void audioRef.current.play()
    setState((prev) => ({ ...prev, isPlaying: true }))
  }, [])

  const pause = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    setState((prev) => ({ ...prev, isPlaying: false }))
  }, [])

  const toggle = useCallback(() => {
    if (state.isPlaying) {
      pause()
    } else {
      play()
    }
  }, [pause, play, state.isPlaying])

  return {
    ...state,
    play,
    pause,
    toggle,
  }
}


