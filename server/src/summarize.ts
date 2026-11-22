export interface ActionItem {
  owner: string
  task: string
}

export interface MeetingSummary {
  summary: string
  actionItems: ActionItem[]
}

export type Language = 'en' | 'hi'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-120b'

// Max characters per chunk. Hindi (Devanagari) uses more tokens per character than English
const CHUNK_CHARS: Record<Language, number> = { en: 6000, hi: 3000 }
export const MAX_TRANSCRIPT_CHARS = 60000

const MAX_RETRIES = 3
const DEFAULT_WAIT_MS = 10_000
const MAX_WAIT_MS = 30_000

const LANGUAGE_NAME: Record<Language, string> = {
  en: 'English',
  hi: 'Hindi (Devanagari script)',
}

const UNASSIGNED: Record<Language, string> = {
  en: 'Unassigned',
  hi: 'अनिर्धारित',
}

function buildSystemPrompt(language: Language): string {
  return `You summarize meeting transcripts.
Reply with ONLY valid JSON, no markdown, in exactly this shape:
{"summary": string, "actionItems": [{"owner": string, "task": string}]}
Rules:
- Write the summary and every task in ${LANGUAGE_NAME[language]}, even if the transcript uses another language or a mix of languages.
- Keep the JSON keys in English.
- Keep people's names as they were spoken.
- summary is 3 to 5 sentences.
- Use "${UNASSIGNED[language]}" as owner when no person is clear.
- Never invent tasks that are not in the transcript.
- If the transcript is too short to summarize, return an empty summary and an empty actionItems array.`
}

function buildMergePrompt(language: Language): string {
  return `You combine partial summaries of consecutive parts of one meeting.
Reply with ONLY valid JSON, no markdown, in exactly this shape:
{"summary": string, "actionItems": [{"owner": string, "task": string}]}
Rules:
- Write in ${LANGUAGE_NAME[language]}. Keep the JSON keys in English.
- Merge everything into one summary of 3 to 5 sentences that covers the whole meeting.
- Combine all action items and remove duplicates. Keep each owner and task.
- Never invent anything that is not in the partial summaries.`
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Calls Groq once. On a rate limit error (429) it waits and tries again
async function callGroq(system: string, user: string, attempt = 0): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY is missing in server/.env')

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })

  if (res.status === 429 && attempt < MAX_RETRIES) {
    const retryAfter = Number(res.headers.get('retry-after'))
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : DEFAULT_WAIT_MS
    console.log(`Rate limited, retrying in ${Math.round(waitMs / 1000)}s (attempt ${attempt + 1})`)
    await sleep(Math.min(waitMs, MAX_WAIT_MS))
    return callGroq(system, user, attempt + 1)
  }

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`)

  const data = (await res.json()) as {
    choices: { message: { content: string } }[]
  }
  return data.choices[0]?.message?.content ?? ''
}

// Cuts a long piece of text at word boundaries, never in the middle of a word
function sliceText(text: string, size: number): string[] {
  const out: string[] = []
  let rest = text
  while (rest.length > size) {
    let cut = rest.lastIndexOf(' ', size)
    if (cut <= 0) cut = size
    out.push(rest.slice(0, cut))
    rest = rest.slice(cut).trimStart()
  }
  if (rest) out.push(rest)
  return out
}

// Splits at sentence ends (. ! ? and the Hindi danda). Speech transcripts often have
// no punctuation at all, so very long "sentences" fall back to word boundaries
export function splitTranscript(text: string, maxChars: number): string[] {
  const sentences = text.trim().split(/(?<=[.!?।])\s+/)
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    const pieces = sentence.length > maxChars ? sliceText(sentence, maxChars) : [sentence]

    for (const piece of pieces) {
      if (current && current.length + piece.length + 1 > maxChars) {
        chunks.push(current)
        current = piece
      } else {
        current = current ? `${current} ${piece}` : piece
      }
    }
  }

  if (current) chunks.push(current)
  return chunks
}

export async function summarizeTranscript(
  transcript: string,
  language: Language = 'en',
): Promise<MeetingSummary> {
  const chunks = splitTranscript(transcript, CHUNK_CHARS[language])
  console.log(`Summarizing ${transcript.length} characters in ${chunks.length} chunk(s)`)

  // Map step: one chunk at a time, to stay inside the tokens-per-minute limit
  const partials: MeetingSummary[] = []
  for (const chunk of chunks) {
    const raw = await callGroq(buildSystemPrompt(language), chunk)
    partials.push(parseSummary(raw))
  }

  if (partials.length === 1) return partials[0]

  // Reduce step: merge the partial summaries into one
  const merged = await callGroq(buildMergePrompt(language), JSON.stringify(partials))
  return parseSummary(merged)
}

// The model sometimes wraps JSON in code fences, so we clean it first
function parseSummary(raw: string): MeetingSummary {
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim()

  const parsed = JSON.parse(cleaned) as Partial<MeetingSummary>

  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    actionItems: Array.isArray(parsed.actionItems)
      ? parsed.actionItems.filter(
          (a) => typeof a?.owner === 'string' && typeof a?.task === 'string',
        )
      : [],
  }
}