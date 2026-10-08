'use client'

import { useEffect, useRef, useState } from 'react'
import AuthLayout from '@/components/AuthLayout'

interface VerifyEmailPageProps {
  token: string | null
  onContinue: () => void
}

type State = { kind: 'working' } | { kind: 'done' } | { kind: 'failed'; message: string }

export default function VerifyEmailPage({ token, onContinue }: VerifyEmailPageProps) {
  const [state, setState] = useState<State>(token ? { kind: 'working' } : { kind: 'failed', message: 'This link is not valid.' })

  // A link works once, so the request must go out exactly once per token even
  // when React runs the effect twice (development) or the page is remounted.
  const sentFor = useRef<string | null>(null)

  useEffect(() => {
    if (!token || sentFor.current === token) return
    sentFor.current = token
    fetch('/api/account/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        if (response.ok) setState({ kind: 'done' })
        else {
          const data = await response.json().catch(() => null)
          setState({ kind: 'failed', message: data?.error || 'This link is not valid.' })
        }
      })
      .catch(() => setState({ kind: 'failed', message: 'Something went wrong. Try again.' }))
  }, [token])

  return (
    <AuthLayout testId="verify-email-page" label="04 / Account" statement="Confirm your email.">
      <h2 className="font-display text-3xl font-bold tracking-tight text-ink-950">Email verification</h2>

      <div data-testid="verify-email-status" role="status" className="mt-6 border-2 border-ink-950 p-5">
        {state.kind === 'working' && <p className="text-ink-600">Checking your link...</p>}
        {state.kind === 'done' && (
          <>
            <p className="font-semibold text-success">Your email address is verified.</p>
            <p className="mt-1 text-sm text-ink-600">You can place orders now.</p>
          </>
        )}
        {state.kind === 'failed' && (
          <>
            <p className="font-semibold text-danger">{state.message}</p>
            <p className="mt-1 text-sm text-ink-600">Sign in and use the Resend email button on your profile to get a new link.</p>
          </>
        )}
      </div>

      {state.kind !== 'working' && (
        <button data-testid="verify-email-continue-button" onClick={onContinue} className="btn btn-primary mt-6">
          Continue
        </button>
      )}
    </AuthLayout>
  )
}
