import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteMeeting, getMeeting, listMeetings, saveMeeting } from '../api/meetingsApi'

export const meetingKeys = {
  all: ['meetings'] as const,
  detail: (id: string) => ['meetings', id] as const,
}

export function useMeetingsList() {
  return useQuery({ queryKey: meetingKeys.all, queryFn: listMeetings })
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: meetingKeys.detail(id),
    queryFn: () => getMeeting(id),
    enabled: Boolean(id),
  })
}

export function useSaveMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveMeeting,
    // Refetch the list so the new meeting shows up
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meetingKeys.all }),
  })
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meetingKeys.all }),
  })
}