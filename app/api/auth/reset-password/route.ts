import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/src/lib/api-config'
import { z } from 'zod'

const Schema = z.object({
  password: z.string().min(12).max(128),
})

const RESET_SESSION_COOKIE = 'sigma_reset_session'

export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const rawToken = req.cookies.get(RESET_SESSION_COOKIE)?.value
  if (!rawToken) {
    return NextResponse.json({ error: 'TOKEN_INVALID' }, { status: 422 })
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Le backend lit le token depuis ce cookie (S14), pas depuis le body.
        Cookie: `${RESET_SESSION_COOKIE}=${rawToken}`,
      },
      body: JSON.stringify(parsed.data),
    })
  } catch {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 })
  }

  const json = await res.json()
  const response = NextResponse.json(json, { status: res.status })

  if (res.ok) {
    response.cookies.delete(RESET_SESSION_COOKIE)
  }

  return response
}
