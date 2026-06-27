# Evrika test suites

Automated tests for the Evrika project live under `Project-Evrika/tests/`. Run them from the app directory:

```bash
cd Project-Evrika
npm test          # single run
npm run test:watch
npm run test:coverage
```

## Layout

```
tests/
├── README.md                 ← this file
├── backend/                  ← placeholder (no backend yet)
└── frontend/
    ├── setup/                ← Vitest setup, RTL helpers, matchMedia mock
    ├── unit/                 ← pure logic (lib modules)
    └── integration/          ← hooks, context, React components
```

Symlinks at the repo root (`Evrika/tests/`) point here for convenience.

## Stack

| Tool | Role |
|------|------|
| [Vitest](https://vitest.dev/) | Test runner (Vite-native) |
| [jsdom](https://github.com/jsdom/jsdom) | Browser-like DOM |
| [React Testing Library](https://testing-library.com/react) | Component integration tests |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro) | Realistic user interactions |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | DOM matchers (`toBeInTheDocument`, etc.) |

## Custom helpers (not provided by the libraries)

| Helper | Location | Purpose |
|--------|----------|---------|
| `mockMatchMedia` / `setViewportWidth` | `frontend/setup/matchMedia.ts` | Viewport breakpoints (960px desktop gate, mobile layout) |
| `createLessonProgress` | `frontend/setup/test-utils.tsx` | Build `LessonProgress` fixtures for hub tests |
| `renderWithProviders` | `frontend/setup/test-utils.tsx` | Render with `LessonHubProvider` |
| Hard-reload / storage reset | `frontend/setup/vitest.setup.ts` | Isolated `localStorage` / `sessionStorage` per test |

## Coverage matrix

### Tested (programmatic)

| Area | Type | Files |
|------|------|-------|
| `assetUrl` | Unit | `unit/lib/assetUrl.test.ts` |
| `feedback` (local inbox + Web3Forms) | Unit | `unit/lib/feedback.test.ts` |
| `hubRooms` (unlock rules, headings) | Unit | `unit/lib/hubRooms.test.ts` |
| Hub progression chain | Custom unit | `unit/lib/hubProgression.test.ts` |
| `landingDesktopGate` (storage, viewport) | Unit | `unit/lib/landingDesktopGate.test.ts` |
| `landingRive` constants | Unit | `unit/lib/landingRive.test.ts` |
| `useDesktopExperience` | Integration | `integration/hooks/useDesktopExperience.test.tsx` |
| `useMobileLandingViewport` | Integration | `integration/hooks/useMobileLandingViewport.test.tsx` |
| `LessonHubContext` | Integration | `integration/context/LessonHubContext.test.tsx` |
| `LandingDesktopGate` | Integration | `integration/components/LandingDesktopGate.test.tsx` |
| `FeedbackModal` | Integration | `integration/components/FeedbackModal.test.tsx` |
| `LandingPage` (hero, mobile class, progress) | Integration | `integration/components/LandingPage.test.tsx` |

### Not tested (low ROI or needs different tools)

| Area | Why |
|------|-----|
| **Rive animations** (`LandingArchimedesRive`) | Canvas/WebGL runtime; visual/motion — mock in page tests only |
| **Three.js scenes** (`CrownSceneCanvas`, `BathSceneCanvas`) | WebGL rendering — use visual/E2E (Playwright) later |
| **Matter.js physics** (`useScalePhysics`, `ensureMatter`) | Canvas simulation — integration-heavy |
| **Audio playback** (`useAudioPlayer`, `playSoundEffect`, voicelines) | Browser audio APIs; flaky in jsdom |
| **CSS / layout / animations** | Visual regression — not suited to RTL unit tests |
| **Story scenes** (intro, bath, melt, water lab, etc.) | Large interactive UIs — candidate for future E2E |
| **ExplorationHub / onboarding guide** | Complex DOM + animations — future E2E slice tests |
| **Cloud scene transitions** (`App.tsx`) | Full-screen animation timing |
| **Cursor / quill assets** (`installQuillCursors`) | DOM side-effect styling |
| **Backend / API** | No server in repo yet — see `backend/README.md` |

### Recommended next steps

1. **E2E (Playwright)** — landing → intro → hub happy path, one lesson room interaction.
2. **Visual regression** — hero bath stack, hub nav (optional Chromatic / Percy).
3. **Physics smoke test** — mount `CrownWeighScene` with mocked Matter and assert state machine transitions (XState).

## Backend

There is currently **no backend**. When one is added, put its suites in `tests/backend/`.
