'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@/components/icons'
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
        <div className="skeleton h-14 w-72" />
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div data-testid="order-detail-not-found" className="empty-state">
        <p className="section-label mb-4">Error 404</p>
        <h2 className="panel-title mb-3">Order not found</h2>
        <p className="mb-8 max-w-md text-ink-600">
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
        className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-cobalt-500 underline underline-offset-4 transition-colors hover:text-cobalt-700"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to profile
      </Link>

      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-6">
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
        <span data-testid="order-detail-status" className={`badge ${badge} px-3 py-1.5 text-sm`}>
          {order.status}
        </span>
      </div>

      <div className="grid items-start gap-12 lg:grid-cols-3">
        <div className="space-y-12 lg:col-span-2">
          <section>
            <h3 className="section-label mb-4">Items</h3>
            <div data-testid="order-detail-items" className="border-t-2 border-ink-950">
              {order.orderItems.map((item) => (
                <div
                  key={item.id}
                  data-testid={`order-detail-item-${item.bookId}`}
                  className="flex items-start justify-between gap-4 border-b border-mist-200 py-5"
                >
                  <div className="min-w-0">
                    <p className="font-display text-xl font-bold leading-tight tracking-tight text-ink-950">
                      {item.book?.title ?? 'Unknown'}
                    </p>
                    <p className="text-sm text-ink-600">{item.book?.author ?? 'Unknown'}</p>
                    <p className="num mt-1 font-mono text-xs text-ink-500">
                      ${item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <p className="num shrink-0 font-semibold text-ink-950">
                    ${((Math.round(item.price * 100) * item.quantity) / 100).toFixed(2)}
                  </p>
                </div>
              ))}
              <dl data-testid="order-detail-breakdown" className="space-y-2 border-b border-mist-200 px-5 py-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-600">Subtotal</dt>
                  <dd data-testid="order-detail-subtotal" className="num text-ink-950">${order.subtotal.toFixed(2)}</dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-600">Discount{order.promoCode ? ` (${order.promoCode})` : ''}</dt>
                    <dd data-testid="order-detail-discount" className="num text-success">-${order.discount.toFixed(2)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-600">Shipping ({order.shippingMethod === 'EXPRESS' ? 'Express' : 'Standard'})</dt>
                  <dd data-testid="order-detail-shipping" className="num text-ink-950">
                    {order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-600">Tax</dt>
                  <dd data-testid="order-detail-tax" className="num text-ink-950">${order.tax.toFixed(2)}</dd>
                </div>
              </dl>
              <div className="flex items-baseline justify-between bg-ink-950 px-5 py-5 text-white">
                <span className="font-semibold">Total</span>
                <span data-testid="order-detail-total" className="num font-display text-4xl font-extrabold tracking-tight">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {order.events && order.events.length > 0 && (
            <section data-testid="order-detail-history">
              <h3 className="section-label mb-5">Status history</h3>
              <ol className="relative space-y-6 border-l-2 border-ink-950 pl-7">
                {order.events.map((event) => (
                  <li key={event.id} data-testid={`order-detail-history-${event.id}`} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[35px] top-1 h-3 w-3 bg-cobalt-500"
                    />
                    <p className="font-semibold text-ink-950">
                      {event.fromStatus ? `${event.fromStatus} to ${event.toStatus}` : `Placed as ${event.toStatus}`}
                    </p>
                    <p className="font-mono text-xs text-ink-500">
                      {new Date(event.createdAt).toLocaleString('en-US')}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="border-2 border-ink-950">
          <div className="bg-ink-950 px-6 py-3">
            <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-white">Delivery</h3>
          </div>
          <div className="p-6">
            <p data-testid="order-detail-customer" className="mb-1 font-semibold text-ink-950">
              {order.customerName}
            </p>
            <p className="mb-5 text-sm text-ink-600">{order.customerEmail}</p>
            <p data-testid="order-detail-address" className="whitespace-pre-line text-sm text-ink-700">
              {order.customerAddress}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
