'use client'

import ProfilePage from '@/components/pages/ProfilePage'
import { useApp } from '@/components/providers/AppProviders'

export default function ProfileRoute() {
  const { showToast } = useApp()
  return <ProfilePage showToast={showToast} />
}
