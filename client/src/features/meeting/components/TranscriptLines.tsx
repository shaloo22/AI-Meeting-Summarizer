
import { memo } from 'react'
import type { TranscriptLine } from '../types'

interface TranscriptLinesProps {
  lines: TranscriptLine[]
}

function TranscriptLines({ lines }: TranscriptLinesProps) {
  return (
    <>
      {lines.map((line) => (
        <p
          key={line.id}
          className="leading-relaxed text-[#2D1932] dark:text-[#FDF4FF]"
        >
          {line.text}
        </p>
      ))}
    </>
  )
}

export default memo(TranscriptLines)
