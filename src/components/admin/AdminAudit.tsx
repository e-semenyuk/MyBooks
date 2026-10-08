'use client'

import { useCallback, useEffect, useState } from 'react'
import Pagination from '@/components/Pagination'

interface Entry {
  id: number
  action: string
  entity: string
  entityId: number | null
  summary: string
  createdAt: string
  actor: { id: number; name: string; email: string } | null
}

const ACTIONS = [
  'BOOK_CREATED',
  'BOOK_DELETED',
  'BOOK_PRICE_CHANGED',
  'BOOK_STOCK_CHANGED',
  'BOOKS_IMPORTED',
  'ORDER_STATUS_CHANGED',
  'REVIEW_HIDDEN',
  'REVIEW_SHOWN',
  'REVIEW_DELETED',
  'USER_ROLE_CHANGED',
  'USER_DEACTIVATED',
  'USER_ACTIVATED',
]

export default function AdminAudit({ showToast }: { showToast: (message: string, type: 'success' | 'error') => void }) {
  const [items, setItems] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({ action: '', from: '', to: '' })

  const load = useCallback(
    async (nextPage = 1, f = filters) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(nextPage) })
        for (const [k, v] of Object.entries(f)) if (v) params.set(k, v)
        const response = await fetch(`/api/admin/audit?${params}`)
        if (!response.ok) throw new Error('Request failed')
        const data = await response.json()
        setItems(data.items)
        setPage(data.page)
        setTotalPages(data.totalPages)
      } catch {
        showToast('Failed to load the audit log', 'error')
      } finally {
        setLoading(false)
      }
    },
    [filters, showToast]
  )

  useEffect(() => {
    load(1)
    // first load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div data-testid="admin-audit-section">
      <form
        className="mb-8 grid gap-4 border-b border-mist-200 pb-8 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault()
          load(1)
        }}
      >
        <div>
          <label htmlFor="audit-action" className="label">Action</label>
          <select id="audit-action" data-testid="admin-audit-filter-action" className="input" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
            <option value="">All</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a.toLowerCase().replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audit-from" className="label">From</label>
          <input id="audit-from" type="date" data-testid="admin-audit-filter-from" className="input" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div>
          <label htmlFor="audit-to" className="label">To</label>
          <input id="audit-to" type="date" data-testid="admin-audit-filter-to" className="input" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" data-testid="admin-audit-filter-apply" className="btn btn-primary">Apply filters</button>
          <button
            type="button"
            data-testid="admin-audit-filter-clear"
            className="btn btn-secondary"
            onClick={() => {
              const cleared = { action: '', from: '', to: '' }
              setFilters(cleared)
              load(1, cleared)
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {loading ? (
        <div data-testid="admin-audit-loading" aria-busy="true" className="skeleton h-40 w-full" />
      ) : items.length === 0 ? (
        <div data-testid="admin-no-audit" className="empty-state">
          <p className="section-label mb-4">0 entries</p>
          <h3 className="panel-title">Nothing recorded</h3>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table data-testid="admin-audit-table" className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>What</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.id} data-testid={`admin-audit-${e.id}`}>
                    <td className="whitespace-nowrap font-mono text-xs">{new Date(e.createdAt).toLocaleString('en-US')}</td>
                    <td className="text-sm">{e.actor ? e.actor.email : 'System'}</td>
                    <td><span className="badge badge-primary">{e.action}</span></td>
                    <td className="text-sm text-ink-800">{e.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={(p) => load(p)} />
        </>
      )}
    </div>
  )
}
