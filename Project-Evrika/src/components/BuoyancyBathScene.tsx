import type { FC } from 'react'
import type { SceneId } from './LandingPage'
import BathSceneCanvas from './Three/BathSceneCanvas'

type MaterialId = 'wood' | 'stone' | 'gold'

interface MaterialConfig {
  id: MaterialId
  label: string
  density: number // relative to water (=1)
}

const MATERIALS: MaterialConfig[] = [
  { id: 'wood', label: 'Wood block', density: 0.6 },
  { id: 'stone', label: 'Stone block', density: 2.3 },
  { id: 'gold', label: 'Gold block', density: 19.3 },
]

interface BuoyancyBathSceneProps {
  onNavigate: (scene: SceneId) => void
}

const BuoyancyBathScene: FC<BuoyancyBathSceneProps> = ({ onNavigate }) => {
  const [materialId, setMaterialId] = useState<MaterialId>('wood')
  const [volume, setVolume] = useState(1) // relative volume units

  const material = MATERIALS.find((m) => m.id === materialId) ?? MATERIALS[0]

  const displacedVolume = volume
  const mass = material.density * volume
  const density = material.density
  const floats = density < 1

  const waterLevel = Math.min(1, displacedVolume / 5)

  return (
    <div className="scene">
      <header className="scene-header">
        <button
          className="link-button"
          type="button"
          onClick={() => onNavigate('landing')}
        >
          ← Back to menu
        </button>
        <h2>Buoyancy Bath Experiment</h2>
      </header>

      <section className="scene-body experiment-layout">
        <div className="experiment-controls">
          <h3>Choose material</h3>
          <div className="pill-group">
            {MATERIALS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={
                  m.id === materialId ? 'pill-button pill-button-active' : 'pill-button'
                }
                onClick={() => setMaterialId(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <h3>Object size</h3>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
          <div className="slider-label">
            Relative volume: <strong>{volume.toFixed(1)}</strong>
          </div>

          <div className="metrics">
            <div>
              Density vs water: <strong>{density.toFixed(1)} × water</strong>
            </div>
            <div>
              Displaced volume: <strong>{displacedVolume.toFixed(1)} units</strong>
            </div>
            <div>
              Estimated mass: <strong>{mass.toFixed(1)} units</strong>
            </div>
            <div>
              Outcome:{' '}
              <strong className={floats ? 'text-success' : 'text-warning'}>
                {floats ? 'Floats (buoyant)' : 'Sinks (too dense)'}
              </strong>
            </div>
          </div>

          <p className="helper-text">
            Try lighter and heavier materials. Notice how the water level responds only to
            volume, while whether an object floats depends on how dense it is compared to
            water.
          </p>
        </div>

        <div className="experiment-canvas">
          <BathSceneCanvas waterLevel={waterLevel} />
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
            onClick={() => onNavigate('crown')}
          >
            Continue to Crown Experiment
          </button>
        </div>
      </footer>
    </div>
  )
}

export default BuoyancyBathScene


