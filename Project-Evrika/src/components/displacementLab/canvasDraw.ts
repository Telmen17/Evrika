/**
 * displacementLab/canvasDraw — 2D canvas rendering for overflow cans and pour streams.
 *
 * Responsibility: tank walls, water fill, bezier pour animation, and background compositing.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import {
  COLLECTION_CUP_MAX_ML,
  LAB_H,
  LAB_W,
  TANK_L,
  TANK_R,
  type TankSpec,
} from './constants'

/** Cubic Bezier point B(t) for P0, P1, P2, P3 */
function cubicPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
) {
  const u = 1 - t
  return {
    x:
      u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x,
    y:
      u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y,
  }
}

export function drawTankWalls(
  ctx: CanvasRenderingContext2D,
  spec: TankSpec,
  label: string,
) {
  const { innerL, innerR, innerTop, innerBottom, wallT, nozzleY } = spec
  const sideH = innerBottom - innerTop
  const spoutGapTop = nozzleY - innerTop - 8
  const spoutGapBot = innerBottom - nozzleY - 12
  ctx.save()
  ctx.fillStyle = '#6d523c'
  ctx.strokeStyle = '#3d2814'
  ctx.lineWidth = 2
  /* Left wall — flat top at rim (no ridge above water) */
  ctx.fillRect(innerL - wallT, innerTop, wallT, sideH)
  ctx.strokeRect(innerL - wallT, innerTop, wallT, sideH)
  /* Right wall: two segments with spout notch + flat pouring shelf */
  if (spoutGapTop > 4) {
    ctx.fillRect(innerR, innerTop, wallT, spoutGapTop)
    ctx.strokeRect(innerR, innerTop, wallT, spoutGapTop)
  }
  if (spoutGapBot > 4) {
    ctx.fillRect(innerR, nozzleY + 12, wallT, spoutGapBot)
    ctx.strokeRect(innerR, nozzleY + 12, wallT, spoutGapBot)
  }
  ctx.fillStyle = '#5a4630'
  ctx.fillRect(innerL - wallT, innerBottom, innerR - innerL + wallT * 2, wallT + 2)
  /* Open rim + outlet lip (horizontal pouring edge, not a tall point) */
  ctx.strokeStyle = '#3d2814'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(innerL - wallT * 0.2, innerTop)
  ctx.lineTo(innerR + wallT * 0.35, innerTop)
  ctx.stroke()
  ctx.fillStyle = '#5a4632'
  ctx.fillRect(innerR + wallT - 2, nozzleY - 4, 18, 9)
  ctx.strokeRect(innerR + wallT - 2, nozzleY - 4, 18, 9)
  ctx.fillStyle = 'rgba(40, 30, 20, 0.88)'
  ctx.font = '600 9px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(label, spec.cx, innerTop - 10)
  ctx.restore()
}

export function drawWaterRegion(ctx: CanvasRenderingContext2D, spec: TankSpec, waterSurfaceY: number) {
  const { innerL, innerR, innerBottom, innerTop } = spec
  const h = innerBottom - waterSurfaceY - 2
  if (h <= 1) return
  ctx.save()
  const grd = ctx.createLinearGradient(0, innerTop, 0, innerBottom)
  grd.addColorStop(0, 'rgba(160, 215, 255, 0.98)')
  grd.addColorStop(0.5, 'rgba(85, 170, 235, 0.95)')
  grd.addColorStop(1, 'rgba(50, 130, 205, 0.98)')
  ctx.fillStyle = grd
  ctx.fillRect(innerL + 1.5, waterSurfaceY, innerR - innerL - 3, h)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(innerL + 2, waterSurfaceY)
  ctx.lineTo(innerR - 2, waterSurfaceY)
  ctx.stroke()
  ctx.restore()
}

