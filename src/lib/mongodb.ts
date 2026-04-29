import { MongoClient, MongoClientOptions } from 'mongodb'

// Per-URI client pool (server-side only)
const clients = new Map<string, MongoClient>()

const POOL_OPTIONS: MongoClientOptions = {
  serverSelectionTimeoutMS: 5_000,
  connectTimeoutMS:         10_000,
  socketTimeoutMS:          30_000,
  maxPoolSize:              10,
  minPoolSize:              0,
  maxIdleTimeMS:            60_000,
}

/** Basic sanity check before handing a URI to the driver */
function validateUri(uri: string): void {
  const trimmed = uri.trim()
  if (!trimmed) throw new Error('MongoDB URI cannot be empty')
  if (!trimmed.startsWith('mongodb://') && !trimmed.startsWith('mongodb+srv://')) {
    throw new Error('URI must start with mongodb:// or mongodb+srv://')
  }
}

/**
 * Get (or create) a cached MongoClient for the given URI.
 * Pings the server on cache hit to detect stale connections.
 */
export async function getClient(uri: string): Promise<MongoClient> {
  validateUri(uri)

  const existing = clients.get(uri)
  if (existing) {
    try {
      await existing.db('admin').command({ ping: 1 })
      return existing
    } catch {
      // Stale connection — close silently and reconnect
      clients.delete(uri)
      try { await existing.close() } catch { /* ignore */ }
    }
  }

  const client = new MongoClient(uri, POOL_OPTIONS)
  try {
    await client.connect()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to connect: ${message}`)
  }

  clients.set(uri, client)
  return client
}

/**
 * Open a fresh, short-lived connection to test a URI.
 * Never cached — always closes after the ping.
 */
export async function testConnection(uri: string): Promise<{
  ok: boolean
  latencyMs: number
  serverInfo: Record<string, unknown>
}> {
  validateUri(uri)

  const t0     = Date.now()
  const client = new MongoClient(uri, {
    ...POOL_OPTIONS,
    maxPoolSize:              1,
    serverSelectionTimeoutMS: 5_000,
  })

  try {
    await client.connect()
    const info = await client.db('admin').command({ buildInfo: 1 })
    return {
      ok:         true,
      latencyMs:  Date.now() - t0,
      serverInfo: {
        version:        info.version        ?? 'unknown',
        gitVersion:     info.gitVersion     ?? 'unknown',
        storageEngines: info.storageEngines ?? [],
      },
    }
  } finally {
    try { await client.close() } catch { /* ignore */ }
  }
}

/** Explicitly close and evict a cached client */
export async function closeClient(uri: string): Promise<void> {
  const client = clients.get(uri)
  if (client) {
    clients.delete(uri)
    try { await client.close() } catch { /* ignore */ }
  }
}

/**
 * Parse a filter/sort/projection string into a plain object.
 * Empty string or "{}" returns {} without throwing.
 */
export function parseQueryFilter(filterStr: string): Record<string, unknown> {
  const trimmed = (filterStr ?? '').trim()
  if (!trimmed || trimmed === '{}') return {}
  try {
    const parsed = JSON.parse(trimmed)
    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      throw new Error('Filter must be a JSON object')
    }
    return parsed as Record<string, unknown>
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JSON'
    throw new Error(`Invalid filter: ${message}`)
  }
}
