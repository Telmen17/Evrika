import type { CSSProperties, FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import crownSvg from '../assets/crown.svg'
import goldNuggetPng from '../assets/goldNugget3.png'
import type { SceneId } from './LandingPage'
import { ensureMatterLoaded } from '../lib/ensureMatter'

interface DisplacementLabSceneProps {
  onNavigate: (scene: SceneId) => void
}

const DISPLACEMENT_CROWN_ML = 54
const DISPLACEMENT_GOLD_ML = 36
/** Shared cup scale: both objects can end up in one tank → up to 54 + 36 mL overflow */
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
const HUD_BEAKER_H = 82

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
    collectH: 56,
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

/** Visual + pour intensity 0–1 for stream (both objects may share a tank) */
function tankOverflowIntensity(
  crown: { bounds: { min: { x: number; y: number }; max: { x: number; y: number } } } | null,
  gold: { bounds: { min: { x: number; y: number }; max: { x: number; y: number } } } | null,
  spec: TankSpec,
  waterSurfaceY: number,
): number {
  let acc = 0
  if (crown) acc += submergedVolumeFractionInTank(crown.bounds, spec, waterSurfaceY)
  if (gold) acc += submergedVolumeFractionInTank(gold.bounds, spec, waterSurfaceY)
  return Math.min(1, acc)
}

/**
 * Max overflow (mL) this tank can produce for objects currently inside the chamber.
 * Crown alone → 54; gold alone → 36; both → 90.
 */
function tankCollectionCap(
  spec: TankSpec,
  crown: { bounds: { min: { x: number; y: number }; max: { x: number; y: number } } } | null,
  gold: { bounds: { min: { x: number; y: number }; max: { x: number; y: number } } } | null,
): number {
  let cap = 0
  if (crown && bodyOverlapsTankInner(crown.bounds, spec)) cap += DISPLACEMENT_CROWN_ML
  if (gold && bodyOverlapsTankInner(gold.bounds, spec)) cap += DISPLACEMENT_GOLD_ML
  return cap
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

/** Quadratic Bezier point B(t) for P0, P1, P2 */
function quadPoint(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
) {
  const u = 1 - t
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
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
  const cpx = (sx + ex) / 2
  const cpy = Math.min(sy, ey) - 38 + Math.sin(timeMs * 0.006) * 2.5
  const p0 = { x: sx, y: sy }
  const p1 = { x: cpx, y: cpy }
  const p2 = { x: ex, y: ey }

  const fillRemain = Math.max(0, 1 - collectedMl / capMl)
  const flow = drip * (0.55 + 0.45 * fillRemain)

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let layer = -2; layer <= 2; layer++) {
    const o = layer * 1.15
    ctx.beginPath()
    ctx.moveTo(sx + o * 0.4, sy)
    ctx.quadraticCurveTo(cpx + o * 0.5, cpy + o * 0.3, ex + o * 0.35, ey)
    const lw = 5.2 - Math.abs(layer) * 1.1
    ctx.strokeStyle = `rgba(35, 125, 215, ${0.22 + 0.38 * flow * (1 - Math.abs(layer) * 0.12)})`
    ctx.lineWidth = lw
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.moveTo(sx, sy)
  ctx.quadraticCurveTo(cpx, cpy, ex, ey)
  ctx.strokeStyle = `rgba(140, 210, 255, ${0.35 + 0.35 * flow})`
  ctx.lineWidth = 1.6
  ctx.stroke()

  const n = 10
  const phase = (timeMs * 0.0018) % 1
  for (let k = 0; k < n; k++) {
    const t = (k / n + phase) % 1
    const p = quadPoint(t, p0, p1, p2)
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
    leftCollected: number
    rightCollected: number
  },
  crown: {
    bounds: { min: { x: number; y: number }; max: { x: number; y: number } }
    position: { x: number; y: number }
  } | null,
  gold: {
    bounds: { min: { x: number; y: number }; max: { x: number; y: number } }
    position: { x: number; y: number }
  } | null,
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

  const dripL = tankOverflowIntensity(crown, gold, TANK_L, surfL)
  const dripR = tankOverflowIntensity(crown, gold, TANK_R, surfR)
  const capL = tankCollectionCap(TANK_L, crown, gold)
  const capR = tankCollectionCap(TANK_R, crown, gold)
  const t = typeof performance !== 'undefined' ? performance.now() : Date.now()
  drawPourStream(ctx, TANK_L, dripL, sim.leftCollected, capL, t)
  drawPourStream(ctx, TANK_R, dripR, sim.rightCollected, capR, t)
}

const DisplacementLabScene: FC<DisplacementLabSceneProps> = ({ onNavigate }) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement>(null)
  const crownRef = useRef<any>(null)
  const goldRef = useRef<any>(null)
  const simRef = useRef({
    leftMainWater: INITIAL_TANK_WATER_01,
    rightMainWater: INITIAL_TANK_WATER_01,
    leftCollected: 0,
    rightCollected: 0,
  })
  const [matterOk, setMatterOk] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [leftCollected, setLeftCollected] = useState(0)
  const [rightCollected, setRightCollected] = useState(0)
  const [leftMainWater, setLeftMainWater] = useState(INITIAL_TANK_WATER_01)
  const [rightMainWater, setRightMainWater] = useState(INITIAL_TANK_WATER_01)
  const [hasCompared, setHasCompared] = useState(false)

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
      leftMainWater: INITIAL_TANK_WATER_01,
      rightMainWater: INITIAL_TANK_WATER_01,
      leftCollected: 0,
      rightCollected: 0,
    }
    setLeftCollected(0)
    setRightCollected(0)
    setLeftMainWater(INITIAL_TANK_WATER_01)
    setRightMainWater(INITIAL_TANK_WATER_01)

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
          texture: String(crownSvg),
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
          texture: String(goldNuggetPng),
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
        const mainKey = key === 'left' ? 'leftMainWater' : 'rightMainWater'
        const colKey = key === 'left' ? 'leftCollected' : 'rightCollected'
        let water01 = sim[mainKey]
        const innerH = spec.innerBottom - spec.innerTop
        const waterSurfaceY = spec.innerBottom - innerH * water01

        let subC = 0
        let subG = 0
        if (crownBody) subC = submergedVolumeFractionInTank(crownBody.bounds, spec, waterSurfaceY)
        if (goldBody) subG = submergedVolumeFractionInTank(goldBody.bounds, spec, waterSurfaceY)

        const volRate = subC * DISPLACEMENT_CROWN_ML + subG * DISPLACEMENT_GOLD_ML
        const anySub = subC > 0.05 || subG > 0.05
        const capMl = tankCollectionCap(spec, crownBody, goldBody)

        if (anySub && volRate > 0.001 && capMl > 0) {
          sim[colKey] = Math.min(capMl, sim[colKey] + volRate * dt * 0.00034)
        }

        const displacementWeight = capMl > 0 ? volRate / capMl : 0
        const target01 = anySub
          ? INITIAL_TANK_WATER_01 + displacementWeight * 0.068
          : INITIAL_TANK_WATER_01
        const lerpT = anySub ? 0.17 : 0.11
        water01 += (target01 - water01) * lerpT
        water01 = Math.min(0.965, Math.max(INITIAL_TANK_WATER_01 - 0.048, water01))
        sim[mainKey] = water01
      }

      stepTank(TANK_L, 'left', c, g)
      stepTank(TANK_R, 'right', c, g)

      paintBackgroundLayer(bgEl, simRef.current, crownRef.current, goldRef.current)

      frame++
      if (frame % 2 === 0) {
        setLeftCollected(simRef.current.leftCollected)
        setRightCollected(simRef.current.rightCollected)
        setLeftMainWater(simRef.current.leftMainWater)
        setRightMainWater(simRef.current.rightMainWater)
      }
    }

    Events.on(engine, 'afterUpdate', tick)

    paintBackgroundLayer(bgEl, simRef.current, crownRef.current, goldRef.current)

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
  }, [])

  const retryLab = useCallback(() => {
    setHasCompared(false)
    setResetKey((k) => k + 1)
  }, [])

  const crownReady = leftCollected >= DISPLACEMENT_CROWN_ML * 0.82
  const goldReady = rightCollected >= DISPLACEMENT_GOLD_ML * 0.82
  const canCompare = crownReady && goldReady && !hasCompared

  const beakerFill = (ml: number) =>
    `${Math.min(100, (ml / COLLECTION_CUP_MAX_ML) * 100)}%` as const

  return (
    <div className="scene displacement-lab-scene">
      <header className="scene-header">
        <button
          className="link-button"
          type="button"
          onClick={() => onNavigate('bathStory')}
        >
          ← Back to bath story
        </button>
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
                <p className="displacement-lab-hud-sub">Can {(leftMainWater * 100).toFixed(0)}%</p>
                <div
                  className="displacement-lab-hud-beaker"
                  style={{ '--fill': beakerFill(leftCollected) } as CSSProperties}
                >
                  <span className="displacement-lab-hud-ml">{leftCollected.toFixed(0)} mL</span>
                </div>
              </div>
              <div className="displacement-lab-hud displacement-lab-hud--right">
                <p className="displacement-lab-hud-kicker">Collected</p>
                <p className="displacement-lab-hud-sub">Can {(rightMainWater * 100).toFixed(0)}%</p>
                <div
                  className="displacement-lab-hud-beaker"
                  style={{ '--fill': beakerFill(rightCollected) } as CSSProperties}
                >
                  <span className="displacement-lab-hud-ml">{rightCollected.toFixed(0)} mL</span>
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
              The crown side collected <strong>more</strong> overflow than the gold of equal mass —
              the crown displaces more water, so it is <strong>less dense</strong> than pure gold.
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

      <footer className="scene-footer displacement-lab-footer">
        <div className="scene-footer-left">
          <button
            type="button"
            className="secondary-button"
            onClick={() => onNavigate('bathStory')}
          >
            Back
          </button>
        </div>
      </footer>
    </div>
  )
}

export default DisplacementLabScene
