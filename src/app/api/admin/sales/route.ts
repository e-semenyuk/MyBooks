import { SalesService } from '@/lib/services/salesService'
import { handle, json } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'
import { salesQuerySchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/admin/sales?from=2026-10-01&to=2026-10-31 - revenue and order figures (default: last 30 days).
// Cancelled and returned orders are refunded and do not count as revenue.
export const GET = handle(async (request) => {
  await requireAdminUser()
  const { from, to } = salesQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams))
  return json(await SalesService.report(from, to))
})
