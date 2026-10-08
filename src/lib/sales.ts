// Pure sales figures for the admin dashboard (XPANBFLFA-128).

export interface SalesOrder {
  id: number
  orderDate: Date
  totalCents: number
  status: string
}

export interface SalesLine {
  orderId: number
  bookId: number
  title: string
  quantity: number
  priceCents: number
}

export interface SalesReport {
  revenueCents: number
  orders: number
  averageOrderCents: number
  refundedCents: number
  refundedOrders: number
  byStatus: Record<string, number>
  topBooks: { bookId: number; title: string; units: number; revenueCents: number }[]
  daily: { date: string; orders: number; revenueCents: number }[]
}

// Cancelled and returned orders were refunded: they do not count as revenue.
const REFUNDED = new Set(['CANCELLED', 'RETURNED'])

function day(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Every day from `from` to `to` (inclusive, UTC dates) is listed, also when nothing was sold.
export function buildSalesReport(orders: SalesOrder[], lines: SalesLine[], from: string, to: string): SalesReport {
  const byStatus: Record<string, number> = {}
  const dailyMap = new Map<string, { orders: number; revenueCents: number }>()
  for (let d = new Date(`${from}T00:00:00Z`); day(d) <= to; d = new Date(d.getTime() + 86_400_000)) {
    dailyMap.set(day(d), { orders: 0, revenueCents: 0 })
  }

  let revenueCents = 0
  let orderCount = 0
  let refundedCents = 0
  let refundedOrders = 0
  const counted = new Set<number>()
  for (const order of orders) {
    byStatus[order.status] = (byStatus[order.status] ?? 0) + 1
    if (REFUNDED.has(order.status)) {
      refundedCents += order.totalCents
      refundedOrders += 1
      continue
    }
    counted.add(order.id)
    revenueCents += order.totalCents
    orderCount += 1
    const bucket = dailyMap.get(day(order.orderDate))
    if (bucket) {
      bucket.orders += 1
      bucket.revenueCents += order.totalCents
    }
  }

  const books = new Map<number, { bookId: number; title: string; units: number; revenueCents: number }>()
  for (const line of lines) {
    if (!counted.has(line.orderId)) continue
    const entry = books.get(line.bookId) ?? { bookId: line.bookId, title: line.title, units: 0, revenueCents: 0 }
    entry.units += line.quantity
    entry.revenueCents += line.quantity * line.priceCents
    books.set(line.bookId, entry)
  }

  return {
    revenueCents,
    orders: orderCount,
    averageOrderCents: orderCount ? Math.round(revenueCents / orderCount) : 0,
    refundedCents,
    refundedOrders,
    byStatus,
    topBooks: Array.from(books.values())
      .sort((a, b) => b.units - a.units || b.revenueCents - a.revenueCents || a.title.localeCompare(b.title))
      .slice(0, 5),
    daily: Array.from(dailyMap, ([date, v]) => ({ date, ...v })),
  }
}

export function defaultRange(now: Date = new Date(), days = 30): { from: string; to: string } {
  return { from: day(new Date(now.getTime() - (days - 1) * 86_400_000)), to: day(now) }
}
