'use client'

import HomePage from '@/components/pages/HomePage'
import { useApp } from '@/components/providers/AppProviders'

export default function HomeRoute() {
  const { showToast, updateCartCount } = useApp()
  return <HomePage showToast={showToast} updateCartCount={updateCartCount} />
}
