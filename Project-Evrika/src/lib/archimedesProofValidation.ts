/**
 * archimedesProofValidation — accept lab measurements on the proof papyrus.
 *
 * Volumes use the same one-decimal display rule as the Overflow Lab HUD
 * (`formatCollectedMl`), so players can copy what they measured.
 */

import {
  CROWN_MASS_G,
  DISPLACEMENT_CROWN_ML,
  DISPLACEMENT_GOLD_ML,
  LUMP_MASS_G,
} from './lessonMeasurements'

export const REQUIRED_CROWN_MASS_G = CROWN_MASS_G
export const REQUIRED_LUMP_MASS_G = LUMP_MASS_G
export const REQUIRED_CROWN_VOLUME_ML = DISPLACEMENT_CROWN_ML
export const REQUIRED_GOLD_VOLUME_ML = DISPLACEMENT_GOLD_ML

export function parseDecimalValue(raw: string) {
  const value = parseFloat(raw.replace(',', '.').trim())
  return Number.isFinite(value) ? value : null
}

export function matchesRequiredMassG(raw: string, targetG: number) {
  const value = parseDecimalValue(raw)
  return value !== null && Math.abs(value - targetG) < 0.0001
}

/** Match Overflow Lab HUD rounding (one decimal for volumes ≥ 10 mL). */
export function matchesDisplayedVolumeMl(raw: string, targetMl: number) {
  const value = parseDecimalValue(raw)
  if (value === null || value < 0 || !Number.isFinite(targetMl)) return false
  return value.toFixed(1) === targetMl.toFixed(1)
}
