'use client'

import { useState } from 'react'

interface RegisterPageProps {
  showToast: (message: string, type: 'success' | 'error') => void
  onRegisterSuccess: () => void
  onSwitchToLogin: () => void
}

export default function RegisterPage({ showToast, onRegisterSuccess, onSwitchToLogin }: RegisterPageProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error')
      return
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      showToast('Password must be at least 8 characters with a letter and a digit', 'error')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        showToast('Registration successful! Please log in.', 'success')
        onRegisterSuccess()
      } else {
        showToast(data.error || 'Registration failed', 'error')
      }
    } catch (error) {
      showToast('Registration failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div data-testid="register-page" className="flex justify-center py-8 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="section-label mb-3">Account</p>
          <h2 className="page-title mb-2">Create Account</h2>
          <p className="text-stone-600">Track your orders and check out faster.</p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-8">
          <form data-testid="register-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                data-testid="register-name-input"
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                data-testid="register-email-input"
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
                data-testid="register-password-input"
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                aria-describedby="password-hint"
                className="input"
              />
              <p id="password-hint" className="mt-1.5 text-xs text-stone-500">
                At least 8 characters, with a letter and a digit.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm Password
              </label>
              <input
                data-testid="register-confirm-password-input"
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="input"
              />
            </div>

            <button
              data-testid="register-submit-button"
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-stone-600">
          Already have an account?{' '}
          <button
            data-testid="switch-to-login-button"
            onClick={onSwitchToLogin}
            className="font-medium text-brass-700 underline underline-offset-4 transition-colors hover:text-ink-900"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  )
}
