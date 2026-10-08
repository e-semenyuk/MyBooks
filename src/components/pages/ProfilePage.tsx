'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowRightIcon } from '@/components/icons'
import AddressBook from '@/components/AddressBook'

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
      <div data-testid="profile-login-required" className="empty-state">
        <p className="section-label mb-4">Restricted</p>
        <h2 className="panel-title mb-3">Please Login</h2>
        <p className="text-ink-600">You need to be logged in to view your profile.</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'badge-warning'
      case 'DELIVERED':
        return 'badge-success'
      case 'CANCELLED':
        return 'badge-danger'
      default:
        return 'badge-primary'
    }
  }

  return (
    <div data-testid="profile-page" className="animate-fade-in">
      <div data-testid="profile-header" className="mb-14">
        <p className="section-label mb-6">05 / Account</p>
        <h2 className="page-title mb-5 break-words">Welcome, {session.user?.name}</h2>
        <p className="flex flex-wrap items-center gap-3 text-ink-600">
          <span>{session.user?.email}</span>
          <span className={`badge ${(session.user as any)?.role === 'ADMIN' ? 'border-cobalt-500 bg-cobalt-50 text-cobalt-700' : 'badge-primary'}`}>
            {(session.user as any)?.role}
          </span>
        </p>
      </div>

      <AddressBook showToast={showToast} />

      <div data-testid="order-history-section">
        <div className="flex items-baseline justify-between border-t-2 border-ink-950 pb-5 pt-5">
          <h3 className="font-display text-2xl font-bold tracking-tight text-ink-950">Order History</h3>
          <span className="num font-mono text-xs text-ink-600">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        {loading ? (
          <div data-testid="profile-orders-loading" aria-busy="true" className="space-y-px">
            <div className="skeleton h-40 w-full" />
            <div className="skeleton h-40 w-full" />
          </div>
        ) : orders.length === 0 ? (
          <div data-testid="profile-no-orders" className="border-t border-mist-200 py-14">
            <p className="section-label mb-4">0 orders</p>
            <h3 className="panel-title mb-3">No orders yet</h3>
            <p className="mb-8 max-w-md text-ink-600">Your orders will appear here after your first purchase.</p>
            <Link href="/" className="btn btn-primary">
              Browse Books
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <div data-testid="profile-orders-list">
            {orders.map((order) => (
              <div
                key={order.id}
                data-testid={`profile-order-item-${order.id}`}
                className="border-t border-mist-200 py-7"
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-1 flex items-center gap-3">
                      <h4 className="font-display text-2xl font-bold tracking-tight text-ink-950">
                        Order #{order.id}
                      </h4>
                      <span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                    <p className="font-mono text-xs text-ink-500">
                      {new Date(order.orderDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="section-label mb-1">Total</p>
                    <p className="num font-display text-3xl font-extrabold tracking-tight text-ink-950">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <p className="section-label mb-3">Items ({order.orderItems?.length || 0})</p>
                <div className="mb-5 divide-y divide-mist-200 border-y border-mist-200">
                  {order.orderItems?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-950">{item.book?.title || 'Unknown'}</p>
                        <p className="text-sm text-ink-600">{item.book?.author || 'Unknown'}</p>
                        <p className="num font-mono text-xs text-ink-500">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <p className="num shrink-0 font-semibold text-ink-950">
                        ${(Math.round(item.price * 100) * item.quantity / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  data-testid={`profile-order-view-${order.id}`}
                  href={`/orders/${order.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-cobalt-500 underline underline-offset-4 transition-colors hover:text-cobalt-700"
                >
                  View details
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
