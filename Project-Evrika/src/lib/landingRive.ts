/**
 * landingRive — constants for the landing hero Archimedes Rive animation.
 *
 * Responsibility: asset path, artboard name, Idle timeline, layout scale.
 * Docs: docs/components/landing.md
 * Tests: tests/frontend/unit/lib/landingRive.test.ts
 */

import archimedesIdleRiv from '../assets/archimedes-parts/archimedes-idle-3.riv'

/**
 * Landing hero — Archimedes idle Rive animation.
 *
 * Source: `src/assets/archimedes-parts/archimedes-idle-3.riv`
 * Plays the linear timeline `Idle` (ping-pong loop authored in Rive).
 */

export const LANDING_ARCHIMEDES_RIVE_SRC = archimedesIdleRiv

export const LANDING_ARCHIMEDES_ARTBOARD = 'Artboard'

/** Timeline name in the Rive file — must match exactly. */
export const LANDING_ARCHIMEDES_IDLE_ANIMATION = 'Idle'

/**
 * Scales the artboard inside the hero slot. Tune here + `--hero-rive-scale` in landing.css.
 * Does not change Rive artboard pixel size — only runtime draw scale.
 */
export const LANDING_ARCHIMEDES_LAYOUT_SCALE = 1.38

/** Display slot on the landing hero — tune CSS vars on `.landing-hero-scene`, not artboard px. */
export const LANDING_ARCHIMEDES_ARTBOARD_SIZE = {
  width: 400,
  height: 520,
} as const