export function drawPourStream(
  ctx: CanvasRenderingContext2D,
  spec: TankSpec,
  drip: number,
  collectedMl: number,
  capMl: number,
  timeMs: number,
) {
  const { nozzleOutX, nozzleY, collectX, collectTop } = spec
  if (drip <= 0.04) return
  if (capMl <= 0.5) return
  if (collectedMl >= capMl - 0.2) return

  const sx = nozzleOutX + 11
  const sy = nozzleY + 3
  const ex = collectX
  const ey = collectTop + 16
  const dx = ex - sx
  const drop = ey - sy
  /** Start almost flat from the lip, then let gravity pull the stream down. */
  const cp1x = sx + dx * 0.34
  const cp1y = sy + Math.sin(timeMs * 0.004) * 0.9
  const cp2x = sx + dx * 0.78
  const cp2y = sy + drop * 0.22 + 6 + Math.sin(timeMs * 0.0035 + 0.8) * 0.8
  const p0 = { x: sx, y: sy }
  const p1 = { x: cp1x, y: cp1y }
  const p2 = { x: cp2x, y: cp2y }
  const p3 = { x: ex, y: ey }

  const fillRemain = Math.max(0, 1 - collectedMl / capMl)
  const flow = drip * (0.55 + 0.45 * fillRemain)

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let layer = -2; layer <= 2; layer++) {
    const o = layer * 1.15
    ctx.beginPath()
    ctx.moveTo(sx + o * 0.4, sy)
    ctx.bezierCurveTo(
      cp1x + o * 0.45,
      cp1y + o * 0.08,
      cp2x + o * 0.32,
      cp2y + o * 0.2,
      ex + o * 0.2,
      ey,
    )
    const lw = 5.2 - Math.abs(layer) * 1.1
    ctx.strokeStyle = `rgba(35, 125, 215, ${0.22 + 0.38 * flow * (1 - Math.abs(layer) * 0.12)})`
    ctx.lineWidth = lw
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey)
  ctx.strokeStyle = `rgba(140, 210, 255, ${0.35 + 0.35 * flow})`
  ctx.lineWidth = 1.6
  ctx.stroke()

  const n = 10
  const phase = (timeMs * 0.0018) % 1
  for (let k = 0; k < n; k++) {
    const t = (k / n + phase) % 1
    const p = cubicPoint(t, p0, p1, p2, p3)
    const r = 1.1 + 0.45 * Math.sin(timeMs * 0.022 + k * 0.7)
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(170, 225, 255, ${0.25 + 0.35 * flow * (1 - t * 0.35)})`
    ctx.fill()
  }

  ctx.beginPath()
  ctx.arc(sx + 2, sy, 2.4, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(200, 235, 255, ${0.5 * flow})`
  ctx.fill()

  ctx.restore()
}

export interface DisplacementLabSimState {
  leftMainWater: number
  rightMainWater: number
  leftSpray: number
  rightSpray: number
  leftCollected: number
  rightCollected: number
}

export function paintBackgroundLayer(
  canvas: HTMLCanvasElement,
  sim: DisplacementLabSimState,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const pr = Math.min(window.devicePixelRatio || 1, 2)
  if (canvas.width !== LAB_W * pr) {
    canvas.width = LAB_W * pr
    canvas.height = LAB_H * pr
    canvas.style.width = `${LAB_W}px`
    canvas.style.height = `${LAB_H}px`
  }
  ctx.setTransform(pr, 0, 0, pr, 0, 0)
  ctx.fillStyle = '#d9c8a8'
  ctx.fillRect(0, 0, LAB_W, LAB_H)

  drawTankWalls(ctx, TANK_L, 'Crown')
  drawTankWalls(ctx, TANK_R, 'Gold nugget')

  const surfL = TANK_L.innerBottom - (TANK_L.innerBottom - TANK_L.innerTop) * sim.leftMainWater
  const surfR = TANK_R.innerBottom - (TANK_R.innerBottom - TANK_R.innerTop) * sim.rightMainWater
  drawWaterRegion(ctx, TANK_L, surfL)
  drawWaterRegion(ctx, TANK_R, surfR)

  const dripL = sim.leftSpray
  const dripR = sim.rightSpray
  const t = typeof performance !== 'undefined' ? performance.now() : Date.now()
  drawPourStream(ctx, TANK_L, dripL, sim.leftCollected, COLLECTION_CUP_MAX_ML, t)
  drawPourStream(ctx, TANK_R, dripR, sim.rightCollected, COLLECTION_CUP_MAX_ML, t)
}
