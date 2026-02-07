import type { FC } from 'react'
import { useState, useMemo, useCallback } from 'react'
import type { SceneId } from './LandingPage'
import { useScalePhysics } from '../hooks/useScalePhysics'
import crownSvg from '../assets/crown.svg'
import nugget100Img from '../assets/goldNugget1png.png'
import nugget200Img from '../assets/goldNugget2png.png'
import nugget300Img from '../assets/goldNugget3.png'

export type ScaleItemId = 'crown' | 'nugget100' | 'nugget200' | 'nugget300'

const MASS_KG: Record<ScaleItemId, number> = {
  crown: 1.0,
  nugget100: 0.1,
  nugget200: 0.2,
  nugget300: 0.3,
}

const ITEM_LABELS: Record<ScaleItemId, string> = {
  crown: 'Crown',
  nugget100: '100 g',
  nugget200: '200 g',
  nugget300: '300 g',
}

const ITEM_IMGS: Record<ScaleItemId, string> = {
  crown: crownSvg,
  nugget100: nugget100Img,
  nugget200: nugget200Img,
  nugget300: nugget300Img,
}

interface CrownWeighSceneProps {
  onNavigate: (scene: SceneId) => void
}

function sumMass(items: ScaleItemId[]): number {
  return items.reduce((s, id) => s + MASS_KG[id], 0)
}

const DRAG_TYPE = 'application/x-evrika-scale-item'

