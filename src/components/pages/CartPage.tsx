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
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Loading cart...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <div className="card text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-4">Add some books to get started!</p>
          <button onClick={() => navigateTo('home')} className="btn btn-primary">
            Browse Books
          </button>
        </div>
      ) : (
        <>
          <div className="card mb-6">
            {cartItems.map((item) => (
              <div 
                key={item.id} 
                className="flex flex-col md:flex-row md:items-center md:justify-between py-4 border-b last:border-b-0"
              >
                <div className="flex-1 mb-4 md:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900">{item.book.title}</h3>
                  <p className="text-gray-600">by {item.book.author}</p>
                  <p className="text-success font-semibold">${item.book.price.toFixed(2)} each</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                    min="1"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="btn btn-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Total: ${total.toFixed(2)}
            </h3>
            <button onClick={handleCheckout} className="btn btn-primary">
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}

