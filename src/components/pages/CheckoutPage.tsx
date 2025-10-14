'use client'

import { useState } from 'react'

interface CheckoutPageProps {
  showToast: (message: string, type: 'success' | 'error') => void
  updateCartCount: () => void
  navigateTo: (page: 'home' | 'cart' | 'checkout' | 'admin') => void
}

export default function CheckoutPage({ showToast, updateCartCount, navigateTo }: CheckoutPageProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerAddress: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const order = await response.json()
        showToast(`Order placed successfully! Order ID: ${order.id}`, 'success')
        setFormData({ customerName: '', customerEmail: '', customerAddress: '' })
        updateCartCount()
        navigateTo('home')
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to place order', 'error')
      }
    } catch (error) {
      showToast('Failed to place order', 'error')
      console.error('Error placing order:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-900">Checkout</h2>

      <div className="card max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="customerEmail"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              id="customerAddress"
              name="customerAddress"
              value={formData.customerAddress}
              onChange={handleChange}
              required
              rows={3}
              className="input"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigateTo('cart')}
              className="btn btn-secondary flex-1"
            >
              Back to Cart
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary flex-1"
            >
              {submitting ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

