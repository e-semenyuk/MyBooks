// Prisma migrations need a direct connection. Supabase's pooled address (port
// 6543, pgbouncer) cannot hold the migration lock, but the same host answers on
// port 5432 in session mode.
export function directDatabaseUrl(env: Record<string, string | undefined>): string {
  const explicit = env.POSTGRES_URL_NON_POOLING
  if (explicit) return explicit

  const pooled = env.POSTGRES_PRISMA_URL
  if (!pooled) throw new Error('POSTGRES_PRISMA_URL is not set')

  const url = new URL(pooled)
  if (url.port === '6543') url.port = '5432'
  url.searchParams.delete('pgbouncer')
  url.searchParams.delete('connection_limit')
  return url.toString()
}

// Preview deployments must not change the shared database.
export function shouldMigrate(env: Record<string, string | undefined>): boolean {
  if (!env.VERCEL) return true
  return env.VERCEL_ENV === 'production'
}
