const FLIGHT_EASING = 'cubic-bezier(0.22, 0.8, 0.2, 1)'

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
