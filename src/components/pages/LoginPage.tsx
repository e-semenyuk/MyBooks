'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import AuthLayout from '@/components/AuthLayout'
import { ArrowRightIcon } from '@/components/icons'

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
    <AuthLayout testId="login-page" label="04 / Account" statement="Sign in to continue.">
      <h2 className="font-display text-3xl font-bold tracking-tight text-ink-950">Sign in</h2>
      <p className="mb-8 mt-2 text-ink-600">Welcome back. Enter your details to continue.</p>

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
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="label">
              Password
            </label>
            <Link
              data-testid="forgot-password-link"
              href="/forgot-password"
              className="mb-1.5 text-xs font-semibold text-cobalt-500 underline underline-offset-4 hover:text-cobalt-700"
            >
              Forgot password?
            </Link>
          </div>
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
          className="btn btn-primary w-full justify-between"
        >
          {loading ? 'Signing in...' : 'Sign In'}
          {!loading && <ArrowRightIcon className="h-5 w-5" />}
        </button>
      </form>

      <p className="mt-8 text-sm text-ink-600">
        Don&apos;t have an account?{' '}
        <button
          data-testid="switch-to-register-button"
          onClick={onSwitchToRegister}
          className="font-semibold text-cobalt-500 underline underline-offset-4 transition-colors hover:text-cobalt-700"
        >
          Register here
        </button>
      </p>
    </AuthLayout>
  )
}
