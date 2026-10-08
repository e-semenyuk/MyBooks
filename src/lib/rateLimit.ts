// In-memory sliding window limiter. State is per server instance, so on a
// serverless host it slows down guessing but is not a hard guarantee.
// A database-backed limiter replaces it in the security hardening story.

export class SlidingWindowLimiter {
  private hits = new Map<string, number[]>()

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now
  ) {}

  private recent(key: string): number[] {
    const cutoff = this.now() - this.windowMs
    const recent = (this.hits.get(key) ?? []).filter((t) => t > cutoff)
    if (recent.length > 0) this.hits.set(key, recent)
    else this.hits.delete(key)
    return recent
  }

  // Seconds until another attempt is allowed; 0 when not blocked.
  retryAfterSeconds(key: string): number {
    const recent = this.recent(key)
    if (recent.length < this.limit) return 0
    return Math.max(1, Math.ceil((recent[0] + this.windowMs - this.now()) / 1000))
  }

  record(key: string): void {
    const recent = this.recent(key)
    recent.push(this.now())
    this.hits.set(key, recent)
  }

  reset(key: string): void {
    this.hits.delete(key)
  }
}

export function rateLimitingEnabled(): boolean {
  return process.env.RATE_LIMIT_DISABLED !== 'true'
}

// Shared across hot reloads in development
const store = globalThis as unknown as { __limiters?: Record<string, SlidingWindowLimiter> }

function limiter(name: string, limit: number, windowMs: number): SlidingWindowLimiter {
  store.__limiters ??= {}
  return (store.__limiters[name] ??= new SlidingWindowLimiter(limit, windowMs))
}

export const registerLimiter = () => limiter('register', 20, 60 * 60 * 1000)
export const forgotLimiter = () => limiter('forgot', 5, 60 * 60 * 1000)
export const resendLimiter = () => limiter('resend', 3, 60 * 60 * 1000)

export function clientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const get = (name: string) => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined
    const value = headers[name]
    return Array.isArray(value) ? value[0] : value
  }
  return get('x-forwarded-for')?.split(',')[0].trim() || get('x-real-ip') || 'unknown'
}
