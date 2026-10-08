import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Private pages: guests go to the login page and come back afterwards;
// signed-in users who are not admins are sent home from /admin.
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname, search } = request.nextUrl

  if (!token) {
    const login = new URL('/login', request.url)
    login.searchParams.set('callbackUrl', pathname + search)
    return NextResponse.redirect(login)
  }

  if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/checkout/:path*', '/profile/:path*', '/orders/:path*', '/admin/:path*'],
}
