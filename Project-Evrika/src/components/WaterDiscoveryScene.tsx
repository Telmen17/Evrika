import type { CSSProperties, FC } from 'react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import crownSvg from '../assets/crown.svg'
import goldNugget1 from '../assets/goldNugget1png.png'
import rockPng from '../assets/rock.png'
import woodPng from '../assets/wood.png'
import { assetUrl } from '../lib/assetUrl'
import { ensureMatterLoaded } from '../lib/ensureMatter'
import type { SceneId } from '../types/sceneId'
import { useLessonHub } from '../context/LessonHubContext'
import {
  WaterLabArchimedesOverlay,
  type WaterLabArchPresentation,
  type WaterLabMentorMood,
} from './WaterLabArchimedesOverlay'

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
  /** Lower rim — less vertical lift needed to drag props over the tank. */
  innerTop: 58,
  innerBottom: 218,
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

/** Vertical lip at shelf height — blocks sliding under without lifting; top stays open for drag-in. */
const PARTITION = {
  x: (SHELF.maxX + TANK.innerL) / 2,
  width: Math.max(10, TANK.innerL - SHELF.maxX - 6),
  topY: 188,
  bottomY: WD_STAGE_H - 8,
} as const

/** Open band above left wall lip — drag props over, then drop in. */
const TANK_LEFT_WALL_TOP_Y = 102

/** Invisible Matter walls — thicker than visible wood frame to prevent tunneling. */
const TANK_WALL_THICKNESS = 14

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
  /** Short tooltip shown on hover / near the prop on the shelf. */
  hint: string
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

