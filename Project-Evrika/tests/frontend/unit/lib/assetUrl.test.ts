import { describe, expect, it } from 'vitest'
import { assetUrl } from '@/lib/assetUrl'

describe('assetUrl', () => {
  it('returns string imports unchanged', () => {
    expect(assetUrl('/assets/bath.png')).toBe('/assets/bath.png')
  })

  it('unwraps Vite default export objects', () => {
    expect(assetUrl({ default: '/assets/bath.png' })).toBe('/assets/bath.png')
  })

  it('coerces unknown values to string', () => {
    expect(assetUrl(null as unknown as string)).toBe('null')
  })
})
