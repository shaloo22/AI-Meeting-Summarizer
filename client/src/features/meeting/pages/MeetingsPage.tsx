
import { Link } from 'react-router-dom'
import { ChevronRight, Mic, Trash2 } from 'lucide-react'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import EmptyState from '@/shared/components/EmptyState'
import Skeleton from '@/shared/components/Skeleton'
import { formatDateTime } from '@/shared/utils/formatDate'
import { useDeleteMeeting, useMeetingsList } from '../hooks/useMeetings'

export default function MeetingsPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useMeetingsList()
  const remove = useDeleteMeeting()

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this meeting? This cannot be undone.')) {
      remove.mutate(id)
    }
  }

  if (isPending) {
    return (
      <Card title="Meetings">
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card title="Meetings">
        <p
          role="alert"
          className="mb-4 text-sm text-red-700 dark:text-red-400"
        >
          {error.message}
        </p>
        <Button
          variant="secondary"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Retrying...' : 'Try again'}
        </Button>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card title="Meetings">
        <EmptyState
          icon={<Mic size={26} />}
          title="No meetings yet"
          description="Record your first meeting and it will show up here with its summary and action items."
          action={
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-900/20 transition-all hover:from-fuchsia-500 hover:to-violet-500"
            >
              <Mic size={16} />
              Record a meeting
            </Link>
          }
        />
      </Card>
    )
  }

  return (
    <Card
      title="Meetings"
      description={`${data.length} saved ${data.length === 1 ? 'meeting' : 'meetings'}`}
    >
      {remove.isError && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {remove.error.message}
        </p>
      )}

      <ul className="divide-y divide-fuchsia-100 dark:divide-violet-800/40">
        {data.map((meeting) => (
          <li key={meeting._id} className="flex items-center gap-2 py-3">
            <Link
              to={`/meetings/${meeting._id}`}
              className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-3 transition-colors hover:bg-fuchsia-50 dark:hover:bg-[#21172F]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#2D1932] dark:text-[#FDF4FF]">
                  {meeting.title}
                </p>

                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#78647D] dark:text-violet-200/80">
                  {meeting.summary || 'No summary'}
                </p>

                <p className="mt-2 text-xs text-[#A18BA8] dark:text-violet-300/60">
                  {formatDateTime(meeting.createdAt)}
                </p>
              </div>

              <ChevronRight
                size={18}
                className="shrink-0 text-violet-300 transition-colors group-hover:text-fuchsia-600 dark:text-violet-700 dark:group-hover:text-fuchsia-400"
              />
            </Link>

            <Button
              variant="ghost"
              aria-label={`Delete ${meeting.title}`}
              onClick={() => handleDelete(meeting._id)}
              disabled={remove.isPending && remove.variables === meeting._id}
              className="shrink-0 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Trash2 size={16} />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
