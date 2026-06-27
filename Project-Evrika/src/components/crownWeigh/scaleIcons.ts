/**
 * crownWeigh/scaleIcons — inline SVG data URLs for scale tray items.
 *
 * Responsibility: generate draggable item icons (bars, weights, gold lump).
 * Docs: docs/architecture/routing-and-scenes.md
 */

export function toSvgDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function makeBarIcon(fill: string, accent: string, text: string) {
  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 48">
      <rect x="10" y="10" width="52" height="28" rx="8" fill="${fill}" stroke="${accent}" stroke-width="3"/>
      <rect x="15" y="14" width="42" height="8" rx="4" fill="rgba(255,255,255,0.25)"/>
      <text x="36" y="31" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#2b1b1b">${text}</text>
    </svg>
  `)
}

export function makeWeightIcon(fill: string, text: string) {
  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <path d="M23 18c0-5 4-9 9-9s9 4 9 9h-6c0-2-1-3-3-3s-3 1-3 3z" fill="${fill}" stroke="#5a4020" stroke-width="3"/>
      <path d="M18 22h28l8 30c1 4-2 8-7 8H17c-5 0-8-4-7-8z" fill="${fill}" stroke="#5a4020" stroke-width="3"/>
      <text x="32" y="46" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#2b1b1b">${text}</text>
    </svg>
  `)
}

/** Unlabeled nugget — no mass text on the art (player must weigh it). */
export function makeGoldLumpIcon() {
  return toSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 56">
      <path d="M38 6 C52 8 62 18 64 32 C66 46 54 54 40 54 C26 54 10 46 8 32 C6 18 20 8 38 6Z" fill="#e0a82e" stroke="#5c4a12" stroke-width="3" stroke-linejoin="round"/>
      <path d="M28 22 C34 18 44 20 50 28" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="44" cy="26" rx="10" ry="6" fill="rgba(255,255,255,0.15)"/>
    </svg>
  `)
}
