export interface HeadCueArrow {
  x: number
  y: number
  rotation: number
  delay: number
}

export interface HeadCueAnchor {
  cx: number
  cy: number
  radius: number
}

const CUE_ARC_START_DEG = -165
const CUE_ARC_END_DEG = -15
const CUE_ARROW_COUNT = 7

const CUE_ANGLE_STEP_DEG =
  (CUE_ARC_END_DEG - CUE_ARC_START_DEG) / (CUE_ARROW_COUNT - 1)

const CUE_ANGLES_DEG = Array.from(
  { length: CUE_ARROW_COUNT },
  (_, index) => CUE_ARC_START_DEG + CUE_ANGLE_STEP_DEG * index,
)

const TIP_GAP_PX = 6
/** Half of .hub-guide-head-cue width; tip sits near the right edge of the glyph box. */
const ARROW_HALF_LEN_PX = 20

export function computeHeadCueArrows(anchor: HeadCueAnchor): HeadCueArrow[] {
  const centerDist = anchor.radius + TIP_GAP_PX + ARROW_HALF_LEN_PX

  return CUE_ANGLES_DEG.map((angleDeg) => {
    const angleRad = (angleDeg * Math.PI) / 180
    const x = anchor.cx + Math.cos(angleRad) * centerDist
    const y = anchor.cy + Math.sin(angleRad) * centerDist
    const rotation =
      (Math.atan2(anchor.cy - y, anchor.cx - x) * 180) / Math.PI

    return {
      x,
      y,
      rotation,
      delay:
        Math.abs(angleDeg + 90) < 0.01
          ? 0.12
          : (Math.abs(angleDeg + 90) / CUE_ANGLE_STEP_DEG) * 0.12,
    }
  })
}
