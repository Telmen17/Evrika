/**
 * waterDiscovery/constants — stage layout, tank geometry, and Matter.js tuning.
 *
 * Responsibility: immutable config for the workshop stage, fluid simulation, and mentor timing.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import type { ItemId } from './types'

/** Full physics stage (px). Slightly wider so the cupboard and tank breathe more. */
export const WD_STAGE_W = 780
export const WD_STAGE_H = 268

/**
 * Glass tank interior (fluid region). Cupboard / shelf is entirely to the left of `innerL`.
 */
export const TANK = {
  innerL: 304,
  innerR: 764,
  /** Lower rim — less vertical lift needed to drag props over the tank. */
  innerTop: 58,
  innerBottom: 218,
} as const

export const innerW = TANK.innerR - TANK.innerL
export const innerH = TANK.innerBottom - TANK.innerTop

/** Cupboard shelf plank (static); aligned with lowest row of ITEM_SPECS */
export const SHELF = {
  y: 246,
  minX: 26,
  maxX: 230,
} as const

/** “Put back” zone (cupboard only; must not overlap tank water) */
export const BENCH = { minX: 20, maxX: 230, minY: 38, maxY: 252 }

/** Vertical lip at shelf height — blocks sliding under without lifting; top stays open for drag-in. */
export const PARTITION = {
  x: (SHELF.maxX + TANK.innerL) / 2,
  width: Math.max(10, TANK.innerL - SHELF.maxX - 6),
  topY: 188,
  bottomY: WD_STAGE_H - 8,
} as const

/** Open band above left wall lip — drag props over, then drop in. */
export const TANK_LEFT_WALL_TOP_Y = 102

/** Invisible Matter walls — thicker than visible wood frame to prevent tunneling. */
export const TANK_WALL_THICKNESS = 14

export const BASE_WATER01 = 0.28
export const MAX_WATER01 = 0.92
/** px² submerged → added fill (tuned for visible rise) */
export const DISPLACEMENT_TO_FILL = 0.000055
export const WATER_RISE_LERP = 0.05
export const WATER_FALL_LERP = 0.035

export const RHO_WATER = 0.0011
export const BUOY_STRENGTH = 0.00012
/** Extra vertical spring so wood rides the surface as water level changes */
export const WOOD_SURFACE_SPRING = 0.00008
export const WOOD_MAX_WATER_VY = 11
/** In 2D, raw AABB submergence overstates a floating block's displaced water. */
export const WOOD_DISPLACEMENT_SCALE = 0.42
export const WOOD_DISPLACEMENT_LERP = 0.08

export const BULK_RHO: Record<ItemId, number> = {
  /** Slightly lighter than water so it floats and tracks the surface */
  wood: 0.00032,
  crown: 0.0028,
  gold: 0.0032,
  rock: 0.0034,
  silver: 0.003,
}

export const CROWN_TEX_W = 800
export const CROWN_TEX_H = 800
export const GOLD1_W = 839
export const GOLD1_H = 839
/** Must match current `wood.png` or sprite/body mismatch hides or “loses” the wood */
export const WOOD_TEX_W = 277
export const WOOD_TEX_H = 478
export const ROCK_TEX_W = 2000
export const ROCK_TEX_H = 2000
export const SILVER_BAR_TEX_W = 72
export const SILVER_BAR_TEX_H = 48

/** Matter.js engine tuning for the discovery workshop. */
export const MATTER_ENGINE = {
  gravityY: 0.95,
  positionIterations: 10,
  velocityIterations: 8,
  constraintIterations: 4,
} as const

export const CLOSEUP_MS = 3400
export const MODAL_REPLAY_MS = 1650
export const MENTOR_INTRO_DELAY_MS = 2800
export const MENTOR_CURIOUS_HOLD_MS = 2200

export const MENTOR_STUCK_LINE =
  'I have weighed the crown and braved the furnace. Mass alone cannot expose a fraud. What clue am I blind to?'
export const MENTOR_CURIOUS_LINE =
  'Wait—the water moved when you dropped that in. Volume may be speaking to us. Try another object; watch the line.'
