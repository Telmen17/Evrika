/**
 * HubCelebrationOverlay — full-screen room complete/unlock celebration portal.
 *
 * Responsibility: burst animation, fly-back to nav slot, unlock chains overlay.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import { type CSSProperties, type FC } from 'react'
import { createPortal } from 'react-dom'
import { roomCompleteHeading, roomUnlockHeading } from '../../lib/hubRooms'
import { CheckIcon, HubUnlockChains } from './hubNavIcons'
import type { RoomDef } from './hubNavIcons'
import type { CelebrationState } from './useHubCelebrations'

export interface HubCelebrationOverlayProps {
  celebration: CelebrationState
  celebratingRoomDef: RoomDef
  onCelebrationEnd: () => void
}

export const HubCelebrationOverlay: FC<HubCelebrationOverlayProps> = ({
  celebration,
  celebratingRoomDef,
  onCelebrationEnd,
}) =>
  createPortal(
    <div
      className={`hub-completion-celebration${
        celebration.kind === 'unlock' ? ' hub-completion-celebration--unlock' : ''
      }`}
      aria-live="polite"
      style={
        {
          '--fly-dx': `${celebration.dx}px`,
          '--fly-dy': `${celebration.dy}px`,
        } as CSSProperties
      }
    >
      <div
        key={`${celebration.kind}-${celebration.room}`}
        className={`hub-completion-burst${
          celebration.kind === 'unlock' ? ' hub-completion-burst--unlock' : ''
        }`}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget) onCelebrationEnd()
        }}
      >
        <span className="hub-completion-stage">
          <span className="hub-completion-glow" aria-hidden />
          <span className="hub-completion-rays" aria-hidden />
          <span
            className={`hub-completion-icon-wrap${
              celebration.kind === 'unlock' ? ' hub-completion-icon-wrap--unlock' : ''
            }`}
          >
            {(() => {
              const Icon = celebratingRoomDef.icon
              return <Icon className="hub-completion-icon" />
            })()}
            {celebration.kind === 'unlock' ? <HubUnlockChains /> : null}
            <span
              className={`hub-completion-check${
                celebration.kind === 'unlock' ? ' hub-completion-check--unlock' : ''
              }`}
              aria-hidden
            >
              {celebration.kind === 'unlock' ? (
                <span className="hub-completion-unlock-mark">✦</span>
              ) : (
                <CheckIcon className="hub-completion-check-mark" />
              )}
            </span>
          </span>
        </span>
        <span className="hub-completion-text">
          {celebration.kind === 'unlock'
            ? roomUnlockHeading(celebratingRoomDef.label)
            : roomCompleteHeading(celebratingRoomDef.label)}
        </span>
      </div>
    </div>,
    document.body,
  )
