/**
 * hubNavIcons — hub nav SVG icons and room definitions.
 *
 * Responsibility: ScaleIcon, FlameIcon, NAV_ROOMS, OBJECTIVE_TEXT, RoomDef, lock/check icons.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import type { FC } from 'react'
import type { NavRoomId } from '../../lib/hubRooms'

export interface RoomDef {
  id: NavRoomId
  label: string
  icon: FC<{ className?: string }>
}

export const ScaleIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="32" y1="10" x2="32" y2="54" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="12" y1="10" x2="52" y2="10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="24" y1="54" x2="40" y2="54" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="12" y1="10" x2="8" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <line x1="12" y1="10" x2="16" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M5 30 Q12 38 19 30" stroke="currentColor" strokeWidth="2.5" fill="#e8b84a" fillOpacity="0.35" strokeLinecap="round" />
    <line x1="52" y1="10" x2="48" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <line x1="52" y1="10" x2="56" y2="28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M45 28 Q52 36 59 28" stroke="currentColor" strokeWidth="2.5" fill="#e8b84a" fillOpacity="0.35" strokeLinecap="round" />
  </svg>
)

export const FlameIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M32 6 C32 6 18 22 18 36 C18 44.8 24.3 52 32 52 C39.7 52 46 44.8 46 36 C46 22 32 6 32 6Z"
      fill="#f59e0b" fillOpacity="0.45" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"
    />
    <path
      d="M32 24 C32 24 25 32 25 38 C25 42.4 28.1 46 32 46 C35.9 46 39 42.4 39 38 C39 32 32 24 32 24Z"
      fill="#ef4444" fillOpacity="0.5" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"
    />
    <rect x="14" y="52" width="36" height="6" rx="2" fill="#78716c" fillOpacity="0.5" stroke="currentColor" strokeWidth="2.5" />
  </svg>
)

export const BeakerIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 8 L20 28 L12 50 C11 53 13 56 16 56 L48 56 C51 56 53 53 52 50 L44 28 L44 8"
      stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
    />
    <line x1="16" y1="8" x2="48" y2="8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M16 38 L48 38 L52 50 C53 53 51 56 48 56 L16 56 C13 56 11 53 12 50 Z" fill="#3b82f6" fillOpacity="0.3" />
    <path d="M18 38 Q26 42 32 38 Q38 34 46 38" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
)

export const FlaskIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24 8 L24 24 L10 50 C8 54 11 58 15 58 L49 58 C53 58 56 54 54 50 L40 24 L40 8"
      stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
    />
    <line x1="20" y1="8" x2="44" y2="8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M14 42 L50 42 L54 50 C56 54 53 58 49 58 L15 58 C11 58 8 54 10 50 Z" fill="#3b82f6" fillOpacity="0.3" />
    <path
      d="M50 42 Q54 38 56 34 Q58 30 54 30 Q50 30 52 34"
      fill="#3b82f6" fillOpacity="0.25" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"
    />
    <path
      d="M52 34 Q56 30 54 26 Q52 22 50 26"
      fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"
    />
    <line x1="18" y1="36" x2="46" y2="36" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
  </svg>
)

export const ScrollIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18 10h28c2 0 4 2 4 4v44c0 2-2 4-4 4H18c-2 0-4-2-4-4V14c0-2 2-4 4-4z"
      fill="#faf3e0"
      fillOpacity="0.45"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    <path d="M26 22h20M26 30h20M26 38h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
    <path d="M44 48l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

export const CrownIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 44 L14 18 L24 32 L32 12 L40 32 L50 18 L56 44 Z"
      fill="#f59e0b" fillOpacity="0.4" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
    />
    <rect x="8" y="44" width="48" height="8" rx="2" fill="#f59e0b" fillOpacity="0.35" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    <circle cx="14" cy="18" r="3" fill="#f59e0b" stroke="currentColor" strokeWidth="2" />
    <circle cx="32" cy="12" r="3" fill="#f59e0b" stroke="currentColor" strokeWidth="2" />
    <circle cx="50" cy="18" r="3" fill="#f59e0b" stroke="currentColor" strokeWidth="2" />
  </svg>
)

export const CheckIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const LockIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
    <path
      d="M8 11V8a4 4 0 118 0v3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

/** Chains + padlock overlay for the room-unlock celebration burst. */
export const HubUnlockChains: FC = () => (
  <span className="hub-completion-chains" aria-hidden>
    <svg className="hub-completion-chain-svg" viewBox="0 0 120 120" fill="none">
      <ellipse
        className="hub-completion-chain-link hub-completion-chain-link--left"
        cx="28"
        cy="60"
        rx="16"
        ry="20"
        stroke="currentColor"
        strokeWidth="4"
      />
      <ellipse
        className="hub-completion-chain-link hub-completion-chain-link--right"
        cx="92"
        cy="60"
        rx="16"
        ry="20"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="hub-completion-chain-bar"
        d="M36 60 H84"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
    <span className="hub-completion-chain-lock">
      <LockIcon className="hub-completion-chain-lock-icon" />
    </span>
  </span>
)

/** Nav-bar rooms only — the bath plays as a story cutscene, not a tab. */
export const NAV_ROOMS: RoomDef[] = [
  { id: 'weigh', label: 'Weighing Chamber', icon: ScaleIcon },
  { id: 'furnace', label: 'Furnace', icon: FlameIcon },
  { id: 'waterLab', label: 'Water Lab', icon: BeakerIcon },
  { id: 'overflow', label: 'Overflow Lab', icon: FlaskIcon },
  { id: 'archimedes', label: "Archimedes' room", icon: ScrollIcon },
  { id: 'throne', label: 'Throne Room', icon: CrownIcon },
]

export const OBJECTIVE_TEXT =
  "King Hiero suspects his crown is not pure gold. Explore each room to find a way to test it \u2014 without destroying the crown!"
