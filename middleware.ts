import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userId = request.cookies.get('userId')?.value

  // Redirect authenticated users from homepage to dashboard
  if (pathname === '/' && userId) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect dashboard: require userId cookie set by login
  if (pathname.startsWith('/dashboard')) {
    if (!userId) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
}


