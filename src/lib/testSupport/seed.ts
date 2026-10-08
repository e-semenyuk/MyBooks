import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { slugify } from '../slug'

export interface SeedAccounts {
  adminEmail: string
  adminPassword: string
  userEmail?: string
  userPassword?: string
}

export const SEED_CATEGORIES = [
  'Classics',
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Non-Fiction',
  'Romance',
  'History',
  'Poetry',
] as const

type SeedBook = {
  title: string
  author: string
  isbn: string
  priceCents: number
  stockQuantity: number
  description: string
  categories: readonly (typeof SEED_CATEGORIES)[number][]
}

// Fixed catalog. Do not reorder: ids are stable because the tables are
// truncated with RESTART IDENTITY before inserting. The first 12 books are the
// original set; the rest give the catalog enough rows for several pages.
export const SEED_BOOKS: readonly SeedBook[] = [
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0-7432-7356-5', priceCents: 1299, stockQuantity: 10, description: 'A classic American novel about the Jazz Age.', categories: ['Classics'] },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0-06-112008-4', priceCents: 1499, stockQuantity: 8, description: 'A gripping tale of racial injustice and childhood innocence.', categories: ['Classics'] },
  { title: '1984', author: 'George Orwell', isbn: '978-0-452-28423-4', priceCents: 1399, stockQuantity: 15, description: 'A dystopian social science fiction novel.', categories: ['Classics', 'Science Fiction'] },
  { title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '978-0-14-143951-8', priceCents: 1199, stockQuantity: 12, description: 'A romantic novel of manners.', categories: ['Classics', 'Romance'] },
  { title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '978-0-316-76948-0', priceCents: 1349, stockQuantity: 6, description: 'A controversial novel about teenage rebellion.', categories: ['Classics'] },
  { title: 'Brave New World', author: 'Aldous Huxley', isbn: '978-0-06-085052-4', priceCents: 1450, stockQuantity: 9, description: 'A future society built on engineered happiness.', categories: ['Classics', 'Science Fiction'] },
  { title: 'Moby-Dick', author: 'Herman Melville', isbn: '978-0-14-243724-7', priceCents: 1799, stockQuantity: 4, description: 'The hunt for the white whale.', categories: ['Classics'] },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '978-0-547-92822-7', priceCents: 1599, stockQuantity: 20, description: 'A hobbit joins a quest to win back a treasure.', categories: ['Fantasy'] },
  { title: 'Fahrenheit 451', author: 'Ray Bradbury', isbn: '978-1-4516-7331-9', priceCents: 1250, stockQuantity: 7, description: 'A fireman burns books in a society that bans them.', categories: ['Science Fiction'] },
  { title: 'Jane Eyre', author: 'Charlotte Bronte', isbn: '978-0-14-143960-0', priceCents: 1125, stockQuantity: 5, description: 'An orphan becomes a governess and finds her voice.', categories: ['Classics', 'Romance'] },
  // Edge cases for tests: nothing in stock, and exactly one left
  { title: 'Out of Print Classic', author: 'Anonymous', isbn: '978-0-00-000000-1', priceCents: 999, stockQuantity: 0, description: 'Always out of stock.', categories: ['Classics'] },
  { title: 'Last Copy', author: 'Anonymous', isbn: '978-0-00-000000-2', priceCents: 2000, stockQuantity: 1, description: 'Exactly one copy left.', categories: ['Mystery'] },
  { title: 'Dune', author: 'Frank Herbert', isbn: '978-0-00-100001-0', priceCents: 1699, stockQuantity: 14, description: 'A desert planet, a noble family and the most valuable substance in the universe.', categories: ['Science Fiction'] },
  { title: 'Neuromancer', author: 'William Gibson', isbn: '978-0-00-100002-7', priceCents: 1475, stockQuantity: 11, description: 'A burned-out hacker takes one last job in cyberspace.', categories: ['Science Fiction'] },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: '978-0-00-100003-4', priceCents: 1325, stockQuantity: 9, description: 'An envoy visits a world where people have no fixed gender.', categories: ['Science Fiction'] },
  { title: 'The Martian Chronicles', author: 'Ray Bradbury', isbn: '978-0-00-100004-1', priceCents: 1199, stockQuantity: 8, description: 'Linked stories about people settling Mars.', categories: ['Science Fiction'] },
  { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', isbn: '978-0-00-100005-8', priceCents: 1099, stockQuantity: 13, description: 'A young wizard learns the cost of power.', categories: ['Fantasy'] },
  { title: 'The Fellowship of the Ring', author: 'J.R.R. Tolkien', isbn: '978-0-00-100006-5', priceCents: 1799, stockQuantity: 18, description: 'Nine companions set out to destroy a ring.', categories: ['Fantasy'] },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '978-0-00-100007-2', priceCents: 1899, stockQuantity: 6, description: 'A legendary figure tells the true story of his life.', categories: ['Fantasy'] },
  { title: 'Good Omens', author: 'Terry Pratchett and Neil Gaiman', isbn: '978-0-00-100008-9', priceCents: 1499, stockQuantity: 10, description: 'An angel and a demon try to stop the end of the world.', categories: ['Fantasy'] },
  { title: 'And Then There Were None', author: 'Agatha Christie', isbn: '978-0-00-100009-6', priceCents: 1150, stockQuantity: 16, description: 'Ten strangers are invited to an island and then vanish one by one.', categories: ['Mystery', 'Classics'] },
  { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', isbn: '978-0-00-100010-2', priceCents: 999, stockQuantity: 12, description: 'Sherlock Holmes investigates a family curse on the moor.', categories: ['Mystery', 'Classics'] },
  { title: 'Gone Girl', author: 'Gillian Flynn', isbn: '978-0-00-100011-9', priceCents: 1599, stockQuantity: 7, description: 'A wife disappears and her husband becomes the suspect.', categories: ['Mystery'] },
  { title: 'The Big Sleep', author: 'Raymond Chandler', isbn: '978-0-00-100012-6', priceCents: 1250, stockQuantity: 5, description: 'A private detective takes a case for a wealthy family in Los Angeles.', categories: ['Mystery'] },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-0-00-100013-3', priceCents: 2199, stockQuantity: 22, description: 'A short history of humankind.', categories: ['Non-Fiction', 'History'] },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt and David Thomas', isbn: '978-0-00-100014-0', priceCents: 2499, stockQuantity: 9, description: 'Practical advice for working programmers.', categories: ['Non-Fiction'] },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '978-0-00-100015-7', priceCents: 1899, stockQuantity: 14, description: 'How two systems of thought shape our judgments.', categories: ['Non-Fiction'] },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0-00-100016-4', priceCents: 1399, stockQuantity: 10, description: 'From the big bang to black holes, for general readers.', categories: ['Non-Fiction'] },
  { title: 'The Guns of August', author: 'Barbara W. Tuchman', isbn: '978-0-00-100017-1', priceCents: 1699, stockQuantity: 4, description: 'The first month of the First World War.', categories: ['History', 'Non-Fiction'] },
  { title: 'SPQR', author: 'Mary Beard', isbn: '978-0-00-100018-8', priceCents: 1999, stockQuantity: 8, description: 'A history of ancient Rome.', categories: ['History'] },
  { title: 'The Silk Roads', author: 'Peter Frankopan', isbn: '978-0-00-100019-5', priceCents: 1799, stockQuantity: 6, description: 'A new history of the world told from the crossroads of Asia.', categories: ['History'] },
  { title: 'Persuasion', author: 'Jane Austen', isbn: '978-0-00-100020-1', priceCents: 1050, stockQuantity: 11, description: 'A second chance at love for a woman who once said no.', categories: ['Romance', 'Classics'] },
  { title: 'Outlander', author: 'Diana Gabaldon', isbn: '978-0-00-100021-8', priceCents: 1699, stockQuantity: 9, description: 'A nurse is thrown back two centuries in the Scottish Highlands.', categories: ['Romance', 'History'] },
  { title: 'Me Before You', author: 'Jojo Moyes', isbn: '978-0-00-100022-5', priceCents: 1399, stockQuantity: 13, description: 'A caregiver and her patient change each other.', categories: ['Romance'] },
  { title: 'Leaves of Grass', author: 'Walt Whitman', isbn: '978-0-00-100023-2', priceCents: 999, stockQuantity: 7, description: 'The landmark collection of American free verse.', categories: ['Poetry', 'Classics'] },
  { title: 'Ariel', author: 'Sylvia Plath', isbn: '978-0-00-100024-9', priceCents: 1199, stockQuantity: 5, description: 'Poems written in the last months of the poet\'s life.', categories: ['Poetry'] },
  { title: 'Milk and Honey', author: 'Rupi Kaur', isbn: '978-0-00-100025-6', priceCents: 1099, stockQuantity: 19, description: 'Short poems about love, loss and healing.', categories: ['Poetry'] },
  { title: 'The Waste Land', author: 'T.S. Eliot', isbn: '978-0-00-100026-3', priceCents: 899, stockQuantity: 3, description: 'A long poem of fragments after the First World War.', categories: ['Poetry', 'Classics'] },
]

