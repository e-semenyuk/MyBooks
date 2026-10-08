'use client'

import CheckoutPage from '@/components/pages/CheckoutPage'
import { useApp, useNavigateTo } from '@/components/providers/AppProviders'

export default function CheckoutRoute() {
  const { showToast, updateCartCount } = useApp()
  const navigateTo = useNavigateTo()
  return <CheckoutPage showToast={showToast} updateCartCount={updateCartCount} navigateTo={navigateTo} />
}
