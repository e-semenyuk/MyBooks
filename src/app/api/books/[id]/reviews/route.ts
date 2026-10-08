import { ReviewService } from '@/lib/services/reviewService'
import { handle, json, parseBody, parseId } from '@/lib/api/handler'
import { getOptionalUser, requireUser } from '@/lib/api/guards'
import { createReviewSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/books/:id/reviews - visible reviews, the rating summary and what the viewer may do
export const GET = handle(async (_request, context) => {
  const bookId = await parseId(context, 'book ID')
  const viewer = await getOptionalUser()
  return json(await ReviewService.listForBook(bookId, viewer?.id ?? null))
})

// POST /api/books/:id/reviews - review a book you bought (one review per book)
export const POST = handle(async (request, context) => {
  const user = await requireUser()
  const bookId = await parseId(context, 'book ID')
  const input = await parseBody(request, createReviewSchema)
  const review = await ReviewService.create(bookId, user.id, input)
  return json({ id: review.id, rating: review.rating, title: review.title, body: review.body }, 201)
})
