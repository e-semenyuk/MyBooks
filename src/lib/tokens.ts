import { createHash, randomBytes } from 'crypto'

export const TOKEN_TTL_MS = {
  PASSWORD_RESET: 30 * 60 * 1000,
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
} as const

// The raw token goes into the email; only its hash is stored, so a copy of
// the database cannot be used to reset anyone's password.
export function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('base64url')
  return { raw, hash: hashToken(raw) }
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}
