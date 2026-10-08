import { WishlistService } from '@/lib/services/wishlistService'
import { handle, json } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { requireUser } from '@/lib/api/guards'

export const dynamic = 'force-dynamic'

// DELETE /api/wishlist/:bookId - remove a saved book (also fine when it was not saved)
export const DELETE = handle(async (_request, context) => {
  const user = await requireUser()
  const bookId = Number((await context.params).bookId)
  if (!Number.isInteger(bookId) || bookId <= 0) throw ApiError.badRequest('Invalid book ID', 'INVALID_ID')
  await WishlistService.remove(user.id, bookId)
  return json({ message: 'Removed from wishlist' })
})
