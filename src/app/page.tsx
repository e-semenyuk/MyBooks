'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import HomePage from '@/components/pages/HomePage'
import CartPage from '@/components/pages/CartPage'
import CheckoutPage from '@/components/pages/CheckoutPage'
import AdminPage from '@/components/pages/AdminPage'
import Toast from '@/components/Toast'

type Page = 'home' | 'cart' | 'checkout' | 'admin'

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [cartCount, setCartCount] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const updateCartCount = async () => {
    try {
      const response = await fetch('/api/cart')
      const cartItems = await response.json()
      const count = cartItems.reduce((total: number, item: any) => total + item.quantity, 0)
      setCartCount(count)
    } catch (error) {
      console.error('Error updating cart count:', error)
    }
  }

  const navigateTo = (page: Page) => {
    setCurrentPage(page)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentPage={currentPage}
        cartCount={cartCount}
        onNavigate={navigateTo}
      />
      
      <main className="container mx-auto px-4 py-8">
        {currentPage === 'home' && (
          <HomePage 
            showToast={showToast}
            updateCartCount={updateCartCount}
          />
        )}
        {currentPage === 'cart' && (
          <CartPage 
            showToast={showToast}
            updateCartCount={updateCartCount}
            navigateTo={navigateTo}
          />
        )}
        {currentPage === 'checkout' && (
          <CheckoutPage 
            showToast={showToast}
            updateCartCount={updateCartCount}
            navigateTo={navigateTo}
          />
        )}
        {currentPage === 'admin' && (
          <AdminPage 
            showToast={showToast}
          />
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

