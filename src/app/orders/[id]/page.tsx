'use client'

import { notFound } from 'next/navigation'
import OrderDetailPage from '@/components/pages/OrderDetailPage'
import { useApp } from '@/components/providers/AppProviders'

export default function OrderRoute({ params }: { params: { id: string } }) {
  const { showToast } = useApp()
  const orderId = Number(params.id)

  if (!Number.isInteger(orderId) || orderId <= 0) notFound()

  return <OrderDetailPage orderId={orderId} showToast={showToast} />
}
