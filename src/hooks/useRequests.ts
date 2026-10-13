import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFilteredList } from '@/hooks/useFilteredList'
import { api } from '@/lib/api'
import type { CampaignBriefDetails, RequestType, ServiceRequest } from '@/types'

interface RequestsListParams {
  page?: number
  per_page?: number
  filters?: Record<string, string | undefined>
  sort?: string
}

export function useRequests(params: RequestsListParams = {}) {
  return useFilteredList<ServiceRequest>('/requests', 'requests', params)
}

export function useBulkDeleteRequests() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: number[]) => {
      await api.delete('/requests', { data: { ids } })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  })
}

export function useRequest(id: number) {
  return useQuery({
    queryKey: ['requests', id],
    queryFn: async () => {
      const { data } = await api.get<ServiceRequest>(`/requests/${id}`)
      return data
    },
  })
}

interface CreateRequestPayload {
  title: string
  description?: string
  type?: RequestType
  type_details?: CampaignBriefDetails
  due_date?: string
}

export function useCreateRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateRequestPayload) => {
      const { data } = await api.post<ServiceRequest>('/requests', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

function useRequestAction<TPayload = void>(action: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload?: TPayload }) => {
      const { data } = await api.patch<ServiceRequest>(`/requests/${id}/${action}`, payload)
      return data
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['requests', id] })
    },
  })
}

export function useAssignRequest() {
  return useRequestAction<{ user_ids: number[] }>('assign')
}

export function useRejectRequest() {
  return useRequestAction<{ reason: string }>('reject')
}

export function useCancelRequest() {
  return useRequestAction('cancel')
}

export function useUpdateRequestStatus() {
  return useRequestAction<{ status: 'resolved'; remarks?: string }>('status')
}

/**
 * Posts a discussion update — a message, one or more files, or both — as
 * one request, so the composer's "Post Update" button doesn't force a
 * choice between typing a note and attaching a file.
 */
export function useAddRequestComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, body, files }: { requestId: number; body: string; files: File[] }) => {
      const formData = new FormData()
      if (body.trim()) formData.append('body', body)
      files.forEach((file) => formData.append('files[]', file))
      const { data } = await api.post(`/requests/${requestId}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: (_data, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['requests', requestId] })
    },
  })
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ requestId, attachmentId }: { requestId: number; attachmentId: number }) => {
      await api.delete(`/requests/${requestId}/attachments/${attachmentId}`)
    },
    onSuccess: (_data, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['requests', requestId] })
    },
  })
}

export async function fetchMentionableUsers(requestId: number, search: string) {
  const { data } = await api.get<{ id: number; name: string }[]>(`/requests/${requestId}/mentionable-users`, {
    params: { search: search || undefined },
  })
  return data
}

export async function downloadAttachment(requestId: number, attachmentId: number, filename: string) {
  const response = await api.get(`/requests/${requestId}/attachments/${attachmentId}/download`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
