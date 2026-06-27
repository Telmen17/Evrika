# Lib utilities

Pure helpers under [`src/lib/`](../src/lib/).

| Module | Responsibility | Tests |
|--------|----------------|-------|
| `hubRooms.ts` | Nav room IDs, unlock/completion predicates, cutscene trigger | `hubRooms.test.ts`, `hubProgression.test.ts` |
| `feedback.ts` | Local inbox + Web3Forms submit | `feedback.test.ts` |
| `landingDesktopGate.ts` | Session dismiss flag, viewport helpers | `landingDesktopGate.test.ts` |
| `landingRive.ts` | Rive file path, artboard, animation names | `landingRive.test.ts` |
| `assetUrl.ts` | Normalize Vite asset imports | `assetUrl.test.ts` |
| `playSoundEffect.ts` | One-shot SFX playback | — |
| `ensureMatter.ts` | Lazy-load Matter.js | — |
| `installQuillCursors.ts` | Custom cursor CSS injection | — |
| `cn.ts` | Tailwind class merge (`clsx` + `tailwind-merge`) | — |

## Related

- Hub unlock architecture: [../architecture/progress-and-state.md](../architecture/progress-and-state.md)
