'use client'

import { useState, useEffect } from 'react'
import { ORDER_STATUSES, OrderStatus, canTransition } from '@/lib/orderStatus'
import { useSession } from 'next-auth/react'
import { EditIcon, TrashIcon } from '@/components/icons'

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
      <div data-testid="admin-access-denied" className="empty-state">
        <p className="section-label mb-4">Restricted</p>
        <h2 className="panel-title mb-3">Access Denied</h2>
        <p className="text-ink-600">You need admin privileges to access this page.</p>
      </div>
    )
  }

  const resetForm = () => {
    setEditingBook(null)
    setBookForm({ title: '', author: '', isbn: '', price: '', description: '', stockQuantity: '' })
  }

  const tabClass = (tab: Tab) =>
    `px-6 py-2.5 text-sm font-semibold transition-colors duration-150 ${
      activeTab === tab ? 'bg-ink-950 text-white' : 'bg-white text-ink-950 hover:bg-mist-100'
    }`

  return (
    <div data-testid="admin-page" className="animate-fade-in">
      <div className="mb-12">
        <p className="section-label mb-6">06 / Administration</p>
        <h2 className="page-title mb-4">Admin Dashboard</h2>
        <p className="text-lg text-ink-600">Manage books and orders</p>
      </div>

      <div className="mb-12 inline-flex border-2 border-ink-950" role="tablist">
        <button
          data-testid="admin-books-tab"
          role="tab"
          aria-selected={activeTab === 'books'}
          onClick={() => setActiveTab('books')}
          className={tabClass('books')}
        >
          Books ({books.length})
        </button>
        <button
          data-testid="admin-orders-tab"
          role="tab"
          aria-selected={activeTab === 'orders'}
          onClick={() => setActiveTab('orders')}
          className={`${tabClass('orders')} border-l-2 border-ink-950`}
        >
          Orders ({orders.length})
        </button>
      </div>

      {activeTab === 'books' && (
        <div className="grid items-start gap-12 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="border-2 border-ink-950 lg:sticky lg:top-24">
              <div className="bg-ink-950 px-6 py-4">
                <h3 className="font-display text-xl font-bold tracking-tight text-white">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h3>
              </div>

              <form data-testid="admin-book-form" onSubmit={handleBookSubmit} className="space-y-4 p-6">
                <div>
                  <label htmlFor="book-title" className="label">Title *</label>
                  <input
                    id="book-title"
                    data-testid="admin-book-title-input"
                    type="text"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="book-author" className="label">Author *</label>
                  <input
                    id="book-author"
                    data-testid="admin-book-author-input"
                    type="text"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="book-isbn" className="label">ISBN</label>
                  <input
                    id="book-isbn"
                    data-testid="admin-book-isbn-input"
                    type="text"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="book-price" className="label">Price *</label>
                    <input
                      id="book-price"
                      data-testid="admin-book-price-input"
                      type="number"
                      step="0.01"
                      value={bookForm.price}
                      onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                      required
                      className="input num"
                    />
                  </div>

                  <div>
                    <label htmlFor="book-stock" className="label">Stock *</label>
                    <input
                      id="book-stock"
                      data-testid="admin-book-stock-input"
                      type="number"
                      value={bookForm.stockQuantity}
                      onChange={(e) => setBookForm({ ...bookForm, stockQuantity: e.target.value })}
                      required
                      className="input num"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="book-description" className="label">Description</label>
                  <textarea
                    id="book-description"
                    data-testid="admin-book-description-input"
                    value={bookForm.description}
                    onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                    rows={3}
                    className="input"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button data-testid="admin-save-book-button" type="submit" className="btn btn-primary flex-1">
                    {editingBook ? 'Update Book' : 'Add Book'}
                  </button>
                  {editingBook && (
                    <button
                      data-testid="admin-cancel-edit-button"
                      type="button"
                      onClick={resetForm}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div data-testid="admin-books-list" className="lg:col-span-2">
            {loading ? (
              <div aria-busy="true" className="space-y-px">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-28 w-full" />
                ))}
              </div>
            ) : (
              <div className="border-t-2 border-ink-950">
                {books.map((book, index) => (
                  <div
                    key={book.id}
                    data-testid={`admin-book-item-${book.id}`}
                    className="grid grid-cols-[2rem_1fr_auto] gap-x-4 border-b border-mist-200 py-5"
                  >
                    <span className="pt-1.5 font-mono text-xs text-ink-500">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-display text-xl font-bold leading-tight tracking-tight text-ink-950">
                        {book.title}
                      </h4>
                      <p className="text-sm text-ink-600">by {book.author}</p>
                      {book.isbn && <p className="mt-1 font-mono text-xs text-ink-500">ISBN {book.isbn}</p>}
                      {book.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-ink-600">{book.description}</p>
                      )}
                      <div className="mt-3 flex items-center gap-4">
                        <span className="num font-display text-2xl font-extrabold tracking-tight text-ink-950">
                          ${book.price.toFixed(2)}
                        </span>
                        <span
                          className={`badge ${
                            book.stockQuantity > 5 ? 'badge-success' : book.stockQuantity > 0 ? 'badge-warning' : 'badge-danger'
                          }`}
                        >
                          Stock: {book.stockQuantity}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <button
                        data-testid={`admin-edit-book-${book.id}`}
                        onClick={() => handleEditBook(book)}
                        aria-label={`Edit ${book.title}`}
                        className="p-2 text-ink-950 transition-colors hover:bg-ink-950 hover:text-white"
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button
                        data-testid={`admin-delete-book-${book.id}`}
                        onClick={() => handleDeleteBook(book.id)}
                        aria-label={`Delete ${book.title}`}
                        className="p-2 text-danger transition-colors hover:bg-danger hover:text-white"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div data-testid="admin-orders-section">
          {loading ? (
            <div data-testid="admin-orders-loading" aria-busy="true" className="space-y-px">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-32 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div data-testid="admin-no-orders" className="empty-state">
              <p className="section-label mb-4">0 orders</p>
              <h3 className="panel-title mb-3">No orders yet</h3>
              <p className="max-w-md text-ink-600">Orders will appear here once customers start purchasing.</p>
            </div>
          ) : (
            <div data-testid="admin-orders-list" className="border-t-2 border-ink-950">
              {orders.map((order) => (
                <div
                  key={order.id}
                  data-testid={`admin-order-item-${order.id}`}
                  className="border-b border-mist-200 py-7"
                >
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h4 className="font-display text-2xl font-bold tracking-tight text-ink-950">
                        Order #{order.id}
                      </h4>
                      <p className="text-sm text-ink-600">
                        {order.customerName}, {order.customerEmail}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-ink-500">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="num font-display text-3xl font-extrabold tracking-tight text-ink-950">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                      <label htmlFor={`status-${order.id}`} className="sr-only">
                        Status of order {order.id}
                      </label>
                      <select
                        id={`status-${order.id}`}
                        data-testid={`admin-order-status-${order.id}`}
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="input mt-2 w-auto py-1.5 pr-8 text-sm font-semibold"
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

                  <p className="section-label mb-3">Items</p>
                  <div className="divide-y divide-mist-200 border-y border-mist-200">
                    {order.orderItems?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between py-2.5 text-sm">
                        <span className="text-ink-700">
                          {item.book?.title || 'Unknown'} <span className="font-mono text-xs text-ink-500">x {item.quantity}</span>
                        </span>
                        <span className="num font-semibold text-ink-950">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
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
