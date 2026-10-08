import { prisma } from '@/lib/prisma'
import { handle, json } from '@/lib/api/handler'
import { assertTestEndpointsAllowed } from '@/lib/testSupport/guard'

export const dynamic = 'force-dynamic'

// GET /api/test/push?email=a@b.co - the latest push messages the app created (test environments only)
export const GET = handle(async (request) => {
  assertTestEndpointsAllowed(request)
  const email = request.nextUrl.searchParams.get('email')
  const rows = await prisma.pushMessage.findMany({
    where: email ? { user: { email: { equals: email, mode: 'insensitive' } } } : {},
    orderBy: { id: 'desc' },
    take: 20,
  })
  return json(rows)
})
