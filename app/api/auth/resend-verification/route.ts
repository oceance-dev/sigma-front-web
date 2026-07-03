import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/src/lib/api-config'
import { z } from 'zod'

const Schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/resend-verification`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(parsed.data),
    })
  } catch {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 })
  }

  const json = await res.json()
  return NextResponse.json(json, { status: res.status })
}
