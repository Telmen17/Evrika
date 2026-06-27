# Hub (Exploration Hub)

## Purpose

Workshop home: room tabs, objective banner, unlock/complete celebrations, companion, onboarding guide.

## Key files

| File | Role |
|------|------|
| `components/ExplorationHub.tsx` | Shell + `LessonHubProvider` |
| `components/hub/HubNavBar.tsx` | Bottom room navigation |
| `components/hub/HubCelebrationOverlay.tsx` | Unlock/complete fly-back animations |
| `components/hub/useHubCelebrations.ts` | Celebration queue state |
| `components/hub/hubNavIcons.tsx` | Nav SVG icons |
| `components/hub/useHubNavigation.ts` | SceneId ↔ room mapping |
| `components/HubOnboardingGuide.tsx` | Guided tour |
| `components/ArchimedesCompanion.tsx` | Voiceline bubble |
| `components/LeafFrameDecoration.tsx` | Leaf frame (from App) |
| `styles/hub/` | Shell, rooms, celebrations, nav-states |
| `lib/hubRooms.ts` | Unlock/completion rules |

## Styling

| Approach | Files | Notes |
|----------|-------|-------|
| Tailwind utilities | `hub/HubNavBar.tsx` | Nav bar gradient, item flex layout |
| Feature CSS | `hub/shell.css`, `rooms.css`, `companion.css` | Hub shell and room content |
| Hybrid CSS | `hub/nav-states.css` | Active tab `::after` pseudo-element |
| Animation CSS | `hub/celebrations.css` | Lock badges, check pop, fly-back |

**Modifier classes kept:** `hub-nav-item--active`, `hub-nav-item--locked`, `hub-nav-item--complete` (celebration CSS depends on these)

**Why not full Tailwind:** celebrations use keyframes and nested selectors on nav modifiers

**Debugging tip:** nav layout → `HubNavBar.tsx`; celebration timing → `celebrations.css`

## State & progress

Full `LessonProgress` via `LessonHubContext`. Celebrations driven by `getNavRoomUnlockState` / completion deltas.

## Navigation

Internal `activeRoom` switch renders scene components inline. `hubNavigate` maps external `SceneId` to rooms when possible.

## Tests

- `tests/frontend/unit/lib/hubRooms.test.ts`
- `tests/frontend/unit/lib/hubProgression.test.ts`

## Not testable here

Celebration animations, onboarding spotlight timing, ambient audio loop.
