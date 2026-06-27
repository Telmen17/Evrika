# Styles

CSS lives in [`src/styles/`](../src/styles/). Imported once via `App.css` → `styles/index.css`.

## Largest files

| File | ~Lines | Contents |
|------|--------|----------|
| `hub/` (partials) | ~1900 | Shell, nav, companion, celebrations |
| `landing/landing.css` | ~1400+ | Hero, preview, journey (legacy block removed) |
| `scenes/crown-melt.css` | ~1100 | Furnace scene |
| `scenes/crown-weigh.css` | ~1100 | Scale scene |
| `scenes/water-discovery.css` | ~745 | Water lab |

## Hub partials

After split:

- `hub/shell.css` — layout, banner
- `hub/nav.css` — bottom bar
- `hub/companion.css` — Archimedes bubble
- `hub/celebrations.css` — unlock/complete animations
- `hub/rooms.css` — room content overrides
- `hub/index.css` — barrel

## Design tokens (informal)

| Token | Value | Usage |
|-------|-------|-------|
| Desktop breakpoint | 960px | Gate, `useDesktopExperience` |
| Landing background | `#3d2818` | Scroll chrome |
| Gold accent | `rgba(212, 164, 84, …)` | CTAs, gates |

## Future Tailwind

Document tokens here before a pilot migration. Keep keyframes in CSS files.

See [architecture/styling-system.md](../architecture/styling-system.md).
