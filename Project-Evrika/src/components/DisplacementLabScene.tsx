import type { CSSProperties, FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SceneId } from './LandingPage'
import { ensureMatterLoaded } from '../lib/ensureMatter'

interface DisplacementLabSceneProps {
  onNavigate: (scene: SceneId) => void
}

/** Story: same mass from the earlier weighing; fake crown has larger volume → displaces more water. */
const DISPLACEMENT_CROWN_ML = 54
const DISPLACEMENT_GOLD_ML = 36

const W = 780
const H = 420

/** Left / right tank inner x-range for “resting in vessel” detection */
const LEFT = { xMin: 128, xMax: 268 }
const RIGHT = { xMin: 512, xMax: 652 }

const DisplacementLabScene: FC<DisplacementLabSceneProps> = ({ onNavigate }) => {
  const hostRef = useRef<HTMLDivElement>(null)
  const crownRef = useRef<any>(null)
  const goldRef = useRef<any>(null)
  const [matterOk, setMatterOk] = useState(false)
  const [crownPlaced, setCrownPlaced] = useState(false)
  const [goldPlaced, setGoldPlaced] = useState(false)
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
    if (!matterOk || !hostRef.current) return

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
    } = Matter

    const engine = Engine.create()
    engine.world.gravity.y = 1.05

    const render = Render.create({
      element: hostRef.current,
      engine,
      options: {
        width: W,
        height: H,
        wireframes: false,
        background: '#e5d7bc',
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      },
    })

    const wall = {
      isStatic: true,
      render: { fillStyle: '#7a5c3e', strokeStyle: '#4a3520', lineWidth: 1 },
    }

    const ground = Bodies.rectangle(W / 2, H + 24, W * 2, 48, {
      isStatic: true,
      render: { visible: false },
    })

    /* Left tank U-walls */
    const Lcx = 198
    const Lw = 132
    const tH = 200
    const floorT = 14
    const leftWallL = Bodies.rectangle(Lcx - Lw / 2 - 6, H / 2 + 40, 12, tH, wall)
    const leftWallR = Bodies.rectangle(Lcx + Lw / 2 + 6, H / 2 + 40, 12, tH, wall)
    const leftFloor = Bodies.rectangle(Lcx, H - floorT / 2 - 4, Lw + 24, floorT, wall)

    /* Right tank */
    const Rcx = 582
    const rightWallL = Bodies.rectangle(Rcx - Lw / 2 - 6, H / 2 + 40, 12, tH, wall)
    const rightWallR = Bodies.rectangle(Rcx + Lw / 2 + 6, H / 2 + 40, 12, tH, wall)
    const rightFloor = Bodies.rectangle(Rcx, H - floorT / 2 - 4, Lw + 24, floorT, wall)

    /* Wider “crown” body vs compact gold — equal mass set explicitly */
    const crown = Bodies.rectangle(160, 55, 48, 34, {
      frictionAir: 0.02,
      friction: 0.45,
      restitution: 0.08,
      density: 0.002,
      label: 'crown',
      render: {
        fillStyle: '#d4af37',
        strokeStyle: '#8b6914',
        lineWidth: 2,
      },
    })
    Body.setMass(crown, 5)

    const goldBar = Bodies.rectangle(620, 55, 28, 34, {
      frictionAir: 0.02,
      friction: 0.45,
      restitution: 0.08,
      density: 0.002,
      label: 'gold',
      render: {
        fillStyle: '#f0c14d',
        strokeStyle: '#a67c00',
        lineWidth: 2,
      },
    })
    Body.setMass(goldBar, 5)

    crownRef.current = crown
    goldRef.current = goldBar

    Composite.add(engine.world, [
      ground,
      leftWallL,
      leftWallR,
      leftFloor,
      rightWallL,
      rightWallR,
      rightFloor,
      crown,
      goldBar,
    ])

    const runner = Runner.create()
    Runner.run(runner, engine)
    Render.run(render)

    const mouse = Mouse.create(render.canvas)
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.24, damping: 0.08, render: { visible: false } },
    })
    Composite.add(engine.world, mc)
    render.mouse = mouse

    Events.on(render, 'afterRender', () => {
      const ctx = render.context
      ctx.globalAlpha = 0.42
      ctx.fillStyle = 'rgba(65, 140, 210, 0.55)'
      ctx.fillRect(Lcx - Lw / 2 + 4, H - 118, Lw - 8, 100)
      ctx.fillRect(Rcx - Lw / 2 + 4, H - 118, Lw - 8, 100)
      ctx.globalAlpha = 1
    })

    const tick = () => {
      const c = crownRef.current
      const g = goldRef.current
      if (c) {
        const ok =
          c.position.y > 280 &&
          c.position.x >= LEFT.xMin &&
          c.position.x <= LEFT.xMax
        setCrownPlaced(ok)
      }
      if (g) {
        const ok =
          g.position.y > 280 &&
          g.position.x >= RIGHT.xMin &&
          g.position.x <= RIGHT.xMax
        setGoldPlaced(ok)
      }
    }

    Events.on(engine, 'afterUpdate', tick)

    return () => {
      Events.off(engine, 'afterUpdate', tick)
      Events.off(render, 'afterRender')
      Render.stop(render)
      Runner.stop(runner)
      if (render.canvas?.parentNode) {
        render.canvas.remove()
      }
      Engine.clear(engine)
    }
  }, [matterOk])

  const runComparison = useCallback(() => {
    setHasCompared(true)
  }, [])

  const canCompare = crownPlaced && goldPlaced && !hasCompared

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
            The crown and a trusted gold bar were measured to the <strong>same mass</strong>. Submerge
            each in its own overflow vessel: the fake alloy crown has greater volume, so it displaces{' '}
            <strong>more</strong> water than pure gold.
          </p>
          <p className="scene-text displacement-lab-hint">
            Drag the <strong>wide crown</strong> into the <em>left</em> tank and the{' '}
            <strong>compact gold bar</strong> into the <em>right</em> tank. When both rest in the
            water, collect and compare the overflow.
          </p>
        </div>

        <div className="displacement-lab-stage-wrap">
          <div className="displacement-lab-tank-labels" aria-hidden="true">
            <span className="displacement-lab-tank-tag">Left — crown</span>
            <span className="displacement-lab-tank-tag">Right — gold bar</span>
          </div>
          <div
            ref={hostRef}
            className="displacement-lab-canvas-host"
            role="img"
            aria-label="Interactive displacement tanks with draggable crown and gold bar"
          />
          {!matterOk ? (
            <p className="displacement-lab-fallback">Loading physics…</p>
          ) : null}
        </div>

        <div className="displacement-lab-measures">
          <div className="displacement-lab-measure">
            <p className="displacement-lab-measure-kicker">Overflow from crown side</p>
            <div
              className={`displacement-lab-beaker ${crownPlaced ? 'displacement-lab-beaker--fill' : ''}`}
              style={
                {
                  '--fill': crownPlaced ? `${(DISPLACEMENT_CROWN_ML / 80) * 100}%` : '0%',
                } as CSSProperties
              }
            >
              <span className="displacement-lab-beaker-ml">
                {crownPlaced ? `${DISPLACEMENT_CROWN_ML} mL` : '—'}
              </span>
            </div>
          </div>
          <div className="displacement-lab-measure">
            <p className="displacement-lab-measure-kicker">Overflow from gold side</p>
            <div
              className={`displacement-lab-beaker ${goldPlaced ? 'displacement-lab-beaker--fill' : ''}`}
              style={
                {
                  '--fill': goldPlaced ? `${(DISPLACEMENT_GOLD_ML / 80) * 100}%` : '0%',
                } as CSSProperties
              }
            >
              <span className="displacement-lab-beaker-ml">
                {goldPlaced ? `${DISPLACEMENT_GOLD_ML} mL` : '—'}
              </span>
            </div>
          </div>
        </div>

        {hasCompared ? (
          <div className="displacement-lab-conclusion scene-text">
            <p>
              The crown displaces <strong>more</strong> water than the gold bar of equal mass — so the
              crown must be <strong>less dense</strong> than pure gold. It is not solid gold.
            </p>
          </div>
        ) : null}

        <div className="displacement-lab-actions">
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
        <div className="scene-footer-right">
          <button
            type="button"
            className="primary-button"
            disabled={!hasCompared}
            onClick={() => onNavigate('finale')}
          >
            Continue to the royal hall
          </button>
        </div>
      </footer>
    </div>
  )
}

export default DisplacementLabScene
