import type { Book as BookRow } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ApiError } from '@/lib/api/errors'
import { mapBook } from '@/lib/mappers'
import { toCents } from '@/lib/money'
import { Book, CreateBookRequest, PagedBooks, UpdateBookRequest } from '@/types'
import type { Prisma } from '@prisma/client'
import type { BookSort } from '@/lib/validation/schemas'

const withCategories = {
  categories: { include: { category: true } },
  cover: { select: { updatedAt: true } },
} satisfies Prisma.BookInclude

export interface BookListFilters {
  query?: string
  category?: string
  author?: string
  minPrice?: number
  maxPrice?: number
  sort: BookSort
  page: number
  pageSize: number
}

const ORDER_BY: Record<BookSort, Prisma.BookOrderByWithRelationInput[]> = {
  title: [{ title: 'asc' }, { id: 'asc' }],
  price_asc: [{ priceCents: 'asc' }, { title: 'asc' }],
  price_desc: [{ priceCents: 'desc' }, { title: 'asc' }],
  newest: [{ createdAt: 'desc' }, { id: 'desc' }],
}

export class BookService {
  static async getAllBooks(): Promise<Book[]> {
    const rows = await prisma.book.findMany({
      orderBy: { title: 'asc' },
      include: withCategories,
    })
    return rows.map(mapBook)
  }

  static async getBookById(id: number): Promise<Book | null> {
    const row = await prisma.book.findUnique({
      where: { id },
      include: withCategories,
    })
    return row ? mapBook(row) : null
  }

  // Raw rows (prices in cents) for callers that do money math in one query.
  static async getRowsByIds(ids: number[]): Promise<Map<number, BookRow>> {
    const rows = await prisma.book.findMany({
      where: { id: { in: Array.from(new Set(ids)) } },
    })
    return new Map(rows.map((row) => [row.id, row]))
  }

  // ISBNs are stored with hyphens; people type them with or without
  private static async isbnMatchIds(query: string): Promise<number[]> {
    const compact = query.replace(/[\s-]/g, '')
    if (!/^[0-9Xx]{4,}$/.test(compact)) return []
    const rows = await prisma.$queryRaw<{ id: number }[]>`
      SELECT "id" FROM "Book" WHERE REPLACE("isbn", '-', '') ILIKE ${'%' + compact + '%'}`
    return rows.map((row) => row.id)
  }

  static async searchBooks(query: string): Promise<Book[]> {
    if (!query || query.trim() === '') {
      return this.getAllBooks()
    }
    const result = await this.listBooks({ query, sort: 'title', page: 1, pageSize: 100 })
    return result.items
  }

  // Filtered, sorted, paged catalog. A page past the end returns the last page.
  static async listBooks(filters: BookListFilters): Promise<PagedBooks> {
    const and: Prisma.BookWhereInput[] = []

    if (filters.query) {
      const ids = await this.isbnMatchIds(filters.query)
      and.push({
        OR: [
          { title: { contains: filters.query, mode: 'insensitive' } },
          { author: { contains: filters.query, mode: 'insensitive' } },
          { isbn: { contains: filters.query, mode: 'insensitive' } },
          { id: { in: ids } },
        ],
      })
    }
    if (filters.category) {
      and.push({ categories: { some: { category: { slug: filters.category } } } })
    }
    if (filters.author) {
      and.push({ author: { contains: filters.author, mode: 'insensitive' } })
    }
    if (filters.minPrice !== undefined) {
      and.push({ priceCents: { gte: toCents(filters.minPrice) } })
    }
    if (filters.maxPrice !== undefined) {
      and.push({ priceCents: { lte: toCents(filters.maxPrice) } })
    }

    const where: Prisma.BookWhereInput = and.length ? { AND: and } : {}
    const total = await prisma.book.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))
    const page = Math.min(filters.page, totalPages)

    const rows = await prisma.book.findMany({
      where,
      orderBy: ORDER_BY[filters.sort],
      skip: (page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: withCategories,
    })

    return { items: rows.map(mapBook), total, page, pageSize: filters.pageSize, totalPages }
  }

  static async getAvailableBooks(): Promise<Book[]> {
    const rows = await prisma.book.findMany({
      where: {
        stockQuantity: { gt: 0 },
      },
      orderBy: { title: 'asc' },
    })
    return rows.map(mapBook)
  }

  // Books that share a category or the author with this one, closest first.
  // Books in stock come before sold-out ones. Never includes the book itself.
  static async getRelatedBooks(id: number, limit = 4): Promise<Book[] | null> {
    const book = await prisma.book.findUnique({ where: { id }, include: { categories: true } })
    if (!book) return null
    const categoryIds = book.categories.map((link) => link.categoryId)
    const candidates = await prisma.book.findMany({
      where: {
        id: { not: id },
        OR: [{ author: book.author }, ...(categoryIds.length ? [{ categories: { some: { categoryId: { in: categoryIds } } } }] : [])],
      },
      include: withCategories,
    })
    const score = (row: (typeof candidates)[number]) =>
      row.categories.filter((link) => categoryIds.includes(link.categoryId)).length * 2 + (row.author === book.author ? 3 : 0)
    return candidates
      .sort(
        (a, b) =>
          Number(b.stockQuantity > 0) - Number(a.stockQuantity > 0) ||
          score(b) - score(a) ||
          a.title.localeCompare(b.title)
      )
      .slice(0, limit)
      .map(mapBook)
  }

  // Throws RangeError when the price is negative, not finite or too large.
  static async createBook(data: CreateBookRequest): Promise<Book> {
    const { price, categoryIds, ...rest } = data
    const row = await prisma.book.create({
      data: {
        ...rest,
        priceCents: toCents(price),
        categories: { create: (categoryIds ?? []).map((categoryId) => ({ categoryId })) },
      },
      include: withCategories,
    })
    return mapBook(row)
  }

  static async updateBook(id: number, data: UpdateBookRequest): Promise<Book> {
    const { price, categoryIds, ...rest } = data
    const row = await prisma.book.update({
      where: { id },
      data: {
        ...rest,
        ...(price !== undefined ? { priceCents: toCents(price) } : {}),
        // Sending categoryIds replaces the whole set; leaving it out keeps it
        ...(categoryIds !== undefined
          ? { categories: { deleteMany: {}, create: categoryIds.map((categoryId) => ({ categoryId })) } }
          : {}),
      },
      include: withCategories,
    })
    return mapBook(row)
  }

  // A book that was ordered stays in the shop so order history keeps its titles.
  static async deleteBook(id: number): Promise<void> {
    const ordered = await prisma.orderItem.count({ where: { bookId: id } })
    if (ordered > 0) {
      throw ApiError.conflict('This book is part of existing orders and cannot be deleted', 'BOOK_HAS_ORDERS')
    }
    await prisma.book.delete({
      where: { id },
    })
  }

  static async updateStock(bookId: number, quantity: number): Promise<boolean> {
    const book = await this.getBookById(bookId)

    if (!book) {
      return false
    }

    if (book.stockQuantity < quantity) {
      return false
    }

    await prisma.book.update({
      where: { id: bookId },
      data: {
        stockQuantity: book.stockQuantity - quantity,
      },
    })

    return true
  }

  static async checkStockAvailability(bookId: number, quantity: number): Promise<boolean> {
    const book = await this.getBookById(bookId)
    return book ? book.stockQuantity >= quantity : false
  }
}
