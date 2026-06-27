import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  DESKTOP_EXPERIENCE_MIN_WIDTH_PX,
  useDesktopExperience,
} from '@/hooks/useDesktopExperience'
import { setViewportWidth } from '../../setup/matchMedia'

describe('useDesktopExperience', () => {
  it('returns true at desktop widths', () => {
    setViewportWidth(DESKTOP_EXPERIENCE_MIN_WIDTH_PX)
    const { result } = renderHook(() => useDesktopExperience())
    expect(result.current).toBe(true)
  })

  it('returns false below the desktop breakpoint', async () => {
    setViewportWidth(375)
    const { result } = renderHook(() => useDesktopExperience())
    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })
})
