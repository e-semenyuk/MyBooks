import { afterEach, describe, expect, it } from 'vitest'
import { deliverPush, vapidConfigured } from './push'

describe('push transport', () => {
  const original = { ...process.env }
  afterEach(() => {
    process.env = { ...original }
  })

  it('needs all three VAPID values', () => {
    expect(vapidConfigured({})).toBe(false)
    expect(vapidConfigured({ VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b' })).toBe(false)
    expect(vapidConfigured({ VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_SUBJECT: 'mailto:x@y.z' })).toBe(true)
  })

  it('records a send outside production and skips in production when not configured', async () => {
    delete process.env.VAPID_PUBLIC_KEY
    const target = { endpoint: 'https://push.example/1', p256dh: 'k', auth: 'a' }
    const payload = { title: 't', body: 'b', url: '/orders/1' }
    ;(process.env as any).NODE_ENV = 'test'
    expect(await deliverPush(target, payload)).toBe('sent')
    ;(process.env as any).NODE_ENV = 'production'
    expect(await deliverPush(target, payload)).toBe('skipped')
  })
})
