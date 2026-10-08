import { AccountService } from '@/lib/services/accountService'
import { handle, json, parseBody } from '@/lib/api/handler'
import { resetPasswordSchema } from '@/lib/validation/schemas'

// POST /api/account/reset-password - choose a new password with the emailed token
export const POST = handle(async (request) => {
  const { token, password } = await parseBody(request, resetPasswordSchema)
  await AccountService.resetPassword(token, password)
  return json({ message: 'Your password has been changed. You can sign in now.' })
})
