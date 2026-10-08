import webpush from 'web-push'

export interface PushTarget {
  endpoint: string
  p256dh: string
  auth: string
}

export interface PushPayload {
  title: string
  body: string
  url: string
}

export type PushResult = 'sent' | 'gone' | 'skipped'

export function vapidConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT)
}

// Without VAPID keys pushes cannot reach a browser. Outside production the
// message is still recorded as sent so local runs and tests see the whole flow.
export async function deliverPush(target: PushTarget, payload: PushPayload): Promise<PushResult> {
  if (!vapidConfigured()) return process.env.NODE_ENV === 'production' ? 'skipped' : 'sent'
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(payload),
      {
        TTL: 86_400,
        vapidDetails: {
          subject: process.env.VAPID_SUBJECT!,
          publicKey: process.env.VAPID_PUBLIC_KEY!,
          privateKey: process.env.VAPID_PRIVATE_KEY!,
        },
      }
    )
    return 'sent'
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.statusCode === 410) return 'gone'
    throw error
  }
}
