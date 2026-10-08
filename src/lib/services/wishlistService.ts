import { prisma } from '@/lib/prisma'
import { mapBook } from '@/lib/mappers'
import { ApiError } from '@/lib/api/errors'

export class WishlistService {
  static async list(userId: number) {
    const rows = await prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { book: { include: { categories: { include: { category: true } }, cover: { select: { updatedAt: true } } } } },
    })
    return rows.map((row) => ({ addedAt: row.createdAt, book: mapBook(row.book) }))
  }

  // Adding a book that is already saved is fine; the answer says whether it was new.
  static async add(userId: number, bookId: number): Promise<boolean> {
    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } })
    if (!book) throw ApiError.notFound('Book not found', 'BOOK_NOT_FOUND')
    const existing = await prisma.wishlistItem.findUnique({ where: { userId_bookId: { userId, bookId } } })
    if (existing) return false
    try {
      await prisma.wishlistItem.create({ data: { userId, bookId } })
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error
      return false
    }
    return true
  }

  static async remove(userId: number, bookId: number): Promise<void> {
    await prisma.wishlistItem.deleteMany({ where: { userId, bookId } })
  }

  static async ids(userId: number): Promise<number[]> {
    const rows = await prisma.wishlistItem.findMany({ where: { userId }, select: { bookId: true } })
    return rows.map((r) => r.bookId)
  }
}
