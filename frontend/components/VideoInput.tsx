'use client'

import { useState, useEffect } from 'react'

interface VideoInputProps {
  url: string
  onUrlChange: (v: string) => void
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export default function VideoInput({ url, onUrlChange }: VideoInputProps) {
  const [ytId, setYtId] = useState<string | null>(null)
  const [thumbnailError, setThumbnailError] = useState(false)

  useEffect(() => {
    const id = getYouTubeId(url)
    setYtId(id)
    setThumbnailError(false)
  }, [url])

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: '6px',
            background: 'var(--red-glow)', border: '1px solid var(--red-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'
          }}
        >
          ▶
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Fuente del Video</span>
      </div>

      <label className="field-label">URL de YouTube o video</label>
      <input
        className="input input-url"
        type="url"
        placeholder="https://www.youtube.com/watch?v=..."
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />

      {/* Thumbnail preview */}
      {ytId && !thumbnailError && (
        <div className="yt-preview">
          <img
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            alt="Vista previa del video"
            onError={() => setThumbnailError(true)}
          />
          <div className="yt-preview-badge">
            <span style={{ color: 'var(--red)' }}>▶</span> YouTube
          </div>
        </div>
      )}

      {/* Helper text */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '12px', lineHeight: 1.5 }}>
        El audio será descargado y analizado por la IA. Soporta YouTube, Vimeo y la mayoría de plataformas de video.
      </p>
    </div>
  )
}
