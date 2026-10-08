import { WishlistService } from '@/lib/services/wishlistService'
import { handle, json, parseBody } from '@/lib/api/handler'
import { requireUser } from '@/lib/api/guards'
import { wishlistAddSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/wishlist - the signed-in user's saved books, newest first
export const GET = handle(async () => {
  const user = await requireUser()
  return json(await WishlistService.list(user.id))
})

// POST /api/wishlist { bookId } - save a book (201 when new, 200 when it was already saved)
export const POST = handle(async (request) => {
  const user = await requireUser()
  const { bookId } = await parseBody(request, wishlistAddSchema)
  const created = await WishlistService.add(user.id, bookId)
  return json({ bookId, saved: true }, created ? 201 : 200)
})
