'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BookCover from '@/components/BookCover'
import { Book } from '@/types'

export default function RelatedBooks({ bookId }: { bookId: number }) {
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    let cancelled = false
    setBooks([])
    fetch(`/api/books/${bookId}/related`)
      .then((r) => (r.ok ? r.json() : []))
      .then((items) => !cancelled && setBooks(items))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [bookId])

  if (books.length === 0) return null

  return (
    <section data-testid="related-books" className="mt-20">
      <h3 className="section-label mb-5 border-t-2 border-ink-950 pt-5">You may also like</h3>
      <div className="grid grid-cols-2 gap-px border border-mist-200 bg-mist-200 md:grid-cols-4">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            data-testid={`related-book-${book.id}`}
            className="group flex flex-col bg-white"
          >
            <BookCover id={book.id} title={book.title} coverUrl={book.coverUrl} />
            <div className="p-4">
              <p className="line-clamp-2 font-display text-lg font-bold leading-tight text-ink-950 decoration-cobalt-500 decoration-2 underline-offset-4 group-hover:underline">
                {book.title}
              </p>
              <p className="text-sm text-ink-600">{book.author}</p>
              <p className="num mt-2 font-display text-xl font-extrabold text-ink-950">${book.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
