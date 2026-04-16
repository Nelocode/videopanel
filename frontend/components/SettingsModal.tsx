'use client'

import { useState, useEffect } from 'react'
import { Settings } from '@/types'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [geminiKey, setGeminiKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [model, setModel] = useState('gemini-1.5-flash')
  const [showGemini, setShowGemini] = useState(false)
  const [showOpenai, setShowOpenai] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) fetchSettings()
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
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gemini_api_key: geminiKey || undefined,
          openai_api_key: openaiKey || undefined,
          preferred_model: model,
        }),
      })
      setSaved(true)
      setGeminiKey('')
      setOpenaiKey('')
      await fetchSettings()
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal anim-slide">
        <div className="modal-header">
          <span className="modal-title">⚙ Configuración de API</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p className="t-secondary" style={{ fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.6 }}>
          Las API keys se almacenan de forma local en la plataforma. No se envían a ningún servidor externo excepto a los proveedores de IA.
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
              onChange={(e) => setGeminiKey(e.target.value)}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.82rem' }}
            />
            <button className="settings-eye" onClick={() => setShowGemini(!showGemini)}>
              {showGemini ? '🙈' : '👁'}
            </button>
          </div>
          <div className="settings-status">
            <span className={`dot ${settings?.has_gemini ? 'dot-green' : 'dot-gray'}`} />
            <span className="t-muted">
              {settings?.has_gemini ? 'Configurada' : 'No configurada'}
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
            {saving ? '⏳ Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
