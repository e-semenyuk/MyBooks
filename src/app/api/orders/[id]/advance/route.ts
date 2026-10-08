import { OrderService } from '@/lib/services/orderService'
import { handle, json, parseId } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'

export const dynamic = 'force-dynamic'

// POST /api/orders/:id/advance - admin: move the order to the next fulfilment step
// (Pending, Confirmed, Shipped, Delivered). 409 INVALID_TRANSITION at the end of the flow.
export const POST = handle(async (_request, context) => {
  const admin = await requireAdminUser()
  const orderId = await parseId(context, 'order ID')
  return json(await OrderService.advanceOrder(orderId, admin.id))
})
