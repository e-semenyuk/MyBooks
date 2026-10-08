'use client'

import { useState } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { ArrowRightIcon } from '@/components/icons'

interface ForgotPasswordPageProps {
  showToast: (message: string, type: 'success' | 'error') => void
  onBackToLogin: () => void
}

export default function ForgotPasswordPage({ showToast, onBackToLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/account/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json().catch(() => null)
      if (response.ok) setSent(true)
      else showToast(data?.error || 'Something went wrong. Try again.', 'error')
    } catch {
      showToast('Something went wrong. Try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout testId="forgot-password-page" label="04 / Account" statement="Forgot your password?">
      <h2 className="font-display text-3xl font-bold tracking-tight text-ink-950">Reset password</h2>

      {sent ? (
        <div data-testid="forgot-password-success" role="status" className="mt-6 border-2 border-ink-950 p-5">
          <p className="font-semibold text-ink-950">Check your inbox.</p>
          <p className="mt-1 text-sm text-ink-600">
            If an account exists for {email}, a reset link is on its way. The link works once and expires in 30 minutes.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-8 mt-2 text-ink-600">Enter your email and we will send you a link to choose a new one.</p>
          <form data-testid="forgot-password-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className="label">Email Address</label>
              <input
                id="forgot-email"
                data-testid="forgot-password-email-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <button
              data-testid="forgot-password-submit-button"
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-between"
            >
              {loading ? 'Sending...' : 'Send reset link'}
              {!loading && <ArrowRightIcon className="h-5 w-5" />}
            </button>
          </form>
        </>
      )}

      <p className="mt-8 text-sm text-ink-600">
        <button
          data-testid="forgot-password-back-button"
          onClick={onBackToLogin}
          className="font-semibold text-cobalt-500 underline underline-offset-4 transition-colors hover:text-cobalt-700"
        >
          Back to sign in
        </button>
      </p>
    </AuthLayout>
  )
}
