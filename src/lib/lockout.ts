// Five wrong passwords within ten minutes lock the account for fifteen.
export const LOCKOUT = {
  maxAttempts: 5,
  windowMs: 10 * 60 * 1000,
  lockMs: 15 * 60 * 1000,
} as const

export interface LoginFailureState {
  failedLogins: number
  lastFailedLoginAt: Date | null
}

// Whole minutes left on a lock, rounded up; 0 when the account is not locked.
export function lockedMinutes(lockedUntil: Date | null, now: Date): number {
  if (!lockedUntil || lockedUntil.getTime() <= now.getTime()) return 0
  return Math.ceil((lockedUntil.getTime() - now.getTime()) / 60_000)
}

export function afterFailedLogin(state: LoginFailureState, now: Date) {
  const recent =
    state.lastFailedLoginAt !== null && now.getTime() - state.lastFailedLoginAt.getTime() <= LOCKOUT.windowMs
  const failedLogins = recent ? state.failedLogins + 1 : 1
  const lockedUntil = failedLogins >= LOCKOUT.maxAttempts ? new Date(now.getTime() + LOCKOUT.lockMs) : null
  return { failedLogins, lastFailedLoginAt: now, lockedUntil }
}

export function lockedMessage(minutes: number): string {
  return `Too many failed sign-in attempts. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`
}
