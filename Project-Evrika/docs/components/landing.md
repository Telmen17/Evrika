# Landing

## Purpose

Marketing-style entry: hero with Archimedes in the bath (Rive), sneak-peek cards, journey progress map, and mobile desktop gate.

## Key files

| File | Role |
|------|------|
| `components/LandingPage.tsx` | Page orchestrator |
| `components/landing/LandingHero.tsx` | Hero visual + copy |
| `components/landing/LandingPreviewSection.tsx` | “What awaits inside” grid |
| `components/landing/LandingJourneyMap.tsx` | Milestone progress |
| `components/landing/landingIcons.tsx` | Inline SVG symbols |
| `components/LandingDesktopGate.tsx` | Mobile sticky banner |
| `components/LandingArchimedesRive.tsx` | Rive canvas |
| `components/LandingBackground.tsx` | Backdrop |
| `styles/landing/landing.css` | All landing styles |
| `lib/landingRive.ts` | Rive asset constants |
| `lib/landingDesktopGate.ts` | Gate storage + viewport |

## State & progress

- Reads `completedScenes` from App for journey map checkmarks
- `gateDismissed` for mobile padding class
- `useDesktopExperience()` for mobile vs desktop CTA

## Navigation

- **Start the Journey** → `navigateWithClouds('intro')`
- Path cards → direct `onNavigate(scene)`

## Tests

- `tests/frontend/integration/components/LandingPage.test.tsx`
- `tests/frontend/integration/components/LandingDesktopGate.test.tsx`
- `tests/frontend/unit/lib/landingDesktopGate.test.ts`
- `tests/frontend/unit/lib/landingRive.test.ts`

## Not testable here

Rive canvas output, hero animation timing, bath PNG layering visuals.
