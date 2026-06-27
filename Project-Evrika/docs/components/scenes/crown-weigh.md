# Crown Weigh Scene

## Purpose

Interactive balance-beam lab: place crown, gold, masses; learn equivalence before the furnace.

## Key files

- `components/CrownWeighScene.tsx` — orchestrator
- `components/crownWeigh/constants.ts` — Matter tuning, item specs
- `components/crownWeigh/scaleIcons.tsx` — SVG icons
- `components/crownWeigh/useCrownWeighPhysics.ts` — beam physics
- `components/crownWeigh/CrownWeighReadouts.tsx`, `CrownWeighFooter.tsx`
- `styles/scenes/crown-weigh.css`
- `hooks/useScalePhysics.ts` — shared beam helper (if used)

## State & progress

`progress.weigh` — phase, placed items, insights played.

## Navigation

Hub room `weigh` or top-level `weigh` scene.

## Tests

Hub unlock only (`hubRooms.test.ts`). Physics not unit-tested.

## Not testable here

Matter.js canvas sync, drag feel, narrator entrance animation.
