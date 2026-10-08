'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'

interface LoginPageProps {
  showToast: (message: string, type: 'success' | 'error') => void
  onLoginSuccess: () => void
  onSwitchToRegister: () => void
}

export default function LoginPage({ showToast, onLoginSuccess, onSwitchToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        showToast(result.error, 'error')
      } else {
        // Carry items added as a guest over to the account cart
        try {
          await fetch('/api/cart/merge', { method: 'POST' })
        } catch (mergeError) {
          console.error('Cart merge failed:', mergeError)
        }
        showToast('Successfully logged in!', 'success')
        onLoginSuccess()
      }
    } catch (error) {
      showToast('Login failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div data-testid="login-page" className="flex justify-center py-8 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="section-label mb-3">Account</p>
          <h2 className="page-title mb-2">Sign in</h2>
          <p className="text-stone-600">Welcome back. Enter your details to continue.</p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-8">
          <form data-testid="login-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                data-testid="login-email-input"
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                data-testid="login-password-input"
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
              />
            </div>

            <button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-stone-600">
          Don&apos;t have an account?{' '}
          <button
            data-testid="switch-to-register-button"
            onClick={onSwitchToRegister}
            className="font-medium text-brass-700 underline underline-offset-4 transition-colors hover:text-ink-900"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  )
}
