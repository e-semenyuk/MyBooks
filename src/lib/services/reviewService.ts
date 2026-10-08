import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api/errors'
import { publicName, summarizeRatings } from '@/lib/reviews'
import type { ReviewStatus } from '@prisma/client'

// Orders that count as "bought": paid and not given back
const PURCHASE_STATUSES = ['CONFIRMED', 'SHIPPED', 'DELIVERED'] as const

interface ReviewInput {
  rating: number
  title: string | null
  body: string | null
}

export class ReviewService {
  static async hasPurchased(userId: number, bookId: number): Promise<boolean> {
    const count = await prisma.orderItem.count({
      where: { bookId, order: { userId, status: { in: [...PURCHASE_STATUSES] } } },
    })
    return count > 0
  }

  private static async requireBook(bookId: number) {
    const book = await prisma.book.findUnique({ where: { id: bookId }, select: { id: true } })
    if (!book) throw ApiError.notFound('Book not found', 'BOOK_NOT_FOUND')
  }

  // Public view of a book's reviews. The viewer also learns whether they may
  // write one and sees their own review even when it is hidden.
  static async listForBook(bookId: number, viewerId: number | null) {
    await this.requireBook(bookId)
    const rows = await prisma.review.findMany({
      where: { bookId, status: 'VISIBLE' },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    })
    const mine = viewerId ? await prisma.review.findUnique({ where: { bookId_userId: { bookId, userId: viewerId } } }) : null
    const canReview = viewerId !== null && !mine && (await this.hasPurchased(viewerId, bookId))
    return {
      summary: summarizeRatings(rows.map((r) => r.rating)),
      items: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        author: publicName(r.user.name),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        mine: r.userId === viewerId,
      })),
      mine: mine
        ? { id: mine.id, rating: mine.rating, title: mine.title, body: mine.body, status: mine.status }
        : null,
      canReview,
    }
  }

  static async create(bookId: number, userId: number, input: ReviewInput) {
    await this.requireBook(bookId)
    if (!(await this.hasPurchased(userId, bookId))) {
      throw ApiError.forbidden('Only people who bought this book can review it', 'NOT_PURCHASED')
    }
    try {
      return await prisma.review.create({ data: { bookId, userId, ...input } })
    } catch (error: any) {
      if (error?.code === 'P2002') throw ApiError.conflict('You have already reviewed this book', 'ALREADY_REVIEWED')
      throw error
    }
  }

  private static async requireReview(id: number) {
    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) throw ApiError.notFound('Review not found', 'REVIEW_NOT_FOUND')
    return review
  }

  // Someone else's review looks like a missing one
  static async update(id: number, userId: number, input: Partial<ReviewInput>) {
    const review = await this.requireReview(id)
    if (review.userId !== userId) throw ApiError.notFound('Review not found', 'REVIEW_NOT_FOUND')
    return prisma.review.update({ where: { id }, data: input })
  }

  static async remove(id: number, user: { id: number; role: string }) {
    const review = await this.requireReview(id)
    if (review.userId !== user.id && user.role !== 'ADMIN') {
      throw ApiError.notFound('Review not found', 'REVIEW_NOT_FOUND')
    }
    await prisma.review.delete({ where: { id } })
    return review
  }

  static async moderate(id: number, status: ReviewStatus) {
    const review = await this.requireReview(id)
    const updated = await prisma.review.update({ where: { id }, data: { status } })
    return { before: review, after: updated }
  }

  static async listForAdmin(filters: { status?: ReviewStatus; q?: string }) {
    const rows = await prisma.review.findMany({
      where: {
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.q
          ? {
              OR: [
                { book: { title: { contains: filters.q, mode: 'insensitive' } } },
                { user: { email: { contains: filters.q, mode: 'insensitive' } } },
                { body: { contains: filters.q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { book: { select: { id: true, title: true } }, user: { select: { id: true, name: true, email: true } } },
    })
    return rows
  }
}
