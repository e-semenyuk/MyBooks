'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ResetPasswordPage from '@/components/pages/ResetPasswordPage'
import { useApp, useNavigateTo } from '@/components/providers/AppProviders'

function ResetPasswordRoute() {
  const { showToast } = useApp()
  const navigateTo = useNavigateTo()
  const router = useRouter()
  const token = useSearchParams().get('token')

  return (
    <ResetPasswordPage
      token={token}
      showToast={showToast}
      onDone={() => navigateTo('login')}
      onRequestNew={() => router.push('/forgot-password')}
    />
  )
}

export default function ResetPasswordRouteWithSuspense() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordRoute />
    </Suspense>
  )
}
