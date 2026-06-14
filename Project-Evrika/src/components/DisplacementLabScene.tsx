import type { CSSProperties, FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLessonHub } from '../context/LessonHubContext'
import crownSvg from '../assets/crown.svg'
import goldNuggetPng from '../assets/goldNugget3.png'
import { assetUrl } from '../lib/assetUrl'
import type { SceneId } from './LandingPage'
import { ensureMatterLoaded } from '../lib/ensureMatter'

interface DisplacementLabSceneProps {
  onNavigate: (scene: SceneId) => void
}

const DISPLACEMENT_CROWN_ML = 129.66
const DISPLACEMENT_GOLD_ML = 103.52
/** Shared cup scale: both objects can end up in one tank → up to 129.66 + 103.52 mL overflow */
const COLLECTION_CUP_MAX_ML = DISPLACEMENT_CROWN_ML + DISPLACEMENT_GOLD_ML

const LAB_W = 800
/** Shorter stage; vessels only slightly taller than water column + pour lip */
const LAB_H = 340
/**
 * `crown.svg` declares width/height 800px (viewBox 0 0 72 72). Matter draws sprites at
 * textureWidth × xScale — using 128 here made the crown ~6× wider than the physics body.
 */
const CROWN_TEXTURE_PX = 800
/** goldNugget3.png intrinsic size (browser drawImage uses this) */
const GOLD_TEXTURE_W = 475
const GOLD_TEXTURE_H = 525

/** Beaker height in CSS px — must match `.displacement-lab-hud-beaker` */
const HUD_BEAKER_H = 52
/** Rough “mL of column” used to map collected overflow → lower resting surface when object is removed. */
const NOTIONAL_TANK_COLUMN_ML = 240

function mlToTankLevel01(ml: number) {
  return Math.min(0.22, (ml / NOTIONAL_TANK_COLUMN_ML) * 0.22)
}

function formatCollectedMl(ml: number) {
  if (ml >= 100) return ml.toFixed(1)
  if (ml >= 10) return ml.toFixed(1)
  return ml.toFixed(2)
}

