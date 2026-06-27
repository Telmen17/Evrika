/**
 * waterDiscovery/geometry — pure math helpers for water level and tank containment.
 *
 * Responsibility: surface height, submerged area, easing, and post-step body clamping.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import {
  TANK,
  TANK_LEFT_WALL_TOP_Y,
  innerH,
} from './constants'

export function waterSurfaceY(water01: number): number {
  return TANK.innerBottom - innerH * water01
}

export function submergedAreaInTank(
  bounds: { min: { x: number; y: number }; max: { x: number; y: number } },
  wl: number,
  wr: number,
  wTop: number,
  wBottom: number,
): number {
  const ix1 = Math.max(bounds.min.x, wl)
  const ix2 = Math.min(bounds.max.x, wr)
  const iy1 = Math.max(bounds.min.y, wTop)
  const iy2 = Math.min(bounds.max.y, wBottom)
  if (ix2 <= ix1 || iy2 <= iy1) return 0
  return (ix2 - ix1) * (iy2 - iy1)
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/** Keep props inside the tank once past the entry lip — backs up invisible walls. */
export function enforceTankContainment(
  body: {
    bounds: { min: { x: number; y: number }; max: { x: number; y: number } }
    position: { x: number; y: number }
    velocity: { x: number; y: number }
  },
  Body: {
    setPosition: (b: unknown, pos: { x: number; y: number }) => void
    setVelocity: (b: unknown, vel: { x: number; y: number }) => void
  },
) {
  const b = body.bounds
  const overlapsTankX = b.max.x > TANK.innerL + 1 && b.min.x < TANK.innerR - 1
  if (!overlapsTankX || b.min.y > TANK.innerBottom + 8) return

  const halfW = (b.max.x - b.min.x) / 2
  const halfH = (b.max.y - b.min.y) / 2
  const pad = 2
  let { x, y } = body.position
  let { x: vx, y: vy } = body.velocity
  let corrected = false

  const floorY = TANK.innerBottom - halfH - pad
  if (y > floorY) {
    y = floorY
    vy = Math.min(vy, 0) * 0.25
    corrected = true
  }

  const rightX = TANK.innerR - halfW - pad
  if (x > rightX) {
    x = rightX
    vx = Math.min(vx, 0) * 0.3
    corrected = true
  }

  if (y > TANK_LEFT_WALL_TOP_Y + halfH * 0.35) {
    const leftX = TANK.innerL + halfW + pad
    if (x < leftX) {
      x = leftX
      vx = Math.max(vx, 0) * 0.3
      corrected = true
    }
  }

  if (corrected) {
    Body.setPosition(body, { x, y })
    Body.setVelocity(body, { x: vx, y: vy })
  }
}
