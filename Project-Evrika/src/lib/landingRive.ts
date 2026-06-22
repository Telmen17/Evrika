/**
 * Landing hero — Archimedes bath Rive asset contract.
 *
 * Workflow:
 * 1. Split art in Photoshop (torso, head, arms, water ripples, etc.).
 * 2. Import layers into Rive, rig idle motion (breathing, subtle bob, splash).
 * 3. Export `.riv` to `public/rive/archimedes-bath.riv`.
 * 4. Use a state machine named `State Machine 1` with an idle loop, or rename
 *    `LANDING_ARCHIMEDES_STATE_MACHINE` below to match your file.
 *
 * Recommended artboard: 400×520 — aligns with `.landing-hero-archimedes-wrap`.
 */

/** Served from /public — Vite copies as-is at dev + build time. */
export const LANDING_ARCHIMEDES_RIVE_SRC = '/rive/archimedes-bath.riv'

/** Primary playback mode: state machine (preferred for idle + future triggers). */
export const LANDING_ARCHIMEDES_STATE_MACHINE = 'State Machine 1'

/** Timeline-only fallback if you export without a state machine. */
export const LANDING_ARCHIMEDES_IDLE_ANIMATION = 'idle'

/** Optional artboard name when the file has multiple artboards. */
export const LANDING_ARCHIMEDES_ARTBOARD = 'Archimedes Bath'

export const LANDING_ARCHIMEDES_ARTBOARD_SIZE = {
  width: 400,
  height: 520,
} as const
