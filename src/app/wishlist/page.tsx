'use client'

import WishlistPage from '@/components/pages/WishlistPage'
import { useApp } from '@/components/providers/AppProviders'

export default function WishlistRoute() {
  const { showToast, updateCartCount } = useApp()
  return <WishlistPage showToast={showToast} updateCartCount={updateCartCount} />
}
