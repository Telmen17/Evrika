/**
 * waterDiscovery/types — shared identifiers and item shape for the discovery workshop.
 *
 * Responsibility: TypeScript contracts used by constants, item specs, and the scene.
 * Docs: docs/architecture/routing-and-scenes.md
 */

export type ItemId = 'crown' | 'gold' | 'rock' | 'wood' | 'silver'

export interface ItemSpec {
  id: ItemId
  label: string
  /** Short tooltip shown on hover / near the prop on the shelf. */
  hint: string
  w: number
  h: number
  benchX: number
  benchY: number
  density: number
  render: 'sprite' | 'fill'
  texture?: string
  fill?: string
  stroke?: string
}
