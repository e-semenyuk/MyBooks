'use client'

import { useState, useEffect } from 'react'
import { Book, CartItem } from '@/types'
import BookCover from '@/components/BookCover'
import { CartIcon, TrashIcon } from '@/components/icons'

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
        <div className="skeleton h-10 w-56" />
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-28 w-full" />
      </div>
    )
  }

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div data-testid="cart-page" className="animate-fade-in">
      <div className="mb-10 border-b border-stone-200 pb-8">
        <p className="section-label mb-3">Your order</p>
        <h2 className="page-title mb-2">Shopping Cart</h2>
        <p className="text-stone-600">
          {cartItems.length === 0
            ? 'Your cart is empty.'
            : `${cartItems.length} ${cartItems.length === 1 ? 'title' : 'titles'}, ${itemCount} ${itemCount === 1 ? 'copy' : 'copies'}`}
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div data-testid="empty-cart-message" className="empty-state">
          <CartIcon className="mx-auto mb-4 h-8 w-8 text-stone-500" />
          <h3 className="panel-title mb-2">Your cart is empty</h3>
          <p className="mb-6 text-sm text-stone-600">
            Browse the catalog and add the books you would like to order.
          </p>
          <button
            data-testid="browse-books-button"
            onClick={() => navigateTo('home')}
            className="btn btn-primary"
          >
            Browse Books
          </button>
        </div>
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-3">
          <div
            data-testid="cart-items-list"
            className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white lg:col-span-2"
          >
            {cartItems.map((item) => (
              <div key={item.id} data-testid={`cart-item-${item.id}`} className="flex gap-5 p-5">
                <BookCover id={item.book.id} title={item.book.title} size="sm" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug text-ink-900">
                        {item.book.title}
                      </h3>
                      <p className="text-sm text-stone-600">{item.book.author}</p>
                    </div>
                    <p className="num shrink-0 text-sm text-stone-600">
                      ${item.book.price.toFixed(2)} each
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2">
                      <label htmlFor={`qty-${item.id}`} className="text-sm text-stone-600">
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
                        className="input num w-20 py-1.5 text-center"
                      />
                    </div>

                    <div data-testid={`cart-item-subtotal-${item.id}`} className="num text-sm text-stone-600">
                      Subtotal:{' '}
                      <span className="font-semibold text-ink-900">
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

          <aside
            data-testid="order-summary"
            className="rounded-lg border border-stone-200 bg-white p-6 lg:sticky lg:top-24"
          >
            <h3 className="panel-title mb-6">Order Summary</h3>

            <dl className="mb-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-600">Items ({itemCount})</dt>
                <dd className="num font-medium text-ink-900">${total.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-600">Shipping</dt>
                <dd className="font-medium text-ink-900">Free</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-stone-200 pt-4">
                <dt className="font-medium text-ink-900">Total</dt>
                <dd data-testid="cart-total" className="num font-display text-3xl font-semibold text-ink-900">
                  ${total.toFixed(2)}
                </dd>
              </div>
            </dl>

            <button
              data-testid="proceed-to-checkout-button"
              onClick={handleCheckout}
              className="btn btn-primary w-full"
            >
              Proceed to Checkout
            </button>

            <button
              data-testid="continue-shopping-button"
              onClick={() => navigateTo('home')}
              className="btn btn-secondary mt-3 w-full"
            >
              Continue Shopping
            </button>
          </aside>
        </div>
      )}
    </div>
  )
}
