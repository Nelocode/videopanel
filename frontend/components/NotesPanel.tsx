'use client'

import { useState } from 'react'
import { AnalysisResult } from '@/types'

interface NotesPanelProps {
  result: AnalysisResult
  videoUrl: string
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

function buildMarkdown(result: AnalysisResult, videoUrl: string): string {
  const lines: string[] = [
    `# ${result.title}`,
    `**Duración:** ${result.duration}  `,
    `**Fuente:** ${videoUrl}`,
    '',
    '## Resumen Ejecutivo',
    result.summary,
    '',
    '## Momentos Clave',
    '',
  ]
  result.highlights.forEach((h, i) => {
    lines.push(`### Momento ${i + 1} — ${h.timestamp}`)
    lines.push(`> ${h.quote}`)
    lines.push('')
    lines.push(`**¿Por qué importa?** ${h.relevance}`)
    lines.push(`**Sugerencia:** ${h.content_suggestion}`)
    lines.push(`**Plataformas:** ${(h.platforms || []).join(', ')}`)
    lines.push('')
  })
  lines.push('## Borradores de Contenido', '')
  result.content_notes.forEach((n) => {
    lines.push(`### ${n.title}`)
    lines.push(n.content)
    lines.push('')
  })
  return lines.join('\n')
}

export default function NotesPanel({ result, videoUrl }: NotesPanelProps) {
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({})
  const [copiedMd, setCopiedMd] = useState(false)

  const toggleNote = (i: number) =>
    setExpandedNotes((prev) => ({ ...prev, [i]: !prev[i] }))

  const handleExport = () => {
    const md = buildMarkdown(result, videoUrl)
    copyToClipboard(md)
    setCopiedMd(true)
    setTimeout(() => setCopiedMd(false), 2200)
  }

  return (
    <div className="notes-panel">
      {/* Header */}
      <div className="notes-header">
        <div>
          <p className="notes-title">{result.title}</p>
          <p className="notes-duration">⏱ {result.duration}</p>
        </div>
        <button
          className="btn btn-outline"
          onClick={handleExport}
          style={{ fontSize: '0.78rem', padding: '7px 14px', flexShrink: 0 }}
        >
          {copiedMd ? '✓ Copiado' : '📋 Exportar MD'}
        </button>
      </div>

      {/* Summary */}
      <div className="summary-card">
        <p className="section-label" style={{ marginBottom: '10px' }}>📄 Resumen ejecutivo</p>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.75 }}>
          {result.summary}
        </p>
      </div>

      {/* Highlights */}
      {result.highlights?.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <p className="section-label">🎯 Momentos clave ({result.highlights.length})</p>
          {result.highlights.map((h, i) => (
            <div key={i} className="highlight-card anim-fade">
              <span className="hl-timestamp">⏱ {h.timestamp}</span>
              <blockquote className="hl-quote">{h.quote}</blockquote>
              <p className="hl-relevance">{h.relevance}</p>
              {h.content_suggestion && (
                <p className="hl-suggestion">💡 {h.content_suggestion}</p>
              )}
              {h.platforms?.length > 0 && (
                <div className="hl-platforms">
                  {h.platforms.map((p) => (
                    <span key={p} className="badge badge-copper">{p}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content notes */}
      {result.content_notes?.length > 0 && (
        <div>
          <p className="section-label" style={{ marginBottom: '12px' }}>
            ✍ Borradores de contenido ({result.content_notes.length})
          </p>
          {result.content_notes.map((note, i) => (
            <div key={i} className="content-note">
              <div
                className="content-note-header"
                onClick={() => toggleNote(i)}
                role="button"
              >
                <span className="content-note-title">
                  {note.type === 'linkedin_post' ? '💼' :
                   note.type === 'twitter_post'  ? '𝕏' : '📝'} {note.title}
                </span>
                <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
                  {expandedNotes[i] ? '▲' : '▼'}
                </span>
              </div>
              {expandedNotes[i] && (
                <div className="content-note-body">
                  {note.content}
                  <button
                    className="btn btn-outline"
                    style={{ marginTop: '12px', fontSize: '0.75rem', padding: '5px 12px' }}
                    onClick={() => copyToClipboard(note.content)}
                  >
                    📋 Copiar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
