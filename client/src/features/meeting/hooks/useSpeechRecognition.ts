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
   onaudiostart: (() => void) | null
  onspeechstart: (() => void) | null
  onspeechend: (() => void) | null
  onstart: (() => void) | null
  onnomatch: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
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

    recognition.onaudiostart = () => {
  console.log('Audio capture started')
}

recognition.onspeechstart = () => {
  console.log('Speech detected')
}

recognition.onspeechend = () => {
  console.log('Speech ended')
}

recognition.onstart = () => {
  console.log('Speech recognition started')
}

recognition.onnomatch = () => {
  console.log('No speech match found')
}

    recognition.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          setLines((prev) => [
            ...prev,
            { id: crypto.randomUUID(), text: text.trim(), timestamp: Date.now() },
          ])
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