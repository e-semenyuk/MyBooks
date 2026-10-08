import { timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'
import { ApiError } from '@/lib/api/errors'

// Test support routes exist only when ENABLE_TEST_ENDPOINTS=true and the caller
// sends the matching x-test-secret header. Anything else gets a plain 404 so
// the routes cannot be discovered. A deployment marked as production by Vercel
// never serves them, even if the variable is set by mistake.
export function assertTestEndpointsAllowed(request: NextRequest): void {
  const secret = process.env.TEST_SECRET
  const enabled =
    process.env.ENABLE_TEST_ENDPOINTS === 'true' &&
    process.env.VERCEL_ENV !== 'production' &&
    Boolean(secret) &&
    (secret as string).length >= 16

  const given = request.headers.get('x-test-secret') ?? ''
  const matches =
    enabled &&
    given.length === (secret as string).length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(secret as string))

  if (!matches) throw ApiError.notFound('Not found')
}
