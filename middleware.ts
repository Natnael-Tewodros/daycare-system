import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Protect dashboard: require userId cookie set by login
  const { pathname } = request.nextUrl
  const userId = request.cookies.get('userId')?.value

  if (!userId) {
    const loginUrl = new URL('/login', request.url)
    // Optionally keep the original destination for post-login redirect
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}


