import { describe, expect, it } from 'vitest'
import { appUrl, passwordResetEmail, verificationEmail } from './emails'

describe('emails', () => {
  it('builds links from the public URL without a double slash', () => {
    expect(appUrl({ NEXTAUTH_URL: 'https://shop.example.com/' })).toBe('https://shop.example.com')
    expect(appUrl({})).toBe('http://localhost:3000')
  })

  it('puts the token in the verification link', () => {
    const mail = verificationEmail('a@b.co', 'Ann', 'tok-en_1', 'https://shop.example.com')
    expect(mail.to).toBe('a@b.co')
    expect(mail.text).toContain('https://shop.example.com/verify-email?token=tok-en_1')
    expect(mail.text).toContain('Hello Ann')
  })

  it('puts the token in the reset link and states the limits', () => {
    const mail = passwordResetEmail('a@b.co', 'Ann', 'abc', 'https://shop.example.com')
    expect(mail.text).toContain('https://shop.example.com/reset-password?token=abc')
    expect(mail.text).toContain('30 minutes')
    expect(mail.text).toContain('once')
  })
})
