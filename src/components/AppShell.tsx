'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useApp } from '@/components/providers/AppProviders'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { cartCount } = useApp()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navigation cartCount={cartCount} />
      <main className="mx-auto w-full max-w-page flex-1 px-6 py-12">{children}</main>
      <Footer />
    </div>
  )
}
