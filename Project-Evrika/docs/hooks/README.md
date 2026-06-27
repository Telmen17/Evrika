# Hooks

Shared React hooks under [`src/hooks/`](../src/hooks/).

| Hook | File | Purpose | Tests |
|------|------|---------|-------|
| `useDesktopExperience` | `useDesktopExperience.ts` | `min-width: 960px` breakpoint | `useDesktopExperience.test.tsx` |
| `useMobileLandingViewport` | `useMobileLandingViewport.ts` | Sub-960px for landing gate | `useMobileLandingViewport.test.tsx` |
| `useAudioPlayer` | `useAudioPlayer.ts` | HTMLAudioElement lifecycle | — |
| `useScalePhysics` | `useScalePhysics.ts` | Balance-beam RAF tilt | — |

Scene-specific hooks live next to scenes (e.g. `components/crownWeigh/useCrownWeighPhysics.ts`).
