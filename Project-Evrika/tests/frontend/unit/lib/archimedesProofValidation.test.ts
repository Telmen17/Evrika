import { describe, expect, it } from 'vitest'
import {
  matchesDisplayedVolumeMl,
  matchesRequiredMassG,
  REQUIRED_CROWN_VOLUME_ML,
  REQUIRED_GOLD_VOLUME_ML,
} from '../../../../src/lib/archimedesProofValidation'

describe('archimedesProofValidation', () => {
  it('accepts masses entered as whole grams', () => {
    expect(matchesRequiredMassG('2000', 2000)).toBe(true)
    expect(matchesRequiredMassG('2000.0', 2000)).toBe(true)
    expect(matchesRequiredMassG('1999', 2000)).toBe(false)
  })

  it('accepts overflow-lab HUD volumes rounded to one decimal', () => {
    expect(REQUIRED_CROWN_VOLUME_ML.toFixed(1)).toBe('129.7')
    expect(REQUIRED_GOLD_VOLUME_ML.toFixed(1)).toBe('103.5')

    expect(matchesDisplayedVolumeMl('129.7', REQUIRED_CROWN_VOLUME_ML)).toBe(true)
    expect(matchesDisplayedVolumeMl('103.5', REQUIRED_GOLD_VOLUME_ML)).toBe(true)
  })

  it('accepts exact calibrated volumes from the sim', () => {
    expect(matchesDisplayedVolumeMl('129.66', REQUIRED_CROWN_VOLUME_ML)).toBe(true)
    expect(matchesDisplayedVolumeMl('103.52', REQUIRED_GOLD_VOLUME_ML)).toBe(true)
  })

  it('rejects volumes that do not match the displayed reading', () => {
    expect(matchesDisplayedVolumeMl('129.6', REQUIRED_CROWN_VOLUME_ML)).toBe(false)
    expect(matchesDisplayedVolumeMl('103.4', REQUIRED_GOLD_VOLUME_ML)).toBe(false)
    expect(matchesDisplayedVolumeMl('', REQUIRED_CROWN_VOLUME_ML)).toBe(false)
  })
})
