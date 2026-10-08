import { prisma } from '@/lib/prisma'
import { handle, json } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { assertTestEndpointsAllowed } from '@/lib/testSupport/guard'
import { resetAndSeed, seedAccountsFromEnv } from '@/lib/testSupport/seed'

export const dynamic = 'force-dynamic'

// POST /api/test/seed - wipe and load the fixed data set (test environments only)
export const POST = handle(async (request) => {
  assertTestEndpointsAllowed(request)

  let accounts
  try {
    accounts = seedAccountsFromEnv()
  } catch (error: any) {
    throw ApiError.badRequest(error.message, 'SEED_CONFIG')
  }

  return json(await resetAndSeed(prisma, accounts))
})
