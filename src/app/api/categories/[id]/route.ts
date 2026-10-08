import { CategoryService } from '@/lib/services/categoryService'
import { handle, json, parseBody, parseId } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'
import { categorySchema } from '@/lib/validation/schemas'

// PUT /api/categories/:id - rename (admin)
export const PUT = handle(async (request, context) => {
  await requireAdminUser()
  const id = await parseId(context, 'category ID')
  const { name } = await parseBody(request, categorySchema)
  return json(await CategoryService.rename(id, name))
})

// DELETE /api/categories/:id - delete when no book uses it (admin)
export const DELETE = handle(async (_request, context) => {
  await requireAdminUser()
  const id = await parseId(context, 'category ID')
  await CategoryService.remove(id)
  return json({ message: 'Category deleted successfully' })
})
