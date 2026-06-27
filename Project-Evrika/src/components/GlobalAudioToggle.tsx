/**
 * GlobalAudioToggle — app-wide mute control (hidden on landing).
 *
 * Docs: docs/components/audio.md
 */

import type { FC } from 'react'
import { useGlobalAudio } from '../context/GlobalAudioContext'

interface GlobalAudioToggleProps {
  visible: boolean
}

/**
 * Fixed-corner control: sound on (speaker) vs muted (speaker + red strike).
 * Inline SVGs — no image assets required.
 */
export const GlobalAudioToggle: FC<GlobalAudioToggleProps> = ({ visible }) => {
  const { audioEnabled, toggleAudioEnabled } = useGlobalAudio()

  if (!visible) return null

  return (
    <button
      type="button"
      className={`global-audio-toggle${audioEnabled ? '' : ' global-audio-toggle--muted'}`}
      onClick={toggleAudioEnabled}
      aria-pressed={audioEnabled}
      aria-label={audioEnabled ? 'Sound on — tap to mute narration' : 'Sound off — tap to unmute'}
      title={audioEnabled ? 'Mute narration & voice' : 'Unmute narration & voice'}
    >
      <span className="global-audio-toggle__icon-wrap" aria-hidden>
        <svg
          className="global-audio-toggle__speaker"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 5L6 9H3v6h3l5 4V5z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M15.5 8.5c1.5 1.2 2.5 3 2.5 5s-1 3.8-2.5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M17.5 6.5c2.2 1.8 3.5 4.4 3.5 7s-1.3 5.2-3.5 7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
        </svg>
        {!audioEnabled ? (
          <svg
            className="global-audio-toggle__mute-line"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <line x1="4" y1="4" x2="20" y2="20" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : null}
      </span>
    </button>
  )
}
