'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useNavigateTo } from '@/components/providers/AppProviders'
import { pageFromPath, PageName } from '@/lib/routes'
import { CartIcon, LoginIcon, LogoutIcon, UserIcon } from '@/components/icons'

interface NavigationProps {
  cartCount: number
}

const linkBase =
  'relative flex h-16 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors duration-150'
const linkIdle = 'border-transparent text-ink-200 hover:text-white'
const linkActive = 'border-brass-500 text-white'

export default function Navigation({ cartCount }: NavigationProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const currentPage = pageFromPath(pathname)
  const onNavigate = useNavigateTo()

  const link = (page: PageName) => `${linkBase} ${currentPage === page ? linkActive : linkIdle}`

  return (
    <nav data-testid="main-navigation" className="sticky top-0 z-50 bg-ink-950 text-white">
      <div className="mx-auto flex h-16 w-full max-w-page items-center justify-between px-6">
        <button
          data-testid="nav-logo-button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-sm bg-brass-500 font-serif text-lg font-semibold text-ink-950"
          >
            D
          </span>
          <span className="hidden font-serif text-lg font-semibold tracking-tight sm:block">
            Digital Bookstore
          </span>
        </button>

        <div className="flex items-center gap-1">
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
                className="num flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brass-500 px-1.5 text-xs font-semibold text-ink-950"
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

          <span aria-hidden="true" className="mx-2 hidden h-5 w-px bg-ink-700 sm:block" />

          {status === 'loading' ? (
            <div data-testid="nav-loading" className="flex h-16 items-center px-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink-600 border-t-white" />
            </div>
          ) : session ? (
            <>
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
              className="ml-1 flex items-center gap-2 rounded-md border border-ink-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:border-white hover:bg-white hover:text-ink-950"
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
