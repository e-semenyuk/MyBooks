import { describe, expect, it } from 'vitest'
import { LOCKOUT, afterFailedLogin, lockedMessage, lockedMinutes } from './lockout'

const t0 = new Date('2026-10-10T12:00:00Z')
const after = (minutes: number) => new Date(t0.getTime() + minutes * 60_000)

describe('afterFailedLogin', () => {
  it('starts counting at one', () => {
    expect(afterFailedLogin({ failedLogins: 0, lastFailedLoginAt: null }, t0)).toEqual({
      failedLogins: 1,
      lastFailedLoginAt: t0,
      lockedUntil: null,
    })
  })

  it('locks on the fifth failure inside ten minutes', () => {
    let state = { failedLogins: 0, lastFailedLoginAt: null as Date | null }
    let result = afterFailedLogin(state, t0)
    for (let i = 1; i < LOCKOUT.maxAttempts; i++) {
      state = { failedLogins: result.failedLogins, lastFailedLoginAt: result.lastFailedLoginAt }
      result = afterFailedLogin(state, after(i))
    }
    expect(result.failedLogins).toBe(5)
    expect(result.lockedUntil).toEqual(new Date(after(4).getTime() + LOCKOUT.lockMs))
  })

  it('does not lock on the fourth failure', () => {
    const result = afterFailedLogin({ failedLogins: 3, lastFailedLoginAt: t0 }, after(1))
    expect(result.failedLogins).toBe(4)
    expect(result.lockedUntil).toBeNull()
  })

  it('starts again when the last failure is older than ten minutes', () => {
    const result = afterFailedLogin({ failedLogins: 4, lastFailedLoginAt: t0 }, after(11))
    expect(result.failedLogins).toBe(1)
    expect(result.lockedUntil).toBeNull()
  })

  it('counts a failure exactly ten minutes later as still inside the window', () => {
    expect(afterFailedLogin({ failedLogins: 4, lastFailedLoginAt: t0 }, after(10)).lockedUntil).not.toBeNull()
  })
})

describe('lockedMinutes', () => {
  it('is zero without a lock or after it ends', () => {
    expect(lockedMinutes(null, t0)).toBe(0)
    expect(lockedMinutes(after(-1), t0)).toBe(0)
    expect(lockedMinutes(t0, t0)).toBe(0)
  })

  it('rounds up to whole minutes', () => {
    expect(lockedMinutes(after(15), t0)).toBe(15)
    expect(lockedMinutes(new Date(t0.getTime() + 61_000), t0)).toBe(2)
    expect(lockedMinutes(new Date(t0.getTime() + 1_000), t0)).toBe(1)
  })
})

describe('lockedMessage', () => {
  it('uses the right plural', () => {
    expect(lockedMessage(1)).toBe('Too many failed sign-in attempts. Try again in 1 minute.')
    expect(lockedMessage(15)).toBe('Too many failed sign-in attempts. Try again in 15 minutes.')
  })
})
