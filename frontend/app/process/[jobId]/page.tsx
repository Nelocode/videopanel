'use client'

import { useEffect, useState, useRef } from 'react'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import ProcessingScreen from '@/components/ProcessingScreen'
import ResultsLayout from '@/components/ResultsLayout'
import SettingsModal from '@/components/SettingsModal'
import { Job } from '@/types'

const POLL_INTERVAL = 3000 // ms

interface PageProps {
  params: Promise<{ jobId: string }>
}

export default function ProcessPage({ params }: PageProps) {
  const { jobId } = use(params)
  const [job, setJob] = useState<Job | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`)
      if (!res.ok) { router.push('/'); return }
      const data: Job = await res.json()
      setJob(data)

      if (data.status === 'done' || data.status === 'error') {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    } catch {
      // Keep polling
    }
  }

  useEffect(() => {
    fetchJob()
    intervalRef.current = setInterval(fetchJob, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId])

  return (
    <>
      <Header
        onSettings={() => setShowSettings(true)}
        showBack
        backHref="/"
        rightSlot={
          job?.status === 'done' && job.result ? (
            <span
              style={{
                fontSize: '0.78rem', color: 'var(--text-3)',
                fontFamily: 'var(--mono)', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '280px'
              }}
            >
              {job.result.title}
            </span>
          ) : undefined
        }
      />

      {!job ? (
        <ProcessingScreen status="pending" message="Conectando..." videoUrl="" />
      ) : job.status === 'done' && job.result ? (
        <ResultsLayout
          jobId={job.id}
          result={job.result}
          videoUrl={job.video_url}
        />
      ) : (
        <ProcessingScreen
          status={job.status}
          message={job.message}
          videoUrl={job.video_url}
        />
      )}

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
