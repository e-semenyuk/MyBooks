import { ReviewService } from '@/lib/services/reviewService'
import { handle, json } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'
import { adminReviewQuerySchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/admin/reviews?status=HIDDEN&q=text - every review, newest first (admin only)
export const GET = handle(async (request) => {
  await requireAdminUser()
  const filters = adminReviewQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  return json(await ReviewService.listForAdmin(filters))
})
