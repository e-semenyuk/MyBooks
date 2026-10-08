import { AccountService } from '@/lib/services/accountService'
import { handle, json, parseBody } from '@/lib/api/handler'
import { verifyEmailSchema } from '@/lib/validation/schemas'

// POST /api/account/verify-email - confirm the address with the emailed token
export const POST = handle(async (request) => {
  const { token } = await parseBody(request, verifyEmailSchema)
  await AccountService.verifyEmail(token)
  return json({ message: 'Your email address is verified.' })
})
