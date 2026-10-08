'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Stars from '@/components/Stars'

interface Props {
  bookId: number
  showToast: (message: string, type: 'success' | 'error') => void
}

interface ReviewItem {
  id: number
  rating: number
  title: string | null
  body: string | null
  author: string
  createdAt: string
  mine: boolean
}

interface ReviewData {
  summary: { average: number; count: number; distribution: Record<string, number> }
  items: ReviewItem[]
  mine: { id: number; rating: number; title: string | null; body: string | null; status: string } | null
  canReview: boolean
}

const emptyForm = { rating: 0, title: '', body: '' }

export default function ReviewsSection({ bookId, showToast }: Props) {
  const { data: session, status } = useSession()
  const [data, setData] = useState<ReviewData | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/books/${bookId}/reviews`)
      if (response.ok) setData(await response.json())
    } catch {
      showToast('Failed to load reviews', 'error')
    }
  }, [bookId, showToast])

  useEffect(() => {
    if (status !== 'loading') load()
  }, [load, status, session])

  if (!data) return null

  const showForm = data.canReview || editing

  const startEdit = () => {
    if (!data.mine) return
    setForm({ rating: data.mine.rating, title: data.mine.title ?? '', body: data.mine.body ?? '' })
    setEditing(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.rating < 1) {
      setError('Choose a rating from 1 to 5')
      return
    }
    setSaving(true)
    try {
      const response = await fetch(editing && data.mine ? `/api/reviews/${data.mine.id}` : `/api/books/${bookId}/reviews`, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: form.rating, title: form.title, body: form.body }),
      })
      if (response.ok) {
        showToast(editing ? 'Review updated' : 'Review posted', 'success')
        setForm(emptyForm)
        setEditing(false)
        await load()
      } else {
        const body = await response.json().catch(() => null)
        setError(body?.error ?? 'Failed to save review')
      }
    } catch {
      setError('Failed to save review')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!data.mine || !confirm('Delete your review?')) return
    const response = await fetch(`/api/reviews/${data.mine.id}`, { method: 'DELETE' })
    if (response.ok) {
      showToast('Review deleted', 'success')
      setEditing(false)
      setForm(emptyForm)
      await load()
    } else {
      showToast('Failed to delete review', 'error')
    }
  }

  return (
    <section data-testid="reviews-section" className="mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-ink-950 pb-6 pt-5">
        <h3 className="font-display text-3xl font-extrabold tracking-tight text-ink-950">Reviews</h3>
        {data.summary.count > 0 ? (
          <div data-testid="reviews-summary" className="flex items-center gap-3">
            <Stars value={data.summary.average} className="h-5 w-5" />
            <span className="num font-mono text-sm text-ink-700">
              <span data-testid="reviews-average">{data.summary.average.toFixed(1)}</span> from{' '}
              <span data-testid="reviews-count">{data.summary.count}</span>{' '}
              {data.summary.count === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        ) : (
          <p data-testid="reviews-empty" className="text-sm text-ink-600">No reviews yet.</p>
        )}
      </div>

      {data.mine?.status === 'HIDDEN' && (
        <p data-testid="review-hidden-notice" className="mb-6 border-l-4 border-warning bg-warning-soft px-4 py-3 text-sm text-ink-800">
          Your review was hidden by a moderator and is not shown to other readers.
        </p>
      )}

      {showForm && (
        <form data-testid="review-form" onSubmit={submit} className="mb-10 border-2 border-ink-950 p-6">
          <p className="label">{editing ? 'Edit your review' : 'Write a review'}</p>
          <fieldset className="mb-4">
            <legend className="sr-only">Rating</legend>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    data-testid={`review-rating-${n}`}
                    checked={form.rating === n}
                    onChange={() => setForm({ ...form, rating: n })}
                    className="peer sr-only"
                  />
                  <span className="flex h-11 w-11 items-center justify-center border border-ink-950 font-mono text-sm font-semibold peer-checked:bg-cobalt-500 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-cobalt-500">
                    {n}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <label htmlFor="review-title" className="label">Headline (optional)</label>
          <input
            id="review-title"
            data-testid="review-title-input"
            className="input mb-4"
            maxLength={100}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <label htmlFor="review-body" className="label">Review (optional)</label>
          <textarea
            id="review-body"
            data-testid="review-body-input"
            className="input mb-4"
            rows={4}
            maxLength={2000}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
          {error && (
            <p data-testid="review-error" role="alert" className="mb-4 text-sm font-semibold text-danger">{error}</p>
          )}
          <div className="flex gap-2">
            <button type="submit" data-testid="review-submit-button" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Post review'}
            </button>
            {editing && (
              <button
                type="button"
                data-testid="review-cancel-button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false)
                  setError(null)
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {!showForm && !data.mine && (
        <p data-testid="review-hint" className="mb-8 text-sm text-ink-600">
          {status !== 'authenticated' ? (
            <>
              <Link href={`/login?callbackUrl=${encodeURIComponent(`/books/${bookId}`)}`} className="font-semibold text-cobalt-500 underline underline-offset-4">
                Sign in
              </Link>{' '}
              to review books you bought.
            </>
          ) : (
            'Only readers who bought this book can review it.'
          )}
        </p>
      )}

      <ul data-testid="reviews-list" className="divide-y divide-mist-200 border-b border-mist-200">
        {data.items.map((review) => (
          <li key={review.id} data-testid={`review-${review.id}`} className="py-6">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <Stars value={review.rating} />
              {review.title && <p className="font-display text-lg font-bold text-ink-950">{review.title}</p>}
            </div>
            {review.body && <p className="mb-2 max-w-2xl whitespace-pre-line text-ink-700">{review.body}</p>}
            <p className="font-mono text-xs text-ink-500">
              {review.author}, {new Date(review.createdAt).toLocaleDateString('en-US')}
            </p>
            {review.mine && !editing && (
              <div className="mt-3 flex gap-3">
                <button type="button" data-testid="review-edit-button" onClick={startEdit} className="text-sm font-semibold text-cobalt-500 underline underline-offset-4">
                  Edit
                </button>
                <button type="button" data-testid="review-delete-button" onClick={remove} className="text-sm font-semibold text-danger underline underline-offset-4">
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
