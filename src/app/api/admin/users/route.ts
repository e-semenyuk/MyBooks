import { UserAdminService } from '@/lib/services/userAdminService'
import { handle, json } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'
import { adminUserQuerySchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/admin/users - accounts with role, status and order count (admin only). Filters: q, role, active. Paged.
export const GET = handle(async (request) => {
  await requireAdminUser()
  const filters = adminUserQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  return json(await UserAdminService.list(filters))
})
