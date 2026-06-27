/**
 * LandingJourneyMap — milestone progress nodes on the landing path chooser.
 *
 * Docs: docs/components/landing.md
 */

import { type CSSProperties, type FC } from 'react'
import type { SceneId } from '../../types/sceneId'
import { JOURNEY_STEPS } from './landingIcons'

interface LandingJourneyMapProps {
  completedScenes: SceneId[]
}

export const LandingJourneyMap: FC<LandingJourneyMapProps> = ({ completedScenes }) => {
  const isCompleted = (scene: SceneId) => completedScenes.includes(scene)
  const completedCount = JOURNEY_STEPS.filter((s) => isCompleted(s.id)).length

  return (
    <>
      <div className="landing-journey-map" aria-label="Lesson progress">
        <div className="landing-journey-track" aria-hidden />
        {JOURNEY_STEPS.map((step, index) => {
          const done = isCompleted(step.id)
          return (
            <div
              key={step.id}
              className={`landing-journey-node${done ? ' landing-journey-node-done' : ''}`}
              style={{ '--node-index': index } as CSSProperties}
              title={step.label}
            >
              <span className="landing-journey-node-dot">{done ? '✓' : step.short}</span>
              <span className="landing-journey-node-label">{step.label}</span>
            </div>
          )
        })}
      </div>
      <p className="landing-progress-summary">
        {completedCount === 0
          ? 'Your quest has not begun — start the story to mark progress.'
          : `${completedCount} of ${JOURNEY_STEPS.length} milestones reached.`}
      </p>
    </>
  )
}
