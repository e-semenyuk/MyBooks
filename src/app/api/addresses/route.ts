import { AddressService } from '@/lib/services/addressService'
import { handle, json, parseBody } from '@/lib/api/handler'
import { requireUser } from '@/lib/api/guards'
import { addressSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// GET /api/addresses - the signed-in user's saved addresses
export const GET = handle(async () => {
  const user = await requireUser()
  return json(await AddressService.list(user.id))
})

// POST /api/addresses - save a new address (up to 10)
export const POST = handle(async (request) => {
  const user = await requireUser()
  const body = await parseBody(request, addressSchema)
  return json(await AddressService.create(user.id, body), 201)
})
