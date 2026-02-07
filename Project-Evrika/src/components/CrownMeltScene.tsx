import type { FC } from 'react'
import { useState } from 'react'
import type { SceneId } from './LandingPage'

interface CrownMeltSceneProps {
  onNavigate: (scene: SceneId) => void
}

type MeltPhase = 'before' | 'after'

const CrownMeltScene: FC<CrownMeltSceneProps> = ({ onNavigate }) => {
  const [phase, setPhase] = useState<MeltPhase>('before')

  const handleMelt = () => {
    setPhase('after')
  }

  const canContinue = phase === 'after'

  return (
    <div className="scene">
      <header className="scene-header">
        <button
          className="link-button"
          type="button"
          onClick={() => onNavigate('weigh')}
        >
          ← Back to weighing test
        </button>
        <h2>Test 2 – The Forbidden Furnace</h2>
      </header>

      <section className="scene-body experiment-layout">
        <div className="experiment-controls">
          <h3>Reshape the problem</h3>
          <p className="scene-text">
            Archimedes imagines a bold solution: if he could melt the crown into a simple block,
            he could measure its volume and calculate its density exactly.
          </p>

          <p className="helper-text">
            In theory, this would reveal any hidden silver. But the king has ordered that the crown
            must not be harmed.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={handleMelt}
          >
            {phase === 'before' ? 'Imagine melting the crown' : 'Replay the thought experiment'}
          </button>

          <div className="helper-text">
            {phase === 'before' ? (
              <>
                Before you imagine the furnace, think: would reshaping the crown change its mass?
                What new information would its volume give you?
              </>
            ) : (
              <>
                Density is mass divided by volume. Melting the crown into a regular shape would let
                Archimedes compute its density and compare it to pure gold. The physics is sound—
                but the politics are impossible.
              </>
            )}
          </div>
        </div>

        <div className="experiment-canvas crown-melt-canvas">
          <div className={`crown-melt-stage ${phase === 'after' ? 'crown-melt-stage-after' : ''}`}>
            <div className="crown-melt-furnace">
              <div className="crown-melt-flame" />
            </div>
            <div className="crown-melt-row">
              <div className="crown-melt-crown">
                <div className="crown-melt-icon crown-melt-icon-crown" />
                <div className="crown-melt-label">Royal crown</div>
              </div>
              <div className="crown-melt-arrow">➜</div>
              <div className="crown-melt-block">
                <div className="crown-melt-icon crown-melt-icon-block" />
                <div className="crown-melt-label">Gold block (same mass)</div>
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
            onClick={() => onNavigate('weigh')}
          >
            Back to weighing test
          </button>
        </div>
        <div className="scene-footer-right">
          <button
            className="primary-button"
            type="button"
            onClick={() => onNavigate('bathStory')}
            disabled={!canContinue}
          >
            Continue to the bath story
          </button>
        </div>
      </footer>
    </div>
  )
}

export default CrownMeltScene

