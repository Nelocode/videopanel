// Shared TypeScript types for VideoPanel

export interface Highlight {
  timestamp: string
  quote: string
  relevance: string
  content_suggestion: string
  platforms: string[]
}

export interface ContentNote {
  type: string
  title: string
  content: string
}

export interface AnalysisResult {
  title: string
  duration: string
  summary: string
  highlights: Highlight[]
  content_notes: ContentNote[]
}

export type JobStatus = 'pending' | 'downloading' | 'analyzing' | 'done' | 'error'

export interface Job {
  id: string
  video_url: string
  system_prompt: string
  status: JobStatus
  message: string
  result?: AnalysisResult
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Settings {
  preferred_model: string
  has_gemini: boolean
  has_openai: boolean
  gemini_api_key_masked?: string
  openai_api_key_masked?: string
  preferred_model_options: string[]
}
