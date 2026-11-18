import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SummaryCard from './SummaryCard'

describe('SummaryCard', () => {
  it('shows the summary and the action items', () => {
    render(
      <SummaryCard
        data={{
          summary: 'We agreed on the launch date.',
          actionItems: [{ owner: 'Rahul', task: 'Send the report' }],
        }}
      />,
    )

    expect(screen.getByText('We agreed on the launch date.')).toBeInTheDocument()
    expect(screen.getByText('Rahul:')).toBeInTheDocument()
    expect(screen.getByText(/Send the report/)).toBeInTheDocument()
  })

  it('shows fallback text when there is nothing to show', () => {
    render(<SummaryCard data={{ summary: '', actionItems: [] }} />)

    expect(screen.getByText('Not enough content to summarize.')).toBeInTheDocument()
    expect(screen.getByText('No action items found.')).toBeInTheDocument()
  })
})