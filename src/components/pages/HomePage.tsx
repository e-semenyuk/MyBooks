'use client'

import { useState, useEffect } from 'react'
import BookCard from '@/components/BookCard'
import { Book } from '@/types'
import { SearchIcon, XIcon } from '@/components/icons'

interface HomePageProps {
  showToast: (message: string, type: 'success' | 'error') => void
  updateCartCount: () => void
}

export default function HomePage({ showToast, updateCartCount }: HomePageProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadBooks()
    updateCartCount()
  }, [])

  const loadBooks = async (query = '') => {
    try {
      setLoading(true)
      const url = query 
        ? `/api/books?query=${encodeURIComponent(query)}`
        : '/api/books'
      
      const response = await fetch(url)
      const data = await response.json()
      setBooks(data)
    } catch (error) {
      showToast('Failed to load books', 'error')
      console.error('Error loading books:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadBooks(searchQuery)
  }

  const handleAddToCart = async (bookId: number) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, quantity: 1 }),
      })

      if (response.ok) {
        showToast('Book added to cart', 'success')
        updateCartCount()
      } else {
        const data = await response.json().catch(() => null)
        showToast(data?.error || 'Failed to add book to cart', 'error')
      }
    } catch (error) {
      showToast('Failed to add book to cart', 'error')
      console.error('Error adding to cart:', error)
    }
  }

  return (
    <div data-testid="home-page" className="animate-fade-in">
      <section data-testid="search-section" className="mb-14">
        <p className="section-label mb-8">01 / Catalog</p>
        <h2 className="hero-title mb-8">
          Read more<span className="text-cobalt-500">.</span>
        </h2>
        <p className="mb-10 max-w-xl text-lg text-ink-600">
          Classics and contemporary titles, in stock and ready to ship.
        </p>

        <form
          data-testid="search-form"
          onSubmit={handleSearch}
          className="flex max-w-3xl border-2 border-ink-950 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cobalt-500"
        >
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500" />
            <input
              data-testid="search-input"
              type="text"
              aria-label="Search books"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN"
              className="h-14 w-full bg-white pl-12 pr-4 text-base text-ink-950 placeholder:text-ink-500 focus:outline-none"
            />
          </div>
          <button
            data-testid="search-submit-button"
            type="submit"
            className="btn btn-primary min-h-[52px] border-0 px-8"
          >
            Search
          </button>
        </form>
      </section>

      {loading ? (
        <div
          data-testid="books-loading"
          aria-busy="true"
          aria-label="Loading books"
          className="grid grid-cols-1 border-l border-t-2 border-ink-950 sm:grid-cols-2 lg:grid-cols-3"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-b border-r border-mist-200">
              <div className="skeleton aspect-[6/5] w-full" />
              <div className="space-y-3 p-5">
                <div className="skeleton h-5 w-24" />
                <div className="skeleton h-7 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div data-testid="no-books-message" className="empty-state">
          <p className="section-label mb-4">0 results</p>
          <h3 className="panel-title mb-3">No books found</h3>
          <p className="mb-8 max-w-md text-ink-600">
            Try a different title, author or ISBN, or browse the full catalog.
          </p>
          <button
            data-testid="view-all-books-button"
            onClick={() => {
              setSearchQuery('')
              loadBooks('')
            }}
            className="btn btn-primary"
          >
            View All Books
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-t-2 border-ink-950 pb-5 pt-5">
            <h3 data-testid="books-count" className="font-display text-2xl font-bold tracking-tight text-ink-950">
              {searchQuery ? `Search Results (${books.length})` : `All Books (${books.length})`}
            </h3>
            {searchQuery && (
              <button
                data-testid="clear-search-button"
                onClick={() => {
                  setSearchQuery('')
                  loadBooks('')
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-cobalt-500 underline underline-offset-4 transition-colors hover:text-cobalt-700"
              >
                <XIcon className="h-4 w-4" />
                Clear Search
              </button>
            )}
          </div>
          <div
            data-testid="books-grid"
            className="grid grid-cols-1 border-l border-t border-mist-200 sm:grid-cols-2 lg:grid-cols-3"
          >
            {books.map((book) => (
              <BookCard key={book.id} book={book} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
