/**
 * installQuillCursors — inject custom quill cursor styles.
 *
 * Docs: docs/lib/README.md
 */

import quillCursorPng from '../assets/cursors/quill-cursor.png?url'
import quillCursorSvg from '../assets/cursors/quill-cursor.svg?url'

const STYLE_ID = 'evrika-quill-cursor-styles'
/** Click hotspot — ink nib tip in 32×32 art. */
const HOTSPOT = '3 30'

function quillCursor(url: string) {
  return `url("${url}") ${HOTSPOT}`
}

/**
 * Injects quill cursor rules with literal asset URLs.
 * PNG first for broad browser support, SVG as fallback before the keyword.
 */
export function installQuillCursors() {
  if (document.getElementById(STYLE_ID)) {
    document.documentElement.classList.add('evrika-cursors')
    return
  }

  const defaultCursor = `${quillCursor(quillCursorPng)}, ${quillCursor(quillCursorSvg)}, auto`
  const pointerCursor = `${quillCursor(quillCursorPng)}, ${quillCursor(quillCursorSvg)}, pointer`

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
@media (hover: hover) and (pointer: fine) {
  html.evrika-cursors,
  html.evrika-cursors body,
  html.evrika-cursors #root,
  html.evrika-cursors .app-root {
    cursor: ${defaultCursor} !important;
  }

  html.evrika-cursors :is(
    a,
    button,
    [role='button'],
    label[for],
    summary,
    .start-button,
    .primary-button,
    .secondary-button,
    .link-button,
    .menu-button,
    .hub-menu-button,
    .hub-room-card,
    .global-audio-toggle,
    .landing-path-button,
    .weigh-tool,
    .weigh-nugget,
    .water-discovery-item,
    .displacement-lab-item,
    .story-bath-control,
    .journey-controls button,
    .hub-nav-item,
    .feedback-inbox-item,
    [data-clickable='true']
  ):not(:disabled):not([aria-disabled='true']) {
    cursor: ${pointerCursor} !important;
  }

  html.evrika-cursors input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']),
  html.evrika-cursors textarea,
  html.evrika-cursors select,
  html.evrika-cursors [contenteditable='true'] {
    cursor: text !important;
  }

  html.evrika-cursors :is(
    button:disabled,
    [aria-disabled='true'],
    .landing-page-mobile .start-button,
    .landing-page-mobile .secondary-button
  ) {
    cursor: not-allowed !important;
  }

  html.evrika-cursors :is(
    .scale-tool-draggable,
    .crown-melt-crown-in-forge-draggable,
    .crown-melt-crown-pool:not([draggable='false']),
    .water-discovery-item,
    .water-discovery-matter-host,
    .displacement-lab-item
  ) {
    cursor: grab !important;
  }

  html.evrika-cursors :is(
    .scale-tool-draggable:active,
    .crown-melt-crown-in-forge-draggable:active,
    .crown-melt-crown-pool:active,
    .water-discovery-matter-host:active
  ) {
    cursor: grabbing !important;
  }
}
`

  document.head.appendChild(style)
  document.documentElement.classList.add('evrika-cursors')
}
