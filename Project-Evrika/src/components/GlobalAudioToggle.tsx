/**
 * GlobalAudioToggle — app-wide mute control (hidden on landing).
 *
 * Docs: docs/components/audio.md
 */

import type { FC } from 'react'
import { cn } from '../lib/cn'
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
      className={cn(
        'fixed z-[1100] flex h-[2.65rem] w-[2.65rem] items-center justify-center rounded-xl border-2 border-[rgba(120,80,30,0.45)] p-0 shadow-[0_3px_14px_rgba(60,40,10,0.18)] transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-px hover:border-[rgba(184,134,11,0.65)] hover:shadow-[0_5px_18px_rgba(80,50,10,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(214,145,35,0.95)]',
        'top-[max(var(--frame-safe-top),env(safe-area-inset-top))] right-[max(var(--frame-safe-x),env(safe-area-inset-right))]',
        audioEnabled
          ? 'bg-gradient-to-b from-[#fff9ec] to-[#f0ddb8] text-audio-ink'
          : 'bg-gradient-to-b from-[#f5f0e8] to-[#e8dcc8] text-audio-muted',
      )}
      onClick={toggleAudioEnabled}
      aria-pressed={audioEnabled}
      aria-label={audioEnabled ? 'Sound on — tap to mute narration' : 'Sound off — tap to unmute'}
      title={audioEnabled ? 'Mute narration & voice' : 'Unmute narration & voice'}
    >
      <span className="relative flex h-[1.45rem] w-[1.45rem] items-center justify-center" aria-hidden>
        <svg
          className="block h-full w-full"
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
            className="pointer-events-none absolute -inset-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)]"
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
