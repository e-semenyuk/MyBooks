import { describe, expect, it } from 'vitest'
import { emailVerificationRequired } from './config'

describe('emailVerificationRequired', () => {
  it('is off without a mail server', () => {
    expect(emailVerificationRequired({})).toBe(false)
  })

  it('turns on with SMTP', () => {
    expect(emailVerificationRequired({ SMTP_HOST: 'smtp.example.com' })).toBe(true)
  })

  it('can be forced on or off', () => {
    expect(emailVerificationRequired({ REQUIRE_EMAIL_VERIFICATION: 'true' })).toBe(true)
    expect(emailVerificationRequired({ REQUIRE_EMAIL_VERIFICATION: ' TRUE ' })).toBe(true)
    expect(emailVerificationRequired({ SMTP_HOST: 'smtp.example.com', REQUIRE_EMAIL_VERIFICATION: 'false' })).toBe(false)
  })

  it('ignores unknown values', () => {
    expect(emailVerificationRequired({ REQUIRE_EMAIL_VERIFICATION: 'maybe' })).toBe(false)
    expect(emailVerificationRequired({ REQUIRE_EMAIL_VERIFICATION: 'maybe', SMTP_HOST: 'x' })).toBe(true)
  })
})
