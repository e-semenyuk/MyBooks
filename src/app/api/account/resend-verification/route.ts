import { AccountService } from '@/lib/services/accountService'
import { handle, json } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { requireUser } from '@/lib/api/guards'
import { rateLimitingEnabled, resendLimiter } from '@/lib/rateLimit'

// POST /api/account/resend-verification - send the verification email again (3 per hour)
export const POST = handle(async () => {
  const user = await requireUser()

  if (rateLimitingEnabled()) {
    const key = String(user.id)
    const retryAfter = resendLimiter().retryAfterSeconds(key)
    if (retryAfter > 0) throw ApiError.tooManyRequests('Too many requests. Try again later.', retryAfter)
    resendLimiter().record(key)
  }

  await AccountService.resendVerification(user.id)
  return json({ message: 'Verification email sent.' })
})
