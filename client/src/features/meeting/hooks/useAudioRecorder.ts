import { useCallback, useEffect, useRef, useState } from 'react'
import type { RecordingStatus } from '../types'

export function useAudioRecorder() {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = useCallback(async () => {
    try {
      setStatus('requesting')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })

        setAudioUrl(URL.createObjectURL(blob))
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        setStatus('stopped')
      }

      recorder.start(250)
      recorderRef.current = recorder
      setStatus('recording')
    } catch {
      setStatus('error')
    }
  }, [])

  const stop = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  // Stop the mic when the component unmounts
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return { status, audioUrl, start, stop }
}