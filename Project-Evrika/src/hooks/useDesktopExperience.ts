import { useEffect, useState } from 'react'

/** Matches interactive lesson layout breakpoints — experiences below this width are view-only on landing. */
export const DESKTOP_EXPERIENCE_MIN_WIDTH_PX = 960

export function useDesktopExperience(
  minWidth = DESKTOP_EXPERIENCE_MIN_WIDTH_PX,
): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia(`(min-width: ${minWidth}px)`).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`)
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [minWidth])

  return isDesktop
}
