import { OrderService } from '@/lib/services/orderService'
import { handle, json, parseBody, parseId } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { requireAdminUser, requireUser } from '@/lib/api/guards'
import { updateOrderStatusSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/orders/:id - Get an order by ID (owner or admin)
export const GET = handle(async (_request, context) => {
  const user = await requireUser()
  const orderId = await parseId(context, 'order ID')

  const order = await OrderService.getOrderById(orderId)
  const isOwner = order?.userId != null && order.userId === user.id

  // 404 for foreign orders so order IDs cannot be probed
  if (!order || (user.role !== 'ADMIN' && !isOwner)) {
    throw ApiError.notFound('Order not found', 'ORDER_NOT_FOUND')
  }

  return json(order)
})

// PATCH /api/orders/:id - Update order status (admin only)
export const PATCH = handle(async (request, context) => {
  await requireAdminUser()
  const orderId = await parseId(context, 'order ID')
  const { status } = await parseBody(request, updateOrderStatusSchema)

  return json(await OrderService.updateOrderStatus(orderId, status))
})
