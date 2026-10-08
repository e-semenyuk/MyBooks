import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

// 1 ... 4 5 [6] 7 8 ... 20
export function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p))
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] === 2) result.push(p - 1) // never hide just one page
    else if (i > 0 && p - sorted[i - 1] > 2) result.push('gap')
    result.push(p)
  })
  return result
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const base = 'btn btn-secondary min-h-[40px] min-w-[40px] px-3'

  return (
    <nav data-testid="pagination" aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-between gap-4">
      <p data-testid="pagination-info" className="font-mono text-xs text-ink-600">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          data-testid="pagination-prev-button"
          className={base}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        {pageWindow(page, totalPages).map((entry, i) =>
          entry === 'gap' ? (
            <span key={`gap-${i}`} aria-hidden="true" className="px-1 font-mono text-ink-500">
              ...
            </span>
          ) : (
            <button
              key={entry}
              data-testid={`pagination-page-${entry}`}
              className={`${base} num ${entry === page ? '!border-ink-950 !bg-ink-950 !text-white' : ''}`}
              aria-current={entry === page ? 'page' : undefined}
              onClick={() => onChange(entry)}
            >
              {entry}
            </button>
          )
        )}
        <button
          data-testid="pagination-next-button"
          className={base}
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
