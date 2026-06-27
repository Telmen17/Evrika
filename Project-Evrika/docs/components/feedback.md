# Feedback

## Purpose

Anonymous learner feedback after lessons; dev inbox for local entries.

## Key files

- `components/FeedbackModal.tsx` — dialog UI
- `components/FeedbackInbox.tsx` — dev-only viewer
- `lib/feedback.ts` — localStorage + optional Web3Forms email
- `styles/feedback/feedback.css`

## State & progress

None (standalone). Entries stored in `evrika:feedback-inbox-v1`.

## Tests

- `tests/frontend/unit/lib/feedback.test.ts`
- `tests/frontend/integration/components/FeedbackModal.test.tsx`

## Not testable here

Thank-you animation burst, email delivery in production.
