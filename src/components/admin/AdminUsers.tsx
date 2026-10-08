'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Pagination from '@/components/Pagination'

interface UserRow {
  id: number
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  active: boolean
  orderCount: number
  createdAt: string
}

interface Props {
  showToast: (message: string, type: 'success' | 'error') => void
}

export default function AdminUsers({ showToast }: Props) {
  const { data: session } = useSession()
  const myId = Number((session?.user as any)?.id)
  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({ q: '', role: '', active: '' })

  const load = useCallback(
    async (nextPage = 1, f = filters) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(nextPage) })
        for (const [k, v] of Object.entries(f)) if (v) params.set(k, v)
        const response = await fetch(`/api/admin/users?${params}`)
        if (!response.ok) throw new Error('Request failed')
        const data = await response.json()
        setRows(data.items)
        setPage(data.page)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      } catch {
        showToast('Failed to load users', 'error')
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

  const patch = async (row: UserRow, change: { role?: string; active?: boolean }, message: string) => {
    const response = await fetch(`/api/admin/users/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(change),
    })
    if (response.ok) {
      showToast(message, 'success')
      load(page)
    } else {
      const data = await response.json().catch(() => null)
      showToast(data?.error ?? 'Failed to update user', 'error')
    }
  }

  return (
    <div data-testid="admin-users-section">
      <form
        className="mb-8 grid gap-4 border-b border-mist-200 pb-8 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault()
          load(1)
        }}
      >
        <div>
          <label htmlFor="user-filter-q" className="label">Search</label>
          <input id="user-filter-q" data-testid="admin-user-filter-search" className="input" placeholder="Name or email" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
        </div>
        <div>
          <label htmlFor="user-filter-role" className="label">Role</label>
          <select id="user-filter-role" data-testid="admin-user-filter-role" className="input" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All</option>
            <option value="USER">Customer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div>
          <label htmlFor="user-filter-active" className="label">Account</label>
          <select id="user-filter-active" data-testid="admin-user-filter-active" className="input" value={filters.active} onChange={(e) => setFilters({ ...filters, active: e.target.value })}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" data-testid="admin-user-filter-apply" className="btn btn-primary">Apply filters</button>
          <button
            type="button"
            data-testid="admin-user-filter-clear"
            className="btn btn-secondary"
            onClick={() => {
              const cleared = { q: '', role: '', active: '' }
              setFilters(cleared)
              load(1, cleared)
            }}
          >
            Clear
          </button>
        </div>
      </form>

      {loading ? (
        <div data-testid="admin-users-loading" aria-busy="true" className="skeleton h-40 w-full" />
      ) : rows.length === 0 ? (
        <div data-testid="admin-no-users" className="empty-state">
          <p className="section-label mb-4">0 users</p>
          <h3 className="panel-title">No users match</h3>
        </div>
      ) : (
        <>
          <p className="mb-3 font-mono text-xs text-ink-600" data-testid="admin-users-total">{total} users</p>
          <div className="relative overflow-x-auto">
            <table data-testid="admin-users-table" className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Account</th>
                  <th className="text-right">Orders</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const self = row.id === myId
                  return (
                    <tr key={row.id} data-testid={`admin-user-${row.id}`}>
                      <td>
                        <p className="font-semibold text-ink-950">{row.name}</p>
                        <p className="font-mono text-xs text-ink-600">{row.email}</p>
                      </td>
                      <td>
                        <label htmlFor={`role-${row.id}`} className="sr-only">Role of {row.email}</label>
                        <select
                          id={`role-${row.id}`}
                          data-testid={`admin-user-role-${row.id}`}
                          className="input w-auto py-1.5 pr-8 text-sm"
                          value={row.role}
                          disabled={self}
                          onChange={(e) => patch(row, { role: e.target.value }, 'Role updated')}
                        >
                          <option value="USER">Customer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span data-testid={`admin-user-status-${row.id}`} className={`badge ${row.active ? 'badge-success' : 'badge-danger'}`}>
                          {row.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="num text-right">{row.orderCount}</td>
                      <td className="text-right">
                        {self ? (
                          <span className="text-xs text-ink-500">This is you</span>
                        ) : row.active ? (
                          <button data-testid={`admin-user-deactivate-${row.id}`} className="btn btn-danger btn-sm" onClick={() => patch(row, { active: false }, 'Account deactivated')}>
                            Deactivate
                          </button>
                        ) : (
                          <button data-testid={`admin-user-activate-${row.id}`} className="btn btn-secondary btn-sm" onClick={() => patch(row, { active: true }, 'Account activated')}>
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={(p) => load(p)} />
        </>
      )}
    </div>
  )
}
