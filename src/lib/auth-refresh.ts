import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_REFRESH, refreshCookieOptions } from './auth-cookies'
import { API_URL } from './api-config'

export async function handleTokenRefresh(req: NextRequest): Promise<NextResponse> {
  const refreshToken = req.cookies.get(COOKIE_REFRESH)?.value

  if (!refreshToken) {
    return NextResponse.json({ success: false }, { status: 401 })
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  } catch {
    return NextResponse.json({ success: false }, { status: 503 })
  }

  const json = await res.json()

  if (!res.ok) {
    const response = NextResponse.json({ success: false }, { status: 401 })
    response.cookies.delete(COOKIE_REFRESH)
    return response
  }

  const { user, association, accessToken, refreshToken: newRefreshToken } = json.data

  const response = NextResponse.json({
    success: true,
    data: { user, association, accessToken },
  })

  response.cookies.set(COOKIE_REFRESH, newRefreshToken, refreshCookieOptions)

  return response
}
