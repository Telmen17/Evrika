# Tailwind CSS

Evrika uses **Tailwind CSS v4** with the [`@tailwindcss/vite`](../../vite.config.ts) plugin. Preflight is **disabled** so existing reset and scene button styles stay authoritative.

Source: [`src/styles/tailwind.css`](../../src/styles/tailwind.css)

## Installation

```bash
npm install -D tailwindcss @tailwindcss/vite
npm install clsx tailwind-merge
```

Vite plugin registered in [`vite.config.ts`](../../vite.config.ts). Utilities imported first in [`styles/index.css`](../../src/styles/index.css).

IDE: install the [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) extension.

## `@theme` token catalog

| Token | CSS variable | Value / notes |
|-------|--------------|---------------|
| Desktop breakpoint | `--breakpoint-desktop` | `60rem` (960px) |
| Gold | `--color-gold` | `#d4a454` |
| Gold ring (active) | `--color-gold-ring` | `#d6a533` |
| Parchment | `--color-parchment` | `#fffaf0` |
| Parchment mid | `--color-parchment-mid` | `#f5e6c6` |
| Ink brown | `--color-ink-brown` | `#4a3112` |
| Ink muted | `--color-ink-muted` | `#5a3e1b` |
| Backdrop | `--color-backdrop` | `rgba(24, 15, 4, 0.6)` |
| Success | `--color-success` | `#2f9e57` |
| Hub nav text | `--color-hub-nav-text` | `#e8d5a8` |
| Serif | `--font-serif` | Georgia, Times New Roman |
| Cinzel | `--font-cinzel` | Cinzel, Trajan Pro |

Usage examples: `text-gold`, `bg-parchment`, `border-gold-border`, `font-serif`, `desktop:flex`

## `cn()` helper

[`src/lib/cn.ts`](../../src/lib/cn.ts) merges class strings and resolves Tailwind conflicts:

```tsx
import { cn } from '../lib/cn'

<button
  className={cn(
    'rounded-chip border border-gold-border/60 px-3 py-2',
    isActive && 'border-gold-ring bg-gradient-to-b from-[#fff6df] to-[#f3e0b0]',
  )}
/>
```

## Utility patterns (migrated components)

### Modal overlay shell

```tsx
const overlayClass =
  'fixed inset-0 z-[1310] flex items-center justify-center p-[clamp(0.75rem,3vw,2rem)]'

const modalClass =
  'relative z-[1] w-full max-w-[540px] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[20px] border-[1.5px] border-gold-border bg-gradient-to-b from-parchment to-parchment-mid shadow-[var(--shadow-feedback)]'
```

Animation hooks: add `feedback-animate-fade` / `feedback-animate-pop` from CSS.

### Sentiment chip (state via `aria-pressed`)

```tsx
className={cn(
  'flex flex-col items-center rounded-chip border-[1.5px] …',
  isActive && 'border-gold-ring bg-gradient-to-b from-[#fff6df] to-[#f3e0b0]',
)}
```

### Hub nav item

Layout in Tailwind; keep `hub-nav-item--active`, `hub-nav-item--locked`, `hub-nav-item--complete` for celebration CSS.

## Forbidden patterns

- **`@apply` sprawl** — do not recreate component CSS in stylesheets
- **Utilities for keyframe art** — ripples, sparks, celebrations stay in CSS
- **Removing BEM modifiers** that `celebrations.css` or tests depend on without updating those files

## Migrated components appendix

### FeedbackModal / FeedbackInbox

| Concern | Location |
|---------|----------|
| Layout, typography, form, buttons | Tailwind in TSX |
| `eurekaFade`, `eurekaPop` | `feedback-animations.css` → `.feedback-animate-*` |
| Thank-you check draw, spark burst | `feedback-animations.css` |
| Tests | Role-based (`FeedbackModal.test.tsx`) — no class selectors |

### GlobalAudioToggle

| Concern | Location |
|---------|----------|
| Fixed position, size, gradients, hover | Tailwind in TSX |
| Cloud transition (separate) | `cloud-transition.css` |

### HubNavBar

| Concern | Location |
|---------|----------|
| Bar gradient, item flex layout | Tailwind in TSX |
| Active tab `::after` | `hub/nav-states.css` |
| Lock badge, check pop, locked opacity | `hub/celebrations.css` |

## Related

- [styles/README.md](README.md) — file map
- [architecture/styling-system.md](../architecture/styling-system.md) — hybrid rules
- [migration-log.md](migration-log.md) — component tracker
