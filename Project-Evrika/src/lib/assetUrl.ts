/**
 * assetUrl — normalize Vite static asset imports to URL strings.
 *
 * Responsibility: unwrap `{ default: url }` for img src and Matter sprites.
 * Docs: docs/lib/README.md
 * Tests: tests/frontend/unit/lib/assetUrl.test.ts
 */

export function assetUrl(src: string | { default: string }): string {
  if (typeof src === 'string') return src
  if (src && typeof src === 'object' && typeof src.default === 'string') return src.default
  return String(src)
}
