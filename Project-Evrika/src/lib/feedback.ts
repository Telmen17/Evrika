/**
 * Anonymous feedback collection.
 *
 * Backend strategy (zero server to maintain):
 *   1. Get a FREE access key at https://web3forms.com — just enter the Gmail
 *      address where you want feedback delivered. No account/password needed.
 *   2. Paste that key into FEEDBACK_CONFIG.accessKey below (or set the
 *      VITE_WEB3FORMS_KEY env var in a .env file).
 *   3. Every submission is POSTed to Web3Forms, which emails it straight to your
 *      inbox as plain text — no admin dashboard required.
 *
 * If no key is configured, feedback is still captured in localStorage so the
 * dev "Feedback inbox" works and nothing is ever lost.
 */

const ENV_KEY =
  typeof import.meta !== 'undefined'
    ? ((import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_WEB3FORMS_KEY ?? '')
    : ''

export const FEEDBACK_CONFIG = {
  /** Paste your Web3Forms access key here (or use the VITE_WEB3FORMS_KEY env var). */
  accessKey: ENV_KEY || '',
  endpoint: 'https://api.web3forms.com/submit',
  subject: 'New Evrika feedback',
  /** Shown in the email "from" line — kept anonymous on purpose. */
  fromName: 'Evrika learner (anonymous)',
}

export type FeedbackSentiment = 'love' | 'ok' | 'meh' | null

export interface FeedbackEntry {
  id: string
  message: string
  sentiment: FeedbackSentiment
  createdAt: string
  context: string
}

export interface SubmitFeedbackResult {
  ok: boolean
  /** True when the message was successfully relayed to the configured email. */
  emailed: boolean
}

const LS_KEY = 'evrika:feedback-inbox-v1'

export function loadLocalFeedback(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as FeedbackEntry[]) : []
  } catch {
    return []
  }
}

function saveLocalFeedback(list: FeedbackEntry[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, 200)))
  } catch {
    /* storage full / blocked — ignore */
  }
}

export function clearLocalFeedback() {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {
    /* ignore */
  }
}

const SENTIMENT_LABEL: Record<Exclude<FeedbackSentiment, null>, string> = {
  love: 'Loved it',
  ok: 'It was okay',
  meh: 'Needs work',
}

function makeId() {
  return `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export async function submitFeedback(input: {
  message: string
  sentiment?: FeedbackSentiment
  context?: string
}): Promise<SubmitFeedbackResult> {
  const entry: FeedbackEntry = {
    id: makeId(),
    message: input.message.trim(),
    sentiment: input.sentiment ?? null,
    createdAt: new Date().toISOString(),
    context: input.context ?? 'lesson-complete',
  }

  // Always keep a local copy first (backup + dev inbox).
  const list = loadLocalFeedback()
  list.unshift(entry)
  saveLocalFeedback(list)

  if (!FEEDBACK_CONFIG.accessKey) {
    return { ok: true, emailed: false }
  }

  const sentimentLine = entry.sentiment
    ? `Sentiment: ${SENTIMENT_LABEL[entry.sentiment]}\n`
    : ''
  const composed =
    `${sentimentLine}` +
    `Context: ${entry.context}\n` +
    `When: ${entry.createdAt}\n\n` +
    `${entry.message}`

  try {
    const res = await fetch(FEEDBACK_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        access_key: FEEDBACK_CONFIG.accessKey,
        subject: FEEDBACK_CONFIG.subject,
        from_name: FEEDBACK_CONFIG.fromName,
        message: composed,
        // honeypot — leave empty
        botcheck: '',
      }),
    })
    const data = (await res.json()) as { success?: boolean }
    return { ok: true, emailed: Boolean(data.success) }
  } catch {
    // Network failed, but it's safe in localStorage — treat as captured.
    return { ok: true, emailed: false }
  }
}
