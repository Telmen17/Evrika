/**
 * LandingPathsSection — desktop “Enter Syracuse” path chooser cards.
 *
 * Docs: docs/components/landing.md
 */

import type { FC } from 'react'
import archimedesStep1 from '../../assets/archimedes-step1.png'
import bathImg from '../../assets/bath.png'
import crownSvg from '../../assets/crown.svg'
import type { SceneId } from '../../types/sceneId'
import { BeakerSymbol, MapSymbol, TheatreSymbol } from './landingIcons'
import { LandingJourneyMap } from './LandingJourneyMap'

interface LandingPathsSectionProps {
  completedScenes: SceneId[]
  onNavigate: (scene: SceneId) => void
}

export const LandingPathsSection: FC<LandingPathsSectionProps> = ({
  completedScenes,
  onNavigate,
}) => (
  <section
    className="landing-paths layout landing-reveal landing-reveal-3"
    aria-labelledby="landing-paths-heading"
  >
    <header className="landing-section-head">
      <p className="landing-section-kicker">Choose your path</p>
      <h2 id="landing-paths-heading" className="landing-section-title">
        Enter Syracuse
      </h2>
    </header>

    <div className="landing-path-grid">
      <article className="landing-path-card landing-card-open landing-card-open-4">
        <div className="landing-path-icon-wrap">
          <TheatreSymbol className="landing-path-icon" />
        </div>
        <div className="landing-path-thumb">
          <img src={archimedesStep1} alt="" />
        </div>
        <h3>Story Journey</h3>
        <p>From the throne room to the cry of &quot;Eureka!&quot; — six cinematic chapters.</p>
        <button
          className="secondary-button wide-button landing-path-button"
          type="button"
          onClick={() => onNavigate('intro')}
        >
          Enter the Story
        </button>
      </article>

      <article className="landing-path-card landing-card-open landing-card-open-5">
        <div className="landing-path-icon-wrap">
          <BeakerSymbol className="landing-path-icon" />
        </div>
        <div className="landing-path-thumb landing-path-thumb-lab">
          <img src={bathImg} alt="" className="landing-path-thumb-bath" />
          <img src={crownSvg} alt="" className="landing-path-thumb-crown" />
        </div>
        <h3>Experiments Lab</h3>
        <p>Jump straight into buoyancy, density, and the gold crown test.</p>
        <div className="menu-actions landing-path-actions">
          <button className="secondary-button" type="button" onClick={() => onNavigate('bath')}>
            Buoyancy Bath
          </button>
          <button className="secondary-button" type="button" onClick={() => onNavigate('crown')}>
            Crown &amp; Gold Test
          </button>
          <button className="secondary-button" type="button" onClick={() => onNavigate('practice')}>
            Practice problems
          </button>
        </div>
      </article>

      <article className="landing-path-card landing-path-card-progress landing-card-open landing-card-open-6">
        <div className="landing-path-icon-wrap">
          <MapSymbol className="landing-path-icon" />
        </div>
        <LandingJourneyMap completedScenes={completedScenes} />
        <button
          className="secondary-button wide-button menu-progress-practice"
          type="button"
          onClick={() => onNavigate('practice')}
        >
          Practice problems
        </button>
      </article>
    </div>
  </section>
)
