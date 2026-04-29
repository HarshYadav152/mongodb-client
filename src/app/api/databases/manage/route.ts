import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/mongodb'

// DELETE → drop an entire database
export async function DELETE(req: NextRequest) {
  try {
    const { uri, database } = await req.json()

    if (!uri || !database) {
      return NextResponse.json(
        { success: false, error: 'uri and database are required' },
        { status: 400 }
      )
    }

    // Refuse to drop system databases
    if (['admin', 'local', 'config'].includes(database)) {
      return NextResponse.json(
        { success: false, error: `Cannot drop system database "${database}"` },
        { status: 403 }
      )
    }

    const client = await getClient(uri)
    await client.db(database).dropDatabase()

    return NextResponse.json({ success: true, data: { dropped: database } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to drop database'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
