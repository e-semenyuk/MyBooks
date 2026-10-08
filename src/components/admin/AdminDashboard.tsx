'use client'

import { useCallback, useEffect, useState } from 'react'

interface Report {
  from: string
  to: string
  revenue: number
  orders: number
  averageOrderValue: number
  refunded: number
  refundedOrders: number
  byStatus: Record<string, number>
  topBooks: { bookId: number; title: string; units: number; revenue: number }[]
  daily: { date: string; orders: number; revenue: number }[]
}

const money = (n: number) => `$${n.toFixed(2)}`

export default function AdminDashboard({ showToast }: { showToast: (message: string, type: 'success' | 'error') => void }) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState({ from: '', to: '' })

  const load = useCallback(
    async (r = range) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (r.from) params.set('from', r.from)
        if (r.to) params.set('to', r.to)
        const response = await fetch(`/api/admin/sales${params.size ? `?${params}` : ''}`)
        const data = await response.json()
        if (!response.ok) {
          showToast(data?.error ?? 'Failed to load sales', 'error')
          return
        }
        setReport(data)
        setRange({ from: data.from, to: data.to })
      } catch {
        showToast('Failed to load sales', 'error')
      } finally {
        setLoading(false)
      }
    },
    [range, showToast]
  )

  useEffect(() => {
    load({ from: '', to: '' })
    // first load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const maxRevenue = report ? Math.max(1, ...report.daily.map((d) => d.revenue)) : 1
  const tile = (id: string, label: string, value: string) => (
    <div className="bg-white p-6">
      <p className="section-label mb-2">{label}</p>
      <p data-testid={id} className="num font-display text-4xl font-extrabold tracking-tight text-ink-950">{value}</p>
    </div>
  )

  return (
    <div data-testid="admin-dashboard-section">
      <form
        className="mb-8 flex flex-wrap items-end gap-4 border-b border-mist-200 pb-8"
        onSubmit={(e) => {
          e.preventDefault()
          load()
        }}
      >
        <div>
          <label htmlFor="sales-from" className="label">From</label>
          <input id="sales-from" type="date" data-testid="admin-sales-from" className="input" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} />
        </div>
        <div>
          <label htmlFor="sales-to" className="label">To</label>
          <input id="sales-to" type="date" data-testid="admin-sales-to" className="input" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} />
        </div>
        <button type="submit" data-testid="admin-sales-apply" className="btn btn-primary">Show figures</button>
        <button
          type="button"
          data-testid="admin-sales-reset"
          className="btn btn-secondary"
          onClick={() => load({ from: '', to: '' })}
        >
          Last 30 days
        </button>
      </form>

      {loading && !report ? (
        <div data-testid="admin-sales-loading" aria-busy="true" className="skeleton h-40 w-full" />
      ) : report ? (
        <>
          <div className="mb-10 grid gap-px border border-mist-200 bg-mist-200 sm:grid-cols-2 lg:grid-cols-4">
            {tile('admin-sales-revenue', 'Revenue', money(report.revenue))}
            {tile('admin-sales-orders', 'Orders', String(report.orders))}
            {tile('admin-sales-average', 'Average order', money(report.averageOrderValue))}
            {tile('admin-sales-refunded', `Refunded (${report.refundedOrders})`, money(report.refunded))}
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            <section>
              <h3 className="section-label mb-4 border-t-2 border-ink-950 pt-4">Revenue by day</h3>
              <ol data-testid="admin-sales-daily" className="space-y-1">
                {report.daily.map((d) => (
                  <li key={d.date} data-testid={`admin-sales-day-${d.date}`} className="grid grid-cols-[88px_1fr_72px] items-center gap-3 text-xs">
                    <span className="font-mono text-ink-600">{d.date}</span>
                    <span className="h-3 bg-mist-100">
                      <span className="block h-3 bg-cobalt-500" style={{ width: `${(d.revenue / maxRevenue) * 100}%` }} />
                    </span>
                    <span className="num text-right font-mono text-ink-800">{money(d.revenue)}</span>
                  </li>
                ))}
              </ol>
            </section>

            <div className="space-y-12">
              <section>
                <h3 className="section-label mb-4 border-t-2 border-ink-950 pt-4">Top books</h3>
                {report.topBooks.length === 0 ? (
                  <p data-testid="admin-sales-no-books" className="text-sm text-ink-600">No sales in this period.</p>
                ) : (
                  <table data-testid="admin-sales-top" className="data-table">
                    <thead>
                      <tr><th>Book</th><th className="text-right">Units</th><th className="text-right">Revenue</th></tr>
                    </thead>
                    <tbody>
                      {report.topBooks.map((b) => (
                        <tr key={b.bookId} data-testid={`admin-sales-top-${b.bookId}`}>
                          <td>{b.title}</td>
                          <td className="num text-right">{b.units}</td>
                          <td className="num text-right">{money(b.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
              <section>
                <h3 className="section-label mb-4 border-t-2 border-ink-950 pt-4">Orders by status</h3>
                <dl data-testid="admin-sales-status" className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(report.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between border-b border-mist-200 py-1">
                      <dt className="text-ink-700">{status.charAt(0) + status.slice(1).toLowerCase()}</dt>
                      <dd className="num font-mono">{count}</dd>
                    </div>
                  ))}
                  {Object.keys(report.byStatus).length === 0 && <p className="text-ink-600">No orders in this period.</p>}
                </dl>
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
