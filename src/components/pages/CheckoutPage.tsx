'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface CheckoutPageProps {
  showToast: (message: string, type: 'success' | 'error') => void
  updateCartCount: () => void
  navigateTo: (page: 'home' | 'cart' | 'checkout' | 'admin') => void
}

export default function CheckoutPage({ showToast, updateCartCount, navigateTo }: CheckoutPageProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerAddress: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (session?.user) {
      setFormData({
        customerName: session.user.name || '',
        customerEmail: session.user.email || '',
        customerAddress: '',
      })
    }
  }, [session])

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
    <div data-testid="checkout-page" className="animate-fade-in">
      <div className="mb-10 border-b border-stone-200 pb-8">
        <p className="section-label mb-3">Final step</p>
        <h2 className="page-title mb-2">Checkout</h2>
        <p className="text-stone-600">Enter the delivery details for your order.</p>
      </div>

      <div className="max-w-2xl rounded-lg border border-stone-200 bg-white p-8">
        <form data-testid="checkout-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="customerName" className="label">
              Full Name
            </label>
            <input
              data-testid="checkout-name-input"
              type="text"
              id="customerName"
              name="customerName"
              autoComplete="name"
              value={formData.customerName}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="label">
              Email
            </label>
            <input
              data-testid="checkout-email-input"
              type="email"
              id="customerEmail"
              name="customerEmail"
              autoComplete="email"
              value={formData.customerEmail}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label htmlFor="customerAddress" className="label">
              Address
            </label>
            <textarea
              data-testid="checkout-address-input"
              id="customerAddress"
              name="customerAddress"
              autoComplete="street-address"
              value={formData.customerAddress}
              onChange={handleChange}
              required
              rows={3}
              className="input"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row">
            <button
              data-testid="back-to-cart-button"
              type="button"
              onClick={() => navigateTo('cart')}
              className="btn btn-secondary flex-1"
            >
              Back to Cart
            </button>
            <button
              data-testid="place-order-button"
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
