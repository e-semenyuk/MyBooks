import { ReviewService } from '@/lib/services/reviewService'
import { AuditService } from '@/lib/services/auditService'
import { handle, json, parseBody, parseId } from '@/lib/api/handler'
import { requireAdminUser, requireUser } from '@/lib/api/guards'
import { moderateReviewSchema, updateReviewSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// PUT /api/reviews/:id - edit your own review
export const PUT = handle(async (request, context) => {
  const user = await requireUser()
  const id = await parseId(context, 'review ID')
  const input = await parseBody(request, updateReviewSchema)
  const review = await ReviewService.update(id, user.id, input)
  return json({ id: review.id, rating: review.rating, title: review.title, body: review.body })
})

// PATCH /api/reviews/:id - admin: hide or show a review
export const PATCH = handle(async (request, context) => {
  const admin = await requireAdminUser()
  const id = await parseId(context, 'review ID')
  const { status } = await parseBody(request, moderateReviewSchema)
  const { before, after } = await ReviewService.moderate(id, status)
  if (before.status !== after.status) {
    await AuditService.record(admin.id, status === 'HIDDEN' ? 'REVIEW_HIDDEN' : 'REVIEW_SHOWN', 'review', id, `Review ${id} on book ${after.bookId}`)
  }
  return json({ id: after.id, status: after.status })
})

// DELETE /api/reviews/:id - delete your own review (admins can delete any)
export const DELETE = handle(async (_request, context) => {
  const user = await requireUser()
  const id = await parseId(context, 'review ID')
  const review = await ReviewService.remove(id, user)
  if (review.userId !== user.id) {
    await AuditService.record(user.id, 'REVIEW_DELETED', 'review', id, `Review ${id} on book ${review.bookId}`)
  }
  return json({ message: 'Review deleted successfully' })
})
