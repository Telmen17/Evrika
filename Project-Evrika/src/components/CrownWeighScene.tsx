import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SceneId } from './LandingPage'
import crownSvg from '../assets/crown.svg'
import matterScriptUrl from '../../matter.min.js?url'
import { useAudioPlayer } from '../hooks/useAudioPlayer'

type PanSide = 'left' | 'right'
export type ScaleItemId =
  | 'crown'
  | 'goldBar'
  | 'silverBar'
  | 'mass100'
  | 'mass200'
  | 'mass300'

interface MatterWindow extends Window {
  Matter?: any
}

interface StageGeometry {
  width: number
  height: number
  pivotX: number
  pivotY: number
  beamWidth: number
  panWidth: number
  panWallHeight: number
  ropeLength: number
}

interface ItemDefinition {
  label: string
  massGrams: number
  physicsMass: number
  iconSrc: string
  bodyShape: 'circle' | 'rectangle'
  width?: number
  height?: number
  radius?: number
  singleInstance?: boolean
}

interface PlacedItem {
  instanceId: string
  type: ScaleItemId
  pan: PanSide
}

interface PhysicsSnapshot {
  beamAngle: number
  leftPan: { x: number; y: number; angle: number }
  rightPan: { x: number; y: number; angle: number }
  leftRopes: Array<{ x1: number; y1: number; x2: number; y2: number }>
  rightRopes: Array<{ x1: number; y1: number; x2: number; y2: number }>
}

interface PhysicsRuntime {
  Matter: any
  engine: any
  runner: any
  beam: any
  leftPan: any
  rightPan: any
  world: any
  items: Map<string, { type: ScaleItemId; pan: PanSide }>
  geometry: StageGeometry
  applyPanMasses: () => void
  syncView: () => void
}

const STAGE_GEOMETRY: StageGeometry = {
  width: 440,
  height: 390,
  pivotX: 220,
  pivotY: 106,
  beamWidth: 248,
  panWidth: 122,
  panWallHeight: 38,
  ropeLength: 112,
}

const DRAG_TYPE = 'application/x-evrika-scale-item'
const BASE_PAN_PHYSICS_MASS = 5
const BALANCE_RESTORE_STIFFNESS = 0
const BALANCE_RESTORE_DAMPING = 0.06
const BALANCE_LOAD_TORQUE_SCALE = 0.0092
const BEAM_CENTER_OFFSET_Y = 10
const BEAM_FRICTION_AIR = 0.008
const PAN_FRICTION_AIR = 0.02
const PIVOT_STIFFNESS = 0.68
const ROPE_STIFFNESS = 0.56
const BASE_WIDTH_PX = 176
const BASE_HEIGHT_PX = 20
const BASE_BOTTOM_PX = 10
const POST_WIDTH_PX = 18
const POST_TOP_PX = STAGE_GEOMETRY.pivotY - 4
const POST_HEIGHT_PX =
  STAGE_GEOMETRY.height - BASE_BOTTOM_PX - BASE_HEIGHT_PX - POST_TOP_PX

function toSvgDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function makeBarIcon(fill: string, accent: string, text: string) {
  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 48">
      <rect x="10" y="10" width="52" height="28" rx="8" fill="${fill}" stroke="${accent}" stroke-width="3"/>
      <rect x="15" y="14" width="42" height="8" rx="4" fill="rgba(255,255,255,0.25)"/>
      <text x="36" y="31" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#2b1b1b">${text}</text>
    </svg>
  `)
}

function makeWeightIcon(fill: string, text: string) {
  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <path d="M23 18c0-5 4-9 9-9s9 4 9 9h-6c0-2-1-3-3-3s-3 1-3 3z" fill="${fill}" stroke="#5a4020" stroke-width="3"/>
      <path d="M18 22h28l8 30c1 4-2 8-7 8H17c-5 0-8-4-7-8z" fill="${fill}" stroke="#5a4020" stroke-width="3"/>
      <text x="32" y="46" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#2b1b1b">${text}</text>
    </svg>
  `)
}

const MASS_KG: Record<ScaleItemId, number> = {
  crown: 1.0,
  goldBar: 0.5,
  silverBar: 0.3,
  mass100: 0.1,
  mass200: 0.2,
  mass300: 0.3,
}

