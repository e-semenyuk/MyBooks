import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export interface SeedAccounts {
  adminEmail: string
  adminPassword: string
  userEmail?: string
  userPassword?: string
}

// Fixed catalog. Do not reorder: ids are stable because the tables are
// truncated with RESTART IDENTITY before inserting.
export const SEED_BOOKS = [
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-7432-7356-5', priceCents: 1299, stockQuantity: 10, description: 'A classic American novel about the Jazz Age.' },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-06-112008-4', priceCents: 1499, stockQuantity: 8, description: 'A gripping tale of racial injustice and childhood innocence.' },
  { title: '1984', author: 'George Orwell', isbn: '978-0-452-28423-4', priceCents: 1399, stockQuantity: 15, description: 'A dystopian social science fiction novel.' },
  { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '978-0-14-143951-8', priceCents: 1199, stockQuantity: 12, description: 'A romantic novel of manners.' },
  { title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '978-0-316-76948-0', priceCents: 1349, stockQuantity: 6, description: 'A controversial novel about teenage rebellion.' },
  { title: 'Brave New World', author: 'Aldous Huxley', isbn: '978-0-06-085052-4', priceCents: 1450, stockQuantity: 9, description: 'A future society built on engineered happiness.' },
  { title: 'Moby-Dick', author: 'Herman Melville', isbn: '978-0-14-243724-7', priceCents: 1799, stockQuantity: 4, description: 'The hunt for the white whale.' },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '978-0-547-92822-7', priceCents: 1599, stockQuantity: 20, description: 'A hobbit joins a quest to win back a treasure.' },
  { title: 'Fahrenheit 451', author: 'Ray Bradbury', isbn: '978-1-4516-7331-9', priceCents: 1250, stockQuantity: 7, description: 'A fireman burns books in a society that bans them.' },
  { title: 'Jane Eyre', author: 'Charlotte Bronte', isbn: '978-0-14-143960-0', priceCents: 1125, stockQuantity: 5, description: 'An orphan becomes a governess and finds her voice.' },
  // Edge cases for tests: nothing in stock, and exactly one left
  { title: 'Out of Print Classic', author: 'Anonymous', isbn: '978-0-00-000000-1', priceCents: 999, stockQuantity: 0, description: 'Always out of stock.' },
  { title: 'Last Copy', author: 'Anonymous', isbn: '978-0-00-000000-2', priceCents: 2000, stockQuantity: 1, description: 'Exactly one copy left.' },
] as const

export async function clearAllData(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "order_items", "orders", "cart_items", "Book", "users" RESTART IDENTITY CASCADE'
  )
}

// Wipes every table and inserts the fixed data set. Running it twice gives the
// same rows with the same ids.
export async function resetAndSeed(
  prisma: PrismaClient,
  accounts: SeedAccounts
): Promise<{ books: number; users: number }> {
  await clearAllData(prisma)

  await prisma.book.createMany({ data: SEED_BOOKS.map((book) => ({ ...book })) })

  const users: { email: string; password: string; name: string; role: 'ADMIN' | 'USER' }[] = [
    {
      email: accounts.adminEmail.toLowerCase(),
      password: await bcrypt.hash(accounts.adminPassword, 10),
      name: 'Admin',
      role: 'ADMIN',
    },
  ]
  if (accounts.userEmail && accounts.userPassword) {
    users.push({
      email: accounts.userEmail.toLowerCase(),
      password: await bcrypt.hash(accounts.userPassword, 10),
      name: 'Test User',
      role: 'USER',
    })
  }
  await prisma.user.createMany({ data: users })

  return { books: SEED_BOOKS.length, users: users.length }
}

export function seedAccountsFromEnv(env: NodeJS.ProcessEnv = process.env): SeedAccounts {
  const adminEmail = env.ADMIN_EMAIL?.trim()
  const adminPassword = env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to create the admin account')
  }
  if (adminPassword.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters')
  }

  const userEmail = env.USER_EMAIL?.trim()
  const userPassword = env.USER_PASSWORD
  if (Boolean(userEmail) !== Boolean(userPassword)) {
    throw new Error('Set both USER_EMAIL and USER_PASSWORD, or neither')
  }

  return { adminEmail, adminPassword, userEmail, userPassword }
}
