'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BookCover from '@/components/BookCover'
import NotFound from '@/app/not-found'
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/icons'
import RelatedBooks from '@/components/RelatedBooks'
import ReviewsSection from '@/components/ReviewsSection'
import WishlistButton from '@/components/WishlistButton'
import { Book } from '@/types'

interface BookDetailPageProps {
  bookId: number
  showToast: (message: string, type: 'success' | 'error') => void
  updateCartCount: () => void
}

export default function BookDetailPage({ bookId, showToast, updateCartCount }: BookDetailPageProps) {
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/books/${bookId}`)
      .then(async (response) => {
        if (cancelled) return
        if (response.status === 404) setMissing(true)
        else if (response.ok) setBook(await response.json())
        else showToast('Failed to load book', 'error')
      })
      .catch(() => !cancelled && showToast('Failed to load book', 'error'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // showToast is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId])

  const addToCart = async () => {
    if (!book) return
    setAdding(true)
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, quantity }),
      })
      if (response.ok) {
        showToast(quantity === 1 ? 'Book added to cart' : `${quantity} copies added to cart`, 'success')
        updateCartCount()
      } else {
        const data = await response.json().catch(() => null)
        showToast(data?.error || 'Failed to add book to cart', 'error')
      }
    } catch {
      showToast('Failed to add book to cart', 'error')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div data-testid="book-detail-loading" aria-busy="true" className="grid gap-12 md:grid-cols-12">
        <div className="skeleton aspect-[6/5] md:col-span-5" />
        <div className="space-y-4 md:col-span-7">
          <div className="skeleton h-6 w-32" />
          <div className="skeleton h-16 w-3/4" />
          <div className="skeleton h-40 w-full" />
        </div>
      </div>
    )
  }

  if (missing || !book) return <NotFound />

  const isOutOfStock = book.stockQuantity === 0
  const isLowStock = book.stockQuantity > 0 && book.stockQuantity <= 5

  return (
    <div data-testid="book-detail-page" className="animate-fade-in">
      <Link
        data-testid="book-detail-back-link"
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-cobalt-500 underline underline-offset-4 transition-colors hover:text-cobalt-700"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        All books
      </Link>

      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <BookCover id={book.id} title={book.title} coverUrl={book.coverUrl} />
        </div>

        <div className="md:col-span-7">
          {book.categories && book.categories.length > 0 && (
            <div data-testid="book-detail-categories" className="mb-6 flex flex-wrap gap-2">
              {book.categories.map((category) => (
                <Link
                  key={category.id}
                  data-testid={`book-detail-category-${category.slug}`}
                  href={`/?category=${category.slug}`}
                  className="border border-mist-300 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-700 transition-colors hover:border-ink-950 hover:text-ink-950"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          <h2 data-testid="book-detail-title" className="page-title mb-3">
            {book.title}
          </h2>
          <p data-testid="book-detail-author" className="mb-8 text-xl font-medium text-ink-600">
            {book.author}
          </p>

          <p data-testid="book-detail-description" className="mb-8 max-w-xl text-lg leading-relaxed text-ink-700">
            {book.description || 'No description available'}
          </p>

          {book.isbn && (
            <p className="mb-8 font-mono text-xs text-ink-500">
              ISBN <span data-testid="book-detail-isbn">{book.isbn}</span>
            </p>
          )}

          <div className="mb-8 flex flex-wrap items-end gap-x-10 gap-y-4 border-y-2 border-ink-950 py-6">
            <div>
              <p className="section-label mb-1">Price</p>
              <p data-testid="book-detail-price" className="num font-display text-5xl font-extrabold tracking-tight text-ink-950">
                ${book.price.toFixed(2)}
              </p>
            </div>
            <div data-testid="book-detail-stock">
              {isOutOfStock ? (
                <span className="badge badge-danger">Out of Stock</span>
              ) : isLowStock ? (
                <span className="badge badge-warning">Only {book.stockQuantity} left</span>
              ) : (
                <span className="badge badge-success">In Stock</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="detail-quantity" className="label">Quantity</label>
              <input
                id="detail-quantity"
                data-testid="book-detail-quantity-input"
                type="number"
                min={1}
                max={Math.max(book.stockQuantity, 1)}
                value={quantity}
                disabled={isOutOfStock}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="input num w-24 text-center"
              />
            </div>
            <button
              data-testid="book-detail-add-to-cart-button"
              onClick={addToCart}
              disabled={isOutOfStock || adding}
              className="btn btn-primary min-w-[220px] justify-between"
            >
              {isOutOfStock ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
              {!isOutOfStock && <ArrowRightIcon className="h-5 w-5" />}
            </button>
            <WishlistButton bookId={book.id} showToast={showToast} />
          </div>
        </div>
      </div>

      <ReviewsSection bookId={book.id} showToast={showToast} />
      <RelatedBooks bookId={book.id} />
    </div>
  )
}
