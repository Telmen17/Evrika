# Context providers

| Context | File | Scope |
|---------|------|-------|
| `LessonHubContext` | `LessonHubContext.tsx` | Progress + companion (mounted in hub) |
| `GlobalAudioContext` | `GlobalAudioContext.tsx` | App-wide audio mute |

See [architecture/progress-and-state.md](../architecture/progress-and-state.md).

## Tests

- `tests/frontend/integration/context/LessonHubContext.test.tsx`
