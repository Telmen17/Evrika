import { describe, expect, it } from 'vitest'
import {
  getNavRoomCompletionState,
  getNavRoomUnlockState,
  isBathStoryComplete,
  isEarlyInvestigationComplete,
  isFurnaceComplete,
  isRoomUnlocked,
  isWeighComplete,
  roomCompleteHeading,
  roomUnlockHeading,
  shouldTriggerBathCutscene,
} from '@/lib/hubRooms'
import { createLessonProgress } from '../../setup/test-utils'

describe('hubRooms', () => {
  describe('completion helpers', () => {
    it('detects weigh and furnace completion', () => {
      const fresh = createLessonProgress()
      expect(isWeighComplete(fresh)).toBe(false)
      expect(isFurnaceComplete(fresh)).toBe(false)
      expect(isEarlyInvestigationComplete(fresh)).toBe(false)

      const earlyDone = createLessonProgress({
        weigh: { weighPhase: 'done' },
        melt: { phase: 'done' },
      })
      expect(isWeighComplete(earlyDone)).toBe(true)
      expect(isFurnaceComplete(earlyDone)).toBe(true)
      expect(isEarlyInvestigationComplete(earlyDone)).toBe(true)
    })
  })

  describe('isRoomUnlocked', () => {
    it('keeps weigh and furnace open from the start', () => {
      const progress = createLessonProgress()
      expect(isRoomUnlocked(progress, 'weigh')).toBe(true)
      expect(isRoomUnlocked(progress, 'furnace')).toBe(true)
    })

    it('locks water lab until early investigation is complete', () => {
      const progress = createLessonProgress()
      expect(isRoomUnlocked(progress, 'waterLab')).toBe(false)

      const unlocked = createLessonProgress({
        weigh: { weighPhase: 'done' },
        melt: { phase: 'done' },
      })
      expect(isRoomUnlocked(unlocked, 'waterLab')).toBe(true)
    })

    it('unlocks overflow after the bath story beat', () => {
      const progress = createLessonProgress({ bath: { storyIndex: 1 } })
      expect(isRoomUnlocked(progress, 'overflow')).toBe(true)
    })

    it('unlocks archimedes room after overflow comparison', () => {
      const progress = createLessonProgress({ overflow: { hasCompared: true } })
      expect(isRoomUnlocked(progress, 'archimedes')).toBe(true)
    })

    it('unlocks throne after proof is unlocked', () => {
      const progress = createLessonProgress({ archimedes: { proofUnlocked: true } })
      expect(isRoomUnlocked(progress, 'throne')).toBe(true)
    })
  })

  describe('aggregate nav state', () => {
    it('builds unlock and completion maps', () => {
      const progress = createLessonProgress({
        weigh: { weighPhase: 'done' },
        melt: { phase: 'done' },
        waterLab: { discoverySeen: true },
        bath: { storyIndex: 1 },
        overflow: { hasCompared: true },
        archimedes: { proofUnlocked: true },
        throne: { proofPresented: true },
      })

      expect(getNavRoomUnlockState(progress)).toEqual({
        weigh: true,
        furnace: true,
        waterLab: true,
        overflow: true,
        archimedes: true,
        throne: true,
      })

      expect(getNavRoomCompletionState(progress)).toEqual({
        weigh: true,
        furnace: true,
        waterLab: true,
        overflow: true,
        archimedes: true,
        throne: true,
      })
    })
  })

  describe('bath cutscene trigger', () => {
    it('requires early rooms, water discovery, and no prior bath beat', () => {
      const ready = createLessonProgress({
        weigh: { weighPhase: 'done' },
        melt: { phase: 'done' },
        waterLab: { discoverySeen: true },
        bath: { storyIndex: 0 },
      })
      expect(shouldTriggerBathCutscene(ready)).toBe(true)
      expect(isBathStoryComplete(ready)).toBe(false)

      const alreadySeen = createLessonProgress({
        weigh: { weighPhase: 'done' },
        melt: { phase: 'done' },
        waterLab: { discoverySeen: true },
        bath: { storyIndex: 1 },
      })
      expect(shouldTriggerBathCutscene(alreadySeen)).toBe(false)
      expect(isBathStoryComplete(alreadySeen)).toBe(true)
    })
  })

  describe('heading copy', () => {
    it('formats unlock and complete headings', () => {
      expect(roomUnlockHeading('Water Lab')).toBe('Water Lab Unlocked!')
      expect(roomUnlockHeading('Weigh Room')).toBe('Weigh Room Unlocked!')
      expect(roomCompleteHeading('Overflow')).toBe('Overflow Room Complete!')
    })
  })
})
