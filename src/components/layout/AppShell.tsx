'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'
import DocumentTable from '@/components/ui/DocumentTable'
import QueryBar from '@/components/ui/QueryBar'
import ConnectionManager from '@/components/ui/ConnectionManager'
import { useTheme } from './ThemeProvider'
import { Sun, Moon, Database } from 'lucide-react'

export default function AppShell() {
  const { theme, toggle } = useTheme()
  const [activeUri, setActiveUri] = useState<string | null>(null)
  const [activeDb, setActiveDb] = useState<string | null>(null)
  const [activeCol, setActiveCol] = useState<string | null>(null)
  const [showConnMgr, setShowConnMgr] = useState(true)
  const [query, setQuery] = useState({ filter: '{}', sort: '{}', limit: 20, skip: 0 })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-0)' }}>
      {/* Sidebar */}
      <Sidebar
        uri={activeUri}
        activeDb={activeDb}
        activeCol={activeCol}
        onSelectCollection={(db, col) => { setActiveDb(db); setActiveCol(col) }}
        onManageConnections={() => setShowConnMgr(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
          <div className="flex items-center gap-3">
            <Database size={18} style={{ color: 'var(--brand)' }} />
            <span className="font-semibold tracking-tight" style={{ color: 'var(--text-1)' }}>MongoCraft</span>
            {activeDb && activeCol && (
              <span className="text-xs px-2 py-0.5 rounded font-mono"
                style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>
                {activeDb} / {activeCol}
              </span>
            )}
          </div>
          <button onClick={toggle} className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--text-2)' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        {/* Query bar */}
        {activeUri && activeDb && activeCol && (
          <QueryBar query={query} onChange={setQuery} />
        )}

        {/* Documents */}
        <div className="flex-1 overflow-auto p-4">
          {activeUri && activeDb && activeCol ? (
            <DocumentTable uri={activeUri} database={activeDb} collection={activeCol} query={query} />
          ) : (
            <EmptyState onConnect={() => setShowConnMgr(true)} />
          )}
        </div>
      </div>

      {/* Connection manager modal */}
      {showConnMgr && (
        <ConnectionManager
          onConnect={(uri) => { setActiveUri(uri); setShowConnMgr(false) }}
          onClose={() => setShowConnMgr(false)}
        />
      )}
    </div>
  )
}

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4"
      style={{ color: 'var(--text-3)' }}>
      <Database size={48} strokeWidth={1} />
      <p className="text-lg font-light">No collection selected</p>
      <button onClick={onConnect}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={{ background: 'var(--brand)', color: '#fff' }}>
        Manage Connections
      </button>
    </div>
  )
}