import { handle, json } from '@/lib/api/handler'
import { vapidConfigured } from '@/lib/notifications/push'

export const dynamic = 'force-dynamic'

// GET /api/push/public-key - the key a browser needs to subscribe (null when push is not set up)
export const GET = handle(async () => {
  return json({ publicKey: vapidConfigured() ? process.env.VAPID_PUBLIC_KEY! : null })
})
