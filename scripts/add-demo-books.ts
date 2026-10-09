import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import { SEED_BOOKS, SEED_CATEGORIES } from '../src/lib/testSupport/seed'
import { BOOK_IMAGES } from '../src/lib/testSupport/bookImages'
import { slugify } from '../src/lib/slug'

// Adds the demo catalog to a database that already has data. Unlike the test
// seed it never deletes or overwrites anything:
//  - a book that exists (same ISBN, or same title and author) is left alone,
//    except that a missing cover link is filled in;
//  - missing categories are created;
//  - the two test-only books (Anonymous) are skipped.
// Dry run by default: `npx tsx scripts/add-demo-books.ts` only reports.
// Add --apply to write.
// Reads .env.local like the app does; variables already set in the shell win
loadEnvConfig(process.cwd())
const apply = process.argv.includes('--apply')
const prisma = new PrismaClient()

async function main() {
  const target = new URL(process.env.POSTGRES_PRISMA_URL ?? 'postgres://unset')
  console.log(`Database: ${target.hostname}:${target.port || 5432}${target.pathname} (${apply ? 'WRITING' : 'dry run'})`)
  const catalog = SEED_BOOKS.filter((b) => b.author !== 'Anonymous')
  const categoryIds = new Map<string, number>()
  for (const name of SEED_CATEGORIES) {
    const slug = slugify(name)
    const existing = await prisma.category.findFirst({ where: { OR: [{ slug }, { name: { equals: name, mode: 'insensitive' } }] } })
    if (existing) categoryIds.set(name, existing.id)
    else if (apply) categoryIds.set(name, (await prisma.category.create({ data: { name, slug } })).id)
    else console.log(`would create category ${name}`)
  }

  let added = 0
  let present = 0
  let covers = 0
  for (const { categories, priceCents, stockQuantity, ...book } of catalog) {
    const existing = await prisma.book.findFirst({
      where: { OR: [{ isbn: book.isbn }, { title: { equals: book.title, mode: 'insensitive' }, author: { equals: book.author, mode: 'insensitive' } }] },
    })
    const imageUrl = BOOK_IMAGES[book.title] ?? null
    if (existing) {
      present++
      if (!existing.imageUrl && imageUrl) {
        covers++
        if (apply) await prisma.book.update({ where: { id: existing.id }, data: { imageUrl } })
      }
      continue
    }
    added++
    console.log(`${apply ? 'adding' : 'would add'}: ${book.title}`)
    if (apply) {
      await prisma.book.create({
        data: {
          ...book,
          priceCents,
          stockQuantity,
          imageUrl,
          categories: { create: categories.map((name) => ({ categoryId: categoryIds.get(name)! })) },
        },
      })
    }
  }
  const total = await prisma.book.count()
  console.log(`${apply ? 'Done' : 'Dry run'}: ${added} to add, ${present} already there, ${covers} cover links to fill. Books in database now: ${total}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
