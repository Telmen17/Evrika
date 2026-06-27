/**
 * crownWeigh/constants — stage layout, physics tuning, and item catalog for the weigh room.
 *
 * Responsibility: immutable config for scale geometry, masses, icons, VO paths, and insight copy.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import crownSvg from '../../assets/crown.svg'
import type { ItemDefinition, ScaleItemId, StageGeometry } from './types'
import { makeBarIcon, makeGoldLumpIcon, makeWeightIcon } from './scaleIcons'

export const STAGE_GEOMETRY: StageGeometry = {
  width: 440,
  height: 390,
  pivotX: 220,
  pivotY: 106,
  beamWidth: 248,
  panWidth: 122,
  panWallHeight: 38,
  ropeLength: 112,
}

export const DRAG_TYPE = 'application/x-evrika-scale-item'
export const BASE_PAN_PHYSICS_MASS = 5
export const BALANCE_RESTORE_STIFFNESS = 0
export const BALANCE_RESTORE_DAMPING = 0.06
export const BALANCE_LOAD_TORQUE_SCALE = 0.0092
export const BEAM_CENTER_OFFSET_Y = 10
export const BEAM_FRICTION_AIR = 0.008
export const PAN_FRICTION_AIR = 0.02
export const PIVOT_STIFFNESS = 0.68
export const ROPE_STIFFNESS = 0.56
export const BASE_WIDTH_PX = 176
export const BASE_HEIGHT_PX = 20
export const BASE_BOTTOM_PX = 10
export const POST_WIDTH_PX = 18
export const POST_TOP_PX = STAGE_GEOMETRY.pivotY - 4
export const POST_HEIGHT_PX =
  STAGE_GEOMETRY.height - BASE_BOTTOM_PX - BASE_HEIGHT_PX - POST_TOP_PX

export const CROWN_MASS_G = 2000
export const LUMP_MASS_G = 2000

/** Plays once when crown and lump sit on opposite pans and the beam levels (equal-weight clue). */
export const VOICE_CROWN_VS_LUMP_SRC = '/audio/voicelines/archimedes-crown-match.mp3'

/**
 * When true: lump VO never runs until `scale_conclusion2` has fully ended in this session (or was
 * already completed in saved progress). After crown audio ends while vs-lump is balanced, the player
 * must break that balance once and re-level before lump VO can fire.
 */
export const GATE_LUMP_VO_UNTIL_CROWN_AUDIO_DONE = true

/** Plays once when the crown is physically balanced against known masses (beam level, correct counterweight). */
export const VOICE_CROWN_BALANCED_SRC = '/audio/voicelines/scale_conclusion2.mp3'

export const INSIGHT_TEXT_BALANCE =
  "Hmm, it seems like the blacksmith made the golden crown weigh exactly the same as the gold given to him by the king. There should be another way to solve this."

export const INSIGHT_TEXT_CROWN_ANSWER =
  "The crown has weight. That much is certain. But a dishonest goldsmith knows how to match a number on a scale. Mass is a clue, not a conclusion. The secret of what lies inside the crown still waits to be uncovered."

export const MASS_KG: Record<ScaleItemId, number> = {
  crown: 2.0,
  goldLump: 2.0,
  goldBar: 0.5,
  silverBar: 0.3,
  mass100: 0.1,
  mass200: 0.2,
  mass300: 0.3,
}

export const ITEM_LABELS: Record<ScaleItemId, string> = {
  crown: 'Crown',
  goldLump: 'Lump of gold',
  goldBar: 'Gold bar',
  silverBar: 'Silver bar',
  mass100: '100 g',
  mass200: '200 g',
  mass300: '300 g',
}

export const ITEM_DEFS: Record<ScaleItemId, ItemDefinition> = {
  crown: {
    label: 'Crown',
    massGrams: CROWN_MASS_G,
    physicsMass: 20,
    iconSrc: crownSvg,
    bodyShape: 'circle',
    radius: 18,
    singleInstance: true,
  },
  goldLump: {
    label: 'Lump of gold from the king',
    massGrams: LUMP_MASS_G,
    physicsMass: 20,
    iconSrc: makeGoldLumpIcon(),
    bodyShape: 'circle',
    radius: 16,
    singleInstance: true,
  },
  goldBar: {
    label: 'Gold bar 500 g',
    massGrams: 500,
    physicsMass: 5,
    iconSrc: makeBarIcon('#f0b52d', '#8b6914', 'Au'),
    bodyShape: 'rectangle',
    width: 42,
    height: 22,
  },
  silverBar: {
    label: 'Silver bar 300 g',
    massGrams: 300,
    physicsMass: 3,
    iconSrc: makeBarIcon('#d9dde7', '#7e8ba5', 'Ag'),
    bodyShape: 'rectangle',
    width: 40,
    height: 20,
  },
  mass100: {
    label: 'Dead mass 100 g',
    massGrams: 100,
    physicsMass: 1,
    iconSrc: makeWeightIcon('#c49c45', '100'),
    bodyShape: 'circle',
    radius: 12,
  },
  mass200: {
    label: 'Dead mass 200 g',
    massGrams: 200,
    physicsMass: 2,
    iconSrc: makeWeightIcon('#b8842d', '200'),
    bodyShape: 'circle',
    radius: 14,
  },
  mass300: {
    label: 'Dead mass 300 g',
    massGrams: 300,
    physicsMass: 3,
    iconSrc: makeWeightIcon('#8e6b3a', '300'),
    bodyShape: 'circle',
    radius: 15,
  },
}
