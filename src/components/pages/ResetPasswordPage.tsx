'use client'

import { useState } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { ArrowRightIcon } from '@/components/icons'

interface ResetPasswordPageProps {
  token: string | null
  showToast: (message: string, type: 'success' | 'error') => void
  onDone: () => void
  onRequestNew: () => void
}

export default function ResetPasswordPage({ token, showToast, onDone, onRequestNew }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFailure(null)

    if (password !== confirm) {
      showToast('Passwords do not match', 'error')
      return
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      showToast('Password must be at least 8 characters with a letter and a digit', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/account/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await response.json().catch(() => null)
      if (response.ok) {
        showToast('Your password has been changed. You can sign in now.', 'success')
        onDone()
      } else if (data?.code === 'TOKEN_INVALID' || data?.code === 'TOKEN_EXPIRED') {
        setFailure(data.error)
      } else {
        showToast(data?.error || 'Something went wrong. Try again.', 'error')
      }
    } catch {
      showToast('Something went wrong. Try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const unusable = !token || failure

  return (
    <AuthLayout testId="reset-password-page" label="04 / Account" statement="Choose a new password.">
      <h2 className="font-display text-3xl font-bold tracking-tight text-ink-950">New password</h2>

      {unusable ? (
        <div data-testid="reset-password-error" role="alert" className="mt-6 border-2 border-danger p-5">
          <p className="font-semibold text-danger">{failure ?? 'This link is not valid. Request a new one.'}</p>
          <button
            data-testid="reset-password-request-new-button"
            onClick={onRequestNew}
            className="btn btn-primary mt-4"
          >
            Request a new link
          </button>
        </div>
      ) : (
        <>
          <p className="mb-8 mt-2 text-ink-600">Use at least 8 characters, with a letter and a digit.</p>
          <form data-testid="reset-password-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="label">New password</label>
              <input
                id="new-password"
                data-testid="reset-password-input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="label">Confirm password</label>
              <input
                id="confirm-password"
                data-testid="reset-password-confirm-input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="input"
              />
            </div>
            <button
              data-testid="reset-password-submit-button"
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-between"
            >
              {loading ? 'Saving...' : 'Change password'}
              {!loading && <ArrowRightIcon className="h-5 w-5" />}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}
