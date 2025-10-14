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
    <div>
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Browse Our Books</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books by title or author..."
            className="input flex-1"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Loading books...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No books found</h3>
          <p className="text-gray-600">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <BookCard 
              key={book.id} 
              book={book} 
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  )
}

