import { prisma } from '@/lib/prisma'
import { CartItem, CartItemWithBook } from '@/types'
import { BookService } from './bookService'

export class CartService {
  static async getCartItems(sessionId: string): Promise<CartItem[]> {
    return await prisma.cartItem.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })
  }

  static async getCartItemsWithBooks(sessionId: string): Promise<CartItemWithBook[]> {
    const cartItems = await this.getCartItems(sessionId)
    
    const itemsWithBooks = await Promise.all(
      cartItems.map(async (item) => {
        const book = await BookService.getBookById(item.bookId)
        return {
          ...item,
          book: book!,
        }
      })
    )

    return itemsWithBooks.filter(item => item.book !== null)
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

  static async updateCartItem(itemId: number, quantity: number): Promise<CartItem | null> {
    try {
      return await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      })
    } catch (error) {
      return null
    }
  }

  static async removeCartItem(itemId: number): Promise<void> {
    await prisma.cartItem.delete({
      where: { id: itemId },
    })
  }

  static async clearCart(sessionId: string): Promise<void> {
    await prisma.cartItem.deleteMany({
      where: { sessionId },
    })
  }

  static async calculateCartTotal(sessionId: string): Promise<number> {
    const cartItems = await this.getCartItems(sessionId)
    let total = 0

    for (const item of cartItems) {
      const book = await BookService.getBookById(item.bookId)
      if (book) {
        total += book.price * item.quantity
      }
    }

    return total
  }
}

