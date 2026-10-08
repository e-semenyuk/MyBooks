import Link from 'next/link'

export default function NotFound() {
  return (
    <div data-testid="not-found-page" className="empty-state">
      <p className="mb-6 font-mono text-sm text-ink-500">Error 404</p>
      <h2 className="hero-title mb-6">Not found<span className="text-cobalt-500">.</span></h2>
      <p className="mb-10 max-w-md text-lg text-ink-600">
        We could not find the page you were looking for.
      </p>
      <Link data-testid="not-found-home-link" href="/" className="btn btn-primary">
        Back to the store
      </Link>
    </div>
  )
}
