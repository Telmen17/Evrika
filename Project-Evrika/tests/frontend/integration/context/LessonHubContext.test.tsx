import { act, renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LESSON_PROGRESS,
  LESSON_HUB_STORAGE_KEY,
  LessonHubProvider,
  useLessonHub,
} from '@/context/LessonHubContext'

function hubWrapper({ children }: { children: ReactNode }) {
  return <LessonHubProvider>{children}</LessonHubProvider>
}

describe('LessonHubContext', () => {
  it('throws outside the provider', () => {
    expect(() => renderHook(() => useLessonHub())).toThrow(
      /useLessonHub must be used within LessonHubProvider/,
    )
  })

  it('patches nested progress slices', () => {
    const { result } = renderHook(() => useLessonHub(), { wrapper: hubWrapper })

    act(() => {
      result.current.patchProgress({ weigh: { weighPhase: 'done' } })
    })

    expect(result.current.progress.weigh.weighPhase).toBe('done')
    expect(result.current.progress.melt.phase).toBe(DEFAULT_LESSON_PROGRESS.melt.phase)
  })

  it('persists progress to localStorage', () => {
    const { result } = renderHook(() => useLessonHub(), { wrapper: hubWrapper })

    act(() => {
      result.current.patchProgress({ waterLab: { discoverySeen: true } })
    })

    const stored = JSON.parse(localStorage.getItem(LESSON_HUB_STORAGE_KEY) ?? '{}') as {
      waterLab?: { discoverySeen?: boolean }
    }
    expect(stored.waterLab?.discoverySeen).toBe(true)
  })

  it('resets progress to defaults', () => {
    const { result } = renderHook(() => useLessonHub(), { wrapper: hubWrapper })

    act(() => {
      result.current.patchProgress({ throne: { proofPresented: true } })
    })
    expect(result.current.progress.throne.proofPresented).toBe(true)

    act(() => {
      result.current.resetProgress()
    })

    expect(result.current.progress.throne.proofPresented).toBe(false)
    expect(result.current.progress.weigh.weighPhase).toBe('crown')
  })

  it('triggers companion insight state', () => {
    const { result } = renderHook(() => useLessonHub(), { wrapper: hubWrapper })

    act(() => {
      result.current.triggerInsight({
        kind: 'hint',
        transcript: 'Try the scale again.',
        audioSrc: '/audio/voicelines/intro1.mp3',
      })
    })

    expect(result.current.companion.bubbleOpen).toBe(true)
    expect(result.current.companion.transcript).toBe('Try the scale again.')
    expect(result.current.companion.insightKind).toBe('hint')
  })
})
