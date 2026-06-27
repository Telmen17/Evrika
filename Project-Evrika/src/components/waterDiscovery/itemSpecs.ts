/**
 * waterDiscovery/itemSpecs — draggable prop catalog for the discovery workshop.
 *
 * Responsibility: bench positions, sprite textures, densities, and hover copy per item.
 * Docs: docs/architecture/routing-and-scenes.md
 */

import crownSvg from '../../assets/crown.svg'
import goldNugget1 from '../../assets/goldNugget1png.png'
import rockPng from '../../assets/rock.png'
import woodPng from '../../assets/wood.png'
import { assetUrl } from '../../lib/assetUrl'
import { BULK_RHO } from './constants'
import type { ItemId, ItemSpec } from './types'

function toSvgDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** Same Ag ingot as CrownWeighScene (scaling chapter) — `makeBarIcon('#d9dde7', '#7e8ba5', 'Ag')` */
export const SILVER_BAR_TEXTURE = toSvgDataUrl(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 48">
    <rect x="10" y="10" width="52" height="28" rx="8" fill="#d9dde7" stroke="#7e8ba5" stroke-width="3"/>
    <rect x="15" y="14" width="42" height="8" rx="4" fill="rgba(255,255,255,0.25)"/>
    <text x="36" y="31" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#2b1b1b">Ag</text>
  </svg>`)

/** Props on the shelf — two neat rows + wood block on the left. */
export const ITEM_SPECS: ItemSpec[] = [
  {
    id: 'wood',
    label: 'Wood block',
    hint: 'Floats — watch the waterline climb slowly',
    w: 58,
    h: 96,
    benchX: 48,
    benchY: 182,
    density: BULK_RHO.wood,
    render: 'sprite',
    texture: assetUrl(woodPng),
  },
  {
    id: 'crown',
    label: 'Crown',
    hint: 'Heavy gold crown — sinks fast',
    w: 42,
    h: 32,
    benchX: 112,
    benchY: 152,
    density: BULK_RHO.crown,
    render: 'sprite',
    texture: assetUrl(crownSvg),
  },
  {
    id: 'gold',
    label: 'Gold nugget',
    hint: 'Dense lump of gold',
    w: 52,
    h: 44,
    benchX: 182,
    benchY: 152,
    density: BULK_RHO.gold,
    render: 'sprite',
    texture: assetUrl(goldNugget1),
  },
  {
    id: 'rock',
    label: 'Rock',
    hint: 'Stone — sinks like the crown',
    w: 40,
    h: 36,
    benchX: 112,
    benchY: 208,
    density: BULK_RHO.rock,
    render: 'sprite',
    texture: assetUrl(rockPng),
  },
  {
    id: 'silver',
    label: 'Silver bar',
    hint: 'Silver ingot — compare its splash',
    w: 28,
    h: 16,
    benchX: 182,
    benchY: 208,
    density: BULK_RHO.silver,
    render: 'sprite',
    texture: SILVER_BAR_TEXTURE,
  },
]

export const WOOD_SPEC = ITEM_SPECS.find((spec) => spec.id === 'wood')!

export function initialPropPositions(): Record<ItemId, { x: number; y: number }> {
  return Object.fromEntries(
    ITEM_SPECS.map((s) => [s.id, { x: s.benchX, y: s.benchY }]),
  ) as Record<ItemId, { x: number; y: number }>
}
