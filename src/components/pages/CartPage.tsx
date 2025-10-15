'use client'

import { useState, useEffect } from 'react'
import { Book, CartItem } from '@/types'

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
        showToast('Failed to update quantity', 'error')
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
      <div data-testid="cart-loading" className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Loading your cart...</p>
      </div>
    )
  }

  return (
    <div data-testid="cart-page" className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Shopping Cart
        </h2>
        <p className="text-gray-600 text-lg">
          {cartItems.length === 0 
            ? 'Your cart is waiting for some great books!' 
            : `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'} in your cart`
          }
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div data-testid="empty-cart-message" className="card-gradient text-center py-20 max-w-lg mx-auto">
          <div className="text-8xl mb-6 animate-bounce">🛒</div>
          <h3 className="text-3xl font-bold text-gray-800 mb-3">Your cart is empty</h3>
          <p className="text-gray-600 mb-8 text-lg">
            Discover amazing books and start your reading journey!
          </p>
          <button data-testid="browse-books-button" onClick={() => navigateTo('home')} className="btn btn-primary text-lg">
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Browse Books
            </span>
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div data-testid="cart-items-list" className="lg:col-span-2 space-y-4">
            {cartItems.map((item, index) => (
              <div 
                key={item.id}
                data-testid={`cart-item-${item.id}`}
                className="card-gradient border-2 border-transparent hover:border-primary-200 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Book Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-32 bg-gradient-to-br from-primary-100 to-purple-100 rounded-xl flex items-center justify-center text-4xl shadow-lg">
                      📖
                    </div>
                  </div>
                  
                  {/* Book Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {item.book.title}
                    </h3>
                    <p className="text-gray-600 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">{item.book.author}</span>
                    </p>
                    <div className="flex items-baseline gap-3 mb-4">
                      <p className="text-3xl font-bold text-gradient">
                        ${item.book.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">per book</p>
                    </div>
                    
                    {/* Quantity & Remove */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700">Quantity:</label>
                        <input
                          data-testid={`cart-item-quantity-${item.id}`}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                          min="1"
                          max={item.book.stockQuantity}
                          className="w-20 px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-200 focus:border-primary-400 font-semibold text-center"
                        />
                      </div>
                      <div data-testid={`cart-item-subtotal-${item.id}`} className="text-lg font-bold text-gray-700">
                        Subtotal: <span className="text-primary-600">${(item.book.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <button
                        data-testid={`remove-cart-item-${item.id}`}
                        onClick={() => handleRemoveItem(item.id)}
                        className="ml-auto btn btn-danger text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div data-testid="order-summary" className="card-gradient sticky top-24 border-2 border-primary-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Order Summary
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Items ({cartItems.reduce((acc, item) => acc + item.quantity, 0)})</span>
                  <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
                </div>
                
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <p className="text-sm text-emerald-800 font-semibold mb-1">🎉 Free Shipping!</p>
                  <p className="text-xs text-emerald-700">All orders ship for free</p>
                </div>
                
                <div className="pt-4 border-t-2 border-gray-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span data-testid="cart-total" className="text-4xl font-bold text-gradient">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <button 
                data-testid="proceed-to-checkout-button"
                onClick={handleCheckout} 
                className="btn btn-primary w-full text-lg"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Proceed to Checkout
                </span>
              </button>
              
              <button 
                data-testid="continue-shopping-button"
                onClick={() => navigateTo('home')} 
                className="btn btn-outline w-full mt-3"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Continue Shopping
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

