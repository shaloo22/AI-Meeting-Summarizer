import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MeetingsPage from './MeetingsPage'
import { useDeleteMeeting, useMeetingsList } from '../hooks/useMeetings'

// We replace the real hooks, so no server or network is needed
vi.mock('../hooks/useMeetings')

type ListResult = ReturnType<typeof useMeetingsList>
type DeleteResult = ReturnType<typeof useDeleteMeeting>

const mutate = vi.fn()
const refetch = vi.fn()

function setList(partial: Record<string, unknown>) {
  vi.mocked(useMeetingsList).mockReturnValue({
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    isFetching: false,
    refetch,
    ...partial,
  } as unknown as ListResult)
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MeetingsPage />
    </MemoryRouter>,
  )
}

const meetings = [
  { _id: '1', title: 'Weekly sync', summary: 'We planned the launch.', createdAt: '2026-11-20T10:00:00Z' },
  { _id: '2', title: 'Budget review', summary: 'Costs are over by ten percent.', createdAt: '2026-11-21T10:00:00Z' },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useDeleteMeeting).mockReturnValue({
    mutate,
    isPending: false,
    isError: false,
    error: null,
    variables: undefined,
  } as unknown as DeleteResult)
})

describe('MeetingsPage', () => {
  it('shows a loading skeleton while data is loading', () => {
    setList({ isPending: true })
    const { container } = renderPage()

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByText('No meetings yet')).not.toBeInTheDocument()
  })

  it('shows the error and retries when the button is clicked', async () => {
    setList({ isError: true, error: new Error('Could not load meetings.') })
    renderPage()

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load meetings.')

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows an empty state with a link to record', () => {
    setList({ data: [] })
    renderPage()

    expect(screen.getByText('No meetings yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /record a meeting/i })).toHaveAttribute('href', '/')
  })

  it('lists saved meetings', () => {
    setList({ data: meetings })
    renderPage()

    expect(screen.getByText('2 saved meetings')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /weekly sync/i })).toHaveAttribute('href', '/meetings/1')
    expect(screen.getByText('Budget review')).toBeInTheDocument()
  })

  it('deletes a meeting only after the user confirms', async () => {
    setList({ data: meetings })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Delete Weekly sync' }))

    expect(confirm).toHaveBeenCalled()
    expect(mutate).toHaveBeenCalledWith('1')
  })

  it('does not delete when the user cancels', async () => {
    setList({ data: meetings })
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Delete Weekly sync' }))

    expect(mutate).not.toHaveBeenCalled()
  })
})