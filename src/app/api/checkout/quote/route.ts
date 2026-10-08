import { OrderService } from '@/lib/services/orderService'
import { handle, json, parseBody } from '@/lib/api/handler'
import { requireUser } from '@/lib/api/guards'
import { fromCents } from '@/lib/money'
import { quoteSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// POST /api/checkout/quote - price the cart with a shipping method and promo code
export const POST = handle(async (request) => {
  const user = await requireUser()
  const input = await parseBody(request, quoteSchema)
  const { totals, promo } = await OrderService.quote({ kind: 'user', userId: user.id }, input)

  return json({
    shippingMethod: input.shippingMethod,
    promoCode: promo?.code ?? null,
    subtotal: fromCents(totals.subtotalCents),
    discount: fromCents(totals.discountCents),
    shipping: fromCents(totals.shippingCents),
    tax: fromCents(totals.taxCents),
    total: fromCents(totals.totalCents),
  })
})
