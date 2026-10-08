import Link from 'next/link'
import { SearchOffIcon } from '@/components/icons'

export default function NotFound() {
  return (
    <div data-testid="not-found-page" className="empty-state">
      <SearchOffIcon className="mx-auto mb-4 h-8 w-8 text-stone-500" />
      <p className="section-label mb-2">Error 404</p>
      <h2 className="panel-title mb-2">Page not found</h2>
      <p className="mb-6 text-sm text-stone-600">We could not find the page you were looking for.</p>
      <Link data-testid="not-found-home-link" href="/" className="btn btn-primary">
        Back to the store
      </Link>
    </div>
  )
}
