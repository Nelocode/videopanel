'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage, AnalysisResult } from '@/types'

const QUICK_ACTIONS = [
  'Escribe un post para LinkedIn',
  'Crea 3 tweets con los mejores fragmentos',
  '¿Cuál es el mensaje más importante?',
  'Redacta un comunicado de prensa',
  'Sugiere títulos para un artículo ',
]

interface ChatPanelProps {
  jobId: string
  result: AnalysisResult
}

export default function ChatPanel({ jobId, result }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `He analizado el video **${result.title}** (${result.duration}).\n\nIdentifiqué ${result.highlights?.length || 0} momentos clave y generé ${result.content_notes?.length || 0} borradores de contenido.\n\n¿Qué quieres hacer con este material?`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      setMessages([...newHistory, { role: 'assistant', content: data.response }])
    } catch {
      setMessages([...newHistory, {
        role: 'assistant',
        content: '⚠ Hubo un error al conectar con la IA. Intenta de nuevo.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 110) + 'px'
  }

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-panel-header">
        <p className="chat-panel-title">💬 Chat con la IA</p>
        <p className="chat-panel-sub">Pregunta, refina y genera contenido</p>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}
          >
            <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-typing">
            <span /><span /><span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        {/* Quick actions */}
        <div className="chat-quick-actions">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa}
              className="chat-qa"
              onClick={() => sendMessage(qa)}
              disabled={loading}
            >
              {qa}
            </button>
          ))}
        </div>

        <div className="chat-input-row">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder="Escribe tu pregunta... (Enter para enviar)"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            title="Enviar"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
