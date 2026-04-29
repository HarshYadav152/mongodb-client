import { NextRequest, NextResponse } from 'next/server'
import { testConnection } from '@/lib/mongodb'

export async function POST(req: NextRequest) {
  try {
    const { uri } = await req.json()
    if (!uri) return NextResponse.json({ success: false, error: 'URI is required' }, { status: 400 })

    const result = await testConnection(uri)
    return NextResponse.json({ success: true, data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