// Codes for every outcome the checkout form can show
export const SEED_PROMOS = [
  { code: 'WELCOME10', type: 'PERCENT', value: 10 },
  { code: 'SAVE5', type: 'FIXED', value: 500 },
  { code: 'HALFOFF', type: 'PERCENT', value: 50 },
  { code: 'EXPIRED10', type: 'PERCENT', value: 10, expiresAt: new Date('2020-01-01T00:00:00Z') },
  { code: 'ONCEONLY', type: 'PERCENT', value: 20, maxUses: 1 },
  { code: 'DISABLED5', type: 'FIXED', value: 500, active: false },
] as const

export async function clearAllData(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "email_outbox", "audit_log", "reviews", "wishlist_items", "push_messages", "push_subscriptions", "order_events", "order_items", "orders", "cart_items", "book_categories", "categories", "promo_codes", "Book", "users" RESTART IDENTITY CASCADE'
  )
}

// Wipes every table and inserts the fixed data set. Running it twice gives the
// same rows with the same ids.
export async function resetAndSeed(
  prisma: PrismaClient,
  accounts: SeedAccounts
): Promise<{ books: number; users: number; categories: number; promoCodes: number }> {
  await clearAllData(prisma)

  await prisma.category.createMany({
    data: SEED_CATEGORIES.map((name) => ({ name, slug: slugify(name) })),
  })
  const categoryIds = new Map(
    (await prisma.category.findMany()).map((category) => [category.name, category.id])
  )

  await prisma.promoCode.createMany({ data: SEED_PROMOS.map((promo) => ({ ...promo })) })

  // One at a time so ids and creation times follow the list order
  for (const { categories, ...book } of SEED_BOOKS) {
    await prisma.book.create({
      data: {
        ...book,
        categories: { create: categories.map((name) => ({ categoryId: categoryIds.get(name)! })) },
      },
    })
  }

  const users: { email: string; password: string; name: string; role: 'ADMIN' | 'USER'; emailVerifiedAt: Date }[] = [
    {
      email: accounts.adminEmail.toLowerCase(),
      password: await bcrypt.hash(accounts.adminPassword, 10),
      name: 'Admin',
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  ]
  if (accounts.userEmail && accounts.userPassword) {
    users.push({
      email: accounts.userEmail.toLowerCase(),
      password: await bcrypt.hash(accounts.userPassword, 10),
      name: 'Test User',
      role: 'USER',
      emailVerifiedAt: new Date(),
    })
  }
  await prisma.user.createMany({ data: users })

  return { books: SEED_BOOKS.length, users: users.length, categories: SEED_CATEGORIES.length, promoCodes: SEED_PROMOS.length }
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
