import { prisma } from '@/lib/prisma'
import { Order, OrderWithItems, CreateOrderRequest } from '@/types'
import { CartService } from './cartService'
import { BookService } from './bookService'

export class OrderService {
  static async createOrder(
    sessionId: string,
    data: CreateOrderRequest
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

        // Update book stock
        await tx.book.update({
          where: { id: cartItem.bookId },
          data: {
            stockQuantity: book.stockQuantity - cartItem.quantity,
          },
        })
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
}

