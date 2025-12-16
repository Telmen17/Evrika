import type { FC } from 'react'
import type { SceneId } from './LandingPage'

interface RecapScreenProps {
  onNavigate: (scene: SceneId) => void
}

const questions = [
  {
    id: 'q1',
    prompt: 'What key quantity does water displacement reveal?',
    options: ['Mass', 'Volume', 'Temperature'],
    correctIndex: 1,
  },
  {
    id: 'q2',
    prompt: 'Why did Archimedes compare the crown to a known bar of gold?',
    options: [
      'To check the color',
      'To compare densities via displacement',
      'To see which one looked better',
    ],
    correctIndex: 1,
  },
]

const RecapScreen: FC<RecapScreenProps> = ({ onNavigate }) => {
  const [answers, setAnswers] = useState<Record<string, number | null>>({
    q1: null,
    q2: null,
  })

  const handleAnswer = (id: string, index: number) => {
    setAnswers((prev) => ({ ...prev, [id]: index }))
  }

  const allAnswered = questions.every((q) => answers[q.id] !== null)

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
        <h2>Recap &amp; Knowledge Check</h2>
      </header>

      <section className="scene-body">
        <div className="scene-text">
          <h3>What you discovered</h3>
          <ul>
            <li>Water displacement reveals an object&apos;s volume.</li>
            <li>Density links mass and volume: more mass in less volume means higher density.</li>
            <li>
              By comparing displacement of a known gold bar and a crown of equal mass, Archimedes
              could tell if cheaper metals were hiding inside.
            </li>
          </ul>

          <h3>Quick questions</h3>
          {questions.map((q) => (
            <div key={q.id} className="question-block">
              <p>{q.prompt}</p>
              <div className="pill-group">
                {q.options.map((opt, idx) => {
                  const selected = answers[q.id] === idx
                  const correct = q.correctIndex === idx
                  const isAnswered = answers[q.id] !== null
                  const classNames = ['pill-button']

                  if (selected) classNames.push('pill-button-active')
                  if (isAnswered && selected && correct) classNames.push('text-success')
                  if (isAnswered && selected && !correct) classNames.push('text-warning')

                  return (
                    <button
                      key={opt}
                      type="button"
                      className={classNames.join(' ')}
                      onClick={() => handleAnswer(q.id, idx)}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="scene-visual-placeholder">
          <p className="scene-visual-caption">
            Great work! You&apos;ve walked alongside Archimedes from a royal puzzle to a Eureka
            moment. Feel free to revisit any experiment from the main menu.
          </p>
        </div>
      </section>

      <footer className="scene-footer">
        <div className="scene-footer-left">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onNavigate('crown')}
          >
            Back to crown experiment
          </button>
        </div>
        <div className="scene-footer-right">
          <button
            className="primary-button"
            type="button"
            onClick={() => onNavigate('landing')}
          >
            Back to main menu
          </button>
        </div>
      </footer>
    </div>
  )
}

export default RecapScreen


