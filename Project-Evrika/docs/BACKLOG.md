# Evrika — Future work backlog

Canonical backlog for styling, testing, and refactor follow-ups. **Agents: read this file** when the user asks to continue Tailwind, testing, or UX work.

Last updated: 2026-06-20 (after Tailwind v4 pilot)

## Status legend

| Status | Meaning |
|--------|---------|
| `backlog` | Not started |
| `ready` | Scoped; can pick up anytime |
| `blocked` | Needs decision or dependency |
| `done` | Completed (move to bottom or delete) |

---

## P1 — Safety net (recommended next)

### PLAY-1: Playwright smoke E2E (no screenshots)

- **Status:** `ready`
- **Effort:** ~2–4 days
- **Why:** Vitest cannot catch layout/CSS regressions after Tailwind pilot
- **Scope:**
  - Install `@playwright/test`, config, `npm run test:e2e`
  - Flows: landing visible → feedback modal open/submit → hub nav visible
  - Desktop (1280px) + mobile (375px) viewports
  - Skip or stub Rive/Matter canvas assertions (text/roles only)
- **Acceptance:** CI-ready smoke suite; no visual baselines yet
- **Docs:** Update `docs/testing/README.md`

### PLAY-2: Visual regression (screenshots)

- **Status:** `backlog`
- **Effort:** ~3–7 days
- **Depends on:** PLAY-1
- **Scope:**
  - Baselines: FeedbackModal (edit + thanks), HubNavBar (active/locked), landing hero (stable frame)
  - Handle animation flakiness (`prefers-reduced-motion`, wait for idle)
- **Acceptance:** `toHaveScreenshot()` for migrated Tailwind components only

---

## P2 — Tailwind consistency

### TW-1: PrimaryButton / SecondaryButton primitive

- **Status:** `ready`
- **Effort:** ~1–2 days
- **Why:** `.primary-button` / `.secondary-button` globals in `landing.css` used across 15+ scene files
- **Scope:**
  - Add `src/components/ui/PrimaryButton.tsx` (and Secondary) using `@theme` tokens + `cn()`
  - Replace call sites in scenes + landing paths
  - Shrink or remove global button block in `landing.css`
  - Preserve scene overrides (e.g. `crown-weigh-scene .scene-footer .primary-button`) via `className` prop
- **Acceptance:** Visual parity; `npm test` green; docs in `docs/styles/tailwind.md`
- **Out of scope:** Scene footer layout refactors

### TW-2: Hub onboarding layout (optional)

- **Status:** `backlog`
- **Effort:** ~1 day
- **Why:** Many animations — low ROI unless onboarding edits are frequent
- **Scope:** Layout/spacing only in `HubOnboardingGuide.tsx`; keep `onboarding-guide.css` keyframes

---

## P3 — Scene / landing CSS (explicit low priority)

### CSS-1: Landing preview section layout → Tailwind

- **Status:** `backlog`
- **Effort:** ~1–2 days
- **Why:** Grid/spacing only; hero ripples stay in CSS
- **Keep in CSS:** `landing-ripple-*`, bath stack, journey map animations

### CSS-2: Per-scene footer / readout layout slices

- **Status:** `backlog`
- **Effort:** ~1–3 days per major scene
- **Candidates:** CrownWeigh footer, WaterDiscovery HUD shell
- **Do not migrate:** Matter.js canvas, keyframes, pseudo-elements
- **Gate:** Complete Phase 5 checklist in `docs/architecture/styling-system.md`

---

## P4 — Cleanup / hygiene

### CLN-1: Remove unused animation deps

- **Status:** `backlog`
- **Effort:** ~30 min
- **Scope:** Evaluate removing `framer-motion`, `react-spring` from `package.json` (unused in src)

### CLN-2: Tailwind bundle size review

- **Status:** `backlog`
- **Effort:** ~half day
- **Scope:** Measure CSS bundle before/after; consider `@source` narrowing if utilities grow

---

## Done (Tailwind pilot — 2026-06)

- [x] Tailwind v4 + `@tailwindcss/vite` + `@theme` tokens
- [x] `cn()` helper
- [x] FeedbackModal + FeedbackInbox → Tailwind + `feedback-animations.css`
- [x] GlobalAudioToggle → Tailwind
- [x] HubNavBar layout → Tailwind + `nav-states.css`
- [x] Hybrid styling docs + `docs/styles/migration-log.md`

---

## External tools (optional)

| Tool | Free tier | Agent access |
|------|-----------|--------------|
| **This file** (`docs/BACKLOG.md`) | Free | Yes — always in repo |
| **Notion** | Yes (personal) | No — unless you add Notion MCP/integration |
| **Jira Free** | Yes (10 users) | No — unless API token + integration |

To mirror in Notion: duplicate the sections above as a database with columns `ID`, `Status`, `Priority`, `Effort`, `Acceptance`.

---

## Phase 5 re-evaluation (when picking P2/P3)

Before expanding Tailwind beyond chrome, check `docs/architecture/styling-system.md`:

- [ ] Layout bugs fixed faster in Tailwind components?
- [ ] Migrated CSS files shrunk >50%?
- [ ] Zero visual regressions in smoke test?
- [ ] Team prefers utilities over BEM for new chrome?

If mostly “no”, stay hybrid and limit work to PLAY-1 + TW-1.
