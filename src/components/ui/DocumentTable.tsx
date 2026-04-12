'use client'
import { useEffect, useState, useCallback } from 'react'
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import DocumentEditor from './DocumentEditor'

interface Props {
  uri: string; database: string; collection: string
  query: { filter: string; sort: string; limit: number; skip: number }
}

export default function DocumentTable({ uri, database, collection, query }: Props) {
  const [result, setResult] = useState<{ documents: Record<string, unknown>[]; total: number; page: number; pageSize: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null)
  const [creating, setCreating] = useState(false)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const skip = (page - 1) * query.limit
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, database, collection, ...query, skip }),
      })
      const data = await res.json()
      if (data.success) setResult(data.data)
      else toast.error(data.error)
    } finally { setLoading(false) }
  }, [uri, database, collection, query, page])

  useEffect(() => { setPage(1) }, [uri, database, collection, query])
  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return
    const res = await fetch('/api/documents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri, database, collection, id }),
    })
    const data = await res.json()
    if (data.success) { toast.success('Document deleted'); fetchDocuments() }
    else toast.error(data.error)
  }

  async function handleSave(doc: Record<string, unknown>, id?: string) {
    if (id) {
      const { _id, ...update } = doc
      const res = await fetch('/api/documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, database, collection, id, update }),
      })
      const data = await res.json()
      if (data.success) { toast.success('Document updated'); setEditing(null); fetchDocuments() }
      else toast.error(data.error)
    } else {
      const res = await fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri, database, collection, document: doc }),
      })
      const data = await res.json()
      if (data.success) { toast.success('Document created'); setCreating(false); fetchDocuments() }
      else toast.error(data.error)
    }
  }

  const columns = result?.documents[0] ? Object.keys(result.documents[0]).slice(0, 6) : []

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          {result ? `${result.total.toLocaleString()} documents` : ''}
        </p>
        <div className="flex gap-2">
          <button onClick={fetchDocuments} className="p-1.5 rounded" style={{ color: 'var(--text-3)' }}>
            <RotateCcw size={14} className={loading ? 'spin-slow' : ''} />
          </button>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
            style={{ background: 'var(--brand)', color: '#fff' }}>
            <Plus size={13} /> Insert Document
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              {columns.map(col => (
                <th key={col} className="px-3 py-2 text-left text-xs font-medium truncate max-w-40"
                  style={{ color: 'var(--text-2)', borderBottom: `1px solid var(--border)` }}>
                  {col}
                </th>
              ))}
              <th className="px-3 py-2 text-right text-xs font-medium"
                style={{ color: 'var(--text-2)', borderBottom: `1px solid var(--border)` }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="text-center py-8"
                style={{ color: 'var(--text-3)' }}>Loading…</td></tr>
            ) : (result?.documents || []).map((doc, i) => {
              const id = (doc._id as { $oid?: string })?.$oid || String(doc._id)
              return (
                <tr key={id || i}
                  className="transition-colors hover:bg-white/5 border-b"
                  style={{ borderColor: 'var(--border)' }}>
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2 font-mono text-xs truncate max-w-xs"
                      style={{ color: 'var(--text-1)' }}>
                      {formatCell(doc[col])}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setEditing(doc)} style={{ color: 'var(--text-3)' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(id)} style={{ color: 'var(--danger)' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            style={{ color: page === 1 ? 'var(--text-3)' : 'var(--text-1)' }}>
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs" style={{ color: 'var(--text-2)' }}>
            Page {page} of {result.totalPages}
          </span>
          <button disabled={page === result.totalPages} onClick={() => setPage(p => p + 1)}
            style={{ color: page === result.totalPages ? 'var(--text-3)' : 'var(--text-1)' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Document Editor Modal */}
      {(editing || creating) && (
        <DocumentEditor
          document={editing || {}}
          onSave={(doc) => handleSave(doc, editing ? ((editing._id as { $oid?: string })?.$oid || String(editing._id)) : undefined)}
          onClose={() => { setEditing(null); setCreating(false) }}
        />
      )}
    </div>
  )
}

function formatCell(val: unknown): string {
  if (val === null || val === undefined) return 'null'
  if (typeof val === 'object') return JSON.stringify(val).substring(0, 60)
  return String(val).substring(0, 60)
}