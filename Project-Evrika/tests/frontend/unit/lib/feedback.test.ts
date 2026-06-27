import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearLocalFeedback,
  FEEDBACK_CONFIG,
  loadLocalFeedback,
  submitFeedback,
} from '@/lib/feedback'

describe('feedback', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads an empty inbox by default', () => {
    expect(loadLocalFeedback()).toEqual([])
  })

  it('ignores corrupt localStorage payloads', () => {
    localStorage.setItem('evrika:feedback-inbox-v1', '{not-json')
    expect(loadLocalFeedback()).toEqual([])
  })

  it('stores submissions locally when no email key is configured', async () => {
    const originalKey = FEEDBACK_CONFIG.accessKey
    FEEDBACK_CONFIG.accessKey = ''

    const result = await submitFeedback({
      message: '  Great lesson!  ',
      sentiment: 'love',
      context: 'test-suite',
    })

    expect(result).toEqual({ ok: true, emailed: false })
    const [entry] = loadLocalFeedback()
    expect(entry.message).toBe('Great lesson!')
    expect(entry.sentiment).toBe('love')
    expect(entry.context).toBe('test-suite')
    expect(entry.id).toMatch(/^fb_/)

    FEEDBACK_CONFIG.accessKey = originalKey
  })

  it('relays to Web3Forms when configured', async () => {
    const originalKey = FEEDBACK_CONFIG.accessKey
    FEEDBACK_CONFIG.accessKey = 'test-key'

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await submitFeedback({ message: 'Needs clearer hints' })

    expect(result).toEqual({ ok: true, emailed: true })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(String(init.body))
    expect(body.access_key).toBe('test-key')
    expect(body.message).toContain('Needs clearer hints')

    FEEDBACK_CONFIG.accessKey = originalKey
  })

  it('clears the local inbox', async () => {
    await submitFeedback({ message: 'One' })
    expect(loadLocalFeedback()).toHaveLength(1)
    clearLocalFeedback()
    expect(loadLocalFeedback()).toEqual([])
  })
})
