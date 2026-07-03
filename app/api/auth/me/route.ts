import { NextRequest } from 'next/server'
import { handleTokenRefresh } from '@/src/lib/auth-refresh'

export async function GET(req: NextRequest) {
  return handleTokenRefresh(req)
}
