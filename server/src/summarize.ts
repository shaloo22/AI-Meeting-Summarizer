// export interface ActionItem {
//   owner: string
//   task: string
// }

// export interface MeetingSummary {
//   summary: string
//   actionItems: ActionItem[]
// }

// const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
// const MODEL = 'openai/gpt-oss-120b'

// const SYSTEM_PROMPT = `You summarize meeting transcripts.
// Reply with ONLY valid JSON, no markdown, in exactly this shape:
// {"summary": string, "actionItems": [{"owner": string, "task": string}]}
// Rules:
// - summary is 3 to 5 sentences.
// - Use "Unassigned" as owner when no person is clear.
// - Never invent tasks that are not in the transcript.
// - If the transcript is too short to summarize, return an empty summary and an empty actionItems array.`

// export async function summarizeTranscript(transcript: string): Promise<MeetingSummary> {
//   const apiKey = process.env.GROQ_API_KEY
//   if (!apiKey) throw new Error('GROQ_API_KEY is missing in server/.env')

//   const res = await fetch(GROQ_URL, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${apiKey}`,
//     },
//     body: JSON.stringify({
//       model: MODEL,
//       temperature: 0.2,
//       messages: [
//         { role: 'system', content: SYSTEM_PROMPT },
//         { role: 'user', content: transcript },
//       ],
//     }),
//   })

//   if (!res.ok) throw new Error(`Groq API error: ${res.status}`)

//   const data = (await res.json()) as {
//     choices: { message: { content: string } }[]
//   }
//   return parseSummary(data.choices[0]?.message?.content ?? '')
// }

// // The model sometimes wraps JSON in code fences, so we clean it first
// function parseSummary(raw: string): MeetingSummary {
//   const cleaned = raw
//     .replace(/^```(?:json)?/i, '')
//     .replace(/```$/, '')
//     .trim()

//   const parsed = JSON.parse(cleaned) as Partial<MeetingSummary>

//   return {
//     summary: typeof parsed.summary === 'string' ? parsed.summary : '',
//     actionItems: Array.isArray(parsed.actionItems)
//       ? parsed.actionItems.filter(
//           (a) => typeof a?.owner === 'string' && typeof a?.task === 'string',
//         )
//       : [],
//   }
// }

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

export async function summarizeTranscript(
  transcript: string,
  language: Language = 'en',
): Promise<MeetingSummary> {
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
        { role: 'system', content: buildSystemPrompt(language) },
        { role: 'user', content: transcript },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`)

  const data = (await res.json()) as {
    choices: { message: { content: string } }[]
  }
  return parseSummary(data.choices[0]?.message?.content ?? '')
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