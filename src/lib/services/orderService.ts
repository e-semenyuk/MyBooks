import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { mapOrder } from '@/lib/mappers'
import {
  InvalidStatusError,
  InvalidTransitionError,
  OrderStatus,
  canTransition,
  isOrderStatus,
} from '@/lib/orderStatus'
import { Order, OrderWithItems, CreateOrderRequest } from '@/types'
import { CartService } from './cartService'
import { BookService } from './bookService'

const withItems = { orderItems: { include: { book: true } } } satisfies Prisma.OrderInclude

export class OrderNotFoundError extends Error {
  readonly code = 'ORDER_NOT_FOUND'
  constructor(id: number) {
    super(`Order not found: ${id}`)
  }
}

export class OrderService {
  static async createOrder(
    sessionId: string,
    data: CreateOrderRequest,
    userId?: number | null
  ): Promise<Order> {
    const cartItems = await CartService.getCartItems(sessionId)

    if (cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    // One query for every book in the cart
    const books = await BookService.getRowsByIds(cartItems.map((item) => item.bookId))

    // Validate stock for all items first and add up the total in cents
    let totalCents = 0
    for (const cartItem of cartItems) {
      const book = books.get(cartItem.bookId)

      if (!book) {
        throw new Error(`Book not found with ID: ${cartItem.bookId}`)
      }

      if (book.stockQuantity < cartItem.quantity) {
        throw new Error(`Insufficient stock for book: ${book.title}`)
      }

      totalCents += book.priceCents * cartItem.quantity
    }

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: userId || null,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerAddress: data.customerAddress,
          totalCents,
          status: 'CONFIRMED',
        },
      })

      for (const cartItem of cartItems) {
        const book = books.get(cartItem.bookId)!

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            bookId: cartItem.bookId,
            quantity: cartItem.quantity,
            priceCents: book.priceCents,
          },
        })

        // Atomic conditional decrement: fails if stock was taken by a concurrent order
        const updated = await tx.book.updateMany({
          where: { id: cartItem.bookId, stockQuantity: { gte: cartItem.quantity } },
          data: { stockQuantity: { decrement: cartItem.quantity } },
        })

        if (updated.count === 0) {
          throw new Error(`Insufficient stock for book: ${book.title}`)
        }
      }

      return newOrder
    })

    await CartService.clearCart(sessionId)

    return mapOrder(order)
  }

  static async getAllOrders(): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      orderBy: { orderDate: 'desc' },
      include: withItems,
    })
    return rows.map((row) => mapOrder(row))
  }

  static async getOrderById(id: number): Promise<OrderWithItems | null> {
    const row = await prisma.order.findUnique({
      where: { id },
      include: withItems,
    })
    return row ? mapOrder(row) : null
  }

  static async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      where: { customerEmail: email },
      orderBy: { orderDate: 'desc' },
      include: withItems,
    })
    return rows.map((row) => mapOrder(row))
  }

  static async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      where: { status },
      orderBy: { orderDate: 'desc' },
      include: withItems,
    })
    return rows.map((row) => mapOrder(row))
  }

  static async getOrdersByUserId(userId: number): Promise<Order[]> {
    const rows = await prisma.order.findMany({
      where: { userId },
      orderBy: { orderDate: 'desc' },
      include: withItems,
    })
    return rows.map((row) => mapOrder(row))
  }

  // Moves an order along the allowed status flow. Cancelling puts the stock back.
  // Throws InvalidStatusError, OrderNotFoundError or InvalidTransitionError.
  static async updateOrderStatus(id: number, status: unknown): Promise<Order> {
    if (!isOrderStatus(status)) {
      throw new InvalidStatusError(status)
    }

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { orderItems: true },
      })

      if (!order) {
        throw new OrderNotFoundError(id)
      }

      if (!canTransition(order.status, status)) {
        throw new InvalidTransitionError(order.status, status)
      }

      // Guard against a concurrent change between the read above and this write
      const changed = await tx.order.updateMany({
        where: { id, status: order.status },
        data: { status },
      })

      if (changed.count === 0) {
        throw new InvalidTransitionError(order.status, status)
      }

      if (status === 'CANCELLED') {
        for (const item of order.orderItems) {
          await tx.book.update({
            where: { id: item.bookId },
            data: { stockQuantity: { increment: item.quantity } },
          })
        }
      }

      const updated = await tx.order.findUniqueOrThrow({ where: { id } })
      return mapOrder(updated)
    })
  }
}
