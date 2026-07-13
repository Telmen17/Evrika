import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import ArchimedesRoomScene from '@/components/ArchimedesRoomScene'
import { LESSON_HUB_STORAGE_KEY } from '@/context/LessonHubContext'
import { renderWithProviders, createLessonProgress } from '../../setup/test-utils'

describe('ArchimedesRoomScene', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the study room heading and papyrus inputs', () => {
    renderWithProviders(<ArchimedesRoomScene onNavigate={() => {}} />)

    expect(screen.getByRole('heading', { name: /Archimedes' Room/i })).toBeTruthy()
    expect(screen.getByLabelText(/Crown volume in milliliters/i)).toBeTruthy()
    expect(screen.getByLabelText(/Gold lump volume in milliliters/i)).toBeTruthy()
  })

  it('renders when saved progress already has overflow-lab HUD volumes', () => {
    const progress = createLessonProgress({
      archimedes: {
        crownMassG: '2000',
        crownVolumeMl: '129.7',
        lumpMassG: '2000',
        lumpVolumeMl: '103.5',
      },
    })
    localStorage.setItem(LESSON_HUB_STORAGE_KEY, JSON.stringify(progress))

    renderWithProviders(<ArchimedesRoomScene onNavigate={() => {}} />)

    expect(screen.getByText(/The crown is less dense than pure gold/i)).toBeTruthy()
  })
})
