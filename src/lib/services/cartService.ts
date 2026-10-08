import { prisma } from '@/lib/prisma'
import { CartItem, CartItemWithBook } from '@/types'
import { BookService } from './bookService'
import { mapBook } from '@/lib/mappers'
import { fromCents } from '@/lib/money'

export class CartService {
  static async getCartItems(sessionId: string): Promise<CartItem[]> {
    return await prisma.cartItem.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })
  }

  static async getCartItemsWithBooks(sessionId: string): Promise<CartItemWithBook[]> {
    const cartItems = await this.getCartItems(sessionId)
    const rows = await BookService.getRowsByIds(cartItems.map((item) => item.bookId))

    // Items whose book no longer exists are left out
    return cartItems.flatMap((item) => {
      const row = rows.get(item.bookId)
      return row ? [{ ...item, book: mapBook(row) }] : []
    })
  }

  static async addToCart(sessionId: string, bookId: number, quantity: number): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        sessionId,
        bookId,
      },
    })

    if (existingItem) {
      // Update quantity
      return await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      })
    } else {
      // Create new cart item
      return await prisma.cartItem.create({
        data: {
          sessionId,
          bookId,
          quantity,
        },
      })
    }
  }

  static async updateCartItem(
    sessionId: string,
    itemId: number,
    quantity: number
  ): Promise<CartItem | null> {
    const result = await prisma.cartItem.updateMany({
      where: { id: itemId, sessionId },
      data: { quantity },
    })

    if (result.count === 0) return null

    return await prisma.cartItem.findUnique({ where: { id: itemId } })
  }

  static async removeCartItem(sessionId: string, itemId: number): Promise<boolean> {
    const result = await prisma.cartItem.deleteMany({
      where: { id: itemId, sessionId },
    })
    return result.count > 0
  }

  static async clearCart(sessionId: string): Promise<void> {
    await prisma.cartItem.deleteMany({
      where: { sessionId },
    })
  }

  static async calculateCartTotal(sessionId: string): Promise<number> {
    const cartItems = await this.getCartItems(sessionId)
    const rows = await BookService.getRowsByIds(cartItems.map((item) => item.bookId))

    const totalCents = cartItems.reduce((sum, item) => {
      const row = rows.get(item.bookId)
      return row ? sum + row.priceCents * item.quantity : sum
    }, 0)

    return fromCents(totalCents)
  }
}
