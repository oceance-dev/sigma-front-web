import { NextResponse } from 'next/server'
import { COOKIE_REFRESH, refreshCookieOptions } from '@/src/lib/auth-cookies'
import type { AuthAssociation, AuthUser } from '@/src/types/auth'

interface SessionPayload {
  user: AuthUser
  association: AuthAssociation
  accessToken: string
  refreshToken: string
}

export function buildSessionResponse(data: Partial<SessionPayload> | undefined) {
  const { user, association, accessToken, refreshToken } = data ?? {}

  if (!refreshToken) {
    return NextResponse.json({ error: 'SESSION_ERROR' }, { status: 500 })
  }

  const response = NextResponse.json({
    success: true,
    data: { user, association, accessToken },
  })

  response.cookies.set(COOKIE_REFRESH, refreshToken, refreshCookieOptions)

  return response
}
