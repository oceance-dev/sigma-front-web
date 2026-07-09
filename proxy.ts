import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_REFRESH } from '@/src/lib/auth-cookies'

const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/legal',
  '/sigin',
  '/api/auth',
  '/api/public',
  '/api/sigma/associations/inscription',
  '/api/sigma/associations/by-code',
  '/api/sigma/register',
]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname === '/' || PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (!req.cookies.has(COOKIE_REFRESH)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
