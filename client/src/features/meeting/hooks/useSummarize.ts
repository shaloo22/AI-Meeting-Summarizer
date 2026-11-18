import { useCallback, useEffect, useRef, useState } from 'react'
import type { Language, MeetingSummary } from '../types'
import { summarizeMeeting } from '../api/summarizeApi'

export type SummarizeStatus = 'idle' | 'loading' | 'success' | 'error'

export function useSummarize() {
  const [status, setStatus] = useState<SummarizeStatus>('idle')
  const [result, setResult] = useState<MeetingSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const controllerRef = useRef<AbortController | null>(null)

  const run = useCallback(async (transcript: string, language: Language) => {
    // Cancel any request that is still in flight
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setStatus('loading')
    setError(null)

    try {
      const data = await summarizeMeeting(transcript, language, controller.signal)
      setResult(data)
      setStatus('success')
    } catch (err) {
      // An aborted request is not a real error
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    setStatus('idle')
    setResult(null)
    setError(null)
  }, [])

  // Cancel the request if the component unmounts
  useEffect(() => {
    return () => controllerRef.current?.abort()
  }, [])

  return { status, result, error, run, reset }
}