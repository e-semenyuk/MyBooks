import { prisma } from '@/lib/prisma'
import { handle, json, parseBody } from '@/lib/api/handler'
import { requireUser } from '@/lib/api/guards'
import { pushSubscriptionSchema, pushUnsubscribeSchema } from '@/lib/validation/schemas'

export const dynamic = 'force-dynamic'

// POST /api/push/subscribe - remember this browser for push notifications
export const POST = handle(async (request) => {
  const user = await requireUser()
  const { endpoint, keys } = await parseBody(request, pushSubscriptionSchema)
  // The same browser can move to another account: the endpoint stays unique
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
  })
  return json({ message: 'Push notifications enabled' }, 201)
})

// DELETE /api/push/subscribe - forget this browser
export const DELETE = handle(async (request) => {
  const user = await requireUser()
  const { endpoint } = await parseBody(request, pushUnsubscribeSchema)
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } })
  return json({ message: 'Push notifications disabled' })
})
