// The views the app used to switch between with component state now have URLs.
export type PageName = 'home' | 'cart' | 'checkout' | 'admin' | 'login' | 'register' | 'profile' | 'wishlist'

export const PAGE_PATHS: Record<PageName, string> = {
  home: '/',
  cart: '/cart',
  checkout: '/checkout',
  admin: '/admin',
  login: '/login',
  register: '/register',
  profile: '/profile',
  wishlist: '/wishlist',
}

export function pageFromPath(pathname: string): PageName | null {
  if (pathname === '/') return 'home'
  const match = (Object.entries(PAGE_PATHS) as [PageName, string][]).find(
    ([, path]) => path !== '/' && (pathname === path || pathname.startsWith(`${path}/`))
  )
  return match ? match[0] : null
}

// Only same-site paths are accepted as a return address after login.
export function safeCallbackUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/'
  return value
}
