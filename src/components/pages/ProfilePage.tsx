'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowRightIcon, LockIcon, PackageIcon } from '@/components/icons'

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
        <LockIcon className="mx-auto mb-4 h-8 w-8 text-stone-500" />
        <h2 className="panel-title mb-2">Please Login</h2>
        <p className="text-sm text-stone-600">You need to be logged in to view your profile.</p>
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

  const initial = session.user?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <div data-testid="profile-page" className="animate-fade-in">
      <div data-testid="profile-header" className="mb-10 flex items-center gap-6 border-b border-stone-200 pb-8">
        <div
          aria-hidden="true"
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ink-900 font-serif text-3xl font-semibold text-white"
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="section-label mb-2">Account</p>
          <h2 className="page-title mb-1 truncate">Welcome, {session.user?.name}</h2>
          <p className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
            <span className="truncate">{session.user?.email}</span>
            <span className={`badge ${(session.user as any)?.role === 'ADMIN' ? 'bg-brass-100 text-brass-700' : 'badge-primary'}`}>
              {(session.user as any)?.role}
            </span>
          </p>
        </div>
      </div>

      <div data-testid="order-history-section">
        <div className="mb-6 flex items-baseline justify-between">
          <h3 className="font-serif text-2xl font-semibold tracking-tight text-ink-900">Order History</h3>
          <span className="num text-sm text-stone-600">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
          </span>
        </div>

        {loading ? (
          <div data-testid="profile-orders-loading" aria-busy="true" className="space-y-4">
            <div className="skeleton h-40 w-full" />
            <div className="skeleton h-40 w-full" />
          </div>
        ) : orders.length === 0 ? (
          <div data-testid="profile-no-orders" className="empty-state">
            <PackageIcon className="mx-auto mb-4 h-8 w-8 text-stone-500" />
            <h3 className="panel-title mb-2">No orders yet</h3>
            <p className="mb-6 text-sm text-stone-600">Your orders will appear here after your first purchase.</p>
            <Link href="/" className="btn btn-primary">
              Browse Books
            </Link>
          </div>
        ) : (
          <div data-testid="profile-orders-list" className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                data-testid={`profile-order-item-${order.id}`}
                className="rounded-lg border border-stone-200 bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 p-5">
                  <div>
                    <div className="mb-1 flex items-center gap-3">
                      <h4 className="font-serif text-lg font-semibold text-ink-900">Order #{order.id}</h4>
                      <span className={`badge ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                    <p className="text-sm text-stone-600">
                      {new Date(order.orderDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="section-label mb-1">Total</p>
                    <p className="num font-serif text-2xl font-semibold text-ink-900">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <p className="section-label mb-3">Items ({order.orderItems?.length || 0})</p>
                  <div className="space-y-3">
                    {order.orderItems?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-ink-900">{item.book?.title || 'Unknown'}</p>
                          <p className="text-sm text-stone-600">{item.book?.author || 'Unknown'}</p>
                          <p className="num text-xs text-stone-500">
                            ${item.price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                        <p className="num shrink-0 font-medium text-ink-900">
                          ${(Math.round(item.price * 100) * item.quantity / 100).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 border-t border-stone-200 pt-4">
                    <Link
                      data-testid={`profile-order-view-${order.id}`}
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brass-700 transition-colors hover:text-ink-900"
                    >
                      View details
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
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
