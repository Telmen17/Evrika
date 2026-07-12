/** Keep in sync with companion.css and onboarding-guide.css motion durations. */
export const GUIDE_MOTION_MS = 1250
export const GUIDE_CUE_FADE_MS = 480
export const GUIDE_CUE_ENTER_DELAY_MS = 320
export const GUIDE_MOTION_EASING = 'cubic-bezier(0.33, 0.9, 0.25, 1)'

const FLIGHT_EASING = GUIDE_MOTION_EASING

export function setCompanionHeadPosition(
  head: HTMLButtonElement,
  x: number,
  y: number,
  animate: boolean,
) {
  head.classList.add('archimedes-companion__head-btn--guide-flight')
  head.style.setProperty('--head-flight-x', `${x}px`)
  head.style.setProperty('--head-flight-y', `${y}px`)
  head.classList.toggle(
    'archimedes-companion__head-btn--guide-flight--animate',
    animate,
  )
}

export function setCompanionHeadGuideHighlight(
  head: HTMLButtonElement | null,
  highlighted: boolean,
) {
  if (!head) return
  head.classList.toggle('archimedes-companion__head-btn--guide-highlight', highlighted)
}

export function resetCompanionHeadFlight(head: HTMLButtonElement | null) {
  if (!head) return
  head.classList.remove(
    'archimedes-companion__head-btn--guide-flight',
    'archimedes-companion__head-btn--guide-flight--animate',
    'archimedes-companion__head-btn--guide-highlight',
  )
  head.style.removeProperty('--head-flight-x')
  head.style.removeProperty('--head-flight-y')
}

export { FLIGHT_EASING }
