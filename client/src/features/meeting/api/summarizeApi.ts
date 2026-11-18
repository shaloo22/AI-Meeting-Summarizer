import type { Language, MeetingSummary } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export async function summarizeMeeting(
  transcript: string,
  language: Language = 'en',
  signal?: AbortSignal,
): Promise<MeetingSummary> {
  const res = await fetch(`${API_URL}/api/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, language }),
    signal,
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Request failed')
  }

  return (await res.json()) as MeetingSummary
}