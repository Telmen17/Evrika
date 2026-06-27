# Feedback

## Purpose

Anonymous learner feedback after lessons; dev inbox for local entries.

## Key files

- `components/FeedbackModal.tsx` — dialog UI
- `components/FeedbackInbox.tsx` — dev-only viewer
- `lib/feedback.ts` — localStorage + optional Web3Forms email
- `styles/feedback/feedback-animations.css` — keyframes only (layout in Tailwind)

## Styling

| Approach | Files | Notes |
|----------|-------|-------|
| Tailwind utilities | `FeedbackModal.tsx`, `FeedbackInbox.tsx` | Overlay, modal shell, form, buttons, sentiment chips |
| Animation CSS | `feedback-animations.css` | `eurekaFade`, `eurekaPop`, check draw, spark burst |

**Key utilities:** `fixed inset-0 flex …`, `border-gold-border`, `bg-gradient-to-b from-parchment`, `aria-pressed` + `cn()` for sentiment active state

**Animations:** CSS only — `.feedback-animate-fade`, `.feedback-animate-pop`, `.feedback-spark--*`

**Responsive:** `p-[clamp(…)]` on overlay; matches modal patterns in [tailwind.md](../styles/tailwind.md#feedbackmodal--feedbackinbox)

**Debugging tip:** layout/spacing → TSX; motion → `feedback-animations.css`

## State & progress

None (standalone). Entries stored in `evrika:feedback-inbox-v1`.

## Tests

- `tests/frontend/unit/lib/feedback.test.ts`
- `tests/frontend/integration/components/FeedbackModal.test.tsx`

## Not testable here

Thank-you animation burst, email delivery in production.
