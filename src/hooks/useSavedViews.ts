import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SavedView, SavedViewModule } from '@/types'

export function useSavedViews(module: SavedViewModule) {
  return useQuery({
    queryKey: ['saved-views', module],
    queryFn: async () => {
      const { data } = await api.get<SavedView[]>('/saved-views', { params: { module } })
      return data
    },
  })
}

interface CreateSavedViewPayload {
  name: string
  filters?: Record<string, string | undefined>
  sort?: string
}

export function useCreateSavedView(module: SavedViewModule) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateSavedViewPayload) => {
      const { data } = await api.post<SavedView>('/saved-views', { module, ...payload })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-views', module] }),
  })
}

interface UpdateSavedViewPayload {
  id: number
  name?: string
  filters?: Record<string, string | undefined>
  sort?: string
}

export function useUpdateSavedView(module: SavedViewModule) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateSavedViewPayload) => {
      const { data } = await api.patch<SavedView>(`/saved-views/${id}`, payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-views', module] }),
  })
}

export function useDeleteSavedView(module: SavedViewModule) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/saved-views/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-views', module] }),
  })
}

export function useReorderSavedViews(module: SavedViewModule) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderedIds: number[]) => {
      await api.post('/saved-views/reorder', { module, ordered_ids: orderedIds })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-views', module] }),
  })
}
