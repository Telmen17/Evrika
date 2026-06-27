import { type FC } from 'react'
import archimedesImg from '../assets/archimedes.png'

/** Static fallback if the Rive file fails to load. */
const LandingArchimedesPartsIdle: FC = () => (
  <img className="landing-hero-archimedes" src={archimedesImg} alt="" draggable={false} />
)

export default LandingArchimedesPartsIdle
