'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface ProfilePageProps {
  showToast: (message: string, type: 'success' | 'error') => void
}

interface Order {
  id: number
  customerName: string
  customerEmail: string
  totalAmount: number
  status: string
  orderDate: string
  orderItems: any[]
}

export default function ProfilePage({ showToast }: ProfilePageProps) {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      loadOrders()
    }
  }, [session])

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

  if (!session) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Please Login</h2>
        <p className="text-gray-600">You need to be logged in to view your profile.</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'badge-warning'
      case 'CONFIRMED':
        return 'badge-primary'
      case 'SHIPPED':
        return 'badge-primary'
      case 'DELIVERED':
        return 'badge-success'
      case 'CANCELLED':
        return 'badge-danger'
      default:
        return 'badge-primary'
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Profile Header */}
      <div className="card-gradient mb-8 bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
            {session.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {session.user?.name}!
            </h2>
            <p className="text-gray-600 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {session.user?.email}
            </p>
            <div className="mt-3">
              <span className={`badge ${(session.user as any)?.role === 'ADMIN' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' : 'badge-primary'}`}>
                {(session.user as any)?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="card-gradient">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Order History
          </h3>
          <span className="text-sm font-semibold text-gray-600">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
            <div className="text-7xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start shopping to see your order history here!</p>
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold">
              Browse Books
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border-2 border-gray-200 rounded-2xl p-6 hover:border-primary-300 transition-all bg-gradient-to-r from-white to-gray-50"
              >
                {/* Order Header */}
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4 pb-4 border-b-2 border-gray-200">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-gray-900">Order #{order.id}</h4>
                      <span className={`badge ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(order.orderDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Total</p>
                    <p className="text-3xl font-bold text-gradient">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <p className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Items ({order.orderItems?.length || 0})
                  </p>
                  <div className="space-y-2 bg-white rounded-xl p-4 border border-gray-100">
                    {order.orderItems?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-2 border-b last:border-b-0 border-gray-100"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{item.book?.title || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">by {item.book?.author || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-600">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

