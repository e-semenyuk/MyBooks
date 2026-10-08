import { prisma } from '@/lib/prisma'
import { CartItem, CartItemWithBook } from '@/types'
import { BookService } from './bookService'
import { mapBook } from '@/lib/mappers'
import { fromCents } from '@/lib/money'
import { CartOwner, ownerWhere } from '@/lib/cartOwner'
import { ApiError } from '@/lib/api/errors'
import { fitsInStock, mergedQuantity } from '@/lib/cartRules'

export class CartService {
  static async getCartItems(owner: CartOwner): Promise<CartItem[]> {
    return await prisma.cartItem.findMany({
      where: ownerWhere(owner),
      orderBy: { createdAt: 'asc' },
    })
  }

  static async getCartItemsWithBooks(owner: CartOwner): Promise<CartItemWithBook[]> {
    const cartItems = await this.getCartItems(owner)
    const rows = await BookService.getRowsByIds(cartItems.map((item) => item.bookId))

    // Items whose book no longer exists are left out
    return cartItems.flatMap((item) => {
      const row = rows.get(item.bookId)
      return row ? [{ ...item, book: mapBook(row) }] : []
    })
  }

  // Quantity must be a whole number (checked by the schema) and, together with
  // what is already in the cart, must not exceed stock.
  static async addToCart(owner: CartOwner, bookId: number, quantity: number): Promise<CartItem> {
    const book = await prisma.book.findUnique({ where: { id: bookId } })
    if (!book) throw ApiError.notFound('Book not found', 'BOOK_NOT_FOUND')

    if (book.stockQuantity <= 0) {
      throw ApiError.badRequest(`"${book.title}" is out of stock`, 'OUT_OF_STOCK')
    }

    const existing = await prisma.cartItem.findFirst({
      where: { bookId, ...ownerWhere(owner) },
    })
    const inCart = existing?.quantity ?? 0

    if (!fitsInStock(inCart, quantity, book.stockQuantity)) {
      throw ApiError.badRequest(
        inCart > 0
          ? `Only ${book.stockQuantity} in stock and ${inCart} already in your cart`
          : `Only ${book.stockQuantity} in stock`,
        'INSUFFICIENT_STOCK'
      )
    }

    if (existing) {
      return await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: inCart + quantity },
      })
    }

    return await prisma.cartItem.create({
      data: {
        bookId,
        quantity,
        ...(owner.kind === 'user' ? { userId: owner.userId } : { sessionId: owner.sessionId }),
      },
    })
  }

  static async updateCartItem(
    owner: CartOwner,
    itemId: number,
    quantity: number
  ): Promise<CartItem | null> {
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, ...ownerWhere(owner) },
      include: { book: true },
    })
    if (!item) return null

    if (quantity > item.book.stockQuantity) {
      throw ApiError.badRequest(`Only ${item.book.stockQuantity} in stock`, 'INSUFFICIENT_STOCK')
    }

    return await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    })
  }

  static async removeCartItem(owner: CartOwner, itemId: number): Promise<boolean> {
    const result = await prisma.cartItem.deleteMany({
      where: { id: itemId, ...ownerWhere(owner) },
    })
    return result.count > 0
  }

  static async clearCart(owner: CartOwner): Promise<void> {
    await prisma.cartItem.deleteMany({
      where: ownerWhere(owner),
    })
  }

  static async calculateCartTotal(owner: CartOwner): Promise<number> {
    const cartItems = await this.getCartItems(owner)
    const rows = await BookService.getRowsByIds(cartItems.map((item) => item.bookId))

    const totalCents = cartItems.reduce((sum, item) => {
      const row = rows.get(item.bookId)
      return row ? sum + row.priceCents * item.quantity : sum
    }, 0)

    return fromCents(totalCents)
  }

  // Moves a guest cart into the user's cart after sign-in. When the same book is
  // in both, the higher quantity wins. Quantities are capped at stock and books
  // with no stock are dropped. Returns the number of guest items processed.
  static async mergeGuestCart(sessionId: string, userId: number): Promise<number> {
    return await prisma.$transaction(async (tx) => {
      const guestItems = await tx.cartItem.findMany({
        where: { sessionId },
        include: { book: true },
      })

      for (const guest of guestItems) {
        const stock = guest.book.stockQuantity
        const mine = await tx.cartItem.findFirst({ where: { userId, bookId: guest.bookId } })
        const wanted = mergedQuantity(guest.quantity, mine?.quantity ?? 0, stock)

        if (mine) {
          if (wanted > 0 && wanted !== mine.quantity) {
            await tx.cartItem.update({ where: { id: mine.id }, data: { quantity: wanted } })
          }
          await tx.cartItem.delete({ where: { id: guest.id } })
        } else if (wanted > 0) {
          await tx.cartItem.update({
            where: { id: guest.id },
            data: { userId, sessionId: null, quantity: wanted },
          })
        } else {
          await tx.cartItem.delete({ where: { id: guest.id } })
        }
      }

      return guestItems.length
    })
  }
}
