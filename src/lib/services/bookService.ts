import { prisma } from '@/lib/prisma'
import { Book, CreateBookRequest, UpdateBookRequest } from '@/types'

export class BookService {
  static async getAllBooks(): Promise<Book[]> {
    return await prisma.book.findMany({
      orderBy: { title: 'asc' },
    })
  }

  static async getBookById(id: number): Promise<Book | null> {
    return await prisma.book.findUnique({
      where: { id },
    })
  }

  static async searchBooks(query: string): Promise<Book[]> {
    if (!query || query.trim() === '') {
      return this.getAllBooks()
    }

    return await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { title: 'asc' },
    })
  }

  static async getAvailableBooks(): Promise<Book[]> {
    return await prisma.book.findMany({
      where: {
        stockQuantity: { gt: 0 },
      },
      orderBy: { title: 'asc' },
    })
  }

  static async createBook(data: CreateBookRequest): Promise<Book> {
    return await prisma.book.create({
      data,
    })
  }

  static async updateBook(id: number, data: UpdateBookRequest): Promise<Book> {
    return await prisma.book.update({
      where: { id },
      data,
    })
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

