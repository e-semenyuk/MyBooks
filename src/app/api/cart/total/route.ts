import { CartService } from '@/lib/services/cartService'
import { getCartOwner } from '@/lib/session'
import { handle, json } from '@/lib/api/handler'

export const dynamic = 'force-dynamic'

// GET /api/cart/total - Get cart total
export const GET = handle(async () => {
  const owner = await getCartOwner()
  return json(await CartService.calculateCartTotal(owner))
})
