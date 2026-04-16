'use client'

import { useState, useEffect } from 'react'
import { Settings } from '@/types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type ValidationState = 'idle' | 'validating' | 'success' | 'error'

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [geminiKey, setGeminiKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [model, setModel] = useState('gemini-1.5-flash')
  const [showGemini, setShowGemini] = useState(false)
  const [showOpenai, setShowOpenai] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [validationMsg, setValidationMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
      setValidationState('idle')
      setValidationMsg('')
    }
  }, [isOpen])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data: Settings = await res.json()
      setSettings(data)
      setModel(data.preferred_model)
    } catch {}
  }

  const handleSave = async () => {
    if (!geminiKey && !openaiKey && !model) {
      setValidationState('error')
      setValidationMsg('No hay nada que guardar. Ingresa al menos una API Key o cambia el modelo.')
      return
    }

    setSaving(true)
    setValidationState('validating')
    setValidationMsg(geminiKey ? 'Validando tu API Key con Google AI Studio...' : 'Guardando configuración...')

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gemini_api_key: geminiKey || undefined,
          openai_api_key: openaiKey || undefined,
          preferred_model: model,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // The server returned an error with a friendly message
        setValidationState('error')
        setValidationMsg(data.detail || 'Error desconocido al guardar la configuración.')
        return
      }

      // Success
      setValidationState('success')
      setValidationMsg(data.message || '✅ Configuración guardada correctamente.')
      setGeminiKey('')
      setOpenaiKey('')
      await fetchSettings()
      setTimeout(() => {
        setValidationState('idle')
        setValidationMsg('')
      }, 4000)

    } catch (err) {
      setValidationState('error')
      setValidationMsg('No se pudo conectar al servidor. Verifica que el backend esté activo.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const validationBg: Record<ValidationState, string> = {
    idle: 'transparent',
    validating: 'rgba(194, 126, 58, 0.1)',
    success: 'rgba(34, 197, 94, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
  }
  const validationBorder: Record<ValidationState, string> = {
    idle: 'transparent',
    validating: 'rgba(194, 126, 58, 0.3)',
    success: 'rgba(34, 197, 94, 0.3)',
    error: 'rgba(239, 68, 68, 0.3)',
  }
  const validationColor: Record<ValidationState, string> = {
    idle: 'var(--text-3)',
    validating: '#f2ba80',
    success: '#4ade80',
    error: '#f87171',
  }
  const validationIcon: Record<ValidationState, string> = {
    idle: '',
    validating: '⏳',
    success: '✅',
    error: '❌',
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal anim-slide">
        <div className="modal-header">
          <span className="modal-title">⚙ Configuración de API</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p className="t-secondary" style={{ fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.6 }}>
          Las API keys se almacenan de forma local en la plataforma y se validan automáticamente antes de guardar.
        </p>

        {/* Gemini */}
        <div style={{ marginBottom: '20px' }}>
          <label className="field-label">Google Gemini API Key</label>
          <div className="settings-field-wrap">
            <input
              className="input"
              type={showGemini ? 'text' : 'password'}
              placeholder={settings?.gemini_api_key_masked || 'AIzaSy...'}
              value={geminiKey}
              onChange={(e) => { setGeminiKey(e.target.value); setValidationState('idle'); }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem' }}
            />
            <button className="settings-eye" onClick={() => setShowGemini(!showGemini)}>
              {showGemini ? '🙈' : '👁'}
            </button>
          </div>
          <div className="settings-status">
            <span className={`dot ${settings?.has_gemini ? 'dot-green' : 'dot-gray'}`} />
            <span className="t-muted">
              {settings?.has_gemini ? 'Configurada' : 'No configurada'} — Obtén tu llave gratuita en{' '}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer"
                style={{ color: 'var(--copper)', textDecoration: 'underline' }}>
                AI Studio
              </a>
            </span>
          </div>
        </div>

        {/* OpenAI (optional) */}
        <div style={{ marginBottom: '20px' }}>
          <label className="field-label">
            OpenAI API Key <span className="badge badge-muted" style={{ verticalAlign: 'middle' }}>Opcional</span>
          </label>
          <div className="settings-field-wrap">
            <input
              className="input"
              type={showOpenai ? 'text' : 'password'}
              placeholder={settings?.openai_api_key_masked || 'sk-...'}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem' }}
            />
            <button className="settings-eye" onClick={() => setShowOpenai(!showOpenai)}>
              {showOpenai ? '🙈' : '👁'}
            </button>
          </div>
          <div className="settings-status">
            <span className={`dot ${settings?.has_openai ? 'dot-green' : 'dot-gray'}`} />
            <span className="t-muted">
              {settings?.has_openai ? 'Configurada' : 'No configurada'}
            </span>
          </div>
        </div>

        {/* Model selector */}
        <div style={{ marginBottom: '24px' }}>
          <label className="field-label">Modelo preferido</label>
          <select
            className="input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {(settings?.preferred_model_options || ['gemini-1.5-flash', 'gemini-1.5-pro']).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '6px' }}>
            Flash = más rápido y gratuito · Pro = más preciso para contenido complejo
          </p>
        </div>

        {/* Validation feedback banner */}
        {validationState !== 'idle' && (
          <div style={{
            background: validationBg[validationState],
            border: `1px solid ${validationBorder[validationState]}`,
            borderRadius: 'var(--r-md)',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            fontSize: '0.88rem',
            lineHeight: '1.5',
            color: validationColor[validationState],
            transition: 'all 0.3s ease',
          }}>
            <span style={{ flexShrink: 0, fontSize: '1rem' }}>{validationIcon[validationState]}</span>
            <span>{validationMsg}</span>
          </div>
        )}

        <div className="divider" />

        <div className="flex justify-between items-center">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem' }}
          >
            🔑 Obtener API key gratis →
          </a>
          <button
            className="btn btn-red"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '⏳ Validando...' : validationState === 'success' ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