/** Props on the shelf — two neat rows + wood block on the left. */
const ITEM_SPECS: ItemSpec[] = [
  {
    id: 'wood',
    label: 'Wood block',
    hint: 'Floats — watch the waterline climb slowly',
    w: 58,
    h: 96,
    benchX: 48,
    benchY: 182,
    density: BULK_RHO.wood,
    render: 'sprite',
    texture: assetUrl(woodPng),
  },
  {
    id: 'crown',
    label: 'Crown',
    hint: 'Heavy gold crown — sinks fast',
    w: 42,
    h: 32,
    benchX: 112,
    benchY: 152,
    density: BULK_RHO.crown,
    render: 'sprite',
    texture: assetUrl(crownSvg),
  },
  {
    id: 'gold',
    label: 'Gold nugget',
    hint: 'Dense lump of gold',
    w: 52,
    h: 44,
    benchX: 182,
    benchY: 152,
    density: BULK_RHO.gold,
    render: 'sprite',
    texture: assetUrl(goldNugget1),
  },
  {
    id: 'rock',
    label: 'Rock',
    hint: 'Stone — sinks like the crown',
    w: 40,
    h: 36,
    benchX: 112,
    benchY: 208,
    density: BULK_RHO.rock,
    render: 'sprite',
    texture: assetUrl(rockPng),
  },
  {
    id: 'silver',
    label: 'Silver bar',
    hint: 'Silver ingot — compare its splash',
    w: 28,
    h: 16,
    benchX: 182,
    benchY: 208,
    density: BULK_RHO.silver,
    render: 'sprite',
    texture: SILVER_BAR_TEXTURE,
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

/** Keep props inside the tank once past the entry lip — backs up invisible walls. */
function enforceTankContainment(
  body: { bounds: { min: { x: number; y: number }; max: { x: number; y: number } }; position: { x: number; y: number }; velocity: { x: number; y: number } },
  Body: { setPosition: (b: unknown, pos: { x: number; y: number }) => void; setVelocity: (b: unknown, vel: { x: number; y: number }) => void },
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

const CLOSEUP_MS = 3400
const MODAL_REPLAY_MS = 1650
const MENTOR_INTRO_DELAY_MS = 2800
const MENTOR_CURIOUS_HOLD_MS = 2200

const MENTOR_STUCK_LINE =
  'I have weighed the crown and braved the furnace. Mass alone cannot expose a fraud. What clue am I blind to?'
const MENTOR_CURIOUS_LINE =
  'Wait—the water moved when you dropped that in. Volume may be speaking to us. Try another object; watch the line.'

interface WaterDiscoverySceneProps {
  onNavigate: (scene: SceneId) => void
  /** Fires when the first-discovery closeup closes (after the water-rise moment). */
  onDiscoveryCloseupDismissed?: () => void
}

const WaterDiscoveryScene: FC<WaterDiscoverySceneProps> = ({
  onNavigate: _onNavigate,
  onDiscoveryCloseupDismissed,
}) => {
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
  const [mentorMood, setMentorMood] = useState<WaterLabMentorMood>('idle')
  const [mentorLine, setMentorLine] = useState<string | null>(null)
  const [mentorSpeaking, setMentorSpeaking] = useState(false)
  const [archPresentation, setArchPresentation] = useState<WaterLabArchPresentation>('icon')
  const emoteCollapseTimerRef = useRef<number | undefined>(undefined)
  const [hoveredProp, setHoveredProp] = useState<ItemId | null>(null)
  const [propPositions, setPropPositions] = useState<Record<ItemId, { x: number; y: number }>>(
    () =>
      Object.fromEntries(
        ITEM_SPECS.map((s) => [s.id, { x: s.benchX, y: s.benchY }]),
      ) as Record<ItemId, { x: number; y: number }>,
  )
  const setHoveredPropRef = useRef(setHoveredProp)
  const setPropPositionsRef = useRef(setPropPositions)
  setHoveredPropRef.current = setHoveredProp
  setPropPositionsRef.current = setPropPositions

  const collapseArchEmote = useCallback(() => {
    window.clearTimeout(emoteCollapseTimerRef.current)
    setArchPresentation('icon')
    setMentorSpeaking(false)
  }, [])

  const presentArchEmote = useCallback(
    (mood: WaterLabMentorMood, line: string, holdMs: number) => {
      window.clearTimeout(emoteCollapseTimerRef.current)
      setMentorMood(mood)
      setMentorLine(line)
      setMentorSpeaking(true)
      setArchPresentation('emote')
      emoteCollapseTimerRef.current = window.setTimeout(() => {
        collapseArchEmote()
      }, holdMs)
    },
    [collapseArchEmote],
  )

  const firstDiscoveryHandled = useRef(false)
  const discoveryPendingRef = useRef(false)

  useLayoutEffect(() => {
    if (progress.waterLab.discoverySeen) {
      firstDiscoveryHandled.current = true
      setMentorMood('idle')
      setMentorLine(null)
      setMentorSpeaking(false)
      setArchPresentation('icon')
    }
  }, [progress.waterLab.discoverySeen])
  const closeupTimerRef = useRef<number | undefined>(undefined)
  const modalSettleTimerRef = useRef<number | undefined>(undefined)
  const modalRafRef = useRef<number | undefined>(undefined)
  const onCloseupDismissedRef = useRef(onDiscoveryCloseupDismissed)
  onCloseupDismissedRef.current = onDiscoveryCloseupDismissed
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
        '--wd-tank-inset-top': `${(TANK.innerTop / WD_STAGE_H) * 100}%`,
        '--wd-tank-inset-bottom': `${((WD_STAGE_H - TANK.innerBottom) / WD_STAGE_H) * 100}%`,
      }) as CSSProperties,
    [],
  )

  const resetSimulation = useCallback(() => {
    window.clearTimeout(closeupTimerRef.current)
    window.clearTimeout(modalSettleTimerRef.current)
    if (modalRafRef.current) cancelAnimationFrame(modalRafRef.current)

    firstDiscoveryHandled.current = false
    discoveryPendingRef.current = false
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
    setMentorMood('idle')
    setMentorLine(null)
    setMentorSpeaking(false)
    setArchPresentation('icon')
    window.clearTimeout(emoteCollapseTimerRef.current)
    setHoveredProp(null)
    setPropPositions(
      Object.fromEntries(
        ITEM_SPECS.map((s) => [s.id, { x: s.benchX, y: s.benchY }]),
      ) as Record<ItemId, { x: number; y: number }>,
    )
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

  useEffect(
    () => () => {
      window.clearTimeout(emoteCollapseTimerRef.current)
    },
    [],
  )

  /** First visit: frustration emote after the learner sees the room. */
  useEffect(() => {
    if (progress.waterLab.discoverySeen || progress.waterLab.introBeatSeen) return
    const id = window.setTimeout(() => {
      presentArchEmote('stuck', MENTOR_STUCK_LINE, 9000)
      patchProgress({ waterLab: { introBeatSeen: true } })
    }, MENTOR_INTRO_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [
    patchProgress,
    presentArchEmote,
    progress.waterLab.discoverySeen,
    progress.waterLab.introBeatSeen,
  ])

  const triggerFirstDiscovery = useCallback((itemId: ItemId) => {
    if (firstDiscoveryHandled.current) return
    firstDiscoveryHandled.current = true
    patchProgress({ waterLab: { discoverySeen: true } })

    setMentorMood('eureka')
    setMentorLine('The waterline rose—that volume is the answer hiding in plain sight.')
    setMentorSpeaking(true)
    setArchPresentation('emote')
    window.clearTimeout(emoteCollapseTimerRef.current)

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
      onCloseupDismissedRef.current?.()
    }, dismissAfter)
  }, [patchProgress])

  triggerDiscoveryRef.current = triggerFirstDiscovery

  const beginDiscoverySequence = useCallback(
    (itemId: ItemId) => {
      if (firstDiscoveryHandled.current || discoveryPendingRef.current) return
      discoveryPendingRef.current = true
      window.clearTimeout(emoteCollapseTimerRef.current)
      setMentorMood('curious')
      setMentorLine(MENTOR_CURIOUS_LINE)
      setMentorSpeaking(true)
      setArchPresentation('emote')
      window.setTimeout(() => {
        triggerDiscoveryRef.current(itemId)
      }, MENTOR_CURIOUS_HOLD_MS)
    },
    [],
  )

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
      Query,
    } = Matter

    const engine = Engine.create({ enableSleeping: true })
    engine.gravity.y = 0.95
    engine.positionIterations = 10
    engine.velocityIterations = 8
    engine.constraintIterations = 4

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
    matterCanvas.style.height = '100%'
    matterCanvas.style.touchAction = 'none'

    const staticBody = {
      isStatic: true,
      friction: 0.85,
      restitution: 0.02,
      slop: 0.001,
      render: { visible: false },
    }
    const wallT = TANK_WALL_THICKNESS
    const leftWallBottomY = TANK.innerBottom + wallT / 2
    const leftWallHeight = leftWallBottomY - TANK_LEFT_WALL_TOP_Y
    const leftWallMidY = TANK_LEFT_WALL_TOP_Y + leftWallHeight / 2
    const sideMidY = (TANK.innerTop + TANK.innerBottom) / 2
    const sideH = TANK.innerBottom - TANK.innerTop + wallT
    const leftWall = Bodies.rectangle(
      TANK.innerL - wallT / 2,
      leftWallMidY,
      wallT,
      leftWallHeight,
      staticBody,
    )
    const rightWall = Bodies.rectangle(
      TANK.innerR + wallT / 2,
      sideMidY,
      wallT,
      sideH,
      staticBody,
    )
    const floor = Bodies.rectangle(
      (TANK.innerL + TANK.innerR) / 2,
      TANK.innerBottom + wallT / 2,
      innerW + wallT,
      wallT,
      staticBody,
    )

    /** Cupboard shelf — objects rest here at start (separate from tank floor). */
    const shelf = Bodies.rectangle(
      (SHELF.minX + SHELF.maxX) / 2,
      SHELF.y,
      SHELF.maxX - SHELF.minX,
      18,
      staticBody,
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
        ...staticBody,
        friction: 0.42,
      },
    )

    const itemBodyList: any[] = []

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
      itemBodyList.push(body)
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
      constraint: { stiffness: 0.42, damping: 0.12, render: { visible: false } },
    })
    Composite.add(engine.world, mc)
    render.mouse = mouse

    /** Map browser pointer (CSS hotspot) → physics stage coords; bypass Matter's pixelRatio scaling. */
    const pointerToStage = (clientX: number, clientY: number) => {
      const rect = matterCanvas.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) {
        return { x: mouse.position.x, y: mouse.position.y }
      }
      return {
        x: ((clientX - rect.left) / rect.width) * WD_STAGE_W,
        y: ((clientY - rect.top) / rect.height) * WD_STAGE_H,
      }
    }

    const applyPointer = (clientX: number, clientY: number) => {
      const p = pointerToStage(clientX, clientY)
      mouse.position.x = p.x
      mouse.position.y = p.y
      return p
    }

    Mouse.setScale(mouse, { x: 1, y: 1 })
    Mouse.setOffset(mouse, { x: 0, y: 0 })

    const hoveredRef = { current: null as ItemId | null }

    const syncHover = () => {
      const hits = Query.point(itemBodyList, mouse.position)
      const hit = hits.find((b: { label?: string }) =>
        ITEM_SPECS.some((s) => s.id === b.label),
      )
      const next = (hit?.label as ItemId | undefined) ?? null
      if (hoveredRef.current !== next) {
        hoveredRef.current = next
        setHoveredPropRef.current(next)
      }
    }

    const clearHover = () => {
      hoveredRef.current = null
      setHoveredPropRef.current(null)
    }

    const onCanvasMouseMove = (e: MouseEvent) => {
      applyPointer(e.clientX, e.clientY)
      syncHover()
    }

    const onCanvasMouseDown = (e: MouseEvent) => {
      const p = applyPointer(e.clientX, e.clientY)
      mouse.button = e.button
      mouse.mousedownPosition.x = p.x
      mouse.mousedownPosition.y = p.y
      if (!Sleeping?.set) return
      Object.values(itemBodies).forEach((b) => Sleeping.set(b, false))
      if (!firstDiscoveryHandled.current && !discoveryPendingRef.current) {
        collapseArchEmote()
        setMentorMood('watching')
      }
    }

    const onCanvasMouseUp = (e: MouseEvent) => {
      applyPointer(e.clientX, e.clientY)
      mouse.button = -1
      mouse.mouseupPosition.x = mouse.position.x
      mouse.mouseupPosition.y = mouse.position.y
      clearHover()
    }

    const onCanvasTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return
      e.preventDefault()
      applyPointer(e.touches[0].clientX, e.touches[0].clientY)
      syncHover()
    }

    const onCanvasTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) return
      e.preventDefault()
      const p = applyPointer(e.touches[0].clientX, e.touches[0].clientY)
      mouse.button = 0
      mouse.mousedownPosition.x = p.x
      mouse.mousedownPosition.y = p.y
      if (!Sleeping?.set) return
      Object.values(itemBodies).forEach((b) => Sleeping.set(b, false))
      if (!firstDiscoveryHandled.current && !discoveryPendingRef.current) {
        collapseArchEmote()
        setMentorMood('watching')
      }
    }

    const onCanvasTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      mouse.button = -1
      clearHover()
    }

    matterCanvas.addEventListener('mousemove', onCanvasMouseMove)
    matterCanvas.addEventListener('mousedown', onCanvasMouseDown)
    matterCanvas.addEventListener('mouseup', onCanvasMouseUp)
    matterCanvas.addEventListener('touchmove', onCanvasTouchMove, { passive: false })
    matterCanvas.addEventListener('touchstart', onCanvasTouchStart, { passive: false })
    matterCanvas.addEventListener('touchend', onCanvasTouchEnd, { passive: false })

    let water01 = BASE_WATER01
    water01Ref.current = water01
    let woodDispArea = 0
    let frame = 0

    const beforeUpdate = () => {
      const hovered = hoveredRef.current
      if (hovered && itemBodies[hovered]) {
        const hb = itemBodies[hovered]
        if (Math.hypot(hb.velocity.x, hb.velocity.y) < 0.55) {
          Body.setAngle(hb, hb.angle + Math.sin(frame * 0.18) * 0.048)
        }
      }

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
      for (const spec of ITEM_SPECS) {
        const body = itemBodies[spec.id]
        if (body?.bounds) enforceTankContainment(body, Body)
      }

      if (!firstDiscoveryHandled.current && !discoveryPendingRef.current) {
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
            beginDiscoverySequence(spec.id)
            break
          }
        }
      }

      frame++
      if (frame % 3 === 0) {
        const next: Record<ItemId, { x: number; y: number }> = {} as Record<
          ItemId,
          { x: number; y: number }
        >
        for (const spec of ITEM_SPECS) {
          const body = itemBodies[spec.id]
          if (body?.position) {
            next[spec.id] = { x: body.position.x, y: body.position.y }
          }
        }
        setPropPositionsRef.current(next)
      }
      if (frame % 2 === 0) {
        setWaterPct(water01Ref.current * 100)
      }
    }

    Events.on(engine, 'beforeUpdate', beforeUpdate)
    Events.on(engine, 'afterUpdate', afterUpdate)

    return () => {
      matterCanvas.removeEventListener('mousemove', onCanvasMouseMove)
      matterCanvas.removeEventListener('mousedown', onCanvasMouseDown)
      matterCanvas.removeEventListener('mouseup', onCanvasMouseUp)
      matterCanvas.removeEventListener('touchmove', onCanvasTouchMove)
      matterCanvas.removeEventListener('touchstart', onCanvasTouchStart)
      matterCanvas.removeEventListener('touchend', onCanvasTouchEnd)
      Events.off(engine, 'beforeUpdate', beforeUpdate)
      Events.off(engine, 'afterUpdate', afterUpdate)
      Composite.remove(engine.world, mc)
      if (typeof Mouse.clear === 'function') Mouse.clear(mouse)
      Render.stop(render)
      Runner.stop(runner)
      matterCanvas.remove()
      Engine.clear(engine)
    }
  }, [matterReady, simVersion, beginDiscoverySequence, collapseArchEmote])

  const replaySpec = replayItemId
    ? ITEM_SPECS.find((s) => s.id === replayItemId)
    : null

  return (
    <div className="scene water-discovery-scene">
      <header className="scene-header hub-scene-header water-discovery-header">
        <div className="water-discovery-header-copy">
          <p className="water-discovery-kicker">Water Lab</p>
          <h2>Experiment with displacement</h2>
        </div>
      </header>

      <section className="scene-body water-discovery-body">
        <div className="water-discovery-workshop">
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
                <div className="water-discovery-workshop-floor" />
                <div className="water-discovery-cupboard-panel">
                  <div className="water-discovery-cupboard-shelf-groove" />
                </div>
                <div className="water-discovery-gap-strip" aria-hidden="true" />
                <div className="water-discovery-tank-panel">
                  <div className="water-discovery-tank-box">
                    <div className="water-discovery-tank-cavity">
                      <div
                        className="water-discovery-water water-discovery-water--live"
                        style={{ height: `${waterPct}%` }}
                      >
                        <div className="water-discovery-water-surface" />
                        <div className="water-discovery-water-shine" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="water-discovery-prop-labels" aria-hidden="true">
                {ITEM_SPECS.map((spec) => {
                  const pos = propPositions[spec.id] ?? { x: spec.benchX, y: spec.benchY }
                  const isHovered = hoveredProp === spec.id
                  const onShelf = pos.x < TANK.innerL - 14
                  if (!onShelf && !isHovered) return null
                  return (
                    <div
                      key={spec.id}
                      className={`water-discovery-prop-label water-discovery-prop-label--${spec.id}${
                        isHovered ? ' water-discovery-prop-label--hover' : ''
                      }`}
                      style={{
                        left: `${(pos.x / WD_STAGE_W) * 100}%`,
                        top: `${(pos.y / WD_STAGE_H) * 100}%`,
                      }}
                    >
                      <span className="water-discovery-prop-label__name">{spec.label}</span>
                      {isHovered ? (
                        <span className="water-discovery-prop-label__hint">{spec.hint}</span>
                      ) : onShelf ? (
                        <span className="water-discovery-prop-label__pickup">Drag me</span>
                      ) : null}
                    </div>
                  )
                })}
              </div>
              <div
                ref={hostRef}
                className="water-discovery-matter-host"
                aria-label="Drag objects from the cupboard into the tank"
              />
            </div>
            <p className="water-discovery-tank-caption" aria-live="polite">
              {!matterReady ? 'Loading physics…' : `Water level · ${Math.round(waterPct)}%`}
            </p>
          </div>
        </div>
      </section>

      {createPortal(
        <WaterLabArchimedesOverlay
          mood={mentorMood}
          line={mentorLine}
          presentation={archPresentation}
          speaking={mentorSpeaking}
          onDismiss={collapseArchEmote}
        />,
        document.body,
      )}

      {closeupOpen ? (
        <div
          className="water-discovery-closeup"
          role="dialog"
          aria-modal="true"
          aria-label="Displacement discovery"
        >
          <div className="water-discovery-closeup-backdrop" />
          <div className="water-discovery-closeup-card">
            <p className="water-discovery-closeup-kicker">Discovery</p>
            <h3 className="water-discovery-closeup-title">Volume displaces water</h3>
            <p className="scene-text water-discovery-closeup-text">
              Whatever goes under the surface pushes water aside. That hidden volume is the clue
              Archimedes needs for the crown.
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
