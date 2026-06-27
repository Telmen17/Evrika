# Routing and scenes

Evrika uses **in-memory React state** for navigation—there is no React Router.

## Top-level scenes (`SceneId`)

Defined in [`src/types/sceneId.ts`](../src/types/sceneId.ts). The app holds `currentScene: SceneId` in [`App.tsx`](../src/App.tsx).

| Scene ID | Component | Typical entry |
|----------|-----------|---------------|
| `landing` | `LandingPage` | App start |
| `intro` | `StoryIntroScene` | Start the Journey (cloud transition) |
| `hub` | `ExplorationHub` | After intro or from landing shortcuts |
| `bathStory` | `StoryBathScene` | Hub cutscene trigger |
| `weigh` | `CrownWeighScene` | Hub room or legacy route |
| `melt` | `CrownMeltScene` | Hub furnace room |
| `waterDiscovery` | `WaterDiscoveryScene` | Hub water lab |
| `displacement` | `DisplacementLabScene` | Hub overflow lab |
| `finale` | `StoryFinaleScene` | Throne beat |
| `practice` | `PracticeProblemsScreen` | Optional |
| `bath` | `BuoyancyBathScene` | Legacy lab route |
| `crown` | `CrownDensityScene` | Legacy |
| `recap` | `RecapScreen` | Legacy |

## Navigation helpers

Extracted to [`src/app/useSceneNavigation.ts`](../src/app/useSceneNavigation.ts):

- **`navigate(scene)`** — immediate swap; appends to `completedScenes` when new.
- **`navigateWithClouds(scene)`** — cinematic wipe for landing→intro and intro→hub.
- **`startJourney()`** — `navigateWithClouds('intro')`.

Scene→component mapping lives in [`src/app/sceneRegistry.tsx`](../src/app/sceneRegistry.tsx).

## Hub room router (second level)

[`ExplorationHub`](../src/components/ExplorationHub.tsx) maintains `activeRoom` and renders weigh / melt / waterLab / overflow / archimedes / throne inside the workshop shell. See [components/hub.md](../components/hub.md).

## Body / chrome classes

[`useAppChromeEffects`](../src/app/useAppChromeEffects.ts) toggles:

- `lesson-active` on `body` when not on landing
- `landing-scrollable` on `html`/`body` for landing scroll
- `hub-active` when in the hub (leaf frame collision)

## Tests

- Hub unlock rules: `tests/frontend/unit/lib/hubRooms.test.ts`
- Landing integration: `tests/frontend/integration/components/LandingPage.test.tsx`
