import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Position } from '@/types'

export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data } = await api.get<Position[]>('/positions')
      return data
    },
  })
}

interface PositionPayload {
  name: string
  code: string
}

export function useCreatePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: PositionPayload) => {
      const { data } = await api.post<Position>('/positions', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['positions'] }),
  })
}

export function useUpdatePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<PositionPayload> }) => {
      const { data } = await api.patch<Position>(`/positions/${id}`, payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['positions'] }),
  })
}

export function useDeletePosition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/positions/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['positions'] }),
  })
}
