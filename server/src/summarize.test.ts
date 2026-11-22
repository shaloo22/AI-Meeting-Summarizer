import { describe, expect, it } from 'vitest'
import { splitTranscript } from './summarize'

describe('splitTranscript', () => {
  it('keeps short text in a single chunk', () => {
    const chunks = splitTranscript('Rahul will send the report.', 6000)
    expect(chunks).toEqual(['Rahul will send the report.'])
  })

  it('splits long text into chunks that respect the limit', () => {
    const text = 'This is a sentence. '.repeat(100)
    const chunks = splitTranscript(text, 200)

    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(200)
    }
  })

  it('handles text with no punctuation without losing any word', () => {
    // Speech transcripts often come without full stops
    const words = Array.from({ length: 300 }, (_, i) => `word${i}`)
    const text = words.join(' ')
    const chunks = splitTranscript(text, 100)

    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(100)
    }
    expect(chunks.join(' ')).toBe(text)
  })

  it('splits on the Hindi danda', () => {
    const text = 'राहुल रिपोर्ट भेजेगा। प्रिया वेन्यू बुक करेगी।'
    const chunks = splitTranscript(text, 30)

    expect(chunks).toHaveLength(2)
    expect(chunks[0].endsWith('।')).toBe(true)
  })
})