import { AccountService } from '@/lib/services/accountService'
import { handle, json, parseBody } from '@/lib/api/handler'
import { ApiError } from '@/lib/api/errors'
import { forgotPasswordSchema } from '@/lib/validation/schemas'
import { clientIp, forgotLimiter, rateLimitingEnabled } from '@/lib/rateLimit'

// POST /api/account/forgot-password - always answers the same way, so it cannot be used to find out who has an account
export const POST = handle(async (request) => {
  const { email } = await parseBody(request, forgotPasswordSchema)

  if (rateLimitingEnabled()) {
    const key = `${clientIp(request.headers)}|${email}`
    const retryAfter = forgotLimiter().retryAfterSeconds(key)
    if (retryAfter > 0) throw ApiError.tooManyRequests('Too many requests. Try again later.', retryAfter)
    forgotLimiter().record(key)
  }

  await AccountService.requestPasswordReset(email)
  return json({ message: 'If an account exists for this address, a reset link is on its way.' })
})
