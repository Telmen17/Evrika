# Displacement Lab Scene

## Purpose

Compare crown vs gold overflow volumes in dual tanks.

## Key files

- `components/DisplacementLabScene.tsx` — orchestrator
- `components/displacementLab/constants.ts` — tank/beaker tuning
- `components/displacementLab/canvasDraw.ts` — pour stream, tank walls drawing
- `styles/scenes/displacement-lab.css`

## Styling

| Approach | Files | Notes |
|----------|-------|-------|
| Feature CSS | `styles/scenes/displacement-lab.css` | Dual-tank layout, pour HUD |
| Canvas draw | `displacementLab/canvasDraw.ts` | Stream/wall rendering (not CSS) |

**Why not Tailwind:** pour animations and canvas-heavy layout tied to feature CSS selectors

**Debugging tip:** canvas drawing → `canvasDraw.ts`; surrounding chrome → `displacement-lab.css`

## State & progress

`progress.overflow.hasCompared`

## Tests

Not covered.

## Not testable here

Pour stream canvas, beaker HUD.
