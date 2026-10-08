import Link from 'next/link'

export default function NotFound() {
  return (
    <div data-testid="not-found-page" className="text-center py-20">
      <div className="text-6xl mb-4">📖</div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Page not found</h2>
      <p className="text-gray-600 mb-6">We could not find the page you were looking for.</p>
      <Link data-testid="not-found-home-link" href="/" className="btn btn-primary">
        Back to the store
      </Link>
    </div>
  )
}
