'use client'

import Navigation from '@/components/Navigation'
import { useApp } from '@/components/providers/AppProviders'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { cartCount } = useApp()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation cartCount={cartCount} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
