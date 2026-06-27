import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useMobileLandingViewport } from '@/lib/landingDesktopGate'
import { setViewportWidth } from '../../setup/matchMedia'

describe('useMobileLandingViewport', () => {
  it('tracks sub-960px viewports', async () => {
    setViewportWidth(414)
    const { result } = renderHook(() => useMobileLandingViewport())
    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('returns false at desktop widths', async () => {
    setViewportWidth(1280)
    const { result } = renderHook(() => useMobileLandingViewport())
    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })
})
