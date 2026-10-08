import { prisma } from '@/lib/prisma'
import { Order, OrderWithItems, CreateOrderRequest } from '@/types'
import { CartService } from './cartService'
import { BookService } from './bookService'

export class OrderService {
  static async createOrder(
    sessionId: string,
    data: CreateOrderRequest,
    userId?: number | null
  ): Promise<Order> {
    // Get cart items
    const cartItems = await CartService.getCartItems(sessionId)

    if (cartItems.length === 0) {
      throw new Error('Cart is empty')
    }

    // Validate stock availability for all items first
    for (const cartItem of cartItems) {
      const book = await BookService.getBookById(cartItem.bookId)
      
      if (!book) {
        throw new Error(`Book not found with ID: ${cartItem.bookId}`)
      }

      if (book.stockQuantity < cartItem.quantity) {
        throw new Error(`Insufficient stock for book: ${book.title}`)
      }
    }

    // Calculate total
    let totalAmount = 0
    const bookCache = new Map()

    for (const cartItem of cartItems) {
      const book = await BookService.getBookById(cartItem.bookId)
      if (book) {
        bookCache.set(cartItem.bookId, book)
        totalAmount += book.price * cartItem.quantity
      }
    }

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId: userId || null,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerAddress: data.customerAddress,
          totalAmount,
          status: 'CONFIRMED',
        },
      })

      // Create order items and update stock
      for (const cartItem of cartItems) {
        const book = bookCache.get(cartItem.bookId)

        // Create order item
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            bookId: cartItem.bookId,
            quantity: cartItem.quantity,
            price: book.price,
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

    // Clear cart
    await CartService.clearCart(sessionId)

    return order
  }

  static async getAllOrders(): Promise<Order[]> {
    return await prisma.order.findMany({
      orderBy: { orderDate: 'desc' },
      include: {
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    })
  }

  static async getOrderById(id: number): Promise<OrderWithItems | null> {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    }) as OrderWithItems | null
  }

  static async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    return await prisma.order.findMany({
      where: { customerEmail: email },
      orderBy: { orderDate: 'desc' },
      include: {
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    })
  }

  static async getOrdersByStatus(status: string): Promise<Order[]> {
    return await prisma.order.findMany({
      where: { status },
      orderBy: { orderDate: 'desc' },
      include: {
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    })
  }

  static async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await prisma.order.findMany({
      where: { userId },
      orderBy: { orderDate: 'desc' },
      include: {
        orderItems: {
          include: {
            book: true,
          },
        },
      },
    })
  }

  static async updateOrderStatus(id: number, status: string): Promise<Order> {
    return await prisma.order.update({
      where: { id },
      data: { status },
    })
  }
}

