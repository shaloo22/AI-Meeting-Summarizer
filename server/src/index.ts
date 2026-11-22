import 'dotenv/config'
import express from 'express'
import type { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'
import { summarizeTranscript, MAX_TRANSCRIPT_CHARS } from './summarize'
import type { Language } from './summarize'
import { connectDb } from './db'
import { Meeting } from './models/Meeting'

const app = express()

// Behind a hosting proxy (Render, Railway), without this every user looks like one IP
app.set('trust proxy', 1)

app.use(helmet())

// Comma separated list, so we can allow more than one frontend URL later
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '1mb' }))

// General limit for the whole API
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in a few minutes.' },
  }),
)

// Stricter limit for the AI route, because every call uses our free Groq quota
const summarizeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.SUMMARY_LIMIT) || 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Summary limit reached. Please try again in 15 minutes.' },
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/summarize', summarizeLimiter, async (req, res) => {
  const transcript: unknown = req.body?.transcript
  const language: Language = req.body?.language === 'hi' ? 'hi' : 'en'

  if (typeof transcript !== 'string' || transcript.trim().length < 20) {
    res.status(400).json({ error: 'Transcript is missing or too short.' })
    return
  }

  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    res.status(413).json({
      error: 'Transcript is too long to summarize (limit is about 60,000 characters).',
    })
    return
  }

  try {
    const result = await summarizeTranscript(transcript, language)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(502).json({ error: 'Could not generate summary. Please try again.' })
  }
})

// Save a meeting
app.post('/api/meetings', async (req, res) => {
  const { title, transcript, summary, actionItems } = req.body ?? {}

  if (typeof transcript !== 'string' || transcript.trim().length < 20) {
    res.status(400).json({ error: 'Transcript is missing or too short.' })
    return
  }

  try {
    const meeting = await Meeting.create({
      title:
        typeof title === 'string' && title.trim()
          ? title.trim()
          : `Meeting ${new Date().toDateString()}`,
      transcript,
      summary: typeof summary === 'string' ? summary : '',
      actionItems: Array.isArray(actionItems) ? actionItems : [],
    })
    res.status(201).json(meeting)
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: 'Invalid meeting data.' })
      return
    }
    console.error(err)
    res.status(500).json({ error: 'Could not save meeting.' })
  }
})

// List meetings, newest first (transcript left out to keep the response small)
app.get('/api/meetings', async (_req, res) => {
  try {
    const meetings = await Meeting.find()
      .sort({ createdAt: -1 })
      .select('title summary createdAt')
      .lean()
    res.json(meetings)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load meetings.' })
  }
})

// Get one meeting with full details
app.get('/api/meetings/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: 'Invalid meeting id.' })
    return
  }

  try {
    const meeting = await Meeting.findById(req.params.id).lean()
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found.' })
      return
    }
    res.json(meeting)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load meeting.' })
  }
})

// Delete a meeting
app.delete('/api/meetings/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ error: 'Invalid meeting id.' })
    return
  }

  try {
    const deleted = await Meeting.findByIdAndDelete(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Meeting not found.' })
      return
    }
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not delete meeting.' })
  }
})

// Catches errors from middleware, for example a request with broken JSON
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if ((err as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Request body is not valid JSON.' })
    return
  }
  if ((err as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ error: 'Request is too large.' })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Something went wrong.' })
})

const port = Number(process.env.PORT) || 5000

async function main() {
  // Start accepting requests only after the database is ready
  await connectDb()
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})