'use client'

import { useEffect } from 'react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div data-testid="error-page" className="empty-state">
      <p className="mb-6 font-mono text-sm text-danger">Error</p>
      <h2 className="hero-title mb-6">Something went wrong<span className="text-cobalt-500">.</span></h2>
      <p className="mb-10 max-w-md text-lg text-ink-600">
        Please try again. If the problem continues, come back later.
      </p>
      <button data-testid="error-retry-button" onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  )
}
