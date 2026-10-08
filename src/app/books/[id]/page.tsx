'use client'

import { notFound } from 'next/navigation'
import BookDetailPage from '@/components/pages/BookDetailPage'
import { useApp } from '@/components/providers/AppProviders'

export default function BookRoute({ params }: { params: { id: string } }) {
  const { showToast, updateCartCount } = useApp()
  const bookId = Number(params.id)

  if (!Number.isInteger(bookId) || bookId <= 0) notFound()

  return <BookDetailPage bookId={bookId} showToast={showToast} updateCartCount={updateCartCount} />
}