const CrownWeighScene: FC<CrownWeighSceneProps> = ({ onNavigate }) => {
  const [leftPanItems, setLeftPanItems] = useState<ScaleItemId[]>([])
  const [rightPanItems, setRightPanItems] = useState<ScaleItemId[]>([])
  const [dragOverPan, setDragOverPan] = useState<'left' | 'right' | null>(null)

  const crownInPool =
    !leftPanItems.includes('crown') && !rightPanItems.includes('crown')

  const leftMass = useMemo(() => sumMass(leftPanItems), [leftPanItems])
  const rightMass = useMemo(() => sumMass(rightPanItems), [rightPanItems])
  const beamRef = useScalePhysics(leftMass, rightMass)

  const addToLeft = useCallback((id: ScaleItemId) => {
    if (id === 'crown' && !crownInPool) return
    setLeftPanItems((prev) => [...prev, id])
  }, [crownInPool])

  const addToRight = useCallback((id: ScaleItemId) => {
    if (id === 'crown' && !crownInPool) return
    setRightPanItems((prev) => [...prev, id])
  }, [crownInPool])

  const removeFromLeft = (index: number) => {
    setLeftPanItems((prev) => prev.filter((_, i) => i !== index))
  }

  const removeFromRight = (index: number) => {
    setRightPanItems((prev) => prev.filter((_, i) => i !== index))
  }

  const clearPans = () => {
    setLeftPanItems([])
    setRightPanItems([])
  }

  const canContinue =
    leftPanItems.length > 0 || rightPanItems.length > 0

  function handleDragStart(e: React.DragEvent, id: ScaleItemId) {
    if (id === 'crown' && !crownInPool) {
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

  function handleDropLeft(e: React.DragEvent) {
    e.preventDefault()
    setDragOverPan(null)
    const id = e.dataTransfer.getData(DRAG_TYPE) as ScaleItemId | ''
    if (id && (id === 'crown' ? crownInPool : true)) addToLeft(id)
  }

  function handleDropRight(e: React.DragEvent) {
    e.preventDefault()
    setDragOverPan(null)
    const id = e.dataTransfer.getData(DRAG_TYPE) as ScaleItemId | ''
    if (id && (id === 'crown' ? crownInPool : true)) addToRight(id)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverPan(null)
  }

  function renderItem(id: ScaleItemId, index: number, side: 'left' | 'right') {
    const label = id === 'crown' ? '1 kg' : ITEM_LABELS[id]
    return (
      <button
        key={`${side}-${id}-${index}`}
        type="button"
        className="scale-pan-item"
        onClick={() =>
          side === 'left' ? removeFromLeft(index) : removeFromRight(index)
        }
        title="Click to remove"
      >
        <img src={ITEM_IMGS[id]} alt={id} className="scale-pan-item-img" />
        <span className="scale-pan-item-mass">{label}</span>
      </button>
    )
  }

  return (
    <div className="scene">
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
        <div className="experiment-controls">
          <h3>Archimedes&apos; first idea</h3>
          <p className="scene-text">
            Drag the crown and gold nuggets onto the left or right pan. The
            crown is 1 kg; nuggets are 100 g, 200 g, and 300 g. The scale
            responds to the total mass on each side.
          </p>

          <div className="scale-toolset">
            <p className="helper-text scale-toolset-hint">
              Drag items onto a pan. Click an item on a pan to remove it.
            </p>
            <div className="scale-toolset-items">
              <div
                draggable={crownInPool}
                onDragStart={(e) => handleDragStart(e, 'crown')}
                onDragEnd={() => setDragOverPan(null)}
                className={`scale-tool-draggable ${!crownInPool ? 'scale-tool-draggable-disabled' : ''}`}
                title="Crown (1 kg) – drag to a pan"
              >
                <img src={crownSvg} alt="Crown" className="scale-tool-img" />
                <span>Crown 1 kg</span>
              </div>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, 'nugget100')}
                onDragEnd={() => setDragOverPan(null)}
                className="scale-tool-draggable"
                title="100 g – drag to a pan"
              >
                <img
                  src={nugget100Img}
                  alt="100 g nugget"
                  className="scale-tool-img"
                />
                <span>100 g</span>
              </div>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, 'nugget200')}
                onDragEnd={() => setDragOverPan(null)}
                className="scale-tool-draggable"
                title="200 g – drag to a pan"
              >
                <img
                  src={nugget200Img}
                  alt="200 g nugget"
                  className="scale-tool-img"
                />
                <span>200 g</span>
              </div>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, 'nugget300')}
                onDragEnd={() => setDragOverPan(null)}
                className="scale-tool-draggable"
                title="300 g – drag to a pan"
              >
                <img
                  src={nugget300Img}
                  alt="300 g nugget"
                  className="scale-tool-img"
                />
                <span>300 g</span>
              </div>
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

          <div className="helper-text">
            When both pans have the same total mass, the scale balances. Mass
            alone cannot reveal whether the crown is pure gold or mixed with
            silver.
          </div>
        </div>

        <div className="experiment-canvas crown-weigh-canvas">
          <div className="crown-scale">
            <div className="crown-scale-stand" />
            <div className="crown-scale-pivot" aria-hidden />
            <div
              ref={beamRef}
              className="crown-scale-beam"
              role="img"
              aria-label="Balance scale"
            >
              <div className="crown-scale-rod">
                <div className="crown-scale-rod-cap" aria-hidden />
              </div>
              <div className="crown-scale-string crown-scale-string-left">
                <div className="crown-scale-string-line" />
                <div
                  className={`crown-scale-pan crown-scale-pan-left ${dragOverPan === 'left' ? 'crown-scale-pan-drag-over' : ''}`}
                  onDragOver={(e) => {
                    handleDragOver(e)
                    setDragOverPan('left')
                  }}
                  onDrop={handleDropLeft}
                  onDragLeave={handleDragLeave}
                  role="button"
                  tabIndex={0}
                  aria-label="Left pan – drop items here"
                >
                  <div className="crown-scale-pan-total">
                    Total: {(leftMass * 1000).toFixed(0)} g
                  </div>
                  <div className="crown-scale-pan-items">
                    {leftPanItems.map((id, i) => renderItem(id, i, 'left'))}
                  </div>
                </div>
              </div>
              <div className="crown-scale-string crown-scale-string-right">
                <div className="crown-scale-string-line" />
                <div
                  className={`crown-scale-pan crown-scale-pan-right ${dragOverPan === 'right' ? 'crown-scale-pan-drag-over' : ''}`}
                  onDragOver={(e) => {
                    handleDragOver(e)
                    setDragOverPan('right')
                  }}
                  onDrop={handleDropRight}
                  onDragLeave={handleDragLeave}
                  role="button"
                  tabIndex={0}
                  aria-label="Right pan – drop items here"
                >
                  <div className="crown-scale-pan-total">
                    Total: {(rightMass * 1000).toFixed(0)} g
                  </div>
                  <div className="crown-scale-pan-items">
                    {rightPanItems.map((id, i) => renderItem(id, i, 'right'))}
                  </div>
                </div>
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
