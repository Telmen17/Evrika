/**
 * HubNavBar — bottom room tab strip in the exploration hub.
 *
 * Responsibility: locked/complete/active states, nav refs for celebration fly-back.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import type { FC, RefObject } from 'react'
import type { NavRoomId } from '../../lib/hubRooms'
import { CheckIcon, LockIcon, NAV_ROOMS } from './hubNavIcons'
import type { CelebrationState } from './useHubCelebrations'

export interface HubNavBarProps {
  activeRoom: NavRoomId
  roomCompletion: Record<NavRoomId, boolean>
  roomUnlocked: Record<NavRoomId, boolean>
  celebration: CelebrationState | null
  navRefs: RefObject<Map<NavRoomId, HTMLButtonElement | null>>
  onSwitchRoom: (room: NavRoomId) => void
}

export const HubNavBar: FC<HubNavBarProps> = ({
  activeRoom,
  roomCompletion,
  roomUnlocked,
  celebration,
  navRefs,
  onSwitchRoom,
}) => (
  <nav className="hub-nav-bar" aria-label="Room navigation">
    {NAV_ROOMS.map((room) => {
      const Icon = room.icon
      const isActive = room.id === activeRoom
      const isComplete = roomCompletion[room.id]
      const isUnlocked = roomUnlocked[room.id]
      const isFlying = celebration?.room === room.id
      return (
        <button
          key={room.id}
          ref={(el) => {
            navRefs.current.set(room.id, el)
          }}
          className={`hub-nav-item${isActive ? ' hub-nav-item--active' : ''}${
            isComplete ? ' hub-nav-item--complete' : ''
          }${!isUnlocked ? ' hub-nav-item--locked' : ''}`}
          type="button"
          disabled={!isUnlocked}
          onClick={() => onSwitchRoom(room.id)}
          data-room={room.id}
          aria-current={isActive ? 'page' : undefined}
          aria-disabled={!isUnlocked}
          title={
            !isUnlocked
              ? 'Complete earlier rooms to unlock this experiment'
              : room.label
          }
        >
          <span className="hub-nav-icon-wrap">
            <Icon className="hub-nav-icon" />
            {!isUnlocked ? (
              <span className="hub-nav-lock" aria-hidden>
                <LockIcon className="hub-nav-lock-icon" />
              </span>
            ) : null}
            {isComplete ? (
              <span
                className={`hub-nav-check${isFlying ? ' hub-nav-check--pending' : ''}`}
                aria-label="Room complete"
              >
                <CheckIcon className="hub-nav-check-mark" />
              </span>
            ) : null}
          </span>
          <span className="hub-nav-label">{room.label}</span>
        </button>
      )
    })}
  </nav>
)
