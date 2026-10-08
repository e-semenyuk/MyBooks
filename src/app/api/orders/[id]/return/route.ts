import { OrderService } from '@/lib/services/orderService'
import { handle, json, parseId } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { requireUser } from '@/lib/api/guards'
import { returnOrderSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// POST /api/orders/:id/return - return your own delivered order within 30 days of delivery.
// Refunds the full payment and puts the books back in stock.
// 409 INVALID_TRANSITION when the order is not delivered, 409 RETURN_WINDOW_CLOSED when too late.
export const POST = handle(async (request, context) => {
  const user = await requireUser()
  const orderId = await parseId(context, 'order ID')
  // The reason is optional, so an empty body is fine
  const { reason } = returnOrderSchema.parse(await request.json().catch(() => ({})))

  const order = await OrderService.getOrderById(orderId)
  if (!order || order.userId !== user.id) {
    throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND')
  }

  return json(await OrderService.returnOrder(orderId, user.id, reason))
})
