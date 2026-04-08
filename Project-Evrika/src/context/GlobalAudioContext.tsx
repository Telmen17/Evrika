import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from 'react'

export const GLOBAL_AUDIO_STORAGE_KEY = 'evrika-audio-enabled-v1'

interface GlobalAudioContextValue {
  /** When false, lesson voice clips stay silent (volume 0 / paused). */
  audioEnabled: boolean
  setAudioEnabled: (on: boolean) => void
  toggleAudioEnabled: () => void
}

const GlobalAudioContext = createContext<GlobalAudioContextValue | null>(null)

function readStoredAudioEnabled(): boolean {
  try {
    const raw = localStorage.getItem(GLOBAL_AUDIO_STORAGE_KEY)
    if (raw === null) return true
    return raw === '1' || raw === 'true'
  } catch {
    return true
  }
}

export const GlobalAudioProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [audioEnabled, setAudioEnabledState] = useState(() =>
    typeof window !== 'undefined' ? readStoredAudioEnabled() : true,
  )

  useEffect(() => {
    try {
      localStorage.setItem(GLOBAL_AUDIO_STORAGE_KEY, audioEnabled ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [audioEnabled])

  const setAudioEnabled = useCallback((on: boolean) => {
    setAudioEnabledState(on)
  }, [])

  const toggleAudioEnabled = useCallback(() => {
    setAudioEnabledState((v) => !v)
  }, [])

  const value = useMemo(
    () => ({
      audioEnabled,
      setAudioEnabled,
      toggleAudioEnabled,
    }),
    [audioEnabled, setAudioEnabled, toggleAudioEnabled],
  )

  return (
    <GlobalAudioContext.Provider value={value}>{children}</GlobalAudioContext.Provider>
  )
}

export function useGlobalAudio(): GlobalAudioContextValue {
  const ctx = useContext(GlobalAudioContext)
  if (!ctx) {
    throw new Error('useGlobalAudio must be used within GlobalAudioProvider')
  }
  return ctx
}

/** Defaults to sound on when no provider (e.g. tests). */
export function useOptionalAudioEnabled(): boolean {
  const ctx = useContext(GlobalAudioContext)
  return ctx?.audioEnabled ?? true
}
