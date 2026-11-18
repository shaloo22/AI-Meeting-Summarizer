
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Loader2, Mic, Save, Sparkles, Square } from 'lucide-react'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useSummarize } from '../hooks/useSummarize'
import { useSaveMeeting } from '../hooks/useMeetings'
import type { Language, RecordingStatus } from '../types'
import SummaryCard from './SummaryCard'
import TranscriptLines from './TranscriptLines'

const STATUS_LABEL: Record<RecordingStatus, string> = {
  idle: 'Ready',
  requesting: 'Waiting for mic...',
  recording: 'Recording',
  stopped: 'Recording finished',
  error: 'Mic unavailable',
}

const STATUS_STYLE: Record<RecordingStatus, string> = {
  idle: 'bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300',
  requesting: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/70 dark:text-fuchsia-300',
  recording: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300',
  stopped: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
  error: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300',
}

const LANGUAGES: { value: Language; label: string; speechLang: string }[] = [
  { value: 'en', label: 'English', speechLang: 'en-IN' },
  { value: 'hi', label: 'हिन्दी', speechLang: 'hi-IN' },
]

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

export default function RecorderPanel() {
  const [language, setLanguage] = useState<Language>('en')

  const speechLang =
    LANGUAGES.find((l) => l.value === language)?.speechLang ?? 'en-IN'

  const recorder = useAudioRecorder()
  const speech = useSpeechRecognition(speechLang)
  const summarize = useSummarize()
  const save = useSaveMeeting()

  const [title, setTitle] = useState('')

  const isRecording = recorder.status === 'recording'

  const transcriptText = useMemo(
    () => speech.lines.map((line) => line.text).join(' '),
    [speech.lines],
  )

  const result = summarize.result

  const canSummarize =
    recorder.status === 'stopped' &&
    transcriptText.length > 0 &&
    summarize.status !== 'loading'

  const handleStart = () => {
    summarize.reset()
    save.reset()
    setTitle('')
    speech.reset()
    recorder.start()
    speech.start()
  }

  const handleStop = () => {
    recorder.stop()
    speech.stop()
  }

  if (!speech.isSupported) {
    return (
      <Card title="Browser not supported">
        <p className="text-slate-600 dark:text-violet-200">
          Live transcript needs the Web Speech API. Please open this app in Google Chrome.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">

      {/* Recording Panel */}
      <Card
        title="Record a meeting"
        description="Press the button and start talking. The transcript appears live."
        action={
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[recorder.status]}`}
          >
            {isRecording && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            )}
            {STATUS_LABEL[recorder.status]}
          </span>
        }
      >
        {/* Language Selector */}
        <div
          role="group"
          aria-label="Language"
          className="flex items-center justify-center gap-1 rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-1 dark:border-violet-800/50 dark:bg-[#171329]"
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
                  ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-md shadow-fuchsia-900/20'
                  : 'text-slate-600 hover:bg-fuchsia-100 hover:text-fuchsia-700 dark:text-violet-200 dark:hover:bg-violet-950/70 dark:hover:text-fuchsia-300'
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
              <span className="absolute inset-0 animate-ping rounded-full bg-fuchsia-500 opacity-30" />
            )}

            <button
              type="button"
              onClick={isRecording ? handleStop : handleStart}
              disabled={recorder.status === 'requesting'}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                isRecording
                  ? 'bg-gradient-to-br from-red-500 to-rose-700 shadow-red-900/30 hover:scale-105 focus-visible:outline-red-500'
                  : 'bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-fuchsia-900/30 hover:scale-105 hover:shadow-fuchsia-500/30 focus-visible:outline-fuchsia-500'
              }`}
            >
              {isRecording ? (
                <Square size={30} fill="currentColor" />
              ) : (
                <Mic size={36} />
              )}
            </button>
          </div>

          <p className="text-sm font-medium text-slate-500 dark:text-violet-300">
            {isRecording ? 'Tap to stop' : 'Tap to start recording'}
          </p>
        </div>

        {recorder.status === 'error' && (
          <Alert message="Microphone access was denied or is unavailable." />
        )}

        {speech.error && (
          <Alert message={`Speech recognition error: ${speech.error}`} />
        )}
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
          className="max-h-64 min-h-24 space-y-2 overflow-y-auto rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4 dark:border-violet-800/50 dark:bg-[#171329]"
        >
          {speech.lines.length === 0 && !speech.interim && (
            <p className="text-sm text-slate-400 dark:text-violet-300/70">
              Your words will appear here as you speak.
            </p>
          )}

          <TranscriptLines lines={speech.lines} />

          {speech.interim && (
            <p className="italic text-fuchsia-600 dark:text-fuchsia-300">
              {speech.interim}
            </p>
          )}
        </div>

        {recorder.audioUrl && (
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
                className="flex-1 rounded-xl border border-fuchsia-200 bg-white px-3 py-2.5 text-sm text-[#2D1932] outline-none placeholder:text-slate-400 transition-all focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 dark:border-violet-800 dark:bg-[#171329] dark:text-[#FDF4FF] dark:placeholder:text-violet-300/50 dark:focus:border-fuchsia-400 dark:focus:ring-fuchsia-900/40"
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
              <p className="mt-3 text-sm text-violet-700 dark:text-violet-300">
                Saved successfully.{' '}
                <Link
                  to="/meetings"
                  className="font-semibold text-fuchsia-600 underline decoration-fuchsia-400 underline-offset-4 hover:text-violet-600 dark:text-fuchsia-300 dark:hover:text-violet-300"
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