function tankLayout(cx: number, collectPad: number) {
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

const TANK_L = tankLayout(200, 48)
const TANK_R = tankLayout(600, 70)

type TankSpec = typeof TANK_L

/**
 * Overflow can at rest: water surface level with the spout opening (nozzleY).
 * water01 = fraction of inner column filled; surf = innerBottom - innerH * water01 = nozzleY.
 */
const INITIAL_TANK_WATER_01 =
  (TANK_L.innerBottom - TANK_L.nozzleY) / (TANK_L.innerBottom - TANK_L.innerTop)

function bodyOverlapsTankInner(
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
function submergedVolumeFractionInTank(
  b: { min: { x: number; y: number }; max: { x: number; y: number } },
  spec: TankSpec,
  waterSurfaceY: number,
): number {
  if (!bodyOverlapsTankInner(b, spec)) return 0
  const h = b.max.y - b.min.y
  if (h <= 0) return 0
  const floorY = spec.innerBottom - 2
  const y0 = Math.max(b.min.y, waterSurfaceY)
  const y1 = Math.min(b.max.y, floorY)
  const overlap = y1 - y0
  if (overlap <= 0) return 0
  return Math.min(1, overlap / h)
}

function drawTankWalls(
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

function drawWaterRegion(ctx: CanvasRenderingContext2D, spec: TankSpec, waterSurfaceY: number) {
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

function drawPourStream(
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

function paintBackgroundLayer(
  canvas: HTMLCanvasElement,
  sim: {
    leftMainWater: number
    rightMainWater: number
    leftSpray: number
    rightSpray: number
    leftCollected: number
    rightCollected: number
  },
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

const DisplacementLabScene: FC<DisplacementLabSceneProps> = ({ onNavigate: _onNavigate }) => {
  const { progress, patchProgress } = useLessonHub()
  const hostRef = useRef<HTMLDivElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const crownRef = useRef<any>(null)
  const goldRef = useRef<any>(null)
  const simRef = useRef({
    leftSpray: 0,
    rightSpray: 0,
    leftMainWater: INITIAL_TANK_WATER_01,
    rightMainWater: INITIAL_TANK_WATER_01,
    leftCollected: 0,
    rightCollected: 0,
    leftDisplacedMl: 0,
    rightDisplacedMl: 0,
  })
  const hudDisplayRef = useRef({ left: 0, right: 0 })
  const [matterOk, setMatterOk] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [leftCollected, setLeftCollected] = useState(0)
  const [rightCollected, setRightCollected] = useState(0)
  const [hasCompared, setHasCompared] = useState(() => progress.overflow.hasCompared)

  useEffect(() => {
    let cancelled = false
    ensureMatterLoaded()
      .then(() => {
        if (!cancelled) setMatterOk(true)
      })
      .catch(() => {
        if (!cancelled) setMatterOk(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!matterOk || !hostRef.current || !bgCanvasRef.current) return

    simRef.current = {
      leftSpray: 0,
      rightSpray: 0,
      leftMainWater: INITIAL_TANK_WATER_01,
      rightMainWater: INITIAL_TANK_WATER_01,
      leftCollected: 0,
      rightCollected: 0,
      leftDisplacedMl: 0,
      rightDisplacedMl: 0,
    }
    hudDisplayRef.current = { left: 0, right: 0 }
    setLeftCollected(0)
    setRightCollected(0)
    const Matter = (window as any).Matter
    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Composite,
      Mouse,
      MouseConstraint,
      Events,
      Body,
      Sleeping,
    } = Matter

    const engine = Engine.create({ enableSleeping: true })
    engine.world.gravity.y = 1

    const render = Render.create({
      element: hostRef.current,
      engine,
      options: {
        width: LAB_W,
        height: LAB_H,
        wireframes: false,
        background: 'transparent',
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      },
    })

    const matterCanvas = render.canvas as HTMLCanvasElement
    matterCanvas.style.background = 'transparent'

    const wallStyle = {
      isStatic: true,
      render: { fillStyle: '#6d5238', strokeStyle: '#3d2814', lineWidth: 1 },
    }

    function buildTankWalls(spec: TankSpec) {
      const { cx, innerW, innerTop, innerBottom, innerL, innerR, wallT } = spec
      const midY = (innerTop + innerBottom) / 2
      const sideH = innerBottom - innerTop
      const leftWall = Bodies.rectangle(innerL - wallT / 2, midY, wallT, sideH + wallT, wallStyle)
      const rightWall = Bodies.rectangle(innerR + wallT / 2, midY, wallT, sideH + wallT, wallStyle)
      const floor = Bodies.rectangle(cx, innerBottom + wallT / 2, innerW + wallT * 2 + 8, wallT, wallStyle)
      const nozzleBlock = Bodies.rectangle(
        innerR + wallT * 0.5,
        innerTop + (innerBottom - innerTop) * 0.34,
        wallT + 4,
        28,
        { ...wallStyle, isStatic: true },
      )
      return [leftWall, rightWall, floor, nozzleBlock]
    }

    const ground = Bodies.rectangle(LAB_W / 2, LAB_H + 24, LAB_W * 2, 48, {
      isStatic: true,
      render: { visible: false },
    })

    const CROWN_W = 56
    const CROWN_H = 42
    const GOLD_W = 60
    const GOLD_H = 53
    /* Ground body top is at y = LAB_H; centers so body bottom touches the floor */
    const floorTop = LAB_H
    /** Bench: each object sits in the open strip just left of its overflow can */
    const benchGap = 20
    const crownBenchX = TANK_L.innerL - benchGap - CROWN_W / 2
    const goldBenchX = TANK_R.innerL - benchGap - GOLD_W / 2

    const crown = Bodies.rectangle(crownBenchX, floorTop - CROWN_H / 2, CROWN_W, CROWN_H, {
      frictionAir: 0.025,
      friction: 0.5,
      restitution: 0.04,
      density: 0.002,
      label: 'crown',
      chamfer: { radius: 3 },
      render: {
        opacity: 1,
        sprite: {
          texture: assetUrl(crownSvg),
          xScale: CROWN_W / CROWN_TEXTURE_PX,
          yScale: CROWN_H / CROWN_TEXTURE_PX,
        },
      },
    })
    Body.setMass(crown, 5)

    const gold = Bodies.rectangle(goldBenchX, floorTop - GOLD_H / 2, GOLD_W, GOLD_H, {
      frictionAir: 0.025,
      friction: 0.5,
      restitution: 0.04,
      density: 0.002,
      label: 'gold',
      chamfer: { radius: 6 },
      render: {
        opacity: 1,
        sprite: {
          texture: assetUrl(goldNuggetPng),
          xScale: GOLD_W / GOLD_TEXTURE_W,
          yScale: GOLD_H / GOLD_TEXTURE_H,
        },
      },
    })
    Body.setMass(gold, 5)

    Body.setVelocity(crown, { x: 0, y: 0 })
    Body.setVelocity(gold, { x: 0, y: 0 })
    if (typeof Sleeping !== 'undefined' && Sleeping.set) {
      Sleeping.set(crown, true)
      Sleeping.set(gold, true)
    }

    crownRef.current = crown
    goldRef.current = gold

    Composite.add(engine.world, [
      ground,
      ...buildTankWalls(TANK_L),
      ...buildTankWalls(TANK_R),
      crown,
      gold,
    ])

    const runner = Runner.create()
    Runner.run(runner, engine)
    Render.run(render)

    const mouse = Mouse.create(render.canvas)
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.3, damping: 0.12, render: { visible: false } },
    })
    Composite.add(engine.world, mc)
    render.mouse = mouse

    const wakeDragged = () => {
      if (typeof Sleeping !== 'undefined' && Sleeping.set) {
        if (crownRef.current) Sleeping.set(crownRef.current, false)
        if (goldRef.current) Sleeping.set(goldRef.current, false)
      }
    }
    Events.on(mouse, 'mousedown', wakeDragged)

    const bgEl = bgCanvasRef.current

    let frame = 0
    const tick = () => {
      const sim = simRef.current
      const c = crownRef.current
      const g = goldRef.current
      const dt = Math.min(48, (engine as any).timing?.lastDelta ?? 16)

      const stepTank = (spec: TankSpec, key: 'left' | 'right', crownBody: any, goldBody: any) => {
        const sprayKey = key === 'left' ? 'leftSpray' : 'rightSpray'
        const mainKey = key === 'left' ? 'leftMainWater' : 'rightMainWater'
        const colKey = key === 'left' ? 'leftCollected' : 'rightCollected'
        const displacedKey = key === 'left' ? 'leftDisplacedMl' : 'rightDisplacedMl'

        const innerH = spec.innerBottom - spec.innerTop
        const surfaceY = spec.innerBottom - innerH * sim[mainKey]

        let subC = 0
        let subG = 0
        if (crownBody) subC = submergedVolumeFractionInTank(crownBody.bounds, spec, surfaceY)
        if (goldBody) subG = submergedVolumeFractionInTank(goldBody.bounds, spec, surfaceY)

        const targetDisplacedMl =
          subC * DISPLACEMENT_CROWN_ML + subG * DISPLACEMENT_GOLD_ML
        const anySub = subC > 0.05 || subG > 0.05
        const dispEase = Math.min(
          1,
          (targetDisplacedMl > sim[displacedKey] ? 0.38 : 0.22) * (dt / 16.67),
        )
        let displacedMl = sim[displacedKey]
        displacedMl += (targetDisplacedMl - displacedMl) * dispEase
        sim[displacedKey] = displacedMl

        const overflowTargetMl = anySub ? targetDisplacedMl : displacedMl
        let collected = sim[colKey]
        if (anySub && overflowTargetMl > collected + 0.02) {
          const pourGap = overflowTargetMl - collected
          const pourRateMlPerMs = 0.012 + Math.min(pourGap, 140) * 0.00007
          const pourStep = Math.min(pourGap, dt * pourRateMlPerMs)
          sim[colKey] = Math.min(COLLECTION_CUP_MAX_ML, collected + pourStep)
          collected = sim[colKey]
        }

        const resting01 = INITIAL_TANK_WATER_01 - mlToTankLevel01(collected)
        const displacement01 = mlToTankLevel01(overflowTargetMl)
        let target01 = resting01
        if (anySub && overflowTargetMl > 0.2) {
          target01 =
            collected < overflowTargetMl - 0.08
              ? INITIAL_TANK_WATER_01
              : Math.min(INITIAL_TANK_WATER_01, resting01 + displacement01)
        }

        let water01 = sim[mainKey]
        const delta01 = target01 - water01
        if (delta01 > 0) {
          water01 += delta01 * 0.34
        } else {
          water01 += delta01 * (anySub ? 0.055 : 0.22)
        }

        const floor01 = Math.max(0.14, resting01 - 0.02)
        water01 = Math.min(INITIAL_TANK_WATER_01 + 0.01, Math.max(floor01, water01))
        sim[mainKey] = water01

        const pouring = anySub && collected < overflowTargetMl - 0.05
        const excess01 = Math.max(0, water01 - INITIAL_TANK_WATER_01)
        const sprayTarget = pouring
          ? Math.min(1, 0.35 + excess01 / 0.004)
          : Math.min(1, excess01 / 0.0045)
        sim[sprayKey] = sprayTarget > sim[sprayKey] ? sprayTarget : sim[sprayKey] * 0.86
      }

      stepTank(TANK_L, 'left', c, g)
      stepTank(TANK_R, 'right', c, g)

      paintBackgroundLayer(bgEl, simRef.current)

      frame++
      const hud = hudDisplayRef.current
      const shouldRefreshHud =
        frame % 4 === 0 ||
        Math.abs(sim.leftCollected - hud.left) >= 0.35 ||
        Math.abs(sim.rightCollected - hud.right) >= 0.35
      if (shouldRefreshHud) {
        hud.left = sim.leftCollected
        hud.right = sim.rightCollected
        setLeftCollected(sim.leftCollected)
        setRightCollected(sim.rightCollected)
      }
    }

    Events.on(engine, 'afterUpdate', tick)

    paintBackgroundLayer(bgEl, simRef.current)

    return () => {
      Events.off(engine, 'afterUpdate', tick)
      Events.off(mouse, 'mousedown', wakeDragged)
      Render.stop(render)
      Runner.stop(runner)
      if (render.canvas?.parentNode) {
        render.canvas.remove()
      }
      Engine.clear(engine)
      crownRef.current = null
      goldRef.current = null
    }
  }, [matterOk, resetKey])

  const runComparison = useCallback(() => {
    setHasCompared(true)
    patchProgress({ overflow: { hasCompared: true } })
  }, [patchProgress])

  const retryLab = useCallback(() => {
    setHasCompared(false)
    patchProgress({ overflow: { hasCompared: false } })
    setResetKey((k) => k + 1)
  }, [patchProgress])

  const crownReady = leftCollected >= DISPLACEMENT_CROWN_ML * 0.82
  const goldReady = rightCollected >= DISPLACEMENT_GOLD_ML * 0.82
  const combinedReady =
    Math.max(leftCollected, rightCollected) >=
    (DISPLACEMENT_CROWN_ML + DISPLACEMENT_GOLD_ML) * 0.82
  const canCompare = (crownReady && goldReady || combinedReady) && !hasCompared

  const beakerFill = (ml: number) =>
    `${Math.min(100, (ml / COLLECTION_CUP_MAX_ML) * 100)}%` as const

  return (
    <div className="scene displacement-lab-scene">
      <header className="scene-header hub-scene-header">
        <h2>Test 3 – Displaced water</h2>
      </header>

      <section className="scene-body displacement-lab-body">
        <div className="displacement-lab-intro">
          <p className="scene-text">
            Each overflow can is filled to the spout. Drag the <strong>crown</strong> and{' '}
            <strong>gold nugget</strong> into either can—overflow runs into that side’s collection
            cup. Use <strong>Retry</strong> to reset.
          </p>
        </div>

        <div className="displacement-lab-stage-wrap">
          <div className="displacement-lab-tank-labels" aria-hidden="true">
            <span className="displacement-lab-tank-tag">Overflow can — crown</span>
            <span className="displacement-lab-tank-tag">Overflow can — gold</span>
          </div>

          <div className="displacement-lab-canvas-with-hud">
            <div className="displacement-lab-stack">
              <canvas
                ref={bgCanvasRef}
                className="displacement-bg-canvas"
                width={LAB_W}
                height={LAB_H}
                aria-hidden
              />
              <div
                ref={hostRef}
                className="displacement-matter-host displacement-lab-canvas-host displacement-lab-canvas-host--wide"
                role="img"
                aria-label="Displacement simulation"
              />
            </div>
            <div className="displacement-lab-hud-panels" aria-live="polite">
              <div className="displacement-lab-hud displacement-lab-hud--left">
                <p className="displacement-lab-hud-kicker">Collected</p>
                <div
                  className="displacement-lab-hud-beaker"
                  style={{ '--fill': beakerFill(leftCollected) } as CSSProperties}
                >
                  <span className="displacement-lab-hud-ml">
                    <span className="displacement-lab-hud-num">{formatCollectedMl(leftCollected)}</span>
                    <span className="displacement-lab-hud-unit"> mL</span>
                  </span>
                </div>
              </div>
              <div className="displacement-lab-hud displacement-lab-hud--right">
                <p className="displacement-lab-hud-kicker">Collected</p>
                <div
                  className="displacement-lab-hud-beaker"
                  style={{ '--fill': beakerFill(rightCollected) } as CSSProperties}
                >
                  <span className="displacement-lab-hud-ml">
                    <span className="displacement-lab-hud-num">{formatCollectedMl(rightCollected)}</span>
                    <span className="displacement-lab-hud-unit"> mL</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!matterOk ? (
            <p className="displacement-lab-fallback">Loading physics…</p>
          ) : null}
        </div>

        {hasCompared ? (
          <div className="displacement-lab-conclusion scene-text">
            <p>
              The water surface stays pinned to the spout while an object is submerged, then drops
              below it once the displaced overflow has escaped. In this calibrated setup, the crown
              displaced <strong>{formatCollectedMl(leftCollected)} mL</strong> and the gold nugget displaced{' '}
              <strong>{formatCollectedMl(rightCollected)} mL</strong>.
            </p>
          </div>
        ) : null}

        <div className="displacement-lab-actions">
          <button type="button" className="secondary-button" onClick={retryLab}>
            Retry
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={!canCompare}
            onClick={runComparison}
          >
            Compare overflow volumes
          </button>
        </div>
      </section>

    </div>
  )
}

export default DisplacementLabScene
