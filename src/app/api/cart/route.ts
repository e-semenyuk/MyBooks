import { CartService } from '@/lib/services/cartService'
import { getCartOwner } from '@/lib/session'
import { handle, json, parseBody } from '@/lib/api/handler'
import { addToCartSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/cart - Get cart items for current session
export const GET = handle(async () => {
  const owner = await getCartOwner()
  return json(await CartService.getCartItems(owner))
})

// POST /api/cart - Add item to cart
export const POST = handle(async (request) => {
  const owner = await getCartOwner()
  const { bookId, quantity } = await parseBody(request, addToCartSchema)

  const cartItem = await CartService.addToCart(owner, bookId, quantity)
  return json(cartItem, 201)
})

// DELETE /api/cart - Clear cart
export const DELETE = handle(async () => {
  const owner = await getCartOwner()
  await CartService.clearCart(owner)
  return json({ message: 'Cart cleared successfully' })
})
