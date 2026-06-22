import { type FC, useCallback, useState } from 'react'
import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas'
import archimedesImg from '../assets/archimedes.png'
import {
  LANDING_ARCHIMEDES_RIVE_SRC,
  LANDING_ARCHIMEDES_STATE_MACHINE,
} from '../lib/landingRive'

const LandingArchimedesRive: FC = () => {
  const [useFallback, setUseFallback] = useState(false)

  const handleLoadError = useCallback(() => {
    setUseFallback(true)
  }, [])

  const { RiveComponent } = useRive(
    useFallback
      ? null
      : {
          src: LANDING_ARCHIMEDES_RIVE_SRC,
          stateMachines: LANDING_ARCHIMEDES_STATE_MACHINE,
          autoplay: true,
          layout: new Layout({
            fit: Fit.Contain,
            alignment: Alignment.BottomCenter,
          }),
          onLoadError: handleLoadError,
        },
    {
      shouldResizeCanvasToContainer: true,
    },
  )

  if (useFallback) {
    return (
      <img
        className="landing-hero-archimedes landing-arch-alive"
        src={archimedesImg}
        alt=""
      />
    )
  }

  return <RiveComponent className="landing-hero-archimedes-rive" aria-hidden />
}

export default LandingArchimedesRive
