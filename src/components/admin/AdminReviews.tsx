'use client'

import { useCallback, useEffect, useState } from 'react'
import Stars from '@/components/Stars'

interface Row {
  id: number
  rating: number
  title: string | null
  body: string | null
  status: 'VISIBLE' | 'HIDDEN'
  createdAt: string
  book: { id: number; title: string }
  user: { id: number; name: string; email: string }
}

interface Props {
  showToast: (message: string, type: 'success' | 'error') => void
}

export default function AdminReviews({ showToast }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')

  const load = useCallback(
    async (nextStatus = status, nextQ = q) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (nextStatus) params.set('status', nextStatus)
        if (nextQ) params.set('q', nextQ)
        const response = await fetch(`/api/admin/reviews${params.size ? `?${params}` : ''}`)
        if (!response.ok) throw new Error('Request failed')
        setRows(await response.json())
      } catch {
        showToast('Failed to load reviews', 'error')
      } finally {
        setLoading(false)
      }
    },
    [status, q, showToast]
  )

  useEffect(() => {
    load()
    // first load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const moderate = async (row: Row, next: 'VISIBLE' | 'HIDDEN') => {
    const response = await fetch(`/api/reviews/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (response.ok) {
      showToast(next === 'HIDDEN' ? 'Review hidden' : 'Review shown', 'success')
      load()
    } else {
      showToast('Failed to update review', 'error')
    }
  }

  const remove = async (row: Row) => {
    if (!confirm('Delete this review for good?')) return
    const response = await fetch(`/api/reviews/${row.id}`, { method: 'DELETE' })
    if (response.ok) {
      showToast('Review deleted', 'success')
      load()
    } else {
      showToast('Failed to delete review', 'error')
    }
  }

  return (
    <div data-testid="admin-reviews-section">
      <form
        className="mb-8 grid gap-4 border-b border-mist-200 pb-8 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault()
          load()
        }}
      >
        <div>
          <label htmlFor="review-filter-q" className="label">Search</label>
          <input id="review-filter-q" data-testid="admin-review-filter-search" className="input" placeholder="Book, reader email or text" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label htmlFor="review-filter-status" className="label">Status</label>
          <select id="review-filter-status" data-testid="admin-review-filter-status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="VISIBLE">Visible</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" data-testid="admin-review-filter-apply" className="btn btn-primary">Apply filters</button>
          <button
            type="button"
            data-testid="admin-review-filter-clear"
            className="btn btn-secondary"
            onClick={() => {
              setQ('')
              setStatus('')
              load('', '')
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {loading ? (
        <div data-testid="admin-reviews-loading" aria-busy="true" className="skeleton h-32 w-full" />
      ) : rows.length === 0 ? (
        <div data-testid="admin-no-reviews" className="empty-state">
          <p className="section-label mb-4">0 reviews</p>
          <h3 className="panel-title">No reviews found</h3>
        </div>
      ) : (
        <ul data-testid="admin-reviews-list" className="border-t-2 border-ink-950">
          {rows.map((row) => (
            <li key={row.id} data-testid={`admin-review-${row.id}`} className="flex flex-wrap items-start justify-between gap-4 border-b border-mist-200 py-6">
              <div className="min-w-0 max-w-2xl">
                <div className="mb-1 flex flex-wrap items-center gap-3">
                  <Stars value={row.rating} />
                  <span data-testid={`admin-review-status-${row.id}`} className={`badge ${row.status === 'HIDDEN' ? 'badge-warning' : 'badge-success'}`}>
                    {row.status === 'HIDDEN' ? 'Hidden' : 'Visible'}
                  </span>
                </div>
                <p className="font-display text-lg font-bold text-ink-950">{row.book.title}</p>
                {row.title && <p className="font-semibold text-ink-800">{row.title}</p>}
                {row.body && <p className="whitespace-pre-line text-ink-700">{row.body}</p>}
                <p className="mt-1 font-mono text-xs text-ink-500">
                  {row.user.name}, {row.user.email}, {new Date(row.createdAt).toLocaleDateString('en-US')}
                </p>
              </div>
              <div className="flex gap-2">
                {row.status === 'VISIBLE' ? (
                  <button data-testid={`admin-review-hide-${row.id}`} onClick={() => moderate(row, 'HIDDEN')} className="btn btn-secondary btn-sm">Hide</button>
                ) : (
                  <button data-testid={`admin-review-show-${row.id}`} onClick={() => moderate(row, 'VISIBLE')} className="btn btn-secondary btn-sm">Show</button>
                )}
                <button data-testid={`admin-review-delete-${row.id}`} onClick={() => remove(row)} className="btn btn-danger btn-sm">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
