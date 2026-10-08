import { describe, expect, it } from 'vitest'
import {
  computeTotals,
  discountFor,
  normalizePromoCode,
  promoProblem,
  shippingFor,
  taxRateFromEnv,
} from './pricing'

const gatsbyTwice = [{ priceCents: 1299, quantity: 2 }] // 25.98

describe('computeTotals', () => {
  it('adds subtotal, standard shipping and tax', () => {
    expect(computeTotals({ items: gatsbyTwice, shippingMethod: 'STANDARD', taxRate: 0.08 })).toEqual({
      subtotalCents: 2598,
      discountCents: 0,
      shippingCents: 499,
      taxCents: 208, // 25.98 * 0.08 = 2.0784
      totalCents: 2598 + 499 + 208,
    })
  })

  it('ships standard orders free from $50 after discount', () => {
    const items = [{ priceCents: 2500, quantity: 2 }] // 50.00
    expect(computeTotals({ items, shippingMethod: 'STANDARD', taxRate: 0 }).shippingCents).toBe(0)
    const withPromo = computeTotals({
      items,
      promo: { type: 'FIXED', value: 100 },
      shippingMethod: 'STANDARD',
      taxRate: 0,
    })
    expect(withPromo.shippingCents).toBe(499) // 49.00 is under the threshold
  })

  it('never makes express free', () => {
    const items = [{ priceCents: 10000, quantity: 1 }]
    expect(computeTotals({ items, shippingMethod: 'EXPRESS', taxRate: 0 }).shippingCents).toBe(1499)
  })

  it('charges tax on the discounted subtotal, not on shipping', () => {
    const totals = computeTotals({
      items: [{ priceCents: 4000, quantity: 1 }],
      promo: { type: 'PERCENT', value: 25 },
      shippingMethod: 'EXPRESS',
      taxRate: 0.1,
    })
    expect(totals).toEqual({
      subtotalCents: 4000,
      discountCents: 1000,
      shippingCents: 1499,
      taxCents: 300,
      totalCents: 3000 + 1499 + 300,
    })
  })

  it('has no shipping or tax for an empty cart', () => {
    expect(computeTotals({ items: [], shippingMethod: 'EXPRESS', taxRate: 0.08 })).toEqual({
      subtotalCents: 0,
      discountCents: 0,
      shippingCents: 0,
      taxCents: 0,
      totalCents: 0,
    })
  })

  it('keeps the parts equal to the total for many sizes (no cent lost)', () => {
    for (let cents = 1; cents < 400; cents += 7) {
      const t = computeTotals({
        items: [{ priceCents: cents, quantity: 3 }],
        promo: { type: 'PERCENT', value: 15 },
        shippingMethod: 'STANDARD',
        taxRate: 0.0725,
      })
      expect(t.totalCents).toBe(t.subtotalCents - t.discountCents + t.shippingCents + t.taxCents)
      expect(Number.isInteger(t.totalCents)).toBe(true)
    }
  })
})

describe('discountFor', () => {
  it('rounds percent discounts to the cent', () => {
    expect(discountFor(999, { type: 'PERCENT', value: 10 })).toBe(100) // 99.9 rounds up
    expect(discountFor(1000, { type: 'PERCENT', value: 10 })).toBe(100)
  })

  it('caps a fixed discount at the subtotal', () => {
    expect(discountFor(300, { type: 'FIXED', value: 500 })).toBe(300)
    expect(discountFor(1000, { type: 'FIXED', value: 500 })).toBe(500)
  })

  it('is zero without a promo', () => {
    expect(discountFor(1000, null)).toBe(0)
  })
})

describe('shippingFor', () => {
  it('uses the threshold only for standard', () => {
    expect(shippingFor(4999, 'STANDARD')).toBe(499)
    expect(shippingFor(5000, 'STANDARD')).toBe(0)
    expect(shippingFor(99999, 'EXPRESS')).toBe(1499)
  })
})

describe('promoProblem', () => {
  const now = new Date('2026-10-10T12:00:00Z')
  const good = { active: true, expiresAt: null, maxUses: null, usedCount: 0 }

  it('accepts a usable code', () => {
    expect(promoProblem(good, now)).toBeNull()
    expect(promoProblem({ ...good, expiresAt: new Date('2026-12-31'), maxUses: 5, usedCount: 4 }, now)).toBeNull()
  })

  it('tells the three problems apart', () => {
    expect(promoProblem(null, now)).toBe('INVALID_PROMO')
    expect(promoProblem({ ...good, active: false }, now)).toBe('INVALID_PROMO')
    expect(promoProblem({ ...good, expiresAt: new Date('2026-10-09') }, now)).toBe('PROMO_EXPIRED')
    expect(promoProblem({ ...good, expiresAt: now }, now)).toBe('PROMO_EXPIRED')
    expect(promoProblem({ ...good, maxUses: 1, usedCount: 1 }, now)).toBe('PROMO_EXHAUSTED')
  })
})

describe('helpers', () => {
  it('normalizes codes', () => {
    expect(normalizePromoCode('  welcome10 ')).toBe('WELCOME10')
  })

  it('reads the tax rate with a safe default', () => {
    expect(taxRateFromEnv({})).toBe(0.08)
    expect(taxRateFromEnv({ TAX_RATE: '0.2' })).toBe(0.2)
    expect(taxRateFromEnv({ TAX_RATE: 'abc' })).toBe(0)
    expect(taxRateFromEnv({ TAX_RATE: '-1' })).toBe(0)
    expect(taxRateFromEnv({ TAX_RATE: '3' })).toBe(0.5)
  })
})
