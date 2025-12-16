import type { FC } from 'react'
import type { SceneId } from './LandingPage'
import CrownSceneCanvas from './Three/CrownSceneCanvas'

interface CrownDensitySceneProps {
  onNavigate: (scene: SceneId) => void
}

const PURE_GOLD_DENSITY = 19.3

const CrownDensityScene: FC<CrownDensitySceneProps> = ({ onNavigate }) => {
  const [goldPercent, setGoldPercent] = useState(100)

  const fraction = goldPercent / 100
  const crownDensity = PURE_GOLD_DENSITY * fraction + 8 * (1 - fraction)

  const referenceVolume = 1
  const referenceMass = PURE_GOLD_DENSITY * referenceVolume
  const referenceDisplacement = referenceVolume

  const crownMass = referenceMass
  const crownVolume = crownMass / crownDensity
  const crownDisplacement = crownVolume

  const mismatch = Math.abs(crownDisplacement - referenceDisplacement)
  const isSuspicious = mismatch > referenceDisplacement * 0.05

  const scaledBarDisp = Math.min(1, referenceDisplacement / 2)
  const scaledCrownDisp = Math.min(1, crownDisplacement / 2)

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
        <h2>Crown vs Gold: Density Comparison</h2>
      </header>

      <section className="scene-body experiment-layout">
        <div className="experiment-controls">
          <h3>Crown composition</h3>
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={goldPercent}
            onChange={(e) => setGoldPercent(Number(e.target.value))}
          />
          <div className="slider-label">
            Gold content: <strong>{goldPercent}%</strong>
          </div>

          <div className="metrics">
            <div>
              Reference gold density:{' '}
              <strong>{PURE_GOLD_DENSITY.toFixed(1)} mass / volume</strong>
            </div>
            <div>
              Crown effective density:{' '}
              <strong>{crownDensity.toFixed(1)} mass / volume</strong>
            </div>
            <div>
              Reference displacement:{' '}
              <strong>{referenceDisplacement.toFixed(2)} units</strong>
            </div>
            <div>
              Crown displacement:{' '}
              <strong>{crownDisplacement.toFixed(2)} units</strong>
            </div>
            <div>
              Verdict:{' '}
              <strong className={isSuspicious ? 'text-warning' : 'text-success'}>
                {isSuspicious ? 'Something is off…' : 'Matches pure gold closely'}
              </strong>
            </div>
          </div>

          <p className="helper-text">
            Archimedes compares how much water is displaced by a known bar of pure gold
            and by the crown. If the crown displaces more water for the same mass, it
            means it has lower density and likely contains cheaper metals.
          </p>
        </div>

        <div className="experiment-canvas">
          <CrownSceneCanvas
            crownDisplacement={scaledCrownDisp}
            barDisplacement={scaledBarDisp}
          />
        </div>
      </section>

      <footer className="scene-footer">
        <div className="scene-footer-left">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onNavigate('bath')}
          >
            Back to buoyancy bath
          </button>
        </div>
        <div className="scene-footer-right">
          <button
            className="primary-button"
            type="button"
            onClick={() => onNavigate('recap')}
          >
            Continue to Recap
          </button>
        </div>
      </footer>
    </div>
  )
}

export default CrownDensityScene


