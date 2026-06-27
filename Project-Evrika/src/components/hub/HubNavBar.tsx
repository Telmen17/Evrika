/**
 * HubNavBar — bottom room tab strip in the exploration hub.
 *
 * Responsibility: locked/complete/active states, nav refs for celebration fly-back.
 * Docs: docs/components/hub.md
 */

import type { FC, RefObject } from 'react'
import type { NavRoomId } from '../../lib/hubRooms'
import { cn } from '../../lib/cn'
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

const navItemBase =
  'hub-nav-item relative flex min-w-[clamp(42px,11vw,56px)] cursor-pointer flex-col items-center gap-[clamp(0.04rem,0.2vh,0.1rem)] rounded-[7px] border-0 bg-transparent px-[clamp(0.22rem,0.95vw,0.4rem)] py-[clamp(0.14rem,0.65vh,0.24rem)] pb-[clamp(0.12rem,0.6vh,0.2rem)] text-hub-nav-text transition-all duration-[220ms] hover:bg-[rgba(255,220,120,0.1)] hover:text-hub-nav-hover'

export const HubNavBar: FC<HubNavBarProps> = ({
  activeRoom,
  roomCompletion,
  roomUnlocked,
  celebration,
  navRefs,
  onSwitchRoom,
}) => (
  <nav
    className="relative z-20 flex shrink-0 items-stretch justify-center gap-[clamp(0px,0.2vw,1px)] border-t-2 border-hub-nav-bar-border bg-gradient-to-b from-hub-nav-bar-top via-[#6b4f10] via-30% to-hub-nav-bar-bottom px-[clamp(0.18rem,0.9vw,0.35rem)] py-[clamp(0.08rem,0.6vh,0.18rem)] pb-[clamp(0.12rem,0.7vh,0.22rem)] shadow-[0_-3px_12px_rgba(60,40,10,0.2),inset_0_1px_0_rgba(255,220,120,0.15)]"
    aria-label="Room navigation"
  >
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
          className={cn(
            navItemBase,
            isActive && 'hub-nav-item--active scale-[1.01] bg-[rgba(255,220,120,0.18)] text-hub-nav-active',
            isComplete && 'hub-nav-item--complete',
            !isUnlocked && 'hub-nav-item--locked',
          )}
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
            <Icon className="hub-nav-icon h-[clamp(18px,3.1vw,24px)] w-[clamp(18px,3.1vw,24px)] shrink-0" />
            {!isUnlocked ? (
              <span className="hub-nav-lock" aria-hidden>
                <LockIcon className="hub-nav-lock-icon" />
              </span>
            ) : null}
            {isComplete ? (
              <span
                className={cn('hub-nav-check', isFlying && 'hub-nav-check--pending')}
                aria-label="Room complete"
              >
                <CheckIcon className="hub-nav-check-mark" />
              </span>
            ) : null}
          </span>
          <span className="hub-nav-label text-center text-[clamp(0.42rem,1.05vw,0.54rem)] font-semibold leading-[1.05] tracking-wide whitespace-nowrap">
            {room.label}
          </span>
        </button>
      )
    })}
  </nav>
)
