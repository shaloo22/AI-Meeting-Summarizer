import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, FileText, Loader2, Mic, Save, Sparkles, Square } from 'lucide-react'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSummarize } from '../hooks/useSummarize'
import { useSaveMeeting } from '../hooks/useMeetings'
import { SAMPLE_TRANSCRIPTS } from '../sampleMeeting'
import type { Language, RecordingStatus } from '../types'
import SummaryCard from './SummaryCard'
import TranscriptLines from './TranscriptLines'

// On phones the microphone is usually given to one consumer at a time.
// Speech recognition is the one we need, so we skip the audio file there
// const IS_MOBILE =
//   typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

// "Desktop site" mode on a phone changes the user agent text, so we also check for a touch screen
const IS_MOBILE =
  typeof window !== 'undefined' &&
  ((typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
const RECORD_AUDIO = !IS_MOBILE

const STATUS_LABEL: Record<RecordingStatus, string> = {
  idle: 'Ready',
  requesting: 'Waiting for mic...',
  recording: 'Recording',
  stopped: 'Recording finished',
  error: 'Mic unavailable',
}

const STATUS_STYLE: Record<RecordingStatus, string> = {
  idle: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
  requesting: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
  recording: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300',
  stopped: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
  error: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300',
}

const LANGUAGES: { value: Language; label: string; speechLang: string }[] = [
  { value: 'en', label: 'English', speechLang: 'en-IN' },
  { value: 'hi', label: 'हिन्दी', speechLang: 'hi-IN' },
]

function speechErrorMessage(code: string): string {
  switch (code) {
    case 'network':
      return 'Live transcript could not connect to the browser speech service. Brave and some other browsers block it. Please use Google Chrome, or try the sample meeting.'
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone or speech access was blocked. Allow it in the address bar and try again.'
    case 'audio-capture':
      return 'No microphone was found, or another app is using it. Check the microphone and try again.'
    default:
      return `Speech recognition error: ${code}`
  }
}

function Alert({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
    >
      {message}
    </p>
  )
}

function Notice({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
      {message}
    </p>
  )
}

// Shown only while a summary is loading. It is a separate component, so its timer
// starts fresh every time loading starts and disappears when loading ends
function SlowHint() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 8000)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <p className="mt-3 text-sm text-slate-500 dark:text-indigo-300">
      This is taking longer than usual. The free server may be waking up, which can take up to a minute.
    </p>
  )
}

