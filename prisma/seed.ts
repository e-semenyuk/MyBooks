import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.book.deleteMany()

  // Create sample books
  const books = await Promise.all([
    prisma.book.create({
      data: {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0-7432-7356-5',
        price: 12.99,
        description: 'A classic American novel about the Jazz Age.',
        stockQuantity: 10,
      },
    }),
    prisma.book.create({
      data: {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0-06-112008-4',
        price: 14.99,
        description: 'A gripping tale of racial injustice and childhood innocence.',
        stockQuantity: 8,
      },
    }),
    prisma.book.create({
      data: {
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0-452-28423-4',
        price: 13.99,
        description: 'A dystopian social science fiction novel.',
        stockQuantity: 15,
      },
    }),
    prisma.book.create({
      data: {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        isbn: '978-0-14-143951-8',
        price: 11.99,
        description: 'A romantic novel of manners.',
        stockQuantity: 12,
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        isbn: '978-0-316-76948-0',
        price: 13.49,
        description: 'A controversial novel about teenage rebellion.',
        stockQuantity: 6,
      },
    }),
  ])

  console.log(`Created ${books.length} books`)
  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

