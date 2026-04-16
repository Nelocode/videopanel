'use client'

const DEFAULT_PROMPT = `Eres un analista de comunicaciones para Copper Giant, empresa minera que avanza el proyecto de cobre-molibdeno Mocoa en Colombia.

Analiza este video del CEO o liderazgo de la compañía y extrae los momentos más importantes para el equipo de comunicaciones. Enfócate en:

• Declaraciones sobre la visión estratégica de la compañía
• Actualizaciones sobre resultados de exploración o el proyecto Mocoa
• Mensajes clave para inversores (ROI, tesis de inversión, hitos)
• Frases memorables o "soundbites" usables en redes sociales
• Noticias o anuncios importantes
• El tono del vocero (confiado, cauteloso, entusiasta)

Para cada momento, sugiere cómo usarlo en: LinkedIn, X/Twitter, comunicados de prensa o presentaciones para inversores.`

const TEMPLATES = [
  { label: '📊 CEO — Estrategia', prompt: DEFAULT_PROMPT },
  {
    label: '🎙 Podcast / Entrevista', prompt: `Analiza esta entrevista o podcast y extrae:
• Las declaraciones más impactantes y citables del vocero
• Momentos donde se explican conceptos importantes de forma clara y memorable
• Anécdotas o historias que humanicen a la empresa
• Cualquier anuncio o información nueva revelada
• Frases que resonarían bien en redes sociales

Genera borradores de posts para LinkedIn y X/Twitter con los mejores fragmentos.`
  },
  {
    label: '📹 Videoconferencia', prompt: `Analiza esta videoconferencia y extrae:
• Los puntos claves y decisiones tomadas
• Mensajes importantes para stakeholders externos
• Cualquier actualización sobre operaciones o proyectos
• Fragmentos usables para comunicaciones internas o externas

Prioriza la claridad y el impacto comunicacional.`
  },
]

interface PromptEditorProps {
  value: string
  onChange: (v: string) => void
}

export default function PromptEditor({ value, onChange }: PromptEditorProps) {
  const applyTemplate = (prompt: string) => onChange(prompt)

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: '6px',
            background: 'var(--copper-glow)', border: '1px solid var(--copper-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'
          }}
        >
          🤖
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Instrucciones para la IA</span>
      </div>

      {/* Template chips */}
      <label className="field-label">Plantillas rápidas</label>
      <div className="template-chips" style={{ marginBottom: '14px' }}>
        {TEMPLATES.map((t) => (
          <button
            key={t.label}
            className="template-chip"
            onClick={() => applyTemplate(t.prompt)}
            title={t.label}
          >
            {t.label}
          </button>
        ))}
      </div>

      <label className="field-label">Instrucciones personalizadas</label>
      <textarea
        className="textarea"
        placeholder="Describe qué debe buscar la IA en el video, qué tipo de contenido generar y para qué plataformas..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, minHeight: 180, fontSize: '0.875rem', lineHeight: '1.65' }}
      />

      <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '8px', lineHeight: 1.5 }}>
        Cuanto más específicas sean las instrucciones, más relevante será el contenido generado.
      </p>
    </div>
  )
}

export { DEFAULT_PROMPT }
