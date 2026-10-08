import { PrismaClient } from '@prisma/client'
import { resetAndSeed, seedAccountsFromEnv } from '../src/lib/testSupport/seed'

const prisma = new PrismaClient()

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== '1') {
    throw new Error('Refusing to wipe and seed with NODE_ENV=production (set SEED_FORCE=1 to override)')
  }

  const accounts = seedAccountsFromEnv()

  console.log('Seeding database (all existing data is removed)...')
  const result = await resetAndSeed(prisma, accounts)
  console.log(`Created ${result.books} books, ${result.categories} categories and ${result.users} user(s)`)
  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e.message ?? e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
