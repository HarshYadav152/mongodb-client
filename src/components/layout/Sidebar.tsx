'use client'
import { useEffect, useState } from 'react'
import { Database, FolderOpen, Layers, Settings, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  uri: string | null
  activeDb: string | null
  activeCol: string | null
  onSelectCollection: (db: string, col: string) => void
  onManageConnections: () => void
}

export default function Sidebar({ uri, activeDb, activeCol, onSelectCollection, onManageConnections }: Props) {
  const [databases, setDatabases] = useState<{ name: string }[]>([])
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set())
  const [collections, setCollections] = useState<Record<string, { name: string; count?: number }[]>>({})
  const [loading, setLoading] = useState(false)

  async function fetchDatabases() {
    if (!uri) return
    setLoading(true)
    try {
      const res = await fetch('/api/databases', { method: 'POST', body: JSON.stringify({ uri }), headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      if (data.success) setDatabases(data.data)
    } catch { toast.error('Failed to load databases') }
    finally { setLoading(false) }
  }

  async function toggleDb(dbName: string) {
    const next = new Set(expandedDbs)
    if (next.has(dbName)) { next.delete(dbName) }
    else {
      next.add(dbName)
      if (!collections[dbName]) {
        const res = await fetch('/api/collections', { method: 'POST', body: JSON.stringify({ uri, database: dbName }), headers: { 'Content-Type': 'application/json' } })
        const data = await res.json()
        if (data.success) setCollections(prev => ({ ...prev, [dbName]: data.data }))
      }
    }
    setExpandedDbs(next)
  }

  useEffect(() => { fetchDatabases() }, [uri])

  return (
    <aside className="w-64 flex flex-col border-r h-full"
      style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
          Explorer
        </span>
        <div className="flex gap-1">
          <button onClick={fetchDatabases} className="p-1 rounded"
            style={{ color: 'var(--text-3)' }} title="Refresh">
            <RefreshCw size={13} className={loading ? 'spin-slow' : ''} />
          </button>
          <button onClick={onManageConnections} className="p-1 rounded"
            style={{ color: 'var(--text-3)' }} title="Connections">
            <Settings size={13} />
          </button>
        </div>
      </div>

      {/* Tree */}
      <nav className="flex-1 overflow-y-auto py-2 px-1">
        {!uri ? (
          <p className="text-xs text-center mt-8" style={{ color: 'var(--text-3)' }}>
            Connect to a MongoDB instance
          </p>
        ) : databases.map(db => (
          <div key={db.name}>
            <button
              onClick={() => toggleDb(db.name)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-left transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-2)' }}>
              {expandedDbs.has(db.name) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <Database size={13} style={{ color: 'var(--brand)' }} />
              <span className="text-sm truncate">{db.name}</span>
            </button>

            {expandedDbs.has(db.name) && (collections[db.name] || []).map(col => (
              <button
                key={col.name}
                onClick={() => onSelectCollection(db.name, col.name)}
                className="w-full flex items-center gap-1.5 pl-7 pr-2 py-1.5 rounded text-left transition-colors"
                style={{
                  color: activeDb === db.name && activeCol === col.name ? 'var(--brand)' : 'var(--text-2)',
                  background: activeDb === db.name && activeCol === col.name ? 'rgba(63,185,80,0.08)' : 'transparent',
                }}>
                <Layers size={12} />
                <span className="text-sm truncate flex-1">{col.name}</span>
                {col.count !== undefined && (
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {col.count.toLocaleString()}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}