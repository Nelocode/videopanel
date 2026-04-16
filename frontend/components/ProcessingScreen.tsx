'use client'

import { JobStatus } from '@/types'

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

  return (
    <div className="processing-wrap">
      <div className="processing-card">
        {/* Icon */}
        <div className="processing-icon-ring" style={isError ? { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' } : {}}>
          {isError ? '⚠' : (
            status === 'done' ? '✓' : (
              <span className="anim-spin" style={{ display: 'inline-block', fontSize: '1.6rem' }}>⚙</span>
            )
          )}
        </div>

        <p className="processing-title">
          {isError ? 'Ocurrió un error' : status === 'done' ? '¡Análisis listo!' : 'Procesando video...'}
        </p>
        <p className="processing-message">{message}</p>

        {/* URL snippet */}
        <p style={{
          fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-3)',
          marginTop: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {videoUrl}
        </p>

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

        {isError && (
          <a href="/" className="btn btn-red" style={{ marginTop: '24px', justifyContent: 'center' }}>
            ← Intentar nuevamente
          </a>
        )}
      </div>
    </div>
  )
}
