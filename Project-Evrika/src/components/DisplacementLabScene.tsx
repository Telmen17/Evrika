/**
 * DisplacementLabScene — overflow volume comparison lab orchestrator.
 *
 * Docs: docs/components/scenes/displacement-lab.md
 */

import type { CSSProperties, FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLessonHub } from '../context/LessonHubContext'
import crownSvg from '../assets/crown.svg'
import goldNuggetPng from '../assets/goldNugget3.png'
import { assetUrl } from '../lib/assetUrl'
import type { SceneId } from '../types/sceneId'
import { ensureMatterLoaded } from '../lib/ensureMatter'
import { paintBackgroundLayer } from './displacementLab/canvasDraw'
import {
  COLLECTION_CUP_MAX_ML,
  CROWN_H,
  CROWN_TEXTURE_PX,
  CROWN_W,
  DISPLACEMENT_CROWN_ML,
  DISPLACEMENT_GOLD_ML,
  FLOOR_TOP,
  GOLD_H,
  GOLD_TEXTURE_H,
  GOLD_TEXTURE_W,
  GOLD_W,
  INITIAL_TANK_WATER_01,
  LAB_H,
  LAB_W,
  TANK_L,
  TANK_R,
  crownBenchX,
  formatCollectedMl,
  goldBenchX,
  mlToTankLevel01,
  submergedVolumeFractionInTank,
  type TankSpec,
} from './displacementLab/constants'

interface DisplacementLabSceneProps {
  onNavigate: (scene: SceneId) => void
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

    const crown = Bodies.rectangle(crownBenchX, FLOOR_TOP - CROWN_H / 2, CROWN_W, CROWN_H, {
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

    const gold = Bodies.rectangle(goldBenchX, FLOOR_TOP - GOLD_H / 2, GOLD_W, GOLD_H, {
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

    matterCanvas.style.touchAction = 'none'

    const mapTouchToMouse = (clientX: number, clientY: number) => {
      const rect = matterCanvas.getBoundingClientRect()
      const scaleX = LAB_W / rect.width
      const scaleY = LAB_H / rect.height
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches[0]) return
      e.preventDefault()
      const p = mapTouchToMouse(e.touches[0].clientX, e.touches[0].clientY)
      mouse.position.x = p.x
      mouse.position.y = p.y
      mouse.button = 0
      Events.trigger(mouse, 'mousedown', { mouse })
      wakeDragged()
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return
      e.preventDefault()
      const p = mapTouchToMouse(e.touches[0].clientX, e.touches[0].clientY)
      mouse.position.x = p.x
      mouse.position.y = p.y
      Events.trigger(mouse, 'mousemove', { mouse })
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      mouse.button = -1
      Events.trigger(mouse, 'mouseup', { mouse })
    }

    matterCanvas.addEventListener('touchstart', onTouchStart, { passive: false })
    matterCanvas.addEventListener('touchmove', onTouchMove, { passive: false })
    matterCanvas.addEventListener('touchend', onTouchEnd, { passive: false })
    matterCanvas.addEventListener('touchcancel', onTouchEnd, { passive: false })

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
      matterCanvas.removeEventListener('touchstart', onTouchStart)
      matterCanvas.removeEventListener('touchmove', onTouchMove)
      matterCanvas.removeEventListener('touchend', onTouchEnd)
      matterCanvas.removeEventListener('touchcancel', onTouchEnd)
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
          <p className="scene-text displacement-lab-hint">
            Each overflow can is filled to the spout. Drag or touch-drag the <strong>crown</strong>{' '}
            and <strong>gold nugget</strong> into either can—overflow runs into that side’s collection
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
