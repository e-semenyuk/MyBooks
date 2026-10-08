import { AddressService } from '@/lib/services/addressService'
import { handle, json, parseBody, parseId } from '@/lib/api/handler'
import { requireUser } from '@/lib/api/guards'
import { addressSchema } from '@/lib/validation/schemas'

// PUT /api/addresses/:id - replace an address (404 for other users' addresses)
export const PUT = handle(async (request, context) => {
  const user = await requireUser()
  const id = await parseId(context, 'address ID')
  const body = await parseBody(request, addressSchema)
  return json(await AddressService.update(user.id, id, body))
})

// DELETE /api/addresses/:id
export const DELETE = handle(async (_request, context) => {
  const user = await requireUser()
  const id = await parseId(context, 'address ID')
  await AddressService.remove(user.id, id)
  return json({ message: 'Address deleted successfully' })
})
