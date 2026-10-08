'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { Toaster } from 'sonner'
import { showToast, ShowToast } from '@/lib/toast'
import { PAGE_PATHS, PageName } from '@/lib/routes'
import { useRouter } from 'next/navigation'

interface AppContextValue {
  showToast: ShowToast
  cartCount: number
  updateCartCount: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp(): AppContextValue {
  const value = useContext(AppContext)
  if (!value) throw new Error('useApp must be used inside AppProviders')
  return value
}

// Same call shape the page components always had: navigateTo('cart')
export function useNavigateTo() {
  const router = useRouter()
  return useCallback((page: PageName) => router.push(PAGE_PATHS[page]), [router])
}

function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0)
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string } | undefined)?.id

  const updateCartCount = useCallback(async () => {
    try {
      const response = await fetch('/api/cart')
      if (!response.ok) return
      const items = await response.json()
      if (!Array.isArray(items)) return
      setCartCount(items.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0))
    } catch (error) {
      console.error('Error updating cart count:', error)
    }
  }, [])

  // Show the right badge on any URL and after signing in or out
  useEffect(() => {
    updateCartCount()
  }, [updateCartCount, userId])

  const value = useMemo(() => ({ showToast, cartCount, updateCartCount }), [cartCount, updateCartCount])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <Toaster
          position="top-center"
          expand={true}
          closeButton
          toastOptions={{ className: 'sonner-toast' }}
        />
        {children}
      </CartProvider>
    </SessionProvider>
  )
}
