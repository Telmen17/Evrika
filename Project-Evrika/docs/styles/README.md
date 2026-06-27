# Styles

Styles live in [`src/styles/`](../../src/styles/). Tailwind utilities and feature CSS are loaded together via `App.css` → `styles/index.css`.

## Hybrid status by area

| Area | Approach | TSX | CSS |
|------|----------|-----|-----|
| Feedback modal/inbox | **Tailwind + animations** | `FeedbackModal.tsx`, `FeedbackInbox.tsx` | `feedback/feedback-animations.css` |
| Global audio toggle | **Tailwind** | `GlobalAudioToggle.tsx` | — |
| Hub nav bar | **Tailwind + states** | `hub/HubNavBar.tsx` | `hub/nav-states.css`, `hub/celebrations.css` |
| Cloud transitions | CSS only | `App.tsx` | `components/cloud-transition.css` |
| Landing | CSS only | `landing/*` | `landing/landing.css` |
| Hub shell / rooms | CSS only | `ExplorationHub.tsx` | `hub/shell.css`, `rooms.css`, … |
| Scenes | CSS only | `*Scene.tsx` | `scenes/*.css` |

## Import barrel

[`styles/index.css`](../../src/styles/index.css) order:

1. `tailwind.css` — tokens + utilities (preflight disabled)
2. `base/reset.css`
3. `components/cloud-transition.css`
4. `layout/frame.css`
5. `landing/landing.css`
6. `scenes/*`
7. `hub/index.css` → shell, companion, rooms, nav-states, celebrations
8. `hub/onboarding-guide.css`, `hub/eureka-share.css`
9. `feedback/feedback-animations.css`

## Hub partials → components

| Partial | Consumed by |
|---------|-------------|
| `hub/shell.css` | `ExplorationHub.tsx` |
| `hub/companion.css` | `ArchimedesCompanion.tsx` |
| `hub/rooms.css` | Hub room scenes inline |
| `hub/nav-states.css` | `HubNavBar.tsx` (active `::after`, responsive overrides) |
| `hub/celebrations.css` | `HubCelebrationOverlay.tsx`, nav badges/locks |
| `hub/onboarding-guide.css` | `HubOnboardingGuide.tsx` |
| `hub/eureka-share.css` | `EurekaShareCard.tsx` |

## Largest CSS files (scene art — CSS only)

| File | ~Lines | Contents |
|------|--------|----------|
| `landing/landing.css` | ~1510 | Hero, preview, journey, shared buttons |
| `scenes/crown-melt.css` | ~1140 | Furnace scene |
| `scenes/crown-weigh.css` | ~1076 | Scale scene |
| `hub/celebrations.css` | ~693 | Unlock/complete animations |
| `scenes/water-discovery.css` | ~745 | Water lab |

## Design tokens

Canonical tokens live in [`src/styles/tailwind.css`](../../src/styles/tailwind.css) `@theme` block:

| Token | Value | Usage |
|-------|-------|-------|
| `--breakpoint-desktop` | `60rem` (960px) | `desktop:` utilities, `useDesktopExperience` |
| `--color-gold` | `#d4a454` | CTAs, accents |
| `--color-parchment` | `#fffaf0` | Modal backgrounds |
| `--color-landing-bg` | `#3d2818` | Landing scroll chrome |
| `--font-cinzel` | Cinzel, Trajan Pro | Landing headings |
| `--font-serif` | Georgia | Feedback, share cards |

Legacy CSS files may still hard-code equivalent values until migrated.

## Global classes (not yet migrated)

| Class | Defined in | Used by |
|-------|------------|---------|
| `.primary-button`, `.secondary-button` | `landing/landing.css` | Landing, scenes |
| `.scene`, `.layout` | `scenes/scene-layout.css`, landing | Scene shells |
| `.hub-nav-item--locked` | `hub/celebrations.css` | Nav + celebrations |

## Tailwind

Full utility reference: [tailwind.md](tailwind.md)

Architecture overview: [architecture/styling-system.md](../architecture/styling-system.md)

Migration tracker: [migration-log.md](migration-log.md)
