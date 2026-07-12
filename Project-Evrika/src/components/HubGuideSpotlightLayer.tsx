import { type CSSProperties } from 'react'
import type { SpotlightRegion } from '../lib/hubGuideSpotlight'

interface HubGuideSpotlightLayerProps {
  maskId: string
  viewportW: number
  viewportH: number
  maskHoles: SpotlightRegion[]
  rings: SpotlightRegion[]
  visible: boolean
}

function MaskCutout({ hole }: { hole: SpotlightRegion }) {
  if (hole.shape === 'circle') {
    return (
      <circle
        cx={hole.x + hole.width / 2}
        cy={hole.y + hole.height / 2}
        r={hole.width / 2}
        fill="black"
      />
    )
  }

  return (
    <rect
      x={hole.x}
      y={hole.y}
      width={hole.width}
      height={hole.height}
      rx={hole.radius}
      ry={hole.radius}
      fill="black"
    />
  )
}

export function HubGuideSpotlightLayer({
  maskId,
  viewportW,
  viewportH,
  maskHoles,
  rings,
  visible,
}: HubGuideSpotlightLayerProps) {
  if (!visible || viewportW <= 0 || viewportH <= 0) return null

  return (
    <>
      <svg
        className="hub-guide-dim"
        width={viewportW}
        height={viewportH}
        viewBox={`0 0 ${viewportW} ${viewportH}`}
        aria-hidden
      >
        <defs>
          <mask id={maskId}>
            <rect width={viewportW} height={viewportH} fill="white" />
            {maskHoles.map((hole) => (
              <MaskCutout key={hole.id} hole={hole} />
            ))}
          </mask>
        </defs>
        <rect
          width={viewportW}
          height={viewportH}
          fill="rgba(28, 18, 4, 0.52)"
          mask={`url(#${maskId})`}
        />
      </svg>

      {rings.map((ring) => (
        <div
          key={`ring-${ring.id}`}
          className={`hub-guide-spotlight-ring hub-guide-spotlight-ring--${ring.id}`}
          style={
            {
              top: ring.y,
              left: ring.x,
              width: ring.width,
              height: ring.height,
              borderRadius: ring.shape === 'circle' ? '50%' : ring.radius,
            } as CSSProperties
          }
          aria-hidden
        />
      ))}
    </>
  )
}
