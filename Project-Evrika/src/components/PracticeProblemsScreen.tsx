/**
 * PracticeProblemsScreen — optional practice problems.
 *
 * Docs: docs/components/scenes/buoyancy-bath.md
 */

import type { FC } from 'react'
import type { SceneId } from '../types/sceneId'

interface PracticeProblemsScreenProps {
  onNavigate: (scene: SceneId) => void
}

/**
 * Template for future practice: add problem list, formulas, and interactive checks here.
 */
const PracticeProblemsScreen: FC<PracticeProblemsScreenProps> = ({ onNavigate }) => {
  return (
    <div className="layout practice-problems-screen">
      <header className="practice-problems-header">
        <button className="link-button" type="button" onClick={() => onNavigate('landing')}>
          ← Menu
        </button>
        <h1 className="title practice-problems-title">Practice problems</h1>
        <p className="practice-problems-lead scene-text">
          This space is reserved for self-check questions on density, buoyancy, and displacement.
          You can add problem statements, formulas, and interactive elements in a later pass.
        </p>
      </header>

      <section className="practice-problems-placeholder" aria-label="Practice content placeholder">
        <div className="practice-problems-card">
          <h2>Problem 1 — template</h2>
          <p className="scene-text">
            Describe a scenario (e.g. two objects, same mass, different volumes). Leave space for
            student input or multiple choice.
          </p>
        </div>
        <div className="practice-problems-card">
          <h2>Problem 2 — template</h2>
          <p className="scene-text">
            Add a formula block and a numeric answer check when you are ready.
          </p>
        </div>
      </section>

      <footer className="practice-problems-footer">
        <button className="primary-button" type="button" onClick={() => onNavigate('landing')}>
          Back to menu
        </button>
      </footer>
    </div>
  )
}

export default PracticeProblemsScreen
