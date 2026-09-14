import { NextRequest, NextResponse } from 'next/server'
import { API_URL, clientIpHeaders } from '@/src/lib/api-config'

// Proxy générique vers le backend AdonisJS, en Route Handler (pas un rewrite
// next.config.ts) pour que API_URL soit relu à chaque requête plutôt que figé
// dans .next/routes-manifest.json au moment du build.
async function proxy(req: NextRequest, path: string[]) {
  const target = `${API_URL}/${path.join('/')}${req.nextUrl.search}`

  const headers = new Headers(clientIpHeaders(req))
  const auth = req.headers.get('Authorization')
  if (auth) headers.set('Authorization', auth)
  const contentType = req.headers.get('Content-Type')
  if (contentType) headers.set('Content-Type', contentType)

  const hasBody = !['GET', 'HEAD'].includes(req.method)

  let res: Response
  try {
    res = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // requis par Node quand `body` est un ReadableStream
      ...(hasBody ? { duplex: 'half' } : {}),
    } as RequestInit)
  } catch {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 })
  }

  const resHeaders = new Headers()
  for (const key of ['content-type', 'content-disposition', 'content-length', 'cache-control', 'set-cookie']) {
    const value = res.headers.get(key)
    if (value) resHeaders.set(key, value)
  }

  return new NextResponse(res.body, { status: res.status, headers: resHeaders })
}

type Params = { params: Promise<{ path: string[] }> }

export async function GET(req: NextRequest, { params }: Params) {
  return proxy(req, (await params).path)
}
export async function POST(req: NextRequest, { params }: Params) {
  return proxy(req, (await params).path)
}
export async function PUT(req: NextRequest, { params }: Params) {
  return proxy(req, (await params).path)
}
export async function PATCH(req: NextRequest, { params }: Params) {
  return proxy(req, (await params).path)
}
export async function DELETE(req: NextRequest, { params }: Params) {
  return proxy(req, (await params).path)
}
