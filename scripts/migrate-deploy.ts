import { spawnSync } from 'child_process'
import { directDatabaseUrl, shouldMigrate } from '../src/lib/dbUrl'

// Runs inside the Vercel build, before next build. A failed migration fails the
// build, so the previous version keeps serving traffic.
if (!shouldMigrate(process.env)) {
  console.log(`Skipping migrations on a ${process.env.VERCEL_ENV} deployment`)
  process.exit(0)
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, POSTGRES_PRISMA_URL: directDatabaseUrl(process.env) },
})

process.exit(result.status ?? 1)
