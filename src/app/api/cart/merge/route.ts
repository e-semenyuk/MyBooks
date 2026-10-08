import { CartService } from '@/lib/services/cartService'
import { getSessionId } from '@/lib/session'
import { handle, json } from '@/lib/api/handler'
import { requireUser } from '@/lib/api/guards'

// POST /api/cart/merge - Move the guest cart into the signed-in user's cart
export const POST = handle(async () => {
  const user = await requireUser()
  const sessionId = await getSessionId()

  const merged = sessionId ? await CartService.mergeGuestCart(sessionId, user.id) : 0
  return json({ merged })
})
