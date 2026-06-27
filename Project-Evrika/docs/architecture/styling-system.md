# Styling system

CSS is **feature-scoped**, aggregated globally—no CSS modules.

## Import chain

```
App.css → styles/index.css → (17 feature files)
main.tsx → index.css (Vite boilerplate) + cursors.css
```

See [`src/styles/index.css`](../src/styles/index.css) for import order (comment: order matters).

## Layers

| Layer | Path | Role |
|-------|------|------|
| Base | `styles/base/reset.css` | Reset, `#root`, `.app-root` |
| Layout | `styles/layout/frame.css` | Decorative leaf vine frame |
| Landing | `styles/landing/landing.css` | Hero, preview, journey map |
| Scenes | `styles/scenes/*.css` | Per-lesson BEM-style classes |
| Hub | `styles/hub/` | Shell, nav, celebrations (split partials) |
| Feedback | `styles/feedback/feedback.css` | Modal + dev inbox |
| Components | `styles/components/global-audio-toggle.css` | Shared chrome |

## Naming

- Landing: `.landing-*`
- Hub: `.hub-*`, `.exploration-hub-*`
- Scenes: `.crown-weigh-*`, `.water-discovery-*`, etc.

## Breakpoints

- **960px** — desktop vs mobile experience (`useDesktopExperience`, landing desktop gate)
- Scene files include their own `@media` blocks

## Future: Tailwind

Not integrated in this pass. Token notes live in [styles/README.md](../styles/README.md). Animations and keyframes remain in CSS files.

## Docs

Full CSS map: [styles/README.md](../styles/README.md)
