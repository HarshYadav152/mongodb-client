import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/mongodb'

export async function POST(req: NextRequest) {
  try {
    const { uri, database } = await req.json()
    if (!uri || !database) {
      return NextResponse.json({ success: false, error: 'URI and database are required' }, { status: 400 })
    }

    const client = await getClient(uri)
    const db = client.db(database)
    const collections = await db.listCollections().toArray()

    // Get approximate counts
    const withCounts = await Promise.all(
      collections.map(async (col:any) => {
        try {
          const count = await db.collection(col.name).estimatedDocumentCount()
          return { name: col.name, type: col.type, count }
        } catch {
          return { name: col.name, type: col.type, count: 0 }
        }
      })
    )

    return NextResponse.json({ success: true, data: withCounts })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list collections'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}