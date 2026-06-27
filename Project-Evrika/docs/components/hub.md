# Hub (Exploration Hub)

## Purpose

Workshop home: room tabs, objective banner, unlock/complete celebrations, companion, onboarding guide.

## Key files

| File | Role |
|------|------|
| `components/ExplorationHub.tsx` | Shell + `LessonHubProvider` |
| `components/hub/HubNavBar.tsx` | Bottom room navigation |
| `components/hub/HubCelebrationQueue.tsx` | Unlock/complete fly-back animations |
| `components/hub/hubNavIcons.tsx` | Nav SVG icons |
| `components/hub/useHubNavigation.ts` | SceneId ↔ room mapping |
| `components/HubOnboardingGuide.tsx` | Guided tour |
| `components/ArchimedesCompanion.tsx` | Voiceline bubble |
| `components/LeafFrameDecoration.tsx` | Leaf frame (from App) |
| `styles/hub/` | Hub CSS partials |
| `lib/hubRooms.ts` | Unlock/completion rules |

## State & progress

Full `LessonProgress` via `LessonHubContext`. Celebrations driven by `getNavRoomUnlockState` / completion deltas.

## Navigation

Internal `activeRoom` switch renders scene components inline. `hubNavigate` maps external `SceneId` to rooms when possible.

## Tests

- `tests/frontend/unit/lib/hubRooms.test.ts`
- `tests/frontend/unit/lib/hubProgression.test.ts`

## Not testable here

Celebration animations, onboarding spotlight timing, ambient audio loop.
