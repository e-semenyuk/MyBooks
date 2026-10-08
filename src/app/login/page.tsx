'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoginPage from '@/components/pages/LoginPage'
import { useApp, useNavigateTo } from '@/components/providers/AppProviders'
import { safeCallbackUrl } from '@/lib/routes'

function LoginRoute() {
  const { showToast, updateCartCount } = useApp()
  const navigateTo = useNavigateTo()
  const router = useRouter()
  const callbackUrl = safeCallbackUrl(useSearchParams().get('callbackUrl'))

  return (
    <LoginPage
      showToast={showToast}
      onLoginSuccess={async () => {
        // The guest cart was just merged; refresh the badge before leaving the page
        await updateCartCount()
        router.push(callbackUrl)
      }}
      onSwitchToRegister={() => navigateTo('register')}
    />
  )
}

export default function LoginRouteWithSuspense() {
  return (
    <Suspense fallback={null}>
      <LoginRoute />
    </Suspense>
  )
}
