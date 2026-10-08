'use client'

import ForgotPasswordPage from '@/components/pages/ForgotPasswordPage'
import { useApp, useNavigateTo } from '@/components/providers/AppProviders'

export default function ForgotPasswordRoute() {
  const { showToast } = useApp()
  const navigateTo = useNavigateTo()
  return <ForgotPasswordPage showToast={showToast} onBackToLogin={() => navigateTo('login')} />
}
