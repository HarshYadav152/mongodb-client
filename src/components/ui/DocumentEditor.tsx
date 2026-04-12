'use client'
import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { toast } from 'sonner'

export default function DocumentEditor({
  document: doc, onSave, onClose,
}: { document: Record<string, unknown>; onSave: (d: Record<string, unknown>) => void; onClose: () => void }) {
  const [json, setJson] = useState(JSON.stringify(doc, null, 2))
  const [error, setError] = useState('')

  function handleSave() {
    try {
      const parsed = JSON.parse(json)
      setError('')
      onSave(parsed)
    } catch (e) {
      setError('Invalid JSON')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-xl border overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
            {doc._id ? 'Edit Document' : 'Insert Document'}
          </h2>
          <button onClick={onClose}><X size={16} style={{ color: 'var(--text-3)' }} /></button>
        </div>

        <div className="p-5">
          <textarea
            value={json}
            onChange={e => setJson(e.target.value)}
            rows={16}
            spellCheck={false}
            className="w-full px-3 py-3 rounded-lg border text-xs font-mono outline-none resize-none"
            style={{
              background: 'var(--surface-2)',
              borderColor: error ? 'var(--danger)' : 'var(--border)',
              color: 'var(--text-1)',
              lineHeight: 1.6,
            }}
          />
          {error && <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="px-3 py-1.5 rounded text-sm"
            style={{ color: 'var(--text-2)' }}>Cancel</button>
          <button onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium"
            style={{ background: 'var(--brand)', color: '#fff' }}>
            <Save size={13} /> Save
          </button>
        </div>
      </div>
    </div>
  )
}