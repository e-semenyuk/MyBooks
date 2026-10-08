import { UserAdminService } from '@/lib/services/userAdminService'
import { handle, json, parseBody, parseId } from '@/lib/api/handler'
import { requireAdminUser } from '@/lib/api/guards'
import { updateUserSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/users/:id { role?, active? } - change a role or deactivate / activate an account.
// 409 SELF_CHANGE when an admin targets their own account.
export const PATCH = handle(async (request, context) => {
  const admin = await requireAdminUser()
  const id = await parseId(context, 'user ID')
  const change = await parseBody(request, updateUserSchema)
  return json(await UserAdminService.update(admin.id, id, change))
})
