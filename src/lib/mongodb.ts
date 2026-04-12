import { MongoClient, MongoClientOptions } from 'mongodb'

const clients = new Map<string, MongoClient>()

const OPTIONS: MongoClientOptions = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
}

export async function getClient(uri: string): Promise<MongoClient> {
  const existing = clients.get(uri)
  if (existing) {
    // Ping to verify connection is still alive
    try {
      await existing.db('admin').command({ ping: 1 })
      return existing
    } catch {
      clients.delete(uri)
    }
  }
  const client = new MongoClient(uri, OPTIONS)
  await client.connect()
  clients.set(uri, client)
  return client
}

export async function testConnection(uri: string): Promise<{ ok: boolean; latencyMs: number; serverInfo: Record<string, unknown> }> {
  const t0 = Date.now()
  const client = new MongoClient(uri, { ...OPTIONS, maxPoolSize: 1 })
  try {
    await client.connect()
    const info = await client.db('admin').command({ buildInfo: 1 })
    return {
      ok: true,
      latencyMs: Date.now() - t0,
      serverInfo: {
        version: info.version,
        gitVersion: info.gitVersion,
        storageEngines: info.storageEngines,
      },
    }
  } finally {
    await client.close()
  }
}

export async function closeClient(uri: string): Promise<void> {
  const client = clients.get(uri)
  if (client) {
    await client.close()
    clients.delete(uri)
  }
}

export function parseQueryFilter(filterStr: string): Record<string, unknown> {
  if (!filterStr || filterStr.trim() === '' || filterStr.trim() === '{}') return {}
  try {
    return JSON.parse(filterStr)
  } catch {
    throw new Error(`Invalid JSON filter: ${filterStr}`)
  }
}