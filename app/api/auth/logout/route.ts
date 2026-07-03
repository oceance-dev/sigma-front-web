import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_REFRESH } from '@/src/lib/auth-cookies'
import { API_URL } from '@/src/lib/api-config'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(COOKIE_REFRESH)?.value
  const authHeader = req.headers.get('Authorization')

  if (refreshToken && authHeader) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ refreshToken }),
      })
    } catch {
      // Le logout local (suppression du cookie) se fait quoi qu'il arrive
    }
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete(COOKIE_REFRESH)
  return response
}
