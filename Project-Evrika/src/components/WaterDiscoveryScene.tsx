import type { CSSProperties, FC } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import crownSvg from '../assets/crown.svg'
import goldNugget1 from '../assets/goldNugget1png.png'
import rockPng from '../assets/rock.png'
import woodPng from '../assets/wood.png'
import { assetUrl } from '../lib/assetUrl'
import { ensureMatterLoaded } from '../lib/ensureMatter'
import type { SceneId } from './LandingPage'
import { useLessonHub } from '../context/LessonHubContext'

type ItemId = 'crown' | 'gold' | 'rock' | 'wood' | 'silver'

function toSvgDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** Same Ag ingot as CrownWeighScene (scaling chapter) — `makeBarIcon('#d9dde7', '#7e8ba5', 'Ag')` */
const SILVER_BAR_TEXTURE = toSvgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 48">
    <rect x="10" y="10" width="52" height="28" rx="8" fill="#d9dde7" stroke="#7e8ba5" stroke-width="3"/>
    <rect x="15" y="14" width="42" height="8" rx="4" fill="rgba(255,255,255,0.25)"/>
    <text x="36" y="31" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#2b1b1b">Ag</text>
  </svg>`)

/** Full physics stage (px). Slightly wider so the cupboard and tank breathe more. */
const WD_STAGE_W = 780
const WD_STAGE_H = 268

/**
 * Glass tank interior (fluid region). Cupboard / shelf is entirely to the left of `innerL`.
 */
const TANK = {
  innerL: 304,
  innerR: 764,
  innerTop: 26,
  innerBottom: 234,
} as const

const innerW = TANK.innerR - TANK.innerL
const innerH = TANK.innerBottom - TANK.innerTop

/** Cupboard shelf plank (static); aligned with lowest row of ITEM_SPECS */
const SHELF = {
  y: 246,
  minX: 26,
  maxX: 230,
} as const

/** “Put back” zone (cupboard only; must not overlap tank water) */
const BENCH = { minX: 20, maxX: 230, minY: 38, maxY: 252 }

/** Vertical partition closing the physics gap between cupboard and tank (drag objects up and over). */
const PARTITION = {
  x: (SHELF.maxX + TANK.innerL) / 2,
  width: Math.max(14, TANK.innerL - SHELF.maxX - 2),
  topY: 22,
  bottomY: WD_STAGE_H - 10,
} as const

const BASE_WATER01 = 0.28
const MAX_WATER01 = 0.92
/** px² submerged → added fill (tuned for visible rise) */
const DISPLACEMENT_TO_FILL = 0.000055
const WATER_RISE_LERP = 0.05
const WATER_FALL_LERP = 0.035

const RHO_WATER = 0.0011
const BUOY_STRENGTH = 0.00012
/** Extra vertical spring so wood rides the surface as water level changes */
const WOOD_SURFACE_SPRING = 0.00008
const WOOD_MAX_WATER_VY = 11
/** In 2D, raw AABB submergence overstates a floating block's displaced water. */
const WOOD_DISPLACEMENT_SCALE = 0.42
const WOOD_DISPLACEMENT_LERP = 0.08
const BULK_RHO: Record<ItemId, number> = {
  /** Slightly lighter than water so it floats and tracks the surface */
  wood: 0.00032,
  crown: 0.0028,
  gold: 0.0032,
  rock: 0.0034,
  silver: 0.003,
}

const CROWN_TEX_W = 800
const CROWN_TEX_H = 800
const GOLD1_W = 839
const GOLD1_H = 839
/** Must match current `wood.png` or sprite/body mismatch hides or “loses” the wood */
const WOOD_TEX_W = 277
const WOOD_TEX_H = 478
const ROCK_TEX_W = 2000
const ROCK_TEX_H = 2000
const SILVER_BAR_TEX_W = 72
const SILVER_BAR_TEX_H = 48

interface ItemSpec {
  id: ItemId
  label: string
  w: number
  h: number
  benchX: number
  benchY: number
  density: number
  render: 'sprite' | 'fill'
  texture?: string
  fill?: string
  stroke?: string
}

/** 5 props: 2+2+1 on shelf — centers stay left of partition / tank. */
const ITEM_SPECS: ItemSpec[] = [
  {
    id: 'crown',
    label: 'Crown',
    w: 44,
    h: 34,
    benchX: 68,
    benchY: 168,
    density: BULK_RHO.crown,
    render: 'sprite',
    texture: assetUrl(crownSvg),
  },
  {
    id: 'gold',
    label: 'Gold',
    w: 58,
    h: 50,
    benchX: 168,
    benchY: 168,
    density: BULK_RHO.gold,
    render: 'sprite',
    texture: assetUrl(goldNugget1),
  },
  {
    id: 'rock',
    label: 'Rock',
    w: 44,
    h: 40,
    benchX: 68,
    benchY: 212,
    density: BULK_RHO.rock,
    render: 'sprite',
    texture: assetUrl(rockPng),
  },
  {
    id: 'silver',
    label: 'Silver bar',
    w: 30,
    h: 17,
    benchX: 168,
    benchY: 212,
    density: BULK_RHO.silver,
    render: 'sprite',
    texture: SILVER_BAR_TEXTURE,
  },
  {
    id: 'wood',
    label: 'Wood',
    /** Tall asset (~277×478); large on-shelf body, fits above shelf + in tank */
    w: 72,
    h: 118,
    benchX: 118,
    benchY: 178,
    density: BULK_RHO.wood,
    render: 'sprite',
    texture: assetUrl(woodPng),
  },
]

const WOOD_SPEC = ITEM_SPECS.find((spec) => spec.id === 'wood')!

function waterSurfaceY(water01: number): number {
  return TANK.innerBottom - innerH * water01
}

function submergedAreaInTank(
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

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const CLOSEUP_MS = 3400
const MODAL_REPLAY_MS = 1650

interface WaterDiscoverySceneProps {
  onNavigate: (scene: SceneId) => void
}

const WaterDiscoveryScene: FC<WaterDiscoverySceneProps> = ({ onNavigate: _onNavigate }) => {
  const { progress, patchProgress } = useLessonHub()
  const hostRef = useRef<HTMLDivElement>(null)
  const [matterReady, setMatterReady] = useState(false)
  const [simVersion, setSimVersion] = useState(0)
  const [waterPct, setWaterPct] = useState(BASE_WATER01 * 100)
  const [closeupOpen, setCloseupOpen] = useState(false)
  const [closeupReplay, setCloseupReplay] = useState(false)
  const [sparkleKey, setSparkleKey] = useState(0)
  const [modalWaterPct, setModalWaterPct] = useState(BASE_WATER01 * 100)
  const [modalDropT, setModalDropT] = useState(0)
  const [replayItemId, setReplayItemId] = useState<ItemId | null>(null)

  const firstDiscoveryHandled = useRef(false)

  useLayoutEffect(() => {
    if (progress.waterLab.discoverySeen) {
      firstDiscoveryHandled.current = true
    }
  }, [progress.waterLab.discoverySeen])
  const closeupTimerRef = useRef<number | undefined>(undefined)
  const modalSettleTimerRef = useRef<number | undefined>(undefined)
  const modalRafRef = useRef<number | undefined>(undefined)
  const triggerDiscoveryRef = useRef<(id: ItemId) => void>(() => {})
  const water01Ref = useRef(BASE_WATER01)
  const replayDataRef = useRef({
    from01: BASE_WATER01,
    to01: BASE_WATER01,
    itemId: 'crown' as ItemId,
  })

  const tankCss = useMemo(
    () =>
      ({
        '--wd-tank-left-pct': `${(TANK.innerL / WD_STAGE_W) * 100}%`,
        '--wd-tank-width-pct': `${((TANK.innerR - TANK.innerL) / WD_STAGE_W) * 100}%`,
        '--wd-cupboard-width-pct': `${(SHELF.maxX / WD_STAGE_W) * 100}%`,
        '--wd-gap-left-pct': `${(SHELF.maxX / WD_STAGE_W) * 100}%`,
        '--wd-gap-width-pct': `${((TANK.innerL - SHELF.maxX) / WD_STAGE_W) * 100}%`,
      }) as CSSProperties,
    [],
  )

  const resetSimulation = useCallback(() => {
    window.clearTimeout(closeupTimerRef.current)
    window.clearTimeout(modalSettleTimerRef.current)
    if (modalRafRef.current) cancelAnimationFrame(modalRafRef.current)

    firstDiscoveryHandled.current = false
    water01Ref.current = BASE_WATER01
    replayDataRef.current = {
      from01: BASE_WATER01,
      to01: BASE_WATER01,
      itemId: 'crown',
    }

    setSparkleKey(0)
    setReplayItemId(null)
    setCloseupOpen(false)
    setCloseupReplay(false)
    setModalWaterPct(BASE_WATER01 * 100)
    setModalDropT(0)
    setWaterPct(BASE_WATER01 * 100)
    setSimVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    ensureMatterLoaded()
      .then(() => {
        if (!cancelled) setMatterReady(true)
      })
      .catch(() => {
        if (!cancelled) setMatterReady(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const triggerFirstDiscovery = useCallback((itemId: ItemId) => {
    if (firstDiscoveryHandled.current) return
    firstDiscoveryHandled.current = true
    patchProgress({ waterLab: { discoverySeen: true } })

    setSparkleKey((k) => k + 1)
    setReplayItemId(itemId)

    window.clearTimeout(closeupTimerRef.current)
    window.clearTimeout(modalSettleTimerRef.current)

    const prefersReduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const settleMs = prefersReduce ? 80 : 420
    modalSettleTimerRef.current = window.setTimeout(() => {
      const to01 = Math.min(MAX_WATER01, water01Ref.current)
      replayDataRef.current = {
        from01: BASE_WATER01,
        to01,
        itemId,
      }
      setModalWaterPct(BASE_WATER01 * 100)
      setModalDropT(0)
      setCloseupOpen(true)
      setCloseupReplay(false)
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setCloseupReplay(true))
      })
    }, settleMs)

    const dismissAfter = prefersReduce ? 900 : settleMs + CLOSEUP_MS
    closeupTimerRef.current = window.setTimeout(() => {
      setCloseupOpen(false)
      setCloseupReplay(false)
      if (modalRafRef.current) cancelAnimationFrame(modalRafRef.current)
    }, dismissAfter)
  }, [patchProgress])

  triggerDiscoveryRef.current = triggerFirstDiscovery

  useEffect(
    () => () => {
      window.clearTimeout(closeupTimerRef.current)
      window.clearTimeout(modalSettleTimerRef.current)
    },
    [],
  )

  const runModalReplay = useCallback(() => {
    const { from01, to01, itemId } = replayDataRef.current
    setReplayItemId(itemId)
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setModalWaterPct(to01 * 100)
      setModalDropT(1)
      return
    }
    const t0 = performance.now()
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / MODAL_REPLAY_MS)
      const e = easeOutCubic(u)
      setModalWaterPct((from01 + (to01 - from01) * e) * 100)
      setModalDropT(e)
      if (u < 1) {
        modalRafRef.current = requestAnimationFrame(tick)
      }
    }
    modalRafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    if (!closeupReplay || !closeupOpen) return
    runModalReplay()
    return () => {
      if (modalRafRef.current) cancelAnimationFrame(modalRafRef.current)
    }
  }, [closeupReplay, closeupOpen, runModalReplay])

  useEffect(() => {
    if (!matterReady || !hostRef.current) return

    const Matter = (window as { Matter?: any }).Matter
    if (!Matter) return

    const {
      Engine,
      Render,
      Runner,
      Bodies,
      Body,
      Composite,
      Mouse,
      MouseConstraint,
      Events,
      Sleeping,
    } = Matter

    const engine = Engine.create({ enableSleeping: true })
    engine.gravity.y = 0.95

    const render = Render.create({
      element: hostRef.current,
      engine,
      options: {
        width: WD_STAGE_W,
        height: WD_STAGE_H,
        wireframes: false,
        background: 'transparent',
        pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2),
        /** Sleeping bodies default to 0.5 alpha in Matter.Render — disable for full-opacity props */
        showSleeping: false,
      },
    })
    const matterCanvas = render.canvas as HTMLCanvasElement
    matterCanvas.style.background = 'transparent'
    matterCanvas.style.display = 'block'
    matterCanvas.style.width = '100%'
    matterCanvas.style.height = 'auto'
    matterCanvas.style.aspectRatio = `${WD_STAGE_W} / ${WD_STAGE_H}`
    matterCanvas.style.touchAction = 'none'

    const wallStyle = {
      isStatic: true,
      render: { fillStyle: '#7a6a58', strokeStyle: '#3d3020', lineWidth: 1 },
    }
    const wallT = 9
    const midY = (TANK.innerTop + TANK.innerBottom) / 2
    const sideH = TANK.innerBottom - TANK.innerTop
    const leftWall = Bodies.rectangle(
      TANK.innerL - wallT / 2,
      midY,
      wallT,
      sideH + wallT,
      wallStyle,
    )
    const rightWall = Bodies.rectangle(
      TANK.innerR + wallT / 2,
      midY,
      wallT,
      sideH + wallT,
      wallStyle,
    )
    const floor = Bodies.rectangle(
      (TANK.innerL + TANK.innerR) / 2,
      TANK.innerBottom + wallT / 2,
      innerW + wallT * 2 + 20,
      wallT,
      wallStyle,
    )

    /** Cupboard shelf — objects rest here at start (separate from tank floor). */
    const shelf = Bodies.rectangle(
      (SHELF.minX + SHELF.maxX) / 2,
      SHELF.y,
      SHELF.maxX - SHELF.minX,
      18,
      {
        isStatic: true,
        render: { fillStyle: '#a07840', strokeStyle: '#5c4020', lineWidth: 1 },
      },
    )

    const partH = PARTITION.bottomY - PARTITION.topY
    const partMidY = (PARTITION.topY + PARTITION.bottomY) / 2
    /** Closes the slit between cupboard and tank so props cannot tunnel through */
    const cupboardTankPartition = Bodies.rectangle(
      PARTITION.x,
      partMidY,
      PARTITION.width,
      partH,
      {
        isStatic: true,
        friction: 0.42,
        render: {
          fillStyle: '#6a5244',
          strokeStyle: 'rgba(40, 28, 14, 0.55)',
          lineWidth: 1,
        },
      },
    )

    const ground = Bodies.rectangle(WD_STAGE_W / 2, WD_STAGE_H + 48, WD_STAGE_W * 2, 56, {
      isStatic: true,
      render: { visible: false },
    })

    const itemBodies: Record<ItemId, any> = {} as Record<ItemId, any>

    for (const spec of ITEM_SPECS) {
      const common = {
        frictionAir: 0.02,
        friction: 0.48,
        restitution: 0.05,
        density: spec.density,
        label: spec.id,
        chamfer: { radius: 4 },
      }

      let body: any
      if (spec.render === 'sprite' && spec.texture) {
        let xScale: number
        let yScale: number
        if (spec.id === 'crown') {
          xScale = spec.w / CROWN_TEX_W
          yScale = spec.h / CROWN_TEX_H
        } else if (spec.id === 'gold') {
          xScale = spec.w / GOLD1_W
          yScale = spec.h / GOLD1_H
        } else if (spec.id === 'silver') {
          xScale = spec.w / SILVER_BAR_TEX_W
          yScale = spec.h / SILVER_BAR_TEX_H
        } else if (spec.id === 'wood') {
          xScale = spec.w / WOOD_TEX_W
          yScale = spec.h / WOOD_TEX_H
        } else if (spec.id === 'rock') {
          xScale = spec.w / ROCK_TEX_W
          yScale = spec.h / ROCK_TEX_H
        } else {
          xScale = spec.w / GOLD1_W
          yScale = spec.h / GOLD1_H
        }
        body = Bodies.rectangle(spec.benchX, spec.benchY, spec.w, spec.h, {
          ...common,
          render: {
            opacity: 1,
            sprite: {
              texture: spec.texture,
              xScale,
              yScale,
            },
          },
        })
        if (spec.id === 'wood') {
          Body.setInertia(body, Infinity)
          body.frictionAir = 0.045
          body.friction = 0.12
          body.restitution = 0
        }
      } else {
        body = Bodies.rectangle(spec.benchX, spec.benchY, spec.w, spec.h, {
          ...common,
          render: {
            fillStyle: spec.fill,
            strokeStyle: spec.stroke,
            lineWidth: 2,
          },
        })
      }
      Body.setVelocity(body, { x: 0, y: 0 })
      if (Sleeping?.set) Sleeping.set(body, true)
      itemBodies[spec.id] = body
    }

    Composite.add(engine.world, [
      ground,
      shelf,
      cupboardTankPartition,
      leftWall,
      rightWall,
      floor,
      ...Object.values(itemBodies),
    ])

    const runner = Runner.create()
    Runner.run(runner, engine)
    Render.run(render)

    const mouse = Mouse.create(matterCanvas)
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.35, damping: 0.15, render: { visible: false } },
    })
    Composite.add(engine.world, mc)
    render.mouse = mouse

    const syncMouseScale = () => {
      const rect = matterCanvas.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) return
      const sx = matterCanvas.width / rect.width
      const sy = matterCanvas.height / rect.height
      if (typeof Mouse.setScale === 'function') {
        Mouse.setScale(mouse, { x: sx, y: sy })
      }
    }
    syncMouseScale()
    window.addEventListener('resize', syncMouseScale)

    const wakeDragged = () => {
      if (!Sleeping?.set) return
      Object.values(itemBodies).forEach((b) => Sleeping.set(b, false))
    }
    Events.on(mouse, 'mousedown', wakeDragged)
    Events.on(mouse, 'touchstart', wakeDragged)

    let water01 = BASE_WATER01
    water01Ref.current = water01
    let woodDispArea = 0
    let frame = 0

    const beforeUpdate = () => {
      const ws = waterSurfaceY(water01)
      const wb = TANK.innerBottom

      for (const spec of ITEM_SPECS) {
        const body = itemBodies[spec.id]
        if (!body?.bounds) continue
        const rawSubA = submergedAreaInTank(body.bounds, TANK.innerL, TANK.innerR, ws, wb)
        const woodEqArea = WOOD_SPEC.w * WOOD_SPEC.h * (BULK_RHO.wood / RHO_WATER)
        const subA =
          spec.id === 'wood'
            ? Math.min(rawSubA, woodEqArea * 1.08)
            : rawSubA
        if (subA <= 0) continue
        const rhoB = BULK_RHO[spec.id]
        const net = RHO_WATER - rhoB
        const fy = -BUOY_STRENGTH * subA * net * (spec.id === 'wood' ? 1.1 : 1)
        Body.applyForce(body, body.position, { x: 0, y: fy })
      }

      let displaced = 0
      for (const spec of ITEM_SPECS) {
        const body = itemBodies[spec.id]
        if (!body?.bounds) continue
        const rawSubA = submergedAreaInTank(
          body.bounds,
          TANK.innerL,
          TANK.innerR,
          ws,
          wb,
        )
        if (spec.id === 'wood') {
          const woodEqArea = WOOD_SPEC.w * WOOD_SPEC.h * (BULK_RHO.wood / RHO_WATER)
          const targetWoodDisp = Math.min(rawSubA, woodEqArea) * WOOD_DISPLACEMENT_SCALE
          woodDispArea += (targetWoodDisp - woodDispArea) * WOOD_DISPLACEMENT_LERP
          displaced += woodDispArea
        } else {
          displaced += rawSubA
        }
      }
      const target01 = Math.min(
        MAX_WATER01,
        BASE_WATER01 + displaced * DISPLACEMENT_TO_FILL,
      )
      const woodBody = itemBodies.wood
      const waterLerp = target01 > water01 ? WATER_RISE_LERP : WATER_FALL_LERP
      water01 += (target01 - water01) * waterLerp
      water01Ref.current = water01

      const wsLive = waterSurfaceY(water01)
      if (woodBody?.bounds) {
        const b = woodBody.bounds
        const woodSub = submergedAreaInTank(
          b,
          TANK.innerL,
          TANK.innerR,
          wsLive,
          wb,
        )
        const overlapsTankX = b.max.x > TANK.innerL + 2 && b.min.x < TANK.innerR - 2
        const overlapsWaterColumn = b.max.y > wsLive && b.min.y < wb
        if (woodSub > 0 && overlapsTankX && Sleeping?.set) {
          Sleeping.set(woodBody, false)
        }
        if (woodSub > 0 && overlapsTankX && overlapsWaterColumn) {
          const h = WOOD_SPEC.h
          const rhoRatio = Math.min(0.92, BULK_RHO.wood / RHO_WATER)
          /** Target center Y so the waterline crosses the block (~Archimedes) as ws moves */
          const desiredY = wsLive - h / 2 + h * rhoRatio
          const clampedVy = Math.max(-WOOD_MAX_WATER_VY, Math.min(WOOD_MAX_WATER_VY, woodBody.velocity.y))
          if (clampedVy !== woodBody.velocity.y) {
            Body.setVelocity(woodBody, {
              x: woodBody.velocity.x * 0.98,
              y: clampedVy,
            })
          }
          Body.applyForce(woodBody, woodBody.position, {
            x: 0,
            y: (desiredY - woodBody.position.y) * WOOD_SURFACE_SPRING,
          })
          Body.setAngularVelocity(woodBody, woodBody.angularVelocity * 0.7)
        }
      }

      for (const spec of ITEM_SPECS) {
        const body = itemBodies[spec.id]
        const { x, y } = body.position
        const inCupboard =
          x >= BENCH.minX &&
          x <= BENCH.maxX &&
          y >= BENCH.minY &&
          y <= BENCH.maxY &&
          x < TANK.innerL - 8
        if (inCupboard && Math.hypot(body.velocity.x, body.velocity.y) < 0.45) {
          Body.setVelocity(body, { x: 0, y: 0 })
          if (Sleeping?.set) Sleeping.set(body, true)
        }
      }
    }

    const afterUpdate = () => {
      if (!firstDiscoveryHandled.current) {
        const ws = waterSurfaceY(water01Ref.current)
        const wb = TANK.innerBottom
        for (const spec of ITEM_SPECS) {
          const body = itemBodies[spec.id]
          if (!body?.bounds) continue
          const subA = submergedAreaInTank(
            body.bounds,
            TANK.innerL,
            TANK.innerR,
            ws,
            wb,
          )
          if (subA > 350) {
            triggerDiscoveryRef.current(spec.id)
            break
          }
        }
      }

      frame++
      if (frame % 2 === 0) {
        setWaterPct(water01Ref.current * 100)
      }
    }

    Events.on(engine, 'beforeUpdate', beforeUpdate)
    Events.on(engine, 'afterUpdate', afterUpdate)

    return () => {
      window.removeEventListener('resize', syncMouseScale)
      Events.off(engine, 'beforeUpdate', beforeUpdate)
      Events.off(engine, 'afterUpdate', afterUpdate)
      Events.off(mouse, 'mousedown', wakeDragged)
      Events.off(mouse, 'touchstart', wakeDragged)
      Composite.remove(engine.world, mc)
      if (typeof Mouse.clear === 'function') Mouse.clear(mouse)
      Render.stop(render)
      Runner.stop(runner)
      matterCanvas.remove()
      Engine.clear(engine)
    }
  }, [matterReady, simVersion])

  const replaySpec = replayItemId
    ? ITEM_SPECS.find((s) => s.id === replayItemId)
    : null

  return (
    <div className="scene water-discovery-scene">
      <header className="scene-header hub-scene-header">
        <h2>Play around — find out</h2>
      </header>

      <section className="scene-body water-discovery-body">
        <div className="water-discovery-sandbox">
          <section className="weigh-info-card water-discovery-objective">
            <p className="weigh-panel-kicker">Objective</p>
            <h3>How could we prove the purity of the crown?</h3>
            <p className="scene-text water-discovery-objective-text">
              Mass alone is not enough. Drag objects from the <strong>cupboard shelf</strong> into the
              <strong> water tank</strong> on the right — watch the water line.
            </p>
          </section>

          <div
            className={`water-discovery-stage-shell ${sparkleKey > 0 ? 'water-discovery-stage-shell--sparkle' : ''}`}
          >
            <button
              className="water-discovery-reset-button"
              type="button"
              onClick={resetSimulation}
              aria-label="Reset the simulation"
              title="Reset the simulation"
            >
              ↺
            </button>
            <div className="water-discovery-stage-viewport" style={tankCss}>
              <div className="water-discovery-stage-bg" aria-hidden="true">
                <div className="water-discovery-cupboard-panel">
                  <span className="water-discovery-cupboard-label">Cupboard</span>
                  <div className="water-discovery-cupboard-shelf-groove" />
                </div>
                <div className="water-discovery-gap-strip" />
                <div className="water-discovery-tank-panel">
                  <div
                    className="water-discovery-water water-discovery-water--live"
                    style={{ height: `${waterPct}%` }}
                  >
                    <div className="water-discovery-water-surface" />
                    <div className="water-discovery-water-shine" />
                  </div>
                </div>
              </div>
              <div
                ref={hostRef}
                className="water-discovery-matter-host"
                aria-label="Drag objects from the cupboard into the tank"
              />
            </div>
            <p className="water-discovery-tank-caption" aria-live="polite">
              {!matterReady
                ? 'Loading physics…'
                : 'Cupboard (left) · Tank (right). Drag into the tank — the blue fill tracks displacement.'}
            </p>
          </div>

          <section className="weigh-info-card water-discovery-advice">
            <p className="weigh-panel-kicker">Tips</p>
            <p className="helper-text">
              <strong>Drag</strong> with the mouse (touch works on supported devices). Only{' '}
              <strong>wood</strong> floats on the surface; metals and rock sink. Lift objects over the
              cupboard divider to reach the tank. Return an object to the cupboard shelf to set it
              down. If anything ever gets stuck, refresh the page.
            </p>
            <ul className="water-discovery-legend">
              {ITEM_SPECS.map((s) => (
                <li key={s.id}>{s.label}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      {closeupOpen ? (
        <div
          className="water-discovery-closeup"
          role="dialog"
          aria-modal="true"
          aria-label="Displacement replay"
        >
          <div className="water-discovery-closeup-backdrop" />
          <div className="water-discovery-closeup-card">
            <p className="water-discovery-closeup-kicker">You found it</p>
            <h3 className="water-discovery-closeup-title">The water level follows displacement</h3>
            <p className="scene-text water-discovery-closeup-text">
              The surface rises because submerged objects take space — the same volume as the fluid
              they push aside. That idea is what Archimedes will use on the crown.
            </p>
            <div
              className={`water-discovery-closeup-stage ${closeupReplay ? 'water-discovery-closeup-stage--animate' : ''}`}
            >
              <div className="water-discovery-tank water-discovery-tank--closeup">
                <div className="water-discovery-tank-rim" aria-hidden />
                <div className="water-discovery-tank-inner water-discovery-tank-inner--modal">
                  <div
                    className="water-discovery-water water-discovery-water--modal"
                    style={{ height: `${modalWaterPct}%` } as CSSProperties}
                  />
                  {replaySpec && closeupReplay ? (
                    <div
                      className="water-discovery-modal-object"
                      style={
                        {
                          transform: `translateY(${(1 - modalDropT) * -78}px)`,
                        } as CSSProperties
                      }
                    >
                      <ModalObjectThumb spec={replaySpec} />
                    </div>
                  ) : null}
                  <div className="water-discovery-closeup-glow" aria-hidden />
                </div>
              </div>
            </div>
            <p className="helper-text water-discovery-closeup-hint">
              Replay matches the level change from your tank (rest → after the object enters the water).
            </p>
          </div>
        </div>
      ) : null}

    </div>
  )
}

function ModalObjectThumb({ spec }: { spec: ItemSpec }) {
  if (spec.render === 'fill') {
    return (
      <div
        className="water-discovery-modal-thumb water-discovery-modal-thumb--fill"
        style={{ background: spec.fill, borderColor: spec.stroke }}
      />
    )
  }
  if (spec.texture) {
    return (
      <img
        src={spec.texture}
        alt=""
        className={`water-discovery-modal-thumb ${spec.id === 'silver' ? 'water-discovery-modal-thumb--silver' : ''}`}
      />
    )
  }
  return null
}

export default WaterDiscoveryScene
