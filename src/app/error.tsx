'use client'

import { useEffect } from 'react'
import { AlertIcon } from '@/components/icons'

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
      <AlertIcon className="mx-auto mb-4 h-8 w-8 text-danger" />
      <h2 className="panel-title mb-2">Something went wrong</h2>
      <p className="mb-6 text-sm text-stone-600">
        Please try again. If the problem continues, come back later.
      </p>
      <button data-testid="error-retry-button" onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </div>
  )
}
