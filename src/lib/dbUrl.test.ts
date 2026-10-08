import { describe, expect, it } from 'vitest'
import { directDatabaseUrl, shouldMigrate } from './dbUrl'

describe('directDatabaseUrl', () => {
  it('prefers the explicit non-pooling URL', () => {
    expect(
      directDatabaseUrl({
        POSTGRES_URL_NON_POOLING: 'postgres://u:p@db.example.com:5432/postgres',
        POSTGRES_PRISMA_URL: 'postgres://u:p@pool.example.com:6543/postgres?pgbouncer=true',
      })
    ).toBe('postgres://u:p@db.example.com:5432/postgres')
  })

  it('turns the pooled address into the session-mode one', () => {
    const url = directDatabaseUrl({
      POSTGRES_PRISMA_URL: 'postgres://u:p@pool.example.com:6543/postgres?sslmode=require&pgbouncer=true',
    })
    expect(url).toBe('postgres://u:p@pool.example.com:5432/postgres?sslmode=require')
  })

  it('leaves an ordinary URL alone', () => {
    const local = 'postgresql://bookstore:bookstore@localhost:5434/bookstore?schema=public'
    expect(directDatabaseUrl({ POSTGRES_PRISMA_URL: local })).toBe(local)
  })

  it('fails clearly when nothing is configured', () => {
    expect(() => directDatabaseUrl({})).toThrow('POSTGRES_PRISMA_URL is not set')
  })
})

describe('shouldMigrate', () => {
  it('migrates outside Vercel and on production deployments', () => {
    expect(shouldMigrate({})).toBe(true)
    expect(shouldMigrate({ VERCEL: '1', VERCEL_ENV: 'production' })).toBe(true)
  })

  it('skips preview and development builds on Vercel', () => {
    expect(shouldMigrate({ VERCEL: '1', VERCEL_ENV: 'preview' })).toBe(false)
    expect(shouldMigrate({ VERCEL: '1', VERCEL_ENV: 'development' })).toBe(false)
  })
})
