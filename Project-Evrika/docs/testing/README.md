# Testing

Canonical test documentation for Evrika. Test **files** live in [`../tests/`](../tests/); this page describes how to run them and what they cover.

```bash
cd Project-Evrika
npm test          # single run
npm run test:watch
npm run test:coverage
```

## Layout

```
tests/
├── backend/                  ← placeholder (no backend yet)
└── frontend/
    ├── setup/                ← Vitest setup, RTL helpers, matchMedia mock
    ├── unit/                 ← pure logic (lib modules)
    └── integration/          ← hooks, context, React components
```

## Stack

| Tool | Role |
|------|------|
| [Vitest](https://vitest.dev/) | Test runner (Vite-native) |
| [jsdom](https://github.com/jsdom/jsdom) | Browser-like DOM |
| [React Testing Library](https://testing-library.com/react) | Component integration tests |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) | Realistic user interactions |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | DOM matchers |

## Custom helpers

| Helper | Location | Purpose |
|--------|----------|---------|
| `mockMatchMedia` / `setViewportWidth` | `tests/frontend/setup/matchMedia.ts` | Viewport breakpoints (960px) |
| `createLessonProgress` | `tests/frontend/setup/test-utils.tsx` | Hub progress fixtures |
| `renderWithProviders` | `tests/frontend/setup/test-utils.tsx` | Wrap with `LessonHubProvider` |
| Storage reset | `tests/frontend/setup/vitest.setup.ts` | Isolated storage per test |

## Coverage matrix

### Tested (programmatic)

| Area | Type | Files |
|------|------|-------|
| `assetUrl` | Unit | `unit/lib/assetUrl.test.ts` |
| `feedback` | Unit | `unit/lib/feedback.test.ts` |
| `hubRooms` | Unit | `unit/lib/hubRooms.test.ts` |
| Hub progression chain | Custom unit | `unit/lib/hubProgression.test.ts` |
| `landingDesktopGate` | Unit | `unit/lib/landingDesktopGate.test.ts` |
| `landingRive` | Unit | `unit/lib/landingRive.test.ts` |
| `useDesktopExperience` | Integration | `integration/hooks/useDesktopExperience.test.tsx` |
| `useMobileLandingViewport` | Integration | `integration/hooks/useMobileLandingViewport.test.tsx` |
| `LessonHubContext` | Integration | `integration/context/LessonHubContext.test.tsx` |
| `LandingDesktopGate` | Integration | `integration/components/LandingDesktopGate.test.tsx` |
| `FeedbackModal` | Integration | `integration/components/FeedbackModal.test.tsx` |
| `LandingPage` | Integration | `integration/components/LandingPage.test.tsx` |

### Not tested

| Area | Why |
|------|-----|
| Rive / Three.js / Matter.js | Canvas/WebGL/physics — E2E or visual tests |
| Audio | Flaky in jsdom |
| CSS / animations | Visual regression; Tailwind layout in migrated components is still untested visually |
| Tailwind class selectors | Prefer roles/`aria-*`; migrated components avoid BEM modifiers in tests |
| Story scenes / hub celebrations | Large UI — future E2E |
| Cloud transitions | Animation timing |

### Recommended next steps

1. Playwright E2E — landing → intro → hub
2. Visual regression — hero, hub nav
3. Physics smoke test with mocked Matter

## Backend

No backend yet. See [`../tests/backend/README.md`](../tests/backend/README.md).

## Related docs

- [Component index](../components/README.md) — “Tests” column per component
- [Architecture](../architecture/routing-and-scenes.md)
