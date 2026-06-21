export const TADA_EFFECT_SRC = '/audio/tada-effect.mp3'
export const UNLOCK_EFFECT_SRC = '/audio/room-unlock.mp3'

/** Keep in sync with `.hub-completion-check { animation-delay }` in styles/hub/hub.css. */
export const HUB_CHECK_STAMP_DELAY_MS = 1400
export const HUB_UNLOCK_STAMP_DELAY_MS = 1400

/** Keep in sync with `.hub-completion-burst { animation }` duration in styles/hub/hub.css. */
export const HUB_CELEBRATION_DURATION_MS = 3600
/** Unlock burst — hold through stamp + room-unlock.mp3 (~3.02s after 1.4s stamp). */
export const HUB_UNLOCK_CELEBRATION_DURATION_MS = 4500
export const HUB_CELEBRATION_REDUCED_MS = 900

const audioPool = new Map<string, HTMLAudioElement>()

export function preloadSoundEffects(srcs: string[]): void {
  for (const src of srcs) {
    if (audioPool.has(src)) continue
    const audio = new Audio(src)
    audio.preload = 'auto'
    audioPool.set(src, audio)
  }
}

/** Prime clips after a user gesture so delayed stamp playback is not blocked. */
export function warmSoundEffects(srcs: string[]): void {
  for (const src of srcs) {
    preloadSoundEffects([src])
    const audio = audioPool.get(src)
    if (!audio) continue
    const prevVolume = audio.volume
    audio.volume = 0.001
    void audio
      .play()
      .then(() => {
        audio.pause()
        audio.currentTime = 0
        audio.volume = prevVolume
      })
      .catch(() => {
        audio.volume = prevVolume
      })
  }
}

/** Fire-and-forget one-shot clip; no-op when global audio is muted. */
export function playSoundEffect(
  src: string,
  audioEnabled: boolean,
  volume = 1,
): void {
  if (!audioEnabled) return
  preloadSoundEffects([src])
  const audio = audioPool.get(src)
  if (!audio) return
  audio.volume = volume
  try {
    audio.currentTime = 0
  } catch {
    /* ignore seek errors on some mobile browsers */
  }
  void audio.play().catch(() => {})
}
