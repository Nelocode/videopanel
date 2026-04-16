'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import VideoInput from '@/components/VideoInput'
import PromptEditor, { DEFAULT_PROMPT } from '@/components/PromptEditor'
import SettingsModal from '@/components/SettingsModal'

export default function HomePage() {
  const [videoUrl, setVideoUrl] = useState('')
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const router = useRouter()

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) {
      setError('Por favor ingresa la URL del video.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: videoUrl.trim(), system_prompt: prompt }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Ocurrió un error inesperado.')
        return
      }
      router.push(`/process/${data.job_id}`)
    } catch {
      setError('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header onSettings={() => setShowSettings(true)} />

      <main>
        {/* Hero */}
        <section className="home-hero">
          <div className="container-sm">
            <div className="home-eyebrow">
              Copper Giant · Communications Intelligence
            </div>
            <h1 className="home-title">
              Convierte entrevistas en<br />
              <span>contenido estratégico</span>
            </h1>
            <p className="home-sub">
              Pega la URL del video del CEO, define qué buscar y la IA extrae los momentos más valiosos con borradores listos para publicar.
            </p>
          </div>
        </section>

        {/* Input grid */}
        <div className="container" style={{ paddingBottom: '16px' }}>
          <div className="home-grid">
            <VideoInput url={videoUrl} onUrlChange={setVideoUrl} />
            <PromptEditor value={prompt} onChange={setPrompt} />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: '12px 16px', borderRadius: 'var(--r-md)',
                background: 'var(--red-glow)', border: '1px solid var(--red-border)',
                color: '#fca5a5', fontSize: '0.875rem', marginBottom: '16px'
              }}
            >
              ⚠ {error}
            </div>
          )}

          {/* CTA */}
          <div className="home-submit-wrap">
            <div style={{ textAlign: 'center' }}>
              <button
                className="btn btn-red btn-red-lg"
                onClick={handleAnalyze}
                disabled={loading || !videoUrl.trim()}
                style={{ minWidth: 240 }}
              >
                {loading ? (
                  <>
                    <span className="anim-spin" style={{ display: 'inline-block' }}>⚙</span>
                    Iniciando análisis...
                  </>
                ) : (
                  '⚡ Analizar Video'
                )}
              </button>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '12px' }}>
                El análisis puede tomar 2–5 minutos dependiendo de la duración del video
              </p>
            </div>
          </div>
        </div>
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
