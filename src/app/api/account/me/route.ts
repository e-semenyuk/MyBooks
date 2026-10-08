import { AccountService } from '@/lib/services/accountService'
import { handle, json, parseBody } from '@/lib/api/handler'
import { requireUser } from '@/lib/api/guards'
import { localeSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/account/me - who is signed in and whether the email is verified
export const GET = handle(async () => {
  const user = await requireUser()
  return json(await AccountService.me(user.id))
})

// PUT /api/account/me - choose the language of notifications
export const PUT = handle(async (request) => {
  const user = await requireUser()
  const { locale } = await parseBody(request, localeSchema)
  return json(await AccountService.setLocale(user.id, locale))
})
