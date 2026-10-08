'use client'

import { useState, useEffect } from 'react'
import { ORDER_STATUSES, OrderStatus, canTransition } from '@/lib/orderStatus'
import { useSession } from 'next-auth/react'

interface AdminPageProps {
  showToast: (message: string, type: 'success' | 'error') => void
}

type Tab = 'books' | 'orders'

interface Book {
  id: number
  title: string
  author: string
  isbn?: string
  price: number
  description?: string
  stockQuantity: number
}

interface Order {
  id: number
  customerName: string
  customerEmail: string
  totalAmount: number
  status: OrderStatus
  orderDate: string
  orderItems: any[]
}

export default function AdminPage({ showToast }: AdminPageProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('books')
  const [books, setBooks] = useState<Book[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    price: '',
    description: '',
    stockQuantity: '',
  })

  useEffect(() => {
    if (activeTab === 'books') {
      loadBooks()
    } else {
      loadOrders()
    }
  }, [activeTab])

  const loadBooks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/books')
      const data = await response.json()
      setBooks(data)
    } catch (error) {
      showToast('Failed to load books', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      showToast('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingBook ? `/api/books/${editingBook.id}` : '/api/books'
      const method = editingBook ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookForm,
          price: parseFloat(bookForm.price),
          stockQuantity: parseInt(bookForm.stockQuantity),
        }),
      })

      if (response.ok) {
        showToast(editingBook ? 'Book updated successfully' : 'Book added successfully', 'success')
        setBookForm({ title: '', author: '', isbn: '', price: '', description: '', stockQuantity: '' })
        setEditingBook(null)
        loadBooks()
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to save book', 'error')
      }
    } catch (error) {
      showToast('Failed to save book', 'error')
    }
  }

  const handleEditBook = (book: Book) => {
    setEditingBook(book)
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      price: book.price.toString(),
      description: book.description || '',
      stockQuantity: book.stockQuantity.toString(),
    })
  }

  const handleDeleteBook = async (id: number) => {
    if (!confirm('Are you sure you want to delete this book?')) return

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast('Book deleted successfully', 'success')
        loadBooks()
      } else {
        showToast('Failed to delete book', 'error')
      }
    } catch (error) {
      showToast('Failed to delete book', 'error')
    }
  }

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        showToast('Order status updated successfully', 'success')
        loadOrders()
      } else {
        showToast('Failed to update order status', 'error')
      }
    } catch (error) {
      showToast('Failed to update order status', 'error')
    }
  }

  // Check if user is admin
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You need admin privileges to access this page.</p>
      </div>
    )
  }

  return (
    <div data-testid="admin-page" className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Admin Dashboard
        </h2>
        <p className="text-gray-600 text-lg">Manage books and orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          data-testid="admin-books-tab"
          onClick={() => setActiveTab('books')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            activeTab === 'books'
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Books ({books.length})
          </span>
        </button>
        <button
          data-testid="admin-orders-tab"
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            activeTab === 'orders'
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Orders ({orders.length})
          </span>
        </button>
      </div>

      {/* Books Tab */}
      {activeTab === 'books' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Book Form */}
          <div className="lg:col-span-1">
            <div className="card-gradient sticky top-24">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </h3>
              
              <form data-testid="admin-book-form" onSubmit={handleBookSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    data-testid="admin-book-title-input"
                    type="text"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Author *</label>
                  <input
                    data-testid="admin-book-author-input"
                    type="text"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ISBN</label>
                  <input
                    data-testid="admin-book-isbn-input"
                    type="text"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
                    <input
                      data-testid="admin-book-price-input"
                      type="number"
                      step="0.01"
                      value={bookForm.price}
                      onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                      required
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stock *</label>
                    <input
                      data-testid="admin-book-stock-input"
                      type="number"
                      value={bookForm.stockQuantity}
                      onChange={(e) => setBookForm({ ...bookForm, stockQuantity: e.target.value })}
                      required
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    data-testid="admin-book-description-input"
                    value={bookForm.description}
                    onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                    rows={3}
                    className="input"
                  />
                </div>

                <div className="flex gap-2">
                  <button data-testid="admin-save-book-button" type="submit" className="btn btn-primary flex-1">
                    {editingBook ? 'Update Book' : 'Add Book'}
                  </button>
                  {editingBook && (
                    <button
                      data-testid="admin-cancel-edit-button"
                      type="button"
                      onClick={() => {
                        setEditingBook(null)
                        setBookForm({ title: '', author: '', isbn: '', price: '', description: '', stockQuantity: '' })
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Books List */}
          <div data-testid="admin-books-list" className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-4"></div>
                <p className="text-gray-600">Loading books...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {books.map((book) => (
                  <div key={book.id} data-testid={`admin-book-item-${book.id}`} className="card-gradient border-2 border-gray-200 hover:border-primary-200 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900">{book.title}</h4>
                        <p className="text-gray-600 mb-2">by {book.author}</p>
                        {book.isbn && <p className="text-xs text-gray-400 font-mono mb-2">ISBN: {book.isbn}</p>}
                        {book.description && (
                          <p className="text-sm text-gray-700 line-clamp-2 mb-3">{book.description}</p>
                        )}
                        <div className="flex gap-4">
                          <span className="text-2xl font-bold text-gradient">${book.price.toFixed(2)}</span>
                          <span className={`badge ${book.stockQuantity > 5 ? 'badge-success' : book.stockQuantity > 0 ? 'badge-warning' : 'badge-danger'}`}>
                            Stock: {book.stockQuantity}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          data-testid={`admin-edit-book-${book.id}`}
                          onClick={() => handleEditBook(book)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          data-testid={`admin-delete-book-${book.id}`}
                          onClick={() => handleDeleteBook(book.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div data-testid="admin-orders-section">
          {loading ? (
            <div data-testid="admin-orders-loading" className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div data-testid="admin-no-orders" className="text-center py-20 card-gradient">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h3>
              <p className="text-gray-600">Orders will appear here once customers start purchasing.</p>
            </div>
          ) : (
            <div data-testid="admin-orders-list" className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} data-testid={`admin-order-item-${order.id}`} className="card-gradient border-2 border-gray-200">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">Order #{order.id}</h4>
                      <p className="text-gray-600">{order.customerName} • {order.customerEmail}</p>
                      <p className="text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gradient">${order.totalAmount.toFixed(2)}</p>
                      <select
                        data-testid={`admin-order-status-${order.id}`}
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="mt-2 px-3 py-1 rounded-lg border-2 border-gray-200 text-sm font-semibold"
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option
                            key={status}
                            value={status}
                            disabled={status !== order.status && !canTransition(order.status, status)}
                          >
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-700 mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.orderItems?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.book?.title || 'Unknown'} × {item.quantity}</span>
                          <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
