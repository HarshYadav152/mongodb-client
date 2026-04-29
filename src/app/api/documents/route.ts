import { NextRequest, NextResponse } from 'next/server'
import { getClient, parseQueryFilter } from '@/lib/mongodb'
import { ObjectId, Sort } from 'mongodb'

// ── BSON helpers ──────────────────────────────────────────────────────────────

/** Resolve an _id that may be a plain string, number, or {$oid:"..."} shape */
function resolveId(id: unknown): unknown {
  if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
    return new ObjectId(id)
  }
  if (
    id !== null &&
    typeof id === 'object' &&
    '$oid' in (id as object) &&
    typeof (id as Record<string, unknown>).$oid === 'string'
  ) {
    return new ObjectId((id as { $oid: string }).$oid)
  }
  return id // numbers, custom string _ids, etc.
}

/** Recursively convert {$oid} / {$date} back to native BSON for writes */
function deserializeBSON(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map(deserializeBSON)
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('$oid' in obj && typeof obj.$oid === 'string') {
      return ObjectId.isValid(obj.$oid) ? new ObjectId(obj.$oid) : obj.$oid
    }
    if ('$date' in obj && typeof obj.$date === 'string') {
      return new Date(obj.$date)
    }
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      out[k] = deserializeBSON(v)
    }
    return out
  }
  return value
}

/** Recursively convert BSON types to JSON-safe shapes for reads */
function serializeBSON(value: unknown): unknown {
  if (value instanceof ObjectId) return { $oid: value.toString() }
  if (value instanceof Date) return { $date: value.toISOString() }
  if (Array.isArray(value)) return value.map(serializeBSON)
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeBSON(v)
    }
    return out
  }
  return value
}

// ── READ (paginated) ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const {
      uri, database, collection,
      filter = '{}', sort = '{}', limit = 20, skip = 0, projection = '{}',
    } = await req.json()

    if (!uri || !database || !collection) {
      return NextResponse.json(
        { success: false, error: 'uri, database, and collection are required' },
        { status: 400 }
      )
    }

    const client   = await getClient(uri)
    const col      = client.db(database).collection(collection)
    const filterObj = parseQueryFilter(filter)
    const sortObj   = parseQueryFilter(sort)
    const projObj   = parseQueryFilter(projection)
    const limitNum  = Math.min(Math.max(1, Number(limit)), 1000)
    const skipNum   = Math.max(0, Number(skip))

    const [rawDocs, total] = await Promise.all([
      col
        .find(filterObj, { projection: Object.keys(projObj).length ? projObj : undefined })
        .sort(sortObj as Sort)
        .skip(skipNum)
        .limit(limitNum)
        .toArray(),
      col.countDocuments(filterObj),
    ])

    const documents = rawDocs.map(serializeBSON)

    return NextResponse.json({
      success: true,
      data: {
        documents,
        total,
        page: Math.floor(skipNum / limitNum) + 1,
        pageSize: limitNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Query failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ── CREATE ────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const { uri, database, collection, document } = await req.json()

    if (!uri || !database || !collection || document === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }
    if (typeof document !== 'object' || Array.isArray(document) || document === null) {
      return NextResponse.json({ success: false, error: 'document must be a JSON object' }, { status: 400 })
    }

    const client = await getClient(uri)
    const col    = client.db(database).collection(collection)

    const toInsert = deserializeBSON(document) as Record<string, unknown>
    if ('_id' in toInsert) {
      toInsert._id = resolveId(toInsert._id) as never
    }

    const result = await col.insertOne(toInsert)
    return NextResponse.json({
      success: true,
      data: { insertedId: result.insertedId.toString() },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Insert failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ── UPDATE ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const { uri, database, collection, id, update } = await req.json()

    if (!uri || !database || !collection || !id || update === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }
    if (typeof update !== 'object' || Array.isArray(update) || update === null) {
      return NextResponse.json({ success: false, error: 'update must be a JSON object' }, { status: 400 })
    }

    const client = await getClient(uri)
    const col    = client.db(database).collection(collection)

    let updatePayload = deserializeBSON(update) as Record<string, unknown>

    const hasOperators = Object.keys(updatePayload).some((k) => k.startsWith('$'))

    if (hasOperators) {
      // User-supplied operators — strip _id from $set and $unset to be safe
      for (const op of ['$set', '$unset', '$setOnInsert'] as const) {
        if (op in updatePayload && typeof updatePayload[op] === 'object') {
          delete (updatePayload[op] as Record<string, unknown>)._id
        }
      }
    } else {
      // Plain replacement object — strip _id (immutable) and wrap in $set
      delete updatePayload._id
      updatePayload = { $set: updatePayload }
    }

    const resolvedId = resolveId(id)
    const result = await col.updateOne({ _id: resolvedId as ObjectId }, updatePayload)

    return NextResponse.json({
      success: true,
      data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { uri, database, collection, id } = await req.json()

    if (!uri || !database || !collection || !id) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const client     = await getClient(uri)
    const col        = client.db(database).collection(collection)
    const resolvedId = resolveId(id)
    const result     = await col.deleteOne({ _id: resolvedId as ObjectId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.deletedCount },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
