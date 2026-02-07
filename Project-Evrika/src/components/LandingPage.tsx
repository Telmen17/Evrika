import type { FC } from 'react'

export type SceneId =
  | 'landing'
  | 'intro'
  | 'bathStory'
  | 'weigh'
  | 'melt'
  | 'bath'
  | 'crown'
  | 'recap'

interface LandingPageProps {
  onNavigate: (scene: SceneId) => void
  completedScenes: SceneId[]
}

const LandingPage: FC<LandingPageProps> = ({ onNavigate, completedScenes }) => {
  const isCompleted = (scene: SceneId) => completedScenes.includes(scene)

  return (
    <div className="layout landing-hero">
      <header className="header hero">
        <p className="hero-kicker">Ancient Syracuse • Interactive Lesson</p>
        <h1 className="title hero-title">Evrika — Archimedes&apos; Eureka Quest</h1>
        <p className="subtitle hero-subtitle">
          Step into a storybook-meets-arcade take on the classic Eureka moment. Learn buoyancy and
          density through playful simulations, narrated beats, and Greek-inspired visuals.
        </p>
        <button
          className="start-button"
          type="button"
          onClick={() => onNavigate('intro')}
        >
          Start the Journey
        </button>
        <p className="hero-note">
          No signup needed — just launch the story, then dive into experiments on buoyancy and the
          gold crown test.
        </p>
      </header>

      <main className="menu-grid">
        <section className="menu-card">
          <h2>Story Journey</h2>
          <p>Follow Archimedes from the king&apos;s puzzle to the famous cry of &quot;Eureka!&quot;</p>
          <button
            className="secondary-button wide-button"
            type="button"
            onClick={() => onNavigate('intro')}
          >
            Enter the Story
          </button>
        </section>

        <section className="menu-card">
          <h2>Experiments Lab</h2>
          <p>Jump straight into interactive simulations inspired by the Eureka moment.</p>
          <div className="menu-actions">
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
          </div>
        </section>

        <section className="menu-card">
          <h2>Progress</h2>
          <ul className="progress-list">
            <li className={isCompleted('intro') ? 'done' : ''}>Story intro</li>
            <li className={isCompleted('bath') ? 'done' : ''}>Buoyancy bath</li>
            <li className={isCompleted('crown') ? 'done' : ''}>Crown comparison</li>
            <li className={isCompleted('recap') ? 'done' : ''}>Recap &amp; knowledge check</li>
          </ul>
        </section>
      </main>
    </div>
  )
}

export default LandingPage