export default function RecorderPanel() {
  const [language, setLanguage] = useState<Language>('en')

  const speechLang =
    LANGUAGES.find((l) => l.value === language)?.speechLang ?? 'en-IN'

  const recorder = useAudioRecorder()
  const speech = useSpeechRecognition(speechLang)
  const summarize = useSummarize()
  const save = useSaveMeeting()

  const [title, setTitle] = useState('')
  // When this is set, the app uses the sample transcript instead of the microphone
  const [sampleText, setSampleText] = useState<string | null>(null)
  // Status used on phones, where we do not run the audio recorder
  const [mobileStatus, setMobileStatus] = useState<RecordingStatus>('idle')

  const status: RecordingStatus = RECORD_AUDIO ? recorder.status : mobileStatus
  const isRecording = status === 'recording'

  const speechText = useMemo(
    () => speech.lines.map((line) => line.text).join(' '),
    [speech.lines],
  )
  const transcriptText = sampleText ?? speechText

  const result = summarize.result

  const canSummarize =
    (sampleText !== null || status === 'stopped') &&
    transcriptText.length > 0 &&
    summarize.status !== 'loading'

  const handleStart = () => {
    summarize.reset()
    save.reset()
    setTitle('')
    setSampleText(null)
    speech.reset()
    if (RECORD_AUDIO) {
      recorder.start()
    } else {
      setMobileStatus('recording')
    }
    speech.start()
  }

  const handleStop = () => {
    if (RECORD_AUDIO) {
      recorder.stop()
    } else {
      setMobileStatus('stopped')
    }
    speech.stop()
  }

  const handleSample = () => {
    const text = SAMPLE_TRANSCRIPTS[language]
    summarize.reset()
    save.reset()
    setTitle('')
    speech.reset()
    setSampleText(text)
    summarize.run(text, language)
  }

  return (
    <div className="space-y-6">

      {/* Recording Panel */}
      <Card
        title="Record a meeting"
        description="Press the button and start talking. The transcript appears live."
        action={
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
          >
            {isRecording && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            )}
            {STATUS_LABEL[status]}
          </span>
        }
      >
        {!speech.isSupported && (
          <div className="mb-4">
            <Notice message="Live transcript works in Google Chrome. In this browser you can still try the sample meeting below." />
          </div>
        )}

        {/* Language Selector */}
        <div
          role="group"
          aria-label="Language"
          className="flex items-center justify-center gap-1 rounded-xl border border-violet-200 bg-slate-50 p-1 dark:border-indigo-800/50 dark:bg-[#171329]"
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              type="button"
              disabled={isRecording}
              aria-pressed={language === l.value}
              onClick={() => setLanguage(l.value)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                language === l.value
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-900/20'
                  : 'text-slate-600 hover:bg-violet-100 hover:text-violet-700 dark:text-indigo-200 dark:hover:bg-indigo-950/70 dark:hover:text-violet-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Recording Button */}
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            {isRecording && (
              <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-40" />
            )}

            <button
              type="button"
              onClick={isRecording ? handleStop : handleStart}
              disabled={status === 'requesting' || !speech.isSupported}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                isRecording
                  ? 'bg-gradient-to-br from-red-500 to-rose-700 shadow-red-900/30 hover:scale-105 focus-visible:outline-red-500'
                  : 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-violet-900/30 hover:scale-105 hover:shadow-violet-500/30 focus-visible:outline-violet-500'
              }`}
            >
              {isRecording ? (
                <Square size={30} fill="currentColor" />
              ) : (
                <Mic size={36} />
              )}
            </button>
          </div>

          <p className="text-sm font-medium text-slate-500 dark:text-indigo-300">
            {isRecording ? 'Tap to stop' : 'Tap to start recording'}
          </p>

          {!isRecording && (
            <Button
              variant="secondary"
              onClick={handleSample}
              disabled={summarize.status === 'loading'}
            >
              <FileText size={16} />
              Try sample meeting
            </Button>
          )}
        </div>

        {RECORD_AUDIO && recorder.status === 'error' && (
          <Alert message="Microphone access was denied or is unavailable." />
        )}

        {speech.error && <Alert message={speechErrorMessage(speech.error)} />}
      </Card>

      {/* Live Transcript */}
      <Card
        title="Live transcript"
        action={
          <Button
            onClick={() => summarize.run(transcriptText, language)}
            disabled={!canSummarize}
          >
            {summarize.status === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}

            {summarize.status === 'loading'
              ? 'Generating...'
              : 'Generate summary'}
          </Button>
        }
      >
        <div
          aria-live="polite"
          className="max-h-64 min-h-24 space-y-2 overflow-y-auto rounded-xl border border-violet-200 bg-slate-50 p-4 dark:border-indigo-800/50 dark:bg-[#171329]"
        >
          {!sampleText && speech.lines.length === 0 && !speech.interim && (
            <p className="text-sm text-slate-500 dark:text-indigo-300/70">
              Your words will appear here as you speak.
            </p>
          )}

          {sampleText ? (
            <p className="leading-relaxed text-slate-800 dark:text-indigo-100">
              {sampleText}
            </p>
          ) : (
            <TranscriptLines lines={speech.lines} />
          )}

          {speech.interim && (
            <p className="italic text-violet-600 dark:text-violet-300">
              {speech.interim}
            </p>
          )}
        </div>

        {summarize.status === 'loading' && <SlowHint />}

        {!sampleText && recorder.audioUrl && (
          <audio controls src={recorder.audioUrl} className="mt-4 w-full" />
        )}
      </Card>

      {/* Summary Error */}
      {summarize.status === 'error' && summarize.error && (
        <Alert message={summarize.error} />
      )}

      {/* Summary and Save Meeting */}
      {summarize.status === 'success' && result && (
        <>
          <SummaryCard data={result} />

          <Card
            title="Save this meeting"
            description="Keep it in your meetings history."
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                placeholder="Meeting title (optional)"
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm text-[#2D1932] outline-none placeholder:text-slate-500 transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:border-indigo-800 dark:bg-[#171329] dark:text-[#FDF4FF] dark:placeholder:text-indigo-300/50 dark:focus:border-violet-400 dark:focus:ring-violet-900/40"
              />

              <Button
                disabled={save.isPending || save.isSuccess}
                onClick={() =>
                  save.mutate({
                    title,
                    transcript: transcriptText,
                    summary: result.summary,
                    actionItems: result.actionItems,
                  })
                }
              >
                {save.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : save.isSuccess ? (
                  <Check size={16} />
                ) : (
                  <Save size={16} />
                )}

                {save.isPending
                  ? 'Saving...'
                  : save.isSuccess
                    ? 'Saved'
                    : 'Save meeting'}
              </Button>
            </div>

            {save.isError && (
              <div className="mt-3">
                <Alert message={save.error.message} />
              </div>
            )}

            {save.isSuccess && (
              <p className="mt-3 text-sm text-indigo-700 dark:text-indigo-300">
                Saved successfully.{' '}
                <Link
                  to="/meetings"
                  className="font-semibold text-violet-600 underline decoration-violet-400 underline-offset-4 hover:text-indigo-600 dark:text-violet-300 dark:hover:text-indigo-300"
                >
                  View all meetings
                </Link>
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  )
}