import { describe, expect, it } from 'vitest'
import {
  LANDING_ARCHIMEDES_ARTBOARD,
  LANDING_ARCHIMEDES_ARTBOARD_SIZE,
  LANDING_ARCHIMEDES_IDLE_ANIMATION,
  LANDING_ARCHIMEDES_LAYOUT_SCALE,
  LANDING_ARCHIMEDES_RIVE_SRC,
} from '@/lib/landingRive'

describe('landingRive config', () => {
  it('exports stable Rive integration constants', () => {
    expect(LANDING_ARCHIMEDES_ARTBOARD).toBe('Artboard')
    expect(LANDING_ARCHIMEDES_IDLE_ANIMATION).toBe('Idle')
    expect(LANDING_ARCHIMEDES_LAYOUT_SCALE).toBeGreaterThan(0)
    expect(LANDING_ARCHIMEDES_ARTBOARD_SIZE.width).toBeGreaterThan(0)
    expect(LANDING_ARCHIMEDES_ARTBOARD_SIZE.height).toBeGreaterThan(0)
    expect(typeof LANDING_ARCHIMEDES_RIVE_SRC).toBe('string')
    expect(LANDING_ARCHIMEDES_RIVE_SRC.length).toBeGreaterThan(0)
  })
})
