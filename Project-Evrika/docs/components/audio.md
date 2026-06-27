# Audio

## Purpose

Global mute toggle and hub ambient music.

## Key files

- `components/GlobalAudioToggle.tsx`
- `components/HubAmbientMusic.tsx`
- `context/GlobalAudioContext.tsx`
- `hooks/useAudioPlayer.ts`
- `lib/playSoundEffect.ts`
- `styles/components/cloud-transition.css` — cloud overlay only (toggle uses Tailwind)

## Styling

| Approach | Files | Notes |
|----------|-------|-------|
| Tailwind utilities | `GlobalAudioToggle.tsx` | Fixed position, size, gradients, hover/focus |
| Feature CSS | `cloud-transition.css` | Scene navigation cloud overlay (not the toggle) |

**Key utilities:** `fixed z-[1100]`, frame-safe `top`/`right` with CSS vars, `bg-gradient-to-b from-[#fff9ec]`

**Debugging tip:** toggle styling → TSX; cloud wipe → `cloud-transition.css`

## Tests

Not covered (browser audio APIs unreliable in jsdom).

## Not testable here

Voiceline playback, ambient loop crossfade.
