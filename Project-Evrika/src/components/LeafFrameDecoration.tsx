/**
 * LeafFrameDecoration — decorative vine frame around the viewport.
 *
 * Responsibility: responsive leaf counts on top/left/right edges (purely visual).
 * Docs: docs/components/hub.md
 */

import { useEffect, useState } from 'react'
import leafImg from '../assets/leaf.png'

const LEAF_LENGTH_PX = 140
const LEAF_OVERLAP_PX = 44
const LEAF_STEP_PX = LEAF_LENGTH_PX - LEAF_OVERLAP_PX
const SIDE_VINE_WIDTH_PX = LEAF_LENGTH_PX

function leafCountForLength(length: number): number {
  return Math.max(2, Math.floor((length - LEAF_LENGTH_PX) / LEAF_STEP_PX) + 1)
}

function topLeafCountForConnection(viewportWidth: number): number {
  return Math.max(
    2,
    Math.ceil((viewportWidth - SIDE_VINE_WIDTH_PX - LEAF_LENGTH_PX) / LEAF_STEP_PX) + 1,
  )
}

export function LeafFrameDecoration() {
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const sideLeafCount = leafCountForLength(viewport.height)
  const topLeafCount = topLeafCountForConnection(viewport.width)

  return (
    <div className="frame-decoration" aria-hidden>
      <div className="frame-edge frame-top">
        {Array.from({ length: topLeafCount }, (_, i) => (
          <div key={`t-${i}`} className="frame-leaf-slot">
            <img className="frame-leaf-img frame-leaf-img-top" src={leafImg} alt="" />
          </div>
        ))}
      </div>
      <div className="frame-edge frame-left">
        {Array.from({ length: sideLeafCount }, (_, i) => (
          <div key={`l-${i}`} className="frame-leaf-slot">
            <img className="frame-leaf-img" src={leafImg} alt="" />
          </div>
        ))}
      </div>
      <div className="frame-edge frame-right">
        {Array.from({ length: sideLeafCount }, (_, i) => (
          <div key={`r-${i}`} className="frame-leaf-slot">
            <img className="frame-leaf-img" src={leafImg} alt="" />
          </div>
        ))}
      </div>
    </div>
  )
}
