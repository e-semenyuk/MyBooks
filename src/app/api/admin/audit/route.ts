import { AuditService } from '@/lib/services/auditService'
import { handle, json } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'
import { auditQuerySchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/admin/audit - who changed what, newest first (admin only).
// Filters: action, entity, actorId, from and to (dates). Paged.
export const GET = handle(async (request) => {
  await requireAdminUser()
  const filters = auditQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  return json(await AuditService.list(filters))
})
