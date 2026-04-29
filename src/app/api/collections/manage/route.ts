import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/mongodb'

// POST  → create a collection
export async function POST(req: NextRequest) {
  try {
    const { uri, database, collection, options = {} } = await req.json()

    if (!uri || !database || !collection) {
      return NextResponse.json(
        { success: false, error: 'uri, database, and collection are required' },
        { status: 400 }
      )
    }

    const name = String(collection).trim()
    if (!name || name.includes('$') || name.startsWith('system.')) {
      return NextResponse.json(
        { success: false, error: 'Invalid collection name' },
        { status: 400 }
      )
    }

    const client = await getClient(uri)
    const db = client.db(database)

    // Check it doesn't already exist
    const existing = await db.listCollections({ name }).toArray()
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: `Collection "${name}" already exists` },
        { status: 409 }
      )
    }

    await db.createCollection(name, options)

    return NextResponse.json({ success: true, data: { name } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create collection'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE → drop a collection
export async function DELETE(req: NextRequest) {
  try {
    const { uri, database, collection } = await req.json()

    if (!uri || !database || !collection) {
      return NextResponse.json(
        { success: false, error: 'uri, database, and collection are required' },
        { status: 400 }
      )
    }

    const client = await getClient(uri)
    const db = client.db(database)

    const dropped = await db.collection(collection).drop()

    return NextResponse.json({ success: true, data: { dropped } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to drop collection'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
