import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { summarizeTranscript } from './summarize'
import type { Language } from './summarize'
import { connectDb } from './db'
import { Meeting } from './models/Meeting'

const app = express()

// Allow only our React dev server to call this API
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/summarize', async (req, res) => {
  const transcript: unknown = req.body?.transcript
  const language: Language = req.body?.language === 'hi' ? 'hi' : 'en'

  if (typeof transcript !== 'string' || transcript.trim().length < 20) {
    res.status(400).json({ error: 'Transcript is missing or too short.' })
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