'use client'
import { useState, useEffect } from 'react'
import {
  X, Plus, Trash2, Edit2, Check, Zap, Eye, EyeOff,
  Wifi, WifiOff, Clock, CircleDot,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  loadConnections,
  addConnection,
  deleteConnection,
  updateConnection,
  getDecryptedUri,
  touchLastUsed,
} from '@/lib/storage'
import type { SavedConnection } from '@/types'

interface Props {
  currentUri: string | null
  onConnect: (uri: string, name: string) => void
  onClose: () => void
  canClose: boolean
}

type TestStatus = 'idle' | 'testing' | 'ok' | 'fail'

export default function ConnectionManager({ currentUri, onConnect, onClose, canClose }: Props) {
  const [connections, setConnections] = useState<SavedConnection[]>([])
  const [form, setForm] = useState({ name: '', uri: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [formTestStatus, setFormTestStatus] = useState<TestStatus>('idle')
  const [showUri, setShowUri] = useState(false)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [serverInfo, setServerInfo] = useState<{ version?: string; latencyMs?: number } | null>(null)

  function reload() {
    setConnections(loadConnections())
  }

  useEffect(() => {
    reload()
  }, [])

  async function testUri(uri: string, onResult?: (ok: boolean) => void) {
    try {
      const res = await fetch('/api/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri }),
      })
      const data = await res.json()
      if (data.success) {
        const info = data.data
        setServerInfo({ version: info.serverInfo?.version, latencyMs: info.latencyMs })
        onResult?.(true)
        return true
      } else {
        toast.error(data.error || 'Connection failed')
        onResult?.(false)
        return false
      }
    } catch {
      toast.error('Network error')
      onResult?.(false)
      return false
    }
  }

  async function handleFormTest() {
    if (!form.uri) return
    setFormTestStatus('testing')
    setServerInfo(null)
    const ok = await testUri(form.uri)
    setFormTestStatus(ok ? 'ok' : 'fail')
    if (ok) toast.success('Connection successful!')
    else toast.error('Connection failed')
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Connection name is required')
    if (!form.uri.trim()) return toast.error('MongoDB URI is required')
    if (editingId) {
      updateConnection(editingId, form.name.trim(), form.uri.trim())
      toast.success('Connection updated')
      setEditingId(null)
    } else {
      addConnection(form.name.trim(), form.uri.trim())
      toast.success('Connection saved')
    }
    setForm({ name: '', uri: '' })
    setFormTestStatus('idle')
    setServerInfo(null)
    reload()
  }

  async function handleConnect(id: string) {
    setConnectingId(id)
    setTestingId(id)
    try {
      const uri = getDecryptedUri(id)
      const ok = await testUri(uri)
      if (ok) {
        touchLastUsed(id)
        reload()
        const conn = connections.find((c) => c.id === id)
        onConnect(uri, conn?.name || 'Unknown')
        toast.success('Connected!')
      }
    } finally {
      setConnectingId(null)
      setTestingId(null)
    }
  }

  function handleEdit(conn: SavedConnection) {
    setEditingId(conn.id)
    setForm({ name: conn.name, uri: getDecryptedUri(conn.id) })
    setFormTestStatus('idle')
    setServerInfo(null)
    setShowUri(false)  // always hide URI when switching to a different connection
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm({ name: '', uri: '' })
    setFormTestStatus('idle')
    setServerInfo(null)
    setShowUri(false)
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this connection?')) return
    deleteConnection(id)
    reload()
    toast.success('Connection deleted')
  }

  const isFormDirty = form.name.trim() || form.uri.trim()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && canClose) onClose()
      }}
    >
      <div
        className="w-full max-w-xl rounded-xl border overflow-hidden animate-fade-in"
        style={{
          background: 'var(--surface-1)',
          borderColor: 'var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
              Connection Manager
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              URIs are encrypted with AES-256 before saving
            </p>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-3)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Add / Edit form */}
          <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
              {editingId ? 'Edit connection' : 'Add connection'}
            </h3>
            <div className="space-y-2.5">
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Name (e.g. Local Dev, Atlas Prod)"
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors"
                style={{
                  background: 'var(--surface-2)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-1)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              <div className="relative">
                <input
                  value={form.uri}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, uri: e.target.value }))
                    setFormTestStatus('idle')
                    setServerInfo(null)
                  }}
                  type={showUri ? 'text' : 'password'}
                  placeholder="mongodb://user:pass@host:27017 or mongodb+srv://..."
                  className="w-full px-3 py-2 pr-10 rounded-lg text-xs border outline-none font-mono transition-colors"
                  style={{
                    background: 'var(--surface-2)',
                    borderColor:
                      formTestStatus === 'ok'
                        ? 'var(--brand)'
                        : formTestStatus === 'fail'
                        ? 'var(--danger)'
                        : 'var(--border)',
                    color: 'var(--text-1)',
                  }}
                  onFocus={(e) => {
                    if (formTestStatus === 'idle') e.target.style.borderColor = 'var(--brand)'
                  }}
                  onBlur={(e) => {
                    if (formTestStatus === 'idle') e.target.style.borderColor = 'var(--border)'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFormTest()
                  }}
                />
                <button
                  onClick={() => setShowUri((p) => !p)}
                  className="absolute right-2.5 top-2"
                  style={{ color: 'var(--text-3)' }}
                >
                  {showUri ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Server info after successful test */}
              {serverInfo && formTestStatus === 'ok' && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)' }}
                >
                  <CircleDot size={12} style={{ color: 'var(--brand)' }} />
                  <span style={{ color: 'var(--brand)' }}>
                    MongoDB {serverInfo.version} — {serverInfo.latencyMs}ms
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleFormTest}
                  disabled={!form.uri || formTestStatus === 'testing'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all hover:bg-white/5 disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
                >
                  {formTestStatus === 'testing' ? (
                    <RefreshIcon />
                  ) : formTestStatus === 'ok' ? (
                    <Wifi size={13} style={{ color: 'var(--brand)' }} />
                  ) : formTestStatus === 'fail' ? (
                    <WifiOff size={13} style={{ color: 'var(--danger)' }} />
                  ) : (
                    <Zap size={13} />
                  )}
                  {formTestStatus === 'testing' ? 'Testing…' : 'Test'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isFormDirty}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'var(--brand)', color: '#fff' }}
                >
                  <Check size={13} />
                  {editingId ? 'Update' : 'Save'}
                </button>
                {editingId && (
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/5"
                    style={{ color: 'var(--text-3)' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Saved connections list */}
          <div className="p-5">
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
              Saved connections ({connections.length})
            </h3>

            {connections.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 py-8 rounded-lg border"
                style={{ borderColor: 'var(--border)', borderStyle: 'dashed' }}
              >
                <Plus size={20} strokeWidth={1} style={{ color: 'var(--text-3)' }} />
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                  No saved connections yet
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {connections.map((conn) => {
                  const isConnected = currentUri === getDecryptedUri(conn.id)
                  const isTesting = testingId === conn.id
                  const isConnecting = connectingId === conn.id

                  return (
                    <div
                      key={conn.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 rounded-lg border transition-colors"
                      style={{
                        borderColor: isConnected ? 'rgba(63,185,80,0.3)' : 'var(--border)',
                        background: isConnected ? 'rgba(63,185,80,0.05)' : 'var(--surface-2)',
                      }}
                    >
                      {/* Status dot */}
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: isConnected ? 'var(--brand)' : 'var(--surface-3)',
                          boxShadow: isConnected ? '0 0 6px var(--brand)' : 'none',
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>
                          {conn.name}
                          {isConnected && (
                            <span className="ml-2 text-xs font-normal" style={{ color: 'var(--brand)' }}>
                              active
                            </span>
                          )}
                        </p>
                        <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-3)' }}>
                          <Clock size={10} />
                          {conn.lastUsed
                            ? `Used ${new Date(conn.lastUsed).toLocaleDateString()}`
                            : `Added ${new Date(conn.createdAt).toLocaleDateString()}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEdit(conn)}
                          className="p-1.5 rounded transition-colors hover:bg-white/5"
                          style={{ color: 'var(--text-3)' }}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(conn.id)}
                          className="p-1.5 rounded transition-colors hover:bg-white/5"
                          style={{ color: 'var(--danger)', opacity: 0.7 }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                        <button
                          onClick={() => handleConnect(conn.id)}
                          disabled={isTesting || isConnecting}
                          className="flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-50"
                          style={{
                            background: isConnected ? 'var(--surface-3)' : 'var(--brand)',
                            color: isConnected ? 'var(--text-2)' : '#fff',
                          }}
                        >
                          {isConnecting ? (
                            <RefreshIcon />
                          ) : (
                            <Wifi size={12} />
                          )}
                          {isConnecting ? 'Connecting…' : isConnected ? 'Reconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function RefreshIcon() {
  return (
    <svg
      className="spin-slow"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  )
}
