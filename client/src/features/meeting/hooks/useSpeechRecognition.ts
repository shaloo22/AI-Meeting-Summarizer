import { useCallback, useEffect, useRef, useState } from 'react'
import type { TranscriptLine } from '../types'

// Minimal types, because TypeScript does not ship types for this browser API
interface SpeechResultLike {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechEventLike {
  resultIndex: number
  results: { length: number; [index: number]: SpeechResultLike }
}
interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechEventLike) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const normalize = (text: string) =>
  text.toLowerCase().replace(/[.,!?।'"]/g, '').replace(/\s+/g, ' ').trim()

// Android Chrome sends the same growing sentence many times and marks each one as final.
// This decides if a new "final" text is just a longer version of the last line
function isSameUtterance(previous: TranscriptLine, nextText: string, now: number): boolean {
  const gap = now - previous.timestamp
  const a = normalize(previous.text)
  const b = normalize(nextText)
  if (!a || !b) return false

  const isPrefix = a.startsWith(b) || b.startsWith(a)
  if (gap < 5000 && isPrefix) return true

  // Chrome sometimes corrects an earlier word, so the prefix check fails.
  // Updates of one sentence arrive within a fraction of a second
  const sameStart = a.split(' ').slice(0, 2).join(' ') === b.split(' ').slice(0, 2).join(' ')
  return gap < 1500 && sameStart
}

export function useSpeechRecognition(lang = 'en-IN') {
  const isSupported = getRecognitionCtor() !== null
  const [lines, setLines] = useState<TranscriptLine[]>([])
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const shouldRunRef = useRef(false)

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript.trim()

        if (result.isFinal) {
          if (!text) continue
          const now = Date.now()

          setLines((prev) => {
            const last = prev[prev.length - 1]

            if (last && isSameUtterance(last, text, now)) {
              // Replace the last line with the newest version, never add a duplicate
              const next = prev.slice(0, -1)
              next.push({ ...last, text, timestamp: now })
              return next
            }

            return [...prev, { id: crypto.randomUUID(), text, timestamp: now }]
          })
        } else {
          interimText += text
        }
      }
      setInterim(interimText)
    }

    recognition.onerror = (e) => {
      // These two happen during normal pauses, so we ignore them
      if (e.error === 'no-speech' || e.error === 'aborted') return
      setError(e.error)
      shouldRunRef.current = false
    }

    // Chrome stops recognition after a long silence, so we restart it
    recognition.onend = () => {
      if (shouldRunRef.current) {
        try {
          recognition.start()
        } catch {
          // already started, nothing to do
        }
      } else {
        setInterim('')
      }
    }

    recognitionRef.current = recognition
    shouldRunRef.current = true
    setError(null)
    recognition.start()
  }, [lang])

  const stop = useCallback(() => {
    shouldRunRef.current = false
    recognitionRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    setLines([])
    setInterim('')
  }, [])

  // Stop listening when the component unmounts
  useEffect(() => {
    return () => {
      shouldRunRef.current = false
      recognitionRef.current?.stop()
    }
  }, [])

  return { lines, interim, error, isSupported, start, stop, reset }
}