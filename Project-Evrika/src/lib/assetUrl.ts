/**
 * Normalize a Vite-resolved asset import to a URL string for <img src> and Matter.js sprites.
 */
export function assetUrl(src: string | { default: string }): string {
  if (typeof src === 'string') return src
  if (src && typeof src === 'object' && typeof src.default === 'string') return src.default
  return String(src)
}
