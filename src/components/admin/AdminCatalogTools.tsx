'use client'

import { useCallback, useEffect, useState } from 'react'

interface Props {
  showToast: (message: string, type: 'success' | 'error') => void
  onImported: () => void
  // changes whenever the book list was reloaded
  refreshKey: unknown
}

interface LowStock {
  threshold: number
  outOfStock: number
  items: { id: number; title: string; author: string; stockQuantity: number }[]
}

interface Problem {
  row: number
  message: string
}

// Low-stock list plus CSV export and import for the Books tab.
export default function AdminCatalogTools({ showToast, onImported, refreshKey }: Props) {
  const [low, setLow] = useState<LowStock | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileKey, setFileKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [problems, setProblems] = useState<Problem[]>([])
  const [summary, setSummary] = useState<string | null>(null)

  const loadLow = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/low-stock')
      if (response.ok) setLow(await response.json())
    } catch {
      /* the banner is optional */
    }
  }, [])

  useEffect(() => {
    loadLow()
  }, [loadLow, refreshKey])

  const send = async (dryRun: boolean) => {
    if (!file) return
    setBusy(true)
    setProblems([])
    setSummary(null)
    try {
      const response = await fetch(`/api/admin/books/import${dryRun ? '?dryRun=true' : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: await file.text(),
      })
      const data = await response.json().catch(() => null)
      if (response.ok) {
        setSummary(`${dryRun ? 'Check passed' : 'Imported'}: ${data.created} to add, ${data.updated} to update`.replace('to add', dryRun ? 'to add' : 'added').replace('to update', dryRun ? 'to update' : 'updated'))
        if (!dryRun) {
          showToast('Import finished', 'success')
          setFile(null)
          setFileKey((k) => k + 1)
          onImported()
          loadLow()
        }
      } else {
        setProblems(data?.details?.errors ?? [])
        setSummary(data?.error ?? 'Import failed')
        showToast(dryRun ? 'The file has problems' : 'Import failed, nothing was changed', 'error')
      }
    } catch {
      showToast('Import failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const visible = low ? (showAll ? low.items : low.items.slice(0, 5)) : []

  return (
    <div data-testid="admin-catalog-tools" className="mb-12 grid gap-px border border-mist-200 bg-mist-200 lg:grid-cols-2">
      <section data-testid="admin-low-stock" className="bg-white p-6">
        <p className="section-label mb-3">Inventory</p>
        {low && low.items.length > 0 ? (
          <>
            <h3 className="mb-1 font-display text-xl font-bold text-ink-950">
              <span data-testid="admin-low-stock-count">{low.items.length}</span> {low.items.length === 1 ? 'book is' : 'books are'} low on stock
            </h3>
            <p className="mb-4 text-sm text-ink-600">
              {low.threshold} or fewer copies{low.outOfStock > 0 ? `, ${low.outOfStock} sold out` : ''}.
            </p>
            <ul className="divide-y divide-mist-200 border-y border-mist-200">
              {visible.map((b) => (
                <li key={b.id} data-testid={`admin-low-stock-item-${b.id}`} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="min-w-0 truncate text-ink-800">{b.title}</span>
                  <span className={`badge ${b.stockQuantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                    {b.stockQuantity === 0 ? 'Out of stock' : `${b.stockQuantity} left`}
                  </span>
                </li>
              ))}
            </ul>
            {low.items.length > 5 && (
              <button type="button" data-testid="admin-low-stock-toggle" onClick={() => setShowAll(!showAll)} className="mt-3 text-sm font-semibold text-cobalt-500 underline underline-offset-4">
                {showAll ? 'Show fewer' : `Show all ${low.items.length}`}
              </button>
            )}
          </>
        ) : (
          <p data-testid="admin-low-stock-ok" className="text-sm text-ink-600">Every book has more than {low?.threshold ?? 5} copies.</p>
        )}
      </section>

      <section data-testid="admin-csv" className="bg-white p-6">
        <p className="section-label mb-3">Catalog file</p>
        <h3 className="mb-1 font-display text-xl font-bold text-ink-950">Import and export</h3>
        <p className="mb-4 text-sm text-ink-600">
          CSV with isbn, title, author, price, stock, categories (separated by |) and description. A known ISBN updates the book.
        </p>
        <a data-testid="admin-csv-export-link" href="/api/admin/books/export" download className="btn btn-secondary btn-sm mb-4">
          Export CSV
        </a>
        <div>
          <label htmlFor="csv-file" className="label">Import file</label>
          <input
            key={fileKey}
            id="csv-file"
            data-testid="admin-csv-file-input"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setProblems([])
              setSummary(null)
            }}
            className="input mb-3 text-sm"
          />
          <div className="flex gap-2">
            <button type="button" data-testid="admin-csv-check-button" disabled={!file || busy} onClick={() => send(true)} className="btn btn-secondary btn-sm">
              Check file
            </button>
            <button type="button" data-testid="admin-csv-import-button" disabled={!file || busy} onClick={() => send(false)} className="btn btn-primary btn-sm">
              {busy ? 'Working...' : 'Import'}
            </button>
          </div>
          {summary && (
            <p data-testid="admin-csv-summary" role="status" className="mt-3 text-sm font-semibold text-ink-900">{summary}</p>
          )}
          {problems.length > 0 && (
            <ul data-testid="admin-csv-errors" className="mt-2 max-h-40 overflow-y-auto border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
              {problems.map((p, i) => (
                <li key={i}>Row {p.row}: {p.message}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
