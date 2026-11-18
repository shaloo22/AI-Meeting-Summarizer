import type { MeetingDetail, MeetingListItem, SaveMeetingInput } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Request failed')
  }

  // DELETE returns 204 with no body
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const listMeetings = () => request<MeetingListItem[]>('/api/meetings')

export const getMeeting = (id: string) => request<MeetingDetail>(`/api/meetings/${id}`)

export const saveMeeting = (input: SaveMeetingInput) =>
  request<MeetingDetail>('/api/meetings', {
    method: 'POST',
    body: JSON.stringify(input),
  })

export const deleteMeeting = (id: string) =>
  request<void>(`/api/meetings/${id}`, { method: 'DELETE' })