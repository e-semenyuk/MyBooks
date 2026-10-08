'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useNavigateTo } from '@/components/providers/AppProviders'
import { pageFromPath, PageName } from '@/lib/routes'
import { CartIcon, HeartIcon, LoginIcon, LogoutIcon, UserIcon } from '@/components/icons'

interface NavigationProps {
  cartCount: number
}

const linkBase =
  'relative flex h-16 items-center gap-2 px-2 text-sm font-semibold transition-colors duration-150 sm:px-4'
const linkIdle = 'text-ink-600 hover:text-ink-950'
const linkActive =
  'text-ink-950 after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:bg-cobalt-500 sm:after:inset-x-4'

export default function Navigation({ cartCount }: NavigationProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const currentPage = pageFromPath(pathname)
  const onNavigate = useNavigateTo()

  const link = (page: PageName) => `${linkBase} ${currentPage === page ? linkActive : linkIdle}`

  return (
    <nav data-testid="main-navigation" className="sticky top-0 z-50 border-b-2 border-ink-950 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between px-4 sm:px-6">
        <button
          data-testid="nav-logo-button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5"
        >
          <span aria-hidden="true" className="h-4 w-4 bg-cobalt-500" />
          <span className="font-display text-2xl font-extrabold tracking-tight text-ink-950 max-sm:sr-only">
            bookstore
          </span>
        </button>

        <div className="flex items-center">
          <button
            data-testid="nav-home-button"
            onClick={() => onNavigate('home')}
            className={link('home')}
          >
            Home
          </button>

          <button
            data-testid="nav-cart-button"
            onClick={() => onNavigate('cart')}
            aria-label="Cart"
            className={link('cart')}
          >
            <CartIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span
                data-testid="cart-count-badge"
                className="num flex h-5 min-w-[1.25rem] items-center justify-center bg-cobalt-500 px-1 font-mono text-xs font-semibold text-white"
              >
                {cartCount}
              </span>
            )}
          </button>

          {session && (session.user as any)?.role === 'ADMIN' && (
            <button
              data-testid="nav-admin-button"
              onClick={() => onNavigate('admin')}
              className={link('admin')}
            >
              Admin
            </button>
          )}

          <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-mist-300 sm:mx-2 sm:block" />

          {status === 'loading' ? (
            <div data-testid="nav-loading" className="flex h-16 items-center px-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-mist-300 border-t-ink-950" />
            </div>
          ) : session ? (
            <>
              <button
                data-testid="nav-wishlist-button"
                onClick={() => onNavigate('wishlist')}
                aria-label="Wishlist"
                className={link('wishlist')}
              >
                <HeartIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Wishlist</span>
              </button>
              <button
                data-testid="nav-profile-button"
                onClick={() => onNavigate('profile')}
                aria-label="Profile"
                className={link('profile')}
              >
                <UserIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                data-testid="nav-logout-button"
                onClick={() => signOut({ callbackUrl: '/' })}
                aria-label="Logout"
                className={`${linkBase} ${linkIdle}`}
              >
                <LogoutIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <button
              data-testid="nav-login-button"
              onClick={() => onNavigate('login')}
              aria-label="Login"
              className="btn btn-secondary btn-sm ml-1"
            >
              <LoginIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
