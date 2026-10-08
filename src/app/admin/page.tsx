'use client'

import AdminPage from '@/components/pages/AdminPage'
import { useApp } from '@/components/providers/AppProviders'

export default function AdminRoute() {
  const { showToast } = useApp()
  return <AdminPage showToast={showToast} />
}
