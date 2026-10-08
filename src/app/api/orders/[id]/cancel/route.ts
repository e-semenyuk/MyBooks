import { OrderService } from '@/lib/services/orderService'
import { handle, json, parseId } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { requireUser } from '@/lib/api/guards'

export const dynamic = 'force-dynamic'

// POST /api/orders/:id/cancel - cancel your own order before it ships (admins can cancel any).
// Restores the stock and refunds the payment. 409 once the order has shipped.
export const POST = handle(async (_request, context) => {
  const user = await requireUser()
  const orderId = await parseId(context, 'order ID')

  const order = await OrderService.getOrderById(orderId)
  // Someone else's order looks like a missing one
  if (!order || (user.role !== 'ADMIN' && order.userId !== user.id)) {
    throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND')
  }

  return json(await OrderService.updateOrderStatus(orderId, 'CANCELLED', user.id))
})
