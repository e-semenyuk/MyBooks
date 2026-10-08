'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import BookCover from '@/components/BookCover'
import { Book } from '@/types'

interface Props {
  showToast: (message: string, type: 'success' | 'error') => void
  updateCartCount: () => void
}

interface Entry {
  addedAt: string
  book: Book
}

export default function WishlistPage({ showToast, updateCartCount }: Props) {
  const [items, setItems] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (response.ok) setItems(await response.json())
    } catch {
      showToast('Failed to load wishlist', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (bookId: number) => {
    const response = await fetch(`/api/wishlist/${bookId}`, { method: 'DELETE' })
    if (response.ok) {
      setItems((current) => current.filter((i) => i.book.id !== bookId))
      showToast('Removed from wishlist', 'success')
    } else {
      showToast('Failed to update wishlist', 'error')
    }
  }

  const moveToCart = async (bookId: number) => {
    const add = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, quantity: 1 }),
    })
    if (!add.ok) {
      const body = await add.json().catch(() => null)
      showToast(body?.error ?? 'Failed to add book to cart', 'error')
      return
    }
    await fetch(`/api/wishlist/${bookId}`, { method: 'DELETE' })
    setItems((current) => current.filter((i) => i.book.id !== bookId))
    updateCartCount()
    showToast('Moved to cart', 'success')
  }

  return (
    <div data-testid="wishlist-page" className="animate-fade-in">
      <p className="section-label mb-6">Saved</p>
      <h2 className="page-title mb-12">Wishlist</h2>

      {loading ? (
        <div data-testid="wishlist-loading" aria-busy="true" className="skeleton h-40 w-full" />
      ) : items.length === 0 ? (
        <div data-testid="wishlist-empty" className="empty-state">
          <p className="section-label mb-4">0 books</p>
          <h3 className="panel-title mb-3">Nothing saved yet</h3>
          <p className="mb-6 max-w-md text-ink-600">Use Save for later on a book page to keep it here.</p>
          <Link href="/" className="btn btn-primary">Browse books</Link>
        </div>
      ) : (
        <ul data-testid="wishlist-list" className="border-t-2 border-ink-950">
          {items.map(({ book }) => {
            const out = book.stockQuantity === 0
            return (
              <li key={book.id} data-testid={`wishlist-item-${book.id}`} className="grid items-center gap-6 border-b border-mist-200 py-6 sm:grid-cols-[96px_1fr_auto]">
                <div className="w-24">
                  <BookCover id={book.id} title={book.title} coverUrl={book.coverUrl} />
                </div>
                <div className="min-w-0">
                  <Link href={`/books/${book.id}`} data-testid={`wishlist-link-${book.id}`} className="font-display text-2xl font-bold tracking-tight text-ink-950 hover:underline">
                    {book.title}
                  </Link>
                  <p className="text-sm text-ink-600">{book.author}</p>
                  <p className="num mt-1 font-mono text-sm text-ink-700">${book.price.toFixed(2)}</p>
                  {out && <span data-testid={`wishlist-out-${book.id}`} className="badge badge-danger mt-2">Out of Stock</span>}
                </div>
                <div className="flex gap-2">
                  <button data-testid={`wishlist-move-${book.id}`} disabled={out} onClick={() => moveToCart(book.id)} className="btn btn-primary btn-sm">
                    Move to cart
                  </button>
                  <button data-testid={`wishlist-remove-${book.id}`} onClick={() => remove(book.id)} className="btn btn-secondary btn-sm">
                    Remove
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
