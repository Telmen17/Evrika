import { describe, expect, it } from 'vitest'
import {
  getNavRoomUnlockState,
  isRoomUnlocked,
  shouldTriggerBathCutscene,
} from '@/lib/hubRooms'
import { createLessonProgress } from '../../setup/test-utils'

/**
 * Custom progression suite — encodes the intended learner journey as an ordered
 * unlock chain. Not covered by Testing Library; guards against regressions in
 * hub gating logic across rooms.
 */
describe('hub progression chain (custom)', () => {
  it('follows weigh → furnace → water lab → bath → overflow → archimedes → throne', () => {
    let progress = createLessonProgress()

    expect(getNavRoomUnlockState(progress)).toMatchObject({
      weigh: true,
      furnace: true,
      waterLab: false,
      overflow: false,
      archimedes: false,
      throne: false,
    })

    progress = createLessonProgress({
      weigh: { weighPhase: 'done' },
      melt: { phase: 'done' },
    })
    expect(isRoomUnlocked(progress, 'waterLab')).toBe(true)
    expect(shouldTriggerBathCutscene(progress)).toBe(false)

    progress = createLessonProgress({
      weigh: { weighPhase: 'done' },
      melt: { phase: 'done' },
      waterLab: { discoverySeen: true },
    })
    expect(shouldTriggerBathCutscene(progress)).toBe(true)

    progress = createLessonProgress({
      weigh: { weighPhase: 'done' },
      melt: { phase: 'done' },
      waterLab: { discoverySeen: true },
      bath: { storyIndex: 1 },
    })
    expect(isRoomUnlocked(progress, 'overflow')).toBe(true)

    progress = createLessonProgress({
      overflow: { hasCompared: true },
    })
    expect(isRoomUnlocked(progress, 'archimedes')).toBe(true)

    progress = createLessonProgress({
      archimedes: { proofUnlocked: true },
    })
    expect(isRoomUnlocked(progress, 'throne')).toBe(true)
  })
})
