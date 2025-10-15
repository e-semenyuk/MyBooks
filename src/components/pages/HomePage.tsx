'use client'

import { useState, useEffect } from 'react'
import BookCard from '@/components/BookCard'
import { Book } from '@/types'

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
        showToast('Failed to add book to cart', 'error')
      }
    } catch (error) {
      showToast('Failed to add book to cart', 'error')
      console.error('Error adding to cart:', error)
    }
  }

  return (
    <div data-testid="home-page" className="animate-fade-in">
      {/* Hero Search Section */}
      <div data-testid="search-section" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-purple-600 to-indigo-700 text-white shadow-2xl mb-10 p-10">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 text-9xl opacity-10 -mr-8 -mt-8">📚</div>
        <div className="absolute bottom-0 left-0 text-7xl opacity-10 -ml-6 -mb-6">✨</div>
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
            Discover Your Next Great Read
          </h2>
          <p className="text-lg text-white/90 mb-8 font-medium">
            Explore our curated collection of timeless classics and bestsellers
          </p>
          
          <form data-testid="search-form" onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                data-testid="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or ISBN..."
                className="w-full pl-12 pr-5 py-4 border-0 rounded-2xl focus:ring-4 focus:ring-white/30 transition-all duration-200 bg-white/95 backdrop-blur-sm placeholder:text-gray-500 text-gray-900 font-medium shadow-xl"
              />
            </div>
            <button 
              data-testid="search-submit-button"
              type="submit" 
              className="px-8 py-4 bg-white text-primary-600 font-bold rounded-2xl hover:bg-white/90 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div data-testid="books-loading" className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading amazing books...</p>
        </div>
      ) : books.length === 0 ? (
        <div data-testid="no-books-message" className="text-center py-20 card-gradient max-w-md mx-auto">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">No books found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or browse all books</p>
          <button 
            data-testid="view-all-books-button"
            onClick={() => {
              setSearchQuery('')
              loadBooks('')
            }}
            className="btn btn-primary"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              View All Books
            </span>
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h3 data-testid="books-count" className="text-2xl font-bold text-gray-800">
              {searchQuery ? `Search Results (${books.length})` : `All Books (${books.length})`}
            </h3>
            {searchQuery && (
              <button
                data-testid="clear-search-button"
                onClick={() => {
                  setSearchQuery('')
                  loadBooks('')
                }}
                className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Search
              </button>
            )}
          </div>
          <div data-testid="books-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

