'use client'

import CartPage from '@/components/pages/CartPage'
import { useApp, useNavigateTo } from '@/components/providers/AppProviders'

export default function CartRoute() {
  const { showToast, updateCartCount } = useApp()
  const navigateTo = useNavigateTo()
  return <CartPage showToast={showToast} updateCartCount={updateCartCount} navigateTo={navigateTo} />
}
