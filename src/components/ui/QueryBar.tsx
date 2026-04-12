'use client'
import { useState } from 'react'
import { Filter, ArrowUpDown, Hash, Play } from 'lucide-react'

interface QueryState { filter: string; sort: string; limit: number; skip: number }
interface Props { query: QueryState; onChange: (q: QueryState) => void }

export default function QueryBar({ query, onChange }: Props) {
  const [local, setLocal] = useState(query)
  function apply() { onChange(local) }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b flex-wrap"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
      <div className="flex items-center gap-1.5 flex-1 min-w-48">
        <Filter size={12} style={{ color: 'var(--text-3)' }} />
        <input
          value={local.filter}
          onChange={e => setLocal(p => ({ ...p, filter: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && apply()}
          placeholder='Filter: {"key": "value"}'
          className="flex-1 px-2 py-1.5 rounded text-xs font-mono border outline-none"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
        />
      </div>
      <div className="flex items-center gap-1.5 w-36">
        <ArrowUpDown size={12} style={{ color: 'var(--text-3)' }} />
        <input
          value={local.sort}
          onChange={e => setLocal(p => ({ ...p, sort: e.target.value }))}
          placeholder='Sort: {"_id": -1}'
          className="flex-1 px-2 py-1.5 rounded text-xs font-mono border outline-none"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
        />
      </div>
      <div className="flex items-center gap-1.5 w-24">
        <Hash size={12} style={{ color: 'var(--text-3)' }} />
        <input
          type="number"
          value={local.limit}
          onChange={e => setLocal(p => ({ ...p, limit: Number(e.target.value) }))}
          min={1} max={1000}
          className="flex-1 px-2 py-1.5 rounded text-xs font-mono border outline-none"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-1)' }}
        />
      </div>
      <button onClick={apply}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
        style={{ background: 'var(--brand)', color: '#fff' }}>
        <Play size={11} /> Run
      </button>
    </div>
  )
}