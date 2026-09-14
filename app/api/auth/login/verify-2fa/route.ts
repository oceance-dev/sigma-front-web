import { NextRequest, NextResponse } from 'next/server'
import { API_URL, clientIpHeaders } from '@/src/lib/api-config'
import { buildSessionResponse } from '@/src/lib/build-session-response'

export async function POST(req: NextRequest) {
  const body = await req.json()

  let res: Response
  try {
    res = await fetch(`${API_URL}/auth/login/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...clientIpHeaders(req) },
      body: JSON.stringify(body),
    })
  } catch {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 })
  }

  const json = await res.json()

  if (!res.ok) {
    return NextResponse.json(json, { status: res.status })
  }

  return buildSessionResponse(json.data)
}