const ITEM_LABELS: Record<ScaleItemId, string> = {
  crown: 'Crown',
  goldBar: 'Gold bar',
  silverBar: 'Silver bar',
  mass100: '100 g',
  mass200: '200 g',
  mass300: '300 g',
}

const ITEM_DEFS: Record<ScaleItemId, ItemDefinition> = {
  crown: {
    label: 'Crown 1 kg',
    massGrams: 1000,
    physicsMass: 10,
    iconSrc: crownSvg,
    bodyShape: 'circle',
    radius: 18,
    singleInstance: true,
  },
  goldBar: {
    label: 'Gold bar 500 g',
    massGrams: 500,
    physicsMass: 5,
    iconSrc: makeBarIcon('#f0b52d', '#8b6914', 'Au'),
    bodyShape: 'rectangle',
    width: 42,
    height: 22,
  },
  silverBar: {
    label: 'Silver bar 300 g',
    massGrams: 300,
    physicsMass: 3,
    iconSrc: makeBarIcon('#d9dde7', '#7e8ba5', 'Ag'),
    bodyShape: 'rectangle',
    width: 40,
    height: 20,
  },
  mass100: {
    label: 'Dead mass 100 g',
    massGrams: 100,
    physicsMass: 1,
    iconSrc: makeWeightIcon('#c49c45', '100'),
    bodyShape: 'circle',
    radius: 12,
  },
  mass200: {
    label: 'Dead mass 200 g',
    massGrams: 200,
    physicsMass: 2,
    iconSrc: makeWeightIcon('#b8842d', '200'),
    bodyShape: 'circle',
    radius: 14,
  },
  mass300: {
    label: 'Dead mass 300 g',
    massGrams: 300,
    physicsMass: 3,
    iconSrc: makeWeightIcon('#8e6b3a', '300'),
    bodyShape: 'circle',
    radius: 15,
  },
}

interface CrownWeighSceneProps {
  onNavigate: (scene: SceneId) => void
}

type NarrationClipId = 'lesson' | 'limit' | 'next'

const WEIGHING_CONCLUSION_INTERACTION_THRESHOLD = 4

const NARRATION_CLIPS: Array<{
  id: NarrationClipId
  label: string
  description: string
  src: string
}> = [
  {
    id: 'lesson',
    label: 'What you learned',
    description: 'A short recap of what the scale reveals.',
    src: '/audio/scale_conclusion.mp3',
  },
  {
    id: 'limit',
    label: 'Why weighing is not enough',
    description: 'Why equal weight still leaves the mystery unsolved.',
    src: '/audio/scale_conclusion-2.mp3',
  },
  {
    id: 'next',
    label: 'Next lesson',
    description: "A guide toward Archimedes' next idea.",
    src: '/audio/scale_conclusion-3.mp3',
  },
]

function rotatePoint(
  centerX: number,
  centerY: number,
  offsetX: number,
  offsetY: number,
  angle: number,
) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: centerX + offsetX * cos - offsetY * sin,
    y: centerY + offsetX * sin + offsetY * cos,
  }
}

function lineStyle(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)
  return {
    left: x1,
    top: y1,
    width: `${length}px`,
    transform: `translateY(-50%) rotate(${angle}rad)`,
  }
}

function createPanBody(Matter: any, x: number, y: number, group: number) {
  const { Bodies, Body } = Matter
  const base = Bodies.rectangle(x, y + 8, 122, 14, {
    collisionFilter: { group },
  })
  const leftWall = Bodies.rectangle(x - 52, y - 6, 14, 44, {
    collisionFilter: { group },
  })
  const rightWall = Bodies.rectangle(x + 52, y - 6, 14, 44, {
    collisionFilter: { group },
  })

  const pan = Body.create({
    parts: [base, leftWall, rightWall],
    frictionAir: PAN_FRICTION_AIR,
    restitution: 0.05,
    collisionFilter: { group },
    label: 'scale-pan',
  })

  Body.setMass(pan, BASE_PAN_PHYSICS_MASS)
  return pan
}

function sumPanPhysicsMass(
  items: Map<string, { type: ScaleItemId; pan: PanSide }>,
  pan: PanSide,
) {
  let total = BASE_PAN_PHYSICS_MASS
  items.forEach((item) => {
    if (item.pan === pan) total += ITEM_DEFS[item.type].physicsMass
  })
  return total
}

