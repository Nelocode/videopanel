'use client'

import { JobStatus } from '@/types'
import Link from 'next/link'

const STEPS: { key: JobStatus; label: string; icon: string }[] = [
  { key: 'downloading', label: 'Descargando audio del video', icon: '⬇' },
  { key: 'analyzing',   label: 'Analizando con Gemini AI',   icon: '🤖' },
  { key: 'done',        label: 'Análisis completado',         icon: '✓' },
]

const PROGRESS: Record<JobStatus, number> = {
  pending:     5,
  downloading: 35,
  analyzing:   70,
  done:        100,
  error:       100,
}

interface ProcessingScreenProps {
  status: JobStatus
  message: string
  videoUrl: string
}

export default function ProcessingScreen({
  status,
  message,
  videoUrl,
}: ProcessingScreenProps) {
  const isError = status === 'error'
  const progress = PROGRESS[status] ?? 5

  // Parse out API key error hints to show CTA
  const isKeyError = isError && (
    message.toLowerCase().includes('api key') ||
    message.toLowerCase().includes('llave') ||
    message.toLowerCase().includes('inválida') ||
    message.toLowerCase().includes('permisos')
  )

  return (
    <div className="processing-wrap">
      <div className="processing-card">
        {/* Icon */}
        <div
          className="processing-icon-ring"
          style={isError ? {
            background: 'rgba(239,68,68,0.12)',
            borderColor: 'rgba(239,68,68,0.35)',
            boxShadow: '0 0 32px rgba(239,68,68,0.1)',
          } : {}}
        >
          {isError ? '⚠️' : (
            status === 'done' ? '✓' : (
              <span className="anim-spin" style={{ display: 'inline-block', fontSize: '1.6rem' }}>⚙</span>
            )
          )}
        </div>

        <p className="processing-title">
          {isError ? 'Algo salió mal' : status === 'done' ? '¡Análisis listo!' : 'Procesando video...'}
        </p>

        {/* Error message box */}
        {isError ? (
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 'var(--r-md)',
            padding: '14px 18px',
            margin: '16px 0',
            fontSize: '0.9rem',
            color: '#fca5a5',
            lineHeight: 1.6,
            textAlign: 'left',
          }}>
            {message}
          </div>
        ) : (
          <p className="processing-message">{message}</p>
        )}

        {/* URL snippet */}
        {!isError && (
          <p style={{
            fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-3)',
            marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {videoUrl}
          </p>
        )}

        {/* Progress bar */}
        {!isError && (
          <div className="progress-track">
            <div
              className="progress-bar"
              style={{
                width: `${progress}%`,
                background: status === 'done' ? 'linear-gradient(90deg, #22c55e, #16a34a)' : undefined
              }}
            />
          </div>
        )}

        {/* Steps */}
        {!isError && (
          <div className="processing-steps">
            {STEPS.map((step) => {
              const stepIdx = STEPS.findIndex(s => s.key === status)
              const thisIdx = STEPS.findIndex(s => s.key === step.key)
              const state =
                status === 'done' ? 'done'
                : step.key === status ? 'active'
                : thisIdx < stepIdx ? 'done'
                : 'pending'
              return (
                <div key={step.key} className={`p-step p-step-${state}`}>
                  <span style={{ width: 20, textAlign: 'center', flexShrink: 0 }}>
                    {state === 'done' ? '✓' : state === 'active' ? (
                      <span className="anim-spin" style={{ display: 'inline-block' }}>⏳</span>
                    ) : '○'}
                  </span>
                  <span style={{ fontSize: '0.84rem' }}>
                    {step.icon} {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Error actions */}
        {isError && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            {isKeyError && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5 }}>
                👆 Parece un problema con la API Key. Puedes actualizarla en Configuración.
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href="/" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                ← Volver al inicio
              </Link>
              {isKeyError && (
                <Link href="/" className="btn btn-red" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    // Give parent a hint to open settings - use sessionStorage as signal
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('openSettings', '1')
                    }
                  }}
                >
                  ⚙ Revisar configuración
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
