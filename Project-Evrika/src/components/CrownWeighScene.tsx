import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SceneId } from './LandingPage'
import crownSvg from '../assets/crown.svg'
import { ensureMatterLoaded } from '../lib/ensureMatter'
import { useLessonHub } from '../context/LessonHubContext'

type PanSide = 'left' | 'right'
export type ScaleItemId =
  | 'crown'
  | 'goldLump'
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

/** Unlabeled nugget — no mass text on the art (player must weigh it). */
function makeGoldLumpIcon() {
  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 56">
      <path d="M38 6 C52 8 62 18 64 32 C66 46 54 54 40 54 C26 54 10 46 8 32 C6 18 20 8 38 6Z" fill="#e0a82e" stroke="#5c4a12" stroke-width="3" stroke-linejoin="round"/>
      <path d="M28 22 C34 18 44 20 50 28" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="44" cy="26" rx="10" ry="6" fill="rgba(255,255,255,0.15)"/>
    </svg>
  `)
}

const CROWN_MASS_G = 2000
const LUMP_MASS_G = 2000
/** Plays once when crown and lump sit on opposite pans and the beam levels (equal-weight clue). */
const VOICE_CROWN_VS_LUMP_SRC = '/audio/archimedes-crown-match.mp3'
/** Plays once when the player submits the correct crown mass in the input. */
const VOICE_CROWN_MASS_ENTERED_SRC = '/audio/scale_conclusion-2.mp3'
const INSIGHT_TEXT_BALANCE =
  "Hmm, it seems like the blacksmith made the golden crown weigh exactly the same as the gold given to him by the king. There should be another way to solve this."
const INSIGHT_TEXT_CROWN_ANSWER =
  "The crown has weight. That much is certain. But a dishonest goldsmith knows how to match a number on a scale. Mass is a clue, not a conclusion. The secret of what lies inside the crown still waits to be uncovered."

const MASS_KG: Record<ScaleItemId, number> = {
  crown: 2.0,
  goldLump: 2.0,
  goldBar: 0.5,
  silverBar: 0.3,
  mass100: 0.1,
  mass200: 0.2,
  mass300: 0.3,
}

const ITEM_LABELS: Record<ScaleItemId, string> = {
  crown: 'Crown',
  goldLump: 'Lump of gold',
  goldBar: 'Gold bar',
  silverBar: 'Silver bar',
  mass100: '100 g',
  mass200: '200 g',
  mass300: '300 g',
}

const ITEM_DEFS: Record<ScaleItemId, ItemDefinition> = {
  crown: {
    label: 'Crown',
    massGrams: CROWN_MASS_G,
    physicsMass: 20,
    iconSrc: crownSvg,
    bodyShape: 'circle',
    radius: 18,
    singleInstance: true,
  },
  goldLump: {
    label: 'Lump of gold from the king',
    massGrams: LUMP_MASS_G,
    physicsMass: 20,
    iconSrc: makeGoldLumpIcon(),
    bodyShape: 'circle',
    radius: 16,
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

type WeighMissionPhase = 'crown' | 'lump' | 'done'

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

const CrownWeighScene: FC<CrownWeighSceneProps> = ({ onNavigate: _onNavigate }) => {
  const { progress, patchProgress, triggerInsight } = useLessonHub()
  const progressWeighRef = useRef(progress.weigh)
  progressWeighRef.current = progress.weigh

  const runtimeRef = useRef<PhysicsRuntime | null>(null)
  const nextItemIdRef = useRef(progress.weigh.nextItemId)
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([])
  const [dragOverPan, setDragOverPan] = useState<PanSide | null>(null)
  const [matterReady, setMatterReady] = useState(false)
  const [massGuess, setMassGuess] = useState(() => progress.weigh.massGuess)
  const [massCheckFeedback, setMassCheckFeedback] = useState(
    () => progress.weigh.massCheckFeedback,
  )
  const [weighPhase, setWeighPhase] = useState<WeighMissionPhase>(
    () => progress.weigh.weighPhase,
  )
  const crownWeighSceneRef = useRef<HTMLDivElement>(null)
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
  const goldLumpInPool = !placedItems.some((item) => item.type === 'goldLump')
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
  const leftPanItems = useMemo(
    () => placedItems.filter((item) => item.pan === 'left'),
    [placedItems],
  )
  const rightPanItems = useMemo(
    () => placedItems.filter((item) => item.pan === 'right'),
    [placedItems],
  )
  const crownPan =
    leftPanItems.some((item) => item.type === 'crown')
      ? 'left'
      : rightPanItems.some((item) => item.type === 'crown')
        ? 'right'
        : null
  const crownPanItems = crownPan === 'left' ? leftPanItems : crownPan === 'right' ? rightPanItems : []
  const counterPan = crownPan === 'left' ? 'right' : crownPan === 'right' ? 'left' : null
  const counterMass = counterPan === 'left' ? leftMass : counterPan === 'right' ? rightMass : 0
  const counterPanItems = counterPan === 'left' ? leftPanItems : counterPan === 'right' ? rightPanItems : []
  const crownIsAlone = crownPanItems.length === 1 && crownPanItems[0]?.type === 'crown'
  const goldLumpPan =
    leftPanItems.some((item) => item.type === 'goldLump')
      ? 'left'
      : rightPanItems.some((item) => item.type === 'goldLump')
        ? 'right'
        : null
  const goldLumpPanItems =
    goldLumpPan === 'left' ? leftPanItems : goldLumpPan === 'right' ? rightPanItems : []
  const lumpIsAlone =
    goldLumpPanItems.length === 1 && goldLumpPanItems[0]?.type === 'goldLump'
  const lumpCounterPan =
    goldLumpPan === 'left' ? 'right' : goldLumpPan === 'right' ? 'left' : null
  const lumpCounterPanItems =
    lumpCounterPan === 'left' ? leftPanItems : lumpCounterPan === 'right' ? rightPanItems : []
  const lumpCounterMass =
    lumpCounterPan === 'left' ? leftMass : lumpCounterPan === 'right' ? rightMass : 0
  const beamIsLevel = Math.abs(physicsSnapshot.beamAngle) < 0.045
  const measuredMassMatchesCrown = Math.abs(counterMass - MASS_KG.crown) < 0.001
  const measuredMassMatchesLump = Math.abs(lumpCounterMass - MASS_KG.goldLump) < 0.001
  const hasSolvedMeasurement =
    weighPhase === 'crown' &&
    crownIsAlone &&
    counterPan !== null &&
    measuredMassMatchesCrown &&
    beamIsLevel
  const hasSolvedLumpMeasurement =
    weighPhase === 'lump' &&
    lumpIsAlone &&
    lumpCounterPan !== null &&
    measuredMassMatchesLump &&
    beamIsLevel
  const canRevealCounterMass =
    weighPhase === 'crown' &&
    crownPan !== null &&
    crownIsAlone &&
    counterPan !== null &&
    counterPanItems.length > 0 &&
    counterPanItems.every((item) => item.type !== 'crown')
  const canRevealLumpCounter =
    weighPhase === 'lump' &&
    goldLumpPan !== null &&
    lumpIsAlone &&
    lumpCounterPan !== null &&
    lumpCounterPanItems.length > 0 &&
    lumpCounterPanItems.every((item) => item.type !== 'goldLump' && item.type !== 'crown')
  const versusOpposedSetup = useMemo(() => {
    const l = placedItems.filter((i) => i.pan === 'left').map((i) => i.type)
    const r = placedItems.filter((i) => i.pan === 'right').map((i) => i.type)
    return (
      (l.length === 1 &&
        l[0] === 'crown' &&
        r.length === 1 &&
        r[0] === 'goldLump') ||
      (l.length === 1 &&
        l[0] === 'goldLump' &&
        r.length === 1 &&
        r[0] === 'crown')
    )
  }, [placedItems])
  const hasCrownVersusLumpBalance =
    versusOpposedSetup &&
    beamIsLevel &&
    Math.abs(leftMass - rightMass) < 0.002
  const versusPanState = !versusOpposedSetup
    ? 'idle'
    : hasCrownVersusLumpBalance
      ? 'balanced'
      : 'unbalanced'
  const scaleBalanceState = !canRevealCounterMass
    ? 'idle'
    : hasSolvedMeasurement
      ? 'balanced'
      : 'unbalanced'
  const lumpScaleBalanceState = !canRevealLumpCounter
    ? 'idle'
    : hasSolvedLumpMeasurement
      ? 'balanced'
      : 'unbalanced'
  const activePanBalanceState =
    weighPhase === 'lump' ? lumpScaleBalanceState : scaleBalanceState
  const panStateForColor = versusOpposedSetup
    ? versusPanState
    : activePanBalanceState
  const showLevelGuide =
    (weighPhase === 'crown' && canRevealCounterMass) ||
    (weighPhase === 'lump' && canRevealLumpCounter) ||
    versusOpposedSetup
  const taskStatus =
    weighPhase === 'done'
      ? 'Mission complete. Use the room bar below to explore other workshops.'
      : weighPhase === 'lump'
        ? goldLumpPan === null
          ? 'Drag the unlabeled lump of gold into a bowl by itself — you must discover its mass without a label.'
          : !lumpIsAlone
            ? 'Weigh only the lump on one side (nothing else with it).'
            : !canRevealLumpCounter
              ? 'Add trusted masses to the other bowl until the beam settles.'
              : hasSolvedLumpMeasurement
                ? 'The scale is balanced. Enter the lump\'s mass in grams.'
                : 'Adjust the deadweights until the lump alone balances.'
        : crownPan === null
          ? 'Place the crown in one bowl to measure its mass first.'
          : !crownIsAlone
            ? 'Keep the crown by itself on one side so you measure only the crown.'
            : !canRevealCounterMass
              ? 'Add trusted masses to the other bowl until the balance begins to settle.'
              : hasSolvedMeasurement
                ? 'The scale is balanced. Enter the crown\'s mass in grams.'
                : 'Adjust the deadweights until the crown alone balances against the known masses.'

  const saveWeighLayout = useCallback(() => {
    const rt = runtimeRef.current
    if (!rt) return
    const rows = Array.from(rt.items.entries()).map(([instanceId, item]) => ({
      instanceId,
      type: item.type,
      pan: item.pan,
    }))
    patchProgress({
      weigh: {
        placedItems: rows,
        nextItemId: nextItemIdRef.current,
      },
    })
  }, [patchProgress])

  useEffect(() => {
    if (!hasCrownVersusLumpBalance || progress.weigh.playedBalanceInsight) return
    patchProgress({ weigh: { playedBalanceInsight: true } })
    triggerInsight({
      kind: 'balance',
      transcript: INSIGHT_TEXT_BALANCE,
      audioSrc: VOICE_CROWN_VS_LUMP_SRC,
    })
  }, [
    hasCrownVersusLumpBalance,
    progress.weigh.playedBalanceInsight,
    patchProgress,
    triggerInsight,
  ])

  useEffect(() => {
    patchProgress({ weigh: { weighPhase } })
  }, [weighPhase, patchProgress])

  useEffect(() => {
    const t = window.setTimeout(() => {
      patchProgress({ weigh: { massGuess } })
    }, 350)
    return () => window.clearTimeout(t)
  }, [massGuess, patchProgress])

  useEffect(() => {
    patchProgress({ weigh: { massCheckFeedback } })
  }, [massCheckFeedback, patchProgress])

  function checkMassGuess() {
    const normalized = massGuess.trim().replace(',', '.')
    const parsed = Number(normalized)

    if (!Number.isFinite(parsed)) {
      setMassCheckFeedback('Enter a mass in grams before checking your answer.')
      return
    }

    if (weighPhase === 'crown') {
      if (!hasSolvedMeasurement) {
        setMassCheckFeedback('First balance the crown by itself against known masses.')
        return
      }
      if (Math.abs(parsed - CROWN_MASS_G) < 0.5) {
        if (!progress.weigh.playedCrownAnswerInsight) {
          patchProgress({ weigh: { playedCrownAnswerInsight: true } })
          triggerInsight({
            kind: 'crownAnswer',
            transcript: INSIGHT_TEXT_CROWN_ANSWER,
            audioSrc: VOICE_CROWN_MASS_ENTERED_SRC,
          })
        }
        setMassGuess('')
        setWeighPhase('lump')
        setMassCheckFeedback('Correct. Now weigh the unlabeled lump of gold the same way.')
        return
      }
      setMassCheckFeedback('That mass is not correct yet. Recheck the balance.')
      return
    }

    if (weighPhase === 'lump') {
      if (!hasSolvedLumpMeasurement) {
        setMassCheckFeedback('Balance the gold lump by itself against known masses first.')
        return
      }
      if (Math.abs(parsed - LUMP_MASS_G) < 0.5) {
        setMassGuess('')
        setWeighPhase('done')
        setMassCheckFeedback('Correct. You can explore other rooms from the bar below.')
        return
      }
      setMassCheckFeedback('That mass is not correct yet. Recheck the balance.')
      return
    }

    setMassCheckFeedback('Use the room bar below to visit another workshop when you are ready.')
  }

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

    const w = progressWeighRef.current
    if (w.placedItems?.length) {
      for (const row of w.placedItems) {
        runtime.items.set(row.instanceId, {
          type: row.type as ScaleItemId,
          pan: row.pan,
        })
      }
    }
    nextItemIdRef.current = w.nextItemId

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
    runtime.syncView()

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

    if (type === 'crown' && placedItems.some((item) => item.type === 'crown')) {
      return
    }
    if (type === 'goldLump' && placedItems.some((item) => item.type === 'goldLump')) {
      return
    }

    const instanceId = `${type}-${nextItemIdRef.current++}`
    runtime.items.set(instanceId, {
      type,
      pan,
    })
    runtime.applyPanMasses()
    runtime.syncView()
    saveWeighLayout()
  }, [placedItems, saveWeighLayout])

  const removePlacedItem = useCallback(
    (instanceId: string) => {
      const runtime = runtimeRef.current
      if (!runtime) return
      const item = runtime.items.get(instanceId)
      if (!item) return

      runtime.items.delete(instanceId)
      runtime.applyPanMasses()
      runtime.syncView()
      saveWeighLayout()
    },
    [saveWeighLayout],
  )

  const clearPans = useCallback(() => {
    const runtime = runtimeRef.current
    if (!runtime) return

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
    nextItemIdRef.current = 0
    runtime.syncView()
    saveWeighLayout()
  }, [saveWeighLayout])

  function handleDragStart(e: React.DragEvent, id: ScaleItemId) {
    if (id === 'crown' && !crownInPool) {
      e.preventDefault()
      return
    }
    if (id === 'goldLump' && !goldLumpInPool) {
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
    if (id === 'crown' && !crownInPool) return
    if (id === 'goldLump' && !goldLumpInPool) return
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

  const crownDef = ITEM_DEFS.crown
  const crownDisabled = !crownInPool
  const goldLumpDef = ITEM_DEFS.goldLump
  const goldLumpDisabled = !goldLumpInPool

  const toolboxItems = (
    <div className="scale-toolset">
      <div className="weigh-showcase-pair">
        <div className="weigh-crown-showcase">
          <div className="weigh-crown-showcase-ring">
            <div
              draggable={!crownDisabled}
              onDragStart={(e) => handleDragStart(e, 'crown')}
              onDragEnd={() => setDragOverPan(null)}
              className={`scale-tool-draggable weigh-crown-draggable ${crownDisabled ? 'scale-tool-draggable-disabled' : ''}`}
              title={`${crownDef.label} – drag to a bowl`}
            >
              <img
                src={crownDef.iconSrc}
                alt={ITEM_LABELS.crown}
                className="scale-tool-img weigh-crown-img"
              />
            </div>
          </div>
          <span className="weigh-crown-showcase-label">Crown</span>
        </div>
        <div className="weigh-crown-showcase">
          <div className="weigh-crown-showcase-ring">
            <div
              draggable={!goldLumpDisabled}
              onDragStart={(e) => handleDragStart(e, 'goldLump')}
              onDragEnd={() => setDragOverPan(null)}
              className={`scale-tool-draggable weigh-crown-draggable ${goldLumpDisabled ? 'scale-tool-draggable-disabled' : ''}`}
              title="Lump of gold from the king — no mass label; weigh it yourself"
            >
              <img
                src={goldLumpDef.iconSrc}
                alt={ITEM_LABELS.goldLump}
                className="scale-tool-img weigh-crown-img"
              />
            </div>
          </div>
          <span className="weigh-crown-showcase-label">Gold lump (no label)</span>
        </div>
      </div>

      <div className="weigh-toolbox-header">
        <div>
          <p className="weigh-panel-kicker">Toolbox</p>
          <h4>Known masses</h4>
        </div>
      </div>
      <p className="helper-text scale-toolset-hint">
        Drag items into a bowl. Click an item inside a bowl to remove it.
      </p>
      <div className="scale-toolset-items">
        {(
          [
            'goldBar',
            'silverBar',
            'mass100',
            'mass200',
            'mass300',
          ] as ScaleItemId[]
        ).map((id) => {
          const def = ITEM_DEFS[id]
          return (
            <div
              key={id}
              draggable
              onDragStart={(e) => handleDragStart(e, id)}
              onDragEnd={() => setDragOverPan(null)}
              className="scale-tool-draggable"
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
    <div ref={crownWeighSceneRef} className="scene crown-weigh-scene">
      <header className="scene-header hub-scene-header">
        <h2>Weighing chamber – crown and king&apos;s gold</h2>
      </header>

      <section className="scene-body experiment-layout">
        <div className="experiment-controls weigh-reading-panel">
          <section className="weigh-info-card weigh-mission-card">
            <p className="weigh-panel-kicker">Mission objective</p>
            <h3>Measure the crown, then the unlabeled lump</h3>
            <p className="scene-text">
              Find each mass using trusted weights. Try putting the crown on one pan and the king&apos;s gold lump on the other — when the beam levels, they weigh the same. Archimedes comments from the floating companion when that happens and when you enter the correct crown mass.
            </p>
          </section>

          {toolboxItems}

          <section className="weigh-info-card">
            <h4>How to solve it</h4>
            <div className="weigh-guidance-list">
              <div className="weigh-guidance-item">
                <span className="weigh-guidance-step">1</span>
                <p>Weigh the crown alone against trusted masses; enter its mass in grams.</p>
              </div>
              <div className="weigh-guidance-item">
                <span className="weigh-guidance-step">2</span>
                <p>Optional clue: crown on one side, lump on the other — if the beam levels, they match.</p>
              </div>
              <div className="weigh-guidance-item">
                <span className="weigh-guidance-step">3</span>
                <p>Weigh the lump alone and enter its mass. Open the companion bubble to replay his lines.</p>
              </div>
            </div>
          </section>

          {weighPhase === 'crown' || weighPhase === 'lump' ? (
            <section className="weigh-info-card weigh-answer-card">
              <p className="weigh-panel-kicker">Record your measurement</p>
              <h4>
                {weighPhase === 'crown'
                  ? 'Enter the crown mass in grams'
                  : 'Enter the lump mass in grams'}
              </h4>
              <div className="weigh-answer-row">
                <input
                  type="text"
                  inputMode="numeric"
                  className="weigh-answer-input"
                  placeholder={
                    weighPhase === 'crown' ? 'Crown mass (g)' : 'Lump mass (g)'
                  }
                  value={massGuess}
                  onChange={(e) => setMassGuess(e.target.value)}
                  aria-label={
                    weighPhase === 'crown'
                      ? 'Enter the measured mass of the crown in grams'
                      : 'Enter the measured mass of the gold lump in grams'
                  }
                />
                <button
                  type="button"
                  className="secondary-button weigh-answer-check"
                  onClick={checkMassGuess}
                >
                  Check
                </button>
              </div>
              <p className="helper-text weigh-answer-feedback">
                {massCheckFeedback ||
                  (weighPhase === 'crown'
                    ? 'Balance the crown first, then type the mass you measured.'
                    : 'Balance the lump alone, then type the mass you measured.')}
              </p>
            </section>
          ) : null}

          <div className="weigh-reading-panel-footer">
            <section
              className={`weigh-conclusion-card ${
                weighPhase === 'done' ||
                (weighPhase === 'crown' && hasSolvedMeasurement) ||
                (weighPhase === 'lump' && hasSolvedLumpMeasurement) ||
                hasCrownVersusLumpBalance
                  ? 'weigh-conclusion-card-success'
                  : ''
              }`}
              aria-live="polite"
            >
              <div className="weigh-conclusion-copy">
                <p className="weigh-conclusion-kicker">
                  {weighPhase === 'done'
                    ? 'Mission complete'
                    : weighPhase === 'lump'
                      ? hasSolvedLumpMeasurement
                        ? 'Lump balanced'
                        : 'Current task'
                      : hasSolvedMeasurement
                        ? 'Crown balanced'
                        : 'Current task'}
                </p>
                <h4>
                  {weighPhase === 'done'
                    ? 'Both masses recorded'
                    : weighPhase === 'lump'
                      ? hasSolvedLumpMeasurement
                        ? 'Ready to enter lump mass'
                        : 'Weigh the lump alone'
                      : hasSolvedMeasurement
                        ? 'Ready to enter crown mass'
                        : 'Weigh the crown alone'}
                </h4>
                <p className="scene-text weigh-conclusion-text">
                  {taskStatus}
                </p>
                <p className="helper-text weigh-conclusion-hint">
                  {weighPhase === 'done'
                    ? 'Use the room bar below to explore other labs. The Archimedes companion stays on screen for replay.'
                    : 'The beam must be level before your gram answer counts — you are measuring against trusted masses, not guessing from the animation alone.'}
                </p>
              </div>
            </section>
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
                {showLevelGuide ? (
                  <div
                    className={`crown-scale-level-guide crown-scale-level-guide-${panStateForColor}`}
                    style={{
                      left: `${STAGE_GEOMETRY.pivotX}px`,
                      top: `${STAGE_GEOMETRY.pivotY + BEAM_CENTER_OFFSET_Y + STAGE_GEOMETRY.ropeLength + 6}px`,
                      width: `${STAGE_GEOMETRY.beamWidth + 110}px`,
                    }}
                    aria-hidden
                  />
                ) : null}

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
                  className={`crown-scale-pan crown-scale-pan-left ${dragOverPan === 'left' ? 'crown-scale-pan-drag-over' : ''} ${showLevelGuide ? `crown-scale-pan-${panStateForColor}` : ''}`}
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
                  <div className="crown-scale-pan-items">
                    {renderPanItems('left')}
                  </div>
                </div>

                <div
                  className={`crown-scale-pan crown-scale-pan-right ${dragOverPan === 'right' ? 'crown-scale-pan-drag-over' : ''} ${showLevelGuide ? `crown-scale-pan-${panStateForColor}` : ''}`}
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
                  <div className="crown-scale-pan-items">
                    {renderPanItems('right')}
                  </div>
                </div>
                {weighPhase === 'crown' && canRevealCounterMass && counterPan === 'left' ? (
                  <div
                    className="crown-scale-counter-total"
                    style={{
                      left: `${physicsSnapshot.leftPan.x}px`,
                      top: `${physicsSnapshot.leftPan.y + 58}px`,
                    }}
                  >
                    {(leftMass * 1000).toFixed(0)} g
                  </div>
                ) : null}
                {weighPhase === 'crown' && canRevealCounterMass && counterPan === 'right' ? (
                  <div
                    className="crown-scale-counter-total"
                    style={{
                      left: `${physicsSnapshot.rightPan.x}px`,
                      top: `${physicsSnapshot.rightPan.y + 58}px`,
                    }}
                  >
                    {(rightMass * 1000).toFixed(0)} g
                  </div>
                ) : null}
                {weighPhase === 'lump' && canRevealLumpCounter && lumpCounterPan === 'left' ? (
                  <div
                    className="crown-scale-counter-total"
                    style={{
                      left: `${physicsSnapshot.leftPan.x}px`,
                      top: `${physicsSnapshot.leftPan.y + 58}px`,
                    }}
                  >
                    {(leftMass * 1000).toFixed(0)} g
                  </div>
                ) : null}
                {weighPhase === 'lump' && canRevealLumpCounter && lumpCounterPan === 'right' ? (
                  <div
                    className="crown-scale-counter-total"
                    style={{
                      left: `${physicsSnapshot.rightPan.x}px`,
                      top: `${physicsSnapshot.rightPan.y + 58}px`,
                    }}
                  >
                    {(rightMass * 1000).toFixed(0)} g
                  </div>
                ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}

export default CrownWeighScene
