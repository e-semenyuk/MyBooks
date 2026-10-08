import { CartService } from '@/lib/services/cartService'
import { getOrCreateSessionId } from '@/lib/session'
import { handle, json } from '@/lib/api/handler'

export const dynamic = 'force-dynamic'

// GET /api/cart/total - Get cart total
export const GET = handle(async () => {
  const sessionId = await getOrCreateSessionId()
  return json(await CartService.calculateCartTotal(sessionId))
})
