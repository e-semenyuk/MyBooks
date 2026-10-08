import { handle, json } from '@/lib/api/handler'
import { SHIPPING_OPTIONS } from '@/lib/pricing'
import { fromCents } from '@/lib/money'

// GET /api/shipping-methods - prices and delivery estimates
export const GET = handle(async () =>
  json(
    Object.values(SHIPPING_OPTIONS).map((option) => ({
      method: option.method,
      label: option.label,
      price: fromCents(option.cents),
      freeOver: option.freeOverCents === undefined ? null : fromCents(option.freeOverCents),
      estimate: option.estimate,
    }))
  )
)
