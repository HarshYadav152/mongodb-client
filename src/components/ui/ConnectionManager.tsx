'use client'
import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Edit2, Check, Zap, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { loadConnections, addConnection, deleteConnection, updateConnection, getDecryptedUri, touchLastUsed } from '@/lib/storage'
import { SavedConnection } from '@/types'

export default function ConnectionManager({ onConnect, onClose }: {
  onConnect: (uri: string) => void
  onClose: () => void
}) {
  const [connections, setConnections] = useState<SavedConnection[]>([])
  const [form, setForm] = useState({ name: '', uri: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [showUri, setShowUri] = useState(false)

  function reload() { setConnections(loadConnections()) }
  useEffect(reload, [])

  async function handleTest(uri: string, id?: string) {
    setTesting(id || 'new')
    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Connected! MongoDB ${data.data.serverInfo.version} — ${data.data.latencyMs}ms`)
        return true
      } else {
        toast.error(data.error)
        return false
      }
    } finally { setTesting(null) }
  }

  async function handleConnect(id: string) {
    const uri = getDecryptedUri(id)
    const ok = await handleTest(uri, id)
    if (ok) { touchLastUsed(id); reload(); onConnect(uri) }
  }

  async function handleSave() {
    if (!form.name || !form.uri) return toast.error('Name and URI are required')
    if (editingId) {
      updateConnection(editingId, form.name, form.uri)
      toast.success('Connection updated')
    } else {
      addConnection(form.name, form.uri)
      toast.success('Connection saved')
    }
    setForm({ name: '', uri: '' })
    setEditingId(null)
    reload()
  }

  function handleEdit(conn: SavedConnection) {
    setEditingId(conn.id)
    setForm({ name: conn.name, uri: getDecryptedUri(conn.id) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-xl border overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Connections</h2>
          <button onClick={onClose}><X size={18} style={{ color: 'var(--text-3)' }} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Add/edit form */}
          <div className="space-y-3 p-4 rounded-lg border"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
            <h3 className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
              {editingId ? 'Edit connection' : 'New connection'}
            </h3>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Connection name (e.g. Local Dev)"
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: 'var(--surface-1)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
            />
            <div className="relative">
              <input
                value={form.uri}
                onChange={e => setForm(p => ({ ...p, uri: e.target.value }))}
                type={showUri ? 'text' : 'password'}
                placeholder="mongodb://user:pass@host:27017/db"
                className="w-full px-3 py-2 pr-10 rounded-lg text-sm border outline-none font-mono"
                style={{ background: 'var(--surface-1)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
              />
              <button onClick={() => setShowUri(p => !p)}
                className="absolute right-3 top-2.5" style={{ color: 'var(--text-3)' }}>
                {showUri ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleTest(form.uri)}
                disabled={!form.uri || testing === 'new'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all"
                style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                <Zap size={14} /> {testing === 'new' ? 'Testing…' : 'Test'}
              </button>
              <button onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: 'var(--brand)', color: '#fff' }}>
                <Check size={14} /> {editingId ? 'Update' : 'Save'}
              </button>
              {editingId && (
                <button onClick={() => { setEditingId(null); setForm({ name: '', uri: '' }) }}
                  className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--text-3)' }}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Saved connections list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {connections.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-3)' }}>
                No saved connections
              </p>
            )}
            {connections.map(conn => (
              <div key={conn.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                    {conn.name}
                  </p>
                  <p className="text-xs font-mono truncate" style={{ color: 'var(--text-3)' }}>
                    {conn.lastUsed ? `Last used ${new Date(conn.lastUsed).toLocaleDateString()}` : 'Never used'}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => handleEdit(conn)} style={{ color: 'var(--text-3)' }} title="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => { deleteConnection(conn.id); reload() }}
                    style={{ color: 'var(--danger)' }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => handleConnect(conn.id)}
                    disabled={testing === conn.id}
                    className="ml-1 px-2.5 py-1 rounded text-xs font-medium transition-all"
                    style={{ background: 'var(--brand-dim)', color: '#fff' }}>
                    {testing === conn.id ? 'Connecting…' : 'Connect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}