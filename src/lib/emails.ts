import { Email } from '@/lib/mailer'

export function appUrl(env: Record<string, string | undefined> = process.env): string {
  return (env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
}

export function verificationEmail(to: string, name: string, token: string, base = appUrl()): Email {
  return {
    to,
    subject: 'Verify your email address',
    text: [
      `Hello ${name},`,
      '',
      'Confirm your email address to place orders:',
      `${base}/verify-email?token=${encodeURIComponent(token)}`,
      '',
      'The link works for 24 hours. If you did not create an account, ignore this message.',
    ].join('\n'),
  }
}

export function passwordResetEmail(to: string, name: string, token: string, base = appUrl()): Email {
  return {
    to,
    subject: 'Reset your password',
    text: [
      `Hello ${name},`,
      '',
      'Use this link to choose a new password:',
      `${base}/reset-password?token=${encodeURIComponent(token)}`,
      '',
      'The link works once and expires in 30 minutes. If you did not ask for it, ignore this message; your password stays the same.',
    ].join('\n'),
  }
}
