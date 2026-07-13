import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import ExplorationHub from '@/components/ExplorationHub'
import { LESSON_HUB_STORAGE_KEY } from '@/context/LessonHubContext'
import { createLessonProgress, renderWithProviders } from '../../setup/test-utils'

describe('ExplorationHub Archimedes room', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('shows Archimedes room content when the nav tab is selected', async () => {
    const progress = createLessonProgress({
      overflow: { hasCompared: true },
      meta: { hubGuideSeen: true },
    })
    localStorage.setItem(LESSON_HUB_STORAGE_KEY, JSON.stringify(progress))

    renderWithProviders(<ExplorationHub onNavigate={() => {}} />)

    const nav = screen.getByRole('navigation', { name: /room navigation/i })
    fireEvent.click(within(nav).getByRole('button', { name: /Archimedes' room/i }))

    expect(await screen.findByRole('heading', { name: /Archimedes' Room/i })).toBeTruthy()
    expect(screen.getByLabelText(/Crown volume in milliliters/i)).toBeTruthy()
    expect(screen.getByLabelText(/Gold lump volume in milliliters/i)).toBeTruthy()
  })
})
