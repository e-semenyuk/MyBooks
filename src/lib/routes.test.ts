import { describe, expect, it } from 'vitest'
import { pageFromPath, safeCallbackUrl } from './routes'

describe('pageFromPath', () => {
  it('maps paths to page names', () => {
    expect(pageFromPath('/')).toBe('home')
    expect(pageFromPath('/cart')).toBe('cart')
    expect(pageFromPath('/admin/orders')).toBe('admin')
    expect(pageFromPath('/orders/5')).toBeNull()
  })
})

describe('safeCallbackUrl', () => {
  it('keeps same-site paths', () => {
    expect(safeCallbackUrl('/checkout')).toBe('/checkout')
    expect(safeCallbackUrl('/orders/5?x=1')).toBe('/orders/5?x=1')
  })

  it.each([null, undefined, '', 'https://evil.example', '//evil.example', '/\\evil.example', 'checkout'])(
    'falls back to home for %s',
    (value) => {
      expect(safeCallbackUrl(value as string | null)).toBe('/')
    }
  )
})
