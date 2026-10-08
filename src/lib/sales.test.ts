import { describe, expect, it } from 'vitest'
import { buildSalesReport, defaultRange } from './sales'

const d = (s: string) => new Date(`${s}T12:00:00Z`)

describe('buildSalesReport', () => {
  const orders = [
    { id: 1, orderDate: d('2026-10-01'), totalCents: 1000, status: 'DELIVERED' },
    { id: 2, orderDate: d('2026-10-01'), totalCents: 2000, status: 'CONFIRMED' },
    { id: 3, orderDate: d('2026-10-03'), totalCents: 500, status: 'CANCELLED' },
    { id: 4, orderDate: d('2026-10-03'), totalCents: 700, status: 'RETURNED' },
  ]
  const lines = [
    { orderId: 1, bookId: 1, title: 'A', quantity: 2, priceCents: 300 },
    { orderId: 2, bookId: 1, title: 'A', quantity: 1, priceCents: 300 },
    { orderId: 2, bookId: 2, title: 'B', quantity: 5, priceCents: 100 },
    { orderId: 3, bookId: 3, title: 'C', quantity: 9, priceCents: 50 },
  ]
  const report = buildSalesReport(orders, lines, '2026-10-01', '2026-10-04')

  it('counts revenue without cancelled and returned orders', () => {
    expect(report.revenueCents).toBe(3000)
    expect(report.orders).toBe(2)
    expect(report.averageOrderCents).toBe(1500)
    expect(report.refundedCents).toBe(1200)
    expect(report.refundedOrders).toBe(2)
  })
  it('counts every status', () => {
    expect(report.byStatus).toEqual({ DELIVERED: 1, CONFIRMED: 1, CANCELLED: 1, RETURNED: 1 })
  })
  it('lists top books by units and ignores refunded orders', () => {
    expect(report.topBooks.map((b) => [b.bookId, b.units, b.revenueCents])).toEqual([[2, 5, 500], [1, 3, 900]])
  })
  it('lists every day in range, also empty ones', () => {
    expect(report.daily).toEqual([
      { date: '2026-10-01', orders: 2, revenueCents: 3000 },
      { date: '2026-10-02', orders: 0, revenueCents: 0 },
      { date: '2026-10-03', orders: 0, revenueCents: 0 },
      { date: '2026-10-04', orders: 0, revenueCents: 0 },
    ])
  })
  it('handles an empty period', () => {
    const empty = buildSalesReport([], [], '2026-10-01', '2026-10-01')
    expect(empty.revenueCents).toBe(0)
    expect(empty.averageOrderCents).toBe(0)
    expect(empty.daily).toHaveLength(1)
  })
})

describe('defaultRange', () => {
  it('covers the last 30 days including today', () => {
    expect(defaultRange(new Date('2026-10-30T10:00:00Z'))).toEqual({ from: '2026-10-01', to: '2026-10-30' })
  })
})
