/**
 * useCoarsePointer — true when the primary input is touch (phones/tablets).
 *
 * Used to show tap-first helper copy while keeping drag on fine-pointer devices.
 */

import { useEffect, useState } from 'react'

const QUERY = '(pointer: coarse)'

export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(QUERY).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const sync = () => setCoarse(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return coarse
}
