// Verification only makes sense when the app can deliver the link. It is on
// when SMTP_HOST is set, or when REQUIRE_EMAIL_VERIFICATION=true (tests and
// local runs read the link from the outbox); REQUIRE_EMAIL_VERIFICATION=false
// switches it off even with SMTP.
export function emailVerificationRequired(env: Record<string, string | undefined> = process.env): boolean {
  const flag = env.REQUIRE_EMAIL_VERIFICATION?.trim().toLowerCase()
  if (flag === 'true') return true
  if (flag === 'false') return false
  return Boolean(env.SMTP_HOST)
}

// Books with this many copies or fewer count as low on stock (default 5).
export function lowStockThreshold(env: Record<string, string | undefined> = process.env): number {
  const value = Number(env.LOW_STOCK_THRESHOLD)
  return Number.isInteger(value) && value >= 0 ? value : 5
}
