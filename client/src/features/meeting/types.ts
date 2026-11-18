export type RecordingStatus = 'idle' | 'requesting' | 'recording' | 'stopped' | 'error'
export type Language = 'en' | 'hi'
export interface TranscriptLine {
  id: string
  text: string
  timestamp: number
}

export interface ActionItem {
  owner: string
  task: string
}

export interface MeetingSummary {
  summary: string
  actionItems: ActionItem[]
}
export interface MeetingListItem {
  _id: string
  title: string
  summary: string
  createdAt: string
}

export interface MeetingDetail extends MeetingListItem {
  transcript: string
  actionItems: ActionItem[]
}

export interface SaveMeetingInput {
  title: string
  transcript: string
  summary: string
  actionItems: ActionItem[]
}


