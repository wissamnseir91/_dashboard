import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Role } from '@/types'

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get<Role[]>('/roles')
      return data
    },
  })
}

interface RolePayload {
  name?: string
  permissions?: string[]
}

export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: RolePayload) => {
      const { data } = await api.post<Role>('/roles', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: RolePayload }) => {
      const { data } = await api.patch<Role>(`/roles/${id}`, payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/roles/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  })
}
