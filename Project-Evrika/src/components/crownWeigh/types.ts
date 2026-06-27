/**
 * crownWeigh/types — shared types for the balance-scale weigh room.
 *
 * Responsibility: item IDs, pan sides, stage layout, and Matter.js runtime shapes.
 * Docs: docs/architecture/routing-and-scenes.md
 */

export type PanSide = 'left' | 'right'

export type ScaleItemId =
  | 'crown'
  | 'goldLump'
  | 'goldBar'
  | 'silverBar'
  | 'mass100'
  | 'mass200'
  | 'mass300'

export interface MatterWindow extends Window {
  Matter?: any
}

export interface StageGeometry {
  width: number
  height: number
  pivotX: number
  pivotY: number
  beamWidth: number
  panWidth: number
  panWallHeight: number
  ropeLength: number
}

export interface ItemDefinition {
  label: string
  massGrams: number
  physicsMass: number
  iconSrc: string
  bodyShape: 'circle' | 'rectangle'
  width?: number
  height?: number
  radius?: number
  singleInstance?: boolean
}

export interface PlacedItem {
  instanceId: string
  type: ScaleItemId
  pan: PanSide
}

export interface PhysicsSnapshot {
  beamAngle: number
  leftPan: { x: number; y: number; angle: number }
  rightPan: { x: number; y: number; angle: number }
  leftRopes: Array<{ x1: number; y1: number; x2: number; y2: number }>
  rightRopes: Array<{ x1: number; y1: number; x2: number; y2: number }>
}

export interface PhysicsRuntime {
  Matter: any
  engine: any
  runner: any
  beam: any
  leftPan: any
  rightPan: any
  world: any
  items: Map<string, { type: ScaleItemId; pan: PanSide }>
  geometry: StageGeometry
  applyPanMasses: () => void
  syncView: () => void
}
