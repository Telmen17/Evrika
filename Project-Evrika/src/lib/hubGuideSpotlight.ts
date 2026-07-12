export interface SpotlightRegion {
  id: string
  x: number
  y: number
  width: number
  height: number
  shape: 'circle' | 'rounded'
  radius: number
}

export interface GuideSpotlightLayout {
  /** Cutouts in the dim overlay (elements under the guide layer). */
  maskHoles: SpotlightRegion[]
  /** Gold rings for static step targets only (not the moving head/bubble). */
  rings: SpotlightRegion[]
}

function regionFromRect(
  id: string,
  rect: DOMRect,
  pad: number,
  shape: 'circle' | 'rounded',
  cornerRadius = 14,
): SpotlightRegion {
  const width = rect.width + pad * 2
  const height = rect.height + pad * 2
  return {
    id,
    x: rect.left - pad,
    y: rect.top - pad,
    width,
    height,
    shape,
    radius: shape === 'circle' ? width / 2 : cornerRadius,
  }
}

export function buildGuideSpotlightLayout(
  headEl: HTMLButtonElement | null,
  targetRect: DOMRect | null,
  targetPad: number,
): GuideSpotlightLayout {
  const rings: SpotlightRegion[] = []
  const maskHoles: SpotlightRegion[] = []

  if (headEl) {
    maskHoles.push(regionFromRect('head', headEl.getBoundingClientRect(), 8, 'circle'))
  }

  if (targetRect) {
    const target = regionFromRect('target', targetRect, targetPad, 'rounded', 14)
    rings.push(target)
    maskHoles.push(target)
  }

  return { maskHoles, rings }
}
