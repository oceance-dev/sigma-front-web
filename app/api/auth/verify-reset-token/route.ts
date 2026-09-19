import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/src/lib/api-config'
import { z } from 'zod'

const Schema = z.object({ token: z.string().min(1) })

export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/verify-reset-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
  } catch {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 })
  }

  const json = await res.json()

  if (!res.ok) {
    return NextResponse.json(json, { status: res.status })
  }

  const response = NextResponse.json(json)

  // Le cookie sigma_reset_session posé par Adonis est signé (APP_KEY) : on ne peut
  // pas le reconstruire nous-mêmes, il faut relayer tel quel le Set-Cookie du backend
  // pour que /api/auth/reset-password puisse le renvoyer sans casser la signature.
  for (const cookie of res.headers.getSetCookie()) {
    response.headers.append('set-cookie', cookie)
  }

  return response
}
