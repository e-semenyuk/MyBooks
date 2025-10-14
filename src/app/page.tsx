'use client'

import { useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { Toaster, toast } from 'sonner'
import Navigation from '@/components/Navigation'
import HomePage from '@/components/pages/HomePage'
import CartPage from '@/components/pages/CartPage'
import CheckoutPage from '@/components/pages/CheckoutPage'
import AdminPage from '@/components/pages/AdminPage'
import LoginPage from '@/components/pages/LoginPage'
import RegisterPage from '@/components/pages/RegisterPage'
import ProfilePage from '@/components/pages/ProfilePage'

type Page = 'home' | 'cart' | 'checkout' | 'admin' | 'login' | 'register' | 'profile'

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [cartCount, setCartCount] = useState(0)

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message, {
        duration: 3000,
        style: {
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
        },
      })
    } else {
      toast.error(message, {
        duration: 3000,
        style: {
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
        },
      })
    }
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
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <Toaster 
          position="top-center"
          expand={true}
          richColors
          closeButton
          toastOptions={{
            className: 'sonner-toast',
          }}
        />
        
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
          {currentPage === 'login' && (
            <LoginPage 
              showToast={showToast}
              onLoginSuccess={() => setCurrentPage('home')}
              onSwitchToRegister={() => setCurrentPage('register')}
            />
          )}
          {currentPage === 'register' && (
            <RegisterPage 
              showToast={showToast}
              onRegisterSuccess={() => setCurrentPage('login')}
              onSwitchToLogin={() => setCurrentPage('login')}
            />
          )}
          {currentPage === 'profile' && (
            <ProfilePage 
              showToast={showToast}
            />
          )}
        </main>
      </div>
    </SessionProvider>
  )
}

