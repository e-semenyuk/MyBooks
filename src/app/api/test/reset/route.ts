import { prisma } from '@/lib/prisma'
import { handle, json } from '@/lib/api/handler'
import { assertTestEndpointsAllowed } from '@/lib/testSupport/guard'
import { clearAllData } from '@/lib/testSupport/seed'

export const dynamic = 'force-dynamic'

// POST /api/test/reset - remove all data (test environments only)
export const POST = handle(async (request) => {
  assertTestEndpointsAllowed(request)
  await clearAllData(prisma)
  return json({ message: 'All data removed' })
})
