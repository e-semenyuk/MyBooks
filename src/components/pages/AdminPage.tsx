'use client'

import { useState, useEffect } from 'react'
import { ORDER_STATUSES, OrderStatus, canTransition, nextStatus } from '@/lib/orderStatus'
import { useSession } from 'next-auth/react'
import { EditIcon, TrashIcon } from '@/components/icons'
import BookCover from '@/components/BookCover'
import AdminReviews from '@/components/admin/AdminReviews'

interface AdminPageProps {
  showToast: (message: string, type: 'success' | 'error') => void
}

type Tab = 'books' | 'orders' | 'categories' | 'reviews'

// Tabs rendered by their own components
const EXTRA_TABS: { key: Tab; label: string }[] = [{ key: 'reviews', label: 'Reviews' }]

interface CategoryRow {
  id: number
  name: string
  slug: string
  bookCount: number
}

interface Book {
  id: number
  title: string
  author: string
  isbn?: string
  price: number
  description?: string
  stockQuantity: number
  coverUrl?: string | null
  categories?: { id: number; name: string; slug: string }[]
}

interface Order {
  id: number
  customerName: string
  customerEmail: string
  totalAmount: number
  status: OrderStatus
  orderDate: string
  orderItems: any[]
  shippingMethod?: string
}

export default function AdminPage({ showToast }: AdminPageProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('books')
  const [books, setBooks] = useState<Book[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [renaming, setRenaming] = useState<{ id: number; name: string } | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [orderFilters, setOrderFilters] = useState({ status: '', shippingMethod: '', q: '', from: '', to: '' })

  const emptyForm = {
    title: '',
    author: '',
    isbn: '',
    price: '',
    description: '',
    stockQuantity: '',
    categoryIds: [] as number[],
  }
  const [bookForm, setBookForm] = useState(emptyForm)

  useEffect(() => {
    if (activeTab === 'books') {
      loadBooks()
      loadCategories()
    } else if (activeTab === 'categories') {
      loadCategories()
    } else if (activeTab === 'orders') {
      loadOrders()
    }
  }, [activeTab])

  const loadBooks = async () => {
    setLoading(true)
    try {
      // The catalog API is paged; the admin list walks every page
      const all: Book[] = []
      let page = 1
      let totalPages = 1
      do {
        const response = await fetch(`/api/books?pageSize=100&page=${page}`)
        if (!response.ok) throw new Error('Request failed')
        const data = await response.json()
        all.push(...data.items)
        totalPages = data.totalPages
        page += 1
      } while (page <= totalPages)
      setBooks(all)
    } catch (error) {
      showToast('Failed to load books', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) setCategories(await response.json())
    } catch (error) {
      showToast('Failed to load categories', 'error')
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory }),
    })
    if (response.ok) {
      showToast('Category added successfully', 'success')
      setNewCategory('')
      loadCategories()
    } else {
      const error = await response.json().catch(() => null)
      showToast(error?.error || 'Failed to add category', 'error')
    }
  }

  const handleRenameCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renaming) return
    const response = await fetch(`/api/categories/${renaming.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renaming.name }),
    })
    if (response.ok) {
      showToast('Category updated successfully', 'success')
      setRenaming(null)
      loadCategories()
    } else {
      const error = await response.json().catch(() => null)
      showToast(error?.error || 'Failed to rename category', 'error')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (response.ok) {
      showToast('Category deleted successfully', 'success')
      loadCategories()
    } else {
      const error = await response.json().catch(() => null)
      showToast(error?.error || 'Failed to delete category', 'error')
    }
  }

  const loadOrders = async (filters = orderFilters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
      const response = await fetch(`/api/orders${params.size ? `?${params}` : ''}`)
      if (!response.ok) throw new Error('Request failed')
      setOrders(await response.json())
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
          categoryIds: bookForm.categoryIds,
        }),
      })

      if (response.ok) {
        const saved = await response.json()
        showToast(editingBook ? 'Book updated successfully' : 'Book added successfully', 'success')

        // The book is saved first; a bad image does not undo that
        if (coverFile) {
          const upload = new FormData()
          upload.append('file', coverFile)
          const coverResponse = await fetch(`/api/books/${saved.id}/cover`, { method: 'PUT', body: upload })
          if (!coverResponse.ok) {
            const coverError = await coverResponse.json().catch(() => null)
            showToast(coverError?.error || 'The book was saved but the cover was not uploaded', 'error')
          }
        }

        setBookForm(emptyForm)
        setEditingBook(null)
        setCoverFile(null)
        setFileInputKey((key) => key + 1)
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
      categoryIds: (book.categories ?? []).map((category) => category.id),
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
        const data = await response.json().catch(() => null)
        showToast(data?.code === 'BOOK_HAS_ORDERS' ? data.error : 'Failed to delete book', 'error')
      }
    } catch (error) {
      showToast('Failed to delete book', 'error')
    }
  }

  const handleAdvanceOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/advance`, { method: 'POST' })
      if (response.ok) {
        showToast('Order status updated successfully', 'success')
        loadOrders()
      } else {
        showToast('Failed to update order status', 'error')
      }
    } catch {
      showToast('Failed to update order status', 'error')
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
    setBookForm(emptyForm)
    setCoverFile(null)
    setFileInputKey((key) => key + 1)
  }

  const removeCover = async () => {
    if (!editingBook) return
    const response = await fetch(`/api/books/${editingBook.id}/cover`, { method: 'DELETE' })
    if (response.ok) {
      showToast('Cover removed successfully', 'success')
      setEditingBook({ ...editingBook, coverUrl: null })
      loadBooks()
    } else {
      showToast('Failed to remove cover', 'error')
    }
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

      <div className="mb-12 inline-flex max-w-full flex-wrap border-2 border-ink-950" role="tablist">
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
        <button
          data-testid="admin-categories-tab"
          role="tab"
          aria-selected={activeTab === 'categories'}
          onClick={() => setActiveTab('categories')}
          className={`${tabClass('categories')} border-l-2 border-ink-950`}
        >
          Categories
        </button>
        {EXTRA_TABS.map((tab) => (
          <button
            key={tab.key}
            data-testid={`admin-${tab.key}-tab`}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`${tabClass(tab.key)} border-l-2 border-ink-950`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reviews' && <AdminReviews showToast={showToast} />}

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

                <div>
                  <label htmlFor="book-cover" className="label">Cover image (JPEG or PNG, up to 2 MB)</label>
                  {editingBook?.coverUrl && (
                    <div className="mb-3 flex items-end gap-3">
                      <BookCover id={editingBook.id} coverUrl={editingBook.coverUrl} size="sm" />
                      <button
                        data-testid="admin-book-cover-remove-button"
                        type="button"
                        onClick={removeCover}
                        className="btn btn-danger btn-sm"
                      >
                        Remove cover
                      </button>
                    </div>
                  )}
                  <input
                    key={fileInputKey}
                    id="book-cover"
                    data-testid="admin-book-cover-input"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm file:mr-3 file:border file:border-ink-950 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-ink-950 hover:file:text-white"
                  />
                </div>

                {categories.length > 0 && (
                  <fieldset data-testid="admin-book-categories">
                    <legend className="label">Categories</legend>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center gap-2 text-sm text-ink-800">
                          <input
                            data-testid={`admin-book-category-${category.slug}`}
                            type="checkbox"
                            checked={bookForm.categoryIds.includes(category.id)}
                            onChange={(e) =>
                              setBookForm({
                                ...bookForm,
                                categoryIds: e.target.checked
                                  ? [...bookForm.categoryIds, category.id]
                                  : bookForm.categoryIds.filter((id) => id !== category.id),
                              })
                            }
                            className="h-4 w-4 accent-cobalt-500"
                          />
                          {category.name}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

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
                      {book.categories && book.categories.length > 0 && (
                        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                          {book.categories.map((category) => category.name).join(' / ')}
                        </p>
                      )}
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

      {activeTab === 'categories' && (
        <div data-testid="admin-categories-section" className="grid items-start gap-12 lg:grid-cols-3">
          <div className="border-2 border-ink-950 lg:col-span-1">
            <div className="bg-ink-950 px-6 py-4">
              <h3 className="font-display text-xl font-bold tracking-tight text-white">Add Category</h3>
            </div>
            <form data-testid="admin-category-form" onSubmit={handleCreateCategory} className="space-y-4 p-6">
              <div>
                <label htmlFor="category-name" className="label">Name *</label>
                <input
                  id="category-name"
                  data-testid="admin-category-name-input"
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  required
                  maxLength={60}
                  className="input"
                />
              </div>
              <button data-testid="admin-category-add-button" type="submit" className="btn btn-primary w-full">
                Add Category
              </button>
            </form>
          </div>

          <div data-testid="admin-categories-list" className="border-t-2 border-ink-950 lg:col-span-2">
            {categories.map((category) => (
              <div
                key={category.id}
                data-testid={`admin-category-item-${category.id}`}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-mist-200 py-4"
              >
                {renaming?.id === category.id ? (
                  <form onSubmit={handleRenameCategory} className="flex flex-1 flex-wrap items-center gap-2">
                    <label htmlFor={`rename-${category.id}`} className="sr-only">New name</label>
                    <input
                      id={`rename-${category.id}`}
                      data-testid={`admin-category-rename-input-${category.id}`}
                      type="text"
                      value={renaming.name}
                      onChange={(e) => setRenaming({ id: category.id, name: e.target.value })}
                      required
                      maxLength={60}
                      className="input w-64"
                    />
                    <button data-testid={`admin-category-save-${category.id}`} type="submit" className="btn btn-primary btn-sm">
                      Save
                    </button>
                    <button type="button" onClick={() => setRenaming(null)} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div>
                      <p className="font-display text-xl font-bold tracking-tight text-ink-950">{category.name}</p>
                      <p className="font-mono text-xs text-ink-500">
                        {category.slug} / {category.bookCount} {category.bookCount === 1 ? 'book' : 'books'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        data-testid={`admin-category-rename-${category.id}`}
                        onClick={() => setRenaming({ id: category.id, name: category.name })}
                        aria-label={`Rename ${category.name}`}
                        className="p-2 text-ink-950 transition-colors hover:bg-ink-950 hover:text-white"
                      >
                        <EditIcon className="h-5 w-5" />
                      </button>
                      <button
                        data-testid={`admin-category-delete-${category.id}`}
                        onClick={() => handleDeleteCategory(category.id)}
                        aria-label={`Delete ${category.name}`}
                        className="p-2 text-danger transition-colors hover:bg-danger hover:text-white"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div data-testid="admin-orders-section">
          <form
            data-testid="admin-order-filters"
            className="mb-8 grid gap-4 border-b border-mist-200 pb-8 sm:grid-cols-2 lg:grid-cols-6"
            onSubmit={(e) => {
              e.preventDefault()
              loadOrders()
            }}
          >
            <div className="lg:col-span-2">
              <label htmlFor="order-filter-q" className="label">Search</label>
              <input
                id="order-filter-q"
                data-testid="admin-order-filter-search"
                className="input"
                placeholder="Order number, name or email"
                value={orderFilters.q}
                onChange={(e) => setOrderFilters({ ...orderFilters, q: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="order-filter-status" className="label">Status</label>
              <select
                id="order-filter-status"
                data-testid="admin-order-filter-status"
                className="input"
                value={orderFilters.status}
                onChange={(e) => setOrderFilters({ ...orderFilters, status: e.target.value })}
              >
                <option value="">All</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="order-filter-shipping" className="label">Shipping</label>
              <select
                id="order-filter-shipping"
                data-testid="admin-order-filter-shipping"
                className="input"
                value={orderFilters.shippingMethod}
                onChange={(e) => setOrderFilters({ ...orderFilters, shippingMethod: e.target.value })}
              >
                <option value="">All</option>
                <option value="STANDARD">Standard</option>
                <option value="EXPRESS">Express</option>
              </select>
            </div>
            <div>
              <label htmlFor="order-filter-from" className="label">From</label>
              <input
                id="order-filter-from"
                type="date"
                data-testid="admin-order-filter-from"
                className="input"
                value={orderFilters.from}
                onChange={(e) => setOrderFilters({ ...orderFilters, from: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="order-filter-to" className="label">To</label>
              <input
                id="order-filter-to"
                type="date"
                data-testid="admin-order-filter-to"
                className="input"
                value={orderFilters.to}
                onChange={(e) => setOrderFilters({ ...orderFilters, to: e.target.value })}
              />
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
              <button type="submit" data-testid="admin-order-filter-apply" className="btn btn-primary">Apply filters</button>
              <button
                type="button"
                data-testid="admin-order-filter-clear"
                className="btn btn-secondary"
                onClick={() => {
                  const cleared = { status: '', shippingMethod: '', q: '', from: '', to: '' }
                  setOrderFilters(cleared)
                  loadOrders(cleared)
                }}
              >
                Clear
              </button>
            </div>
          </form>
          {loading ? (
            <div data-testid="admin-orders-loading" aria-busy="true" className="space-y-px">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-32 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div data-testid="admin-no-orders" className="empty-state">
              <p className="section-label mb-4">0 orders</p>
              <h3 className="panel-title mb-3">{Object.values(orderFilters).some(Boolean) ? 'No orders match' : 'No orders yet'}</h3>
              <p className="max-w-md text-ink-600">
                {Object.values(orderFilters).some(Boolean)
                  ? 'Change or clear the filters to see more orders.'
                  : 'Orders will appear here once customers start purchasing.'}
              </p>
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
                      {order.shippingMethod === 'EXPRESS' && (
                        <span data-testid={`admin-order-express-${order.id}`} className="badge badge-primary mr-2 align-middle">Express</span>
                      )}
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
                      {nextStatus(order.status) && (
                        <button
                          type="button"
                          data-testid={`admin-order-advance-${order.id}`}
                          onClick={() => handleAdvanceOrder(order.id)}
                          className="btn btn-primary btn-sm ml-2 mt-2"
                        >
                          Mark as {nextStatus(order.status)!.toLowerCase()}
                        </button>
                      )}
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
