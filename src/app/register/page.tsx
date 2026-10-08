'use client'

import RegisterPage from '@/components/pages/RegisterPage'
import { useApp, useNavigateTo } from '@/components/providers/AppProviders'

export default function RegisterRoute() {
  const { showToast } = useApp()
  const navigateTo = useNavigateTo()
  return (
    <RegisterPage
      showToast={showToast}
      onRegisterSuccess={() => navigateTo('login')}
      onSwitchToLogin={() => navigateTo('login')}
    />
  )
}
