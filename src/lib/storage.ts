import { SavedConnection } from '@/types'
import { encrypt, decrypt } from './encryption'

const STORAGE_KEY = 'mongocraft_connections'

export function loadConnections(): SavedConnection[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveConnections(connections: SavedConnection[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections))
}

export function addConnection(name: string, uri: string): SavedConnection {
  const connections = loadConnections()
  const conn: SavedConnection = {
    id: crypto.randomUUID(),
    name,
    encryptedUri: encrypt(uri),
    createdAt: new Date().toISOString(),
  }
  connections.push(conn)
  saveConnections(connections)
  return conn
}

export function updateConnection(id: string, name: string, uri: string): void {
  const connections = loadConnections()
  const idx = connections.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Connection not found')
  connections[idx] = { ...connections[idx], name, encryptedUri: encrypt(uri) }
  saveConnections(connections)
}

export function deleteConnection(id: string): void {
  const connections = loadConnections().filter(c => c.id !== id)
  saveConnections(connections)
}

export function getDecryptedUri(id: string): string {
  const conn = loadConnections().find(c => c.id === id)
  if (!conn) throw new Error('Connection not found')
  return decrypt(conn.encryptedUri)
}

export function touchLastUsed(id: string): void {
  const connections = loadConnections()
  const conn = connections.find(c => c.id === id)
  if (conn) {
    conn.lastUsed = new Date().toISOString()
    saveConnections(connections)
  }
}