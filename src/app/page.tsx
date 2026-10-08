'use client'

import { Suspense } from 'react'
import HomePage from '@/components/pages/HomePage'
import { useApp } from '@/components/providers/AppProviders'

export default function HomeRoute() {
  const { showToast, updateCartCount } = useApp()
  return (
    <Suspense fallback={null}>
      <HomePage showToast={showToast} updateCartCount={updateCartCount} />
    </Suspense>
  )
}
