import { useEffect, useRef } from 'react'

/**
 * Simple 2D balance-scale physics:
 * - Torque = (rightMass - leftMass) * leverArm → heavier side goes down.
 * - We integrate angular velocity with damping so the scale settles smoothly.
 *
 * No animation library needed: we use requestAnimationFrame and update
 * the beam's transform in the loop so React doesn't re-render every frame.
 */
const LEVER_ARM = 1
const SENSITIVITY = 0.14
const DAMPING = 0.94
const SPRING = 0.06
const MAX_ANGLE_DEG = 20
const DT = 1 / 60

export function useScalePhysics(leftMass: number, rightMass: number) {
  const beamRef = useRef<HTMLDivElement | null>(null)
  const angleRef = useRef(0)
  const velocityRef = useRef(0)
  const leftMassRef = useRef(leftMass)
  const rightMassRef = useRef(rightMass)

  leftMassRef.current = leftMass
  rightMassRef.current = rightMass

  useEffect(() => {
    let rafId: number

    const tick = () => {
      const left = leftMassRef.current
      const right = rightMassRef.current
      const massDiff = right - left
      const gravityTorque = massDiff * LEVER_ARM * SENSITIVITY
      const springTorque = -angleRef.current * SPRING
      const torque = gravityTorque + springTorque

      velocityRef.current += torque * DT
      velocityRef.current *= DAMPING
      angleRef.current += velocityRef.current * DT

      const max = (MAX_ANGLE_DEG * Math.PI) / 180
      angleRef.current = Math.max(-max, Math.min(max, angleRef.current))

      const beam = beamRef.current
      if (beam) {
        const deg = (angleRef.current * 180) / Math.PI
        beam.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return beamRef
}
