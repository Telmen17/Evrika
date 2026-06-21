import { type CSSProperties, type FC, useCallback, useState } from 'react'
import archimedesImg from '../assets/archimedes.png'
import bathImg from '../assets/bath.png'
import bathhouseImg from '../assets/bathhouse.jpg'
import crownSvg from '../assets/crown.svg'
import kingSitImg from '../assets/kingSit.png'
import scrollImg from '../assets/scroll.png'
import archimedesStep1 from '../assets/archimedes-step1.png'
import { useDesktopExperience } from '../hooks/useDesktopExperience'
import LandingDesktopGate from './LandingDesktopGate'

export type SceneId =
  | 'landing'
  | 'intro'
  | 'hub'
  | 'bathStory'
  | 'weigh'
  | 'melt'
  | 'waterDiscovery'
  | 'displacement'
  | 'finale'
  | 'practice'
  | 'bath'
  | 'crown'
  | 'recap'

interface LandingPageProps {
  onNavigate: (scene: SceneId) => void
  onStartJourney: () => void
  completedScenes: SceneId[]
}

const JOURNEY_STEPS: Array<{ id: SceneId; label: string; short: string }> = [
  { id: 'intro', label: 'Royal summons', short: 'I' },
  { id: 'bath', label: 'Buoyancy bath', short: 'B' },
  { id: 'crown', label: 'Crown test', short: 'C' },
  { id: 'displacement', label: 'Displacement', short: 'D' },
  { id: 'finale', label: 'Throne finale', short: 'F' },
  { id: 'recap', label: 'Recap', short: 'R' },
]

const CrownSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <path
      d="M4 22 H28 V24 H4 Z M6 22 L8 10 L12 16 L16 6 L20 16 L24 10 L26 22"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.2"
    />
  </svg>
)

const DropletSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <path
      d="M16 5 C16 5 8 16 8 21 C8 25.4 11.6 29 16 29 C20.4 29 24 25.4 24 21 C24 16 16 5 16 5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.25"
    />
  </svg>
)

const ScaleSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <line x1="16" y1="6" x2="16" y2="26" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 14 Q10 18 14 14" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
    <path d="M18 14 Q22 18 26 14" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
  </svg>
)

const ScrollSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <rect x="7" y="8" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
    <path d="M11 13 H21 M11 17 H19 M11 21 H17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

const TheatreSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <path d="M4 26 H28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M6 26 V14 C6 10 26 10 26 14 V26"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <path d="M10 26 V18 H22 V26" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)

const BeakerSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <path
      d="M10 6 H22 V14 L26 24 C27 26 25 28 23 28 H9 C7 28 5 26 6 24 L10 14 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.15"
    />
    <path d="M9 20 H23" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
  </svg>
)

const MapSymbol: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
    <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
    <circle cx="16" cy="16" r="3" fill="currentColor" fillOpacity="0.35" />
    <path d="M16 6 V10 M16 22 V26 M6 16 H10 M22 16 H26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

const LandingPage: FC<LandingPageProps> = ({
  onNavigate,
  onStartJourney,
  completedScenes,
}) => {
  const isDesktop = useDesktopExperience()
  const [gateDismissed, setGateDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('evrika-landing-desktop-gate-dismissed') === '1'
    } catch {
      return false
    }
  })
  const handleGateDismiss = useCallback(() => setGateDismissed(true), [])

  const isCompleted = (scene: SceneId) => completedScenes.includes(scene)
  const completedCount = JOURNEY_STEPS.filter((s) => isCompleted(s.id)).length

  return (
    <div
      className={`landing-page${isDesktop ? '' : ' landing-page-mobile'}${
        gateDismissed ? ' landing-page-mobile-gate-dismissed' : ''
      }`}
    >
      <section className="landing-hero-panel layout landing-reveal landing-reveal-1">
        <div className="landing-hero-visual" aria-hidden>
          <div className="landing-hero-scene">
            <div className="landing-ripple landing-ripple-1" />
            <div className="landing-ripple landing-ripple-2" />
            <div className="landing-ripple landing-ripple-3" />
            <img className="landing-hero-bath" src={bathImg} alt="" />
            <img
              className="landing-hero-archimedes landing-float"
              src={archimedesImg}
              alt=""
            />
            <img className="landing-hero-crown landing-float-delayed" src={crownSvg} alt="" />
            <div className="landing-splash landing-splash-left" />
            <div className="landing-splash landing-splash-right" />
          </div>
        </div>

        <div className="landing-hero-copy">
          <p className="hero-kicker landing-hero-kicker">Ancient Syracuse · Interactive Lesson</p>
          <div className="landing-symbol-row" aria-hidden>
            <CrownSymbol className="landing-symbol" />
            <DropletSymbol className="landing-symbol" />
            <ScaleSymbol className="landing-symbol" />
            <ScrollSymbol className="landing-symbol" />
          </div>
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

      {isDesktop ? (
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
              <button
                className="secondary-button"
                type="button"
                onClick={() => onNavigate('bath')}
              >
                Buoyancy Bath
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => onNavigate('crown')}
              >
                Crown &amp; Gold Test
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => onNavigate('practice')}
              >
                Practice problems
              </button>
            </div>
          </article>

          <article className="landing-path-card landing-path-card-progress landing-card-open landing-card-open-6">
            <div className="landing-path-icon-wrap">
              <MapSymbol className="landing-path-icon" />
            </div>
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
      ) : null}

      {!isDesktop && !gateDismissed ? (
        <LandingDesktopGate onDismiss={handleGateDismiss} />
      ) : null}
    </div>
  )
}

export default LandingPage
