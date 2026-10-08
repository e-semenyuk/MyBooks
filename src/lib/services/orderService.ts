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
import type { PromoCode } from '@prisma/client'
import { CartOwner } from '@/lib/cartOwner'
import { ApiError } from '@/lib/api/errors'
import {
  PROMO_MESSAGES,
  ShippingMethodName,
  computeTotals,
  normalizePromoCode,
  promoProblem,
  taxRateFromEnv,
} from '@/lib/pricing'
import { paymentProvider } from '@/lib/payments'
import { cardBrand, normalizeCardNumber } from '@/lib/payments/card'
import { paymentFailed } from '@/lib/payments/mockProvider'
import { CartService } from './cartService'
import { BookService } from './bookService'

const payments = { orderBy: { id: 'desc' }, take: 3 } satisfies Prisma.Order$paymentsArgs
const withItems = { orderItems: { include: { book: true } }, payments } satisfies Prisma.OrderInclude
const withItemsAndEvents = {
  orderItems: { include: { book: true } },
  events: { orderBy: { createdAt: 'asc' } },
  payments,
} satisfies Prisma.OrderInclude

export class OrderNotFoundError extends Error {
  readonly code = 'ORDER_NOT_FOUND'
  constructor(id: number) {
    super(`Order not found: ${id}`)
  }
}

// The cart cannot be turned into an order (empty, missing book, not enough stock).
export class OrderRejectedError extends Error {
  readonly code = 'ORDER_REJECTED'
}

export class OrderService {
  // What the cart would cost with this shipping method and promo code. Throws
  // OrderRejectedError for an empty cart and ApiError for a bad promo code.
  static async quote(owner: CartOwner, input: { shippingMethod: ShippingMethodName; promoCode?: string }) {
    const cartItems = await CartService.getCartItems(owner)
    if (cartItems.length === 0) throw new OrderRejectedError('Cart is empty')

    const books = await BookService.getRowsByIds(cartItems.map((item) => item.bookId))

    const lines = cartItems.map((cartItem) => {
      const book = books.get(cartItem.bookId)
      if (!book) throw new OrderRejectedError(`Book not found with ID: ${cartItem.bookId}`)
      if (book.stockQuantity < cartItem.quantity) {
        throw new OrderRejectedError(`Insufficient stock for book: ${book.title}`)
      }
      return { cartItem, book, priceCents: book.priceCents, quantity: cartItem.quantity }
    })

    let promo: PromoCode | null = null
    const code = input.promoCode ? normalizePromoCode(input.promoCode) : ''
    if (code) {
      promo = await prisma.promoCode.findUnique({ where: { code } })
      const problem = promoProblem(promo, new Date())
      if (problem) throw ApiError.badRequest(PROMO_MESSAGES[problem], problem)
    }

    const totals = computeTotals({
      items: lines,
      promo: promo ? { type: promo.type, value: promo.value } : null,
      shippingMethod: input.shippingMethod,
      taxRate: taxRateFromEnv(),
    })

    return { lines, promo, totals }
  }

  // Pays first, then creates the order. A declined card creates no order and
  // leaves the cart and the stock alone. If the order cannot be completed after
  // the money was taken (for example the last copy sold in the meantime), the
  // charge is refunded.
  static async createOrder(
    owner: CartOwner,
    data: CreateOrderRequest
  ): Promise<Order> {
    if (owner.kind !== 'user') throw ApiError.unauthorized()
    const userId = owner.userId
    const shippingMethod = data.shippingMethod ?? 'STANDARD'
    const { lines, promo, totals } = await this.quote(owner, { shippingMethod, promoCode: data.promoCode })

    const cardNumber = normalizeCardNumber(data.card.number)
    const brand = cardBrand(cardNumber)
    const last4 = cardNumber.slice(-4)

    const charge = await paymentProvider.charge({ amountCents: totals.totalCents, cardNumber })
    if (!charge.ok) {
      await prisma.payment.create({
        data: {
          userId,
          amountCents: totals.totalCents,
          status: 'FAILED',
          cardBrand: brand,
          cardLast4: last4,
          failureCode: charge.code,
          failureMessage: charge.message,
        },
      })
      throw paymentFailed(charge)
    }

    let order
    try {
      order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            userId,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerAddress: data.customerAddress,
            subtotalCents: totals.subtotalCents,
            discountCents: totals.discountCents,
            shippingCents: totals.shippingCents,
            taxCents: totals.taxCents,
            totalCents: totals.totalCents,
            shippingMethod,
            promoCode: promo?.code ?? null,
            status: 'CONFIRMED',
            events: { create: { fromStatus: null, toStatus: 'CONFIRMED', actorId: userId } },
            payments: {
              create: {
                userId,
                amountCents: totals.totalCents,
                status: 'PAID',
                providerRef: charge.ref,
                cardBrand: brand,
                cardLast4: last4,
              },
            },
          },
        })

        for (const { cartItem, book } of lines) {
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
            throw new OrderRejectedError(`Insufficient stock for book: ${book.title}`)
          }
        }

        // Count the code once per order even when two orders race for the last use
        if (promo) {
          const redeemed = await tx.$executeRaw`
            UPDATE "promo_codes" SET "usedCount" = "usedCount" + 1
            WHERE "id" = ${promo.id} AND "active" = true
              AND ("maxUses" IS NULL OR "usedCount" < "maxUses")
              AND ("expiresAt" IS NULL OR "expiresAt" > NOW())`
          if (redeemed === 0) {
            throw ApiError.badRequest(PROMO_MESSAGES.PROMO_EXHAUSTED, 'PROMO_EXHAUSTED')
          }
        }

        return newOrder
      })
    } catch (error) {
      await paymentProvider.refund(charge.ref)
      await prisma.payment.create({
        data: {
          userId,
          amountCents: totals.totalCents,
          status: 'REFUNDED',
          providerRef: charge.ref,
          cardBrand: brand,
          cardLast4: last4,
          failureCode: 'ORDER_NOT_COMPLETED',
          failureMessage: 'The order could not be completed, so the charge was refunded',
        },
      })
      throw error
    }

    await CartService.clearCart(owner)

    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: withItems })
    return mapOrder(saved)
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
      include: withItemsAndEvents,
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
  static async updateOrderStatus(id: number, status: unknown, actorId: number | null = null): Promise<Order> {
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

      await tx.orderEvent.create({
        data: { orderId: id, fromStatus: order.status, toStatus: status, actorId },
      })

      if (status === 'CANCELLED') {
        for (const item of order.orderItems) {
          await tx.book.update({
            where: { id: item.bookId },
            data: { stockQuantity: { increment: item.quantity } },
          })
        }

        // Give the money back
        const paid = await tx.payment.findFirst({ where: { orderId: id, status: 'PAID' } })
        if (paid) {
          if (paid.providerRef) await paymentProvider.refund(paid.providerRef)
          await tx.payment.update({ where: { id: paid.id }, data: { status: 'REFUNDED' } })
        }
      }

      const updated = await tx.order.findUniqueOrThrow({
        where: { id },
        include: { events: { orderBy: { createdAt: 'asc' } }, payments },
      })
      return mapOrder(updated)
    })
  }
}
