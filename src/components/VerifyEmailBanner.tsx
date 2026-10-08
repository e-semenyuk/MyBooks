'use client'

import { useEffect, useState } from 'react'

interface VerifyEmailBannerProps {
  showToast: (message: string, type: 'success' | 'error') => void
  // Tells the page whether ordering is allowed (undefined while loading)
  onStatus?: (verified: boolean) => void
}

// Shown to signed-in users whose email address is not confirmed yet.
export default function VerifyEmailBanner({ showToast, onStatus }: VerifyEmailBannerProps) {
  const [verified, setVerified] = useState<boolean | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/account/me')
      .then((response) => (response.ok ? response.json() : null))
      .then((me) => {
        if (cancelled || !me) return
        setVerified(me.emailVerified)
        onStatus?.(me.emailVerified)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
    // onStatus is only a notification
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (verified !== false) return null

  const resend = async () => {
    setSending(true)
    try {
      const response = await fetch('/api/account/resend-verification', { method: 'POST' })
      const data = await response.json().catch(() => null)
      if (response.ok) showToast('Verification email sent. Check your inbox.', 'success')
      else showToast(data?.error || 'Failed to send the email', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      data-testid="verify-email-banner"
      role="status"
      className="mb-10 flex flex-wrap items-center justify-between gap-4 border-2 border-warning bg-warning-soft px-5 py-4"
    >
      <p className="text-sm text-ink-950">
        <span className="font-semibold">Verify your email address.</span> You can browse and fill your cart, but
        placing an order needs a confirmed address. We sent a link to your inbox.
      </p>
      <button
        data-testid="resend-verification-button"
        onClick={resend}
        disabled={sending}
        className="btn btn-secondary btn-sm"
      >
        {sending ? 'Sending...' : 'Resend email'}
      </button>
    </div>
  )
}
