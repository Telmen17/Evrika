/**
 * LandingArchimedesRive — Rive canvas for Archimedes idle hero animation.
 *
 * Docs: docs/components/landing.md
 */

import { type FC, useCallback, useState } from 'react'
import { Alignment, Fit, Layout, useRive, type Rive } from '@rive-app/react-canvas'
import {
  LANDING_ARCHIMEDES_ARTBOARD,
  LANDING_ARCHIMEDES_IDLE_ANIMATION,
  LANDING_ARCHIMEDES_LAYOUT_SCALE,
  LANDING_ARCHIMEDES_RIVE_SRC,
} from '../lib/landingRive'
import LandingArchimedesPartsIdle from './LandingArchimedesPartsIdle'

const startArchimedesMotion = (rive: Rive) => {
  rive.resizeDrawingSurfaceToCanvas()
  rive.play(LANDING_ARCHIMEDES_IDLE_ANIMATION)
}

const LandingArchimedesRive: FC = () => {
  const [loadFailed, setLoadFailed] = useState(false)

  const handleLoadError = useCallback(() => {
    setLoadFailed(true)
  }, [])

  const handleRiveReady = useCallback((rive: Rive) => {
    startArchimedesMotion(rive)
  }, [])

  const { RiveComponent, setContainerRef } = useRive(
    loadFailed
      ? null
      : {
          src: LANDING_ARCHIMEDES_RIVE_SRC,
          artboard: LANDING_ARCHIMEDES_ARTBOARD,
          animations: LANDING_ARCHIMEDES_IDLE_ANIMATION,
          autoplay: true,
          layout: new Layout({
            fit: Fit.Contain,
            alignment: Alignment.BottomCenter,
            layoutScaleFactor: LANDING_ARCHIMEDES_LAYOUT_SCALE,
          }),
          onRiveReady: handleRiveReady,
          onLoadError: handleLoadError,
        },
    {
      shouldResizeCanvasToContainer: true,
    },
  )

  if (loadFailed) {
    return <LandingArchimedesPartsIdle />
  }

  return (
    <div ref={setContainerRef} className="landing-hero-archimedes-rive-wrap">
      <RiveComponent className="landing-hero-archimedes-rive" aria-hidden />
    </div>
  )
}

export default LandingArchimedesRive
