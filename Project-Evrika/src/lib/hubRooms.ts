/**
 * hubRooms — hub navigation unlock/completion rules and copy helpers.
 *
 * Responsibility: pure functions over LessonProgress for room gating and cutscene triggers.
 * Docs: docs/lib/README.md
 * Tests: tests/frontend/unit/lib/hubRooms.test.ts
 */

import type { LessonProgress } from '../context/LessonHubContext'

/** Session flag: learner just arrived from the story intro — replay the hub guide. */
export const HUB_GUIDE_FROM_INTRO_KEY = 'evrika-hub-guide-from-intro'

/** Pause before auto-opening the hub guide so the layout can settle first. */
export const HUB_GUIDE_OPEN_DELAY_MS = 2600

/** Rooms shown in the hub nav bar (bath is a story cutscene, not a tab). */
export type NavRoomId =
  | 'weigh'
  | 'furnace'
  | 'waterLab'
  | 'overflow'
  | 'archimedes'
  | 'throne'

/** All trackable rooms including the bath cutscene. */
export type HubRoomId = NavRoomId | 'bath'

export function isWeighComplete(progress: LessonProgress): boolean {
  return progress.weigh.weighPhase === 'done'
}

export function isFurnaceComplete(progress: LessonProgress): boolean {
  return progress.melt.phase === 'done'
}

export function isEarlyInvestigationComplete(progress: LessonProgress): boolean {
  return isWeighComplete(progress) && isFurnaceComplete(progress)
}

export function isRoomUnlocked(progress: LessonProgress, room: NavRoomId): boolean {
  switch (room) {
    case 'weigh':
    case 'furnace':
      return true
    case 'waterLab':
      return isEarlyInvestigationComplete(progress)
    case 'overflow':
      return progress.bath.storyIndex >= 1
    case 'archimedes':
      return progress.overflow.hasCompared
    case 'throne':
      return progress.archimedes.proofUnlocked
    default:
      return false
  }
}

export function getNavRoomUnlockState(
  progress: LessonProgress,
): Record<NavRoomId, boolean> {
  return {
    weigh: isRoomUnlocked(progress, 'weigh'),
    furnace: isRoomUnlocked(progress, 'furnace'),
    waterLab: isRoomUnlocked(progress, 'waterLab'),
    overflow: isRoomUnlocked(progress, 'overflow'),
    archimedes: isRoomUnlocked(progress, 'archimedes'),
    throne: isRoomUnlocked(progress, 'throne'),
  }
}

export function getNavRoomCompletionState(
  progress: LessonProgress,
): Record<NavRoomId, boolean> {
  return {
    weigh: isWeighComplete(progress),
    furnace: isFurnaceComplete(progress),
    waterLab: progress.waterLab.discoverySeen,
    overflow: progress.overflow.hasCompared,
    archimedes: progress.archimedes.proofUnlocked,
    throne: progress.throne.proofPresented,
  }
}

/** True once the learner has finished the Eureka bath beat (unlocks Overflow Lab). */
export function isBathStoryComplete(progress: LessonProgress): boolean {
  return progress.bath.storyIndex >= 1
}

/** Drop-in-water breakthrough + early rooms done → play the bath cutscene. */
export function shouldTriggerBathCutscene(progress: LessonProgress): boolean {
  return (
    isEarlyInvestigationComplete(progress) &&
    progress.waterLab.discoverySeen &&
    !isBathStoryComplete(progress)
  )
}

export function roomUnlockHeading(label: string): string {
  const base = /\broom\b/i.test(label)
    ? label.replace(/\broom\b/i, 'Room')
    : /\blab\b/i.test(label)
      ? label
      : `${label} Room`
  return `${base} Unlocked!`
}

export function roomCompleteHeading(label: string): string {
  const base = /\broom\b/i.test(label)
    ? label.replace(/\broom\b/i, 'Room')
    : `${label} Room`
  return `${base} Complete!`
}

export const OVERFLOW_UNLOCK_INSIGHT =
  'You saw the water rise — now measure exactly how much the crown displaces. The Overflow Lab is open: compare overflow volumes side by side.'
