/**
 * LandingHero — landing page hero panel (bath stack, Rive, CTA).
 *
 * Responsibility: hero visual + copy; desktop start button vs mobile callout.
 * Docs: docs/components/landing.md
 */

import type { FC } from 'react'
import bathBackImg from '../../assets/bath-back.png'
import bathFrontImg from '../../assets/bath-front.png'
import crownSvg from '../../assets/crown.svg'
import LandingArchimedesRive from '../LandingArchimedesRive'
import { HeroSymbolRow } from './landingIcons'

interface LandingHeroProps {
  isDesktop: boolean
  onStartJourney: () => void
}

export const LandingHero: FC<LandingHeroProps> = ({ isDesktop, onStartJourney }) => (
  <section className="landing-hero-panel layout landing-reveal landing-reveal-1">
    <div className="landing-hero-visual" aria-hidden>
      <div className="landing-hero-scene">
        <div className="landing-ripple landing-ripple-1" />
        <div className="landing-ripple landing-ripple-2" />
        <div className="landing-ripple landing-ripple-3" />
        <div className="landing-hero-bath-stack">
          <img className="landing-hero-bath landing-hero-bath--back" src={bathBackImg} alt="" />
          <div className="landing-hero-archimedes-wrap">
            <LandingArchimedesRive />
          </div>
          <img className="landing-hero-bath landing-hero-bath--front" src={bathFrontImg} alt="" />
        </div>
        <img className="landing-hero-crown landing-float-delayed" src={crownSvg} alt="" />
        <div className="landing-splash landing-splash-left" />
        <div className="landing-splash landing-splash-right" />
      </div>
    </div>

    <div className="landing-hero-copy">
      <p className="hero-kicker landing-hero-kicker">Ancient Syracuse · Interactive Lesson</p>
      <HeroSymbolRow />
      <h1 className="title hero-title landing-hero-title">
        Evrika
        <span className="landing-hero-title-accent">Archimedes&apos; Eureka Quest</span>
      </h1>
      <p className="subtitle hero-subtitle landing-hero-tagline">
        Solve the king&apos;s crown mystery — without melting a single gram of gold.
      </p>
      <p className="landing-hero-blurb">
        A storybook journey through buoyancy, density, and the splash that changed science.
      </p>
      {isDesktop ? (
        <>
          <button
            className="start-button landing-cta landing-cta-primary"
            type="button"
            onClick={onStartJourney}
          >
            <span className="landing-cta-shine" aria-hidden />
            Start the Journey
          </button>
          <p className="hero-note landing-hero-note">
            No signup · narrated story · hands-on simulations · ~15 minutes
          </p>
        </>
      ) : (
        <div className="landing-mobile-callout" role="status">
          <p className="landing-mobile-callout-text">
            Play on desktop to start the journey and experience the awe!
          </p>
          <p className="landing-mobile-callout-sub">
            Scroll for a sneak peek — the full interactive lesson needs a wider screen.
          </p>
        </div>
      )}
    </div>
  </section>
)