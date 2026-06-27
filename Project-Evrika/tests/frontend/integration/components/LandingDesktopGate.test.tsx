import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LandingDesktopGate from '@/components/LandingDesktopGate'
import { LANDING_DESKTOP_GATE_DISMISSED_KEY } from '@/lib/landingDesktopGate'
import { setViewportWidth } from '../../setup/matchMedia'

describe('LandingDesktopGate', () => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      const maxWidthMatch = query.match(/\(max-width:\s*(\d+)px\)/)
      const matches = maxWidthMatch ? 390 <= Number(maxWidthMatch[1]) : false
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as MediaQueryList
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not render on desktop viewports', () => {
    setViewportWidth(1280)
    render(<LandingDesktopGate />)
    expect(screen.queryByText('Best on desktop')).not.toBeInTheDocument()
  })

  it('appears on mobile after the show delay', () => {
    vi.useFakeTimers()
    setViewportWidth(390)

    render(<LandingDesktopGate />)
    expect(document.querySelector('.landing-desktop-gate--visible')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3200)
    })

    expect(document.querySelector('.landing-desktop-gate--visible')).toBeInTheDocument()
    expect(screen.getByText('Best on desktop')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('dismisses and persists for the session', () => {
    vi.useFakeTimers()
    setViewportWidth(390)
    const onDismiss = vi.fn()

    render(<LandingDesktopGate onDismiss={onDismiss} />)

    act(() => {
      vi.advanceTimersByTime(3200)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss desktop notice' }))

    act(() => {
      vi.advanceTimersByTime(520)
    })

    expect(onDismiss).toHaveBeenCalled()
    expect(sessionStorage.getItem(LANDING_DESKTOP_GATE_DISMISSED_KEY)).toBe('1')
    expect(screen.queryByText('Best on desktop')).not.toBeInTheDocument()

    vi.useRealTimers()
  })
})
