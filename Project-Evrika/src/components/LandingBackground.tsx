/**
 * LandingBackground — parallax backdrop for the landing page.
 *
 * Docs: docs/components/landing.md
 */

import type { FC } from 'react'
import cityscapeImg from '../assets/beautiful-ancient-greek-cityscape.jpg'
import papyrusImg from '../assets/papyrus.webp'

const LandingBackground: FC = () => (
  <div className="landing-bg-layers" aria-hidden>
    <img className="landing-bg-cityscape" src={cityscapeImg} alt="" />
    <div className="landing-bg-papyrus" style={{ backgroundImage: `url(${papyrusImg})` }} />
    <div className="landing-bg-vignette" />
    <div className="landing-meander landing-meander-top" />
    <div className="landing-meander landing-meander-bottom" />
  </div>
)

export default LandingBackground
