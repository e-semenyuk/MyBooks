'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon, SearchOffIcon } from '@/components/icons'
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
      <div data-testid="order-detail-loading" aria-busy="true" className="space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div data-testid="order-detail-not-found" className="empty-state">
        <SearchOffIcon className="mx-auto mb-4 h-8 w-8 text-stone-500" />
        <h2 className="panel-title mb-2">Order not found</h2>
        <p className="mb-6 text-sm text-stone-600">
          This order does not exist or belongs to another account.
        </p>
        <Link data-testid="order-detail-back-button" href="/profile" className="btn btn-primary">
          Back to profile
        </Link>
      </div>
    )
  }

  const badge =
    order.status === 'DELIVERED' ? 'badge-success'
    : order.status === 'CANCELLED' ? 'badge-danger'
    : order.status === 'PENDING' ? 'badge-warning'
    : 'badge-primary'

  return (
    <div data-testid="order-detail-page" className="animate-fade-in">
      <Link
        data-testid="order-detail-back-button"
        href="/profile"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-brass-700 transition-colors hover:text-ink-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to profile
      </Link>

      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-8">
        <div>
          <p className="section-label mb-3">
            Placed{' '}
            {new Date(order.orderDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h2 data-testid="order-detail-title" className="page-title">
            Order #{order.id}
          </h2>
        </div>
        <span data-testid="order-detail-status" className={`badge ${badge} px-3 py-1 text-sm`}>
          {order.status}
        </span>
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h3 className="section-label mb-3">Items</h3>
            <div
              data-testid="order-detail-items"
              className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white"
            >
              {order.orderItems.map((item) => (
                <div
                  key={item.id}
                  data-testid={`order-detail-item-${item.bookId}`}
                  className="flex items-start justify-between gap-4 p-5"
                >
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-semibold leading-snug text-ink-900">
                      {item.book?.title ?? 'Unknown'}
                    </p>
                    <p className="text-sm text-stone-600">{item.book?.author ?? 'Unknown'}</p>
                    <p className="num mt-1 text-xs text-stone-500">
                      ${item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <p className="num shrink-0 font-medium text-ink-900">
                    ${((Math.round(item.price * 100) * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
              ))}
              <div className="flex items-baseline justify-between bg-stone-50 p-5">
                <span className="font-medium text-ink-900">Total</span>
                <span data-testid="order-detail-total" className="num font-serif text-3xl font-semibold text-ink-900">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {order.events && order.events.length > 0 && (
            <section data-testid="order-detail-history">
              <h3 className="section-label mb-4">Status history</h3>
              <ol className="relative space-y-6 border-l border-stone-300 pl-6">
                {order.events.map((event) => (
                  <li key={event.id} data-testid={`order-detail-history-${event.id}`} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brass-500 ring-1 ring-brass-500"
                    />
                    <p className="text-sm font-medium text-ink-900">
                      {event.fromStatus ? `${event.fromStatus} to ${event.toStatus}` : `Placed as ${event.toStatus}`}
                    </p>
                    <p className="text-xs text-stone-500">
                      {new Date(event.createdAt).toLocaleString('en-US')}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="section-label mb-4">Delivery</h3>
          <p data-testid="order-detail-customer" className="mb-1 font-medium text-ink-900">
            {order.customerName}
          </p>
          <p className="mb-4 text-sm text-stone-600">{order.customerEmail}</p>
          <p data-testid="order-detail-address" className="whitespace-pre-line text-sm text-stone-700">
            {order.customerAddress}
          </p>
        </aside>
      </div>
    </div>
  )
}
