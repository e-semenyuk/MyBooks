import { OrderService } from '@/lib/services/orderService'
import { getCartOwner } from '@/lib/session'
import { handle, json, parseBody } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { getOptionalUser } from '@/lib/api/guards'
import { isOrderStatus } from '@/lib/orderStatus'
import { createOrderSchema, orderFilterSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/orders - Admins list all orders (with filters); users see only their own
export const GET = handle(async (request) => {
  const user = await getOptionalUser()

  // Not signed in: no orders
  if (!user) return json([])

  // Ownership is the user id. Email is never used to find a user's orders.
  if (user.role !== 'ADMIN') {
    return json(await OrderService.getOrdersByUserId(user.id))
  }

  const { email, status, userId } = orderFilterSchema.parse(
    Object.fromEntries(request.nextUrl.searchParams)
  )

  if (email) return json(await OrderService.getOrdersByCustomerEmail(email))
  if (status) {
    if (!isOrderStatus(status)) {
      throw ApiError.badRequest(`Invalid order status: ${status}`, 'INVALID_STATUS')
    }
    return json(await OrderService.getOrdersByStatus(status))
  }
  if (userId) return json(await OrderService.getOrdersByUserId(userId))
  return json(await OrderService.getAllOrders())
})

// POST /api/orders - Create a new order
export const POST = handle(async (request) => {
  const owner = await getCartOwner()
  const body = await parseBody(request, createOrderSchema)

  const order = await OrderService.createOrder(owner, body)
  return json(order, 201)
})
