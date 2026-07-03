import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_REFRESH, refreshCookieOptions } from '@/src/lib/auth-cookies'
import { API_URL } from '@/src/lib/api-config'

export async function POST(req: NextRequest) {
  const body = await req.json()

  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 })
  }

  const json = await res.json()

  if (!res.ok) {
    return NextResponse.json(json, { status: res.status })
  }

  const { user, association, accessToken, refreshToken } = json.data ?? {}

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
