# Progress and state

## LessonHubContext

[`src/context/LessonHubContext.tsx`](../src/context/LessonHubContext.tsx) is the **single source of truth** for lesson progress and the Archimedes companion bubble.

- **Storage key:** `evrika-hub-progress-v1` in `localStorage`
- **Provider mount:** inside `ExplorationHub` (not app root)
- **API:** `progress`, `patchProgress`, `resetProgress`, `companion`, `triggerInsight`, …

### Progress slices

| Slice | Purpose |
|-------|---------|
| `weigh` | Scale mission phase, placed items, mass guess |
| `melt` | Furnace quiz → guard → done |
| `waterLab` | Discovery seen, intro beat |
| `bath` | Story cutscene index |
| `overflow` | Crown vs gold comparison |
| `archimedes` | Proof scroll inputs, unlock |
| `throne` | Finale beats |
| `meta` | Hub onboarding guide seen |

Default shape: `DEFAULT_LESSON_PROGRESS`.

## Hub unlock logic

[`src/lib/hubRooms.ts`](../src/lib/hubRooms.ts) derives which nav rooms are unlocked/completed from `LessonProgress`:

1. Weigh + furnace always open
2. Water lab after early investigation complete
3. Overflow after bath story beat (`bath.storyIndex >= 1`)
4. Archimedes room after overflow comparison
5. Throne after proof unlocked

Custom progression test: `tests/frontend/unit/lib/hubProgression.test.ts`.

## Global audio

[`GlobalAudioContext`](../src/context/GlobalAudioContext.tsx) — app-wide mute toggle (hidden on landing).

## Session-only flags

| Key | Purpose |
|-----|---------|
| `evrika-hub-guide-from-intro` | Replay hub onboarding after intro |
| `evrika-landing-desktop-gate-dismissed` | Mobile desktop notice (cleared on hard reload) |

## Tests

- `tests/frontend/integration/context/LessonHubContext.test.tsx`
- `tests/frontend/unit/lib/hubRooms.test.ts`
