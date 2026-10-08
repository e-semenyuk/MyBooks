// One place decides what an order costs. The cart, checkout quote and order
// creation all call computeTotals, so the numbers can never disagree.

export const SHIPPING_METHODS = ['STANDARD', 'EXPRESS'] as const
export type ShippingMethodName = (typeof SHIPPING_METHODS)[number]

export interface ShippingOption {
  method: ShippingMethodName
  label: string
  cents: number
  // Orders at or above this amount (after discount) ship free; none for Express
  freeOverCents?: number
  estimate: string
}

export const SHIPPING_OPTIONS: Record<ShippingMethodName, ShippingOption> = {
  STANDARD: { method: 'STANDARD', label: 'Standard', cents: 499, freeOverCents: 5000, estimate: '3 to 5 business days' },
  EXPRESS: { method: 'EXPRESS', label: 'Express', cents: 1499, estimate: '1 to 2 business days' },
}

export interface PromoRule {
  type: 'PERCENT' | 'FIXED'
  // PERCENT: whole percent. FIXED: cents.
  value: number
}

export interface PriceLine {
  priceCents: number
  quantity: number
}

export interface Totals {
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
}

export function taxRateFromEnv(env: Record<string, string | undefined> = process.env): number {
  const raw = Number(env.TAX_RATE ?? '0.08')
  if (!Number.isFinite(raw) || raw < 0) return 0
  return Math.min(raw, 0.5)
}

export function discountFor(subtotalCents: number, promo?: PromoRule | null): number {
  if (!promo) return 0
  const raw = promo.type === 'PERCENT' ? Math.round((subtotalCents * promo.value) / 100) : promo.value
  return Math.max(0, Math.min(raw, subtotalCents))
}

export function shippingFor(afterDiscountCents: number, method: ShippingMethodName): number {
  const option = SHIPPING_OPTIONS[method]
  if (option.freeOverCents !== undefined && afterDiscountCents >= option.freeOverCents) return 0
  return option.cents
}

export function computeTotals(input: {
  items: PriceLine[]
  promo?: PromoRule | null
  shippingMethod: ShippingMethodName
  taxRate: number
}): Totals {
  const subtotalCents = input.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)
  const discountCents = discountFor(subtotalCents, input.promo)
  const afterDiscount = subtotalCents - discountCents
  // An empty cart ships nothing
  const shippingCents = subtotalCents === 0 ? 0 : shippingFor(afterDiscount, input.shippingMethod)
  const taxCents = Math.round(afterDiscount * input.taxRate)
  return {
    subtotalCents,
    discountCents,
    shippingCents,
    taxCents,
    totalCents: afterDiscount + shippingCents + taxCents,
  }
}

export type PromoProblem = 'INVALID_PROMO' | 'PROMO_EXPIRED' | 'PROMO_EXHAUSTED'

export interface PromoState {
  active: boolean
  expiresAt: Date | null
  maxUses: number | null
  usedCount: number
}

// Distinct problems get distinct codes so the form can say what is wrong.
export function promoProblem(promo: PromoState | null, now: Date): PromoProblem | null {
  if (!promo || !promo.active) return 'INVALID_PROMO'
  if (promo.expiresAt && promo.expiresAt.getTime() <= now.getTime()) return 'PROMO_EXPIRED'
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return 'PROMO_EXHAUSTED'
  return null
}

export const PROMO_MESSAGES: Record<PromoProblem, string> = {
  INVALID_PROMO: 'This promo code is not valid',
  PROMO_EXPIRED: 'This promo code has expired',
  PROMO_EXHAUSTED: 'This promo code has been used up',
}

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase()
}
