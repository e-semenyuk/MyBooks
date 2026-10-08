import { prisma } from '@/lib/prisma'
import { fromCents } from '@/lib/money'
import { buildSalesReport, defaultRange } from '@/lib/sales'
import { ApiError } from '@/lib/api/errors'

const MAX_DAYS = 366

export class SalesService {
  // Figures for orders placed from `from` to `to` (UTC dates, inclusive). Default: last 30 days.
  static async report(from?: string, to?: string) {
    const range = defaultRange()
    const start = from ?? range.from
    const end = to ?? range.to
    if (start > end) throw ApiError.badRequest('from must not be after to', 'INVALID_RANGE')
    const days = (Date.parse(end) - Date.parse(start)) / 86_400_000 + 1
    if (days > MAX_DAYS) throw ApiError.badRequest(`The period can be at most ${MAX_DAYS} days`, 'INVALID_RANGE')

    const orders = await prisma.order.findMany({
      where: { orderDate: { gte: new Date(`${start}T00:00:00.000Z`), lte: new Date(`${end}T23:59:59.999Z`) } },
      select: { id: true, orderDate: true, totalCents: true, status: true },
    })
    const items = await prisma.orderItem.findMany({
      where: { orderId: { in: orders.map((o) => o.id) } },
      select: { orderId: true, bookId: true, quantity: true, priceCents: true, book: { select: { title: true } } },
    })
    const report = buildSalesReport(
      orders,
      items.map((i) => ({ orderId: i.orderId, bookId: i.bookId, title: i.book.title, quantity: i.quantity, priceCents: i.priceCents })),
      start,
      end
    )
    return {
      from: start,
      to: end,
      revenue: fromCents(report.revenueCents),
      orders: report.orders,
      averageOrderValue: fromCents(report.averageOrderCents),
      refunded: fromCents(report.refundedCents),
      refundedOrders: report.refundedOrders,
      byStatus: report.byStatus,
      topBooks: report.topBooks.map((b) => ({ bookId: b.bookId, title: b.title, units: b.units, revenue: fromCents(b.revenueCents) })),
      daily: report.daily.map((d) => ({ date: d.date, orders: d.orders, revenue: fromCents(d.revenueCents) })),
    }
  }
}
