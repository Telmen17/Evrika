# Mobile adaptation (`feature/mobile-adaptation`)

Goal: playable golden path on phones (375px+ width) without changing lesson logic or physics.

## Status

| Area | Status | Notes |
|------|--------|-------|
| Landing — start on mobile | done | CTA + paths always visible |
| Desktop tip popup | disabled | `LANDING_DESKTOP_GATE_ENABLED = false`; component kept |
| Weigh — tap-to-place | done | Tap item → tap bowl; drag kept on desktop |
| Furnace — tap crown moves | done | Tap pool / furnace targets instead of drag |
| Water Lab — touch | already done | `touchstart` / `touchmove` on canvas |
| Overflow Lab — touch | done | Matter mouse wired to touch events |
| Hub nav / onboarding | partial | Existing `clamp()` + 640px CSS; QA ongoing |
| Archimedes room | partial | Grid stacks at 640px |
| OG / analytics | backlog | See share/viral plan |

## Interaction model

- **Coarse pointer (phones):** tap-to-select → tap-target; helper copy reflects taps.
- **Fine pointer (desktop):** HTML5 drag-and-drop unchanged where it already works.
- **Canvas sims:** `touch-action: none` + map touches to Matter mouse position (scale by canvas CSS size).

## Breakpoint

`useDesktopExperience` (960px) remains for layout density; it no longer blocks starting the journey.

## QA checklist

- [ ] iOS Safari: landing → intro → hub → weigh (tap) → furnace (tap) → water → overflow
- [ ] Android Chrome: same golden path
- [ ] Landscape 667×375 for overflow dual-tank readability
