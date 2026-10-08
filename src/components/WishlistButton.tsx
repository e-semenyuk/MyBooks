'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { HeartIcon } from '@/components/icons'

interface Props {
  bookId: number
  showToast: (message: string, type: 'success' | 'error') => void
}

export default function WishlistButton({ bookId, showToast }: Props) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!session) {
      setSaved(false)
      return
    }
    let cancelled = false
    fetch('/api/wishlist')
      .then((r) => (r.ok ? r.json() : []))
      .then((items: { book: { id: number } }[]) => !cancelled && setSaved(items.some((i) => i.book.id === bookId)))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [session, bookId])

  const toggle = async () => {
    if (status !== 'authenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/books/${bookId}`)}`)
      return
    }
    setBusy(true)
    try {
      const response = saved
        ? await fetch(`/api/wishlist/${bookId}`, { method: 'DELETE' })
        : await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId }),
          })
      if (response.ok) {
        setSaved(!saved)
        showToast(saved ? 'Removed from wishlist' : 'Saved to wishlist', 'success')
      } else {
        showToast('Failed to update wishlist', 'error')
      }
    } catch {
      showToast('Failed to update wishlist', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      data-testid="wishlist-toggle-button"
      aria-pressed={saved}
      onClick={toggle}
      disabled={busy}
      className="btn btn-secondary"
    >
      <HeartIcon filled={saved} className="h-5 w-5" />
      {saved ? 'Saved' : 'Save for later'}
    </button>
  )
}
