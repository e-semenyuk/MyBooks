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
    <div data-testid="error-page" className="text-center py-20">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-6">Please try again. If the problem continues, come back later.</p>
      <button data-testid="error-retry-button" onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  )
}
