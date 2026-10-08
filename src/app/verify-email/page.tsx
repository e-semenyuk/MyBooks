'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import VerifyEmailPage from '@/components/pages/VerifyEmailPage'
import { useNavigateTo } from '@/components/providers/AppProviders'

function VerifyEmailRoute() {
  const navigateTo = useNavigateTo()
  const token = useSearchParams().get('token')
  return <VerifyEmailPage token={token} onContinue={() => navigateTo('home')} />
}

export default function VerifyEmailRouteWithSuspense() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailRoute />
    </Suspense>
  )
}
