import { describe, expect, it } from 'vitest'
import { fromCents, formatMoney, toCents, MAX_PRICE_CENTS } from './money'

describe('toCents', () => {
  it.each([
    [0, 0],
    [12.99, 1299],
    [19.99, 1999],
    [0.1 + 0.2, 30],
    [1.005, 101],
    [100, 10000],
  ])('converts %f dollars to %i cents', (dollars, cents) => {
    expect(toCents(dollars)).toBe(cents)
  })

  it('rejects negative, non-finite and oversized amounts', () => {
    expect(() => toCents(-1)).toThrow(RangeError)
    expect(() => toCents(NaN)).toThrow(RangeError)
    expect(() => toCents(Infinity)).toThrow(RangeError)
    expect(() => toCents(MAX_PRICE_CENTS / 100 + 1)).toThrow(RangeError)
  })
})

describe('fromCents', () => {
  it('converts cents to dollars without float drift in sums', () => {
    // 19.99 x 3 as floats gives 59.97000000000001
    expect(fromCents(1999 * 3)).toBe(59.97)
  })
})

describe('formatMoney', () => {
  it('always shows two decimals', () => {
    expect(formatMoney(1200)).toBe('$12.00')
    expect(formatMoney(1299)).toBe('$12.99')
  })
})
