# Water Discovery Scene

## Purpose

Matter.js tank: drop objects, observe buoyancy and water rise; discovery closeup.

## Key files

- `components/WaterDiscoveryScene.tsx` — orchestrator
- `components/waterDiscovery/constants.ts` — tank tuning
- `components/waterDiscovery/types.ts` — item/phase types
- `components/waterDiscovery/geometry.ts` — tank layout helpers
- `components/waterDiscovery/itemSpecs.ts` — droppable item definitions
- `components/WaterLabArchimedesOverlay.tsx`
- `styles/scenes/water-discovery.css`

## Styling

| Approach | Files | Notes |
|----------|-------|-------|
| Feature CSS | `styles/scenes/water-discovery.css` | Tank chrome, HUD, discovery modal |
| BEM classes | `WaterDiscoveryScene.tsx` | `.water-discovery-*` |

**Why not Tailwind:** canvas-adjacent layout, water animations, multi-phase modal art

**Debugging tip:** Matter bodies → TSX/hooks; tank chrome → `water-discovery.css`

## State & progress

`progress.waterLab.discoverySeen`, intro beat.

## Tests

Not covered (physics/canvas).

## Not testable here

Tank rendering, mentor mood phases, discovery modal timing.
