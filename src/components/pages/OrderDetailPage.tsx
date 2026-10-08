'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { OrderWithItems } from '@/types'

interface OrderDetailPageProps {
  orderId: number
  showToast: (message: string, type: 'success' | 'error') => void
}

export default function OrderDetailPage({ orderId, showToast }: OrderDetailPageProps) {
  const [order, setOrder] = useState<OrderWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        if (response.status === 404) {
          setNotFound(true)
        } else if (response.ok) {
          setOrder(await response.json())
        } else {
          showToast('Failed to load order', 'error')
        }
      } catch (error) {
        showToast('Failed to load order', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
    // showToast is stable for the lifetime of the app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  if (loading) {
    return (
      <div data-testid="order-detail-loading" className="text-center py-20 text-gray-600">
        Loading order...
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div data-testid="order-detail-not-found" className="text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Order not found</h2>
        <p className="text-gray-600 mb-6">This order does not exist or belongs to another account.</p>
        <Link
          data-testid="order-detail-back-button"
          href="/profile"
          className="btn btn-primary"
        >
          Back to profile
        </Link>
      </div>
    )
  }

  return (
    <div data-testid="order-detail-page" className="max-w-3xl mx-auto animate-fade-in">
      <Link
        data-testid="order-detail-back-button"
        href="/profile"
        className="text-primary-600 font-semibold hover:underline"
      >
        ← Back to profile
      </Link>

      <div className="card mt-4">
        <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b-2 border-gray-200">
          <div>
            <h2 data-testid="order-detail-title" className="text-2xl font-bold text-gray-900">
              Order #{order.id}
            </h2>
            <p className="text-sm text-gray-600">
              {new Date(order.orderDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <span data-testid="order-detail-status" className="badge">
            {order.status}
          </span>
        </div>

        <div className="py-4 text-sm text-gray-700">
          <p data-testid="order-detail-customer">
            {order.customerName} · {order.customerEmail}
          </p>
          <p data-testid="order-detail-address" className="whitespace-pre-line">
            {order.customerAddress}
          </p>
        </div>

        <div data-testid="order-detail-items" className="space-y-2 bg-white rounded-xl p-4 border border-gray-100">
          {order.orderItems.map((item) => (
            <div
              key={item.id}
              data-testid={`order-detail-item-${item.bookId}`}
              className="flex justify-between items-center py-2 border-b last:border-b-0 border-gray-100"
            >
              <div>
                <p className="font-semibold text-gray-900">{item.book?.title ?? 'Unknown'}</p>
                <p className="text-sm text-gray-600">by {item.book?.author ?? 'Unknown'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="text-lg font-bold text-primary-600">
                ${(Math.round(item.price * 100) * item.quantity / 100).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4">
          <span className="text-gray-600 uppercase tracking-wide text-sm">Total</span>
          <span data-testid="order-detail-total" className="text-3xl font-bold text-gradient">
            ${order.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
