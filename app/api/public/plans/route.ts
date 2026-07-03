import { NextResponse } from 'next/server'
import { API_URL } from '@/src/lib/api-config'

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/plans`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return NextResponse.json({ data: [] }, { status: 200 })
    const json = await res.json()
    return NextResponse.json(json, { status: 200 })
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 })
  }
}
