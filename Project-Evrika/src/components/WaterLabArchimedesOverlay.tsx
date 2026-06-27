/**
 * WaterLabArchimedesOverlay — mentor overlay moods in the water lab.
 *
 * Docs: docs/components/scenes/water-discovery.md
 */

import type { FC } from 'react'
import archimedesImg from '../assets/archimedes.png'
import headImg from '../assets/head.png'

export type WaterLabMentorMood = 'idle' | 'stuck' | 'watching' | 'curious' | 'eureka'

export type WaterLabArchPresentation = 'icon' | 'emote'

interface WaterLabArchimedesOverlayProps {
  mood: WaterLabMentorMood
  line: string | null
  presentation: WaterLabArchPresentation
  speaking: boolean
  onDismiss?: () => void
}

/**
 * Layered narrator: small head dock on the lab module; expands to full Archimedes
 * for emote beats, then collapses back so the experiment stays center stage.
 */
export const WaterLabArchimedesOverlay: FC<WaterLabArchimedesOverlayProps> = ({
  mood,
  line,
  presentation,
  speaking,
  onDismiss,
}) => {
  const isEmote = presentation === 'emote'
  const showBubble = isEmote && speaking && line

  return (
    <div
      className={`archimedes-companion water-lab-arch water-lab-arch--${presentation} water-lab-arch--${mood}${
        showBubble ? ' water-lab-arch--speaking' : ''
      }`}
      aria-live="polite"
    >
      <div className="archimedes-companion__dock">
        {showBubble ? (
          <div className="water-lab-arch__bubble">
            <p className="water-lab-arch__line">{line}</p>
            {onDismiss ? (
              <button
                type="button"
                className="water-lab-arch__dismiss"
                onClick={onDismiss}
                aria-label="Dismiss"
              >
                ×
              </button>
            ) : null}
          </div>
        ) : null}

        {isEmote ? (
          <div className="water-lab-arch__emote-anchor" aria-hidden={false}>
            <span className="water-lab-arch__aura" />
            <span className="water-lab-arch__emote-wrap">
              <img src={archimedesImg} alt="" className="water-lab-arch__figure" draggable={false} />
              <span className="water-lab-arch__mood-glow" />
            </span>
          </div>
        ) : (
          <div className="archimedes-companion__head-btn water-lab-arch__head-btn" aria-label="Archimedes">
            <span className="archimedes-companion__head-aura" aria-hidden />
            <span className="archimedes-companion__head-bob" aria-hidden>
              <span className="archimedes-companion__head-ring">
                <img
                  src={headImg}
                  alt=""
                  className="archimedes-companion__head-img"
                  width={56}
                  height={56}
                  draggable={false}
                />
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
