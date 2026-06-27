# Tailwind migration log

Tracks which components use Tailwind vs feature CSS.

| Component | Status | Tailwind | CSS retained | Date |
|-----------|--------|----------|--------------|------|
| `FeedbackModal` | Migrated | Layout, form, buttons, sentiment chips | `feedback-animations.css` | 2026-06 |
| `FeedbackInbox` | Migrated | Layout, list, footer | `feedback-animations.css` | 2026-06 |
| `GlobalAudioToggle` | Migrated | Full chrome | — | 2026-06 |
| `HubNavBar` | Hybrid | Bar + item layout | `nav-states.css`, `celebrations.css` | 2026-06 |
| `LandingPage` / landing/* | CSS only | — | `landing/landing.css` | — |
| Scene components | CSS only | — | `scenes/*.css` | — |
| `HubCelebrationOverlay` | CSS only | — | `hub/celebrations.css` | — |
| `PrimaryButton` primitive | Not started | — | `.primary-button` global | — |

## Deleted / replaced files

| Old | New |
|-----|-----|
| `styles/feedback/feedback.css` | Tailwind TSX + `feedback-animations.css` |
| `styles/components/global-audio-toggle.css` | Tailwind TSX + `cloud-transition.css` |
| `styles/hub/nav.css` | Tailwind TSX + `hub/nav-states.css` |

## Next candidates (if Phase 5 passes)

- `HubOnboardingGuide` (many animations — low priority)
- `PrimaryButton` / `SecondaryButton` shared primitive
- Landing preview cards (layout only)

## Explicit no-migrate zones

Landing hero ripples, all scene stylesheets, hub celebrations, canvas/Matter overlays.
