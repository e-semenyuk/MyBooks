import type { Book as BookRow } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { mapBook } from '@/lib/mappers'
import { toCents } from '@/lib/money'
import { Book, CreateBookRequest, UpdateBookRequest } from '@/types'

export class BookService {
  static async getAllBooks(): Promise<Book[]> {
    const rows = await prisma.book.findMany({
      orderBy: { title: 'asc' },
    })
    return rows.map(mapBook)
  }

  static async getBookById(id: number): Promise<Book | null> {
    const row = await prisma.book.findUnique({
      where: { id },
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

  static async searchBooks(query: string): Promise<Book[]> {
    if (!query || query.trim() === '') {
      return this.getAllBooks()
    }

    const rows = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { title: 'asc' },
    })
    return rows.map(mapBook)
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

  // Throws RangeError when the price is negative, not finite or too large.
  static async createBook(data: CreateBookRequest): Promise<Book> {
    const { price, ...rest } = data
    const row = await prisma.book.create({
      data: { ...rest, priceCents: toCents(price) },
    })
    return mapBook(row)
  }

  static async updateBook(id: number, data: UpdateBookRequest): Promise<Book> {
    const { price, ...rest } = data
    const row = await prisma.book.update({
      where: { id },
      data: {
        ...rest,
        ...(price !== undefined ? { priceCents: toCents(price) } : {}),
      },
    })
    return mapBook(row)
  }

  static async deleteBook(id: number): Promise<void> {
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
