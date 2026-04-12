import { NextRequest, NextResponse } from 'next/server'
import { getClient, parseQueryFilter } from '@/lib/mongodb'
import { ObjectId, Sort } from 'mongodb'

// READ — paginated with filter/sort
export async function POST(req: NextRequest) {
  try {
    const { uri, database, collection, filter = '{}', sort = '{}', limit = 20, skip = 0, projection = '{}' } = await req.json()
    if (!uri || !database || !collection) {
      return NextResponse.json({ success: false, error: 'uri, database, collection are required' }, { status: 400 })
    }

    const client = await getClient(uri)
    const col = client.db(database).collection(collection)

    const filterObj  = parseQueryFilter(filter)
    const sortObj    = parseQueryFilter(sort)
    const projObj    = parseQueryFilter(projection)
    const limitNum   = Math.min(Math.max(1, Number(limit)), 1000)
    const skipNum    = Math.max(0, Number(skip))

    const [documents, total] = await Promise.all([
      col.find(filterObj, { projection: Object.keys(projObj).length ? projObj : undefined })
        .sort(sortObj as Sort)
        .skip(skipNum)
        .limit(limitNum)
        .toArray(),
      col.countDocuments(filterObj),
    ])

    // Serialize ObjectIds and Dates
    const serialized = JSON.parse(JSON.stringify(documents, (_, v) => {
      if (v instanceof ObjectId) return { $oid: v.toString() }
      if (v instanceof Date) return { $date: v.toISOString() }
      return v
    }))

    return NextResponse.json({
      success: true,
      data: {
        documents: serialized,
        total,
        page: Math.floor(skipNum / limitNum) + 1,
        pageSize: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Query failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// CREATE
export async function PUT(req: NextRequest) {
  try {
    const { uri, database, collection, document } = await req.json()
    if (!uri || !database || !collection || !document) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const client = await getClient(uri)
    const col = client.db(database).collection(collection)
    const result = await col.insertOne(document)

    return NextResponse.json({ success: true, data: { insertedId: result.insertedId.toString() } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Insert failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// UPDATE
export async function PATCH(req: NextRequest) {
  try {
    const { uri, database, collection, id, update } = await req.json()
    if (!uri || !database || !collection || !id || !update) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const client = await getClient(uri)
    const col = client.db(database).collection(collection)

    // If update doesn't use operators, wrap with $set
    const updateDoc = Object.keys(update).some(k => k.startsWith('$'))
      ? update
      : { $set: update }

    const result = await col.updateOne({ _id: new ObjectId(id) }, updateDoc)
    return NextResponse.json({ success: true, data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    const { uri, database, collection, id } = await req.json()
    if (!uri || !database || !collection || !id) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const client = await getClient(uri)
    const col = client.db(database).collection(collection)
    const result = await col.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true, data: { deletedCount: result.deletedCount } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}