import { CategoryService } from '@/lib/services/categoryService'
import { handle, json, parseBody } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'
import { categorySchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/categories - all categories with their book counts
export const GET = handle(async () => json(await CategoryService.list()))

// POST /api/categories - create a category (admin)
export const POST = handle(async (request) => {
  await requireAdminUser()
  const { name } = await parseBody(request, categorySchema)
  return json(await CategoryService.create(name), 201)
})
