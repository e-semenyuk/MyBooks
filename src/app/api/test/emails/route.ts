import { prisma } from '@/lib/prisma'
import { handle, json } from '@/lib/api/handler'
import { assertTestEndpointsAllowed } from '@/lib/testSupport/guard'

export const dynamic = 'force-dynamic'

// GET /api/test/emails?to=a@b.co - the latest emails the app sent (test environments only)
export const GET = handle(async (request) => {
  assertTestEndpointsAllowed(request)
  const to = request.nextUrl.searchParams.get('to')
  const rows = await prisma.emailOutbox.findMany({
    where: to ? { to: { equals: to, mode: 'insensitive' } } : {},
    orderBy: { id: 'desc' },
    take: 20,
  })
  return json(rows)
})
