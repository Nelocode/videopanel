'use client'

import { AnalysisResult } from '@/types'
import NotesPanel from './NotesPanel'
import ChatPanel from './ChatPanel'

interface ResultsLayoutProps {
  jobId: string
  result: AnalysisResult
  videoUrl: string
}

export default function ResultsLayout({ jobId, result, videoUrl }: ResultsLayoutProps) {
  return (
    <div className="results-wrap">
      <NotesPanel result={result} videoUrl={videoUrl} />
      <ChatPanel jobId={jobId} result={result} />
    </div>
  )
}