async function ensureMatterLoaded() {
  const win = window as MatterWindow
  if (win.Matter) return win.Matter

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-evrika-matter="true"]',
    ) as HTMLScriptElement | null

    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Matter.js')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.src = matterScriptUrl
    script.async = true
    script.dataset.evrikaMatter = 'true'
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener(
      'error',
      () => reject(new Error('Failed to load Matter.js')),
      { once: true },
    )
    document.head.appendChild(script)
  })

  return (window as MatterWindow).Matter
}

const CrownWeighScene: FC<CrownWeighSceneProps> = ({ onNavigate }) => {
  const runtimeRef = useRef<PhysicsRuntime | null>(null)
  const nextItemIdRef = useRef(0)
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [dragOverPan, setDragOverPan] = useState<PanSide | null>(null)
  const [matterReady, setMatterReady] = useState(false)
  const [interactionCount, setInteractionCount] = useState(0)
  const [activeNarrationId, setActiveNarrationId] =
    useState<NarrationClipId | null>(null)
  const [physicsSnapshot, setPhysicsSnapshot] = useState<PhysicsSnapshot>({
    beamAngle: 0,
    leftPan: {
      x: STAGE_GEOMETRY.pivotX - STAGE_GEOMETRY.beamWidth / 2,
      y: STAGE_GEOMETRY.pivotY + STAGE_GEOMETRY.ropeLength,
      angle: 0,
    },
    rightPan: {
      x: STAGE_GEOMETRY.pivotX + STAGE_GEOMETRY.beamWidth / 2,
      y: STAGE_GEOMETRY.pivotY + STAGE_GEOMETRY.ropeLength,
      angle: 0,
    },
    leftRopes: [],
    rightRopes: [],
  })

  const crownInPool = !placedItems.some((item) => item.type === 'crown')
  const leftMass = useMemo(
    () =>
      placedItems
        .filter((item) => item.pan === 'left')
        .reduce((sum, item) => sum + MASS_KG[item.type], 0),
    [placedItems],
  )
  const rightMass = useMemo(
    () =>
      placedItems
        .filter((item) => item.pan === 'right')
        .reduce((sum, item) => sum + MASS_KG[item.type], 0),
    [placedItems],
  )
  const canContinue = placedItems.length > 0
  const hasComparedBothSides =
    placedItems.some((item) => item.pan === 'left') &&
    placedItems.some((item) => item.pan === 'right')
  const showConclusionCard =
    interactionCount >= WEIGHING_CONCLUSION_INTERACTION_THRESHOLD ||
    (hasComparedBothSides && placedItems.length >= 2)
  const activeNarrationSrc = useMemo(
    () =>
      NARRATION_CLIPS.find((clip) => clip.id === activeNarrationId)?.src ?? null,
    [activeNarrationId],
  )
  const activeNarrationIndex = activeNarrationId
    ? NARRATION_CLIPS.findIndex((clip) => clip.id === activeNarrationId)
    : -1
  const narrationAudio = useAudioPlayer(activeNarrationSrc)

  useEffect(() => {
    if (!activeNarrationSrc) return
    narrationAudio.play()
  }, [activeNarrationSrc, narrationAudio.play])

  useEffect(() => {
    let cancelled = false

    ensureMatterLoaded()
      .then(() => {
        if (!cancelled) setMatterReady(true)
      })
      .catch((error) => {
        console.error('Unable to load Matter.js', error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!matterReady) return

    const Matter = (window as MatterWindow).Matter
    if (!Matter) return

    const { Engine, Runner, Bodies, Body, Composite, Constraint, Events } =
      Matter

    const engine = Engine.create({
      gravity: { x: 0, y: 1.35 },
    })
    const world = engine.world
    const scaleGroup = Body.nextGroup(true)

    const post = Bodies.rectangle(
      STAGE_GEOMETRY.pivotX,
      STAGE_GEOMETRY.pivotY + 118,
      18,
      188,
      {
        isStatic: true,
        collisionFilter: { group: scaleGroup },
        render: { visible: false },
      },
    )
    const base = Bodies.rectangle(
      STAGE_GEOMETRY.pivotX,
      STAGE_GEOMETRY.height - 24,
      180,
      22,
      {
        isStatic: true,
        collisionFilter: { group: scaleGroup },
        render: { visible: false },
      },
    )
    const floor = Bodies.rectangle(
      STAGE_GEOMETRY.pivotX,
      STAGE_GEOMETRY.height + 30,
      STAGE_GEOMETRY.width + 80,
      60,
      {
        isStatic: true,
        render: { visible: false },
      },
    )
    const wallLeft = Bodies.rectangle(-24, STAGE_GEOMETRY.height / 2, 48, STAGE_GEOMETRY.height * 2, {
      isStatic: true,
      render: { visible: false },
    })
    const wallRight = Bodies.rectangle(
      STAGE_GEOMETRY.width + 24,
      STAGE_GEOMETRY.height / 2,
      48,
      STAGE_GEOMETRY.height * 2,
      {
        isStatic: true,
        render: { visible: false },
      },
    )

    const beam = Bodies.rectangle(
      STAGE_GEOMETRY.pivotX,
      STAGE_GEOMETRY.pivotY + BEAM_CENTER_OFFSET_Y,
      STAGE_GEOMETRY.beamWidth,
      14,
      {
        frictionAir: BEAM_FRICTION_AIR,
        collisionFilter: { group: scaleGroup },
        render: { visible: false },
      },
    )
    Body.setMass(beam, 3.9)

    const leftPan = createPanBody(
      Matter,
      STAGE_GEOMETRY.pivotX - STAGE_GEOMETRY.beamWidth / 2 + 8,
      STAGE_GEOMETRY.pivotY + BEAM_CENTER_OFFSET_Y + STAGE_GEOMETRY.ropeLength,
      scaleGroup,
    )
    const rightPan = createPanBody(
      Matter,
      STAGE_GEOMETRY.pivotX + STAGE_GEOMETRY.beamWidth / 2 - 8,
      STAGE_GEOMETRY.pivotY + BEAM_CENTER_OFFSET_Y + STAGE_GEOMETRY.ropeLength,
      scaleGroup,
    )

    const pivotConstraint = Constraint.create({
      pointA: { x: STAGE_GEOMETRY.pivotX, y: STAGE_GEOMETRY.pivotY },
      bodyB: beam,
      pointB: { x: 0, y: -BEAM_CENTER_OFFSET_Y },
      stiffness: PIVOT_STIFFNESS,
      length: 0,
      render: { visible: false },
    })

    const leftRopeA = Constraint.create({
      bodyA: beam,
      pointA: { x: -STAGE_GEOMETRY.beamWidth / 2 + 8, y: 0 },
      bodyB: leftPan,
      pointB: { x: -40, y: -16 },
      stiffness: ROPE_STIFFNESS,
      length: STAGE_GEOMETRY.ropeLength,
      render: { visible: false },
    })
    const leftRopeB = Constraint.create({
      bodyA: beam,
      pointA: { x: -STAGE_GEOMETRY.beamWidth / 2 + 8, y: 0 },
      bodyB: leftPan,
      pointB: { x: 40, y: -16 },
      stiffness: ROPE_STIFFNESS,
      length: STAGE_GEOMETRY.ropeLength,
      render: { visible: false },
    })
    const rightRopeA = Constraint.create({
      bodyA: beam,
      pointA: { x: STAGE_GEOMETRY.beamWidth / 2 - 8, y: 0 },
      bodyB: rightPan,
      pointB: { x: -40, y: -16 },
      stiffness: ROPE_STIFFNESS,
      length: STAGE_GEOMETRY.ropeLength,
      render: { visible: false },
    })
    const rightRopeB = Constraint.create({
      bodyA: beam,
      pointA: { x: STAGE_GEOMETRY.beamWidth / 2 - 8, y: 0 },
      bodyB: rightPan,
      pointB: { x: 40, y: -16 },
      stiffness: ROPE_STIFFNESS,
      length: STAGE_GEOMETRY.ropeLength,
      render: { visible: false },
    })

    Composite.add(world, [
      floor,
      wallLeft,
      wallRight,
      post,
      base,
      beam,
      leftPan,
      rightPan,
      pivotConstraint,
      leftRopeA,
      leftRopeB,
      rightRopeA,
      rightRopeB,
    ])

    const runtime: PhysicsRuntime = {
      Matter,
      engine,
      runner: Runner.create(),
      beam,
      leftPan,
      rightPan,
      world,
      items: new Map(),
      geometry: STAGE_GEOMETRY,
      applyPanMasses: () => {},
      syncView: () => {
        const leftBeamAnchor = rotatePoint(
          beam.position.x,
          beam.position.y,
          -STAGE_GEOMETRY.beamWidth / 2 + 8,
          0,
          beam.angle,
        )
        const rightBeamAnchor = rotatePoint(
          beam.position.x,
          beam.position.y,
          STAGE_GEOMETRY.beamWidth / 2 - 8,
          0,
          beam.angle,
        )
        const leftPanAnchorLeft = rotatePoint(
          leftPan.position.x,
          leftPan.position.y,
          -40,
          -16,
          leftPan.angle,
        )
        const leftPanAnchorRight = rotatePoint(
          leftPan.position.x,
          leftPan.position.y,
          40,
          -16,
          leftPan.angle,
        )
        const rightPanAnchorLeft = rotatePoint(
          rightPan.position.x,
          rightPan.position.y,
          -40,
          -16,
          rightPan.angle,
        )
        const rightPanAnchorRight = rotatePoint(
          rightPan.position.x,
          rightPan.position.y,
          40,
          -16,
          rightPan.angle,
        )

        setPhysicsSnapshot({
          beamAngle: beam.angle,
          leftPan: {
            x: leftPan.position.x,
            y: leftPan.position.y,
            angle: leftPan.angle,
          },
          rightPan: {
            x: rightPan.position.x,
            y: rightPan.position.y,
            angle: rightPan.angle,
          },
          leftRopes: [
            {
              x1: leftBeamAnchor.x,
              y1: leftBeamAnchor.y,
              x2: leftPanAnchorLeft.x,
              y2: leftPanAnchorLeft.y,
            },
            {
              x1: leftBeamAnchor.x,
              y1: leftBeamAnchor.y,
              x2: leftPanAnchorRight.x,
              y2: leftPanAnchorRight.y,
            },
          ],
          rightRopes: [
            {
              x1: rightBeamAnchor.x,
              y1: rightBeamAnchor.y,
              x2: rightPanAnchorLeft.x,
              y2: rightPanAnchorLeft.y,
            },
            {
              x1: rightBeamAnchor.x,
              y1: rightBeamAnchor.y,
              x2: rightPanAnchorRight.x,
              y2: rightPanAnchorRight.y,
            },
          ],
        })

        setPlacedItems(
          Array.from(runtime.items.entries()).map(([instanceId, item]) => ({
            instanceId,
            type: item.type,
            pan: item.pan,
          })),
        )
      },
    }

    runtimeRef.current = runtime

    const handleBeforeUpdate = () => {
      const leftPanMass = sumPanPhysicsMass(runtime.items, 'left')
      const rightPanMass = sumPanPhysicsMass(runtime.items, 'right')
      const loadTorque =
        (rightPanMass - leftPanMass) *
        BALANCE_LOAD_TORQUE_SCALE *
        Math.cos(beam.angle)
      const restoringTorque =
        -Math.sin(beam.angle) * BALANCE_RESTORE_STIFFNESS -
        beam.angularVelocity * BALANCE_RESTORE_DAMPING
      const totalTorque = loadTorque + restoringTorque

      beam.torque += totalTorque
    }
    const handleAfterUpdate = () => runtime.syncView()
    Events.on(engine, 'beforeUpdate', handleBeforeUpdate)
    Events.on(engine, 'afterUpdate', handleAfterUpdate)
    runtime.syncView()
    Runner.run(runtime.runner, engine)

    return () => {
      Events.off(engine, 'beforeUpdate', handleBeforeUpdate)
      Events.off(engine, 'afterUpdate', handleAfterUpdate)
      Runner.stop(runtime.runner)
      Composite.clear(world, false)
      Engine.clear(engine)
      runtimeRef.current = null
      setPlacedItems([])
    }
  }, [matterReady])

  const spawnIntoPan = useCallback((pan: PanSide, type: ScaleItemId) => {
    const runtime = runtimeRef.current
    if (!runtime) return

    const def = ITEM_DEFS[type]
    if (def.singleInstance && placedItems.some((item) => item.type === type)) {
      return
    }

    const instanceId = `${type}-${nextItemIdRef.current++}`
    runtime.items.set(instanceId, {
      type,
      pan,
    })
    setInteractionCount((count) => count + 1)
    runtime.applyPanMasses()
    runtime.syncView()
  }, [placedItems])

  const removePlacedItem = useCallback((instanceId: string) => {
    const runtime = runtimeRef.current
    if (!runtime) return
    const item = runtime.items.get(instanceId)
    if (!item) return

    runtime.items.delete(instanceId)
    setInteractionCount((count) => count + 1)
    runtime.applyPanMasses()
    runtime.syncView()
  }, [])

  const clearPans = useCallback(() => {
    const runtime = runtimeRef.current
    if (!runtime) return
    if (runtime.items.size > 0) setInteractionCount((count) => count + 1)

    runtime.items.clear()
    runtime.applyPanMasses()

    runtime.Matter.Body.setAngle(runtime.beam, 0)
    runtime.Matter.Body.setAngularVelocity(runtime.beam, 0)
    runtime.Matter.Body.setVelocity(runtime.beam, { x: 0, y: 0 })
    runtime.Matter.Body.setPosition(runtime.leftPan, {
      x: STAGE_GEOMETRY.pivotX - STAGE_GEOMETRY.beamWidth / 2 + 8,
      y: STAGE_GEOMETRY.pivotY + BEAM_CENTER_OFFSET_Y + STAGE_GEOMETRY.ropeLength,
    })
    runtime.Matter.Body.setPosition(runtime.rightPan, {
      x: STAGE_GEOMETRY.pivotX + STAGE_GEOMETRY.beamWidth / 2 - 8,
      y: STAGE_GEOMETRY.pivotY + BEAM_CENTER_OFFSET_Y + STAGE_GEOMETRY.ropeLength,
    })
    runtime.Matter.Body.setAngle(runtime.leftPan, 0)
    runtime.Matter.Body.setAngle(runtime.rightPan, 0)
    runtime.Matter.Body.setVelocity(runtime.leftPan, { x: 0, y: 0 })
    runtime.Matter.Body.setVelocity(runtime.rightPan, { x: 0, y: 0 })
    runtime.Matter.Body.setAngularVelocity(runtime.leftPan, 0)
    runtime.Matter.Body.setAngularVelocity(runtime.rightPan, 0)
    runtime.syncView()
  }, [])

  function handleDragStart(e: React.DragEvent, id: ScaleItemId) {
    if (ITEM_DEFS[id].singleInstance && !crownInPool) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData(DRAG_TYPE, id)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', id)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleDropToPan(e: React.DragEvent, pan: PanSide) {
    e.preventDefault()
    setDragOverPan(null)
    const id = e.dataTransfer.getData(DRAG_TYPE) as ScaleItemId | ''
    if (!id) return
    if (ITEM_DEFS[id].singleInstance && !crownInPool) return
    spawnIntoPan(pan, id)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverPan(null)
  }

  function renderPanItems(pan: PanSide) {
    return placedItems
      .filter((item) => item.pan === pan)
      .map((item) => (
        <button
          key={item.instanceId}
          type="button"
          className="crown-scale-pan-item"
          onClick={(e) => {
            e.stopPropagation()
            removePlacedItem(item.instanceId)
          }}
          title={`Remove ${ITEM_LABELS[item.type]}`}
        >
          <img
            src={ITEM_DEFS[item.type].iconSrc}
            alt={ITEM_LABELS[item.type]}
            className="crown-scale-pan-item-img"
          />
        </button>
      ))
  }

  const toolboxItems = (
    <div className="scale-toolset">
      <div className="weigh-toolbox-header">
        <div>
          <p className="weigh-panel-kicker">Toolbox</p>
          <h4>Available objects</h4>
        </div>
      </div>
      <p className="helper-text scale-toolset-hint">
        Drag any item into a bowl. Click an item inside a bowl to remove it.
      </p>
      <div className="scale-toolset-items">
        {(
          [
            'crown',
            'goldBar',
            'silverBar',
            'mass100',
            'mass200',
            'mass300',
          ] as ScaleItemId[]
        ).map((id) => {
          const def = ITEM_DEFS[id]
          const disabled = Boolean(def.singleInstance && !crownInPool)
          return (
            <div
              key={id}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, id)}
              onDragEnd={() => setDragOverPan(null)}
              className={`scale-tool-draggable ${disabled ? 'scale-tool-draggable-disabled' : ''}`}
              title={`${def.label} – drag to a bowl`}
            >
              <img
                src={def.iconSrc}
                alt={ITEM_LABELS[id]}
                className="scale-tool-img"
              />
              <span>{def.label}</span>
            </div>
          )
        })}
      </div>
      <div className="scale-toolset-actions">
        <button
          type="button"
          className="link-button"
          onClick={clearPans}
        >
          Clear pans
        </button>
      </div>
    </div>
  )

  return (
    <div className="scene crown-weigh-scene">
      <header className="scene-header">
        <button
          className="link-button"
          type="button"
          onClick={() => onNavigate('intro')}
        >
          ← Back to story intro
        </button>
        <h2>Test 1 – Weighing the Crown</h2>
      </header>

      <section className="scene-body experiment-layout">
        <div className="experiment-controls weigh-reading-panel">
          {toolboxItems}

          <section className="weigh-info-card weigh-info-card-intro">
            <p className="weigh-panel-kicker">Archimedes&apos; first idea</p>
            <h3>Use a balance to compare the crown with trusted masses</h3>
            <p className="scene-text">
              Try to balance the crown against trusted weights and bars.
            </p>
          </section>

          <section className="weigh-info-card">
            <h4>How to use the scale</h4>
            <div className="weigh-guidance-list">
              <div className="weigh-guidance-item">
                <span className="weigh-guidance-step">1</span>
                <p>Drag the crown or any weight from the toolbox into either bowl.</p>
              </div>
              <div className="weigh-guidance-item">
                <span className="weigh-guidance-step">2</span>
                <p>Mix items until the beam levels out. Click any bowl item to remove it.</p>
              </div>
            </div>
          </section>

          <div className="weigh-reading-panel-footer">
            {showConclusionCard ? (
              <section className="weigh-conclusion-card" aria-live="polite">
                <div className="weigh-conclusion-copy">
                  <p className="weigh-conclusion-kicker">Lesson reflection</p>
                  <h4>Weight gives a clue, but not the whole answer.</h4>
                  <p className="scene-text weigh-conclusion-text">
                    You have tested the crown against known masses and watched
                    the beam react. That helps Archimedes compare weight, but it
                    still does not prove whether the crown matches pure gold in
                    volume as well as mass.
                  </p>
                  <p className="helper-text weigh-conclusion-hint">
                    Continue to the next lesson to explore the better idea:
                    compare equal masses in a way that also reveals how much
                    space each material takes up.
                  </p>
                </div>
              </section>
            ) : null}
            <button
              type="button"
              className="weigh-audio-cycle-button weigh-audio-cycle-button-highlight"
              onClick={() => {
                const nextIndex =
                  activeNarrationIndex >= 0
                    ? (activeNarrationIndex + 1) % NARRATION_CLIPS.length
                    : 0
                setActiveNarrationId(NARRATION_CLIPS[nextIndex].id)
              }}
              title="Play the next narration clip"
              aria-label="Play the next narration clip"
            >
              <span className="weigh-audio-cycle-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M5 14h3l4 4V6L8 10H5z" />
                  <path d="M15 9a4 4 0 010 6" />
                  <path d="M17.5 6.5a7.5 7.5 0 010 11" />
                </svg>
              </span>
              <span className="weigh-audio-cycle-copy">
                <span className="weigh-audio-cycle-label">Optional narration</span>
                <span className="weigh-audio-cycle-text">
                  {activeNarrationIndex >= 0
                    ? `Play clip ${(activeNarrationIndex % NARRATION_CLIPS.length) + 1} of 3`
                    : 'Play clip 1 of 3'}
                </span>
              </span>
            </button>
          </div>
        </div>

        <div className="experiment-canvas crown-weigh-panel">
          <div
            className="crown-scale-stage"
            style={{
              width: `${STAGE_GEOMETRY.width}px`,
              height: `${STAGE_GEOMETRY.height}px`,
            }}
          >
                <div
                  className="crown-scale-base"
                  style={{
                    left: `${STAGE_GEOMETRY.pivotX}px`,
                    width: `${BASE_WIDTH_PX}px`,
                    height: `${BASE_HEIGHT_PX}px`,
                    bottom: `${BASE_BOTTOM_PX}px`,
                  }}
                  aria-hidden
                />
                <div
                  className="crown-scale-post"
                  style={{
                    left: `${STAGE_GEOMETRY.pivotX}px`,
                    top: `${POST_TOP_PX}px`,
                    width: `${POST_WIDTH_PX}px`,
                    height: `${POST_HEIGHT_PX}px`,
                  }}
                  aria-hidden
                />
                <div
                  className="crown-scale-pivot"
                  style={{
                    left: `${STAGE_GEOMETRY.pivotX}px`,
                    top: `${STAGE_GEOMETRY.pivotY}px`,
                  }}
                  aria-hidden
                />

                <div
                  className="crown-scale-beam"
                  style={{
                    left: `${STAGE_GEOMETRY.pivotX}px`,
                    top: `${STAGE_GEOMETRY.pivotY}px`,
                    width: `${STAGE_GEOMETRY.beamWidth}px`,
                    transform: `translate(-50%, -50%) rotate(${physicsSnapshot.beamAngle}rad)`,
                  }}
                  role="img"
                  aria-label="Matter.js balance scale"
                >
                  <div className="crown-scale-rod">
                    <div className="crown-scale-rod-cap" aria-hidden />
                  </div>
                </div>

                {physicsSnapshot.leftRopes.map((rope, index) => (
                  <div
                    key={`left-rope-${index}`}
                    className="crown-scale-rope"
                    style={lineStyle(rope.x1, rope.y1, rope.x2, rope.y2)}
                    aria-hidden
                  />
                ))}
                {physicsSnapshot.rightRopes.map((rope, index) => (
                  <div
                    key={`right-rope-${index}`}
                    className="crown-scale-rope"
                    style={lineStyle(rope.x1, rope.y1, rope.x2, rope.y2)}
                    aria-hidden
                  />
                ))}

                <div
                  className={`crown-scale-pan crown-scale-pan-left ${dragOverPan === 'left' ? 'crown-scale-pan-drag-over' : ''}`}
                  style={{
                    left: `${physicsSnapshot.leftPan.x}px`,
                    top: `${physicsSnapshot.leftPan.y}px`,
                    transform: `translate(-50%, -50%) rotate(${physicsSnapshot.leftPan.angle}rad)`,
                  }}
                  onDragOver={(e) => {
                    handleDragOver(e)
                    setDragOverPan('left')
                  }}
                  onDrop={(e) => handleDropToPan(e, 'left')}
                  onDragLeave={handleDragLeave}
                  role="button"
                  tabIndex={0}
                  aria-label="Left bowl – drop items here"
                >
                  <div className="crown-scale-pan-total">
                    {(leftMass * 1000).toFixed(0)} g
                  </div>
                  <div className="crown-scale-pan-remove-hint">Drop or remove</div>
                  <div className="crown-scale-pan-items">
                    {renderPanItems('left')}
                  </div>
                </div>

                <div
                  className={`crown-scale-pan crown-scale-pan-right ${dragOverPan === 'right' ? 'crown-scale-pan-drag-over' : ''}`}
                  style={{
                    left: `${physicsSnapshot.rightPan.x}px`,
                    top: `${physicsSnapshot.rightPan.y}px`,
                    transform: `translate(-50%, -50%) rotate(${physicsSnapshot.rightPan.angle}rad)`,
                  }}
                  onDragOver={(e) => {
                    handleDragOver(e)
                    setDragOverPan('right')
                  }}
                  onDrop={(e) => handleDropToPan(e, 'right')}
                  onDragLeave={handleDragLeave}
                  role="button"
                  tabIndex={0}
                  aria-label="Right bowl – drop items here"
                >
                  <div className="crown-scale-pan-total">
                    {(rightMass * 1000).toFixed(0)} g
                  </div>
                  <div className="crown-scale-pan-remove-hint">Drop or remove</div>
                  <div className="crown-scale-pan-items">
                    {renderPanItems('right')}
                  </div>
                </div>
          </div>
        </div>
      </section>

      <footer className="scene-footer">
        <div className="scene-footer-left">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onNavigate('intro')}
          >
            Back to story intro
          </button>
        </div>
        <div className="scene-footer-right">
          <button
            className="primary-button"
            type="button"
            onClick={() => onNavigate('melt')}
            disabled={!canContinue}
          >
            Try a different idea
          </button>
        </div>
      </footer>
    </div>
  )
}

export default CrownWeighScene
