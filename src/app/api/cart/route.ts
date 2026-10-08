import { CartService } from '@/lib/services/cartService'
import { getOrCreateSessionId } from '@/lib/session'
import { handle, json, parseBody } from '@/lib/api/handler'
import { addToCartSchema } from '@/lib/validation/schemas'

// GET /api/cart - Get cart items for current session
export const GET = handle(async () => {
  const sessionId = await getOrCreateSessionId()
  return json(await CartService.getCartItems(sessionId))
})

// POST /api/cart - Add item to cart
export const POST = handle(async (request) => {
  const sessionId = await getOrCreateSessionId()
  const { bookId, quantity } = await parseBody(request, addToCartSchema)

  const cartItem = await CartService.addToCart(sessionId, bookId, quantity)
  return json(cartItem, 201)
})

// DELETE /api/cart - Clear cart
export const DELETE = handle(async () => {
  const sessionId = await getOrCreateSessionId()
  await CartService.clearCart(sessionId)
  return json({ message: 'Cart cleared successfully' })
})
