export const TADA_EFFECT_SRC = '/audio/tada-effect.mp3'

/** Keep in sync with `.hub-completion-check { animation-delay }` in styles/hub/hub.css. */
export const HUB_CHECK_STAMP_DELAY_MS = 1400

/** Fire-and-forget one-shot clip; no-op when global audio is muted. */
export function playSoundEffect(
  src: string,
  audioEnabled: boolean,
  volume = 1,
): void {
  if (!audioEnabled) return
  const audio = new Audio(src)
  audio.volume = volume
  void audio.play().catch(() => {})
}
