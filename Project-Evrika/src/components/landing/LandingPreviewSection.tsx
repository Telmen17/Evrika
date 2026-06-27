/**
 * LandingPreviewSection — “What awaits inside” sneak-peek cards.
 *
 * Docs: docs/components/landing.md
 */

import type { FC } from 'react'
import archimedesStep1 from '../../assets/archimedes-step1.png'
import bathImg from '../../assets/bath.png'
import bathhouseImg from '../../assets/bathhouse.jpg'
import crownSvg from '../../assets/crown.svg'
import kingSitImg from '../../assets/kingSit.png'
import scrollImg from '../../assets/scroll.png'

export const LandingPreviewSection: FC = () => (
  <section
    className="landing-preview layout landing-reveal landing-reveal-2"
    aria-labelledby="landing-preview-heading"
  >
    <header className="landing-section-head">
      <p className="landing-section-kicker">Sneak peek</p>
      <h2 id="landing-preview-heading" className="landing-section-title">
        What awaits inside
      </h2>
    </header>
    <div className="landing-preview-grid">
      <article className="landing-preview-card landing-card-open landing-card-open-1">
        <div className="landing-preview-art landing-preview-art-court">
          <img src={kingSitImg} alt="" className="landing-preview-photo landing-preview-photo-king" />
          <img src={archimedesStep1} alt="" className="landing-preview-photo landing-preview-photo-arch" />
        </div>
        <h3>Royal court drama</h3>
        <p>Narrated beats with King Hiero, the blacksmith, and Archimedes summoned to prove the crown.</p>
      </article>
      <article className="landing-preview-card landing-card-open landing-card-open-2">
        <div className="landing-preview-art landing-preview-art-bath">
          <img src={bathhouseImg} alt="" className="landing-preview-bg" />
          <img src={bathImg} alt="" className="landing-preview-photo landing-preview-photo-bath" />
        </div>
        <h3>The Eureka bath</h3>
        <p>Play with water displacement and buoyancy in tactile simulations inspired by the famous tub.</p>
      </article>
      <article className="landing-preview-card landing-card-open landing-card-open-3">
        <div className="landing-preview-art">
          <img src={crownSvg} alt="" className="landing-preview-icon landing-preview-icon-crown" />
          <img src={scrollImg} alt="" className="landing-preview-photo landing-preview-photo-scroll" />
        </div>
        <h3>Prove the fraud</h3>
        <p>Weigh, melt, and compare — uncover whether silver was mixed into the royal gold.</p>
      </article>
    </div>
  </section>
)
