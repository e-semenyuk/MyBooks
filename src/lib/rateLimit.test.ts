import { describe, expect, it } from 'vitest'
import { SlidingWindowLimiter, clientIp } from './rateLimit'

describe('SlidingWindowLimiter', () => {
  it('blocks after the limit and reports when to retry', () => {
    let now = 1_000_000
    const limiter = new SlidingWindowLimiter(3, 60_000, () => now)

    for (let i = 0; i < 3; i++) {
      expect(limiter.retryAfterSeconds('a')).toBe(0)
      limiter.record('a')
      now += 1000
    }

    expect(limiter.retryAfterSeconds('a')).toBe(57)
  })

  it('allows attempts again once the window has passed', () => {
    let now = 0
    const limiter = new SlidingWindowLimiter(2, 10_000, () => now)
    limiter.record('a')
    limiter.record('a')
    expect(limiter.retryAfterSeconds('a')).toBeGreaterThan(0)

    now += 10_001
    expect(limiter.retryAfterSeconds('a')).toBe(0)
  })

  it('tracks keys separately and can be reset', () => {
    const limiter = new SlidingWindowLimiter(1, 10_000)
    limiter.record('a')
    expect(limiter.retryAfterSeconds('a')).toBeGreaterThan(0)
    expect(limiter.retryAfterSeconds('b')).toBe(0)

    limiter.reset('a')
    expect(limiter.retryAfterSeconds('a')).toBe(0)
  })
})

describe('clientIp', () => {
  it('uses the first forwarded address', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4')
    expect(clientIp({ 'x-real-ip': '5.6.7.8' })).toBe('5.6.7.8')
    expect(clientIp(new Headers())).toBe('unknown')
  })
})
