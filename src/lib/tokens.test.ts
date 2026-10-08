import { describe, expect, it } from 'vitest'
import { TOKEN_TTL_MS, generateToken, hashToken } from './tokens'

describe('tokens', () => {
  it('creates a long url-safe token and a matching hash', () => {
    const { raw, hash } = generateToken()
    expect(raw).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(hash).toBe(hashToken(raw))
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).not.toContain(raw)
  })

  it('never repeats', () => {
    const seen = new Set(Array.from({ length: 200 }, () => generateToken().raw))
    expect(seen.size).toBe(200)
  })

  it('hashes the same input the same way and different inputs differently', () => {
    expect(hashToken('a')).toBe(hashToken('a'))
    expect(hashToken('a')).not.toBe(hashToken('b'))
  })

  it('keeps reset links short-lived and verification links longer', () => {
    expect(TOKEN_TTL_MS.PASSWORD_RESET).toBe(30 * 60 * 1000)
    expect(TOKEN_TTL_MS.EMAIL_VERIFICATION).toBeGreaterThan(TOKEN_TTL_MS.PASSWORD_RESET)
  })
})
