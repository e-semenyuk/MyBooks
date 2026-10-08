import { CartService } from '@/lib/services/cartService'
import { getOrCreateSessionId } from '@/lib/session'
import { handle, json, parseBody, parseId } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { updateCartItemSchema } from '@/lib/validation/schemas'

// PUT /api/cart/:id - Update cart item quantity
export const PUT = handle(async (request, context) => {
  const sessionId = await getOrCreateSessionId()
  const itemId = await parseId(context, 'cart item ID')
  const { quantity } = await parseBody(request, updateCartItemSchema)

  const cartItem = await CartService.updateCartItem(sessionId, itemId, quantity)
  if (!cartItem) throw ApiError.notFound('Cart item not found', 'CART_ITEM_NOT_FOUND')

  return json(cartItem)
})

// DELETE /api/cart/:id - Remove cart item
export const DELETE = handle(async (_request, context) => {
  const sessionId = await getOrCreateSessionId()
  const itemId = await parseId(context, 'cart item ID')

  const removed = await CartService.removeCartItem(sessionId, itemId)
  if (!removed) throw ApiError.notFound('Cart item not found', 'CART_ITEM_NOT_FOUND')

  return json({ message: 'Item removed from cart' })
})
