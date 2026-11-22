
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy } from 'lucide-react'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import Skeleton from '@/shared/components/Skeleton'
import { formatDateTime } from '@/shared/utils/formatDate'
import SummaryCard from '../components/SummaryCard'
import { useMeeting } from '../hooks/useMeetings'

function BackLink() {
  return (
    <Link
      to="/meetings"
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-violet-600 dark:text-slate-400 dark:hover:text-teal-400"
    >
      <ArrowLeft size={16} />
      Back to meetings
    </Link>
  )
}

export default function MeetingDetailPage() {
  const { id = '' } = useParams()
  const { data, isPending, isError, error } = useMeeting(id)
  const [copied, setCopied] = useState(false)

  if (isPending) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <BackLink />
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error.message}
        </p>
      </div>
    )
  }

  const handleCopy = async () => {
    const actions = data.actionItems
      .map((a) => `- ${a.owner}: ${a.task}`)
      .join('\n')

    const text = `${data.title}\n\n${data.summary}\n\nAction items:\n${actions}`

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked by the browser
    }
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {data.title}
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {formatDateTime(data.createdAt)}
          </p>
        </div>

        <Button variant="secondary" onClick={handleCopy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copied' : 'Copy summary'}
        </Button>
      </div>

      <SummaryCard
        data={{
          summary: data.summary,
          actionItems: data.actionItems,
        }}
      />

      <Card title="Full transcript">
        <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-700 dark:text-slate-300">
          {data.transcript}
        </p>
      </Card>
    </div>
  )
}
