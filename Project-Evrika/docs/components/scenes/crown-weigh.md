# Crown Weigh Scene

## Purpose

Interactive balance-beam lab: place crown, gold, masses; learn equivalence before the furnace.

## Key files

- `components/CrownWeighScene.tsx` — orchestrator (physics + UI)
- `components/crownWeigh/constants.ts` — Matter tuning, item specs
- `components/crownWeigh/types.ts` — phase and item types
- `components/crownWeigh/geometry.ts` — beam/pan geometry helpers
- `components/crownWeigh/scaleIcons.ts` — SVG icon paths
- `styles/scenes/crown-weigh.css`
- `hooks/useScalePhysics.ts` — shared beam helper (if used)

## Styling

| Approach | Files | Notes |
|----------|-------|-------|
| Feature CSS | `styles/scenes/crown-weigh.css` | Scale UI, pan animations, footer buttons |
| BEM classes | `CrownWeighScene.tsx` | `.crown-weigh-*` |

**Why not Tailwind:** 67+ class names tied to Matter.js UI, pan keyframes, nested scene selectors

**Debugging tip:** canvas/physics positions → TSX; visual chrome → `crown-weigh.css`

## State & progress

`progress.weigh` — phase, placed items, insights played.

## Navigation

Hub room `weigh` or top-level `weigh` scene.

## Tests

Hub unlock only (`hubRooms.test.ts`). Physics not unit-tested.

## Not testable here

Matter.js canvas sync, drag feel, narrator entrance animation.
