/**
 * displacementLab/constants — tank layout, calibrated volumes, and lab stage sizing.
 *
 * Responsibility: overflow-can geometry, displacement targets, and HUD formatting helpers.
 * Docs: docs/architecture/routing-and-scenes.md
 */

export const DISPLACEMENT_CROWN_ML = 129.66
export const DISPLACEMENT_GOLD_ML = 103.52
/** Shared cup scale: both objects can end up in one tank → up to 129.66 + 103.52 mL overflow */
export const COLLECTION_CUP_MAX_ML = DISPLACEMENT_CROWN_ML + DISPLACEMENT_GOLD_ML

export const LAB_W = 800
/** Shorter stage; vessels only slightly taller than water column + pour lip */
export const LAB_H = 340
/**
 * `crown.svg` declares width/height 800px (viewBox 0 0 72 72). Matter draws sprites at
 * textureWidth × xScale — using 128 here made the crown ~6× wider than the physics body.
 */
export const CROWN_TEXTURE_PX = 800
/** goldNugget3.png intrinsic size (browser drawImage uses this) */
export const GOLD_TEXTURE_W = 475
export const GOLD_TEXTURE_H = 525

/** Beaker height in CSS px — must match `.displacement-lab-hud-beaker` */
export const HUD_BEAKER_H = 52
/** Rough “mL of column” used to map collected overflow → lower resting surface when object is removed. */
export const NOTIONAL_TANK_COLUMN_ML = 240

export const CROWN_W = 56
export const CROWN_H = 42
export const GOLD_W = 60
export const GOLD_H = 53

export function mlToTankLevel01(ml: number) {
  return Math.min(0.22, (ml / NOTIONAL_TANK_COLUMN_ML) * 0.22)
}

export function formatCollectedMl(ml: number) {
  if (ml >= 100) return ml.toFixed(1)
  if (ml >= 10) return ml.toFixed(1)
  return ml.toFixed(2)
}

export function tankLayout(cx: number, collectPad: number) {
  const innerW = 118
  /* Short side walls: innerTop high → small air gap under rim for “pour” */
  const innerTop = 198
  const innerBottom = LAB_H - 16
  const innerH = innerBottom - innerTop
  const innerL = cx - innerW / 2
  const innerR = cx + innerW / 2
  const wallT = 9
  const nozzleY = innerTop + innerH * 0.38
  /* HUD + pour target: crown side slightly left; gold side further right (no overlap) */
  const collectX = cx + innerW / 2 + wallT + collectPad
  const tankOuterBottom = innerBottom + wallT + 2
  const collectTop = tankOuterBottom - HUD_BEAKER_H
  return {
    cx,
    innerW,
    innerTop,
    innerBottom,
    innerH,
    innerL,
    innerR,
    wallT,
    nozzleY,
    nozzleOutX: cx + innerW / 2 + wallT,
    collectX,
    collectTop,
    collectW: 48,
    collectH: HUD_BEAKER_H,
  }
}

export const TANK_L = tankLayout(200, 48)
export const TANK_R = tankLayout(600, 70)

export type TankSpec = typeof TANK_L

/**
 * Overflow can at rest: water surface level with the spout opening (nozzleY).
 * water01 = fraction of inner column filled; surf = innerBottom - innerH * water01 = nozzleY.
 */
export const INITIAL_TANK_WATER_01 =
  (TANK_L.innerBottom - TANK_L.nozzleY) / (TANK_L.innerBottom - TANK_L.innerTop)

/** Bench: each object sits in the open strip just left of its overflow can */
export const BENCH_GAP = 20
export const FLOOR_TOP = LAB_H
export const crownBenchX = TANK_L.innerL - BENCH_GAP - CROWN_W / 2
export const goldBenchX = TANK_R.innerL - BENCH_GAP - GOLD_W / 2

export function bodyOverlapsTankInner(
  b: { min: { x: number; y: number }; max: { x: number; y: number } },
  spec: TankSpec,
): boolean {
  return (
    b.max.x > spec.innerL + 0.5 &&
    b.min.x < spec.innerR - 0.5 &&
    b.max.y > spec.innerTop + 1 &&
    b.min.y < spec.innerBottom - 0.5
  )
}

/**
 * Fraction of body height that lies in the tank’s water column (below surface, above floor).
 * Returns 0 unless the body overlaps the tank interior in 2D (fixes flow when object is beside tank).
 */
export function submergedVolumeFractionInTank(
  b: { min: { x: number; y: number }; max: { x: number; y: number } },
  spec: TankSpec,
  waterSurfaceY: number,
): number {
  if (!bodyOverlapsTankInner(b, spec)) return 0
  const h = b.max.y - b.min.y
  if (h <= 0) return 0
  // Submerged fraction = portion of the body below the water surface. An object
  // resting on the tank floor is still fully submerged, so we must NOT clip the
  // lower bound at the floor — doing so under-counts displacement at rest and then
  // jumps up when the object is lifted off the floor (phantom extra overflow).
  const y0 = Math.max(b.min.y, waterSurfaceY)
  const y1 = b.max.y
  const overlap = y1 - y0
  if (overlap <= 0) return 0
  return Math.min(1, overlap / h)
}
