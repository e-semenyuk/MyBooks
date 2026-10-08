'use client'

import { useState, useEffect } from 'react'
import { Book, CartItem } from '@/types'
import BookCover from '@/components/BookCover'
import { ArrowRightIcon, TrashIcon } from '@/components/icons'

interface CartPageProps {
  showToast: (message: string, type: 'success' | 'error') => void
  updateCartCount: () => void
  navigateTo: (page: 'home' | 'cart' | 'checkout' | 'admin') => void
}

interface CartItemWithBook extends CartItem {
  book: Book
}

export default function CartPage({ showToast, updateCartCount, navigateTo }: CartPageProps) {
  const [cartItems, setCartItems] = useState<CartItemWithBook[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/cart')
      const items = await response.json()

      // Fetch book details for each cart item
      const itemsWithBooks = await Promise.all(
        items.map(async (item: CartItem) => {
          const bookRes = await fetch(`/api/books/${item.bookId}`)
          const book = await bookRes.json()
          return { ...item, book }
        })
      )

      setCartItems(itemsWithBooks)
      calculateTotal(itemsWithBooks)
      updateCartCount()
    } catch (error) {
      showToast('Failed to load cart', 'error')
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = (items: CartItemWithBook[]) => {
    const sum = items.reduce((acc, item) => acc + (item.book.price * item.quantity), 0)
    setTotal(sum)
  }

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })

      if (response.ok) {
        loadCart()
      } else {
        const data = await response.json().catch(() => null)
        showToast(data?.error || 'Failed to update quantity', 'error')
      }
    } catch (error) {
      showToast('Failed to update quantity', 'error')
      console.error('Error updating quantity:', error)
    }
  }

  const handleRemoveItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast('Item removed from cart', 'success')
        loadCart()
      } else {
        showToast('Failed to remove item', 'error')
      }
    } catch (error) {
      showToast('Failed to remove item', 'error')
      console.error('Error removing item:', error)
    }
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showToast('Your cart is empty', 'error')
      return
    }
    navigateTo('checkout')
  }

  if (loading) {
    return (
      <div data-testid="cart-loading" aria-busy="true" className="space-y-4">
        <div className="skeleton h-14 w-72" />
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-28 w-full" />
      </div>
    )
  }

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div data-testid="cart-page" className="animate-fade-in">
      <div className="mb-12">
        <p className="section-label mb-6">02 / Cart</p>
        <h2 className="page-title mb-4">Shopping Cart</h2>
        <p className="text-lg text-ink-600">
          {cartItems.length === 0
            ? 'Your cart is empty.'
            : `${cartItems.length} ${cartItems.length === 1 ? 'title' : 'titles'}, ${itemCount} ${itemCount === 1 ? 'copy' : 'copies'}`}
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div data-testid="empty-cart-message" className="empty-state">
          <p className="section-label mb-4">0 items</p>
          <h3 className="panel-title mb-3">Your cart is empty</h3>
          <p className="mb-8 max-w-md text-ink-600">
            Browse the catalog and add the books you would like to order.
          </p>
          <button
            data-testid="browse-books-button"
            onClick={() => navigateTo('home')}
            className="btn btn-primary"
          >
            Browse Books
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="grid items-start gap-12 lg:grid-cols-3">
          <div data-testid="cart-items-list" className="border-t-2 border-ink-950 lg:col-span-2">
            {cartItems.map((item, index) => (
              <div
                key={item.id}
                data-testid={`cart-item-${item.id}`}
                className="grid grid-cols-[auto_auto_1fr] gap-x-5 border-b border-mist-200 py-6 sm:grid-cols-[2rem_auto_1fr]"
              >
                <span className="hidden font-mono text-xs text-ink-500 sm:block">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <BookCover id={item.book.id} title={item.book.title} coverUrl={item.book.coverUrl} size="sm" className="col-start-1 sm:col-start-2" />

                <div className="col-start-2 min-w-0 sm:col-start-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-display text-xl font-bold leading-tight tracking-tight text-ink-950">
                        {item.book.title}
                      </h3>
                      <p className="text-sm text-ink-600">{item.book.author}</p>
                    </div>
                    <p className="num shrink-0 font-mono text-xs text-ink-500">
                      ${item.book.price.toFixed(2)} each
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
                    <div>
                      <label htmlFor={`qty-${item.id}`} className="label">
                        Quantity
                      </label>
                      <input
                        id={`qty-${item.id}`}
                        data-testid={`cart-item-quantity-${item.id}`}
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                        min="1"
                        max={item.book.stockQuantity}
                        className="input num w-20 py-2 text-center"
                      />
                    </div>

                    <div data-testid={`cart-item-subtotal-${item.id}`} className="num text-sm text-ink-600">
                      Subtotal:{' '}
                      <span className="font-display text-xl font-extrabold text-ink-950">
                        ${(item.book.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                    <button
                      data-testid={`remove-cart-item-${item.id}`}
                      onClick={() => handleRemoveItem(item.id)}
                      className="btn btn-danger btn-sm ml-auto"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside data-testid="order-summary" className="border-2 border-ink-950 lg:sticky lg:top-24">
            <div className="bg-ink-950 px-6 py-4">
              <h3 className="font-display text-xl font-bold tracking-tight text-white">Order Summary</h3>
            </div>
            <div className="p-6">
              <dl className="mb-8 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-600">Items ({itemCount})</dt>
                  <dd className="num font-semibold text-ink-950">${total.toFixed(2)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t-2 border-ink-950 pt-5">
                  <dt className="font-semibold text-ink-950">Subtotal</dt>
                  <dd data-testid="cart-total" className="num font-display text-5xl font-extrabold tracking-tight text-ink-950">
                    ${total.toFixed(2)}
                  </dd>
                </div>
              </dl>
              <p className="-mt-4 mb-6 text-xs text-ink-500">Shipping, promo codes and tax are added at checkout.</p>

              <button
                data-testid="proceed-to-checkout-button"
                onClick={handleCheckout}
                className="btn btn-primary w-full justify-between"
              >
                Proceed to Checkout
                <ArrowRightIcon className="h-5 w-5" />
              </button>

              <button
                data-testid="continue-shopping-button"
                onClick={() => navigateTo('home')}
                className="btn btn-secondary mt-3 w-full"
              >
                Continue Shopping
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
