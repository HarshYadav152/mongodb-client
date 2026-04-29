'use client'
import { useState, useEffect } from 'react'
import { X, Pencil, Copy, Check } from 'lucide-react'

interface Props {
  document: Record<string, unknown>
  onEdit: () => void
  onClose: () => void
}

// Minimal JSON syntax highlighter
function highlight(json: string): string {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'color: var(--info)' // number
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'color: var(--text-2)' // key
          } else {
            cls = 'color: var(--brand)' // string value
          }
        } else if (/true|false/.test(match)) {
          cls = 'color: var(--warning)'
        } else if (/null/.test(match)) {
          cls = 'color: var(--text-3)'
        }
        return `<span style="${cls}">${match}</span>`
      }
    )
}

export default function DocumentViewer({ document: doc, onEdit, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const formatted = JSON.stringify(doc, null, 2)

  function handleCopy() {
    navigator.clipboard.writeText(formatted)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl rounded-xl border overflow-hidden animate-fade-in flex flex-col"
        style={{
          background: 'var(--surface-1)',
          borderColor: 'var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          maxHeight: 'calc(100vh - 64px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 sm:py-3.5 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 className="font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>
            Document
          </h2>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy JSON'}
              aria-label={copied ? 'Copied' : 'Copy JSON'}
              className="inline-flex items-center justify-center sm:gap-1.5 rounded border text-xs transition-all hover:bg-white/5 h-8 w-8 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5"
              style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}
            >
              {copied ? <Check size={14} style={{ color: 'var(--brand)' }} /> : <Copy size={14} />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={onEdit}
              title="Edit document"
              aria-label="Edit document"
              className="inline-flex items-center justify-center sm:gap-1.5 rounded border text-xs transition-all hover:bg-white/5 h-8 w-8 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5"
              style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
            >
              <Pencil size={14} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={onClose}
              title="Close"
              aria-label="Close"
              className="inline-flex items-center justify-center rounded transition-colors hover:bg-white/5 h-8 w-8"
              style={{ color: 'var(--text-3)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* JSON viewer */}
        <div className="overflow-auto flex-1 p-5">
          <pre
            className="text-xs leading-relaxed"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              color: 'var(--text-1)',
              tabSize: 2,
            }}
            dangerouslySetInnerHTML={{ __html: highlight(formatted) }}
          />
        </div>
      </div>
    </div>
  )
}
