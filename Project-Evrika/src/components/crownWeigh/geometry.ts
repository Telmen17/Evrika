/**
 * crownWeigh/geometry — 2D layout helpers for the scale stage SVG overlay.
 *
 * Responsibility: rotate points around the beam pivot and style rope segments.
 * Docs: docs/architecture/routing-and-scenes.md
 */

export function rotatePoint(
  centerX: number,
  centerY: number,
  offsetX: number,
  offsetY: number,
  angle: number,
) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: centerX + offsetX * cos - offsetY * sin,
    y: centerY + offsetX * sin + offsetY * cos,
  }
}

export function lineStyle(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)
  return {
    left: x1,
    top: y1,
    width: `${length}px`,
    transform: `translateY(-50%) rotate(${angle}rad)`,
  }
}
