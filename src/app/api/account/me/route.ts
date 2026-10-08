import { AccountService } from '@/lib/services/accountService'
import { handle, json } from '@/lib/api/handler'
import { requireUser } from '@/lib/api/guards'

export const dynamic = 'force-dynamic'

// GET /api/account/me - who is signed in and whether the email is verified
export const GET = handle(async () => {
  const user = await requireUser()
  return json(await AccountService.me(user.id))
})
