import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { mockMatchMedia } from './matchMedia'

beforeEach(() => {
  vi.stubGlobal('performance', {
    ...performance,
    getEntriesByType: vi.fn(() => [{ type: 'navigate' }]),
  })
  mockMatchMedia(1280)
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
