import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LandingPage from '@/components/LandingPage'
import { setViewportWidth } from '../../setup/matchMedia'

vi.mock('@/components/LandingArchimedesRive', () => ({
  default: () => <div data-testid="archimedes-rive-mock" />,
}))

describe('LandingPage', () => {
  it('renders the hero title and journey CTA on desktop', () => {
    setViewportWidth(1280)
    render(
      <LandingPage onNavigate={() => undefined} onStartJourney={() => undefined} completedScenes={[]} />,
    )

    expect(screen.getByText(/Archimedes' Eureka Quest/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start the Journey' })).toBeInTheDocument()
    expect(screen.getByTestId('archimedes-rive-mock')).toBeInTheDocument()
  })

  it('applies the mobile layout class below the desktop breakpoint', () => {
    setViewportWidth(390)
    const { container } = render(
      <LandingPage onNavigate={() => undefined} onStartJourney={() => undefined} completedScenes={[]} />,
    )

    expect(container.firstChild).toHaveClass('landing-page-mobile')
    const callout = container.querySelector('.landing-mobile-callout-text')
    expect(callout).toHaveTextContent(/Play on desktop to start the journey/)
  })

  it('marks completed journey milestones', () => {
    setViewportWidth(1280)
    render(
      <LandingPage
        onNavigate={() => undefined}
        onStartJourney={() => undefined}
        completedScenes={['intro', 'bath']}
      />,
    )

    expect(screen.getByText(/2 of 6 milestones reached/)).toBeInTheDocument()
  })
})
