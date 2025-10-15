'use client'

import { useSession, signOut } from 'next-auth/react'

interface NavigationProps {
  currentPage: string
  cartCount: number
  onNavigate: (page: 'home' | 'cart' | 'checkout' | 'admin' | 'login' | 'register' | 'profile') => void
}

export default function Navigation({ currentPage, cartCount, onNavigate }: NavigationProps) {
  const { data: session, status } = useSession()
  return (
    <nav data-testid="main-navigation" className="bg-gradient-to-r from-primary-600 via-purple-600 to-primary-700 text-white shadow-2xl sticky top-0 z-50 backdrop-blur-lg">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between py-5">
          <button 
            data-testid="nav-logo-button"
            onClick={() => onNavigate('home')}
            className="group flex items-center gap-3 hover:scale-105 transition-transform duration-300"
          >
            <div className="text-4xl">📚</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Digital Bookstore</h1>
              <p className="text-xs text-white/80 font-medium">Discover your next great read</p>
            </div>
          </button>
          
          <div className="flex gap-2">
            <button
              data-testid="nav-home-button"
              onClick={() => onNavigate('home')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                currentPage === 'home' 
                  ? 'bg-white/25 backdrop-blur-md shadow-lg scale-105' 
                  : 'hover:bg-white/15 backdrop-blur-sm'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </span>
            </button>
            
            <button
              data-testid="nav-cart-button"
              onClick={() => onNavigate('cart')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 relative ${
                currentPage === 'cart' 
                  ? 'bg-white/25 backdrop-blur-md shadow-lg scale-105' 
                  : 'hover:bg-white/15 backdrop-blur-sm'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Cart
                {cartCount > 0 && (
                  <span data-testid="cart-count-badge" className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-scale-in">
                    {cartCount}
                  </span>
                )}
              </span>
            </button>
            
            
            {/* Admin Button - only show for admins */}
            {session && (session.user as any)?.role === 'ADMIN' && (
              <button
                data-testid="nav-admin-button"
                onClick={() => onNavigate('admin')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                  currentPage === 'admin' 
                    ? 'bg-white/25 backdrop-blur-md shadow-lg scale-105' 
                    : 'hover:bg-white/15 backdrop-blur-sm'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </span>
              </button>
            )}

            {/* Profile/Login/Register Buttons */}
            {status === 'loading' ? (
              <div data-testid="nav-loading" className="px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : session ? (
              <>
                <button
                  data-testid="nav-profile-button"
                  onClick={() => onNavigate('profile')}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    currentPage === 'profile' 
                      ? 'bg-white/25 backdrop-blur-md shadow-lg scale-105' 
                      : 'hover:bg-white/15 backdrop-blur-sm'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </span>
                </button>
                <button
                  data-testid="nav-logout-button"
                  onClick={() => signOut()}
                  className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:bg-white/15 backdrop-blur-sm"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </span>
                </button>
              </>
            ) : (
              <button
                data-testid="nav-login-button"
                onClick={() => onNavigate('login')}
                className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 bg-white text-primary-600 hover:bg-white/90 shadow-lg"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

